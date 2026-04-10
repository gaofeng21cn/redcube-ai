# Phase 2 Runtime Watch Locator Integrity Hardening

## 当前状态

本 tranche closeout 已完成并吸收到当前 mainline。当前仓库正式口径是：deliverable-scope run record 必须持久化 `topic_id` / `deliverable_id`，而 `runtimeWatch`、`CLI review watch`、`MCP runtime_watch` 在 quartet locator 与 run identity 不一致时必须 fail-closed。
同一主线的 prefrozen follow-on board 也已经冻结：`phase_2_family_parity_autopilot_continuation_board` 现在明确把下一棒固定为 `phase_2_family_parity_governance_surface_convergence`，因此 `OMX` 不需要在这一 tranche closeout 之后回到 “next tranche 未冻结” 的停车结论。

## 冻结目的

这条 same-mainline slice 不再讨论 operator surface 是否统一，而是继续收紧已经吸收的 operator route，把 `workspace/topic/deliverable/run` quartet locator 从“口头约定”推进到可 machine-verify 的 run-boundary truth：

- deliverable-scope run record 之前还没有把 `topic_id` / `deliverable_id` 作为 durable identity 一起落盘
- `runtimeWatch` 在提供 `workspaceRoot/topicId/deliverableId/runId` 时，之前仍可能把错误 deliverable/topic 的 run 与当前 governance surface 混拼在一起
- `CLI review watch` 与 `MCP runtime_watch` 之前还缺少 locator mismatch 的 fail-closed 行为

## 吸收结论

- `runDeliverableRoute -> startRun -> createRunRecord` 现在会把 `topic_id` / `deliverable_id` 写入 deliverable-scope run record
- `runtimeWatch` 在 persisted run 与 preloaded run 两条入口上都执行同一 quartet locator integrity rule
- `runtimeWatch` 仍然保留 deliverable-level review watch 入口：只给 `workspaceRoot/topicId/deliverableId`、不带 `runId` / `run` 时，不要求 run identity 字段
- `redcube review watch` 与 `runtime_watch` 继续通过同一个 `runtimeWatch` gateway truth 收口，并且在 locator mismatch 时返回同一类 fail-closed 错误
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 继续围绕同一 governance summaries 对齐，不把 locator integrity 修成一条平行 surface

## In scope

### 1. Run record durable identity hardening

- deliverable-scope run envelope 必须持久化 `topic_id`
- deliverable-scope run envelope 必须持久化 `deliverable_id`
- `getRun` / persisted run store 继续暴露同一 canonical run record，而不是额外发明 watch-only locator shadow

### 2. runtimeWatch quartet locator integrity

- `runtimeWatch` 在 `workspaceRoot/topicId/deliverableId/runId` 同时提供时，必须验证 resolved run 的 `topic_id` / `deliverable_id`
- `runtimeWatch` 在 `run` 作为显式 in-process 输入时，也必须 obey 同一 locator integrity rule
- `runtimeWatch` 在没有 `runId` / `run` 时，仍然必须允许 deliverable-level review watch，而不是错误要求 run identity
- 缺失或不匹配时，必须 hard fail，而不是 silent fallback

### 3. CLI / MCP fail-closed convergence

- `CLI review watch` 与 `MCP runtime_watch` 继续围绕同一 quartet locator 暴露 operator-facing watch surface
- locator mismatch 时，两条 formal entry 都必须通过 shared gateway truth 返回 fail-closed 错误

## Hard Boundaries

- 不扩展 `controller`
- 不新增 family / overlay
- 不把 `xiaohongshu` 改写成 direct-delivery
- 不推进 academic poster
- 不推进 managed web runtime / OPL federation

## 预期验证面

- `tests/runtime-protocol-workspace.test.js`
- `tests/runtime-deliverable-route.test.js`
- `tests/deliverable-review-loop.test.js`
- `tests/cli-v2-smoke.test.js`
- `tests/mcp-gateway.test.js`
- `tests/phase-2-behavior-convergence.test.js`
- `tests/source-readiness-deep-research-gate.test.js`
- `tests/direct-delivery-operator-handoff.test.js`
- `tests/direct-delivery-lifecycle-stage-summary.test.js`

## 吸收门槛

- deliverable-scope run record 稳定持久化 `topic_id` / `deliverable_id`
- `runtimeWatch` 在 quartet locator mismatch 时 fail-closed
- `CLI review watch` 与 `MCP runtime_watch` 共享同一 mismatch 行为
- governance summaries 没有因为 locator integrity hardening 出现漂移
