# RedCube Gateway Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Agent-first 重构的基础设施底座：单一 workspace contract、runtime protocol 包、gateway 包，以及 CLI v2 骨架。

**Architecture:** 本计划只做基础设施 cutover，不直接改动完整内容生产主链。新的 `redcube-runtime-protocol` 负责目录与 run schema，`redcube-gateway` 提供稳定 action surface，CLI 改为 gateway 的薄包装，同时保留旧命令作为过渡兼容层。

**Tech Stack:** Node.js ESM, `node:test`, JSON filesystem contracts, existing npm workspaces

---

## File Map

- Create: `packages/redcube-runtime-protocol/package.json`
- Create: `packages/redcube-runtime-protocol/src/index.js`
- Create: `packages/redcube-runtime-protocol/src/workspace.js`
- Create: `packages/redcube-runtime-protocol/src/runs.js`
- Create: `packages/redcube-gateway/package.json`
- Create: `packages/redcube-gateway/src/index.js`
- Create: `packages/redcube-gateway/src/actions/doctor-workspace.js`
- Create: `packages/redcube-gateway/src/actions/list-topics.js`
- Modify: `apps/redcube-cli/src/cli.js`
- Test: `tests/runtime-protocol-workspace.test.js`
- Test: `tests/gateway-actions.test.js`
- Test: `tests/cli-v2-smoke.test.js`

### Task 1: 建立 Runtime Protocol 的 workspace 与 run contract

**Files:**
- Create: `packages/redcube-runtime-protocol/package.json`
- Create: `packages/redcube-runtime-protocol/src/index.js`
- Create: `packages/redcube-runtime-protocol/src/workspace.js`
- Create: `packages/redcube-runtime-protocol/src/runs.js`
- Test: `tests/runtime-protocol-workspace.test.js`

- [ ] **Step 1: 写失败测试，锁定 workspace contract 与 run record 结构**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  createRunRecord,
  getNotePaths,
  getTopicPaths,
  resolveWorkspaceContract,
} from '../packages/redcube-runtime-protocol/src/index.js';

test('resolveWorkspaceContract returns canonical workspace metadata paths', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const contract = resolveWorkspaceContract({ workspaceRoot });

  assert.equal(contract.workspaceRoot, workspaceRoot);
  assert.equal(contract.workspaceFile, path.join(workspaceRoot, 'redcube.workspace.json'));
  assert.equal(contract.topicsDir, path.join(workspaceRoot, 'topics'));
  assert.equal(contract.runtimeDir, path.join(workspaceRoot, 'runtime'));
  assert.equal(contract.publishDir, path.join(workspaceRoot, 'publish'));
});

test('topic and note paths are derived from the canonical workspace root', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const topicPaths = getTopicPaths(workspaceRoot, 'topic-a');
  const notePaths = getNotePaths(workspaceRoot, 'topic-a', 'note-01');

  assert.equal(topicPaths.topicDir, path.join(workspaceRoot, 'topics', 'topic-a'));
  assert.equal(topicPaths.canonicalDir, path.join(workspaceRoot, 'topics', 'topic-a', 'canonical'));
  assert.equal(notePaths.noteDir, path.join(workspaceRoot, 'topics', 'topic-a', 'notes', 'note-01'));
  assert.equal(notePaths.artifactsDir, path.join(notePaths.noteDir, 'artifacts'));
  assert.equal(notePaths.reportsDir, path.join(notePaths.noteDir, 'reports'));
});

test('createRunRecord creates a stable minimal run envelope', () => {
  const run = createRunRecord({
    runId: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
  });

  assert.deepEqual(run, {
    run_id: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    error: null,
  });
});
```

- [ ] **Step 2: 跑测试，确认当前确实失败**

Run: `node --test tests/runtime-protocol-workspace.test.js`
Expected: FAIL，报 `Cannot find module '../packages/redcube-runtime-protocol/src/index.js'` 或缺少导出。

- [ ] **Step 3: 写最小实现，建立 runtime protocol 包**

```js
// packages/redcube-runtime-protocol/src/workspace.js
import path from 'node:path';

function requireSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function resolveWorkspaceContract({ workspaceRoot }) {
  const root = path.resolve(requireSegment('workspaceRoot', workspaceRoot));
  return {
    workspaceRoot: root,
    workspaceFile: path.join(root, 'redcube.workspace.json'),
    topicsDir: path.join(root, 'topics'),
    runtimeDir: path.join(root, 'runtime'),
    publishDir: path.join(root, 'publish'),
    overlaysDir: path.join(root, 'overlays'),
  };
}

export function getTopicPaths(workspaceRoot, topicId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const topic = requireSegment('topicId', topicId);
  const topicDir = path.join(contract.topicsDir, topic);
  return {
    topicId: topic,
    topicDir,
    topicFile: path.join(topicDir, 'topic.json'),
    inputsDir: path.join(topicDir, 'inputs'),
    canonicalDir: path.join(topicDir, 'canonical'),
    notesDir: path.join(topicDir, 'notes'),
    runsDir: path.join(topicDir, 'runs'),
  };
}

export function getNotePaths(workspaceRoot, topicId, noteId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const note = requireSegment('noteId', noteId);
  const noteDir = path.join(topicPaths.notesDir, note);
  return {
    noteId: note,
    noteDir,
    noteFile: path.join(noteDir, 'note.json'),
    artifactsDir: path.join(noteDir, 'artifacts'),
    reportsDir: path.join(noteDir, 'reports'),
    viewsDir: path.join(noteDir, 'views'),
  };
}
```

```js
// packages/redcube-runtime-protocol/src/runs.js
export function createRunRecord(input = {}) {
  return {
    run_id: String(input.runId || '').trim(),
    route: String(input.route || '').trim(),
    scope: String(input.scope || '').trim(),
    target: String(input.target || '').trim(),
    overlay: String(input.overlay || '').trim(),
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    error: null,
  };
}
```

```js
// packages/redcube-runtime-protocol/src/index.js
export { createRunRecord } from './runs.js';
export {
  getNotePaths,
  getTopicPaths,
  resolveWorkspaceContract,
} from './workspace.js';
```

```json
// packages/redcube-runtime-protocol/package.json
{
  "name": "@redcube/runtime-protocol",
  "version": "0.1.0",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: 重新跑测试，确认 runtime protocol 通过**

Run: `node --test tests/runtime-protocol-workspace.test.js`
Expected: PASS，3 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add tests/runtime-protocol-workspace.test.js \
  packages/redcube-runtime-protocol/package.json \
  packages/redcube-runtime-protocol/src/index.js \
  packages/redcube-runtime-protocol/src/workspace.js \
  packages/redcube-runtime-protocol/src/runs.js
git commit -m "feat: add runtime protocol foundation"
```

### Task 2: 建立 Gateway 的最小 action surface

**Files:**
- Create: `packages/redcube-gateway/package.json`
- Create: `packages/redcube-gateway/src/index.js`
- Create: `packages/redcube-gateway/src/actions/doctor-workspace.js`
- Create: `packages/redcube-gateway/src/actions/list-topics.js`
- Test: `tests/gateway-actions.test.js`

- [ ] **Step 1: 写失败测试，锁定 `doctor_workspace` 与 `list_topics` 行为**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';

import {
  doctorWorkspace,
  listTopics,
} from '../packages/redcube-gateway/src/index.js';

test('doctorWorkspace reports canonical directories and workspace file presence', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-gateway-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const result = await doctorWorkspace({ workspaceRoot });

  assert.equal(result.ok, true);
  assert.equal(result.workspaceRoot, workspaceRoot);
  assert.equal(result.workspaceFileExists, true);
  assert.equal(result.contract.topicsDir, path.join(workspaceRoot, 'topics'));
});

test('listTopics returns topic metadata from canonical workspace tree', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-gateway-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    overlay: 'xiaohongshu',
    status: 'draft',
  }), 'utf-8');

  const result = await listTopics({ workspaceRoot });

  assert.equal(result.ok, true);
  assert.equal(result.total, 1);
  assert.equal(result.topics[0].topic_id, 'topic-a');
  assert.equal(result.topics[0].status, 'draft');
});
```

- [ ] **Step 2: 跑测试，确认 gateway 还不存在**

Run: `node --test tests/gateway-actions.test.js`
Expected: FAIL，报缺少 `../packages/redcube-gateway/src/index.js`。

- [ ] **Step 3: 写最小 gateway 实现**

```js
// packages/redcube-gateway/src/actions/doctor-workspace.js
import { existsSync } from 'node:fs';

import { resolveWorkspaceContract } from '../../../redcube-runtime-protocol/src/index.js';

export async function doctorWorkspace({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  return {
    ok: true,
    workspaceRoot: contract.workspaceRoot,
    workspaceFileExists: existsSync(contract.workspaceFile),
    contract,
  };
}
```

```js
// packages/redcube-gateway/src/actions/list-topics.js
import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { resolveWorkspaceContract } from '../../../redcube-runtime-protocol/src/index.js';

export async function listTopics({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  if (!existsSync(contract.topicsDir)) {
    return { ok: true, workspaceRoot: contract.workspaceRoot, total: 0, topics: [] };
  }

  const topics = readdirSync(contract.topicsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(contract.topicsDir, entry.name, 'topic.json'))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, 'utf-8')));

  return {
    ok: true,
    workspaceRoot: contract.workspaceRoot,
    total: topics.length,
    topics,
  };
}
```

```js
// packages/redcube-gateway/src/index.js
export { doctorWorkspace } from './actions/doctor-workspace.js';
export { listTopics } from './actions/list-topics.js';
```

```json
// packages/redcube-gateway/package.json
{
  "name": "@redcube/gateway",
  "version": "0.1.0",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: 跑 gateway 测试，确认 action surface 通过**

Run: `node --test tests/gateway-actions.test.js`
Expected: PASS，2 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add tests/gateway-actions.test.js \
  packages/redcube-gateway/package.json \
  packages/redcube-gateway/src/index.js \
  packages/redcube-gateway/src/actions/doctor-workspace.js \
  packages/redcube-gateway/src/actions/list-topics.js
git commit -m "feat: add gateway foundation actions"
```

### Task 3: 让 CLI v2 调用 Gateway，同时保留旧命令兼容

**Files:**
- Modify: `apps/redcube-cli/src/cli.js`
- Test: `tests/cli-v2-smoke.test.js`

- [ ] **Step 1: 写失败测试，锁定新 CLI 子命令**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';

test('CLI workspace doctor proxies gateway doctorWorkspace', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'workspace', 'doctor', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI topics list proxies gateway listTopics', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'topics', 'list', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-a');
});
```

- [ ] **Step 2: 跑测试，确认 CLI v2 目前失败**

Run: `node --test tests/cli-v2-smoke.test.js`
Expected: FAIL，报未知命令 `workspace` 或 `topics`。

- [ ] **Step 3: 在 CLI 中增加 Gateway v2 路径**

```js
// apps/redcube-cli/src/cli.js
import {
  doctorWorkspace,
  listTopics as listTopicsGateway,
} from '../../../packages/redcube-gateway/src/index.js';

// 在 help 输出中新增：
// workspace doctor --workspace-root <dir>
// topics list --workspace-root <dir>

if (command === 'workspace' && rest[0] === 'doctor') {
  const result = await doctorWorkspace({
    workspaceRoot: options.workspaceRoot || options.rootDir || process.cwd(),
  });
  printJson(result);
  return;
}

if (command === 'topics' && rest[0] === 'list') {
  const result = await listTopicsGateway({
    workspaceRoot: options.workspaceRoot || options.rootDir || process.cwd(),
  });
  printJson(result);
  return;
}
```

- [ ] **Step 4: 重新跑 CLI v2 测试**

Run: `node --test tests/cli-v2-smoke.test.js`
Expected: PASS，2 个测试通过。

- [ ] **Step 5: 跑基础回归，确保旧 CLI 未被破坏**

Run: `node --test tests/cli-smoke.test.js tests/runtime-protocol-workspace.test.js tests/gateway-actions.test.js tests/cli-v2-smoke.test.js`
Expected: PASS，全部通过。

- [ ] **Step 6: 提交**

```bash
git add apps/redcube-cli/src/cli.js \
  tests/cli-v2-smoke.test.js
git commit -m "feat: route cli v2 commands through gateway"
```
