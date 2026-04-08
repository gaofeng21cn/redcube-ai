import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

test('public docs surface does not retain a root guides entrypoint', () => {
  assert.equal(existsSync(path.join(repoRoot, 'guides', 'README.md')), false);

  const rootReadme = readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');

  assert.equal(rootReadme.includes('](guides/'), false);
  assert.equal(rootReadme.includes('](./guides/'), false);
  assert.equal(docsReadme.includes('](guides/'), false);
  assert.equal(docsReadme.includes('](./guides/'), false);
});

test('public docs describe Deep Research as Source Readiness enhancement on an auto-first 5-step line', () => {
  const rootReadme = readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
  const rootReadmeZh = readFileSync(path.join(repoRoot, 'README.zh-CN.md'), 'utf-8');
  const quickstart = readFileSync(path.join(repoRoot, 'docs', 'human_quickstart.md'), 'utf-8');

  assert.equal(rootReadme.includes('`Deep Research` belongs to `Source Readiness`'), true);
  assert.equal(rootReadmeZh.includes('`Deep Research` 属于 `Source Readiness`'), true);
  assert.equal(rootReadme.includes('`source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`'), true);
  assert.equal(rootReadmeZh.includes('`source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`'), true);
  assert.equal(quickstart.includes('`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`'), true);
  assert.equal(quickstart.includes('可以在任意大步骤边界介入'), true);
  assert.equal(quickstart.includes('循环式 Review Gate'), true);
});

test('operator docs publish workspace structure and source augmentation executor contract', () => {
  const quickstart = readFileSync(path.join(repoRoot, 'docs', 'human_quickstart.md'), 'utf-8');
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');
  const docsReadmeZh = readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf-8');
  const executorContract = readFileSync(
    path.join(repoRoot, 'docs', 'source_augmentation_executor_contract.md'),
    'utf-8',
  );

  assert.equal(quickstart.includes('`redcube.workspace.json`'), true);
  assert.equal(quickstart.includes('`topics/<topic-id>/canonical/`'), true);
  assert.equal(quickstart.includes('`source intake -> source augment -> source execute-augmentation`'), true);
  assert.equal(quickstart.includes('`source prepare-augmentation-result -> source write-augmentation-result`'), true);
  assert.equal(quickstart.includes('Codex 的一句话启动指令'), true);

  assert.equal(docsReadme.includes('source_augmentation_executor_contract.md'), true);
  assert.equal(docsReadmeZh.includes('source_augmentation_executor_contract.md'), true);

  assert.equal(executorContract.includes('`REDCUBE_SOURCE_AUGMENT_CMD`'), true);
  assert.equal(executorContract.includes('`REDCUBE_SOURCE_AUGMENT_RESULT_FILE`'), true);
  assert.equal(executorContract.includes('`result_file`'), true);
  assert.equal(executorContract.includes('`source prepare-augmentation-result`'), true);
  assert.equal(executorContract.includes('`source write-augmentation-result`'), true);
  assert.equal(executorContract.includes('`shared_source_readiness_augmentation`'), true);
  assert.equal(executorContract.includes('`shared_source_readiness_augmentation_result`'), true);
  assert.equal(executorContract.includes('request contract invalid'), true);
  assert.equal(executorContract.includes('result contract invalid'), true);
});
