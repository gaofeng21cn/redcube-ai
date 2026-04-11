# Phase 2 Direct-Delivery Lifecycle Stage Convergence

日期锚点：`2026-04-09`

这份文档记录的是同一主线上的下一条 hardening tranche：

- `direct-delivery lifecycle stage convergence`

它不是：

- 当前 repo truth 已经自动完成全部未来工作线的证明
- `controller` 已经成为正式入口的证明
- `xiaohongshu` 已被改写成 direct-delivery 的证明
- academic poster contract 已经正式打开的证明

## 当前冻结结论

- `ppt_deck` 与 guarded `poster_onepager` 需要显式冻结一份 machine-readable `lifecycle_stage_contract`
- 这份 contract 只做一件事：把人类工作线 `Source Readiness -> Storyline -> Plan -> Visual -> Delivery` 与当前 policy 的宏观生命周期严格对齐
- `Storyline + Plan` 仍映射到 `Story Architecture`
- `Visual` 仍映射到 `Visual Authorship`
- `Delivery` 仍映射到 `Delivery Packaging`
- `operator_handoff / closeout` 仍属于 `Delivery`，不是第六步
- `visual_director_review / screenshot_review` 仍属于 `Visual` 内部的 review overlay，不另起一步
- `xiaohongshu` 继续保持 explicit human publication 对照面，不得借此改写成 direct-delivery

## 当前结论

- 这条 tranche 已完成 closeout，并吸收到当前 mainline
- direct-delivery family 现在会在 hydrated contract 中暴露 machine-readable `lifecycle_stage_contract`
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 现在会暴露同一份 `lifecycle_stage_summary`
- `xiaohongshu` 继续保持 explicit human publication 对照面，不暴露 direct-delivery lifecycle summary

## In scope

### 1. Shared direct-delivery lifecycle stage contract

direct-delivery family 需要在 hydrated contract 中冻结：

- `lifecycle_stage_contract.stage_model = direct_delivery_human_workline`
- `lifecycle_stage_contract.human_workline = [source_readiness, storyline, plan, visual, delivery]`
- `lifecycle_stage_contract.human_to_macro_stage.storyline = story_architecture`
- `lifecycle_stage_contract.human_to_macro_stage.plan = story_architecture`
- `lifecycle_stage_contract.human_to_macro_stage.visual = visual_authorship`
- `lifecycle_stage_contract.human_to_macro_stage.delivery = delivery_packaging`
- `lifecycle_stage_contract.review_overlay_within = visual`
- `lifecycle_stage_contract.operator_handoff_within = delivery`
- `lifecycle_stage_contract.closeout_within = delivery`

### 2. Family-specific route bridge without rewriting policy names

- `ppt_deck`
  - `storyline -> storyline`
  - `detailed_outline / slide_blueprint -> plan`
  - `visual_direction / render_html / visual_director_review / screenshot_review -> visual`
  - `export_pptx -> delivery`
- guarded `poster_onepager`
  - `storyline -> storyline`
  - `poster_blueprint -> plan`
  - `visual_direction / render_html / visual_director_review / screenshot_review -> visual`
  - `export_bundle -> delivery`

### 3. One aligned runtime summary across governance surfaces

以下四个 surface 需要暴露同一份 `lifecycle_stage_summary`：

- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

它们至少要对齐：

- `stage_model`
- `human_workline`
- `human_to_macro_stage`
- `review_overlay_within`
- `operator_handoff_within`
- `closeout_within`
- family-specific `route_to_human_stage`

## Out of scope

- `controller expansion`
- 把 `xiaohongshu` 改写成 direct-delivery
- `paper_poster / conference_poster` academic poster contract advancement
- new family / overlay expansion
- managed web runtime migration
- hidden fallback chains as main behavior
- 用 prompt patch 替代 contract hydration

## 最小验证面

- `contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json`
- `tests/phase-2-direct-delivery-lifecycle-stage-convergence.test.js`
- `tests/profile-contract-hydration.test.js`
- `tests/direct-delivery-lifecycle-stage-summary.test.js`
- `tests/direct-delivery-operator-handoff.test.js`

## 吸收门槛

只有同时满足以下条件，才允许 absorbed：

- direct-delivery family 的 hydrated contract 已有 `lifecycle_stage_contract`
- gateway / governance surfaces 已对齐 `lifecycle_stage_summary`
- `current-program.json` 没有被 future-facing 文档误写
- `xiaohongshu` 仍保持 explicit human publication
- fresh verification 全部通过
