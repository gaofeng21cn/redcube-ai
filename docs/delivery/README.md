# Delivery 文档

`docs/delivery/` 保存人读 deliverable lifecycle 材料：family examples、route descriptions、proof environments、export expectations 和 manual validation briefs。

本层说明 visual deliverables 如何成形与检查。可执行 delivery contract 继续归 runtime-family code、schemas、contract JSON 和 generated artifact manifests。

## 当前角色

Delivery docs 解释当前 deliverable families、default routes、proof environments、examples 和 manual validation。描述旧 rendering paths 的 route notes 必须标明 optional、fallback 或 historical support，避免被读成当前默认 route。

当前 delivery 材料：

- [Deliverable examples](./deliverable_examples.md)
- [Image-first PPT production route](./image-first-ppt-production-route.md)
- [Native PPT proof environment](./native-ppt-proof-environment.md)
- [Stable deliverable manual test brief](./stable_deliverable_manual_test_brief.md)

Runtime contracts 应使用 `human_doc:*` semantic pointers 作为读者上下文，不把本目录布局当稳定机器接口。
