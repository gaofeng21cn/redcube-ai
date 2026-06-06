# RCA delivery lifecycle SSOT closeout

Owner: `RedCube AI`
Purpose: `delivery_lifecycle_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 route contracts、Stage Folder / artifact locator contracts、runtime-family source、workspace artifacts、artifact manifests、review/export receipts、owner receipts、typed blockers 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 artifact authority。

本文记录 2026-06-06 OPL Doc 语义治理中 `delivery lifecycle / route-proof-export support` 主题的 Single Source of Truth 收敛。它不改写 delivery route 合同，不声明任何新 route readiness，也不关闭生产证据尾项。

## Semantic Theme

本轮治理的语义主题是 RCA delivery lifecycle：deliverable family 示例、PPT image-first 默认路线、HTML 显式可选路线、native editable PPTX 显式可选路线、route proof / export support、Stage Folder artifact truth，以及 real-route probe / dated sample evidence 的当前分层。

Single Source of Truth 分层：

- 机器真相：`contracts/runtime-program/ppt-image-first-production-route.json`、`contracts/runtime-program/ppt-html-route-quality-nonregression.json`、`contracts/runtime-program/ppt-native-ai-first-design-pack.json`、`contracts/runtime-program/ppt-native-pptx-quality-nonregression.json`、`contracts/stage_artifact_kernel_adoption.json`、`contracts/artifact_locator_contract.json`、runtime-family source、tests、workspace artifacts、artifact manifests、review/export receipts、owner receipts 和 typed blockers。
- Delivery support owner：`docs/delivery/README.md` 和 `docs/delivery/*.md`，只解释 deliverable examples、default / explicit optional route、proof environment、review/export support 和 no-readiness boundary。
- Active gap owner：`docs/active/rca-ideal-state-gap-plan.md`，持有 production evidence tail、Temporal controlled visual-stage long soak、generated/default caller thinning、domain ready / handoffable / production ready 未关闭状态和下一步 owner-delta 顺序。
- Runtime / artifact owner docs：`docs/runtime/README.md`、`docs/runtime/runtime_architecture.md` 和核心五件套，解释 Stage Folder、artifact locator、runtime owner、OPL-hosted projection 和 RCA review/export authority 边界。
- History owner：`docs/history/process/real-route-evolution-probe.md`、`docs/history/process/2026-06-03-rca-dated-production-evidence-foldback.md`、`docs/history/phase-2/**` 和 `docs/history/plans/**`，只保留 manual validation、route evolution probe、dated sample roots、workspace refs、probe commands、proof transcripts、旧 direct-delivery target freeze 和已吸收 closeout provenance。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/delivery/README.md` | `delivery_support_index` | Kept as delivery docs SSOT index; it already states examples / route notes / proof environments are support-only and dated probes belong in history. |
| `docs/delivery/deliverable_examples.md` | `more_specific_detail` | Kept as family / route reader context; examples are not readiness proof and do not replace source readiness, route artifact, manifest, review/export gate or owner receipt. |
| `docs/delivery/image-first-ppt-production-route.md` | `current_route_support` | Kept as image-first default route support; machine truth remains in route contract/source/tests and final visual/export verdict remains with RCA gates. |
| `docs/delivery/html-ppt-route-quality.md` | `current_route_support` | Kept as explicit optional HTML route support; it does not change default image-first route, default executor or review/export gate. |
| `docs/delivery/native-ppt-proof-environment.md` | `current_route_support` | Kept as explicit optional native PPTX proof environment support; native dated sample evidence already lives in history/process. |
| `docs/runtime/README.md` / `docs/runtime/runtime_architecture.md` | `runtime_boundary_support` | Kept as runtime owner / Stage Folder / evidence-class readout; does not own route contract fields or delivery examples. |
| `docs/active/rca-ideal-state-gap-plan.md` | `active_truth_owner` | Kept as only active completion plan; production evidence tail and generated/default caller thinning remain open. |
| `docs/references/README.md` / `docs/references/native-ppt-open-source-design-discipline.md` | `support_reference` | Kept as reference index and native PPTX design-discipline reference; current delivery truth remains in delivery owner docs, contracts and RCA gates. |
| `docs/history/process/real-route-evolution-probe.md` | `history_or_provenance` | Kept as route evolution probe command / output shape / sample root / efficiency provenance; not current delivery owner. |
| `docs/history/process/2026-06-03-rca-dated-production-evidence-foldback.md` | `history_or_provenance` | Kept as dated live proof / no-regression evidence foldback; current evidence tail remains active-plan / production-acceptance owned. |
| `docs/history/phase-2/stable_deliverable_manual_test_brief.md` and Phase 2 delivery closeouts | `history_or_provenance` | Kept as absorbed manual validation / Phase 2 delivery hardening provenance; not active route truth. |
| `docs/history/plans/2026-04-09-direct-delivery-longrun-target-state.md` | `history_or_provenance` | Kept as archived future target freeze; current delivery truth returns to delivery/runtime owner docs and contracts. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- Current route truth remains contract/source/test owned. Delivery docs keep route support summaries and no-readiness boundaries, not machine fields or route proof ledgers.
- `ppt_deck` default route remains image-first `author_image_pages`; HTML and native editable PPTX remain explicit optional routes, not fallback chains.
- Stage Folder / artifact locator truth remains machine-readable and runtime-owned: completion requires required roles, manifest, receipt refs and current/latest pointer; orphan files and derived read models do not complete a stage.
- AgentLab, mock provider, deterministic fixture and proof runner outputs remain refs-only / plumbing evidence. They cannot authorize visual ready, exportable, handoffable, artifact writes, memory body writes, review/export verdicts or production long soak.
- Dated probe commands, workspace paths, sample roots, artifact refs and proof transcripts stay under `docs/history/process/**` or runtime/evidence ledger; current delivery owner docs do not carry long chronological proof lists.
- No current delivery text was rewritten because peer docs already have one durable role each and no active/support section was found promoting mock/probe/provider completion to readiness.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai-doc-delivery-ssot` after this closeout and index update:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/history/process/README.md docs/history/process/2026-06-06-rca-delivery-lifecycle-ssot-closeout.md
rtk rg -n "visual ready|exportable|handoffable|production ready|domain ready|production visual-stage|readiness|ready" docs/delivery docs/product docs/runtime docs/source docs/references docs/policies docs/specs docs/active README*
rtk rg -n "planned|done|deferred|skipped|verification|run id|attempt id|workspace path|screenshot path|branch|SHA|commit|probe command|sample root|dated|2026-" docs/delivery docs/product docs/runtime docs/source docs/references docs/specs docs/active
rtk rg -n "fallback|compat|legacy|deprecated|retired|old|managed|gateway|frontdoor|federation|bridge|Hermes-first|local-manager|wrapper|facade|alias" docs/delivery docs/product docs/runtime docs/source docs/references docs/specs docs/active README*
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Readiness / stale-surface scans found boundary-warning and negative-guard language only: delivery support docs and peers repeatedly route readiness / export / handoff authority back to RCA gates, production acceptance, active plan or history/provenance.
- Historical-increment scan confirmed active delivery docs do not carry probe command ledgers, sample roots, workspace paths, attempt ids, branch/SHA notes or closeout transcripts; dated details stay in history/process or historical plans.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only RedCube delivery lifecycle / route-proof-export support docs. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for public narrative, policy/spec/reference currentness and broader stale physical surface retirement.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
