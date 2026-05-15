# Source 文档

`docs/source/` 保存人读 source lifecycle 材料：source readiness、source augmentation、deep research trigger/gate 行为、source truth consumption 和 external research executor expectations。

本层只解释 source 职责。Canonical source truth 继续归 workspace artifacts、runtime-family contracts、schemas 和 generated reports。

## 当前角色

Source docs 解释当前 source readiness、augmentation、deep research trigger/gate 行为和 source truth consumption。已完成的 source-readiness plans 进入 history；仍生效的 source contracts 留在本目录或 contracts/source surfaces，并写清 machine boundary。

当前材料：

- [Source augmentation executor contract](./source_augmentation_executor_contract.md)
- [Deep Research / auto-first product contract](./deep_research_auto_first_product_contract.md)

机器可读 surface 应使用 canonical artifact/contract paths 或 `human_doc:*` semantic IDs，不应把本文 prose path 当稳定接口。
