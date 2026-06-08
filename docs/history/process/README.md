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
| [Real-route evolution probe](./real-route-evolution-probe.md) | route probe provenance | Preserves compressed owner map and historical readout. Probe command shape, output fields, cache behavior and typed blockers return to scripts, contracts, tests, runtime-family source, artifacts, review/export gates and owner receipts. |
| [Retired surface provenance](./retired-surface-provenance.md) | compressed no-resurrection / process foldback record | Replaces per-tranche closeout files for docs lifecycle SSOT lanes, command-surface cleanup, helper/fallback/facade/test retirement, and stale workflow/entry provenance. |

## Compressed Provenance

| Provenance group | What remains here | What moved out |
| --- | --- | --- |
| Docs lifecycle and coverage | 本索引记录 current owner、retained evidence records、coverage snapshot 和 reopen 入口。 | Dated coverage ledger、frozen inventory、docs lifecycle cleanup closeout、doctor transcript、worktree closeout 和 proof-by-proof table 不再以单独 Markdown 文件维护。 |
| Current-doc SSOT lanes | `retired-surface-provenance.md` 保留 public/product/runtime/delivery/source/policy/spec/reference/active-baton SSOT lanes 的 compressed owner map。 | Durable rules 已折回 `docs/docs_portfolio_consolidation.md`、`docs/README.md`、核心五件套、active plan 和 owner docs。 |
| Retired command / helper / fallback / test / workflow surfaces | `retired-surface-provenance.md` 保留 no-resurrection rules 和 current owner refs。 | `frontdoor` field wording、hosted-attempt production helper、incremental screenshot stale prior backfill、MCP route fallback、Python helper script fallback、TypeScript presence lock、Stage Folder flat fixture 和 stale physical surface closeout 文件已压缩。 |
| Production evidence and route probe | 两个 retained process records 保存 dated proof/probe details。 | Current production evidence tail, readiness claims and next owner delta remain in active plan, production acceptance contracts, runtime evidence and owner receipts. |

## Coverage Snapshot

2026-06-08 RCA public-doc support lifecycle tranche:

- Theme / SSOT: public narrative entry and public support docs. Current public
  narrative owners are root `README.md`, `README.zh-CN.md`, and
  `docs/public/README.md`; current technical, status, readiness, runtime,
  artifact-authority and review/export truth remains in the core five docs,
  `docs/active/rca-ideal-state-gap-plan.md`,
  `docs/docs_portfolio_consolidation.md`, contracts, source, focused tests,
  CLI/MCP/API behavior, runtime artifacts, owner receipts and RCA-owned
  review/export gates.
- Reviewed: `AGENTS.md`, `TASTE.md`, root `README.md`,
  root `README.zh-CN.md`, `docs/public/README.md`, `docs/README.md`,
  `docs/project.md`, `docs/status.md`, `docs/invariants.md`,
  `docs/active/rca-ideal-state-gap-plan.md`,
  `docs/docs_portfolio_consolidation.md`, this process index, and stale-word
  scans over root README/public/status/active/doc-portfolio/process surfaces.
- Edited: this file only.
- Coverage result: the public docs already keep one role: public repository
  entry plus thin public narrative index. They preserve RedCube AI as a
  visual-deliverable Foundry Agent and keep OPL as hosted integration context,
  while avoiding GUI/WebUI maturity, visual ready, exportable, handoffable,
  domain ready, production ready, artifact-authority or runtime-readiness
  claims. No public doc needs to become a parallel current truth owner.
- Retired / guarded: no file, command, contract, source module, test, workflow
  or public doc was retired in this tranche. The guarded stale surfaces are old
  Gateway/frontdoor/federation/Hermes-first/source-pack federation, old
  workbench, capabilities and compatibility narratives; they remain excluded
  from public docs unless reintroduced as history/provenance with current owner
  pointers.
- Remaining RCA unreviewed scope under the parent OPL series goal: references
  body governance, historical Hermes / Phase 2 bodies, tombstones, active
  private inventory details, generated/default caller thinning evidence tails,
  and full paragraph-level governance for support/history docs not covered by
  accepted SSOT tranches.
- Next write scope: continue with a concrete SSOT theme after fresh intake,
  likely reference-doc body governance, individual history bodies, active
  private inventory details or a clean sibling repo lane. Do not use this
  public-doc review as proof that every RCA `docs/**/*.md` paragraph has been
  line-reviewed.

2026-06-08 RCA product/runtime/delivery/source/policies thin-support lifecycle tranche:

- Theme / SSOT: product, runtime, delivery, source, policy and specs support
  docs as thin owner indexes. Current SSOT remains the core five docs,
  `docs/active/rca-ideal-state-gap-plan.md`,
  `docs/docs_portfolio_consolidation.md`, `docs/README.md`,
  `contracts/runtime-program/current-program.index.json`,
  `contracts/runtime-program/current-program-parts/**`,
  `contracts/production_acceptance/rca-production-acceptance.json`,
  route/stage/source contracts, source/CLI/MCP/API behavior, focused tests,
  runtime artifacts, owner receipts and RCA-owned review/export gates.
- Reviewed: `AGENTS.md`, `TASTE.md`, `docs/docs_portfolio_consolidation.md`,
  `docs/README.md`, `docs/status.md`, `docs/architecture.md`,
  `docs/invariants.md`, `docs/decisions.md`,
  `docs/active/rca-ideal-state-gap-plan.md`, `docs/product/README.md`,
  `docs/runtime/README.md`, `docs/runtime/runtime_architecture.md`,
  `docs/delivery/README.md`, `docs/source/README.md`,
  `docs/policies/README.md`, `docs/specs/README.md`,
  `contracts/runtime-program/current-program.index.json`,
  `contracts/production_acceptance/rca-production-acceptance.json`, support
  docs stale-word scans and this process index.
- Edited: this file only.
- Coverage result: product/runtime/delivery/source/policies/specs support docs
  already point back to owner docs and machine surfaces. They keep route, proof,
  source-readiness, runtime and policy readouts as human guidance, while visual
  ready, exportable, handoffable, domain ready, production ready, artifact
  authority and review/export verdicts remain RCA-owned machine/receipt gates.
  No support README needs expansion into a parallel current truth owner.
- Retired / guarded: no file, command, contract, source module, test, workflow
  or support README was retired in this tranche. The guarded stale surface is a
  future rewrite that would make support docs carry proof logs, route probe
  command/output ledgers, GUI/WebUI readiness, generic runtime ownership,
  fallback chains, or old Gateway / frontdoor / federation / managed-runtime
  compatibility.
- Remaining RCA unreviewed scope under the parent OPL series goal: full
  line-by-line semantic governance remains open for individual support doc
  bodies beyond the reviewed owner-boundary sections, references, public docs,
  historical Hermes / Phase 2 bodies, tombstones, active private inventory
  details and generated/default caller thinning evidence tails.
- Next write scope: continue with a concrete SSOT theme after fresh intake,
  likely reference-doc body governance, public docs, individual history bodies,
  active private inventory details or a clean sibling repo lane. Do not use this
  thin-support review as proof that every support/reference/history paragraph
  has been line-reviewed.

2026-06-08 RCA real-route probe history compression tranche:

- Theme / SSOT: real-route evolution probe provenance versus current machine owners. Current SSOT for runnable commands, parameters, output fields, cache behavior, typed blockers and regression coverage is `scripts/run-real-route-evolution-probe.ts`, `tests/real-route-evolution-probe.test.ts`, `tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts`, `contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json`, route contracts, delivery owner docs and RCA-owned review/export gates.
- Reviewed: `AGENTS.md`, `TASTE.md`, `docs/docs_portfolio_consolidation.md`, `docs/README.md`, `docs/delivery/README.md`, `docs/delivery/image-first-ppt-production-route.md`, `docs/history/process/README.md`, `docs/history/process/real-route-evolution-probe.md`, `docs/active/rca-ideal-state-gap-plan.md`, `scripts/run-real-route-evolution-probe.ts`, `tests/real-route-evolution-probe.test.ts`, and `contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json`.
- Edited: `docs/history/process/real-route-evolution-probe.md`, `docs/history/process/README.md`, `docs/docs_portfolio_consolidation.md`, and `docs/README.md`.
- Coverage result: the retained probe record no longer carries long runnable command blocks, absolute sample-root paths, output-field handbooks, run/proof transcript shape, or dated timing readouts as current guidance. It now keeps a compressed owner map, narrow historical facts and no-resurrection rules. Current probe behavior returns to scripts, contracts and focused tests.
- Retired / guarded: no script, contract or test was retired. The retired surface is the duplicate process-history command/output ledger inside the human provenance file; do not recreate it in current delivery docs or active docs.
- Verification boundary: `git diff --check`, conflict-marker scan, OPL Doc doctor, `npm run --silent build`, and `node --experimental-strip-types --test tests/real-route-evolution-probe.test.ts` passed in the isolated worktree. `tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts` is a current regression owner, but it is baseline-red on unchanged `origin/main` at `8ec7eb0a` with OPL route attempt evidence / repeated-block blocker drift; this tranche did not change runtime or test surfaces and does not use that red lane as pass proof.
- Remaining RCA unreviewed scope under the parent OPL series goal: full line-by-line RCA docs governance remains open beyond this probe theme, especially product/runtime/source/policy/support docs and individual history body audits not covered by prior accepted tranches.
- Next write scope: continue with a concrete SSOT theme after fresh intake; likely candidates are another retained history/provenance body or thin support docs whose current commands already have source/test owners. Avoid `one-person-lab` and `med-autoscience` writes while their concurrent dirty write sets remain active.

2026-06-08 RCA process-history compression tranche:

- Reviewed: `AGENTS.md`, `TASTE.md`, `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, `docs/docs_portfolio_consolidation.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/history/README.md`, previous `docs/history/process/*.md`, package / verification metadata, and exact contract/source/test references to dated process files.
- Edited: `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md`, `docs/docs_portfolio_consolidation.md`, `docs/README.md`.
- Compressed / deleted: previous dated process closeout Markdown files whose durable conclusions already live in current owners above or in `retired-surface-provenance.md`.
- Retained: `2026-06-03-rca-dated-production-evidence-foldback.md` and `real-route-evolution-probe.md`, because current docs intentionally point to them as dated proof/probe provenance. The route probe record is compressed to an owner map; script/tests/contracts carry command and output details.
- Unreviewed in this tranche: non-process RCA docs were read for SSOT alignment and stale dated-reference cleanup only. Full line-by-line governance of all RCA docs remains open under the parent OPL series goal unless covered by prior accepted tranches.
- Remaining stale / retire candidates in RCA process history: none identified after compression. Open RCA work remains the production evidence tail, generated/default caller thinning and strict source-purity tail already listed in the active gap plan.
- Next write scope: return to dirty `one-person-lab` and `med-autoscience` only when their concurrent write sets are safe to absorb or a clean isolated source-of-truth worktree can be used.
