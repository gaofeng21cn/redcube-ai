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

test('operator docs describe Deep Research as Source Readiness enhancement on an auto-first 5-step line', () => {
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');
  const docsReadmeZh = readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf-8');
  const quickstart = readFileSync(path.join(repoRoot, 'docs', 'human_quickstart.md'), 'utf-8');

  assert.equal(docsReadme.includes('`Deep Research` remains inside `Source Readiness`'), true);
  assert.equal(docsReadmeZh.includes('`Deep Research` 继续属于 `Source Readiness`'), true);
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

test('docs keep public shell wording separate from internal OPL bridge and runtime records', () => {
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

  assert.equal(rootReadme.includes('## One-Sentence Quick Start'), true);
  assert.equal(rootReadme.includes('## What It Helps With'), true);
  assert.equal(rootReadme.includes('## Current Delivery Focus'), true);
  assert.equal(rootReadme.includes('## How It Works'), true);
  assert.equal(rootReadme.includes('## Current Boundary'), true);
  assert.equal(rootReadme.includes('`redcube product federate`'), false);
  assert.equal(rootReadme.includes('`operator entry`, `agent entry`'), false);
  assert.equal(rootReadme.includes('Hermes-Agent managed runtime -> RedCube service-safe domain entry'), false);
  assert.equal(rootReadmeZh.includes('## 一句话快速启动'), true);
  assert.equal(rootReadmeZh.includes('## 适合处理的工作'), true);
  assert.equal(rootReadmeZh.includes('## 当前交付重点'), true);
  assert.equal(rootReadmeZh.includes('## 工作方式'), true);
  assert.equal(rootReadmeZh.includes('## 当前边界'), true);
  assert.equal(rootReadmeZh.includes('`redcube product federate`'), false);
  assert.equal(rootReadmeZh.includes('`operator entry`、`agent entry`'), false);
  assert.equal(rootReadmeZh.includes('Hermes-Agent managed runtime -> RedCube service-safe domain entry'), false);

  assert.equal(docsReadme.includes('RedCube product entry MVP'), true);
  assert.equal(docsReadme.includes('public entry model stays `OPL shell -> RedCube domain agent -> Codex default execution`'), true);
  assert.equal(docsReadme.includes('references/lightweight_product_entry_and_opl_handoff.md'), true);
  assert.equal(docsReadmeZh.includes('Managed Product Entry Hardening'), true);
  assert.equal(docsReadmeZh.includes('公开入口模型保持 `OPL shell -> RedCube domain agent -> Codex default execution`'), true);
  assert.equal(docsReadmeZh.includes('references/lightweight_product_entry_and_opl_handoff.md'), true);

  assert.equal(project.includes('repo-verified 的轻量 `product entry` service surface 也已落地'), true);
  assert.equal(architecture.includes('User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
  assert.equal(architecture.includes('invokeFederatedProductEntry'), true);
  assert.equal(architecture.includes('Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway'), false);
  assert.equal(architecture.includes('target_domain_id'), true);
  assert.equal(architecture.includes('deliverable_family'), true);
  assert.equal(status.includes('当前用户认知入口：`OPL GUI / management shell -> RCA / RedCube domain agent -> governed visual-deliverable workflow`'), true);
  assert.equal(status.includes('当前 OPL bridge：`redcube product federate`'), true);
  assert.equal(status.includes('已冻结的最终目标形态：`User -> OPL shell -> RCA / RedCube domain agent -> Codex default execution -> RedCube visual-domain truth surfaces`'), true);

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

test('docs indexes link the series doc governance checklist and keep the four-repo frame explicit', () => {
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');
  const docsReadmeZh = readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf-8');
  const checklist = readFileSync(
    path.join(repoRoot, 'docs', 'references', 'series-doc-governance-checklist.md'),
    'utf-8',
  );
  let previousIndex = -1;

  for (const heading of [
    '## 目标',
    '## 一、默认入口',
    '## 二、核心五件套',
    '## 三、公开层与内部层',
    '## 四、系列一致性检查',
    '## 五、默认验证',
  ]) {
    const currentIndex = checklist.indexOf(heading);
    assert.equal(currentIndex >= 0, true);
    assert.equal(currentIndex > previousIndex, true);
    previousIndex = currentIndex;
  }

  assert.equal(docsReadme.includes('series-doc-governance-checklist.md'), true);
  assert.equal(docsReadmeZh.includes('series-doc-governance-checklist.md'), true);

  for (const label of ['One Person Lab', 'Med Auto Science', 'Med Auto Grant', 'RedCube AI']) {
    assert.equal(checklist.includes(label), true);
  }

  assert.equal(checklist.includes('project.md'), true);
  assert.equal(checklist.includes('status.md'), true);
  assert.equal(checklist.includes('architecture.md'), true);
  assert.equal(checklist.includes('invariants.md'), true);
  assert.equal(checklist.includes('decisions.md'), true);
  assert.equal(checklist.includes('docs/program/**'), true);
  assert.equal(checklist.includes('docs/references/**'), true);
  assert.equal(checklist.includes('docs/policies/**'), true);
  assert.equal(checklist.includes('Hermes-Agent'), true);
  assert.equal(checklist.includes('AGENTS.md'), true);
  assert.equal(checklist.includes('第二真相源'), true);
  assert.equal(checklist.includes('scripts/verify.sh meta'), true);
  assert.equal(checklist.includes('npm run test:meta'), true);
});
