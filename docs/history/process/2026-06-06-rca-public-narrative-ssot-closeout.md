# RCA public narrative SSOT closeout

Owner: `RedCube AI`
Purpose: `public_narrative_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 contracts、schema、source、CLI/MCP/API behavior、product-entry manifest、runtime artifacts、owner receipts、artifact locator 和 RCA-owned review/export gates；本文不作为 GUI/WebUI ready、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete 证据。

本文记录 2026-06-06 OPL Doc 语义治理中 `public narrative / first public identity` 主题的 Single Source of Truth 收敛。它不改写公开 README 叙事，不新增 public body，也不把旧 gateway / federation / Hermes-first / OPL-first 叙事恢复成当前入口。

## Semantic Theme

本轮治理的语义主题是 RCA public narrative：仓库首页、中文首页、`docs/public/` 薄索引、docs 入口和核心五件套如何共同表达 RedCube 的第一公开身份，以及旧 public entry / gateway / harness / frontdoor / federation / OPL-first / Hermes-first 口径如何留在 history/tombstone/provenance。

Single Source of Truth 分层：

- Public entry owner: `README.md` 和 `README.zh-CN.md`。它们持有当前公开首页叙事：RedCube AI 是 formal visual deliverable 的 AI workspace / visual-deliverable Foundry Agent，先面向用户解释 source、generation、review、revision、progress 和 export file handoff，再把 OPL-hosted path 放入 technical/operator boundary。
- Public index owner: `docs/public/README.md`。它只承接 OPL-family canonical `docs/public/` 目录职责，保持薄索引，不复制公开正文，不吸收旧 program/capability/reference 正文。
- Technical current-truth owners: `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` 和 runtime-program contracts。它们持有 package surface、formal-entry matrix、direct/hosted boundary、OPL/Temporal hosted posture、Codex executor default、non-GUI/WebUI boundary 和 readiness caveats。
- Product / operator support owners: `docs/product/README.md`、`docs/product/human_quickstart.md` 和 `docs/references/product-entry/`。它们解释 human/operator entry 和 product-entry support，不承担 public homepage truth。
- History / tombstone owners: `docs/history/positioning/**`、`docs/history/tombstones/**`、`docs/history/plans/**` 和 `docs/history/process/**`。它们只保留旧 route narrative、historical positioning、dated proof 和 process provenance。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `README.md` | `public_entry_owner` | Kept as English public repository entry; it starts from visual-deliverable user problems and keeps OPL/executor details inside technical/operator sections. |
| `README.zh-CN.md` | `public_entry_owner_zh_cn` | Kept as Chinese public repository entry; it mirrors the same public identity and boundary without becoming a machine interface. |
| `docs/public/README.md` | `public_narrative_index` | Kept as thin public index; it explicitly blocks old program, Hermes/Gateway, federation, capabilities and compatibility narrative from entering this layer. |
| `docs/README.md` | `docs_entry_index` | Kept as docs navigation and lifecycle role table; it points public readers to README first and routes technical truth to core docs/contracts. |
| `docs/project.md` / `docs/status.md` / `docs/architecture.md` | `current_truth_readout` | Kept as technical current truth owners for package surface, direct/hosted route, OPL/Temporal hosted posture, executor boundary and non-readiness caveats. |
| `docs/invariants.md` / `docs/decisions.md` | `current_policy` | Kept as stable policy and decision owners for first-public-identity, no old-route resurrection and no compatibility surface rules. |
| `docs/product/README.md` / `docs/product/human_quickstart.md` | `more_specific_detail` | Kept as product/operator support; they do not replace public homepage narrative or claim GUI/WebUI readiness. |
| `docs/history/tombstones/retired-route-narratives-2026-05-11.md` | `history_or_provenance` | Kept as tombstone for gateway-first, frontdoor-first, federation-first, harness-first, OPL-first and Hermes-first route narratives. |
| `docs/history/positioning/domain-harness-os-positioning.md` | `history_or_provenance` | Kept as historical positioning / internal boundary vocabulary reference, not public identity owner. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- Public narrative already has one owner: root `README*`. The current text starts from visual delivery user needs, then routes technical OPL / executor material into details and operator quickstart sections.
- `docs/public/README.md` is intentionally thin. It should not grow into a parallel README or import historical capability/program copy unless there is a real public/product need and the core owner docs are updated together.
- Current package / runtime / formal-entry / readiness truth stays with core five docs and contracts. Public README may summarize visible product value and next hops, but it is not a machine truth owner.
- Historical gateway/frontdoor/federation/harness/OPL-first/Hermes-first route narratives stay in tombstone/history/provenance. No public alias, facade, wrapper, old workflow entry, compatibility-only test or old public entry was added.
- No current public text was rewritten because the peer docs already have one durable role each and scans found only explicit boundary or negative-guard language around old route names, GUI/WebUI readiness and production/readiness claims.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai-doc-public-narrative` after this closeout and index update:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/history/process/README.md docs/history/process/2026-06-06-rca-public-narrative-ssot-closeout.md
rtk rg -n "public|公开|first public|第一公开|public identity|公开身份|Foundry Agent|visual-deliverable|视觉交付|OPL-compatible|GUI|WebUI|gateway|Gateway|frontdoor|frontdesk|federation|federated|bridge|harness|Hermes-first|production ready|domain ready|handoffable|exportable|visual ready" README.md README.zh-CN.md docs/*.md docs/public/README.md docs/product/*.md docs/references/*.md docs/references/product-entry/*.md docs/history/positioning/*.md docs/history/tombstones/*.md
rtk rg -n "run id|run_id|attempt_id|attempt id|workspace path|sample root|branch|SHA|commit|closeout|proof|probe|dated|2026-" README.md README.zh-CN.md docs/public/README.md docs/project.md docs/status.md docs/README.md
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Public identity / stale-route scan returned current public identity statements, technical boundary wording, history/tombstone provenance and explicit negative guards only. It found no active OPL-first, gateway-first, federation/frontdesk, Hermes-first, GUI/WebUI ready, visual ready, exportable, handoffable, domain ready or production ready claim in the public/current target set.
- Historical-increment scan confirmed root README / `docs/public` do not carry probe command ledgers, sample roots, workspace paths, attempt ids, branch/SHA notes or closeout transcripts. Current status docs keep bounded current-state dates and history pointers; process details stay in history/process or runtime/evidence ledgers.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only RedCube public narrative / first-public-identity docs. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for policy/spec/reference currentness and broader stale physical surface retirement.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
