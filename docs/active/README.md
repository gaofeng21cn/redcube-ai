# 活跃文档

Owner: `RedCube AI`
Purpose: `active_execution_and_gap_index`
State: `active_support`
Machine boundary: 人读索引。机器真相继续归 runtime-program contracts、schemas、source、generated artifacts、runtime evidence 与 owner receipts。

本目录是 OPL-family canonical 目录中承接 RCA 当前执行、当前计划、当前差距和当前完成门槛的位置。当前唯一跨文档完成计划是 [RCA 理想目标态差距与完善计划](./rca-ideal-state-gap-plan.md)。已落地的旧 product-entry baton 说明进入 `../references/product-entry/`，不再占用 active 目录。

旧 `docs/program/` active baton 目录已物理退役。当前计划和差距记录进入本目录；已吸收的 product-entry support brief 进入 `docs/references/product-entry/`；已吸收的 Phase 2 记录进入 `docs/history/phase-2/`；upstream Hermes proof 记录进入 `docs/history/hermes/`。`human_doc:program_*` 语义 ID 继续作为稳定读者上下文 ID，不代表物理路径承诺。

## 生命周期口径

| 文档 | 当前任务 | 生命周期状态 |
| --- | --- | --- |
| `rca-ideal-state-gap-plan.md` | 维护 RCA visual-deliverable 目标差距、OPL 上收边界与后续证据缺口 | active completion plan |

旧 `gateway`、`frontdoor`、`federation`、repo-local Hermes、workbench 和 product frontdesk 词汇不得在本目录中重新获得 active truth。它们只能作为 provenance、tombstone 或合同引用上下文出现；已退役模块、接口、测试入口和文档入口默认 direct retirement，不保留兼容别名或 compatibility-only 聚合测试。

新增 active plan 必须先判断是否属于 `rca-ideal-state-gap-plan.md`、某个 owner doc、history/tombstone，或 OPL 主仓。已完成且只解释合同面的 product-entry brief 留在 `../references/product-entry/`。

dated follow-through、tranche closeout、命令证据流水和阶段性校准过程不得堆回 active 主文档；需要保留来龙去脉时进入 `../history/plans/` 或对应 provenance 层，active 文档只保留当前结论、边界、差距和执行顺序。

如果后续又出现 product-entry、managed/session、gateway/runtime 或 workbench 相关材料，默认先归入 `../references/product-entry/`、`../runtime/`、`../history/**` 或 tombstone。只有当它改变当前 RCA 理想态差距、证据门或完成顺序时，才更新 `rca-ideal-state-gap-plan.md`；不要新增第二个 active checklist。

## 当前入口

- [文档索引](../README.md)
- [当前状态](../status.md)
- [RCA 理想目标态差距与完善计划](./rca-ideal-state-gap-plan.md)

## 支撑参考

- [Product-entry support brief](../references/product-entry/README.md)
- [RCA visual-deliverable ideal state](../references/rca-visual-deliverable-agent-ideal-state.md)
