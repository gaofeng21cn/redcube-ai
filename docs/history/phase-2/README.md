# Phase 2 历史记录索引

Owner: `RedCube AI`
Purpose: `historical_phase_2_provenance_index`
State: `history`
Machine boundary: 人读历史索引。当前机器真相继续归 `contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**`、source、CLI/MCP/API behavior、workspace/runtime artifacts、owner receipts、核心五件套和当前 owner docs。

生命周期说明：本目录只保留已吸收的 Phase 2 tranche、continuation board、proof lane、manual-test brief 与 closeout provenance。它由旧 `docs/program/phase-2/` 迁入 history；多个 runtime-program contracts 继续通过 `human_doc:program_phase_2_*` 语义 ID 指向这些 brief 的读者上下文。

本目录不表示 Phase 2 仍是新的公开产品方向，也不重新打开 gateway-first、harness-first、Hermes-first、OPL-first runtime、managed web runtime、controller expansion、academic poster 或 new family 主线。当前公开身份、runtime topology、delivery/source truth、review/export authority、native helper boundary 与验证口径以核心五件套、`docs/runtime/`、`docs/delivery/`、`docs/source/`、`docs/policies/` 和 runtime-program contracts 为准。

## 当前读法

- 各 brief 内的“当前状态”“当前结论”“Backlog”“下一步”“停车结论”“closeout”只按原始 tranche 归档时点读取。
- 已吸收 tranche 的命令、测试和 closeout evidence 只证明当时的 hardening/proof lane；它们不能升级为今天的 active plan、implementation checklist、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak 证据。
- 历史手测 brief、activation freeze、source/review/delivery/operator/runtimeWatch/quickstart convergence brief、native proof lane 与 HTML closeout 中曾经保留的 CLI 序列、operator flow、测试清单、proof runner 说明、next-tranche pointer、absorption gate 和 closeout 字段流水已压缩为 provenance；当前可执行命令、合同字段、proof runner、source/review/delivery/operator/runtimeWatch gate 和 route truth 读 source/contracts/tests/owner docs。
- 仍有当前价值的规则必须已经或应当提升到核心五件套、active gap plan、runtime/delivery/source/policy owner docs、machine-readable contracts 或 source/test surface；不要在本目录继续追加活跃计划。

## 历史主题读法

| 主题组 | 覆盖的历史 brief | 当前 SSOT / 读法 |
| --- | --- | --- |
| Source intake / shared source truth / Deep Research gate | `phase_2_source_intake_activation_package_freeze.md`、`phase_2_source_intake_shared_source_truth_baseline.md`、`phase_2_family_source_truth_consumption_convergence.md`、`phase_2_source_readiness_deep_research_trigger_gate_convergence.md` | 只保留 source activation、shared source truth baseline、stable-family consumption 和 Deep Research trigger/gate 的 provenance。当前 source readiness、augmentation、Deep Research 补料边界、source truth consumption 与 planning-ready 读 `docs/source/`、canonical workspace artifacts、runtime-program contracts/source/tests、owner receipts 和 typed blockers。 |
| Delivery / review / export / direct handoff | `phase_2_review_export_gate_audit_hardening.md`、`phase_2_publication_projection_delivery_contract_convergence.md`、`phase_2_direct_delivery_operator_handoff_hardening.md`、`phase_2_direct_delivery_lifecycle_stage_convergence.md` | 只保留 review/export gate、delivery contract、publication projection、direct handoff 与 lifecycle-stage convergence 的 historical hardening。当前 visual ready、exportable、handoffable、artifact authority、review/export verdict、route truth 和 handoff/export 读 `docs/delivery/`、RCA review/export gates、runtime-program contracts、workspace artifacts、artifact manifests、owner receipts 和 typed blockers。 |
| Product/operator quickstart / runtimeWatch / command surface | `phase_2_workspace_operator_quickstart_convergence.md`、`phase_2_operator_surface_consistency_hardening.md`、`phase_2_runtime_watch_locator_integrity_hardening.md` | 只保留 quickstart surface、workspace doctor、command help、CLI/MCP watch 和 runtimeWatch locator fail-closed 的 provenance。当前 product/operator quickstart 读 `docs/product/human_quickstart.md`、CLI/MCP behavior、contracts、workspace artifacts 和 runtime owner docs；`runtime_watch` 不得恢复为 generated `domain_action_adapter` default dispatch。 |
| Family parity / continuation board | `phase_2_family_parity_autopilot_continuation_board.md`、`phase_2_family_parity_governance_surface_convergence.md` | 只保留 family-parity continuation board 与 shared governance surface convergence 的 historical context。它们不是当前 active backlog、Auto-only board、public mainline、runtime owner migration proof 或 readiness evidence；当前 stable family route/review/export truth 回到 RCA-owned surfaces、active gap plan 和 runtime-program contracts。 |
| Route proof / manual QA / optional PPT routes | `phase_2_ppt_native_authoring_proof_lane.md`、`ppt_mainline_quality_closeout.md`、`stable_deliverable_manual_test_brief.md` | 只保留 native editable PPTX selectable-route proof、HTML lane quality closeout 和 stable deliverable manual-test provenance。当前 `ppt_deck` 默认路线由 image-first production route contracts 持有；HTML/native 都是显式可选路线。Native PPTX 只在用户显式要求可编辑 / DrawingML 时启用，且不绕过 source truth、review、runtimeWatch、export gate 或 production evidence tail。 |
| Architecture / package / layer boundary | `phase_2_architecture_boundary_governance.md` | 只保留 package/layer/test gate hardening 的 historical provenance。当前 owner map、source-purity tail、line-budget / Sentrux 读法、repo hygiene、package dependency boundary 和 test registration truth 读核心五件套、active gap plan、`docs/docs_portfolio_consolidation.md`、`contracts/physical_source_morphology_policy.json`、repo-native scripts 和 live source/tests。 |

逐 brief 的 contract-linked 读者上下文继续保留在对应子文件中；本索引不再维护逐文件 closeout 表、测试命令清单、operator flow、proof runner handbook、next-tranche pointer、absorption gate 或 backlog schema。需要追溯精确 tranche 顺序、contract id、历史命令或文件级 evidence 时读对应 brief、runtime-program contract 或 git history；需要当前执行入口时回到 active gap plan、owner docs、contracts/source/tests 和 live workspace evidence。

## Handling Rules

- 被 `human_doc:*` 引用的 brief 可以迁入 canonical lifecycle 目录；语义 ID 保持稳定。
- 如果某个 brief 后续不再被 runtime-program contract 引用，仍保留在 history 或 tombstone 语境，不回到 active。
- 新增当前主线工作不要继续写进本目录；需要 active tracking 时，在 `docs/active/` 建立新的 owner brief，并同步 machine-readable contract。
- 本目录中的 old gateway / harness / OPL-hosted / Hermes / managed / runtime / domain_action_adapter wording 都按当时 tranche 的历史语境读取，不覆盖当前 owner surface。
