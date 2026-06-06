# RCA product-entry support SSOT closeout

Owner: `RedCube AI`
Purpose: `product_entry_support_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 runtime-program contracts、product-entry manifest、CLI/MCP/API behavior、domain-handler source、runtime workspace、owner receipts、typed blockers 和 RCA-owned review/export gates。

本文记录 2026-06-06 OPL Doc 语义治理中 `product/operator support / product-entry reference` 主题的 Single Source of Truth 收敛。它不承担 product-entry contract truth，不声明 GUI/WebUI ready、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。

## Semantic Theme

本轮治理的语义主题是 RCA product/operator support：人类用户如何从 product docs 进入 RedCube workspace，direct product entry / OPL-hosted entry / session continuity 的人读支撑如何归位，以及旧 managed product-entry、status/session/manifest wrapper、GUI/WebUI、frontdesk、federation、gateway 或 compatibility alias 不得回到 active product support。

Single Source of Truth 分层：

- 机器真相：`contracts/runtime-program/redcube-product-entry-mvp.json`、`contracts/runtime-program/product-entry-session-continuity.json`、`contracts/runtime-program/opl-framework-hosted-product-entry.json`、product-entry manifest、domain-handler source、CLI/MCP/API behavior、runtime workspace 和 owner receipts。
- Human/operator product owner：`docs/product/human_quickstart.md`，只持有人类用户如何准备 workspace、source readiness、deliverable 与 review/export 工作线的操作口径。
- Product index owner：`docs/product/README.md`，只说明 `docs/product/` 的目录职责、当前 product-facing 文档和非兼容边界。
- Product-entry support owner：`docs/references/product-entry/`，只解释 direct product entry、session continuity 与 OPL-hosted integration 的 contract-linked support，不承担 active plan。
- Active gap owner：`docs/active/rca-ideal-state-gap-plan.md`，持有 generated/default caller thinning、product wrapper 收薄、compatibility-free retirement 和 production evidence tail 的当前执行顺序。

## Peer Docs and Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| `docs/product/human_quickstart.md` | `human_operator_support_owner` | Kept as product/operator quickstart SSOT; it explains workspace, Source Readiness, deliverable granularity and review/export workflow without duplicating product-entry contract fields. |
| `docs/product/README.md` | `active_support_index` | Kept as product docs index; it points to quickstart/profile/publish guides and says retired wrapper/managed/session/GUI/WebUI/compatibility surfaces are not active product compatibility. |
| `docs/product/private-profile-setup.md` | `more_specific_detail` | Kept as private profile setup guide; local profile defaults cannot override source truth, approved materials, visual direction, readiness, review/export verdicts or owner receipts. |
| `docs/product/public-github-publish.md` | `more_specific_detail` | Kept as public repository publishing guide; it governs public/private material split, not product-entry runtime truth. |
| `docs/references/product-entry/README.md` | `support_reference_index` | Kept as contract-linked support index; links already point to the actual underscore-named files and old managed product-entry support is tombstone-only. |
| `docs/references/product-entry/redcube_product_entry_mvp.md` | `contract_linked_support` | Kept as direct `invokeProductEntry` support brief; it does not own new active plan or compatibility wrapper. |
| `docs/references/product-entry/product_entry_session_continuity.md` | `contract_linked_support` | Kept as session-continuity support brief; repo-local product session CLI remains retired/generated-owner-only. |
| `docs/references/product-entry/opl_framework_hosted_product_entry.md` | `contract_linked_support` | Kept as OPL-hosted support brief; OPL-generated `domain_action_adapter` descriptor remains framework-side descriptor, not RCA-owned generic wrapper. |
| `docs/architecture.md` / `docs/status.md` | `current_truth_readout` | Kept as current architecture/status owners; they already distinguish direct route, OPL-hosted route, generated/default shell and non-GUI readiness. |
| `docs/history/tombstones/retired-managed-product-entry-contract-2026-05-20.md` | `history_or_provenance` | Kept as tombstone for old managed product-entry hardening; no compatibility alias/facade restored. |
| Contracts/source/tests | `machine_truth` | No behavior, contract, source or test change in this lane. |

## Content-Level Consolidation

- Current human/operator guidance stays in `docs/product/human_quickstart.md`; it is intentionally user/workspace oriented and does not copy contract field matrices.
- Product-entry contract support stays under `docs/references/product-entry/`; those briefs explain landed contracts but do not become active product current truth or active follow-up board.
- Machine-readable product-entry truth stays in runtime-program contracts, product-entry manifest and domain-handler source.
- Old managed product-entry wording remains tombstone/provenance only. No product-entry wrapper, status/session/manifest CLI compatibility, GUI/WebUI readiness, gateway/frontdesk/federation alias, facade, wrapper or compatibility-only test was added.
- No current product/support text was rewritten because the peer docs already have one role each and the product-entry index links resolve to current support files.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-product-entry-support-ssot-20260606` after this closeout and index update:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" docs/history/process/README.md docs/history/process/2026-06-06-rca-product-entry-support-ssot-closeout.md
rtk rg -n "\\]\\(\\./[^)]*-.*\\.md\\)|\\]\\(\\.\\./[^)]*-.*\\.md\\)" docs/references/product-entry docs/product --glob "*.md"
rtk rg -n "mature GUI|mature WebUI|GUI/WebUI ready|managed product-entry active|compatibility alias|gateway frontdesk|federation alias|product status/session/manifest wrapper" docs/product docs/references/product-entry docs/architecture.md docs/status.md
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Product/product-entry markdown link-shape scan returned only current existing hyphenated filenames outside the product-entry support index; product-entry index links resolve to actual underscore-named files.
- Product/operator stale-surface scan returned only negative guard language in `docs/product/README.md`: retired wrapper / managed/session / GUI/WebUI / compatibility surfaces are not active product compatibility. It found no active GUI/WebUI readiness, managed product-entry active claim, frontdesk/federation alias or product status/session/manifest wrapper claim in the current product/reference set.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane covers only RedCube product/operator support and product-entry reference docs. It does not claim full RedCube docs portfolio completion and does not close the six-repo OPL series `/goal`.

Open carry-forward:

- RedCube still needs separate semantic lanes for broader delivery lifecycle, public narrative, policy/spec/reference currentness and stale physical surface retirement.
- Physical retirement of stale modules/interfaces/tests/workflows/entries remains gated by replacement owner, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer; once those gates pass, stale surfaces should be deleted or tombstoned without compatibility shims.
