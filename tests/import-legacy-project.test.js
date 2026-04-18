import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';

import { importLegacyProject } from '../packages/redcube-gateway/src/index.js';

function createLegacyProjectFixture() {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-legacy-root-'));
  const projectDir = path.join(rootDir, 'projects', 'topic-a');
  const inputsDir = path.join(projectDir, 'inputs');
  const rawMaterialsDir = path.join(inputsDir, 'raw_materials');
  const outputsDir = path.join(projectDir, 'outputs_pi', '01_胰岛素基础');
  mkdirSync(rawMaterialsDir, { recursive: true });
  mkdirSync(outputsDir, { recursive: true });
  writeFileSync(path.join(inputsDir, 'series_toc.md'), '# 系列目录\n\n## 1. 主题', 'utf-8');
  writeFileSync(path.join(inputsDir, 'style_guide.md'), '风格规范', 'utf-8');
  writeFileSync(path.join(inputsDir, 'storyline_logic.md'), '叙事逻辑', 'utf-8');
  writeFileSync(path.join(rawMaterialsDir, 'source.md'), '# 原始素材', 'utf-8');
  writeFileSync(path.join(outputsDir, 'content_plan.md'), '# 单篇策划', 'utf-8');

  return { rootDir, projectDir, inputsDir, rawMaterialsDir, outputsDir };
}

test('importLegacyProject copies legacy project inputs into canonical workspace topic', async () => {
  const { rootDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));

  const result = await importLegacyProject({
    rootDir,
    workspaceRoot,
    project: 'topic-a',
    overlay: 'xiaohongshu',
  });

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'historical_intake_import');
  assert.equal(result.recommended_action, 'create_deliverable');
  assert.equal(result.summary.project, 'topic-a');
  assert.equal(result.summary.audit_status, 'pass');
  assert.equal(result.mode, 'historical_project_to_workspace');
  assert.equal(result.project, 'topic-a');
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'inputs', 'raw_materials', 'source.md')),
    true,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-brief.json')),
    true,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-index.json')),
    true,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'extracted-materials.json')),
    true,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-audit.json')),
    true,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'legacy-project.json')),
    true,
  );
  assert.equal(
    JSON.parse(readFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'topic.json'), 'utf-8')).topic_id,
    'topic-a',
  );
  assert.equal(
    JSON.parse(readFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-audit.json'), 'utf-8')).status,
    'pass',
  );
  assert.equal(
    JSON.parse(readFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), 'utf-8')).workspace_version,
    1,
  );
});

test('importLegacyProject is one-way and does not mutate legacy project tree', async () => {
  const { rootDir, inputsDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));
  const beforeEntries = readdirSync(inputsDir).sort();

  await importLegacyProject({
    rootDir,
    workspaceRoot,
    project: 'topic-a',
    overlay: 'xiaohongshu',
  });

  assert.deepEqual(readdirSync(inputsDir).sort(), beforeEntries);
  assert.equal(
    readFileSync(path.join(inputsDir, 'raw_materials', 'source.md'), 'utf-8'),
    '# 原始素材',
  );
  assert.equal(
    existsSync(path.join(rootDir, 'projects', 'topic-a', 'deliverables')),
    false,
  );
  const legacyProject = JSON.parse(
    readFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'legacy-project.json'), 'utf-8'),
  );
  assert.deepEqual(legacyProject.output_folders, ['01_胰岛素基础']);
  assert.equal(legacyProject.raw_materials[0].relative_path, 'source.md');

  const sourceBrief = JSON.parse(
    readFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-brief.json'), 'utf-8'),
  );
  assert.equal(sourceBrief.input_mode, 'historical_intake_import');
});

test('importLegacyProject rejects missing legacy project inputs', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-legacy-root-'));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));

  await assert.rejects(
    () => importLegacyProject({
      rootDir,
      workspaceRoot,
      project: 'missing-topic',
      overlay: 'xiaohongshu',
    }),
    /legacy project 不存在/,
  );
});

test('importLegacyProject rejects missing overlay for registry-validated onboarding', async () => {
  const { rootDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));

  await assert.rejects(
    () => importLegacyProject({
      rootDir,
      workspaceRoot,
      project: 'topic-a',
    }),
    /overlay 不能为空/,
  );
});

test('importLegacyProject rejects importing into an existing canonical topic', async () => {
  const { rootDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));
  mkdirSync(path.join(workspaceRoot, 'topics', 'topic-a'), { recursive: true });
  writeFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'topic.json'), '{}', 'utf-8');

  await assert.rejects(
    () => importLegacyProject({
      rootDir,
      workspaceRoot,
      project: 'topic-a',
      overlay: 'xiaohongshu',
    }),
    /目标 topic 已存在: topic-a/,
  );
});

test('CLI import legacy-project proxies gateway importer', () => {
  const { rootDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'import',
      'legacy-project',
      '--root-dir',
      rootDir,
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'xiaohongshu',
      '--project',
      'topic-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'historical_intake_import');
  assert.equal(parsed.recommended_action, 'create_deliverable');
  assert.equal(parsed.mode, 'historical_project_to_workspace');
  assert.equal(parsed.project, 'topic-a');
});

test('CLI import legacy-project rejects missing overlay', () => {
  const { rootDir } = createLegacyProjectFixture();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));

  try {
    execFileSync(
      'node',
      [
        path.resolve('apps/redcube-cli/src/cli.js'),
        'import',
        'legacy-project',
        '--root-dir',
        rootDir,
        '--workspace-root',
        workspaceRoot,
        '--project',
        'topic-a',
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );
    assert.fail('expected CLI import legacy-project to reject missing overlay');
  } catch (error) {
    assert.match(error.stdout, /overlay 不能为空/);
  }
});
