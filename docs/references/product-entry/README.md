# Product-entry 支撑参考

Owner: `RedCube AI`
Purpose: `product_entry_support_reference_index`
State: `active_support`
Machine boundary: 人读 support 索引。机器真相继续归 runtime-program contracts、product-entry manifest、CLI/MCP/API 行为、runtime workspace、owner receipts 和语义化 `human_doc:*` id。

本目录保存已落地 product-entry 合同面的支撑说明。它们解释 direct product entry、OPL-hosted entry 与 session continuity 的读者上下文，不承担新的 active plan，也不定义 GUI/WebUI、generic runtime、frontdoor、federation 或 compatibility alias。

当前条目：

- [RedCube Product Entry MVP](./redcube_product_entry_mvp.md)：解释 direct `invokeProductEntry` service surface。
- [Product Entry Session Continuity](./product_entry_session_continuity.md)：解释同一 entry session 下的 continuity 与用户级 runtime-state。
- [Managed Product Entry Hardening](./managed_product_entry_hardening.md)：旧 `managed` 命名的 provenance support；active contract 已迁到 session continuity。
- [OPL Framework Hosted Product Entry](./opl_framework_hosted_product_entry.md)：解释 OPL-hosted route 如何进入同一 RCA service-safe domain entry。

后续完善顺序、OPL 上收边界和生产证据缺口统一维护在 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)。
