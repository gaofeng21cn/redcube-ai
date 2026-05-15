# 历史文档

[English](./README.md)

本目录存放归档 provenance 与过程记录；它们不应被读成当前 runtime 或 product-entry 合同。

适合放在这里的材料：

- 解释早期 runtime 形态来源的 repo-local migration 记录
- 对追溯有用、但已经不属于当前 active program baton 的 absorbed 过程说明
- 已退役 gateway、frontdoor、federation、harness-first、OPL-first 或 Hermes-first 叙事的 tombstone，避免读者把旧口径误读成当前 RedCube 身份

当前分组：

- `hermes/`：repo-local Hermes migration provenance 与 upstream Hermes proof records。这些文件不证明上游 `Hermes-Agent` 已经持有当前 runtime owner。
- `phase-2/`：已吸收 Phase 2 tranche records，用于 runtime-program 读者上下文和 provenance。
- `plans/`：保留用于追溯、但不再服务当前 active program baton 的历史计划。
- `tombstones/`：已退役词汇与路线叙事，保留可检索性，但不得回到当前公开身份。当前 tombstone：`tombstones/retired-route-narratives-2026-05-11.md`。
- 后续 tombstone 应写清退役词汇、当前 truth owner，以及是否仍有机器可读 `human_doc:*` 链接要求 program brief 原位保留。

仍被 runtime-program 机器合同引用的当前 baton brief 进入 `../active/`。
仍有 `human_doc:*` 语义引用的 Phase 2 与 upstream Hermes proof brief 进入 `phase-2/` 与 `hermes/`；语义 ID 保持稳定。
本地 AI / Superpowers 过程草稿继续保持在被忽略的 `../superpowers/` 下，不导入 repo-tracked history。
