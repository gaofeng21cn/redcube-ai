# RCA process history

Owner: `RedCube AI`
Purpose: `process_history_index`
State: `historical_archive_index`
Machine boundary: 本文是人读过程历史索引。当前机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locators、review/export gates 和当前 owner docs。

本目录只保留 RCA docs lifecycle、production evidence foldback、route probe 和 retired surface no-resurrection 的压缩 provenance。历史过程按主题读取，不再维护逐日 closeout 长清单。若某条历史结论仍有当前规则价值，先折回 `docs/docs_portfolio_consolidation.md`、核心五件套、active gap plan、owner docs、contracts、source、tests 或 runtime evidence，再把过程记录压缩在本目录。

这些材料不能作为 RCA visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete、generic runtime owner、OPL-owned visual truth、owner delete authorization、keep-as-authority-adapter authorization 或 physical-delete authority。

## Single Source Of Truth

| Theme | Current owner |
| --- | --- |
| 当前完成口径、功能/结构差距、测试/证据差距、下一轮 baton | `docs/active/rca-ideal-state-gap-plan.md` |
| 文档生命周期、目录职责、direct-retirement posture、long-list governance | `docs/docs_portfolio_consolidation.md` |
| 文档入口、路径组 lifecycle role、reader navigation | `docs/README.md` |
| 当前状态、architecture split、no-resurrection invariants、active decisions | `docs/status.md`, `docs/project.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` |
| public narrative | `README.md`, `README.zh-CN.md`, `docs/public/README.md` |
| product / runtime / delivery / source support | `docs/product/README.md`, `docs/runtime/README.md`, `docs/delivery/README.md`, `docs/source/README.md` |
| policies / specs / references | `docs/policies/README.md`, `docs/specs/README.md`, `docs/references/README.md` |
| production evidence tail | `docs/active/rca-ideal-state-gap-plan.md`, `contracts/production_acceptance/rca-production-acceptance.json`, runtime evidence, owner receipts, typed blockers |
| machine truth and retirement guards | contracts, source, CLI/MCP/API behavior, package manifests, tests, runtime artifacts, owner receipts |
| retired surface no-resurrection provenance | [`retired-surface-provenance.md`](./retired-surface-provenance.md) |

## Retained Process Records

| File | Role | Current read |
| --- | --- | --- |
| [RCA dated production evidence foldback](./2026-06-03-rca-dated-production-evidence-foldback.md) | dated production evidence provenance | Preserves native live proof and no-regression ref details. Current readiness truth still returns to the active gap plan and production acceptance contracts. |
| [Real-route evolution probe](./real-route-evolution-probe.md) | route probe provenance | Preserves probe command shape, historical sample root and efficiency readout. Current delivery truth returns to delivery owner docs, contracts, runtime-family source, artifacts, review/export gates and owner receipts. |
| [Retired surface provenance](./retired-surface-provenance.md) | compressed no-resurrection / process foldback record | Replaces per-tranche closeout files for docs lifecycle SSOT lanes, command-surface cleanup, helper/fallback/facade/test retirement, and stale workflow/entry provenance. |

## Compressed Provenance

| Provenance group | What remains here | What moved out |
| --- | --- | --- |
| Docs lifecycle and coverage | 本索引记录 current owner、retained evidence records、coverage snapshot 和 reopen 入口。 | Dated coverage ledger、frozen inventory、docs lifecycle cleanup closeout、doctor transcript、worktree closeout 和 proof-by-proof table 不再以单独 Markdown 文件维护。 |
| Current-doc SSOT lanes | `retired-surface-provenance.md` 保留 public/product/runtime/delivery/source/policy/spec/reference/active-baton SSOT lanes 的 compressed owner map。 | Durable rules 已折回 `docs/docs_portfolio_consolidation.md`、`docs/README.md`、核心五件套、active plan 和 owner docs。 |
| Retired command / helper / fallback / test / workflow surfaces | `retired-surface-provenance.md` 保留 no-resurrection rules 和 current owner refs。 | `frontdoor` field wording、hosted-attempt production helper、incremental screenshot stale prior backfill、MCP route fallback、Python helper script fallback、TypeScript presence lock、Stage Folder flat fixture 和 stale physical surface closeout 文件已压缩。 |
| Production evidence and route probe | 两个 retained process records 保存 dated proof/probe details。 | Current production evidence tail, readiness claims and next owner delta remain in active plan, production acceptance contracts, runtime evidence and owner receipts. |

## Coverage Snapshot

2026-06-08 RCA process-history compression tranche:

- Reviewed: `AGENTS.md`, `TASTE.md`, `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, `docs/docs_portfolio_consolidation.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/history/README.md`, previous `docs/history/process/*.md`, package / verification metadata, and exact contract/source/test references to dated process files.
- Edited: `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md`, `docs/docs_portfolio_consolidation.md`, `docs/README.md`.
- Compressed / deleted: previous dated process closeout Markdown files whose durable conclusions already live in current owners above or in `retired-surface-provenance.md`.
- Retained: `2026-06-03-rca-dated-production-evidence-foldback.md` and `real-route-evolution-probe.md`, because current docs intentionally point to them as dated proof/probe provenance.
- Unreviewed in this tranche: non-process RCA docs were read for SSOT alignment and stale dated-reference cleanup only. Full line-by-line governance of all RCA docs remains open under the parent OPL series goal unless covered by prior accepted tranches.
- Remaining stale / retire candidates in RCA process history: none identified after compression. Open RCA work remains the production evidence tail, generated/default caller thinning and strict source-purity tail already listed in the active gap plan.
- Next write scope: return to dirty `one-person-lab` and `med-autoscience` only when their concurrent write sets are safe to absorb or a clean isolated source-of-truth worktree can be used.
