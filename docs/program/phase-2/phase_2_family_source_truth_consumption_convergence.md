# Phase 2 Family Source-Truth Consumption Convergence

日期锚点：`2026-04-08`

这份文档记录的是同一主线上的下一条 hardening tranche：

- `family source-truth consumption convergence`

它不是：

- `RedCube AI` 的全部长期目标
- `controller` 已经成为正式入口的证明
- academic poster contract 已经正式打开

## 当前结论

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 继续共享同一 canonical `shared_source_truth`
- authoritative fail-closed gate 仍在 `auditDeliverable` / `runtimeWatch`，权威 gate 仍是 `topics/<topic>/canonical/source-audit.json`
- family-specific stages 允许保留各自产物结构，但需要输出同一形状的 `source_truth_consumption`
- `poster_onepager` 仍只代表 guarded `knowledge_poster` surface，不打开 academic poster contract
- formal entry 仍只有 `MCP / CLI`

## 这条 tranche 实际收紧了什么

### 1. Shared source_truth_contract

每个 hydrated deliverable contract 都应显式暴露：

- `source_truth_contract`

它至少冻结：

- authoritative surface = `shared_source_truth`
- authoritative gate = `topics/<topic>/canonical/source-audit.json`
- canonical quartet = `source_index` / `extracted_materials` / `source_audit` / `source_brief`
- route-to-consumption-role mapping

### 2. Shared source_truth_consumption summary

family artifact 允许保留自己的业务字段，但对 shared source truth 的消费必须收口成同一组 summary 字段：

- `authoritative_source_kind`
- `consumption_role`
- `input_mode`
- `confidence`
- `material_count`
- `material_ids`
- `source_labels`
- `source_audit_status`
- `source_audit_blocking_reasons`

### 3. Guarded poster boundary stays honest

`poster_onepager` 在本 tranche 内只允许：

- `knowledge_poster`

它不允许被改写成：

- `paper_poster`
- `conference_poster`
- academic poster contract 已激活

### 4. Export / governance alignment stays hydrated

family-specific export surface 仍按 hydrated contract 区分：

- `ppt_deck`：`export_pptx`
- `xiaohongshu`：`export_bundle`
- `poster_onepager`：`export_bundle`

但 shared governance truth 仍必须围绕：

- `auditDeliverable`
- `runtimeWatch`
- `getReviewState`
- `getPublicationProjection`

## 最小 closeout evidence

- `contracts/runtime-program/phase-2-family-source-truth-consumption-convergence.json`
- `tests/phase-2-family-source-truth-consumption-convergence.test.ts`
- `tests/family-source-truth-consumption.test.ts`
- `tests/profile-contract-hydration.test.ts`

## 下一候选 tranche

- `phase_2_publication_projection_delivery_contract_convergence`

它的意义是：

- 继续收紧 publication projection / delivery contract / governance surface 的同主线一致性
- 不是把当前 absorbed tranche 误写成全部终点
