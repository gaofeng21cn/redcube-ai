# RedCube Multi-Overlay Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `RedCube` 从“小红书图文单用途系统”校正为“面向 Agent 的视觉交付物运行层”，并完成多 overlay、审计门控、review loop 与 host-agent runtime 主路径的整体对齐。

**Architecture:** 先收口公开叙事和设计真相源，再把 overlay 抽象从单一 `xiaohongshu` 扩大到 `xiaohongshu + ppt_deck`。随后引入显式的审计 controller、review loop 和 `host-agent executor adapter`，把“先审计、再高成本渲染/导出”的治理方式变成 runtime 的正式行为，而不是 prompt 约定。

**Tech Stack:** Node.js ESM, `node:test`, JSON canonical artifacts, CLI + MCP, host-agent executor adapters

---

## File Map

- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-04-03-redcube-agent-first-runtime-plan-index.md`
- Create: `docs/superpowers/specs/2026-04-04-redcube-visual-deliverable-runtime-design.md`
- Create: `packages/redcube-overlay-core/package.json`
- Create: `packages/redcube-overlay-core/src/index.js`
- Create: `packages/redcube-overlay-core/src/contracts.js`
- Create: `packages/redcube-overlay-core/src/registry.js`
- Create: `packages/redcube-overlay-ppt/package.json`
- Create: `packages/redcube-overlay-ppt/src/index.js`
- Create: `packages/redcube-overlay-ppt/src/contracts.js`
- Create: `packages/redcube-overlay-ppt/src/gates.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Test: `tests/overlay-registry.test.js`
- Test: `tests/ppt-overlay.test.js`
- Create: `packages/redcube-runtime/package.json`
- Create: `packages/redcube-runtime/src/index.js`
- Create: `packages/redcube-runtime/src/run-store.js`
- Create: `packages/redcube-runtime/src/event-log.js`
- Create: `packages/redcube-runtime/src/executors.js`
- Create: `packages/redcube-runtime/src/deliverable-routes.js`
- Create: `packages/redcube-runtime/src/reviews.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Create: `packages/redcube-gateway/src/actions/create-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/get-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/run-deliverable-route.js`
- Create: `packages/redcube-gateway/src/actions/get-run.js`
- Create: `packages/redcube-gateway/src/actions/audit-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/review-render-output.js`
- Create: `packages/redcube-gateway/src/actions/runtime-watch.js`
- Test: `tests/runtime-deliverable-route.test.js`
- Test: `tests/deliverable-review-loop.test.js`
- Create: `apps/redcube-mcp/package.json`
- Create: `apps/redcube-mcp/src/server.js`
- Test: `tests/mcp-gateway.test.js`

### Task 1: 重写公开叙事与计划入口

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-04-03-redcube-agent-first-runtime-plan-index.md`
- Create: `docs/superpowers/specs/2026-04-04-redcube-visual-deliverable-runtime-design.md`

- [ ] **Step 1: 改写 README，明确 Agent-first visual deliverable runtime 定位**

```md
# RedCube AI

RedCube AI 是一个面向 Agent 的视觉交付物运行层，用来稳定生产可交付的图文视觉成果。

它的正式三层结构是：

Agent -> Gateway -> Overlay -> Runtime

其中：

- `Gateway` 提供 CLI / MCP 机器接口
- `Overlay` 定义不同交付物的契约与质量 gate
- `Runtime` 负责 run ledger、event log、artifact 落盘与 executor adapter 调度

当前 overlay 主线：

- `xiaohongshu`
- `ppt_deck`
```

- [ ] **Step 2: 在计划索引中把旧 vertical slice 标记为已被多 overlay 对齐计划修订**

```md
2. [2026-04-04-redcube-multi-overlay-alignment-plan.md](...)
   - README / public narrative refresh
   - multi-overlay alignment
   - `ppt_deck overlay`
   - host-agent runtime adapter direction
```

- [ ] **Step 3: 运行文档一致性自检**

Run: `rg -n "Web UI 与 API 服务|尤其适合小红书|第一期只有一个正式 overlay" README.md docs/superpowers/specs docs/superpowers/plans`
Expected: 旧表述只出现在历史文档中，不再作为当前主线文档的最新结论。

- [ ] **Step 4: 提交**

```bash
git add README.md \
  docs/superpowers/plans/2026-04-03-redcube-agent-first-runtime-plan-index.md \
  docs/superpowers/specs/2026-04-04-redcube-visual-deliverable-runtime-design.md \
  docs/superpowers/plans/2026-04-04-redcube-multi-overlay-alignment-plan.md
git commit -m "docs: redefine redcube as visual deliverable runtime"
```

### Task 2: 建立多 overlay 公共层与 registry

**Files:**
- Create: `packages/redcube-overlay-core/package.json`
- Create: `packages/redcube-overlay-core/src/index.js`
- Create: `packages/redcube-overlay-core/src/contracts.js`
- Create: `packages/redcube-overlay-core/src/registry.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Test: `tests/overlay-registry.test.js`

- [ ] **Step 1: 写失败测试，锁定 overlay registry 与 deliverable contract**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeliverableRecord,
  createOverlayRegistry,
} from '../packages/redcube-overlay-core/src/index.js';
import { buildTopicRecord as buildXiaohongshuTopic } from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('buildDeliverableRecord emits canonical visual-deliverable metadata', () => {
  const deliverable = buildDeliverableRecord({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title: '甲状腺门诊宣教 deck',
  });

  assert.equal(deliverable.topic_id, 'topic-a');
  assert.equal(deliverable.deliverable_id, 'deck-a');
  assert.equal(deliverable.overlay, 'ppt_deck');
  assert.equal(deliverable.kind, 'ppt_deck');
  assert.equal(deliverable.status, 'draft');
});

test('createOverlayRegistry resolves registered overlays by id', () => {
  const registry = createOverlayRegistry({
    xiaohongshu: { overlayId: 'xiaohongshu', buildTopicRecord: buildXiaohongshuTopic },
  });

  assert.equal(registry.getOverlay('xiaohongshu').overlayId, 'xiaohongshu');
  assert.throws(() => registry.getOverlay('ppt_deck'), /Unknown overlay/);
});
```

- [ ] **Step 2: 跑测试，确认公共层尚未实现**

Run: `node --test tests/overlay-registry.test.js`
Expected: FAIL，报缺少 `overlay-core` 包或导出。

- [ ] **Step 3: 写最小实现**

```js
// packages/redcube-overlay-core/src/contracts.js
export function buildDeliverableRecord({
  topicId,
  deliverableId,
  overlay,
  kind,
  title,
}) {
  return {
    topic_id: String(topicId || '').trim(),
    deliverable_id: String(deliverableId || '').trim(),
    overlay: String(overlay || '').trim(),
    kind: String(kind || '').trim(),
    title: String(title || '').trim(),
    status: 'draft',
  };
}
```

```js
// packages/redcube-overlay-core/src/registry.js
export function createOverlayRegistry(overlays) {
  const table = { ...overlays };
  return {
    getOverlay(overlayId) {
      const overlay = table[overlayId];
      if (!overlay) {
        throw new Error(`Unknown overlay: ${overlayId}`);
      }
      return overlay;
    },
    listOverlays() {
      return Object.keys(table);
    },
  };
}
```

```js
// packages/redcube-overlay-xiaohongshu/src/contracts.js
export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    status: 'draft',
    routes: ['research', 'storyline', 'note'],
  };
}
```

- [ ] **Step 4: 重新跑测试**

Run: `node --test tests/overlay-registry.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/overlay-registry.test.js \
  packages/redcube-overlay-core/package.json \
  packages/redcube-overlay-core/src/index.js \
  packages/redcube-overlay-core/src/contracts.js \
  packages/redcube-overlay-core/src/registry.js \
  packages/redcube-overlay-xiaohongshu/src/contracts.js
git commit -m "feat: add overlay core registry"
```

### Task 3: 新增 `ppt_deck overlay` foundation

**Files:**
- Create: `packages/redcube-overlay-ppt/package.json`
- Create: `packages/redcube-overlay-ppt/src/index.js`
- Create: `packages/redcube-overlay-ppt/src/contracts.js`
- Create: `packages/redcube-overlay-ppt/src/gates.js`
- Test: `tests/ppt-overlay.test.js`

- [ ] **Step 1: 写失败测试，锁定 PPT deck contract 与 storyboard gate**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeckRecord,
  evaluateStoryboardGate,
} from '../packages/redcube-overlay-ppt/src/index.js';

test('buildDeckRecord emits canonical ppt deck metadata', () => {
  const deck = buildDeckRecord({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  assert.equal(deck.overlay, 'ppt_deck');
  assert.equal(deck.kind, 'ppt_deck');
  assert.equal(deck.slide_ratio, '16:9');
  assert.deepEqual(deck.routes, ['research', 'storyline', 'slides']);
});

test('buildDeckRecord rejects blank required fields', () => {
  assert.throws(
    () => buildDeckRecord({
      topicId: 'topic-a',
      deliverableId: '',
      title: '甲状腺门诊科普 deck',
    }),
    /Missing deliverable field: deliverableId/,
  );
});

test('evaluateStoryboardGate blocks empty slide list', () => {
  const report = evaluateStoryboardGate({ slides: [] });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_empty']);
});

test('evaluateStoryboardGate blocks malformed slide entries', () => {
  const report = evaluateStoryboardGate({ slides: [null, {}] });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_invalid']);
});
```

- [ ] **Step 2: 跑测试，确认 PPT overlay 尚未实现**

Run: `node --test tests/ppt-overlay.test.js`
Expected: FAIL，报缺少 `overlay-ppt` 包或导出。

- [ ] **Step 3: 写最小实现**

```js
// packages/redcube-overlay-ppt/src/contracts.js
import { buildDeliverableRecord } from '../../redcube-overlay-core/src/index.js';

export function buildDeckRecord({ topicId, deliverableId, title }) {
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title,
  });

  return {
    ...deliverable,
    slide_ratio: '16:9',
    routes: ['research', 'storyline', 'slides'],
  };
}
```

```js
// packages/redcube-overlay-ppt/src/gates.js
export function evaluateStoryboardGate({ slides }) {
  const slideList = Array.isArray(slides) ? slides : [];
  if (slideList.length === 0) {
    return {
      status: 'block',
      blockers: ['slides_empty'],
      advisories: [],
      metrics: { slide_count: 0 },
      next_action: 'rerun_storyboard',
    };
  }

  const validSlides = slideList.filter((slide) => {
    if (!slide || typeof slide !== 'object') {
      return false;
    }
    const slideId = String(slide.slide_id || '').trim();
    const title = String(slide.title || '').trim();
    return Boolean(slideId || title);
  });

  if (validSlides.length !== slideList.length) {
    return {
      status: 'block',
      blockers: ['slides_invalid'],
      advisories: [],
      metrics: { slide_count: validSlides.length },
      next_action: 'rerun_storyboard',
    };
  }

  return {
    status: 'pass',
    blockers: [],
    advisories: [],
    metrics: { slide_count: validSlides.length },
    next_action: 'continue',
  };
}
```

- [ ] **Step 4: 重新跑测试**

Run: `node --test tests/ppt-overlay.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/ppt-overlay.test.js \
  packages/redcube-overlay-ppt/package.json \
  packages/redcube-overlay-ppt/src/index.js \
  packages/redcube-overlay-ppt/src/contracts.js \
  packages/redcube-overlay-ppt/src/gates.js
git commit -m "feat: add ppt deck overlay foundation"
```

### Task 4: 建立审计门控与 review loop foundation

**Files:**
- Create: `packages/redcube-runtime/package.json`
- Create: `packages/redcube-runtime/src/index.js`
- Create: `packages/redcube-runtime/src/reviews.js`
- Modify: `packages/redcube-gateway/package.json`
- Create: `packages/redcube-gateway/src/actions/audit-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/review-render-output.js`
- Create: `packages/redcube-gateway/src/actions/runtime-watch.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Test: `tests/deliverable-review-loop.test.js`

- [ ] **Step 1: 写失败测试，锁定 preflight audit、render review 与 baseline 对照**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  auditDeliverable,
  reviewRenderOutput,
} from '../packages/redcube-gateway/src/index.js';

test('auditDeliverable blocks optimize_existing task without baseline', async () => {
  const report = await auditDeliverable({
    overlay: 'ppt_deck',
    mode: 'optimize_existing',
    baselineDeliverableId: '',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_missing']);
});

test('reviewRenderOutput emits rerun target when visual density is too high', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: { visual_density_ok: false, overflow_free: true },
  });

  assert.equal(report.status, 'block');
  assert.equal(report.rerun_from_stage, 'visual_direction');
});

test('reviewRenderOutput reports missing visual density check separately', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: {},
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_check_missing']);
  assert.equal(report.rerun_from_stage, 'render_review');
});

test('@redcube/gateway manifest declares runtime dependency for review loop actions', () => {
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );
  const runtimePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'),
  );

  assert.equal(
    gatewayPackageJson.dependencies?.['@redcube/runtime'],
    runtimePackageJson.version,
  );
});
```

- [ ] **Step 2: 跑测试，确认 review loop foundation 尚未实现**

Run: `node --test tests/deliverable-review-loop.test.js`
Expected: FAIL，报缺少 action 或 review module。

- [ ] **Step 3: 写最小实现**

```js
// packages/redcube-runtime/package.json
{
  "name": "@redcube/runtime",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  }
}
```

```js
// packages/redcube-runtime/src/index.js
export {
  auditDeliverableRequest,
  reviewRenderedDeliverable,
  watchRuntimeReviewLoop,
} from './reviews.js';
```

```js
// packages/redcube-runtime/src/reviews.js
export function auditDeliverableRequest({ mode, baselineDeliverableId }) {
  if (mode === 'optimize_existing' && !String(baselineDeliverableId || '').trim()) {
    return {
      status: 'block',
      issues: ['baseline_missing'],
      rerun_from_stage: 'intake',
      recommended_action: 'bind_baseline_deliverable',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function reviewRenderedDeliverable({ checks }) {
  if (!Object.hasOwn(checks || {}, 'visual_density_ok')) {
    return {
      status: 'block',
      issues: ['visual_density_check_missing'],
      rerun_from_stage: 'render_review',
      recommended_action: 'supply_render_checks',
    };
  }

  if (!checks.visual_density_ok) {
    return {
      status: 'block',
      issues: ['visual_density_too_high'],
      rerun_from_stage: 'visual_direction',
      recommended_action: 'revise_visual_direction',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function watchRuntimeReviewLoop({ run }) {
  const pendingReviews = Array.isArray(run?.pending_reviews)
    ? run.pending_reviews.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    ok: true,
    run_id: String(run?.run_id || '').trim(),
    current_stage: String(run?.current_stage || '').trim() || null,
    status: pendingReviews.length > 0 ? 'review_pending' : String(run?.status || 'idle'),
    pending_reviews: pendingReviews,
    resumable: Boolean(run?.resumable),
  };
}
```

```json
// packages/redcube-gateway/package.json
{
  "dependencies": {
    "@redcube/runtime": "0.1.0",
    "@redcube/runtime-protocol": "0.1.0"
  }
}
```

- [ ] **Step 4: 重新跑测试**

Run: `node --test tests/deliverable-review-loop.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/deliverable-review-loop.test.js \
  packages/redcube-runtime/src/reviews.js \
  packages/redcube-gateway/src/actions/audit-deliverable.js \
  packages/redcube-gateway/src/actions/review-render-output.js \
  packages/redcube-gateway/src/actions/runtime-watch.js \
  packages/redcube-gateway/src/index.js
git commit -m "feat: add deliverable audit and review loop foundation"
```

### Task 5: 建立 host-agent executor 为主路径的 runtime 纵切片

**Files:**
- Create: `packages/redcube-runtime/package.json`
- Create: `packages/redcube-runtime/src/index.js`
- Create: `packages/redcube-runtime/src/run-store.js`
- Create: `packages/redcube-runtime/src/event-log.js`
- Create: `packages/redcube-runtime/src/executors.js`
- Create: `packages/redcube-runtime/src/deliverable-routes.js`
- Create: `packages/redcube-runtime/src/reviews.js`
- Create: `packages/redcube-gateway/src/actions/create-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/get-deliverable.js`
- Create: `packages/redcube-gateway/src/actions/run-deliverable-route.js`
- Create: `packages/redcube-gateway/src/actions/get-run.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Test: `tests/runtime-deliverable-route.test.js`

- [ ] **Step 1: 写失败测试，锁定 `create_deliverable -> run_deliverable_route -> get_run`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  createDeliverable,
  getRun,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

test('runDeliverableRoute uses host-agent executor by default', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });

  assert.equal(result.ok, true);
  assert.equal(result.run.executor.adapter, 'host_agent');
  assert.equal(result.run.status, 'completed');

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.run.executor.adapter, 'host_agent');
});
```

- [ ] **Step 2: 跑测试，确认 runtime 尚未实现**

Run: `node --test tests/runtime-deliverable-route.test.js`
Expected: FAIL，报缺少 gateway action 或 runtime 导出。

- [ ] **Step 3: 写最小实现，建立统一 executor contract**

```js
// packages/redcube-runtime/src/executors.js
export function resolveExecutorAdapter({ adapter = 'host_agent' } = {}) {
  if (adapter !== 'host_agent' && adapter !== 'external_llm') {
    throw new Error(`Unsupported executor adapter: ${adapter}`);
  }

  return {
    adapter,
    async runRoute({ overlay, route, topicId, deliverableId }) {
      return {
        overlay,
        route,
        topic_id: topicId,
        deliverable_id: deliverableId,
        produced_at: new Date().toISOString(),
      };
    },
  };
}
```

- [ ] **Step 4: 重新跑测试**

Run: `node --test tests/runtime-deliverable-route.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/runtime-deliverable-route.test.js \
  packages/redcube-runtime/package.json \
  packages/redcube-runtime/src/index.js \
  packages/redcube-runtime/src/run-store.js \
  packages/redcube-runtime/src/event-log.js \
  packages/redcube-runtime/src/executors.js \
  packages/redcube-runtime/src/deliverable-routes.js \
  packages/redcube-gateway/src/actions/create-deliverable.js \
  packages/redcube-gateway/src/actions/get-deliverable.js \
  packages/redcube-gateway/src/actions/run-deliverable-route.js \
  packages/redcube-gateway/src/actions/get-run.js \
  packages/redcube-gateway/src/index.js
git commit -m "feat: add host-agent runtime vertical slice"
```

### Task 6: 通过 MCP 暴露 Gateway action

**Files:**
- Create: `apps/redcube-mcp/package.json`
- Create: `apps/redcube-mcp/src/server.js`
- Test: `tests/mcp-gateway.test.js`

- [ ] **Step 1: 写失败测试，锁定 MCP 工具镜像 Gateway action**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { listGatewayTools } from '../apps/redcube-mcp/src/server.js';

test('listGatewayTools exposes deliverable-centric actions', () => {
  const tools = listGatewayTools();
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['doctor', 'list_topics', 'create_deliverable', 'get_deliverable', 'audit_deliverable', 'review_render_output', 'run_deliverable_route', 'get_run', 'runtime_watch'],
  );
});
```

- [ ] **Step 2: 跑测试，确认 MCP 入口尚未实现**

Run: `node --test tests/mcp-gateway.test.js`
Expected: FAIL，报缺少 MCP server。

- [ ] **Step 3: 写最小实现**

```js
// apps/redcube-mcp/src/server.js
export function listGatewayTools() {
  return [
    { name: 'doctor' },
    { name: 'list_topics' },
    { name: 'create_deliverable' },
    { name: 'get_deliverable' },
    { name: 'audit_deliverable' },
    { name: 'review_render_output' },
    { name: 'run_deliverable_route' },
    { name: 'get_run' },
    { name: 'runtime_watch' },
  ];
}
```

- [ ] **Step 4: 重新跑测试**

Run: `node --test tests/mcp-gateway.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/mcp-gateway.test.js \
  apps/redcube-mcp/package.json \
  apps/redcube-mcp/src/server.js
git commit -m "feat: add mcp gateway surface"
```
