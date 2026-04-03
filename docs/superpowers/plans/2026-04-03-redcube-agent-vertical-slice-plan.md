# RedCube Agent Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付第一条可运行的 Agent-first 主线：`create_topic -> get_topic -> run_topic_route(storyline) -> get_run`，并使用 `xiaohongshu overlay`、runtime store 与 MCP 对外暴露。

**Architecture:** 在 foundation 之上新增 `redcube-overlay-xiaohongshu`、`redcube-runtime` 与 `redcube-mcp`。overlay 只定义契约与 gate，runtime 负责 run store、event log 与 route 执行，MCP 只镜像 gateway actions，不引入 Web 语义。

**Tech Stack:** Node.js ESM, `node:test`, stdio MCP server, JSON artifacts, existing LLM/storyline generators

---

## File Map

- Create: `packages/redcube-overlay-xiaohongshu/package.json`
- Create: `packages/redcube-overlay-xiaohongshu/src/index.js`
- Create: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Create: `packages/redcube-overlay-xiaohongshu/src/gates.js`
- Create: `packages/redcube-runtime/package.json`
- Create: `packages/redcube-runtime/src/index.js`
- Create: `packages/redcube-runtime/src/event-log.js`
- Create: `packages/redcube-runtime/src/run-store.js`
- Create: `packages/redcube-runtime/src/topic-routes.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Create: `packages/redcube-gateway/src/actions/create-topic.js`
- Create: `packages/redcube-gateway/src/actions/get-topic.js`
- Create: `packages/redcube-gateway/src/actions/get-run.js`
- Create: `packages/redcube-gateway/src/actions/run-topic-route.js`
- Create: `apps/redcube-mcp/package.json`
- Create: `apps/redcube-mcp/src/server.js`
- Test: `tests/xiaohongshu-overlay.test.js`
- Test: `tests/runtime-topic-route.test.js`
- Test: `tests/mcp-gateway.test.js`

### Task 1: 建立 `xiaohongshu overlay` 的最小 contract 与 gate

**Files:**
- Create: `packages/redcube-overlay-xiaohongshu/package.json`
- Create: `packages/redcube-overlay-xiaohongshu/src/index.js`
- Create: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Create: `packages/redcube-overlay-xiaohongshu/src/gates.js`
- Test: `tests/xiaohongshu-overlay.test.js`

- [ ] **Step 1: 写失败测试，锁定 overlay 的 topic/note 合同与 storyline gate**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTopicRecord,
  evaluateStorylineGate,
} from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('buildTopicRecord emits canonical xiaohongshu topic metadata', () => {
  const topic = buildTopicRecord({ topicId: 'topic-a', title: '甲状腺科普系列' });

  assert.equal(topic.topic_id, 'topic-a');
  assert.equal(topic.overlay, 'xiaohongshu');
  assert.equal(topic.status, 'draft');
  assert.deepEqual(topic.routes, ['research', 'storyline', 'note']);
});

test('evaluateStorylineGate blocks empty storyline content', () => {
  const report = evaluateStorylineGate({ storylineText: '' });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['storyline_empty']);
});

test('evaluateStorylineGate passes well-formed storyline content', () => {
  const report = evaluateStorylineGate({
    storylineText: '# 叙事逻辑\n\n## 核心冲突\n\n围绕误区到行动组织内容。',
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
});
```

- [ ] **Step 2: 跑测试，确认 overlay 尚未实现**

Run: `node --test tests/xiaohongshu-overlay.test.js`
Expected: FAIL，报缺少 overlay 包或导出。

- [ ] **Step 3: 写最小 overlay 实现**

```js
// packages/redcube-overlay-xiaohongshu/src/contracts.js
export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    status: 'draft',
    routes: ['research', 'storyline', 'note'],
  };
}
```

```js
// packages/redcube-overlay-xiaohongshu/src/gates.js
export function evaluateStorylineGate({ storylineText }) {
  const text = String(storylineText || '').trim();
  if (!text) {
    return {
      status: 'block',
      blockers: ['storyline_empty'],
      advisories: [],
      metrics: { char_count: 0 },
      next_action: 'rerun_storyline',
    };
  }

  return {
    status: 'pass',
    blockers: [],
    advisories: [],
    metrics: { char_count: text.length },
    next_action: 'continue',
  };
}
```

```js
// packages/redcube-overlay-xiaohongshu/src/index.js
export { buildTopicRecord } from './contracts.js';
export { evaluateStorylineGate } from './gates.js';
```

- [ ] **Step 4: 重新跑 overlay 测试**

Run: `node --test tests/xiaohongshu-overlay.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/xiaohongshu-overlay.test.js \
  packages/redcube-overlay-xiaohongshu/package.json \
  packages/redcube-overlay-xiaohongshu/src/index.js \
  packages/redcube-overlay-xiaohongshu/src/contracts.js \
  packages/redcube-overlay-xiaohongshu/src/gates.js
git commit -m "feat: add xiaohongshu overlay foundation"
```

### Task 2: 建立 runtime store 与 `run_topic_route(storyline)` 纵切片

**Files:**
- Create: `packages/redcube-runtime/package.json`
- Create: `packages/redcube-runtime/src/index.js`
- Create: `packages/redcube-runtime/src/event-log.js`
- Create: `packages/redcube-runtime/src/run-store.js`
- Create: `packages/redcube-runtime/src/topic-routes.js`
- Create: `packages/redcube-gateway/src/actions/create-topic.js`
- Create: `packages/redcube-gateway/src/actions/get-topic.js`
- Create: `packages/redcube-gateway/src/actions/get-run.js`
- Create: `packages/redcube-gateway/src/actions/run-topic-route.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Test: `tests/runtime-topic-route.test.js`

- [ ] **Step 1: 写失败测试，锁定 `create_topic / run_topic_route / get_run`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createTopic,
  getRun,
  getTopic,
  runTopicRoute,
} from '../packages/redcube-gateway/src/index.js';

test('createTopic writes canonical topic metadata', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createTopic({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'AI 工作流小红书系列',
  });

  assert.equal(created.ok, true);
  const topic = await getTopic({ workspaceRoot, topicId: 'topic-a' });
  assert.equal(topic.topic.topic_id, 'topic-a');
  assert.equal(topic.topic.overlay, 'xiaohongshu');
});

test('runTopicRoute storyline writes canonical artifact and run ledger', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));
  await createTopic({ workspaceRoot, topicId: 'topic-a', title: 'AI 工作流小红书系列' });

  const run = await runTopicRoute({
    workspaceRoot,
    topicId: 'topic-a',
    route: 'storyline',
  });

  assert.equal(run.ok, true);
  assert.equal(run.run.status, 'completed');
  assert.equal(run.gate.status, 'pass');
  assert.equal(run.events.length >= 2, true);

  const stored = await getRun({ workspaceRoot, runId: run.run.run_id });
  assert.equal(stored.run.run_id, run.run.run_id);
  assert.equal(
    JSON.parse(readFileSync(run.storylineFile, 'utf-8')).route,
    'storyline',
  );
});
```

- [ ] **Step 2: 跑测试，确认纵切片失败**

Run: `node --test tests/runtime-topic-route.test.js`
Expected: FAIL，报缺少 gateway action 或 runtime 包。

- [ ] **Step 3: 写最小 runtime 与 gateway action 实现**

```js
// packages/redcube-runtime/src/event-log.js
import path from 'node:path';
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

import { resolveWorkspaceContract } from '../../redcube-runtime-protocol/src/index.js';

function eventsFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'events');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `${runId}.jsonl`);
}

export function appendEvent(workspaceRoot, runId, event) {
  appendFileSync(eventsFile(workspaceRoot, runId), `${JSON.stringify(event)}\n`, 'utf-8');
}

export function loadEvents(workspaceRoot, runId) {
  const file = eventsFile(workspaceRoot, runId);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
```

```js
// packages/redcube-runtime/src/run-store.js
import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

import { createRunRecord, resolveWorkspaceContract } from '../../redcube-runtime-protocol/src/index.js';

function runsDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveRun(workspaceRoot, run) {
  const file = path.join(runsDir(workspaceRoot), `${run.run_id}.json`);
  writeFileSync(file, JSON.stringify(run, null, 2), 'utf-8');
  return file;
}

export function loadRun(workspaceRoot, runId) {
  const file = path.join(runsDir(workspaceRoot), `${runId}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function startRun(input) {
  return createRunRecord(input);
}
```

```js
// packages/redcube-runtime/src/topic-routes.js
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import { getTopicPaths } from '../../redcube-runtime-protocol/src/index.js';
import { evaluateStorylineGate } from '../../redcube-overlay-xiaohongshu/src/index.js';
import { appendEvent, loadEvents } from './event-log.js';
import { saveRun, startRun } from './run-store.js';

export async function runStorylineRoute({ workspaceRoot, topicId }) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  mkdirSync(topicPaths.canonicalDir, { recursive: true });

  const storylinePayload = {
    route: 'storyline',
    topic_id: topicId,
    storyline_text: '# 叙事逻辑\\n\\n## 核心冲突\\n\\n围绕误区到行动组织内容。',
  };
  const storylineFile = path.join(topicPaths.canonicalDir, 'storyline.plan.json');
  writeFileSync(storylineFile, JSON.stringify(storylinePayload, null, 2), 'utf-8');

  const gate = evaluateStorylineGate({ storylineText: storylinePayload.storyline_text });
  const run = {
    ...startRun({
      runId: `run-${Date.now()}`,
      route: 'topic.storyline',
      scope: 'topic',
      target: topicId,
      overlay: 'xiaohongshu',
    }),
    status: gate.status === 'pass' ? 'completed' : 'failed',
    artifact_refs: [storylineFile],
  };
  appendEvent(workspaceRoot, run.run_id, { type: 'route_started', route: 'storyline', topic_id: topicId });
  appendEvent(workspaceRoot, run.run_id, { type: 'gate_evaluated', status: gate.status });
  saveRun(workspaceRoot, run);

  return { run, gate, storylineFile, events: loadEvents(workspaceRoot, run.run_id) };
}
```

```js
// packages/redcube-gateway/src/actions/create-topic.js
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import { getTopicPaths } from '../../../redcube-runtime-protocol/src/index.js';
import { buildTopicRecord } from '../../../redcube-overlay-xiaohongshu/src/index.js';

export async function createTopic({ workspaceRoot, topicId, title }) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  mkdirSync(topicPaths.topicDir, { recursive: true });
  const topic = buildTopicRecord({ topicId, title });
  writeFileSync(topicPaths.topicFile, JSON.stringify(topic, null, 2), 'utf-8');
  mkdirSync(path.join(topicPaths.topicDir, 'inputs'), { recursive: true });
  return { ok: true, topicFile: topicPaths.topicFile, topic };
}
```

```js
// packages/redcube-gateway/src/actions/get-topic.js
import { readFileSync } from 'node:fs';
import { getTopicPaths } from '../../../redcube-runtime-protocol/src/index.js';

export async function getTopic({ workspaceRoot, topicId }) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    ok: true,
    topic: JSON.parse(readFileSync(topicPaths.topicFile, 'utf-8')),
  };
}
```

```js
// packages/redcube-gateway/src/actions/get-run.js
import { loadRun } from '../../../redcube-runtime/src/index.js';

export async function getRun({ workspaceRoot, runId }) {
  return {
    ok: true,
    run: loadRun(workspaceRoot, runId),
  };
}
```

```js
// packages/redcube-gateway/src/actions/run-topic-route.js
import { runStorylineRoute } from '../../../redcube-runtime/src/index.js';

export async function runTopicRoute({ workspaceRoot, topicId, route }) {
  if (route !== 'storyline') {
    throw new Error(`暂未支持的 route: ${route}`);
  }
  const result = await runStorylineRoute({ workspaceRoot, topicId });
  return { ok: result.gate.status === 'pass', ...result };
}
```

- [ ] **Step 4: 跑 runtime 纵切片测试**

Run: `node --test tests/runtime-topic-route.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/runtime-topic-route.test.js \
  packages/redcube-runtime/package.json \
  packages/redcube-runtime/src/index.js \
  packages/redcube-runtime/src/event-log.js \
  packages/redcube-runtime/src/run-store.js \
  packages/redcube-runtime/src/topic-routes.js \
  packages/redcube-gateway/src/index.js \
  packages/redcube-gateway/src/actions/create-topic.js \
  packages/redcube-gateway/src/actions/get-topic.js \
  packages/redcube-gateway/src/actions/get-run.js \
  packages/redcube-gateway/src/actions/run-topic-route.js
git commit -m "feat: add agent-first topic storyline vertical slice"
```

### Task 3: 暴露 MCP 入口，直接镜像 Gateway actions

**Files:**
- Create: `apps/redcube-mcp/package.json`
- Create: `apps/redcube-mcp/src/server.js`
- Test: `tests/mcp-gateway.test.js`

- [ ] **Step 1: 写失败测试，锁定 MCP tool list 与 tool call**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  callTool,
  listTools,
} from '../apps/redcube-mcp/src/server.js';

test('listTools exposes create_topic and run_topic_route gateway tools', () => {
  const tools = listTools();
  assert.ok(tools.some((tool) => tool.name === 'create_topic'));
  assert.ok(tools.some((tool) => tool.name === 'run_topic_route'));
});

test('callTool delegates to gateway createTopic', async () => {
  const result = await callTool('create_topic', {
    workspaceRoot: '/tmp/placeholder',
    topicId: 'topic-a',
    title: 'AI 工作流小红书系列',
  }, {
    createTopic: async (args) => ({ ok: true, topic: args }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.topic.topicId, 'topic-a');
});
```

- [ ] **Step 2: 跑测试，确认 MCP 服务还不存在**

Run: `node --test tests/mcp-gateway.test.js`
Expected: FAIL。

- [ ] **Step 3: 写最小 MCP server**

```js
// apps/redcube-mcp/src/server.js
import {
  createTopic,
  getRun,
  getTopic,
  runTopicRoute,
} from '../../../packages/redcube-gateway/src/index.js';

export function listTools() {
  return [
    { name: 'create_topic' },
    { name: 'get_topic' },
    { name: 'run_topic_route' },
    { name: 'get_run' },
  ];
}

export async function callTool(name, args, deps = {}) {
  const actions = {
    create_topic: deps.createTopic || createTopic,
    get_topic: deps.getTopic || getTopic,
    run_topic_route: deps.runTopicRoute || runTopicRoute,
    get_run: deps.getRun || getRun,
  };
  const action = actions[name];
  if (!action) throw new Error(`Unknown tool: ${name}`);
  return action(args);
}
```

```json
// apps/redcube-mcp/package.json
{
  "name": "@redcube/mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: 跑 MCP 测试与纵切片回归**

Run: `node --test tests/xiaohongshu-overlay.test.js tests/runtime-topic-route.test.js tests/mcp-gateway.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/mcp-gateway.test.js \
  apps/redcube-mcp/package.json \
  apps/redcube-mcp/src/server.js
git commit -m "feat: expose gateway actions via mcp"
```
