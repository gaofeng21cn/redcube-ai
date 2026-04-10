# Phase 2 Family Parity Governance Surface Convergence

## 当前状态

这是一条 **已冻结但尚未实现** 的 same-mainline activation package。
它在 machine-readable truth 中固定为 `truth_frozen_pending_implementation`。

它是 `phase_2_family_parity_autopilot_continuation_board` 的 same-mainline 第一条 tranche，用来接在当前 absorbed 的 `runtime watch locator integrity hardening` 之后。

## 冻结目的

当前 stable families 已经共享：

- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`
- `source_readiness_summary`
- `gate_summary`
- `operator_handoff`
- `lifecycle_stage_summary`

但它们还没有被明确冻结为：

- 一条 stable family parity governance contract
- 一条可继续支撑 Auto-only 长跑的 family-level continuation tranche

这条 activation package 要解决的是：

1. 让 `ppt_deck`、`xiaohongshu`、`poster_onepager` 在 shared governance surface 上继续对齐
2. 让 family 差异继续保留在 family boundary，而不是泄漏成 governance surface 漂移
3. 让 `OMX` 后续能在不发明新 family、不扩大 formal entry 的情况下继续推进同一主线

## In scope

### 1. Shared governance surface parity

- `deliverable create`
- `deliverable audit`
- `deliverable run`
- `review watch`
- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

这些 surface 需要围绕 stable families 保持同一治理轴，而不是 family 各说各话。

### 2. Required summaries stay explicit

当前 stable families 继续围绕同一组 shared governance summaries：

- `source_readiness_summary`
- `gate_summary`
- `operator_handoff`
- `lifecycle_stage_summary`

缺失这些 summary 时，应优先 fail-closed，而不是 silent downgrade。

### 3. Family boundary stays explicit

- `ppt_deck` 仍是 direct-delivery capable family
- `poster_onepager` 仍是 guarded knowledge-poster surface
- `xiaohongshu` 仍是 `human_publication`

family parity 只收紧 shared governance surface，不会抹平 family ontology。

## Hard Boundaries

- 不扩 `controller`
- 不新增 family / overlay
- 不把 `xiaohongshu` 改写成 direct-delivery
- 不推进 academic poster
- 不推进 managed web runtime / OPL federation

## 预期验证面

- `tests/phase-2-family-parity-governance-surface-convergence.test.js`
- `tests/deliverable-review-loop.test.js`
- `tests/runtime-deliverable-route.test.js`
- `tests/phase-2-behavior-convergence.test.js`
- `tests/mcp-gateway.test.js`
- `tests/cli-v2-smoke.test.js`
- `tests/ppt-deliverable-e2e.test.js`
- `tests/xiaohongshu-deliverable-e2e.test.js`

## 完成后允许的下一棒

只有在当前 tranche absorbed 后，且 board 仍未触发 hard boundary honest stop，才允许继续：

- `phase_2_autonomous_stop_reason_convergence`
