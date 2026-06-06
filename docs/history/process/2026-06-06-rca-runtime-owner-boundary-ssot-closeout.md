# RCA runtime owner boundary SSOT closeout

Owner: `RedCube AI`
Purpose: `runtime_owner_boundary_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 `contracts/foundry_agent_series.json`、`contracts/domain_descriptor.json`、`contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**`、`contracts/production_acceptance/rca-production-acceptance.json`、`contracts/stage_artifact_kernel_adoption.json`、product-entry / domain-handler source、workspace artifacts、owner receipts、typed blockers 和 RCA-owned review/export gates。

本文记录 2026-06-06 OPL Doc 语义治理中 `runtime owner boundary / OPL-hosted topology` 主题的 Single Source of Truth 收敛。它不承担 runtime truth，不声明 RCA visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。

## Semantic Theme

本轮治理的语义主题是 RCA runtime owner boundary：direct route 与 OPL-hosted route 如何共用 RCA service-safe domain entry，OPL/Temporal 持有通用 runtime / attempt ledger / generated shell，RCA 持有 visual truth、route truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。

Single Source of Truth 分层：

- 机器真相：`contracts/foundry_agent_series.json`、`contracts/domain_descriptor.json`、`contracts/runtime-program/current-program.index.json` 与 current-program leaf refs、`contracts/production_acceptance/rca-production-acceptance.json#/temporal_autonomy_readiness`、`contracts/stage_artifact_kernel_adoption.json`、product-entry / domain-handler source 和 focused tests。
- 当前架构 owner：`docs/architecture.md`，持有 direct route、OPL-hosted route、domain handler target、stage control projection、Stage Folder 和 OPL/RCA authority split 的当前人读架构说明。
- Runtime support owner：`docs/runtime/runtime_architecture.md`，只解释 runtime topology、executor/backend、watch/projection 和 provenance 去向。
- Policy owner：`docs/policies/runtime_operating_model.md`，只冻结稳定运行原则、capability policy 和 retired-surface posture。
- Active gap owner：`docs/active/rca-ideal-state-gap-plan.md`，持有 generated/default caller thinning、compatibility-free retirement 和 production evidence tail 的当前执行顺序。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/architecture.md` | `current_truth_owner` | Kept as current architecture SSOT; no edit required in this lane. |
| `docs/runtime/runtime_architecture.md` | `more_specific_detail` + `covered_by_ssot` | Kept topology support, replaced field/action enumerations that duplicate contracts/source with compact runtime-readout tables and contract pointers. |
| `docs/runtime/README.md` | `active_support_index` + `history_increment_pollution` | Compressed AgentLab suite / mock / live-sample details into evidence class readout; detailed suite commands and proof roots stay in contracts, tests, active plan and history/process. |
| `docs/policies/runtime_operating_model.md` | `stable_policy` + `historical_increment_list` | Replaced absorbed Phase 2 / source / operator / runtimeWatch tranche list with current capability policy table and history pointers. |
| `docs/status.md` | `current_status_readout` | Already holds current production evidence boundary and open long-soak tail; no edit in this lane. |
| `docs/active/rca-ideal-state-gap-plan.md` | `active_plan_owner` | Already owns evidence tail and default-caller thinning sequence; no edit in this lane. |
| `docs/history/phase-2/**`、`docs/history/hermes/**`、`docs/history/process/**` | `history_or_provenance` | Process tranche names, proof commands, mock/live evidence details and historical Hermes/managed runtime narratives remain there. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- Runtime support now points to machine truth for `temporal_autonomy_readiness` fields instead of copying selected boolean readouts into prose.
- Domain handler / generated `domain_action_adapter` wording now classifies surfaces by role and points action-set truth to action catalog、manifest、source and contracts; it no longer duplicates a partial guarded-action list.
- Runtime docs index now preserves evidence classes (`refs_only`、`mock`、`live_sample`) instead of accumulating suite commands, mock provider checks, token/provider details or live sample refs.
- Runtime policy now keeps the current capability policy table. Absorbed workspace/operator/source/runtimeWatch/direct-delivery tranche names and Phase 2 wording are history/provenance, not active policy.
- Retired managed / continuation / gateway / Hermes-first surfaces remain retired or history-only; no compatibility alias, facade, wrapper, test entry or workflow was added.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai` after this closeout and index update:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/runtime/README.md docs/runtime/runtime_architecture.md docs/policies/runtime_operating_model.md docs/history/process/README.md docs/history/process/2026-06-06-rca-runtime-owner-boundary-ssot-closeout.md
rtk rg -n "workspace / operator quickstart convergence|operator surface consistency hardening|runtime watch locator integrity hardening|direct-delivery operator handoff hardening|direct-delivery lifecycle stage convergence|Hermes stable family closure truth" docs/policies/runtime_operating_model.md
rtk rg -n "rca-goal-workflow-agent-lab-suite|rca-ppt-three-route-agent-lab-suite|mock image provider|OPENAI_API_KEY|REDCUBE_IMAGE_GENERATION_TOKEN|production_visual_stage_long_soak_complete=false" docs/runtime
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Runtime policy historical-increment scan found no absorbed-tranche matches.
- Runtime docs evidence-detail scan found no suite-command/provider-token/current-boolean pollution matches.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only runtime owner boundary / OPL-hosted topology support. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for broader delivery lifecycle, source readiness, product/operator support, public narrative, policy/spec/reference currentness and stale physical surface retirement.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
