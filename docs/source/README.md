# Source 文档

Owner: `RedCube AI`
Purpose: `source_docs_index`
State: `active_support`
Machine boundary: 人读 source 索引。机器真相继续归 workspace artifacts、runtime-family contracts、schemas、generated reports、owner receipts 和 source readiness runtime surfaces。

`docs/source/` 保存人读 source lifecycle 材料：source readiness、source augmentation、deep research trigger/gate 行为、source truth consumption 和 external research executor expectations。

本层只解释 source 职责。Canonical source truth 继续归 workspace artifacts、runtime-family contracts、schemas 和 generated reports。

Source readiness / augmentation 的 `planning_ready` 只说明 source truth 可以被后续 Storyline / Plan 消费；它不授权 visual ready、exportable、handoffable、artifact authority、review/export verdict、domain ready 或 production ready。

## 当前角色

Source docs 解释当前 source readiness、augmentation、deep research trigger/gate 行为和 source truth consumption。已完成的 source-readiness plans 进入 history；仍生效的 source contracts 留在本目录或 contracts/source surfaces，并写清 machine boundary。

当前材料：

- [Source augmentation executor contract](./source_augmentation_executor_contract.md)

历史 source 产品语义与 longrun target freeze 已归入 `../history/plans/`：

- [Deep Research / auto-first product contract](../history/plans/2026-04-08-deep-research-auto-first-product-contract.md)
- [Source readiness deep research longrun target state](../history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md)

这些历史文档只保留 provenance，不再作为当前 source contract 或 active checklist。当前 source 执行合同以本目录的 `source_augmentation_executor_contract.md` 和 machine-readable contracts 为准。

机器可读 surface 应使用 canonical artifact/contract paths 或 `human_doc:*` semantic IDs，不应把本文 prose path 当稳定接口。
