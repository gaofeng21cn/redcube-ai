# RCA source readiness SSOT closeout

Owner: `RedCube AI`
Purpose: `source_readiness_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 source contracts、workspace canonical artifacts、CLI/MCP behavior、runtime-family source、runtime-program contracts、owner receipts、typed blockers 和 RCA-owned review/export gates。

本文记录 2026-06-06 OPL Doc 语义治理中 `source readiness / Deep Research` 主题的 Single Source of Truth 收敛。它不承担 source contract truth，不声明 RCA visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。

## Semantic Theme

本轮治理的语义主题是 RCA source readiness / Deep Research：`source intake` 如何建立 canonical source truth，`source augmentation` / `Deep Research` 如何只补齐 facts、sources、evidence gaps 和 readiness，并把 Step 1 推到 `planning_ready`，但不接管 Storyline、Plan、Visual、review/export verdict、artifact authority 或 production readiness。

Single Source of Truth 分层：

- 机器真相：workspace canonical artifacts、source contracts、runtime-family source、runtime-program contracts、CLI/MCP behavior、owner receipts 和 typed blockers。
- Source support owner：`docs/source/source_augmentation_executor_contract.md`，持有当前 source augmentation / Deep Research 执行器合同、人读调用方式、adapter 边界、输入输出合同、严格校验规则、canonical 回写效果和 authority boundary。
- Source index owner：`docs/source/README.md`，只说明 `docs/source/` 的目录职责、当前材料和历史 source plan 去向。
- Active gap owner：`docs/active/rca-ideal-state-gap-plan.md`，只持有 source readiness 作为 RCA minimal authority / owner-delta 体系中的当前目标态、开放差距和下一步顺序。
- History owner：`docs/history/plans/**`、`docs/history/phase-2/**` 和 `docs/history/process/**`，只保留 Deep Research / auto-first / source-plane longrun target freeze、Phase 2 hardening 和 coverage provenance。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/source/source_augmentation_executor_contract.md` | `current_support_owner` | Kept as source augmentation / Deep Research human support owner; no edit required in this lane. |
| `docs/source/README.md` | `active_support_index` | Already points current source execution truth to `source_augmentation_executor_contract.md` and machine-readable surfaces; no edit required. |
| `docs/product/human_quickstart.md` | `more_specific_detail` | Keeps operator-facing source startup language and correctly frames `source research` / `Deep Research` as source readiness augmentation, not Storyline replacement or full automatic web research; no edit required. |
| `docs/docs_portfolio_consolidation.md` | `docs_lifecycle_owner` | Already records that Deep Research / auto-first and source-plane longrun target freezes live in history and current source truth returns to owner docs/contracts; no edit required. |
| `docs/README.md` | `current_navigation` | Already routes source docs to `docs/source/` and warns `planning_ready` does not authorize visual/export/domain/production readiness; no edit required. |
| `docs/references/README.md` | `reference_index` | Historical source target freeze entries are indexed as archived references, not active support; no edit required. |
| `docs/history/plans/2026-04-08-deep-research-auto-first-product-contract.md` | `history_or_provenance` | Kept as archived 2026-04-08 product-semantics provenance; not current contract or checklist. |
| `docs/history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md` | `history_or_provenance` | Kept as archived 2026-04-09 source-plane future target freeze; not current implementation checklist. |
| `docs/history/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md` | `history_or_provenance` | Kept as historical source readiness pack Phase 1 plan; old public-doc wording tests and command snippets are not active requirements. |
| `docs/history/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md` | `history_or_provenance` | Kept as absorbed Phase 2 hardening provenance; its no-resurrection warning remains useful history. |
| `README.md` / `README.zh-CN.md` | `public_entry` | Public narrative mentions source intake and visual delivery at product level; it does not duplicate source contract fields or claim Deep Research readiness; no edit required. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- The current source contract stays in `docs/source/source_augmentation_executor_contract.md`; peer docs keep only index, operator quickstart, or lifecycle-placement summaries.
- Deep Research is consistently read as source readiness augmentation. It is not a standalone Scout + Idea equivalent, not a Storyline owner, not a visual route owner, and not a review/export gate.
- Historical longrun / auto-first / Phase 2 documents stay in history/provenance. Their chronological task lists, old public-doc wording tests, historical command snippets and future-freeze language do not return to active source docs.
- The source lane did not add compatibility wording, alias, facade, wrapper, old workflow entry, or compatibility-only test.
- No current source/support text was moved because the useful unique details are already in the SSOT owner system and the redundant historical lists are already archived.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-source-readiness-ssot-20260606` after this closeout and index update:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/history/process/README.md docs/history/process/2026-06-06-rca-source-readiness-ssot-closeout.md
rtk rg -n "MedDeepScientist.*Scout|Scout \\+ Idea|complete automatic web research|visual ready|exportable|handoffable|domain ready|production ready|production visual-stage long soak" docs/source docs/product/human_quickstart.md docs/README.md docs/docs_portfolio_consolidation.md docs/references/README.md
rtk rg -n "Deep Research|deep research|source readiness|source_readiness|source-plane|auto-first|longrun|future freeze" README* docs/source docs/product/human_quickstart.md docs/README.md docs/docs_portfolio_consolidation.md docs/references/README.md docs/history/plans/README.md docs/history/phase-2/README.md
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Source active/support stale-claim scan returned only boundary-warning text: `planning_ready` explicitly does not authorize visual/export/domain/production readiness, and the only Scout + Idea hit is explicit cautionary language in `docs/product/human_quickstart.md`.
- Source theme inventory confirmed current owner docs plus history/provenance placement.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only RedCube source readiness / Deep Research doc semantics. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for broader delivery lifecycle, product/operator support, public narrative, policy/spec/reference currentness and stale physical surface retirement.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
