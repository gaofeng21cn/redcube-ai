# Phase 2 Program Records

生命周期说明：本目录只保留已吸收的 Phase 2 tranche、continuation board 与 closeout provenance。它仍在 `docs/program/` 原位保留，因为多个 runtime-program contracts 通过 `human_doc:program_phase_2_*` 语义 ID 指向这些 brief。

## Current Stance

| 字段 | 说明 |
| --- | --- |
| owner | RCA program docs |
| purpose | 保存已吸收 tranche 的人读 closeout / provenance |
| state | absorbed tranche, contract-linked |
| machine boundary | 可执行真相在 `contracts/runtime-program/phase-2-*.json`、runtime/source/delivery contracts、CLI/MCP surfaces 与 workspace/runtime artifacts |

本目录不表示 Phase 2 仍是新的公开产品方向，也不重新打开 gateway-first、harness-first、Hermes-first 或 OPL-first runtime 叙事。当前公开身份、runtime topology、delivery/source truth 与验证口径以核心五件套、`docs/runtime/`、`docs/delivery/`、`docs/source/`、`docs/policies/` 和 runtime-program contracts 为准。

## Handling Rules

- 被 `human_doc:*` 引用的 brief 原位保留，并通过文件头 lifecycle note 降级为 absorbed / provenance。
- 只有当对应 runtime-program contract 不再引用某个 brief 时，才把该 brief 迁入 `docs/history/` 或 tombstone 语境。
- 新增当前主线工作不要继续写进本目录；需要 program tracking 时，在 `docs/program/` 根层建立新的 owner brief，并同步 machine-readable contract。
- 本目录中的 old gateway / harness / OPL-hosted / Hermes wording 都按当时 tranche 的历史语境读取，不覆盖当前 owner surface。

## Current Entry Points

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
