# RedCube Legacy Migration And Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提供旧项目到新 workspace 的单向 importer，并在验证通过后切断 `Workbench/Web + sync` 对 production path 的依赖。

**Architecture:** 迁移阶段只允许 `legacy -> new` 单向导入，不允许双向同步。cutover 的完成标志不是“两个系统都能跑”，而是新 Gateway 主线完整覆盖生产动作且旧 workbench sync 不再参与正式运行。

**Tech Stack:** Node.js ESM, `node:test`, filesystem migration, existing legacy `projects/` tree

---

## File Map

- Create: `packages/redcube-gateway/src/actions/import-legacy-project.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Modify: `apps/redcube-cli/src/cli.js`
- Modify: `packages/redcube-agent/src/index.js`
- Delete: `packages/redcube-agent/src/workbench-project-sync.js`
- Delete: `packages/redcube-agent/src/workbench-truth-sync.js`
- Delete: `apps/redcube-web/src/api.js`
- Delete: `apps/redcube-web/src/server.js`
- Delete: `apps/redcube-web/public/app.js`
- Test: `tests/import-legacy-project.test.js`
- Test: `tests/production-path-cutover.test.js`

### Task 1: 建立 legacy importer，单向迁入 canonical workspace

**Files:**
- Create: `packages/redcube-gateway/src/actions/import-legacy-project.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Modify: `apps/redcube-cli/src/cli.js`
- Test: `tests/import-legacy-project.test.js`

- [ ] **Step 1: 写失败测试，锁定 importer 行为**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

import { importLegacyProject } from '../packages/redcube-gateway/src/index.js';

test('importLegacyProject copies legacy project inputs into canonical workspace topic', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-legacy-root-'));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workspace-'));
  const projectDir = path.join(rootDir, 'projects', 'topic-a', 'inputs', 'raw_materials');
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(path.join(rootDir, 'projects', 'topic-a', 'inputs', 'series_toc.md'), '# 系列目录', 'utf-8');
  writeFileSync(path.join(projectDir, 'source.md'), '# 原始素材', 'utf-8');

  const result = await importLegacyProject({
    rootDir,
    workspaceRoot,
    project: 'topic-a',
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'legacy_to_workspace');
  assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'inputs', 'raw_materials', 'source.md')), true);
  assert.equal(
    JSON.parse(readFileSync(path.join(workspaceRoot, 'topics', 'topic-a', 'topic.json'), 'utf-8')).topic_id,
    'topic-a',
  );
});
```

- [ ] **Step 2: 跑 importer 测试，确认缺失实现**

Run: `node --test tests/import-legacy-project.test.js`
Expected: FAIL。

- [ ] **Step 3: 写 importer 最小实现**

```js
// packages/redcube-gateway/src/actions/import-legacy-project.js
import path from 'node:path';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { getTopicPaths } from '../../../redcube-runtime-protocol/src/index.js';
import { buildTopicRecord } from '../../../redcube-overlay-xiaohongshu/src/index.js';

export async function importLegacyProject({ rootDir, workspaceRoot, project }) {
  const projectRoot = path.join(rootDir, 'projects', project);
  const inputsDir = path.join(projectRoot, 'inputs');
  if (!existsSync(inputsDir)) {
    throw new Error(`legacy project 不存在: ${projectRoot}`);
  }

  const topicPaths = getTopicPaths(workspaceRoot, project);
  mkdirSync(topicPaths.topicDir, { recursive: true });
  mkdirSync(topicPaths.inputsDir, { recursive: true });
  cpSync(inputsDir, topicPaths.inputsDir, { recursive: true });

  const topic = buildTopicRecord({ topicId: project, title: project });
  writeFileSync(topicPaths.topicFile, JSON.stringify(topic, null, 2), 'utf-8');

  return {
    ok: true,
    mode: 'legacy_to_workspace',
    project,
    topicFile: topicPaths.topicFile,
  };
}
```

- [ ] **Step 4: 跑 importer 测试**

Run: `node --test tests/import-legacy-project.test.js`
Expected: PASS。

- [ ] **Step 5: 增加 CLI 入口并提交**

```js
// apps/redcube-cli/src/cli.js
import { importLegacyProject } from '../../../packages/redcube-gateway/src/index.js';

// help:
// import legacy-project --project <name> --root-dir <dir> --workspace-root <dir>

if (command === 'import' && rest[0] === 'legacy-project') {
  const result = await importLegacyProject({
    rootDir,
    workspaceRoot: options.workspaceRoot,
    project: options.project,
  });
  printJson(result);
  return;
}
```

```bash
git add tests/import-legacy-project.test.js \
  packages/redcube-gateway/src/actions/import-legacy-project.js \
  packages/redcube-gateway/src/index.js \
  apps/redcube-cli/src/cli.js
git commit -m "feat: add one-way legacy importer"
```

### Task 2: 切断 production path 对 workbench sync 的依赖

**Files:**
- Modify: `packages/redcube-agent/src/index.js`
- Test: `tests/production-path-cutover.test.js`

- [ ] **Step 1: 写失败测试，锁定 `runWorkflow` 不再触发 workbench sync**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';

import { runWorkflow } from '../packages/redcube-agent/src/index.js';

test('runWorkflow no longer mirrors outputs into workbench output tree', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-cutover-'));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cutover-workspace-'));
  const rawDir = path.join(rootDir, 'projects', 'topic-a', 'inputs', 'raw_materials');
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(path.join(rootDir, 'projects', 'topic-a', 'inputs', 'series_toc.md'), '# 系列目录\\n\\n## 1. 主题', 'utf-8');
  writeFileSync(path.join(rawDir, 'source.md'), '# 原始素材', 'utf-8');

  const result = await runWorkflow({ project: 'topic-a', mode: 'plan' }, { rootDir, workspaceRoot });

  assert.equal(result.ok, true);
  assert.equal((result.warnings || []).some((item) => String(item).includes('workbench sync failed')), false);
});
```

- [ ] **Step 2: 跑测试，确认当前会因旧同步逻辑失败**

Run: `node --test tests/production-path-cutover.test.js`
Expected: FAIL，旧逻辑仍引用 workbench sync 或返回相关 warning。

- [ ] **Step 3: 从 `runWorkflow` 主路径中删除 workbench 镜像写回**

```js
// packages/redcube-agent/src/index.js
export async function runWorkflow(config, context = {}) {
  const runtimeConfig = resolveRuntimeConfig(context, config);
  const rootDir = runtimeConfig.rootDir;
  const workspaceRoot = runtimeConfig.workspaceRoot;
  const project = String(config.project || '').trim();
  const runId = createRunId();

  const started = {
    runId,
    kind: 'workflow',
    status: 'running',
    project,
    mode: config.mode || 'full',
    startedAt: new Date().toISOString(),
  };
  saveRunState(rootDir, started);

  const result = await runWorkflowDomain({ ...config, project }, {
    rootDir,
    runId,
    workspaceRoot,
    repoRoot: context.repoRoot || process.cwd(),
    runtimeConfig,
    planningLlmConfig: loadStageLlmConfig(workspaceRoot, 'planning'),
    htmlGenerationLlmConfig: loadStageLlmConfig(workspaceRoot, 'html_generation'),
    htmlFixLlmConfig: loadStageLlmConfig(workspaceRoot, 'html_fix'),
  });

  const ended = {
    ...started,
    status: result.ok ? 'completed' : 'failed',
    finishedAt: new Date().toISOString(),
    summary: result,
  };
  saveRunState(rootDir, ended);

  return {
    runId,
    ...result,
  };
}
```

- [ ] **Step 4: 跑 cutover 测试与主线回归**

Run: `node --test tests/production-path-cutover.test.js tests/agent-workflow.test.js`
Expected: PASS，且不再出现 workbench sync 相关 warning。

- [ ] **Step 5: 提交**

```bash
git add packages/redcube-agent/src/index.js \
  tests/production-path-cutover.test.js
git commit -m "refactor: remove workbench sync from production path"
```

### Task 3: 删除旧 Web / Workbench 主线

**Files:**
- Delete: `packages/redcube-agent/src/workbench-project-sync.js`
- Delete: `packages/redcube-agent/src/workbench-truth-sync.js`
- Delete: `apps/redcube-web/src/api.js`
- Delete: `apps/redcube-web/src/server.js`
- Delete: `apps/redcube-web/public/app.js`

- [ ] **Step 1: 搜索剩余引用，确认删除边界**

Run: `rg -n "workbench-project-sync|workbench-truth-sync|apps/redcube-web|RunWorkbench|GetWorkbench" apps packages tests`
Expected: 只剩待删引用；如仍有生产代码引用，先改引用再删除文件。

- [ ] **Step 2: 删除旧主线文件**

```bash
git rm packages/redcube-agent/src/workbench-project-sync.js \
  packages/redcube-agent/src/workbench-truth-sync.js \
  apps/redcube-web/src/api.js \
  apps/redcube-web/src/server.js \
  apps/redcube-web/public/app.js
```

- [ ] **Step 3: 删除或调整旧测试，使测试集只覆盖新主线**

```bash
git rm tests/web-api.test.js \
  tests/workbench-api.test.js \
  tests/workbench-file-api.test.js \
  tests/workbench-model-config.test.js \
  tests/workbench-project-sync.test.js \
  tests/workbench-truth-sync.test.js \
  tests/workbench-workflow.test.js \
  tests/workbench-workspace.test.js
```

- [ ] **Step 4: 跑最终 cutover 回归**

Run: `npm test`
Expected: PASS，仅剩新 Gateway / Runtime / Overlay / importer 主线测试。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor: remove legacy web and workbench surfaces"
```
