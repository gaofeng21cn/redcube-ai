import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const RESPONSE_SCHEMA = 'opl-package-app-contribution-response.v1';

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isWithin(rootDir, targetPath) {
  const rel = path.relative(rootDir, targetPath);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolveWorkspaceRoot(input) {
  const candidate = [
    input?.workspace_root,
    input?.workspaceRoot,
    process.env.OPL_PROFILE_WORKSPACE,
  ].find((value) => typeof value === 'string' && value.trim().length > 0);
  if (!candidate) return null;
  const resolved = path.resolve(candidate.trim());
  if (!fs.existsSync(resolved)) return null;
  try {
    return fs.statSync(resolved).isDirectory() ? fs.realpathSync(resolved) : null;
  } catch {
    return null;
  }
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
  const indexData = fs.existsSync(indexPath) ? readJsonSafe(indexPath) : null;
  const workspaceData = fs.existsSync(workspacePath) ? readJsonSafe(workspacePath) : null;
  const projectId = selectProjectId(input, indexData);

  const stages = [];
  if (Array.isArray(workspaceData?.stages)) {
    for (const stage of workspaceData.stages) {
      if (stage && typeof stage === 'object') stages.push(stage);
    }
  }

  const runtimeStateDir = path.join(workspaceRoot, 'runtime-state');
  if (fs.existsSync(runtimeStateDir) && isWithin(workspaceRoot, fs.realpathSync(runtimeStateDir))) {
    for (const entry of fs.readdirSync(runtimeStateDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const full = path.join(runtimeStateDir, entry.name);
      const doc = readJsonSafe(full);
      if (doc && typeof doc === 'object' && Array.isArray(doc.stages)) {
        for (const stage of doc.stages) {
          if (stage && typeof stage === 'object') stages.push(stage);
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
  const indexData = fs.existsSync(indexPath) ? readJsonSafe(indexPath) : null;
  const projectId = selectProjectId(input, indexData);
  const artifacts = [];

  for (const folderName of ['artifacts', 'deliverables']) {
    const dirPath = path.join(workspaceRoot, folderName);
    if (!fs.existsSync(dirPath)) continue;
    let realDir;
    try {
      realDir = fs.realpathSync(dirPath);
    } catch {
      continue;
    }
    if (!isWithin(workspaceRoot, realDir) || !fs.statSync(realDir).isDirectory()) continue;
    for (const entry of fs.readdirSync(realDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const relPath = path.posix.join(folderName, entry.name);
      artifacts.push({
        name: entry.name,
        path: relPath,
        kind: entry.isDirectory() ? 'directory' : 'file',
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
  const workspaceRoot = resolveWorkspaceRoot(input);
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
