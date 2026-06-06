# RCA broader docs portfolio SSOT closeout

Owner: `RedCube AI`
Purpose: `broader_docs_portfolio_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 contracts、schema、source、CLI/MCP/API behavior、product-entry manifest、runtime artifacts、owner receipts、artifact locator 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-07 OPL Doc 语义治理中 `broader docs portfolio` 主题的 Single Source of Truth 覆盖收口。本轮不改写 active/current docs 正文，因为当前 docs portfolio 已经按 OPL-family canonical taxonomy 分层，旧 program/capability/gateway/frontdoor/federation/Hermes-first/workbench/compatibility 词汇在当前层只作为 retired boundary、tombstone/provenance、refs-only adapter、domain handler target、delete-tail 或 no-resurrection policy 出现，没有形成第二 active truth。

## Semantic Theme

本轮治理主题是 RCA broader docs portfolio 是否仍有过时模块、接口、测试或文档入口在当前 docs 层被误读为 active surface。审计范围覆盖非 history `docs/**/*.md`、根层 / 近根 `README*`、核心五件套、active plan、product/runtime/delivery/source/policies/public/specs/references 索引和 support docs，并交叉读取 prior stale physical surface 与 docs index lifecycle closeout。

Single Source of Truth 分层：

- Docs lifecycle governance: `docs/docs_portfolio_consolidation.md`.
- Docs entry / role index: `docs/README.md`.
- Active completion plan and execution order: `docs/active/rca-ideal-state-gap-plan.md`.
- Private implementation migration inventory: `docs/active/opl-private-implementation-migration-inventory.md`.
- Current truth owners: `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`.
- Current machine truth: contracts、schema、source、tests、CLI/MCP/API behavior、runtime artifacts、owner receipts、artifact locator 和 review/export gates.
- Process provenance: `docs/history/process/README.md` and dated closeouts under `docs/history/process/`.
- Retired route / old identity provenance: `docs/history/**` and tombstones.

## Portfolio Classification

| Surface | Classification | Governance action |
| --- | --- | --- |
| Core five docs | `current_truth_owner` | Kept. Current old-surface wording is no-resurrection / retired-boundary language, not active compatibility. |
| `docs/active/rca-ideal-state-gap-plan.md` | `active_completion_plan_ssot` | Kept as the only active plan. It still lists `generated_default_caller_thinning`、`naming_contract_hygiene` and `compatibility_free_retirement` as open execution order, without authorizing physical delete before the machine gate. |
| `docs/active/opl-private-implementation-migration-inventory.md` | `active_private_surface_inventory` | Kept. It classifies retained RCA surfaces by active caller、authority reason、replacement expectation and verification entry. |
| `docs/product/` | `product_operator_support` | Kept. Product-entry support routes to direct service surface and OPL generated shell boundary; no GUI/WebUI or retired wrapper readiness claim was found. |
| `docs/runtime/` | `runtime_boundary_support` | Kept. It documents service-safe domain entry, descriptor projection and OPL-hosted runtime boundary without restoring RCA-owned generic runtime. |
| `docs/delivery/` | `delivery_route_support` | Kept. Route/proof/export docs preserve RCA review/export gates and do not upgrade route proof to visual/export/domain/production ready. |
| `docs/source/` | `source_readiness_support` | Kept. Source readiness remains source truth support and does not authorize visual/export/domain readiness. |
| `docs/policies/` | `stable_policy` | Kept. Policies hold durable AI-first / visual memory / runtime boundary rules, not dated coverage evidence. |
| `docs/public/` and `docs/specs/` | `thin_index` | Kept thin. No old program/capability/reference body was moved into these directories. |
| `docs/references/` | `support_reference` | Kept. References explain target state, product-entry support, integration, memory locator, executor routing and governance; old route words are explicitly bounded to support/provenance/tombstone context. |
| `docs/history/` | `history_provenance` | Kept. History owns Phase 2、Hermes、old route、process closeout、plans、positioning、runtime and tombstone records. |
| Root / near-root `README*` | `entry_or_source_index` | Kept. They remain public/source/contract/runtime entries and do not serve as machine interfaces or stale compatibility contracts. |

## Content-Level Consolidation

- Current active docs already direct old `docs/program/` and capability-like material to history, references, contracts, manifests or owner docs. No active `docs/program/` or `docs/capabilities/` resurrection was found.
- Current gateway/frontdoor/federation/Hermes-first/workbench wording is bounded by no-resurrection, internal integration, tombstone, history or explicit proof/backend context.
- Current `domain_action_adapter` wording distinguishes OPL-generated descriptor refs from RCA positive `domain-handler export|dispatch` target.
- Current readiness wording repeatedly prevents structural conformance, provider completion, route proof, docs cleanup, refs-only accounting or typed blocker visibility from being upgraded to visual ready、exportable、handoffable、domain ready、production ready or production visual-stage long soak complete.
- No broader docs portfolio rewrite was needed: durable rules already live in docs governance, current truth in core docs / active plan / owner docs, support context in references, and dated evidence in history/process.

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-broader-docs-portfolio-ssot-20260607` before and after this closeout:

```bash
git status --short --branch
find docs -path 'docs/history' -prune -o -name '*.md' -print | sort | wc -l
find docs/history -name '*.md' -print | sort | wc -l
find docs -name '*.md' -print | sort | wc -l
find . -maxdepth 2 -name 'README*' -print | sort
rg -n "docs/program|docs/capabilities|capabilities/|Gateway|gateway|frontdoor|federation|Hermes-first|Hermes first|legacy|compatibility|compatibility alias|domain_action_adapter|managed runtime|managed product entry|old workbench|Phase 2" docs/README.md docs/docs_portfolio_consolidation.md docs/project.md docs/status.md docs/architecture.md docs/invariants.md docs/decisions.md docs/active docs/product docs/runtime docs/delivery docs/source docs/policies docs/public docs/specs docs/references README.md README.zh-CN.md agent/README.md runtime/README.md contracts/README.md
rg -n "visual ready|exportable|handoffable|domain ready|production ready|production visual-stage long soak complete|physical delete authorized|safe_to_delete_now=true|safe to delete" docs/README.md docs/docs_portfolio_consolidation.md docs/project.md docs/status.md docs/architecture.md docs/invariants.md docs/decisions.md docs/active docs/product docs/runtime docs/delivery docs/source docs/policies docs/public docs/specs docs/references README.md README.zh-CN.md agent/README.md runtime/README.md contracts/README.md
rg -n "safe_to_delete_now=true|compatibility_alias_allowed=true|active_default_caller=true|legacy_payload_field_aliases|retired.*active_caller=true|resurrection_policy.*allowed" contracts docs/active docs/status.md docs/architecture.md docs/decisions.md docs/invariants.md tests packages scripts agent runtime README.md README.zh-CN.md
```

Result before adding this closeout:

- Worktree started clean on `codex/rca-broader-docs-portfolio-ssot`.
- Portfolio inventory was `docs/**/*.md=106`, non-history `docs/**/*.md=43`, `docs/history/**/*.md=63`; root / near-root README files were `README.md`、`README.zh-CN.md`、`agent/README.md`、`contracts/README.md`、`docs/README.md`、`runtime/README.md`.
- Targeted stale-surface scans returned current boundary statements, no-resurrection rules, support/provenance wording, generated descriptor refs, active delete-tail entries, tests that guard forbidden alias/payload resurrection, and readiness non-claim language.
- No `safe_to_delete_now=true`、`compatibility_alias_allowed=true`、`active_default_caller=true` resurrection signal、old public path compatibility claim、or physical delete authorization was found.

Result after adding this closeout:

- Portfolio inventory is `docs/**/*.md=107`, non-history `docs/**/*.md=43`, `docs/history/**/*.md=64`, confirming this lane added only process history and did not expand current docs.
- `git diff --check` passed for the new closeout and process index update.
- Conflict-marker scan passed.
- OPL Doc doctor reported `finding_count=0`.

## Remaining Scope

This lane closes only RedCube broader docs portfolio SSOT coverage for this OPL series governance tranche. It does not claim RedCube visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete, and it does not authorize physical deletion of refs-only / authority surfaces.

Open carry-forward:

- `production_evidence_tail` and `runtime_evidence_scaleout` still require RCA-owned artifact/review/export/memory/workspace/no-regression/long-soak/human-review evidence or typed blocker.
- `generated_default_caller_thinning` remains open until OPL generated/default caller parity, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer are all present.
- `compatibility_free_retirement` remains the rule once the delete gate passes: delete or tombstone directly, without compatibility alias、facade、wrapper、default dispatch、old public path test or success payload compatibility field.
