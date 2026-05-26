# Delivery 文档

Owner: `RedCube AI`
Purpose: `delivery_docs_index`
State: `active_support`
Machine boundary: 人读 delivery 索引。机器真相继续归 runtime-family code、schemas、contract JSON、generated artifact manifests、review/export receipts 和 canonical artifacts。

`docs/delivery/` 保存人读 deliverable lifecycle 材料：family examples、route descriptions、proof environments 和 export expectations。历史 manual validation briefs 进入 `../history/**`。

本层说明 visual deliverables 如何成形与检查。可执行 delivery contract 继续归 runtime-family code、schemas、contract JSON 和 generated artifact manifests。

Delivery support docs 和示例只提供 route / proof / export 读法。最终 visual ready、exportable、handoffable、artifact authority 与 review/export verdict 仍必须来自 RCA-owned review/export gates、workspace artifacts、artifact manifests、review/export receipts 和 owner receipts。

## 当前角色

Delivery docs 解释当前 deliverable families、default routes、proof environments 和 examples。描述旧 rendering paths 的 route notes 必须标明 explicit optional route、route-level repair/recovery 或 historical support，避免被读成当前默认 route 或 hidden fallback chain。

当前 delivery 材料：

- [Deliverable examples](./deliverable_examples.md)
- [Image-first PPT production route](./image-first-ppt-production-route.md)
- [RCA real route evolution probe](./real-route-evolution-probe.md)
- [HTML PPT route quality](./html-ppt-route-quality.md)
- [Native PPT proof environment](./native-ppt-proof-environment.md)
历史 stable deliverable 手工测试简报已进入 [history/phase-2](../history/phase-2/stable_deliverable_manual_test_brief.md)，不再作为当前 delivery 材料读取。

Runtime contracts 应使用 `human_doc:*` semantic pointers 作为读者上下文，不把本目录布局当稳定机器接口。
