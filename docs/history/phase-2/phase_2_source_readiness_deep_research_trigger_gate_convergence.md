# Phase 2 Source Readiness Deep Research Trigger + Gate Convergence

Owner: `RedCube AI`
Purpose: `historical_phase_2_source_readiness_trigger_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 tranche brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、workspace artifacts、owner receipts 和当前 source owner docs。

日期锚点：`2026-04-09`

生命周期说明：本文是已吸收的 source-plane hardening tranche brief，保留为 contract-linked provenance。当前 Deep Research 只作为 Source Readiness 的补料能力读取；它不等同于完整 MDS Scout + Idea，也不重新定义 RCA 的公开身份。

这份文档记录同一主线上的下一条 source-plane hardening tranche：

- `source readiness deep research trigger + gate convergence`

它不是：

- 当前 repo truth 已经自动完成所有 source-plane 长线目标的证明
- `controller` 已成为正式公开入口的证明
- `xiaohongshu` 已被改写成 direct-delivery 的证明
- `Deep Research` 已经等价于 `MedDeepScientist` `Scout + Idea` 的证明

## 当前冻结结论

- `Deep Research` 的正式定位必须收紧在 `Source Readiness` 内部
- 它负责补齐事实材料、来源、证据与 readiness，不负责替代 `Storyline`
- planning_ready 必须成为 machine-readable release gate，而不能只看 `source_audit = pass`
- canonical `source-readiness-pack.json` 必须成为正式 readiness surface
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 必须围绕同一 planning gate 语义收口
- `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 必须共享同一 source substrate，但 family ontology 不得被改写

## 当前结论

- 这条 tranche 已完成 closeout，并吸收到当前 mainline
- canonical `source-readiness-pack.json` 现在会显式暴露 `planning_ready` gate、blocking gaps 与 residual gaps 通道
- `source-augmentation-request/result/report` 与 `source-research-report` 现在围绕同一 planning gate 语义对齐
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 现在会暴露同一份 `source_readiness_summary` 与 `gate_summary`
- `source_audit = pass` 但 `planning_ready = false` 时，系统不会再假装 Step 1 已放行

## In scope

### 1. Deep Research positioning inside Source Readiness

- `Deep Research belongs to Source Readiness`
- `Deep Research solves source insufficiency`
- `Deep Research does not replace Storyline`
- `Deep Research does not equal Scout + Idea`

### 2. Trigger convergence

必须明确冻结以下触发逻辑：

- 只有主题 / 关键词 / 粗略想法时，强制进入 augmentation
- canonical source truth 无法支撑 `Storyline / Plan` 判断时，强制进入 augmentation
- 已到 `planning_ready` 但仍有 residual gap 时，只能建议，不得伪装成强制
- 已满足 planning gate 时，可停在 `source intake` 或 `source research`，不再强制补料

### 3. planning_ready gate convergence

planning gate 必须收紧到：

- `source_audit.status = pass`
- `source-readiness-pack.readiness.planning_ready = true`
- blocking evidence gap 为空
- Step 1 输出已足以支撑后续 `Storyline -> Plan -> Visual -> Delivery`

### 4. Durable surface convergence

以下 surfaces 必须正式化：

- readiness: `source-readiness-pack.json`
- request: `source-augmentation-request.json`
- result: `source-augmentation-result.json`
- report: `source-augmentation-report.json` / `source-research-report.json`

topic 级 canonical source truth 与 deliverable 级后续工件必须继续分层，不能互相偷换。

### 5. Family boundary

- `ppt_deck` / `xiaohongshu` / guarded `poster_onepager` 共享 Source Readiness substrate
- `xiaohongshu` 继续保持 explicit human publication，对外 ontology 不得改写
- guarded `poster_onepager` 继续保持 knowledge poster 边界

## Out of scope

- `controller expansion`
- 把 `xiaohongshu` 改写成 direct-delivery
- `paper_poster / conference_poster` academic poster contract advancement
- new family / overlay expansion
- managed web runtime migration
- hidden fallback chains as main behavior
- 用 prompt patch 替代 contract hydration
- 把 `Deep Research` 直接写成 `MedDeepScientist Scout + Idea`

## 最小验证面

- `docs/references/source_readiness_deep_research_longrun_target_state.md`
- `contracts/runtime-program/phase-2-source-readiness-deep-research-trigger-gate-convergence.json`
- `tests/phase-2-source-readiness-deep-research-trigger-gate-convergence.test.ts`
- `tests/source-readiness-deep-research-gate.test.ts`
- `tests/source-intake.test.ts`
- `tests/source-research.test.ts`

## 吸收门槛

只有同时满足以下条件，才允许 absorbed：

- `planning_ready` 已成为 canonical readiness gate
- source readiness summaries across governance surfaces 已对齐
- source-plane durable surfaces 已 machine-readable
- family boundary 仍然诚实
- fresh verification 全部通过
