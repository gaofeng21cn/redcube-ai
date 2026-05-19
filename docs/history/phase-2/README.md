# Phase 2 Program Records

Owner: `RedCube AI`
Purpose: `historical_phase_2_provenance_index`
State: `history`
Machine boundary: 人读历史索引。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、workspace/runtime artifacts、owner receipts、核心五件套和当前 owner docs。

生命周期说明：本目录只保留已吸收的 Phase 2 tranche、continuation board 与 closeout provenance。它由旧 `docs/program/phase-2/` 迁入 history；多个 runtime-program contracts 继续通过 `human_doc:program_phase_2_*` 语义 ID 指向这些 brief 的读者上下文。

## 历史读法

| 字段 | 说明 |
| --- | --- |
| owner | RCA program docs |
| purpose | 保存已吸收 tranche 的人读 closeout / provenance |
| state | absorbed tranche, contract-linked |
| machine boundary | 可执行真相在 `contracts/runtime-program/phase-2-*.json`、runtime/source/delivery contracts、CLI/MCP surfaces 与 workspace/runtime artifacts |

本目录不表示 Phase 2 仍是新的公开产品方向，也不重新打开 gateway-first、harness-first、Hermes-first 或 OPL-first runtime 叙事。当前公开身份、runtime topology、delivery/source truth 与验证口径以核心五件套、`docs/runtime/`、`docs/delivery/`、`docs/source/`、`docs/policies/` 和 runtime-program contracts 为准。
各 brief 内的“当前状态”“Backlog”“下一步”“停车结论”只按 tranche 归档时点读取，不构成今天的 active plan 或 implementation checklist。

## Handling Rules

- 被 `human_doc:*` 引用的 brief 可以迁入 canonical lifecycle 目录；语义 ID 保持稳定。
- 如果某个 brief 后续不再被 runtime-program contract 引用，仍保留在 history 或 tombstone 语境，不回到 active。
- 新增当前主线工作不要继续写进本目录；需要 active tracking 时，在 `docs/active/` 建立新的 owner brief，并同步 machine-readable contract。
- 本目录中的 old gateway / harness / OPL-hosted / Hermes wording 都按当时 tranche 的历史语境读取，不覆盖当前 owner surface。

## 历史入口

- `phase_2_source_intake_activation_package_freeze.md`
- `phase_2_source_intake_shared_source_truth_baseline.md`
- `phase_2_review_export_gate_audit_hardening.md`
- `phase_2_family_source_truth_consumption_convergence.md`
- `phase_2_publication_projection_delivery_contract_convergence.md`
- `phase_2_direct_delivery_operator_handoff_hardening.md`
- `phase_2_direct_delivery_lifecycle_stage_convergence.md`
- `phase_2_source_readiness_deep_research_trigger_gate_convergence.md`
- `phase_2_workspace_operator_quickstart_convergence.md`
- `phase_2_operator_surface_consistency_hardening.md`
- `phase_2_runtime_watch_locator_integrity_hardening.md`
- `phase_2_family_parity_autopilot_continuation_board.md`
- `phase_2_family_parity_governance_surface_convergence.md`
- `phase_2_ppt_native_authoring_proof_lane.md`
- `phase_2_architecture_boundary_governance.md`
