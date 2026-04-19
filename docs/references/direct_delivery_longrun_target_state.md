# Direct-Delivery Longrun Target State

日期锚点：`2026-04-09`

这份参考文档定义的是 **future-facing** 的 direct-delivery longrun target。

这份 future-facing 目标态文档不是当前 repo truth 的改写。

它只回答一个问题：

- 在 `RedCube AI` 当前主线真相不变的前提下，
- 如果未来还要继续沿同一主线收紧 direct-delivery，
- 从 `Source Readiness` 一直到 `operator_handoff / closeout` 的完整理想状态应该如何被定义

这份文档 **不是**：

- 当前 repo truth 的改写
- `contracts/runtime-program/current-program.json` 需要立刻切到新 baton 的证明
- 已 absorbed 的 `phase_2_direct_delivery_lifecycle_stage_convergence` 需要被重写的证明
- `controller` 已成为独立公开正式入口的证明
- `xiaohongshu` 已被改写成 direct-delivery family 的证明
- academic poster contract 已正式打开的证明

## 1. One-line target

future direct-delivery 应按这条 5 步工作线被完整定义：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

并保持以下原则不变：

- `Storyline + Plan` 仍映射到当前 policy 的 `Story Architecture`
- `Visual` 仍映射到当前 policy 的 `Visual Authorship`
- `Delivery` 仍映射到当前 policy 的 `Delivery Packaging`
- `operator_handoff / closeout` 仍属于 `Delivery`，不是第六步

## 2. Scope boundary

这份目标态文档只讨论 direct-delivery family：

- `ppt_deck`
- guarded `poster_onepager`（仅限当前 knowledge-poster guard）

显式对照面：

- `xiaohongshu`：继续保持 explicit human publication

显式不在本文档范围内：

- `paper_poster`
- `conference_poster`
- `controller expansion`
- new family / overlay expansion
- managed web runtime migration
- OPL federation integration
- 任何 hidden fallback chain
- 任何用 prompt patch 代替 contract hydration 的做法

## 3. Relationship to current absorbed truth

截至 `2026-04-09`，当前已 absorbed 的 direct-delivery tranche 仍是：

- `phase_2_direct_delivery_lifecycle_stage_convergence`

它当前只证明：

- `ppt_deck` 与 guarded `poster_onepager` 已有 machine-readable `lifecycle_stage_contract`
- `lifecycle_stage_summary` 已在 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 上收紧到同一 canonical governance path
- `operator_handoff / closeout` 仍明确留在 `Delivery`
- `xiaohongshu` 仍是 explicit human publication 对照面

因此，后续若还要继续推进，不应回头改写 current truth；
而应把本文当作 future freeze 的设计边界。

## 4. Shared lifecycle mapping

面向人类操作与 future-facing longrun target，统一按下面 5 步理解：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

与当前 policy 的关系保持如下映射：

- `Source Readiness` -> `Source Readiness`
- `Storyline + Plan` -> `Story Architecture`
- `Visual` -> `Visual Authorship`
- `Delivery` -> `Delivery Packaging`

这意味着：

- longrun target 可以把 direct-delivery 的完整理想工作线讲清楚
- 但不能借此改写当前 policy 的宏观生命周期命名

## 5. Target state by stage

下面每一段都按同一模板说明：

- 输入
- 输出
- durable surfaces
- 放行标准
- 非目标
- family boundary

---

## 5.1 Source Readiness

### 目标

把主题从“原始材料已进入 workspace”推进到 **可以进入 Storyline** 的状态。

### 输入

- `brief`
- `keywords`
- source files / extracted materials
- topic 级 canonical inputs
- 必要时 external source augmentation / source research 请求

### 输出

- 可被后续 Storyline 消费的 canonical shared source truth
- `planning_ready` 级别的 source readiness
- 明确的 blocker / residual risk 列表

### Durable surfaces

topic 级 canonical surfaces 应继续是 authoritative source owner：

- `topics/<topic>/canonical/source-index.json`
- `topics/<topic>/canonical/extracted-materials.json`
- `topics/<topic>/canonical/source-audit.json`
- `topics/<topic>/canonical/source-brief.json`

若 future source augmentation / research 打开更完整能力面，也应继续围绕同一 canonical topic path 落盘，例如：

- `topics/<topic>/canonical/source-readiness-pack.json`
- `topics/<topic>/canonical/source-augmentation-request.json`
- `topics/<topic>/canonical/source-augmentation-result.json`
- `topics/<topic>/canonical/source-augmentation-report.json`
- `topics/<topic>/canonical/source-research-report.json`

### 放行标准

- `source_audit` 已达到可规划状态
- canonical source truth 足以支撑 direct-delivery 的叙事判断
- 不再存在阻断 Storyline 的 source-level blocker
- readiness 已诚实到达 `planning_ready`

### 非目标

- 选定最终 narrative arc
- 直接生成页面结构
- 直接决定视觉风格
- 把 source gap 伪装成“后面再补”

### Family boundary

- `ppt_deck` 与 guarded `poster_onepager` 共享同一 source readiness gate semantics
- `xiaohongshu` 仍可复用 source substrate，但不因此进入 direct-delivery longrun target

---

## 5.2 Storyline

### 目标

把“事实材料已齐”的主题收口成 **唯一明确的讲述主线**。

### 输入

- `Source Readiness` 已放行的 canonical source truth
- audience / goal / deliverable intent
- direct-delivery family 的 profile-level framing

### 输出

- `storyline`
- narrative arc
- audience promise
- core message hierarchy

### Durable surfaces

deliverable 级 route artifact 应继续落在 canonical deliverable path：

- `topics/<topic>/deliverables/<deliverable>/artifacts/storyline*.json`

同时它应保持对 canonical source surfaces 的引用关系，而不是复制一套 topic truth。

### 放行标准

- narrative arc 已收成单线，不是素材堆叠
- 关键主张与 source truth 可追溯绑定
- 后续 Plan 可以在不重新选题的前提下展开

### 非目标

- 页面级排布
- 视觉语言与导演表达
- export / handoff / closeout

### Family boundary

- `ppt_deck` 与 guarded `poster_onepager` 都应先经过 `storyline`
- `Storyline` 与 `Plan` 合在一起，仍然映射到当前 policy 的 `Story Architecture`

---

## 5.3 Plan

### 目标

把已冻结的 `Storyline` 展开成 **family-specific、可进入 Visual 的结构化执行方案**。

### 输入

- 已放行的 `storyline`
- deliverable goal
- family/profile contract
- source-backed evidence requirements

### 输出

- `ppt_deck`：`detailed_outline` + `slide_blueprint`
- guarded `poster_onepager`：`poster_blueprint`

### Durable surfaces

deliverable 级 durable artifacts 应继续通过 route artifacts 落盘：

- `topics/<topic>/deliverables/<deliverable>/artifacts/detailed_outline*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/slide_blueprint*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/poster_blueprint*.json`

并继续绑定 hydrated contract：

- `topics/<topic>/deliverables/<deliverable>/contracts/delivery-contract.json`

### 放行标准

- 结构已完整到可进入 Visual
- 不再需要回到 Storyline 重选 narrative arc
- 每个页面/版面都能说明“要表达什么”和“凭什么表达”
- Plan 对后续 Visual 是约束，不是模糊建议

### 非目标

- 视觉导演表达
- HTML/materialized render
- export / operator handoff / closeout

### Family boundary

- `ppt_deck` 与 guarded `poster_onepager` 可以有不同 plan artifacts
- 但它们都仍属于当前 policy 里的 `Story Architecture`

---

## 5.4 Visual

### 目标

把已冻结的 Plan materialize 成 **可审阅、可循环返工、可诚实通过 review gate** 的视觉交付面。

### 输入

- 已放行的 Plan artifacts
- hydrated contract 中的 visual constraints
- profile-specific render / review rules

### 输出

- `visual_direction`
- `render_html`
- `visual_director_review`
- `screenshot_review`

### Durable surfaces

deliverable 级 artifacts 与 reports 应继续沿 canonical path 落盘：

- `topics/<topic>/deliverables/<deliverable>/artifacts/visual_direction*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/render_html*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/visual_director_review*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/screenshot_review*.json`
- `topics/<topic>/deliverables/<deliverable>/reports/review-state.json`

### 放行标准

- 所有 required review gates 均已诚实通过
- blocking issues 已清零，或明确转为可接受 residual risk
- Delivery 不再承担“补视觉质量”的责任
- rerun path 仍然显式，而不是被隐藏 fallback 吃掉

### 非目标

- 改写 canonical source truth
- 重新定义 storyline
- 伪造 export-ready

### Family boundary

- `ppt_deck` 与 guarded `poster_onepager` 的 Visual 都应经过循环式 review gate
- `Visual` 仍然只映射到当前 policy 的 `Visual Authorship`

---

## 5.5 Delivery

### 目标

完成 required export，冻结 `delivery_state`，并让 `operator_handoff / closeout` 在 **同一 canonical governance path** 上成立。

### 输入

- 已放行的 Visual outputs
- hydrated `delivery_contract`
- canonical review state
- canonical topic publication projection

### 输出

- `ppt_deck`：`export_pptx`
- guarded `poster_onepager`：`export_bundle`
- machine-readable `operator_handoff`
- closeout-ready delivery governance state

### Durable surfaces

direct-delivery future target 仍应围绕同一 durable surfaces：

- `topics/<topic>/deliverables/<deliverable>/artifacts/export_pptx*.json`
- `topics/<topic>/deliverables/<deliverable>/artifacts/export_bundle*.json`
- `topics/<topic>/deliverables/<deliverable>/contracts/delivery-contract.json`
- `topics/<topic>/deliverables/<deliverable>/reports/review-state.json`
- `topics/<topic>/publication-state.json`
- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

### 放行标准

- required export route 已完成
- required export artifact 已存在并可追溯
- `delivery_state_current = output_ready`
- `operator_handoff.gate_status = ready`
- reopen / closeout mutation surfaces 仍显式可见

### 非目标

- 把 `operator_handoff` 拔高成第六步
- 把 `delivery_state` ownership 偷换到 topic projection
- 让 export artifact 存在即自动视为 closeout 完成

### Family boundary

- `ppt_deck`：direct delivery
- guarded `poster_onepager`：direct delivery，但继续保持 knowledge-poster guard
- `xiaohongshu`：explicit human publication，不纳入本文定义的 Delivery closeout semantics

## 6. operator_handoff / closeout boundary

`operator_handoff / closeout` 仍属于 `Delivery`，不是第六步。

future longrun target 下，`operator_handoff` 至少要继续稳定暴露：

- `handoff_kind`
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

它必须同时出现在：

- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

并满足：

- 结论一致
- `delivery_state` ownership 仍留在 required export artifact
- source readiness / review gate 不诚实通过时，即使 artifact 已存在也必须保持 `blocked`
- `reopen_mutation_surface = request_changes`
- `closeout_mutation_surface = promote_baseline`

## 7. Closeout ideal state

future direct-delivery closeout 的理想终态，不是“导出成功”四个字，而是：

- source truth、storyline、plan、visual、delivery 五段都有明确 durable evidence
- review gate 与 export gate 没有互相漂移
- `operator_handoff` 对 operator 来说已是单一可信 summary
- closeout mutation surface 仍显式、可追溯、可重开

## 8. Non-goals for this document

这份 future-facing 目标态文档 **不授权**：

- 改写当前 `current-program.json`
- 重写已 absorbed 的 `phase_2_direct_delivery_lifecycle_stage_convergence`
- 把 `xiaohongshu` 改写成 direct-delivery
- 借此打开 academic poster contract
- 借此把 `controller` 写成正式入口
- 借此把 managed web runtime migration 写成当前 repo truth

## 9. Honest reading rule

对这份文档最诚实的读取方式是：

- 它是 **future-facing target**
- 它定义的是同一主线内可继续追求的理想 direct-delivery 终态
- 它不是当前 repo 已完成实现的声明
- 当前 repo truth 仍以 `current-program.json` 与已 absorbed tranche contracts 为准
