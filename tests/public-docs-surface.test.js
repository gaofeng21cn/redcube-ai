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
  assert.equal(rootReadme.includes('`source research`'), true);
  assert.equal(rootReadmeZh.includes('`source research`'), true);
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
  assert.equal(quickstart.includes('`source research`'), true);
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

test('docs freeze lightweight product entry and OPL handoff without overclaiming runtime ownership', () => {
  const rootReadme = readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
  const rootReadmeZh = readFileSync(path.join(repoRoot, 'README.zh-CN.md'), 'utf-8');
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');
  const docsReadmeZh = readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf-8');
  const project = readFileSync(path.join(repoRoot, 'docs', 'project.md'), 'utf-8');
  const architecture = readFileSync(path.join(repoRoot, 'docs', 'architecture.md'), 'utf-8');
  const status = readFileSync(path.join(repoRoot, 'docs', 'status.md'), 'utf-8');
  const handoff = readFileSync(
    path.join(repoRoot, 'docs', 'references', 'lightweight_product_entry_and_opl_handoff.md'),
    'utf-8',
  );

  assert.equal(rootReadme.includes('`operator entry`, `agent entry`'), true);
  assert.equal(rootReadme.includes('repo-verified entry surfaces cover `operator entry`, `agent entry`, and one thin service-level `product entry`'), true);
  assert.equal(rootReadme.includes('`User -> RedCube Product Entry -> RedCube Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`'), true);
  assert.equal(rootReadme.includes('`User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`'), true);
  assert.equal(rootReadme.includes('`invokeProductEntry`, `invokeFederatedProductEntry`, and `getProductEntrySession`'), true);
  assert.equal(rootReadme.includes('`User -> RedCube Product Entry -> RedCube Gateway -> Hermes Kernel -> Domain Harness OS`'), false);
  assert.equal(rootReadme.includes('`User -> OPL Product Entry -> OPL Gateway -> Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway`'), false);
  assert.equal(rootReadmeZh.includes('`operator entry`、`agent entry`'), true);
  assert.equal(rootReadmeZh.includes('repo-verified 的 `product entry` service surface 已经包括 `invokeProductEntry`、`invokeFederatedProductEntry`、`getProductEntrySession`'), true);
  assert.equal(rootReadmeZh.includes('`User -> RedCube Product Entry -> RedCube Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`'), true);
  assert.equal(rootReadmeZh.includes('`User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`'), true);
  assert.equal(rootReadmeZh.includes('`User -> OPL Product Entry -> OPL Gateway -> Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway`'), false);

  assert.equal(docsReadme.includes('operator entry'), true);
  assert.equal(docsReadme.includes('RedCube product entry MVP'), true);
  assert.equal(docsReadme.includes('references/lightweight_product_entry_and_opl_handoff.md'), true);
  assert.equal(docsReadmeZh.includes('operator entry'), true);
  assert.equal(docsReadmeZh.includes('Managed Product Entry Hardening'), true);
  assert.equal(docsReadmeZh.includes('references/lightweight_product_entry_and_opl_handoff.md'), true);

  assert.equal(project.includes('repo-verified 的轻量 `product entry` service surface 也已落地'), true);
  assert.equal(architecture.includes('User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
  assert.equal(architecture.includes('invokeProductEntry'), true);
  assert.equal(architecture.includes('invokeFederatedProductEntry'), true);
  assert.equal(architecture.includes('getProductEntrySession'), true);
  assert.equal(architecture.includes('Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway'), false);
  assert.equal(architecture.includes('target_domain_id'), true);
  assert.equal(architecture.includes('deliverable_family'), true);
  assert.equal(status.includes('operator entry'), true);
  assert.equal(status.includes('OPL -> RedCube'), true);
  assert.equal(status.includes('repo-verified `RedCube Product Entry`'), true);

  assert.equal(handoff.includes('target_domain_id'), true);
  assert.equal(handoff.includes('task_intent'), true);
  assert.equal(handoff.includes('entry_mode'), true);
  assert.equal(handoff.includes('workspace_locator'), true);
  assert.equal(handoff.includes('runtime_session_contract'), true);
  assert.equal(handoff.includes('return_surface_contract'), true);
  assert.equal(handoff.includes('deliverable_family'), true);
  assert.equal(handoff.includes('repo-verified `RedCube Product Entry` service surface 与 `OPL -> RedCube` federation 写成已落地'), true);
  assert.equal(handoff.includes('当前 route / managed run surface 已切到本地 Codex CLI host-agent runtime'), true);
  assert.equal(handoff.includes('Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway'), false);
  assert.equal(handoff.includes('User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
});
