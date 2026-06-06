# RCA policy/spec/reference currentness SSOT closeout

Owner: `RedCube AI`
Purpose: `policy_spec_reference_currentness_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 contracts、schema、source、CLI/MCP/API behavior、product-entry manifest、runtime artifacts、owner receipts、artifact locator、private-surface / morphology contracts 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-06 OPL Doc 语义治理中 `policy/spec/reference currentness` 主题的 Single Source of Truth 收敛。它不改写 `docs/policies/`、`docs/specs/` 或 `docs/references/` 正文，因为这些文档已经按当前生命周期各自持有稳定规则、薄索引或支持参考，没有形成第二 current truth。

## Semantic Theme

本轮治理的语义主题是 RCA policy / spec / reference support layer：哪些文档持有长期稳定规则，哪些只是当前技术规格薄索引，哪些是仍能解释当前合同、目标态或 operator practice 的 support reference，以及这些文档如何避免抢占核心五件套、active gap plan、contracts/source/tests 或 history/tombstone 的 truth owner 角色。

Single Source of Truth 分层：

- Machine truth owners: `contracts/runtime-program/current-program.json`、`contracts/foundry_agent_series.json`、`contracts/physical_source_morphology_policy.json`、source、tests、CLI/MCP/API behavior、runtime artifacts、owner receipts、artifact locator 和 RCA-owned review/export gates。
- Current readout owners: `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- Active plan owner: `docs/active/rca-ideal-state-gap-plan.md`。
- Policy owner: `docs/policies/README.md` plus the five policy docs. They only carry stable rules and no-resurrection posture.
- Spec owner: `docs/specs/README.md`. It remains a thin active spec index and blocks old program/capability/Gateway/spec narrative from becoming a second truth source.
- Reference owner: `docs/references/README.md` plus specific support references. They explain target-state, product-entry, OPL handoff, memory locator, executor routing, native PPT discipline and series docs governance without owning active baton.
- History/tombstone owners: `docs/history/**` and `docs/history/tombstones/**` for old gateway/frontdoor/federation/Hermes-first/OPL-first, dated proofs, old plans and process provenance.

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/policies/README.md` | `policy_index` | Kept as stable-rule index; it routes docs lifecycle rules to docs governance / governance checklist and does not own active plan or machine truth. |
| `docs/policies/runtime_operating_model.md` | `current_policy` | Kept as stable runtime boundary policy; old gateway/workbench/managed runtime words appear only as exited lines or no-resurrection constraints. |
| `docs/policies/visual_pattern_memory_policy.md` | `current_policy` | Kept as stable visual memory boundary; current evidence refs are framed as refs-only receipt visibility and explicitly do not claim production or visual readiness. |
| `docs/policies/deliverable_contract_model.md` | `current_policy` | Kept as stable deliverable contract model; it explains family/profile/contract roles without carrying dated tranche logs. |
| `docs/policies/ai_first_quality_boundary.md` | `current_policy` | Kept as stable AI-first judgment-owner rule; it does not claim route or production readiness. |
| `docs/policies/typescript_migration_policy.md` | `current_policy` | Kept as stable TypeScript migration rule; no current conflict with source/contracts was found. |
| `docs/specs/README.md` | `active_spec_index` | Kept as thin spec index; it explicitly rejects old program/capabilities/Gateway/federation/source-pack/Hermes/workbench narrative as specs truth. |
| `docs/references/README.md` | `support_reference_index` | Kept as support reference index; it routes active baton to active plan, stable rules to policies, and no-longer-current material to history/tombstone. |
| `docs/references/product-entry/*.md` | `contract_linked_support` | Kept as direct / session / OPL-hosted product-entry support; each brief points gaps and production evidence back to active plan and machine contracts. |
| `docs/references/integration/*.md` | `support_reference` | Kept as OPL handoff / family contract support; OPL remains refs-only/projection owner and does not receive RCA visual truth or review/export verdict. |
| `docs/references/domain_memory_descriptor_locator.md` | `contract_linked_support` | Kept as visual pattern memory locator support; it separates descriptor/proof refs from memory body migration and production evidence tail. |
| `docs/references/rca_executor_routing_config.md` | `operator_reference` | Kept as opt-in executor routing reference; default executor remains `codex_cli`, and `hermes_agent` stays explicit proof/backend. |
| `docs/references/native-ppt-open-source-design-discipline.md` | `support_reference` | Kept as native PPTX design-discipline reference; external tools are inspiration only and do not define RCA route contract or artifact authority. |
| `docs/references/rca-visual-deliverable-agent-ideal-state.md` | `north_star_reference` | Kept as target-state owner; active current gaps remain in the active plan and current truth remains in core docs/contracts. |
| `docs/references/governance/series-doc-governance-checklist.md` | `governance_support` | Kept as series docs governance checklist; it does not replace repo owner docs, active plan or contracts. |
| `docs/history/**` | `history_or_provenance` | Kept as process / plan / tombstone owner for old routes, dated proofs and absorbed tranches. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- Policy docs already have one job: stable rule / forbidden boundary. They do not store dated tranche ledgers, branch notes, run transcripts or current completion plans.
- `docs/specs/README.md` is intentionally thin. It should not grow into a second `contracts/` README, runtime spec body, old program index or capability narrative unless a real current spec owner is created and the matching machine surface is updated.
- Reference docs keep unique support detail: product-entry support, OPL handoff, family contract adoption, memory locator, executor routing, native PPT discipline, ideal target and governance checklist. These details are more specific support material, not current truth or active baton.
- Current truth remains in the core five docs plus contracts/source/tests. Open gaps and next-round baton remain in `docs/active/rca-ideal-state-gap-plan.md`.
- Old gateway/frontdoor/federation/Hermes-first/OPL-first/workbench/managed runtime wording appears only as boundary-warning, provenance, tombstone, negative guard or explicit no-resurrection language in the reviewed support set.
- No policy/spec/reference text was moved or deleted because the useful content already sits in the SSOT owner system and no current support doc was found carrying historical increment logs or stale current-readiness claims.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai-doc-policy-spec-reference` after this closeout and index update:

```bash
rtk rg -n "gateway|Gateway|frontdoor|frontdesk|federation|federated|bridge|Hermes-first|OPL-first|local runtime|managed runtime|managed run|workbench|compatibility|alias|facade|wrapper|production ready|domain ready|visual ready|exportable|handoffable|GUI|WebUI|run id|run_id|attempt_id|attempt id|workspace path|sample root|branch|SHA|commit|closeout|proof|probe|dated|2026-" docs/policies docs/specs docs/references
rtk rg -n "current truth|current_truth|active plan|active baton|machine truth|readiness|ready|production ready|domain ready|visual ready|exportable|handoffable" docs/policies docs/specs docs/references --glob '*.md'
find docs/policies docs/specs docs/references -type f -name '*.md' -print | sort | while IFS= read -r f; do printf '%s\t' "$f"; wc -l < "$f"; done
rtk jq '{program_id}' contracts/runtime-program/current-program.json
rtk jq '{series_design_profile, identity_hygiene_policy, purpose_first_adapter_thinning_policy}' contracts/foundry_agent_series.json
rtk jq '{classification_count: (.active_surface_classifications | length), source_ref_integrity_gate}' contracts/physical_source_morphology_policy.json
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- Policy/spec/reference stale-route scan returned only boundary-warning, provenance, negative-guard, tombstone, current support or explicit no-readiness language.
- Current-truth / readiness scan confirmed support docs point machine truth to contracts/source/tests, active gaps to the active plan, and do not claim visual ready、exportable、handoffable、domain ready、production ready or production visual-stage long soak complete.
- Line-count inventory confirmed policy/spec/reference docs are bounded support documents, not process ledgers.
- Machine-truth spot checks confirmed current program, Foundry Agent series profile and source-ref integrity gate remain contract-owned.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only RedCube policy / spec / reference currentness. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube broader stale physical surface retirement remains separate. Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
