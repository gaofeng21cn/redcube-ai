# Phase 2 Direct-Delivery Operator Handoff Hardening

日期锚点：`2026-04-08`

这份文档记录的是同一主线上的下一条 hardening tranche：

- `direct-delivery operator handoff hardening`

它不是：

- `controller` 已经成为正式入口的证明
- academic poster contract 已经正式打开
- `RedCube AI` 的全部长期目标

## 冻结结论

- `ppt_deck` 与 guarded `poster_onepager` 必须在 hydrated `delivery_contract` 中显式冻结 `operator_handoff` 机器可读语义
- `operator_handoff` 必须说明：谁拥有 `delivery_state`、哪一组 gate surfaces 决定 handoff 是否真的 ready、direct-delivery 允许哪些 reopen / closeout mutation surfaces
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 必须对同一个 deliverable/topic 输出同一份 `operator_handoff` 语义，而不是各自再推一套 handoff 结论
- `xiaohongshu` 继续保留 `human_publication` 语义，只作为对照面，不得被误写成 direct-delivery
- formal entry 仍只有 `MCP / CLI`

## 当前结论

- 这条 tranche 已完成 closeout，并吸收到当前 mainline
- direct-delivery `operator_handoff` 现在已在 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 上保持同一 deliverable/topic 语义
- 下一棒如果还要继续，必须先证明新的 same-mainline tranche 能在当前 hard boundary 内被诚实冻结

## 这条 tranche 实际收紧了什么

### 1. Shared direct-delivery operator_handoff contract

direct-delivery families 的 hydrated `delivery_contract` 需要显式暴露：

- `operator_handoff.owner_surface`
- `operator_handoff.handoff_ready_state`
- `operator_handoff.gate_surfaces`
- `operator_handoff.reopen_mutation_surface`
- `operator_handoff.closeout_mutation_surface`

当前冻结口径：

- `owner_surface = required_export_artifact.delivery_state`
- `handoff_ready_state = output_ready`
- `gate_surfaces = auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection`
- `reopen_mutation_surface = request_changes`
- `closeout_mutation_surface = promote_baseline`

### 2. delivery_state ownership and gate semantics stay separate but aligned

这条 tranche 不把 `delivery_state` 偷换成 topic projection 或 review mutation 自身。

相反，它要求同时保留两层真相：

- `delivery_state` 继续由 required export artifact 持有
- handoff gate 是否真的 ready，继续由同一 deliverable/topic canonical governance path 决定

因此 direct-delivery deliverable 即使已经 `output_ready`，只要 source readiness 或 review gate 仍未诚实通过，`operator_handoff.gate_status` 也必须继续反映 `blocked`。

### 3. One shared operator-facing summary across the four governance surfaces

以下四个 surface 必须暴露同一份 `operator_handoff` 结论：

- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

至少要对齐：

- `gate_status`
- `blocking_reasons`
- `delivery_state_owner`
- `required_export_route`
- `required_export_bundle_id`
- `canonical_export_artifact`
- `delivery_state_current`
- `delivery_state_next`
- `reopen_mutation_surface`
- `closeout_mutation_surface`

### 4. Human publication stays explicit and separate

- `ppt_deck`：direct delivery
- `poster_onepager`：direct delivery，但仍保持 guarded knowledge-poster 边界
- `xiaohongshu`：explicit human publication

这表示当前 tranche 是在 direct-delivery family 上继续收紧 operator handoff，
不是把 human publication 与 direct delivery 混成一套模糊 closeout 叙事。

## 最小验证面

- `contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json`
- `tests/phase-2-direct-delivery-operator-handoff-hardening.test.js`
- `tests/direct-delivery-operator-handoff.test.js`
- `tests/profile-contract-hydration.test.js`
- `tests/review-platform.test.js`
- `tests/deliverable-review-loop.test.js`

## 吸收后继续判断

- 如果同一主线还能在当前 hard boundary 内诚实冻结下一条 tranche，就继续自动推进
- 如果再往前会开始编故事、重写 formal entry、扩 family / academic poster / controller，就必须停车
