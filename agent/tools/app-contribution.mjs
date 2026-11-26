import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const RESPONSE_SCHEMA = 'opl-package-app-contribution-response.v1';

function isWithin(rootDir, targetPath) {
  const rel = path.relative(rootDir, targetPath);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

function resolveContainedPath(workspaceRoot, targetPath) {
  if (!fs.existsSync(targetPath)) return null;
  let realTarget;
  try {
    realTarget = fs.realpathSync(targetPath);
  } catch {
    return null;
  }
  return isWithin(workspaceRoot, realTarget) ? realTarget : null;
}

function readJsonSafe(filePath, workspaceRoot) {
  const safePath = resolveContainedPath(workspaceRoot, filePath);
  if (!safePath) return null;
  try {
    if (!fs.statSync(safePath).isFile()) return null;
    return JSON.parse(fs.readFileSync(safePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasTraversalSegment(rawPath) {
  return rawPath.split(/[\\/]+/).includes('..');
}

function resolveRealDirectory(dirPath) {
  if (typeof dirPath !== 'string') return null;
  const trimmed = dirPath.trim();
  if (!trimmed || trimmed.includes('\0')) return null;
  const resolved = path.resolve(trimmed);
  if (!fs.existsSync(resolved)) return null;
  try {
    const real = fs.realpathSync(resolved);
    return fs.statSync(real).isDirectory() ? real : null;
  } catch {
    return null;
  }
}

function resolveWorkspaceRoot(input) {
  const rawExplicit = input?.workspace_root !== undefined ? input.workspace_root : input?.workspaceRoot;
  const hasExplicitValue = rawExplicit !== undefined && rawExplicit !== null && !(typeof rawExplicit === 'string' && rawExplicit.trim().length === 0);
  const envWorkspace = typeof process.env.OPL_PROFILE_WORKSPACE === 'string' ? process.env.OPL_PROFILE_WORKSPACE.trim() : '';

  if (hasExplicitValue) {
    if (typeof rawExplicit !== 'string') {
      return {
        ok: false,
        reason: 'invalid_workspace_root',
        code: 'INVALID_WORKSPACE_ROOT',
        message: 'workspace_root must be an absolute path string.',
      };
    }
    const candidate = rawExplicit.trim();
    if (candidate.includes('\0') || !path.isAbsolute(candidate) || hasTraversalSegment(candidate)) {
      return {
        ok: false,
        reason: 'invalid_workspace_root',
        code: 'INVALID_WORKSPACE_ROOT',
        message: 'workspace_root must be an absolute path without traversal segments.',
      };
    }
    const realCandidate = resolveRealDirectory(candidate);
    if (envWorkspace.length > 0) {
      const realEnvBase = hasTraversalSegment(envWorkspace) ? null : resolveRealDirectory(envWorkspace);
      if (!realEnvBase || !realCandidate || !isWithin(realEnvBase, realCandidate)) {
        return {
          ok: false,
          reason: 'workspace_root_outside_allowed_boundary',
          code: 'WORKSPACE_ROOT_OUTSIDE_ALLOWED_BOUNDARY',
          message: 'workspace_root resolves outside the allowed OPL_PROFILE_WORKSPACE boundary.',
        };
      }
    }
    if (!realCandidate) {
      return {
        ok: false,
        reason: 'workspace_not_found',
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Configured workspace_root does not exist or is not a directory.',
      };
    }
    return { ok: true, workspaceRoot: realCandidate };
  }

  if (envWorkspace.length > 0) {
    if (hasTraversalSegment(envWorkspace) || !path.isAbsolute(envWorkspace)) {
      return {
        ok: false,
        reason: 'invalid_workspace_root',
        code: 'INVALID_WORKSPACE_ROOT',
        message: 'OPL_PROFILE_WORKSPACE must be an absolute path without traversal segments.',
      };
    }
    const realEnvBase = resolveRealDirectory(envWorkspace);
    if (realEnvBase) {
      return { ok: true, workspaceRoot: realEnvBase };
    }
  }

  return { ok: true, workspaceRoot: null };
}

function selectProjectId(input, indexData) {
  const explicit = [input?.project_id, input?.projectId].find(
    (value) => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.trim()),
  );
  if (explicit) return explicit.trim();
  const projects = indexData?.projects;
  if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
    const keys = Object.keys(projects);
    if (keys.length === 1) return keys[0];
  }
  return null;
}

function collectStatus(workspaceRoot, input) {
  const indexPath = path.join(workspaceRoot, 'workspace_index.json');
  const workspacePath = path.join(workspaceRoot, 'workspace.json');
  const indexData = readJsonSafe(indexPath, workspaceRoot);
  const workspaceData = readJsonSafe(workspacePath, workspaceRoot);
  const projectId = selectProjectId(input, indexData);

  const stages = [];
  if (Array.isArray(workspaceData?.stages)) {
    for (const stage of workspaceData.stages) {
      if (stage && typeof stage === 'object') stages.push(stage);
    }
  }

  const runtimeStateDir = path.join(workspaceRoot, 'runtime-state');
  const safeRuntimeStateDir = resolveContainedPath(workspaceRoot, runtimeStateDir);
  if (safeRuntimeStateDir) {
    let isDir = false;
    try {
      isDir = fs.statSync(safeRuntimeStateDir).isDirectory();
    } catch {
      isDir = false;
    }
    if (isDir) {
      for (const entry of fs.readdirSync(safeRuntimeStateDir, { withFileTypes: true })) {
        if (!entry.name.endsWith('.json')) continue;
        const full = path.join(safeRuntimeStateDir, entry.name);
        const doc = readJsonSafe(full, workspaceRoot);
        if (doc && typeof doc === 'object' && Array.isArray(doc.stages)) {
          for (const stage of doc.stages) {
            if (stage && typeof stage === 'object') stages.push(stage);
          }
        }
      }
    }
  }

  const projects =
    indexData?.projects && typeof indexData.projects === 'object' && !Array.isArray(indexData.projects)
      ? Object.keys(indexData.projects)
      : [];

  const hasData = stages.length > 0 || projects.length > 0 || workspaceData !== null;
  return {
    schema_version: RESPONSE_SCHEMA,
    ok: true,
    state: hasData ? 'ready' : 'empty',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    workspace_root: workspaceRoot,
    data: {
      view: 'progress',
      project_id: projectId,
      projects,
      stages,
      workspace_status: workspaceData?.status ?? (hasData ? 'active' : 'empty'),
    },
  };
}

function collectArtifacts(workspaceRoot, input) {
  const indexPath = path.join(workspaceRoot, 'workspace_index.json');
  const indexData = readJsonSafe(indexPath, workspaceRoot);
  const projectId = selectProjectId(input, indexData);
  const artifacts = [];

  for (const folderName of ['artifacts', 'deliverables']) {
    const dirPath = path.join(workspaceRoot, folderName);
    const safeDir = resolveContainedPath(workspaceRoot, dirPath);
    if (!safeDir) continue;
    let isDir = false;
    try {
      isDir = fs.statSync(safeDir).isDirectory();
    } catch {
      isDir = false;
    }
    if (!isDir) continue;
    for (const entry of fs.readdirSync(safeDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const entryPath = path.join(safeDir, entry.name);
      const realEntryPath = resolveContainedPath(workspaceRoot, entryPath);
      if (!realEntryPath) continue;
      let stat;
      try {
        stat = fs.statSync(realEntryPath);
      } catch {
        continue;
      }
      const relPath = path.posix.join(folderName, entry.name);
      artifacts.push({
        name: entry.name,
        path: relPath,
        kind: stat.isDirectory() ? 'directory' : 'file',
      });
    }
  }

  return {
    schema_version: RESPONSE_SCHEMA,
    ok: true,
    state: artifacts.length > 0 ? 'ready' : 'empty',
    package_id: 'rca',
    ref: 'rca.workspace.v1#artifacts',
    workspace_root: workspaceRoot,
    data: {
      view: 'artifacts',
      project_id: projectId,
      artifacts,
    },
  };
}

export function handleContributionRequest(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'invalid_request',
      package_id: 'rca',
      error: { code: 'INVALID_REQUEST', message: 'Contribution request must be a JSON object.' },
    };
  }

  const operation = typeof envelope.operation === 'string' ? envelope.operation : 'read';
  if (operation === 'execute') {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unsupported_action',
      package_id: 'rca',
      action_id: typeof envelope.action_id === 'string' ? envelope.action_id : null,
      error: { code: 'UNSUPPORTED_ACTION', message: 'RCA declarative views are read-only.' },
    };
  }

  if (operation !== 'read') {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unsupported_operation',
      package_id: 'rca',
      error: { code: 'UNSUPPORTED_OPERATION', message: `Unsupported operation '${operation}'.` },
    };
  }

  const ref = typeof envelope.ref === 'string' ? envelope.ref.trim() : '';
  if (ref !== 'rca.workspace.v1#status' && ref !== 'rca.workspace.v1#artifacts') {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unsupported_ref',
      package_id: 'rca',
      ref,
      error: { code: 'UNSUPPORTED_REF', message: `Unsupported RCA contribution ref '${ref}'.` },
    };
  }

  const input = envelope.input && typeof envelope.input === 'object' && !Array.isArray(envelope.input)
    ? envelope.input
    : {};
  const resolution = resolveWorkspaceRoot(input);
  if (!resolution.ok) {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unavailable',
      package_id: 'rca',
      ref,
      reason: resolution.reason,
      error: { code: resolution.code, message: resolution.message },
      data: {
        view: ref.endsWith('#artifacts') ? 'artifacts' : 'progress',
        stages: [],
        artifacts: [],
      },
    };
  }
  const workspaceRoot = resolution.workspaceRoot;
  if (!workspaceRoot) {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: true,
      state: 'unavailable',
      package_id: 'rca',
      ref,
      reason: 'workspace_not_configured',
      data: {
        view: ref.endsWith('#artifacts') ? 'artifacts' : 'progress',
        stages: [],
        artifacts: [],
      },
    };
  }

  return ref.endsWith('#artifacts')
    ? collectArtifacts(workspaceRoot, input)
    : collectStatus(workspaceRoot, input);
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
  let parsed;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.stdout.write(`${JSON.stringify({
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'invalid_request',
      package_id: 'rca',
      error: { code: 'INVALID_JSON', message: 'Contribution stdin payload is not valid JSON.' },
    })}\n`);
    return;
  }
  const response = handleContributionRequest(parsed);
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

const isMain = import.meta.main
  ?? (Boolean(process.argv[1]) && fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url)));

if (isMain) {
  await main();
}
