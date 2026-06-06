# RCA governance checklist role SSOT closeout

Owner: `RedCube AI`
Purpose: `governance_checklist_role_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 contracts、schema、source、CLI/MCP/API behavior、runtime artifacts、owner receipts、artifact locator、RCA-owned review/export gates 和当前 owner docs；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-07 OPL Doc 语义治理中 `series docs governance checklist role` 主题的 Single Source of Truth 收敛。本轮把 `docs/references/governance/series-doc-governance-checklist.md` 明确为 OPL series 跨仓巡检支撑清单，避免它与 `docs/docs_portfolio_consolidation.md` 竞争 RCA 文档生命周期治理 owner。

## Semantic Theme

本轮治理主题是 RCA 文档生命周期治理规则与 OPL series 巡检支撑清单的 owner 边界。

Single Source of Truth 分层：

- Docs lifecycle governance owner: `docs/docs_portfolio_consolidation.md`。
- Docs entry index owner: `docs/README.md`。
- Series cross-repo checklist support: `docs/references/governance/series-doc-governance-checklist.md`。
- Current project truth owners: `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- Active completion plan owner: `docs/active/rca-ideal-state-gap-plan.md`。
- Machine truth owners: contracts、schema、source、tests、CLI/MCP/API behavior、runtime artifacts、owner receipts、artifact locator 和 review/export gates。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/docs_portfolio_consolidation.md` | `lifecycle_governance_ssot` | Kept as the current lifecycle governance owner; added an explicit note that the series checklist is only support. |
| `docs/README.md` | `covered_by_ssot` | Rewrote the maintainer governance entry so lifecycle rules point to `docs/docs_portfolio_consolidation.md`; the checklist is now a support pointer only. |
| `docs/policies/README.md` | `covered_by_ssot` | Removed wording that made lifecycle rules look jointly owned by the checklist. |
| `docs/references/README.md` | `more_specific_detail` | Kept the checklist in reference grouping, but renamed it as maintainer inspection support and routed lifecycle rules to the SSOT. |
| `docs/references/governance/series-doc-governance-checklist.md` | `active_support` | Kept as OPL series cross-repo docs intake / alignment checklist; added explicit non-owner wording. |
| `docs/history/process/2026-06-07-rca-docs-index-lifecycle-ssot-closeout.md` | `history_or_provenance` | Kept as earlier docs index / lifecycle navigation provenance. It does not need rewrite because this lane narrows the checklist support role. |
| Core five docs and active plan | `current_truth_owner` | No rewrite; they already own current project truth and active completion plan. |

## Content-Level Consolidation

- The useful durable rule is that RCA document lifecycle governance has exactly one current owner: `docs/docs_portfolio_consolidation.md`.
- The series checklist remains useful because it helps apply OPL family naming, six-repo scope, public/internal layering and verification reminders during cross-repo intake.
- The checklist does not own current truth, active completion progress, active gaps, machine contracts, typed boundary audit, public identity, lifecycle taxonomy or stale-surface delete authorization.
- No source, contract, test, workflow, CLI/API entry or physical module retirement was newly authorized by this docs-support role lane.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai` after this closeout and support-doc role updates:

```bash
rtk git diff --check
rtk rg -n '^(<<<<<<<|=======|>>>>>>>)' docs/README.md docs/docs_portfolio_consolidation.md docs/policies/README.md docs/references/README.md docs/references/governance/series-doc-governance-checklist.md docs/history/process/README.md docs/history/process/2026-06-07-rca-governance-checklist-role-ssot-closeout.md
rtk rg -n "文档生命周期规则|series-doc-governance-checklist|docs_portfolio_consolidation|维护者治理入口|维护者巡检支撑" docs/README.md docs/docs_portfolio_consolidation.md docs/policies/README.md docs/references/README.md docs/references/governance/series-doc-governance-checklist.md docs/history/process/README.md
rtk opl-doc-doctor doctor /Users/gaofeng/workspace/redcube-ai --format json
```

Result:

- `rtk git diff --check`: passed.
- Conflict-marker scan: passed with no matches.
- Targeted SSOT scan confirmed lifecycle rules point to `docs/docs_portfolio_consolidation.md`, while `series-doc-governance-checklist.md` is described only as OPL series cross-repo support / inspection material.
- OPL Doc doctor reported `finding_count=0` and `active_truth_health.status=pass`.

## Remaining Scope

This lane closes only the RedCube governance-checklist role split. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube broader docs portfolio still remains part of the multi-lane OPL series coverage target.
- Future stale-surface retirement still requires replacement owner, no-active-caller evidence, owner receipt / typed blocker, no-resurrection guard, or machine delete gate evidence before physical deletion.
