import path from 'node:path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import { getDefaultOverlayCatalog } from '@redcube/overlay-registry';
import {
  getTopicPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { intakeSource } from '@redcube/runtime';

function ensureWorkspaceContract(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  mkdirSync(contract.workspaceRoot, { recursive: true });

  if (!existsSync(contract.workspaceFile)) {
    writeFileSync(
      contract.workspaceFile,
      JSON.stringify({
        workspace_version: 1,
        mode: 'agent_first_runtime',
      }, null, 2),
      'utf-8',
    );
  }

  return contract;
}

function readOptionalText(file) {
  if (!existsSync(file)) return '';
  return readFileSync(file, 'utf-8');
}

function walkFiles(dir, relBase = dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, relBase));
      continue;
    }
    files.push({
      relative_path: path.relative(relBase, full),
      size_bytes: statSync(full).size,
    });
  }
  return files.sort((a, b) => a.relative_path.localeCompare(b.relative_path, 'zh-Hans-CN'));
}

function listOutputFolders(projectDir) {
  const candidates = [
    path.join(projectDir, 'outputs_pi'),
    path.join(projectDir, 'outputs'),
  ];
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }
  return [];
}

function buildImportedCanonicalArtifacts({ projectDir, topicId }) {
  const inputsDir = path.join(projectDir, 'inputs');
  const rawMaterialsDir = path.join(inputsDir, 'raw_materials');
  const seriesToc = readOptionalText(path.join(inputsDir, 'series_toc.md'));
  const styleGuide = readOptionalText(path.join(inputsDir, 'style_guide.md'));
  const storyline = readOptionalText(path.join(inputsDir, 'storyline_logic.md'));
  const rawMaterials = walkFiles(rawMaterialsDir);
  const outputFolders = listOutputFolders(projectDir);

  return {
    intakeBrief: [
      seriesToc ? `# legacy_series_toc\n${seriesToc}` : '',
      styleGuide ? `# legacy_style_guide\n${styleGuide}` : '',
      storyline ? `# legacy_storyline_logic\n${storyline}` : '',
    ].filter(Boolean).join('\n\n'),
    legacyProject: {
      schema_version: 1,
      topic_id: topicId,
      legacy_project_dir: projectDir,
      inputs_dir: path.join(projectDir, 'inputs'),
      raw_materials: rawMaterials,
      output_folders: outputFolders,
    },
  };
}

function buildTopicRecordFromCatalog({ topicId, title, overlayId, descriptor }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: overlayId,
    deliverable_kind: descriptor.deliverable_kind,
    status: 'draft',
    routes: [...descriptor.route_sequence],
  };
}

export async function importLegacyProject({
  rootDir,
  workspaceRoot,
  project,
  overlay,
}) {
  const projectId = String(project || '').trim();
  const overlayId = String(overlay || '').trim();
  const legacyProjectDir = path.join(String(rootDir || '').trim(), 'projects', projectId);
  const legacyInputsDir = path.join(legacyProjectDir, 'inputs');

  if (!projectId) {
    throw new Error('project 不能为空');
  }
  if (!overlayId) {
    throw new Error('overlay 不能为空');
  }
  if (!existsSync(legacyInputsDir)) {
    throw new Error(`legacy project 不存在: ${legacyProjectDir}`);
  }

  const overlayCatalog = getDefaultOverlayCatalog();
  const descriptor = overlayCatalog.overlays.find((item) => item.overlay_id === overlayId);
  if (!descriptor) {
    throw new Error(`Unknown overlay: ${overlayId}`);
  }

  ensureWorkspaceContract(workspaceRoot);
  const topicPaths = getTopicPaths(workspaceRoot, projectId);
  if (existsSync(topicPaths.topicDir) && readdirSync(topicPaths.topicDir).length > 0) {
    throw new Error(`目标 topic 已存在: ${projectId}`);
  }

  mkdirSync(topicPaths.topicDir, { recursive: true });
  mkdirSync(topicPaths.canonicalDir, { recursive: true });
  cpSync(legacyInputsDir, topicPaths.inputsDir, { recursive: true });

  const topic = buildTopicRecordFromCatalog({
    topicId: projectId,
    title: projectId,
    overlayId,
    descriptor,
  });
  const canonicalArtifacts = buildImportedCanonicalArtifacts({
    projectDir: legacyProjectDir,
    topicId: projectId,
  });
  writeFileSync(topicPaths.topicFile, JSON.stringify(topic, null, 2), 'utf-8');
  writeFileSync(
    path.join(topicPaths.canonicalDir, 'legacy-project.json'),
    JSON.stringify(canonicalArtifacts.legacyProject, null, 2),
    'utf-8',
  );
  const sourceFiles = canonicalArtifacts.legacyProject.raw_materials
    .map((item) => path.join(topicPaths.inputsDir, 'raw_materials', item.relative_path));
  const intake = await intakeSource({
    workspaceRoot,
    topicId: projectId,
    title: projectId,
    brief: canonicalArtifacts.intakeBrief,
    sourceFiles,
    modeHint: 'legacy_import',
  });

  return {
    ok: intake.ok,
    surface_kind: 'legacy_import',
    recommended_action: intake.audit?.status !== 'pass'
      ? 'resolve_source_blocks'
      : (intake.augmentation?.status === 'required' || intake.augmentation?.status === 'recommended')
        ? 'prepare_source_augmentation'
        : 'create_deliverable',
    summary: {
      project: projectId,
      overlay: overlayId,
      audit_status: intake.audit?.status || null,
    },
    mode: 'legacy_to_workspace',
    project: projectId,
    topicFile: topicPaths.topicFile,
    importedInputsDir: topicPaths.inputsDir,
    artifactFiles: intake.artifactFiles,
    audit: intake.audit,
  };
}
