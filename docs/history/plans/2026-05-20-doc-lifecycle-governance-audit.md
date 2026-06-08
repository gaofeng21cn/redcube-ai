# RCA Docs 生命周期治理审计

Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance_audit`
State: `history_provenance`
Machine boundary: 人读治理审计记录。机器真相继续归 contracts、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、核心五件套、active gap plan 与 docs owner indexes。

日期：`2026-05-20`

本文保存 2026-05-20 docs lifecycle 归位依据。当前 docs coverage、remaining gap、next write scope 与 no-resurrection 规则读 `docs/docs_portfolio_consolidation.md`、`docs/history/process/README.md`、`docs/history/process/retired-surface-provenance.md`、核心五件套、owner docs、active gap plan 和 OPL series coverage ledger。

## 历史输入

本轮审计使用 RCA core docs、ideal-state reference、active gap plan、OPL global active references、machine-readable contracts、CLI/MCP/product-entry manifest、generated-surface handoff 和 production acceptance surfaces。

## 历史归位决策

| Content type | Historical placement decision | Current read |
| --- | --- | --- |
| Current identity / architecture / invariants / decisions | 保持在 core docs。 | Current truth 仍需要 live contract/source/read-model verification。 |
| Functional and evidence gaps | 保持在 `docs/active/rca-ideal-state-gap-plan.md`。 | Active gap plan 仍是当前 baton owner。 |
| North-star target | 保持在 `docs/references/rca-visual-deliverable-agent-ideal-state.md`。 | 只作为 target；当前状态回到 core docs 和 active plan。 |
| Source support | Source executor contract 保持在 `docs/source/`。 | Source truth 归 contracts、workspace artifacts 和 runtime source/tests。 |
| Delivery support | Current delivery docs 保持在 `docs/delivery/`。 | Review/export truth 归 RCA-owned gates 和 receipts。 |
| Longrun/future plans | 迁入 `docs/history/plans/`。 | 只保留 provenance，不作为 active checklist。 |
| Gateway/Hermes/frontdoor/federation/provenance | 保持在 history/tombstone。 | 不提供 active public identity 或 runtime-owner proof。 |

## Retired Wording Boundary

`gateway / harness`, `Hermes-Agent`, `managed`, `frontdoor`, `federation`, `source-pack-federation`, `product frontdesk`, compatibility aliases, facades and wrapper wording remain history/provenance/tombstone unless current owner docs and machine surfaces prove a current role.

## No-Resurrection 规则

Do not append new frozen inventories, long process ledgers, doctor transcripts or tranche closeouts to active docs. Current truth goes to core docs, active plan, owner docs, contracts, source/tests or runtime evidence. History keeps compressed provenance only.
