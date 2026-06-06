# RCA active baton SSOT closeout

Owner: `RedCube AI`
Purpose: `active_baton_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读过程 closeout。当前机器真相继续归 `contracts/`、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、typed blockers、artifact locator 和 RCA-owned review/export gates。

本文记录 2026-06-06 OPL Doc 语义治理中 `active truth baton` 主题的 Single Source of Truth 收敛。它不承担 active plan，不声明 RCA visual ready、exportable、handoffable、domain ready、human approval、production ready 或 production visual-stage long soak complete。

## Scope

- `RUN_SNAPSHOT_TS`: `2026-06-06T07:28:54Z`
- `cwd`: `/Users/gaofeng/workspace/redcube-ai`
- Governance theme: `active truth baton`
- SSOT owner: `docs/active/rca-ideal-state-gap-plan.md`
- Peer docs checked: `docs/docs_portfolio_consolidation.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`、`docs/project.md`、`docs/README.md`、`contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**`、`contracts/foundry_agent_series.json`、`contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`、`contracts/production_acceptance/rca-production-acceptance.json`。
- Actual write scope: `docs/active/rca-ideal-state-gap-plan.md`、`docs/docs_portfolio_consolidation.md`、本文、`docs/history/process/README.md`。
- No source / contracts / tests were edited in this tranche.

## SSOT Decision

`docs/active/rca-ideal-state-gap-plan.md` wins as the active baton SSOT because it already owns current completion progress, current-state vs ideal-state gaps, owner-delta execution order, completion gates and verification posture. The core five docs describe stable role, architecture, invariants, decisions and status; `docs/docs_portfolio_consolidation.md` governs lifecycle placement; machine-readable contracts and source/tests prove or disprove the plan's claims. None of those peer surfaces should carry a second active execution prompt or duplicate active completion plan.

The apparent conflict was between RCA's rule that active plans must not store directly reusable long Agent prompt templates and OPL Doc's requirement that the next executor can see executable next-round fields. This tranche resolves the conflict by allowing a structured `Next-Round Agent Prompt Baton` in the SSOT owner while keeping long prompt templates, dated proof transcripts, run/probe ids and branch/SHA closeout outside active docs.

## Section Classification

| Classification | Section / content | Decision |
| --- | --- | --- |
| `covered_by_ssot` | Current active completion progress, current gaps, owner-delta order and completion gate | Keep in `docs/active/rca-ideal-state-gap-plan.md`; peer docs may point to it but must not duplicate active current truth. |
| `more_specific_detail` | Lifecycle rule for how active docs handle next-round execution context | Clarify in `docs/docs_portfolio_consolidation.md` as governance support, not as a second active baton. |
| `conflicts_with_ssot` | Old wording that active plans do not save the next Agent prompt template | Rewrite to distinguish forbidden long prompt templates from allowed structured baton fields. |
| `history_or_provenance` | Dated proof, command transcripts, branch/SHA notes, run/probe ids, workspace paths, screenshots and closeout evidence | Keep in `docs/history/**`, runtime/evidence ledger or commit history. |
| `stale_or_superseded` | Old module/interface/test/workflow/public entry claims | No physical stale surface was retired in this lane; existing active plan still requires direct retirement once replacement parity, no-active-caller, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer are all satisfied. |
| `out_of_scope` | Broader RedCube docs themes such as delivery route support, source readiness, runtime topology and product/operator docs | Remain for later semantic lanes. |

## Changes

- `docs/active/rca-ideal-state-gap-plan.md`: added `Next-Round Agent Prompt Baton` with write scope, non-goals, live truth inputs, required actions, verification commands, completion gate and foldback target; adjusted docs lifecycle and completion-gate wording so active docs keep structured baton fields but not long prompt templates or process流水.
- `docs/docs_portfolio_consolidation.md`: clarified that active plans may hold structured next-round baton fields while dated closeout, proof transcript, audit inventory and one-time evidence go to `docs/history/process/**`.
- `docs/history/process/2026-06-06-rca-active-baton-ssot-closeout.md`: records this SSOT lane, section classification, verification and remaining scope.
- `docs/history/process/README.md`: indexes this closeout as process provenance.

## Verification

Completed before this closeout was written:

- `rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json`: passed for RedCube active truth health with `finding_count=0` and `next_round_agent_prompt_ready=true`.
- `rtk git diff --check -- docs/active/rca-ideal-state-gap-plan.md docs/docs_portfolio_consolidation.md`: passed.
- Merge-conflict marker scan over edited active/support docs: passed with no matches.

Completed after this closeout and index update:

- `rtk git diff --check`
- Merge-conflict marker scan over edited active/support/history docs.
- `rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json`

## Remaining Scope

This closeout covers one RedCube semantic lane only. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for delivery lifecycle, source readiness, runtime topology, product/operator support, public narrative, policy/spec/reference currentness and stale physical surface retirement.
- Other OPL series repos remain unprocessed in this tranche: `one-person-lab`、`med-autoscience`、`med-autogrant`、`opl-meta-agent`、`one-person-lab-app`。
- `med-autoscience` has dirty local changes and should only be governed after a fresh owner/dirty-state intake.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer.
