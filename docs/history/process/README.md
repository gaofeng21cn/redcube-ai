# RCA process history

Owner: `RedCube AI`
Purpose: `process_history_index`
State: `historical_archive_index`
Machine boundary: 本文是人读过程历史索引。当前机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locators、review/export gates 和当前 owner docs。

本目录只保留 RCA docs lifecycle、production evidence foldback、route probe 和 retired surface no-resurrection 的压缩 provenance。历史过程按主题读取，不维护逐日 closeout 长清单。若某条历史结论仍有当前规则价值，先折回 `docs/docs_portfolio_consolidation.md`、核心五件套、active gap plan、owner docs、contracts、source、tests 或 runtime evidence，再把过程记录压缩在本目录。

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

| Provenance group | Current read |
| --- | --- |
| Docs lifecycle and coverage | Dated coverage ledger、frozen inventory、docs lifecycle cleanup closeout、doctor transcript、worktree closeout 和 proof-by-proof table 不作为当前 truth 维护；本索引只保留主题级 coverage 与 reopen 入口。 |
| Current-doc SSOT lanes | `retired-surface-provenance.md` 保留 public/product/runtime/delivery/source/policy/spec/reference/active-baton SSOT lanes 的 compressed owner map。Durable rules 已折回 `docs/docs_portfolio_consolidation.md`、`docs/README.md`、核心五件套、active plan 和 owner docs。 |
| Retired command / helper / fallback / test / workflow surfaces | `retired-surface-provenance.md` 保留 no-resurrection rules 和 current owner refs。`frontdoor` field wording、hosted-attempt production helper、incremental screenshot stale prior backfill、MCP route fallback、Python helper script fallback、TypeScript presence lock、Stage Folder flat fixture 和 stale physical surface closeout 文件已压缩。 |
| Product-entry handoff overview duplication | `docs/references/integration/lightweight-product-entry-and-opl-handoff.md` 已退役为重复 support overview。Current direct / hosted entry truth 读 `docs/references/product-entry/` 三个 contract-linked brief、`docs/references/integration/opl-family-contract-adoption.md`、核心五件套和 runtime-program contracts。 |
| Hermes / Phase 2 / plans / tombstone bodies | Historical bodies keep only provenance, current owner maps and no-resurrection rules. Active-looking command lists, proof transcripts, quickstart/runbook boards, source/review/delivery contract tables, native proof handbooks, upstream Hermes pilot wording and continuation boards must not be reused as current guidance. |
| Production evidence and route probe | Retained process records保存 dated proof/probe details。Current production evidence tail, readiness claims and next owner delta remain in active plan, production acceptance contracts, runtime evidence and owner receipts. |

## Coverage Summary

| Theme | Current coverage | Remaining scope / next write |
| --- | --- | --- |
| RCA docs portfolio scope | Root `README*`, every tracked `docs/**/*.md`, and docs-like tracked support indexes such as `agent/README.md`, `contracts/README.md`, `runtime/README.md`, `config/local/README.md`, and prompt support `README.md` files have lifecycle roles routed through `docs/README.md`, `docs/docs_portfolio_consolidation.md`, directory indexes, this process index and retained provenance records. Duplicate active references such as the retired product-entry handoff overview do not remain as compatibility paths. | Reopen a specific document body only when a fresh scan finds active-looking checklist text, reusable prompt material, current-owner conflict, stale SSOT duplication, missing lifecycle metadata, or machine surface dependence on historical prose. |
| Active truth owners | `docs/active/rca-ideal-state-gap-plan.md` remains the only active completion / gap / baton owner. `docs/active/opl-private-implementation-migration-inventory.md` remains the surface-id and path-level private implementation owner. Lifecycle policy remains in `docs/docs_portfolio_consolidation.md`; this file only keeps process provenance. | Private-inventory refreshes should start from `contracts/physical_source_morphology_policy.json` and `contracts/private_functional_surface_policy.json`, then fold concrete source/contract/test retirement candidates into the active inventory or retired-surface provenance. Generated/default caller thinning evidence tails remain active work under the active plan, not process-history work. |
| Content-level consolidation | Adapter-thinning, Hermes command-list, Phase 2 high-risk/residual, tombstone and plans-history details are represented by the provenance groups above and by the corresponding history directory indexes. Fresh lifecycle metadata scan found no tracked `docs/**/*.md` missing owner / purpose / state / machine boundary. Detailed rewrite facts stay recoverable from git history and retained provenance files; current rules stay in owner docs, contracts and tests. | Do not add file-by-file closeout logs here. If a historical rule is still current, fold it back into the owner doc, contract, source or test before compressing the process trace. |
| Hermes pilot wording SSOT | Fresh OPL Doc lane found one stale current-sounding line in `docs/decisions.md` that still said the current mainline should proceed to a real upstream `Hermes-Agent` pilot. The line was folded into the current SSOT: core docs, active plan, runtime architecture, runtime-program contracts and executor-routing tests say Temporal-backed OPL provider is the production online substrate, `Codex CLI` is default, and `hermes_agent` remains explicit non-default adapter / proof backend. | Do not reopen upstream Hermes pilot as a current implementation checklist, default runtime owner, readiness proof or compatibility surface. Current active caller proof for Hermes API / loop bridge helpers remains under executor adapter / proof-backend owners; physical delete still requires no-active-caller, replacement proof and RCA owner receipt or typed blocker. |
| Retired / guarded surfaces | This index records no source, contract, test, workflow or package deletion authority by itself. Guarded retired surfaces remain active-looking Hermes/Phase 2/history prose, repo-local product/session/domain_action_adapter/runtimeWatch/operator projection compatibility wording, old public path tests, alias/facade/fallback surfaces, `legacy_payload_field_aliases` and physical-delete-by-read-model claims. | Concrete retirement lanes need no-active-caller, replacement owner, RCA owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer before physical delete or test/interface retirement. |
| Parent OPL series goal | RCA human-doc inventory is covered for this tranche: active/current docs, support/reference docs and retained history/provenance bodies have SSOT owners or directory-index owner maps, while precise historical proof details remain recoverable from retained files and git history. This is a tranche-level foldback, not six-repo completion. | Remaining RCA scope is functional/evidence work: production-like no-regression, Temporal visual-stage long soak, generated/default caller thinning and concrete source/contract/test retirement lanes. Do not expand this process index back into dated proof logs. |
| 2026-06-12 OPL Doc readback | Fresh six-repo OPL Doc readback reconfirmed RCA's SSOT shape: ideal state stays in `docs/references/rca-visual-deliverable-agent-ideal-state.md`, the only active plan is `docs/active/rca-ideal-state-gap-plan.md`, path-level private implementation detail stays in `docs/active/opl-private-implementation-migration-inventory.md`, and runtime/delivery/source/product support docs remain support owners rather than readiness truth. `docs/decisions.md` 2026-04 OPL hosted / Hermes / Phase 2 / pack/compiler / public-identity decision bodies were compressed into a topic-level current-read table pointing back to core docs, active plan, runtime docs and history provenance. | Next RCA docs write scope is limited to concrete `status.md` / `architecture.md` / `decisions.md` thinning or physical retirement lanes with replacement proof; this readback authorizes no source, contract, test, workflow, package or interface deletion by itself. |
| 2026-06-12 docs lifecycle migration-list compression | `docs/docs_portfolio_consolidation.md` no longer carries the step-by-step migrated-file list for public/spec thin indexes, product-entry support, route probe, future freeze, historical positioning, creative-stage audit and old route vocabulary. Those details are compressed here and in retained history/tombstone files; the active governance page keeps only current semantic owner/disposition. | Future RCA docs lifecycle updates should add topic-level process rows only when a new semantic owner decision is made. Do not re-expand the active governance page into path-by-path closeout logs, branch/worktree cleanup records or proof transcripts. |
