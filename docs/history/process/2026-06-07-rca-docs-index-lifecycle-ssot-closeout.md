# RCA docs index lifecycle SSOT closeout

Owner: `RedCube AI`
Purpose: `docs_index_lifecycle_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 contracts、schema、source、CLI/MCP/API behavior、product-entry manifest、runtime artifacts、owner receipts、artifact locator 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-07 OPL Doc 语义治理中 `docs index / lifecycle navigation` 主题的 Single Source of Truth 收敛。本轮不改写 `docs/README.md` 或 `docs/docs_portfolio_consolidation.md` 正文，因为当前入口索引、生命周期治理、active completion plan 与 process history 已经分层清楚，没有形成第二 active truth 或历史增量长清单污染。

## Semantic Theme

本轮治理主题是 RCA docs 入口索引和 lifecycle governance：`docs/README.md` 是否只承担 docs entry index / lifecycle navigation，`docs/docs_portfolio_consolidation.md` 是否持有文档组合治理规则，active plan 是否仍是唯一 completion plan，process history 是否承接 coverage ledger / closeout provenance。

Single Source of Truth 分层：

- Docs lifecycle governance owner: `docs/docs_portfolio_consolidation.md`。
- Docs entry index owner: `docs/README.md`。
- Active completion plan owner: `docs/active/rca-ideal-state-gap-plan.md`。
- Current project truth owners: `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- Machine truth owners: contracts、schema、source、tests、CLI/MCP/API behavior、runtime artifacts、owner receipts、artifact locator 和 review/export gates。
- Process / coverage provenance owner: `docs/history/process/README.md` and dated files under `docs/history/process/`。
- History / tombstone owners: `docs/history/**` for retired program、Hermes、Phase 2、gateway/frontdoor/federation、old workbench、route probe、dated proof 和 tombstone provenance。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/docs_portfolio_consolidation.md` | `lifecycle_governance_ssot` | Kept as the current governance owner. It already states directory roles、content-level placement、direct retirement、long-list governance and coverage-ledger foldback. |
| `docs/README.md` | `docs_entry_index` | Kept as entry index and lifecycle navigation. It points to current truth owners, machine truth, active plan, support layers and history without storing dated coverage ledger. |
| `docs/active/rca-ideal-state-gap-plan.md` | `active_completion_plan_ssot` | Kept as the only active completion plan. It holds current readout、open gaps、owner-delta execution order and structured baton, while excluding dated proof and long prompt templates. |
| Core five docs | `current_truth_owner` | Kept as current project/status/architecture/invariant/decision owners; docs index and lifecycle docs only route readers to them. |
| `docs/history/process/README.md` | `process_history_index` | Kept as coverage/provenance index. It routes current lifecycle truth back to docs governance、status、active plan、history index and contracts. |
| `docs/history/process/2026-06-03-rca-docs-lifecycle-cleanup-closeout.md` | `history_provenance` | Kept as prior full docs lifecycle cleanup inventory and verification record. It does not own current lifecycle rules. |
| `docs/history/process/2026-06-02-rca-docs-portfolio-coverage-ledger-archive.md` | `archived_coverage_ledger` | Kept as dated coverage archive; active governance explicitly forbids appending future coverage ledgers there. |
| Root / near-root `README*` | `entry_or_source_index` | Kept in their existing roles: public repo entries, visual pack source entry, contract index and runtime source package entry. |
| Other `docs/**/*.md` | `routed_by_taxonomy` | No body rewrite in this lane. Their lifecycle role is already mapped by `docs/README.md` and governed by `docs/docs_portfolio_consolidation.md`. |

## Content-Level Consolidation

- `docs/docs_portfolio_consolidation.md` already owns the durable lifecycle rules, so this lane does not duplicate those rules into active plan, core docs or process history.
- `docs/README.md` already holds path-group lifecycle navigation and explicitly says it does not save dated coverage ledger; no content needed to be moved out.
- `docs/active/rca-ideal-state-gap-plan.md` already declares the current unique active completion plan and keeps process evidence in history/process, tombstone/provenance or runtime/evidence ledger.
- `docs/history/process/README.md` already indexes process closeouts as provenance and routes current lifecycle truth back to current owners.
- The latest inventory after adding this closeout is `docs/**/*.md=106`, non-history `docs/**/*.md=43`, `docs/history/**/*.md=63`, with root / near-root README files `README.md`、`README.zh-CN.md`、`agent/README.md`、`contracts/README.md`、`docs/README.md`、`runtime/README.md`.
- No stale module/interface/test/workflow/entry retirement was newly authorized by this docs-index lane. Current direct-retirement posture stays governed by `docs/docs_portfolio_consolidation.md`, `docs/active/rca-ideal-state-gap-plan.md`, private-surface / morphology contracts, source/tests and the prior stale physical surface closeout.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai` after this closeout and process index update:

```bash
git diff --check -- docs/history/process/2026-06-07-rca-docs-index-lifecycle-ssot-closeout.md docs/history/process/README.md
rg -n '^(<<<<<<<|=======|>>>>>>>)' docs/history/process/2026-06-07-rca-docs-index-lifecycle-ssot-closeout.md docs/history/process/README.md docs/README.md docs/docs_portfolio_consolidation.md docs/active/rca-ideal-state-gap-plan.md
rg -n "docs/README\\.md|docs_portfolio_consolidation|当前唯一 active|Coverage Ledger|dated coverage|长清单|prompt 模板|docs/program|capabilities" docs/README.md docs/docs_portfolio_consolidation.md docs/active/rca-ideal-state-gap-plan.md docs/history/process/README.md
find docs -name '*.md' -print | sort | wc -l
find docs -path 'docs/history' -prune -o -name '*.md' -print | sort | wc -l
find docs/history -name '*.md' -print | sort | wc -l
find . -maxdepth 2 -name 'README*' -print | sort
/Users/gaofeng/.local/bin/opl-doc-doctor doctor /Users/gaofeng/workspace/redcube-ai --format json
```

Result:

- `git diff --check`: passed.
- Conflict-marker scan: passed.
- Targeted SSOT scan confirmed `docs/docs_portfolio_consolidation.md` remains lifecycle governance owner, `docs/README.md` remains entry index, `docs/active/rca-ideal-state-gap-plan.md` remains the only active completion plan, and process history keeps coverage/provenance rather than current truth.
- Inventory sanity after adding this closeout: `docs/**/*.md=105`, non-history `docs/**/*.md=43`, `docs/history/**/*.md=62`; root / near-root README files remain unchanged.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane closes only RedCube docs index / lifecycle navigation SSOT coverage. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube broader docs portfolio remains a multi-lane coverage target in the OPL series ledger.
- Future docs edits must continue using content-level governance: current truth to core docs / owner docs / machine surfaces, active gaps to the active plan, support detail to the appropriate lifecycle directory, process proof to `docs/history/process/**`, and retired surfaces to history/tombstone/provenance or deletion after the machine delete gate passes.
