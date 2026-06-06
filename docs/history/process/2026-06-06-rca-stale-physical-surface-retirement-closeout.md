# RCA stale physical surface retirement closeout

Owner: `RedCube AI`
Purpose: `stale_physical_surface_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 `contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`、`contracts/runtime-program/current-program-parts/**/privatized_functional_module_audit/**`、source、tests、CLI/MCP/API behavior、owner receipts、typed blockers、artifact locator 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-06 OPL Doc 语义治理中 `broader stale physical surface retirement` 主题的 Single Source of Truth 收敛。本轮不删除源码、测试、workflow 或 contract 文件，因为机器合同和 source/test 扫描没有发现新的 `safe_to_delete_now=true` 候选；已经退役的旧 generic runtime / default dispatch / public gateway surface 继续只作为 tombstone、negative guard、provenance 或 refs-only boundary 存在。

## Semantic Theme

本轮治理主题是 RCA 已退役或待退役 physical surface 的当前真实状态：旧 managed runtime、default `domain_action_adapter` dispatch、public CLI/MCP gateway lookup、legacy deliverable runner/run store/DAG runtime、product-entry/session/runtimeWatch/operator projection、neutral route-run record adapter、Hermes proof/backend residue 和 managed-product-entry tombstone 如何分层，哪些已经完成物理退役，哪些只能继续作为 refs-only adapter / domain handler target / native helper implementation / migration input。

Single Source of Truth 分层：

- Physical deletion gate: `contracts/runtime-program/current-program-parts/current_state/privatized_functional_module_audit/physical_deletion_guard.json` and product-release mirrors.
- Surface admission / exit gate: `contracts/private_functional_surface_policy.json`.
- Active source morphology: `contracts/physical_source_morphology_policy.json`.
- Current active plan: `docs/active/rca-ideal-state-gap-plan.md`.
- Current inventory: `docs/active/opl-private-implementation-migration-inventory.md`.
- Current readout: `docs/status.md`、`docs/architecture.md`、`docs/decisions.md`、`docs/invariants.md`。
- No-resurrection tests / guards: `tests/rca-retired-surface-active-guard.test.ts`、`tests/opl-agent-pack-contracts-source-morphology.test.ts`、product-domain-action negative-dispatch tests and related runtime-program provenance tests.
- History/tombstone: `docs/history/**` and `docs/history/tombstones/**`.

## Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| Retired domain action adapter dispatch: `runtime_watch`、retired managed supervision、`product_entry_continuation` | `retired_no_resurrection_guard` | Kept as tombstone ids and negative dispatch inputs only. `active_caller=false`、`active_default_caller=false` and `compatibility_alias_allowed=false` in retired no-resurrection guards. |
| Retired public CLI/MCP gateway lookup: `get_managed_run` and retired managed supervision | `retired_no_resurrection_guard` | Kept as retired legacy surface ids only; no public callable alias or gateway wrapper was found. |
| Legacy repo-local visual runtime: old deliverable runner、run store、DAG runtime | `physical_cleanup_closed` | Kept only in `physical_deletion_guard.retired_legacy_surface_ids` / tombstone refs; no live runner/store/DAG owner surface was reintroduced. |
| `contracts/runtime-program/managed-product-entry-hardening.json` | `tombstone_semantic_id` | Kept because current-program provenance、session-continuity refs、morphology policy and tests still consume it as retired contract provenance. It is not a callable contract, alias, facade or wrapper. |
| Product-entry/session continuity refs adapter | `refs_only_default_caller_tail` | Kept; module guard says `safe_to_delete_now=false` because deletion would remove current refs-only domain behavior. |
| Direct `runtimeWatch` read model | `refs_only_read_model` | Kept as direct review/progress read model; `runtime_watch` remains retired from default `domain_action_adapter` dispatch. |
| Domain handler guarded actions / generated descriptor refs | `domain_handler_target` | Kept; RCA positive target remains `domain-handler export|dispatch`, while OPL-generated `domain_action_adapter` remains descriptor/projection refs. |
| Operator evidence / stability / efficiency projections | `refs_only_projection` | Kept; all readiness/visual/export/handoff claims remain forbidden unless RCA owner evidence or typed blocker exists. |
| Neutral route-run record adapter / executor runtime protocol | `refs_only_delete_tail` | Kept; OPL Agent Executor Adapter / attempt ledger / runtime record default caller parity and no-active-caller proof are still required before delete. |
| Hermes-Agent proof/backend paths | `explicit_opt_in_executor_backend` | Kept; `hermes_agent` is a selected executor backend/proof context, not RCA runtime owner. No deletion without active-caller migration and owner receipt / typed blocker. |
| Python native helpers and visual authority functions | `domain_authority_retained` | Kept as RCA domain implementation / minimal authority functions, not stale generic runtime. |

## Content-Level Consolidation

- `physical_deletion_guard.current_safe_tombstone_candidate_count=0` and `deletion_status=legacy_runtime_physical_cleanup_closed` are the current machine readout for broader stale physical cleanup.
- All 12 privatized functional module records currently expose `physical_deletion_guard.safe_to_delete_now=false`; their reasons say each is retained RCA authority, refs-only projection, declarative pack input or minimal authority function.
- The five retired no-resurrection guard entries expose `active_caller=false`、`active_default_caller=false`、`compatibility_alias_allowed=false` and `resurrection_policy=forbidden`.
- Focused scans found old surface names in current decisions/status/active inventory, contracts, source guard builders, negative-dispatch tests, history/provenance and tombstone docs. Those occurrences are bounded by the current SSOT and do not authorize active callable aliases, compatibility facades, old public path tests, visual/export/domain/production readiness, or physical delete.
- No active docs were changed because `docs/status.md`、`docs/decisions.md`、`docs/architecture.md`、`docs/active/rca-ideal-state-gap-plan.md` and the private inventory already state the gate: delete only after OPL default-caller parity、no-active-caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof and tombstone/provenance pointer all hold.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-stale-physical-surface-retirement-20260606`:

```bash
jq '.current_safe_tombstone_candidate_count, .deletion_status, .remaining_deletion_scope, .required_before_remaining_physical_delete' contracts/runtime-program/current-program-parts/current_state/privatized_functional_module_audit/physical_deletion_guard.json
jq -r '[if (.physical_deletion_guard | has("safe_to_delete_now")) then (.physical_deletion_guard.safe_to_delete_now|tostring) else "missing" end, .module_id, .physical_deletion_guard.reason] | @tsv' contracts/runtime-program/current-program-parts/current_state/privatized_functional_module_audit/modules/*.json
jq '.active_surface_classifications | length' contracts/physical_source_morphology_policy.json
jq '.active_surface_classifications[] | {surface_id, source_refs, machine_boundary_refs}' contracts/physical_source_morphology_policy.json
jq '.' contracts/runtime-program/current-program-parts/product_release_metadata/privatized_functional_module_audit/retired_no_resurrection_guards.json
rtk rg -n 'domain_action_adapter_dispatch\.|public_cli_mcp_gateway\.|legacy_deliverable_runner|legacy_run_store|legacy_dag_runtime|retired_managed_supervision|product_entry_continuation|get_managed_run|runtime_watch' packages tests scripts contracts agent docs README.md README.zh-CN.md package.json
rtk rg -n 'GatewayActionMap|getCliGatewayActions|callGatewayTool|listGatewayTools|GatewayTool|deps\.gateway|startHermesRun|completeHermesRun|managedProductEntry|managed product entry|managed-product-entry' packages tests scripts contracts agent docs README.md README.zh-CN.md package.json
```

Result:

- Physical deletion gate reported `current_safe_tombstone_candidate_count=0`, `deletion_status=legacy_runtime_physical_cleanup_closed`, remaining scope restricted to visual authority functions / refs-only projections / declared visual pack inputs, and no extra required-before-delete entries for already closed legacy runtime cleanup.
- All 12 current privatized module records reported `safe_to_delete_now=false`.
- Active morphology contract listed 12 active surface classifications: visual pack, contracts, MCP/product/domain entry, CLI adapter, product-entry continuity refs adapter, workspace/run envelope helpers, runtimeWatch projection, domain handler guarded actions, operator projection, visual authority functions and retired product-entry tombstone refs.
- Retired no-resurrection guards listed five old surfaces with `active_caller=false`, `active_default_caller=false`, `compatibility_alias_allowed=false`, `resurrection_policy=forbidden`.
- Focused retired-surface scans returned only current boundary statements, contract/tombstone refs, source guard builders, negative-dispatch tests, refs-only read model uses, history/provenance, and explicit no-resurrection language. No new physical delete candidate, compatibility alias, facade or old public path resurrection was found.

## Remaining Scope

This lane closes only the current RedCube stale physical surface no-delete/no-resurrection readout. It does not close the six-repo OPL series `/goal`, does not claim full RedCube docs portfolio completion, and does not authorize physical deletion of the remaining refs-only / authority surfaces.

Open carry-forward:

- `generated_default_caller_thinning` remains open until OPL generated/default session、domain handler、product-entry、workbench、Agent Executor Adapter、attempt ledger、runtime record/event log and native-helper envelope default caller parity are proven.
- `repo_local_adapter_delete_after_cutover` remains open for product-entry/session/runtimeWatch/operator projection/domain handler descriptor/neutral route-run record adapters until no-active-caller、owner receipt / typed blocker roundtrip、no-forbidden-write proof and tombstone/provenance pointer all hold.
- `compatibility_free_retirement` remains the rule for any future surface whose delete gate passes: delete or tombstone directly, without compatibility alias、facade、wrapper、default dispatch、old public path test or success payload compatibility field.
