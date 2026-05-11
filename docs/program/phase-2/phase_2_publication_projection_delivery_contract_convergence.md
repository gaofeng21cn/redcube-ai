# Phase 2 Publication Projection Delivery Contract Convergence

日期锚点：`2026-04-08`

生命周期说明：本文是已吸收的 Phase 2 delivery/projection hardening brief，保留为 contract-linked provenance。当前 publication projection 与 delivery contract truth 以 RCA-owned governance surfaces、`docs/delivery/`、`docs/status.md` 与 runtime-program contracts 为准。

这份文档记录的是同一主线上的下一条 hardening tranche：

- `publication projection / delivery contract convergence`

它不是：

- `controller` 已经成为正式入口的证明
- academic poster contract 已经正式打开
- `RedCube AI` 的全部长期目标

## 当前结论

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 现在都必须在 hydrated deliverable contract 中显式暴露 `delivery_contract`
- `publication-state.json` 继续保留为 topic 级 canonical projection artifact，但其 entry model 现在必须对齐 hydrated `delivery_contract` 与 canonical `review_state`
- `xiaohongshu` 继续保留显式 human publication gate
- `ppt_deck` 与 `poster_onepager` 保持 direct-delivery 语义，不偷渡 `approve_publish / promote_publish`
- formal entry 仍只有 `MCP / CLI`

## 这条 tranche 实际收紧了什么

### 1. Shared delivery_contract surface

每个 hydrated deliverable contract 都应显式暴露：

- `delivery_contract`

它至少冻结：

- authoritative projection surface = `getPublicationProjection`
- authoritative review surface = `getReviewState`
- `required_export_route`
- `required_export_bundle_id`
- `projection_model`
- `human_gate`
- `projection_states`

### 2. Topic publication projection now aligns to hydrated contracts

`topics/<topic>/publication-state.json` 继续是 canonical projection artifact，
但它不再只隐含 `xiaohongshu publish_state`。

它必须收口到同一组 entry fields：

- `deliverable_id`
- `overlay`
- `profile_id`
- `projection_model`
- `current`
- `next`
- `current_status`
- `ready_for_export`
- `approval_status`
- `approval_required`
- `required_export_route`
- `required_export_bundle_id`
- `delivery_state`

### 3. Direct delivery and human publication stay distinct but governed

- `ppt_deck`：`export_pptx`，direct delivery
- `xiaohongshu`：`export_bundle` + explicit human publication mutations
- `poster_onepager`：`export_bundle`，direct delivery

这表示三条 family 的 delivery semantics 已经被 machine-readable contract 明确化，
而不是继续散落在 family-local 推断里。

### 4. Governance summary must stay aligned

`runtimeWatch` 与 `auditDeliverable` 必须围绕同一 hydrated delivery path 输出：

- `required_export_route`
- `required_export_bundle_id`
- `approval_required`
- `delivery_projection_current`
- `delivery_projection_next`

## 最小 closeout evidence

- `contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json`
- `tests/phase-2-publication-projection-delivery-contract-convergence.test.ts`
- `tests/publication-projection-delivery-contract.test.ts`
- `tests/review-platform.test.ts`
- `tests/deliverable-review-loop.test.ts`

## 下一候选 tranche

- `phase_2_direct_delivery_operator_handoff_hardening`

它的意义是：

- 在 direct-delivery families 已经 output-ready 之后，继续冻结 operator handoff / closeout mutation surface
- 不把当前 absorbed tranche 误写成全部终点
