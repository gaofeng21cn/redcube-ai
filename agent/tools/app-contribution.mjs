import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const RESPONSE_SCHEMA = 'opl-package-app-contribution-response.v1';
const REQUEST_SCHEMA = 'opl-package-app-contribution-request.v1';
const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

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
  const rawExplicit = input.workspace_root ?? input.workspaceRoot ?? input.workspace_path;
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

function selectProject(workspaceRoot, input) {
  const index = readJsonSafe(path.join(workspaceRoot, 'workspace_index.json'), workspaceRoot);
  const indexed = index?.projects;
  const identity = input.work_item_identity;
  const requestedIds = [input.project_id, input.projectId, identity?.domain_work_item_id]
    .filter((id) => id !== undefined && id !== null);
  const projectId = requestedIds[0];
  const identityWorkspace = identity?.workspace_path;
  if (requestedIds.some((id) => typeof id !== 'string' || !PROJECT_ID.test(id) || id !== projectId)
      || (identity && (identity.identity_state !== 'resolved' || identity.agent_id !== 'rca'
        || (identityWorkspace && resolveRealDirectory(identityWorkspace) !== workspaceRoot)))) {
    return { state: 'unavailable', reason: 'The requested visual task conflicts with the selected workspace.' };
  }

  // Keep direct reads usable in single-project workspaces without a central index.
  if (indexed === undefined && !projectId) return { project: null, root: workspaceRoot, projects: [] };
  const rows = Array.isArray(indexed)
    ? indexed
    : Object.entries(indexed || {}).map(([project_id, row]) => ({ ...row, project_id }));
  const projects = rows.filter((row) => typeof row?.project_id === 'string' && PROJECT_ID.test(row.project_id));
  const matching = projectId
    ? projects.filter((row) => row.project_id === projectId)
    : projects;
  if (!projectId && matching.length > 1) {
    return {
      state: 'input_required',
      reason: 'Select a visual project in this workspace.',
      input_schema: {
        type: 'object',
        required: ['project_id'],
        properties: {
          project_id: { type: 'string', title: 'Visual project', enum: matching.map((row) => row.project_id) },
        },
      },
    };
  }

  const project = matching.length === 1 ? matching[0] : null;
  if (!project) {
    return { state: 'unavailable', reason: 'The visual project is not registered in this workspace.' };
  }
  const projectRef = project.project_root;
  const declaredRoot = typeof projectRef === 'string' && !path.isAbsolute(projectRef) && !hasTraversalSegment(projectRef)
    ? path.resolve(workspaceRoot, projectRef)
    : null;
  const root = declaredRoot ? resolveContainedPath(workspaceRoot, declaredRoot) : null;
  const requestedRoot = input.work_item_root ?? identity?.work_item_root;
  if (!root || root === workspaceRoot || root !== declaredRoot || !resolveRealDirectory(root)
      || (requestedRoot && resolveRealDirectory(requestedRoot) !== root)) {
    return { state: 'unavailable', reason: 'The visual project directory does not match the workspace index.' };
  }
  return { project, root, projects: projects.map((row) => row.project_id) };
}

function collectStatus(workspaceRoot, { project, root, projects }) {
  const workspaceData = readJsonSafe(path.join(root, 'workspace.json'), root);

  const stages = [];
  if (Array.isArray(workspaceData?.stages)) {
    for (const stage of workspaceData.stages) {
      if (stage && typeof stage === 'object') stages.push(stage);
    }
  }

  const runtimeStateDir = path.join(root, 'runtime-state');
  const safeRuntimeStateDir = resolveContainedPath(root, runtimeStateDir);
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
        const doc = readJsonSafe(full, root);
        if (doc && typeof doc === 'object' && Array.isArray(doc.stages)) {
          for (const stage of doc.stages) {
            if (stage && typeof stage === 'object') stages.push(stage);
          }
        }
      }
    }
  }

  const pointerRef = project?.current_stage_pointer_ref;
  const pointer = typeof pointerRef === 'string' && !path.isAbsolute(pointerRef) && !hasTraversalSegment(pointerRef)
    ? readJsonSafe(path.resolve(workspaceRoot, pointerRef), root)
    : null;
  const currentStage = pointer?.surface_kind === 'opl_current_stage_pointer' && pointer.project_id === project.project_id
    ? pointer.current_stage
    : null;
  const stageId = currentStage?.stage_id ?? project?.current_stage_id;
  if (typeof stageId === 'string' && !stages.some((stage) => stage.stage_id === stageId)) {
    stages.push({ stage_id: stageId, status: currentStage?.status ?? project?.current_stage_status });
  }

  const status = project?.business_status ?? project?.lifecycle?.status ?? workspaceData?.status;
  return {
    view: 'progress',
    project_id: project?.project_id ?? null,
    projects,
    stages,
    workspace_status: status ?? (stages.length || workspaceData || project ? 'active' : 'empty'),
  };
}

function readRegisteredArtifacts(workspaceRoot, projectRoot, project) {
  const projection = readJsonSafe(path.join(projectRoot, 'control/opl/artifact_lifecycle/output_lifecycle.json'), projectRoot);
  if (!projection) return [];
  if (projection.surface_kind !== 'opl_workspace_output_lifecycle'
      || projection.project_id !== project.project_id
      || typeof projection.project_root !== 'string'
      || resolveContainedPath(workspaceRoot, path.resolve(workspaceRoot, projection.project_root)) !== projectRoot) {
    return null;
  }
  const artifacts = new Map();
  for (const source of [projection.artifacts, projection.current_refs]) {
    if (!Array.isArray(source)) continue;
    for (const entry of source) {
      const ref = entry?.ref;
      if (typeof ref !== 'string' || path.isAbsolute(ref) || hasTraversalSegment(ref)) continue;
      const filePath = path.resolve(workspaceRoot, ref);
      if (filePath === projectRoot || !isWithin(projectRoot, filePath)) continue;
      const realPath = resolveContainedPath(projectRoot, filePath);
      if (!realPath) continue;
      artifacts.set(ref, {
        id: ref,
        name: path.basename(ref),
        path: realPath,
        source_ref: ref,
        kind: entry.kind ?? 'file',
        status: entry.exists === false ? 'unavailable' : 'recorded',
      });
    }
  }
  return [...artifacts.values()];
}

function collectLocalArtifacts(workspaceRoot) {
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

  return artifacts;
}

function readResponse(ref, result) {
  return {
    // Preserve the existing direct-read fields alongside the contribution result.
    ...result,
    schema_version: RESPONSE_SCHEMA,
    ok: true,
    package_id: 'rca',
    operation: 'read',
    ref,
    result,
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

  if (envelope.schema_version !== REQUEST_SCHEMA || envelope.package_id !== 'rca') {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'invalid_request',
      package_id: 'rca',
      error: { code: 'INVALID_REQUEST', message: 'Contribution request schema or package identity is invalid.' },
    };
  }

  if (typeof envelope.operation !== 'string' || envelope.operation.trim().length === 0) {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'invalid_request',
      package_id: 'rca',
      error: { code: 'INVALID_REQUEST', message: 'Contribution request requires a non-empty string operation.' },
    };
  }

  const operation = envelope.operation.trim();
  if (operation === 'execute') {
    const actionId = typeof envelope.action_id === 'string' ? envelope.action_id : null;
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unsupported_action',
      package_id: 'rca',
      operation,
      ref: typeof envelope.ref === 'string' ? envelope.ref.trim() : actionId,
      action_id: actionId,
      error: { code: 'UNSUPPORTED_ACTION', message: 'RCA declarative views are read-only.' },
    };
  }

  if (operation !== 'read') {
    return {
      schema_version: RESPONSE_SCHEMA,
      ok: false,
      state: 'unsupported_operation',
      package_id: 'rca',
      operation,
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
      operation,
      ref,
      error: { code: 'UNSUPPORTED_REF', message: `Unsupported RCA contribution ref '${ref}'.` },
    };
  }

  const input = envelope.input && typeof envelope.input === 'object' && !Array.isArray(envelope.input)
    ? envelope.input
    : {};
  const resolution = resolveWorkspaceRoot(input);
  if (!resolution.ok) {
    const result = {
      state: 'unavailable',
      reason: resolution.reason,
      data: {
        view: ref.endsWith('#artifacts') ? 'artifacts' : 'progress',
        stages: [],
        artifacts: [],
      },
    };
    return { ...readResponse(ref, result), ok: false, error: { code: resolution.code, message: resolution.message } };
  }
  const workspaceRoot = resolution.workspaceRoot;
  if (!workspaceRoot) {
    return readResponse(ref, {
      state: 'unavailable',
      reason: 'workspace_not_configured',
      data: {
        view: ref.endsWith('#artifacts') ? 'artifacts' : 'progress',
        stages: [],
        artifacts: [],
      },
    });
  }

  const selected = selectProject(workspaceRoot, input);
  if (selected.state) return readResponse(ref, selected);

  const readArtifacts = ref.endsWith('#artifacts');
  let data;
  if (readArtifacts) {
    const artifacts = selected.project
      ? readRegisteredArtifacts(workspaceRoot, selected.root, selected.project)
      : collectLocalArtifacts(workspaceRoot);
    if (artifacts === null) {
      return readResponse(ref, {
        state: 'unavailable',
        reason: 'The artifact inventory belongs to a different project.',
      });
    }
    data = {
      view: 'artifacts',
      project_id: selected.project?.project_id ?? null,
      artifacts,
      items: artifacts,
    };
  } else {
    data = collectStatus(workspaceRoot, selected);
    if (selected.project) {
      data.items = [{
        id: selected.project.project_id,
        title: selected.project.title ?? selected.project.project_id,
        status: data.workspace_status,
        stages: data.stages,
      }];
    }
  }
  const available = readArtifacts ? data.artifacts.length > 0 : data.workspace_status !== 'empty';
  return readResponse(ref, {
    state: available ? 'ready' : 'empty',
    workspace_root: workspaceRoot,
    data,
  });
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
    process.exitCode = 2;
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
  const isReadOperation =
    Boolean(parsed)
    && typeof parsed === 'object'
    && !Array.isArray(parsed)
    && typeof parsed.operation === 'string'
    && parsed.operation.trim() === 'read';
  if (response.ok === false && !isReadOperation) {
    process.exitCode = 2;
  }
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

const isMain = import.meta.main
  ?? (Boolean(process.argv[1]) && fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url)));

if (isMain) {
  await main();
}
