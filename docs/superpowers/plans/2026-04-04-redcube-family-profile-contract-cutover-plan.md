# RedCube Family/Profile Contract Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把冻结的 `overlay family -> profile pack -> deliverable contract` 设计切到 gateway/runtime 主线，让 `create_deliverable`、`run_deliverable_route`、审计与 review 都围绕机器可读 hydrated contract 运作，而不是围绕模糊 overlay/prompt 语义运作。

**Architecture:** `overlay-core` 提供 family/profile 合同注册、水合与校验原语；`ppt_deck` 和 `xiaohongshu` 作为共享 runtime 的 family 实现各自 profile 规则；`gateway` 负责验证 `overlay + profile_id + goal` 并持久化 hydrated deliverable contract；`runtime` 只执行已经解析完成的 stage/review/layout/baseline/export 合同，并把执行证据、审计决策与 review loop 落盘。

**Tech Stack:** Node.js ESM, `node:test`, JSON canonical artifacts, CLI + MCP, host-agent executor adapter

---

## File Map

- Modify: `packages/redcube-overlay-core/src/contracts.js`
- Modify: `packages/redcube-overlay-core/src/registry.js`
- Modify: `packages/redcube-overlay-core/src/index.js`
- Modify: `packages/redcube-overlay-ppt/src/contracts.js`
- Modify: `packages/redcube-overlay-ppt/src/gates.js`
- Modify: `packages/redcube-overlay-ppt/src/surface.js`
- Create: `packages/redcube-overlay-ppt/src/profiles.js`
- Modify: `packages/redcube-overlay-ppt/src/index.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/index.js`
- Modify: `packages/redcube-gateway/src/actions/create-deliverable.js`
- Modify: `packages/redcube-gateway/src/actions/get-deliverable.js`
- Modify: `packages/redcube-gateway/src/actions/run-deliverable-route.js`
- Modify: `packages/redcube-gateway/src/actions/audit-deliverable.js`
- Modify: `packages/redcube-gateway/src/actions/review-render-output.js`
- Modify: `packages/redcube-gateway/src/actions/runtime-watch.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Modify: `packages/redcube-runtime/src/deliverable-routes.js`
- Modify: `packages/redcube-runtime/src/executors.js`
- Modify: `packages/redcube-runtime/src/reviews.js`
- Modify: `apps/redcube-mcp/src/server.js`
- Modify: `apps/redcube-cli/src/cli.js`
- Test: `tests/overlay-registry.test.js`
- Test: `tests/ppt-overlay.test.js`
- Test: `tests/ppt-deliverable-surface.test.js`
- Test: `tests/runtime-deliverable-route.test.js`
- Test: `tests/deliverable-review-loop.test.js`
- Test: `tests/mcp-gateway.test.js`
- Create: `tests/profile-contract-hydration.test.js`

### Task 1: 建立 family/profile 合同原语与 registry 主线

**Files:**
- Modify: `packages/redcube-overlay-core/src/contracts.js`
- Modify: `packages/redcube-overlay-core/src/registry.js`
- Modify: `packages/redcube-overlay-core/src/index.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/contracts.js`
- Modify: `packages/redcube-overlay-xiaohongshu/src/index.js`
- Test: `tests/overlay-registry.test.js`
- Create: `tests/profile-contract-hydration.test.js`

- [ ] **Step 1: 先写失败测试，锁定 registry 现在必须解析 family/profile 合同**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createOverlayRegistry,
  hydrateDeliverableContract,
} from '../packages/redcube-overlay-core/src/index.js';
import { pptDeckOverlay } from '../packages/redcube-overlay-ppt/src/index.js';
import { xiaohongshuOverlay } from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('createOverlayRegistry resolves family and profile metadata', () => {
  const registry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });

  assert.equal(registry.getOverlay('ppt_deck').overlayId, 'ppt_deck');
  assert.deepEqual(
    registry.listProfiles('ppt_deck'),
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
  );
  assert.deepEqual(registry.listProfiles('xiaohongshu'), ['standard_note']);
});

test('hydrateDeliverableContract rejects unknown profile_id for a family', () => {
  const registry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
  });

  assert.throws(
    () => hydrateDeliverableContract(registry, {
      overlay: 'ppt_deck',
      profileId: 'not-exist',
      deliverableId: 'deck-a',
      topicId: 'topic-a',
      goal: '为本科生做甲状腺基础教学 deck',
    }),
    /Unknown profile_id for overlay ppt_deck: not-exist/,
  );
});
```

- [ ] **Step 2: 跑测试，确认当前公共层还没有 family/profile hydration 能力**

Run: `node --test tests/overlay-registry.test.js tests/profile-contract-hydration.test.js`
Expected: FAIL，报缺少 `hydrateDeliverableContract`、`listProfiles` 或 overlay profile 定义。

- [ ] **Step 3: 写最小实现，新增 family/profile hydration 原语**

实现要求：
- `overlay-core` 提供 `hydrateDeliverableContract(registry, request)`
- hydrated contract 至少包含：`overlay`、`profile_id`、`goal`、`deliverable_kind`、`stage_sequence`、`review_surface`、`layout_rules`、`baseline_policy`、`export_bundle`
- `xiaohongshu` 也必须给出一个显式默认 profile：`standard_note`

- [ ] **Step 4: 重新跑测试，确认 family/profile 合同已经进入主线**

Run: `node --test tests/overlay-registry.test.js tests/profile-contract-hydration.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add \
  packages/redcube-overlay-core/src/contracts.js \
  packages/redcube-overlay-core/src/registry.js \
  packages/redcube-overlay-core/src/index.js \
  packages/redcube-overlay-xiaohongshu/src/contracts.js \
  packages/redcube-overlay-xiaohongshu/src/index.js \
  tests/overlay-registry.test.js \
  tests/profile-contract-hydration.test.js
git commit
```

### Task 2: 把 `ppt_deck` 四类 profile pack 变成明确 hydration 结果

**Files:**
- Create: `packages/redcube-overlay-ppt/src/profiles.js`
- Modify: `packages/redcube-overlay-ppt/src/contracts.js`
- Modify: `packages/redcube-overlay-ppt/src/gates.js`
- Modify: `packages/redcube-overlay-ppt/src/surface.js`
- Modify: `packages/redcube-overlay-ppt/src/index.js`
- Test: `tests/ppt-overlay.test.js`
- Test: `tests/ppt-deliverable-surface.test.js`

- [ ] **Step 1: 先写失败测试，锁定四类 profile 的 gate/review/layout/export 差异**

```js
test('ppt_deck hydration includes lecture_student teaching gates', () => {
  const contract = hydratePptDeckContract({
    profileId: 'lecture_student',
    goal: '为本科生讲授甲状腺结节基础知识',
  });

  assert.equal(contract.profile_id, 'lecture_student');
  assert.equal(contract.review_surface.required_checks.includes('term_explained_on_first_use'), true);
  assert.equal(contract.layout_rules.density_mode, 'teaching_spread');
  assert.equal(contract.export_bundle.bundle_id, 'lecture_student_bundle');
});

test('ppt_deck hydration includes executive_briefing decision-first gates', () => {
  const contract = hydratePptDeckContract({
    profileId: 'executive_briefing',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  assert.equal(contract.review_surface.required_checks.includes('decision_implication_clear'), true);
  assert.equal(contract.layout_rules.max_primary_points_per_slide, 3);
  assert.equal(contract.export_bundle.include_presenter_notes, false);
});
```

- [ ] **Step 2: 跑测试，确认 `ppt_deck` 当前只提供 family 基础面，尚无 profile 差异**

Run: `node --test tests/ppt-overlay.test.js tests/ppt-deliverable-surface.test.js`
Expected: FAIL，profile-specific contract 字段不存在或值不正确。

- [ ] **Step 3: 实现最小 profile hydration**

实现要求：
- `ppt_deck` family 基础合同与 profile override 分离
- 四类 profile 必须至少覆盖：`review_surface`、`layout_rules`、`baseline_policy`、`export_bundle`
- hydration 结果写成统一对象，再由 surface 文件输出，不允许只在 prompt 注释里表达差异

- [ ] **Step 4: 重新跑测试，确认四类 profile 差异已经机器可读**

Run: `node --test tests/ppt-overlay.test.js tests/ppt-deliverable-surface.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add \
  packages/redcube-overlay-ppt/src/profiles.js \
  packages/redcube-overlay-ppt/src/contracts.js \
  packages/redcube-overlay-ppt/src/gates.js \
  packages/redcube-overlay-ppt/src/surface.js \
  packages/redcube-overlay-ppt/src/index.js \
  tests/ppt-overlay.test.js \
  tests/ppt-deliverable-surface.test.js
git commit
```

### Task 3: 让 gateway 正式接受并验证 `overlay + profile_id + goal`

**Files:**
- Modify: `packages/redcube-gateway/src/actions/create-deliverable.js`
- Modify: `packages/redcube-gateway/src/actions/get-deliverable.js`
- Modify: `packages/redcube-gateway/src/index.js`
- Test: `tests/runtime-deliverable-route.test.js`
- Test: `tests/mcp-gateway.test.js`

- [ ] **Step 1: 先写失败测试，锁定 gateway 输入和 deliverable metadata**

```js
test('createDeliverable persists overlay profile and hydrated contract reference', async () => {
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  assert.equal(created.deliverable.profile_id, 'lecture_student');
  assert.equal(created.deliverable.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(created.deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
});

test('createDeliverable rejects profile that does not belong to overlay family', async () => {
  await assert.rejects(
    () => createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    }),
    /Unknown profile_id for overlay ppt_deck: standard_note/,
  );
});
```

- [ ] **Step 2: 跑测试，确认 gateway 还没接入 profile validation 和 hydrated contract 持久化**

Run: `node --test tests/runtime-deliverable-route.test.js tests/mcp-gateway.test.js`
Expected: FAIL，`profileId` / `goal` 未落盘或未校验。

- [ ] **Step 3: 实现最小 gateway cutover**

实现要求：
- `createDeliverable` 正式接受 `overlay`、`profileId`、`goal`
- 通过 overlay registry 完成 family/profile 校验与 hydration
- deliverable metadata 必须写入：`profile_id`、`goal`、`deliverable_kind`、`hydrated_contract_ref`
- hydration 结果落盘到 `contracts/hydrated-deliverable.json`
- MCP schema 同步更新，不能继续把 `create_deliverable` 定义成“只有 overlay + title”

- [ ] **Step 4: 重新跑测试，确认 gateway 已切到 profile-aware 主线**

Run: `node --test tests/runtime-deliverable-route.test.js tests/mcp-gateway.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add \
  packages/redcube-gateway/src/actions/create-deliverable.js \
  packages/redcube-gateway/src/actions/get-deliverable.js \
  packages/redcube-gateway/src/index.js \
  apps/redcube-mcp/src/server.js \
  tests/runtime-deliverable-route.test.js \
  tests/mcp-gateway.test.js
git commit
```

### Task 4: 让 runtime 执行 hydrated deliverable contract，而不是裸 route 名称

**Files:**
- Modify: `packages/redcube-runtime/src/deliverable-routes.js`
- Modify: `packages/redcube-runtime/src/executors.js`
- Test: `tests/runtime-deliverable-route.test.js`

- [ ] **Step 1: 先写失败测试，锁定 runtime 会读取 hydrated contract 并限制 stage execution**

```js
test('runDeliverableRoute executes hydrated contract stage instead of loose prompt route', async () => {
  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });

  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.contract.profile_id, 'lecture_student');
  assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(artifact.stage_contract.stage_id, 'storyline');
});

test('runDeliverableRoute rejects route not declared by hydrated contract', async () => {
  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'publish_live',
    }),
    /Route publish_live is not declared by hydrated deliverable contract/,
  );
});
```

- [ ] **Step 2: 跑测试，确认 runtime 还只按 route string 驱动执行**

Run: `node --test tests/runtime-deliverable-route.test.js`
Expected: FAIL，artifact 中缺少 hydrated contract / stage contract，或错误消息不匹配。

- [ ] **Step 3: 写最小实现**

实现要求：
- runtime 读取 `contracts/hydrated-deliverable.json`
- 只允许执行 contract 声明过的 stage
- executor 输入必须包含 hydrated contract 与当前 stage contract
- artifact 输出保留 `contract`、`stage_contract`、`executor.adapter`，便于审计

- [ ] **Step 4: 重新跑测试，确认 runtime 主线已经 contract-driven**

Run: `node --test tests/runtime-deliverable-route.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add \
  packages/redcube-runtime/src/deliverable-routes.js \
  packages/redcube-runtime/src/executors.js \
  tests/runtime-deliverable-route.test.js
git commit
```

### Task 5: 把 profile-specific 审计 / review / baseline / export 决策接进 gateway/runtime

**Files:**
- Modify: `packages/redcube-gateway/src/actions/audit-deliverable.js`
- Modify: `packages/redcube-gateway/src/actions/review-render-output.js`
- Modify: `packages/redcube-gateway/src/actions/runtime-watch.js`
- Modify: `packages/redcube-runtime/src/reviews.js`
- Test: `tests/deliverable-review-loop.test.js`
- Test: `tests/ppt-deliverable-surface.test.js`

- [ ] **Step 1: 先写失败测试，锁定 baseline policy 与 profile-specific review checks**
- [ ] **Step 2: 跑失败测试，确认现有 review loop 仍是固定逻辑**
- [ ] **Step 3: 让 audit/review/runtime_watch 从 hydrated contract 读取 required checks、baseline policy、export gate**
- [ ] **Step 4: 重新跑测试并确认通过**

Run: `node --test tests/deliverable-review-loop.test.js tests/ppt-deliverable-surface.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add \
  packages/redcube-gateway/src/actions/audit-deliverable.js \
  packages/redcube-gateway/src/actions/review-render-output.js \
  packages/redcube-gateway/src/actions/runtime-watch.js \
  packages/redcube-runtime/src/reviews.js \
  tests/deliverable-review-loop.test.js \
  tests/ppt-deliverable-surface.test.js
git commit
```

### Task 6: 收口 CLI/MCP 与 legacy 主线，删除 UI/Workbench 依赖约束

**Files:**
- Modify: `apps/redcube-cli/src/cli.js`
- Modify: `apps/redcube-mcp/src/server.js`
- Delete or stop referencing: `apps/redcube-web/**`（当且仅当无测试再依赖）
- Test: `tests/cli-v2-smoke.test.js`
- Test: `tests/mcp-gateway.test.js`

- [ ] **Step 1: 先写失败测试，锁定 CLI/MCP 暴露 deliverable-centric + profile-aware surface**
- [ ] **Step 2: 跑失败测试，确认 CLI 仍有 legacy workbench/runtime fallback surface**
- [ ] **Step 3: 删掉不再服务主线的 legacy web/workbench 入口约束**
- [ ] **Step 4: 重新跑测试并确认通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit
```

## Self-Review

- 这个计划覆盖了冻结设计中最核心的切换：`family/profile/contract hydration`、`gateway validation`、`runtime contract execution`、`review/baseline/export linkage`、`legacy 主线剥离`。
- 未把 `apps/redcube-web` 的删除塞进第一个代码里程碑；先把 runtime 主线切正，再做清理，避免 shared runtime 还没立稳就开始大面积删旧层。
- 所有实现任务都按 TDD 和频繁提交拆分；每个阶段都有独立可验证命令，符合当前用户对“稳定里程碑”的要求。
