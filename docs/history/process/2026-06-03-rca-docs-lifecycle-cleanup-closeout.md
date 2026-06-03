# RCA docs lifecycle cleanup closeout

Owner: `RedCube AI`
Purpose: `docs_lifecycle_cleanup_closeout`
State: `history_provenance`
Machine boundary: 本文是人读过程 closeout。当前机器真相继续归 `contracts/runtime-program/current-program.json`、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 和 RCA-owned review/export gates。

本文记录 2026-06-03 docs 生命周期清理的枚举、处置和验证范围。它不承担 active plan，不声明 RCA visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete、OPL-owned visual truth 或 generic runtime owner。

## Scope

- `cwd`: `/Users/gaofeng/workspace/redcube-ai/.worktrees/codex/docs-lifecycle-20260603-rca`
- Write scope: `README*/TASTE/AGENTS/docs/**/*.md`
- Actual write scope: `docs/README.md`、`docs/docs_portfolio_consolidation.md`、`docs/active/rca-ideal-state-gap-plan.md`、`docs/history/process/README.md`、本文
- Read-only truth checks: `AGENTS.md`、`TASTE.md`、核心五件套、`docs/active/rca-ideal-state-gap-plan.md`、`docs/docs_portfolio_consolidation.md`、`contracts/README.md`、`contracts/**/*.json`、`scripts/test-registry.ts`、`package.json`
- No source / contracts / tests were edited.

## Inventory

Docs inventory after cleanup:

- `docs/**/*.md`: 93 files
- `docs/history/**/*.md`: 49 files
- non-history `docs/**/*.md`: 44 files
- root / near-root README files: `README.md`、`README.zh-CN.md`、`agent/README.md`、`contracts/README.md`、`docs/README.md`、`runtime/README.md`

Lifecycle role foldback:

| Path group | Cleanup decision |
| --- | --- |
| `README.md` / `README.zh-CN.md` | Retain as public repository entries; no wording rewrite in this tranche. |
| `agent/README.md` | Retain as Declarative Visual Pack source entry. |
| `runtime/README.md` | Retain as runtime source package entry. |
| `contracts/README.md` | Retain as human contract index; JSON contracts remain machine truth. |
| `docs/README.md` | Expanded as docs lifecycle index and path-group role map. |
| Core five docs | Retain as current truth / policy owners; no body rewrite in this tranche. |
| `docs/active/` | Keep only active gap plan and active migration inventory; compressed active plan to remove dated run/probe and prompt-template accumulation. |
| `docs/product/` | Retain as human/operator product support. |
| `docs/runtime/` | Retain as runtime topology / boundary support; no Hermes/gateway current truth found needing rewrite. |
| `docs/delivery/` | Retain as route/proof/export support; route docs already distinguish proof/support from review/export verdict. |
| `docs/source/` | Retain as source readiness / augmentation support; source docs already keep `planning_ready` boundary. |
| `docs/policies/` | Retain as stable policy layer. |
| `docs/public/` / `docs/specs/` | Retain as thin indexes only. |
| `docs/references/` | Retain as support references; product-entry support remains contract-linked support, not active plan. |
| `docs/history/` | Retain as provenance / tombstone / process owner. |

## Cleanup Categories

Absorbed into correct owner docs:

- Path-group lifecycle roles were folded into `docs/README.md`.
- Active docs governance rules were folded into `docs/docs_portfolio_consolidation.md`.
- Current gap / evidence-tail wording was folded into `docs/active/rca-ideal-state-gap-plan.md`.

Compressed active plan:

- Replaced run/probe-level native PPTX evidence details with evidence-gate summaries.
- Removed the embedded "next Agent prompt" block from the active plan.
- Kept only current state, open functional/structural gaps, production evidence gaps, structure hygiene tails, completion gates and verification posture.

Retained as support:

- Product-entry references remain under `docs/references/product-entry/`.
- Runtime / delivery / source support docs remain in their owner directories.
- `docs/references/native-ppt-open-source-design-discipline.md` remains a reference draft, not a machine interface.

Historical / tombstone boundaries preserved:

- Hermes proof/provenance stays in `docs/history/hermes/`.
- Phase 2 tranche material stays in `docs/history/phase-2/`.
- Old managed product-entry and route narratives stay in `docs/history/tombstones/`.
- Process ledgers and this closeout stay in `docs/history/process/`.

## Stale-Wording Audit

Non-history scan targets included `Hermes`, `hermes`, `managed`, `Gateway`, `gateway`, `bridge`, `frontdoor`, `federation`, `Phase 2`, `phase-2`, `product-entry`, `domain_action_adapter`, `runtimeWatch`, `session store`, `managed-entry`, and `managed entry`.

Readout:

- Non-history occurrences are primarily current boundary explanations, explicit opt-in executor references, refs-only adapter descriptions, product-entry support refs, or no-resurrection rules.
- `docs/active/rca-ideal-state-gap-plan.md` had the main lifecycle issue: it retained dated proof/run/probe details and an execution prompt template inside the active plan. This cleanup compressed those into current evidence gates and moved the process closeout here.
- No doc path was moved, tombstoned, deleted, or archived in this tranche.

## Verification Plan

Docs-only verification for this tranche:

- `rtk git diff --check`
- `rtk rg -n "<{7}|>{7}|={7}" docs README*.md`
- docs inventory sanity:
  - `find docs -name '*.md' | wc -l`
  - `find docs -path 'docs/history' -prune -o -name '*.md' -print | sort`
  - `find . -maxdepth 2 -name 'README*' | sort`

Source/contracts/tests were read but not edited, so repo-native source verification was not required for this docs-only cleanup.

## Verification Results

- `rtk git diff --check`: passed for tracked-file diff.
- `rtk perl -ne 'if(/[ \t]$/){print "$ARGV:$.: trailing whitespace\n"; $bad=1} END{exit($bad ? 1 : 0)}' docs/history/process/2026-06-03-rca-docs-lifecycle-cleanup-closeout.md`: passed for the new untracked closeout file.
- `rtk rg -n "<{7}|>{7}|={7}" docs README*.md`: passed.
- `rtk rg -n "<{7}|>{7}|={7}" docs/history/process/2026-06-03-rca-docs-lifecycle-cleanup-closeout.md`: passed for the new untracked closeout file.
- Inventory sanity after cleanup: `docs/**/*.md=93`, non-history `docs/**/*.md=44`, `docs/history/**/*.md=49`, README files remain `README.md`、`README.zh-CN.md`、`agent/README.md`、`contracts/README.md`、`docs/README.md`、`runtime/README.md`.
- Stale active-plan scan found no remaining run/probe ids or embedded prompt-template headers in `docs/active/`, `docs/README.md`, or `docs/docs_portfolio_consolidation.md`; the remaining phrase "下一轮 Agent prompt" appears only as a governance rule saying active plans must not store that template.

## Remaining Risk

- The process closeout does not independently re-verify live OPL conformance/readiness or runtime evidence; it only preserves docs lifecycle cleanup evidence.
- `docs/status.md` remains intentionally detailed as current status; this cleanup did not rewrite status into a terse dashboard.
- Future source/contract changes can still make docs wording stale; currentness must be rechecked against contracts/source/runtime outputs before using these docs for release or readiness claims.
