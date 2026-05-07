# 文档索引

[English](./README.md) | **中文**

这个目录是 `RedCube AI` 的技术阅读层。
当前公开阅读路径以 direct route 为主，OPL Runtime Manager bridge 作为内部集成 / 参考层保留：

- direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- internal OPL bridge：`User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.zh-CN.md) | 先理解 RedCube 交付什么，再进入技术细节 |
| 技术规划与架构读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 读取当前边界、执行模型和当前治理面 |
| 开发者与维护者 | [Product](./product/README.md)、[Runtime](./runtime/README.md)、[Delivery](./delivery/README.md)、[Source](./source/README.md)、[Policies](./policies/README.md)、[Program](./program/README.md)、[References](./references/README.md)、[History](./history/README.zh-CN.md) | 追踪生命周期文档、稳定规则、当前 baton、参考资料与历史 provenance |

## 当前基线

- `RedCube AI` 持有 visual-domain truth、`invokeDomainEntry`、direct repo-verified 的 product-entry service surface，以及由单一 `redcube-ai` app skill、`CLI`、`MCP`、本地脚本与 repo-tracked contract 组成的稳定可调用面。
- `Codex CLI` 继续作为 executor-adapter 合同后面的默认 concrete executor，服务本地 operator 工作流。
- `OPL Runtime Manager` 是目标形态中的 federated 薄管理层，位于外部 `Hermes-Agent` substrate 之上；它可以索引 product-entry registration、session continuity、runtimeWatch、artifact、review/publication projection，但不持有 RedCube visual truth。
- `Hermes-Agent` 这类 hosted runtime carrier 只保留在显式 opt-in backend/proof lane 或技术参考层，不改写默认公开合同。
- `OPL` 在需要 family-level routing 时通过内部 bridge surface 进入。
- 实现语言目标是 `TypeScript + Python`：TypeScript 持有 product/runtime contract 与 service boundary，Python 在 RedCube route/gate 下承担 native PPT/Office helper 与文档/PPT 修复循环。
- `ppt_deck` 默认通过 `author_image_pages` 走 image-first 整页 PNG 视觉生成；HTML `render_html/fix_html` 与可编辑原生 PPTX `author_pptx_native/repair_pptx_native` 继续作为显式可选路线。
- runtime truth 继续以文件 authority 和可重建 artifact index 为主。SQLite 持久层在 RCA 当前阶段 deferred，只有当实测 artifact/session 文件增长或跨交付物查询压力足够明确时，才作为可重建 sidecar index 评估。
- `frontdesk` 命令键只作为单一 `redcube-ai` app skill 之下的 agent-facing product-entry overview / intake / entry-shell contract 保留，不代表成熟 GUI、WebUI 或最终用户前台壳已落地。

## 技术工作集

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)
- [Docs portfolio consolidation](./docs_portfolio_consolidation.md)

## 生命周期分层

| 分层 | 职责 | 入口 |
| --- | --- | --- |
| Product | 人类 / operator 入口、product handoff、profile 与发布协作 | [Product docs](./product/README.md) |
| Runtime | runtime topology、executor/backend 边界、service-safe entry、watch/projection 语义 | [Runtime docs](./runtime/README.md) |
| Delivery | deliverable family、route、proof、export 与示例材料 | [Delivery docs](./delivery/README.md) |
| Source | source readiness、augmentation、deep research trigger/gate 与 source truth 消费 | [Source docs](./source/README.md) |
| Policies | 稳定治理与运行规则 | [Policies](./policies/README.md) |
| Program | 当前 baton 与 contract-linked closeout records | [Program](./program/README.md) |
| References | 不持有 active baton 的支持性技术参考 | [References](./references/README.md) |
| History | 已归档 provenance 与历史计划 | [History](./history/README.zh-CN.md) |

## 维护者治理入口

- 维护者验证与文档治理统一留在 `docs/references/series-doc-governance-checklist.md`。
- 不再服务当前 program baton 的历史与 provenance 审计放入 `docs/history/`；仍解释当前运行方式的材料留在 `docs/references/`。
- `README*` 与 `docs/**` 是人读面。Runtime contract、测试、脚本和 dashboard 可以暴露 `human_doc:*` 语义指针帮助读者定位上下文，但不能把 repo 文档路径钉成稳定机读 API。
- 仓库目录治理现在通过 `scripts/repo-hygiene.sh` 在 `scripts/verify.sh` 各 lane 和 grouped test 执行前运行。tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json` 这类生成物 / 本地状态；`.agents/` 下唯一允许跟踪的插件入口是 `.agents/plugins/marketplace.json`。

## 参考层

- `docs/product/`：面向 product 与 operator 的人类可读指南
- `docs/runtime/`：runtime topology 与 execution/projection 说明
- `docs/delivery/`：deliverable family、route、proof、export 与示例材料
- `docs/source/`：source readiness 与 augmentation 材料
- `docs/policies/`：稳定治理与运行规则
- `docs/program/`：当前 program baton 与 follow-on records 的人类可读记录
- `docs/references/`：解释当前运行、目标状态或维护者实践的支持性技术参考
- `docs/history/`：归档 provenance、repo-local migration 记录，以及不再服务当前 active program baton 的历史计划
- 本地 AI / Superpowers 过程草稿继续在被忽略的 `docs/superpowers/` 下维护，不进入 repo-tracked history。
- [AI-first 质量边界 Policy](./policies/ai_first_quality_boundary.md)：固定 author / reviewer 判断必须由 AI-authored artifact 持有，pack、schema、gate、audit 与 projection 只承担机械约束和证据传递。
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md)：保留 future-facing 设计目标的参考文档，退出根层活跃表面
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md)：source-plane 的 future target 继续留在同一 reference 层

## 文档规则

- `README*` 与 `docs/README*` 统一围绕 repo-verified direct route、内部 OPL Runtime Manager bridge/reference surface 与 service-safe domain entry surface 叙事。
- 对外文档在适用时保持中英双语镜像。
- 参考材料只在仍支撑当前合同时保留。
- 机器可读 runtime-program contract 应引用 contract/schema/source 路径来表达可执行真相，或使用 `human_doc:*` 语义 ID 表达读者上下文；不应让 prose 文档层级变成测试或 runtime 的路径兼容约束。
