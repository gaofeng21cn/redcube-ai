# Product-entry 支撑参考

Owner: `RedCube AI`
Purpose: `product_entry_support_reference_index`
State: `active_support`
Machine boundary: 人读 support 索引。机器真相继续归 runtime-program contracts、product-entry manifest、CLI/MCP/API 行为、runtime workspace、owner receipts 和语义化 `human_doc:*` id。

本目录保存已落地 product-entry 合同面的支撑说明。它们解释 direct product entry、OPL-hosted entry 与 OPL generated product-entry session surface / RCA domain snapshot 边界，不承担新的 active plan，也不定义 GUI/WebUI、generic runtime、retired public entry、federation 或兼容别名。

当前条目：

- [RedCube Product Entry MVP](./redcube_product_entry_mvp.md)：解释 direct `invokeProductEntry` service surface。
- [Product Entry Session Domain Snapshot Boundary](./product_entry_session_continuity.md)：解释 OPL generated product-entry session surface 与 RCA refs-only domain snapshot projection。
- [OPL Framework Hosted Product Entry](./opl_framework_hosted_product_entry.md)：解释 OPL-hosted route 如何进入同一 RCA service-safe domain entry。

旧 `managed_product_entry_hardening` 支撑文档已退出 active reference 层；provenance 只读 [retired managed product-entry tombstone](../../history/tombstones/retired-managed-product-entry-contract-2026-05-20.md)。

后续完善顺序、OPL 上收边界和生产证据缺口统一维护在 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)。
