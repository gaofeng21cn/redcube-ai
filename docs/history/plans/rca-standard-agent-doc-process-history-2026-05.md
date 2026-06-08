# RCA standard agent 文档过程归档

Owner: `RedCube AI`
Purpose: `process_history`
State: `historical_provenance`
Machine boundary: 本文是人读过程归档。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。

本文保存 2026-05 RCA standard OPL Agent 对齐过程摘要。当前定位、边界、功能/结构差距、测试/证据差距和完善顺序回到 `docs/active/rca-ideal-state-gap-plan.md`；north-star 目标态回到 `docs/references/rca-visual-deliverable-agent-ideal-state.md`。

## 历史过程摘要

| Area | Historical convergence | Current read |
| --- | --- | --- |
| OPL consumer projection | Scheduler、daemon、lifecycle、queue、attempt ledger、runner、workbench shell、memory/artifact/review transport 和 native-helper envelope 被分类为 OPL/shared responsibility。 | 当前 owner split 必须从 core docs、contracts、source/tests 和 OPL read-models 验证。 |
| RCA retained authority | RCA 保留 visual authority pack、visual transition evaluator、guarded actions、owner receipts 和 typed blockers。 | Retained surfaces 需要当前 interface、caller、receipt/blocker/ref boundary 和 no-forbidden-write proof。 |
| Refs-only projections | Stability、operator evidence、workspace receipt inventory 和 substrate adapter outputs 被保留为 refs-only read models。 | Refs-only projections 不能证明 visual ready、exportable、handoffable 或 production ready。 |
| Generated surface scope | CLI/MCP/skill/product/status/session/domain_action_adapter/workbench 被分类为 generated 或 OPL-owned shells。 | Repo-local wrappers 仍是 migration inputs，直到 current default caller 与 no-active-caller gates 证明 deletion 安全。 |

## 归档时点计数

At archive time, the process summary mentioned `functional_structure_gap_count=8`. That count is historical. Current gap count and evidence tail must be read from `docs/active/rca-ideal-state-gap-plan.md`, `docs/status.md`, current contracts, source/tests and runtime evidence.

## No-Resurrection 规则

Do not use this process history as an active gap list, generated-surface contract, wrapper retention justification, delete authority or readiness proof. Current retirements require replacement parity, no-active-caller proof, owner receipt / typed blocker roundtrip, no-forbidden-write proof and tombstone/provenance pointer.
