# 历史文档

Owner: `RedCube AI`
Purpose: `history_index`
State: `history`
Machine boundary: 人读历史索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和当前 owner docs。

本目录存放归档 provenance、tombstone 与过程记录；它们不应被读成当前 runtime、product-entry 合同、active backlog 或 public identity。
历史文档里的“当前状态”“下一步”“Backlog”“停车”等标题只按归档时点读取。当前 truth owner 始终回到核心五件套、`docs/active/rca-ideal-state-gap-plan.md`、对应 owner docs 和 machine-readable contracts。

适合放在这里的材料：

- 解释早期 runtime 形态来源的 repo-local migration 记录
- 对追溯有用、但已经不属于当前 active program baton 的 absorbed 过程说明
- 已退役 gateway、frontdoor、federation、harness-first、OPL-first 或 Hermes-first 叙事的 tombstone，避免读者把旧口径误读成当前 RedCube 身份

当前分组：

- `hermes/`：repo-local Hermes migration provenance 与 upstream Hermes proof records。这些文件不证明上游 `Hermes-Agent` 已经持有当前 runtime owner，也不恢复 Hermes-first 默认路线。
- `phase-2/`：已吸收 Phase 2 tranche records，用于 runtime-program 读者上下文和 provenance，不保留 active implementation checklist。
- `positioning/`：历史定位与旧边界词汇说明。它们可能仍被 `human_doc:*` 语义 ID 引用，但只能按 historical positioning / internal boundary vocabulary 读取。
- `plans/`：保留用于追溯、但不再服务当前 active program baton 的历史计划；目录 README 记录历史计划不复活为 implementation checklist 的读法。
- `tombstones/`：已退役词汇与路线叙事，保留可检索性，但不得回到当前公开身份。当前 tombstone：`tombstones/retired-route-narratives-2026-05-11.md`。
- `runtime/opl-managed-runtime-three-layer-contract.md`：历史 OPL 托管运行时三层 owner 讨论。当前 runtime owner 与 production substrate 口径以核心五件套、`docs/runtime/`、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts 为准。
- 后续 tombstone 应写清退役词汇、当前 truth owner，以及是否仍有机器可读 `human_doc:*` 链接要求 program brief 原位保留。

仍被 runtime-program 机器合同引用的当前计划进入 `../active/`；只解释已落地 product-entry 合同面的 support brief 进入 `../references/product-entry/`。
仍有 `human_doc:*` 语义引用的 Phase 2 与 upstream Hermes proof brief 进入 `phase-2/` 与 `hermes/`；语义 ID 保持稳定。
本地 AI / Superpowers 过程草稿继续保持在被忽略的 `../superpowers/` 下，不导入 repo-tracked history。

## 历史文档元信息

新增长期历史文档也必须写清 owner、purpose、state 和 machine boundary。已归档的短 brief 若仍缺少逐文件元信息，由最近的目录 README 暂时提供生命周期边界；再次编辑该 brief 时应就地补齐，不把目录级说明当长期替代。
