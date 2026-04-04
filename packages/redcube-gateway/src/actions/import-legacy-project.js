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

import { buildTopicRecord } from '@redcube/overlay-xiaohongshu';
import {
  getTopicPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';

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
    brief: {
      schema_version: 1,
      topic_id: topicId,
      imported_from: 'legacy_project_inputs',
      series_toc_markdown: seriesToc,
      style_guide_markdown: styleGuide,
      raw_materials: rawMaterials,
    },
    storyline: {
      schema_version: 1,
      topic_id: topicId,
      imported_from: 'legacy_storyline_logic',
      storyline_markdown: storyline,
    },
    legacyProject: {
      schema_version: 1,
      topic_id: topicId,
      legacy_project_dir: projectDir,
      inputs_dir: path.join(projectDir, 'inputs'),
      raw_materials: rawMaterials,
      output_folders: outputFolders,
    },
    report: {
      schema_version: 1,
      status: 'pass',
      mode: 'legacy_to_workspace',
      topic_id: topicId,
      checks: {
        series_toc_present: Boolean(seriesToc.trim()),
        storyline_present: Boolean(storyline.trim()),
        raw_material_count: rawMaterials.length,
      },
      imported_output_folders: outputFolders,
    },
  };
}

export async function importLegacyProject({
  rootDir,
  workspaceRoot,
  project,
}) {
  const projectId = String(project || '').trim();
  const legacyProjectDir = path.join(String(rootDir || '').trim(), 'projects', projectId);
  const legacyInputsDir = path.join(legacyProjectDir, 'inputs');

  if (!projectId) {
    throw new Error('project 不能为空');
  }
  if (!existsSync(legacyInputsDir)) {
    throw new Error(`legacy project 不存在: ${legacyProjectDir}`);
  }

  ensureWorkspaceContract(workspaceRoot);
  const topicPaths = getTopicPaths(workspaceRoot, projectId);
  if (existsSync(topicPaths.topicDir) && readdirSync(topicPaths.topicDir).length > 0) {
    throw new Error(`目标 topic 已存在: ${projectId}`);
  }

  mkdirSync(topicPaths.topicDir, { recursive: true });
  mkdirSync(topicPaths.canonicalDir, { recursive: true });
  cpSync(legacyInputsDir, topicPaths.inputsDir, { recursive: true });

  const topic = buildTopicRecord({
    topicId: projectId,
    title: projectId,
  });
  const canonicalArtifacts = buildImportedCanonicalArtifacts({
    projectDir: legacyProjectDir,
    topicId: projectId,
  });
  writeFileSync(topicPaths.topicFile, JSON.stringify(topic, null, 2), 'utf-8');
  writeFileSync(
    path.join(topicPaths.canonicalDir, 'brief.json'),
    JSON.stringify(canonicalArtifacts.brief, null, 2),
    'utf-8',
  );
  writeFileSync(
    path.join(topicPaths.canonicalDir, 'storyline.json'),
    JSON.stringify(canonicalArtifacts.storyline, null, 2),
    'utf-8',
  );
  writeFileSync(
    path.join(topicPaths.canonicalDir, 'legacy-project.json'),
    JSON.stringify(canonicalArtifacts.legacyProject, null, 2),
    'utf-8',
  );
  writeFileSync(
    path.join(topicPaths.canonicalDir, 'legacy-import-report.json'),
    JSON.stringify(canonicalArtifacts.report, null, 2),
    'utf-8',
  );

  return {
    ok: true,
    mode: 'legacy_to_workspace',
    project: projectId,
    topicFile: topicPaths.topicFile,
    importedInputsDir: topicPaths.inputsDir,
  };
}
