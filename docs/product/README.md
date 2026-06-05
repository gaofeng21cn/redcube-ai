# Product 文档

Owner: `RedCube AI`
Purpose: `product_docs_index`
State: `active_support`
Machine boundary: 人读 product 索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和 product-entry manifest。

`docs/product/` 保存面向人和 operator 的 product 材料：quickstart、product-entry handoff、profile setup 和 publishing coordination。

本层说明人或 agent 如何把 RedCube AI 当作 product surface 使用；它不定义机器可读 runtime truth。

## 当前角色

Product docs 位于仓库首页之下、runtime/delivery 细节之上，解释当前 human/operator 如何进入 RedCube AI。当前 product surface 是 direct product entry、human quickstart、profile 与 publishing 协作；已被 OPL generated/default shell、domain pack 或 stage-artifact kernel 替代的 product-entry wrapper、managed/session 旧面、GUI/WebUI readiness 叙事和 compatibility alias 只进入 `../references/product-entry/`、`../history/**` 或 tombstone，不作为 active product 兼容面。历史 publishing 或 setup notes 只有在仍支撑当前 product surface 时才留在这里；完成或被替代的计划在链接复核后进入 history。

当前 product-facing 材料：

- [Human quickstart](./human_quickstart.md)
- [Private profile setup](./private-profile-setup.md)
- [Public GitHub publishing](./public-github-publish.md)

Runtime contracts 应继续使用 `human_doc:*` semantic pointers 或 contract/schema/source paths，不使用 prose document paths 作为机器接口。
