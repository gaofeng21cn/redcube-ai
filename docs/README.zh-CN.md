# 文档索引

[English](./README.md) | **中文**

这个目录是 `RedCube AI` 的技术阅读层。
当前公开阅读路径从 `RedCube AI Foundry Agent` 身份开始：它是 built on OPL Framework 的 OPL-compatible visual-deliverable package。OPL 是 stage-led 的智能体运行框架，可以把 RedCube 作为外部依赖托管，因此 OPL 路径在这里只作为内部托管集成路径记录：

- RedCube 直达路径：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- OPL 托管路径：`User -> OPL Product Entry -> OPL Runtime Manager -> Temporal-backed family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.zh-CN.md) | 先理解 RedCube 交付什么，再进入技术细节 |
| 技术规划与架构读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 读取当前边界、执行模型和当前治理面 |
| 开发者与维护者 | [Product](./product/README.md)、[Runtime](./runtime/README.md)、[Delivery](./delivery/README.md)、[Source](./source/README.md)、[Policies](./policies/README.md)、[Program](./program/README.md)、[References](./references/README.md)、[History](./history/README.zh-CN.md) | 追踪生命周期文档、稳定规则、当前 baton、参考资料与历史 provenance |

## 当前基线

- `RedCube AI` 持有视觉领域真相、`invokeDomainEntry`、direct repo-verified 的 product-entry service surface，以及由单一 `redcube-ai` 应用技能、`CLI`、`MCP`、本地脚本与仓库跟踪合同组成的稳定可调用面。
- 当前发布形态是 `RedCube AI Foundry Agent`：一个 app skill、一个 service-safe domain entry、product sidecar / projection refs 和只读 stage-control projection metadata 共同组成 OPL-compatible package surface。它不是 GUI/WebUI 壳，也不会把 route、review、export 或 artifact authority 迁给 OPL。
- `Codex CLI` 继续作为 executor-adapter 合同后面的默认具体执行器和最小执行单元，服务本地操作者工作流。
- `OPL Runtime Manager` 是 OPL 侧托管集成管理层，位于 Temporal-backed family runtime provider 之上；Temporal 是 OPL production online runtime 的必需 substrate，Hermes 保留为 legacy/optional provider 或 proof lane，local provider 只用于 dev/CI/offline diagnostics。它可以索引 product-entry registration、session continuity、runtimeWatch、artifact、review/publication projection，但不持有 RedCube visual truth。
- `Hermes-Agent` 这类 hosted runtime carrier 只保留在显式 opt-in backend/proof lane 或技术参考层，不改写默认公开合同。
- `OPL` 只在需要 family-level routing、托管、唤醒或投影时进入；它不是 RedCube 的公开身份。
- 实现语言目标是 `TypeScript + Python`：TypeScript 持有 product/runtime contract 与 service boundary，Python 在 RedCube route/gate 下承担 native PPT/Office helper 与文档/PPT 修复循环。
- `ppt_deck` 默认通过 `author_image_pages` 走 image-first 整页 PNG 视觉生成；HTML `render_html/fix_html` 与可编辑原生 PPTX `author_pptx_native/repair_pptx_native` 继续作为显式可选路线。
- runtime truth 继续以文件 authority 和可重建 artifact index 为主。SQLite 持久层在 RCA 当前阶段 deferred，只有当实测 artifact/session 文件增长或跨交付物查询压力足够明确时，才作为可重建 sidecar index 评估。
- `status` 命令键只作为单一 `redcube-ai` app skill 之下的 agent-facing product-entry overview / intake / entry-shell contract 保留，不代表成熟 GUI、WebUI 或最终用户前台壳已落地。
- `stage_control_projection` 与 `family_action_catalog` 已让 OPL 可发现 RCA stage/action descriptor，但 OPL 只做 discovery / queue / projection / receipt，不持有 visual route、review/export verdict 或 canonical artifact authority。

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
| 当前真相 | 当前产品角色、活跃边界、执行模型、硬约束和持久决策 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md) |
| 机器真相 | runtime-program contracts、schema、source、generated artifacts 和 callable surfaces | [合同说明](../contracts/README.md) |
| Product | 人类 / operator 入口、product handoff、profile 与发布协作 | [Product docs](./product/README.md) |
| Runtime | runtime topology、executor/backend 边界、service-safe entry、watch/projection 语义 | [Runtime docs](./runtime/README.md) |
| Delivery | deliverable family、route、proof、export 与示例材料 | [Delivery docs](./delivery/README.md) |
| Source | source readiness、augmentation、deep research trigger/gate 与 source truth 消费 | [Source docs](./source/README.md) |
| Policies | 稳定治理与运行规则 | [Policies](./policies/README.md) |
| Program | 合同引用的 baton、已吸收 closeout 记录，以及仍有 `human_doc:*` 链接的旧 brief | [Program](./program/README.md) |
| References | 不持有 active baton 或公开身份的支持性技术参考 | [References](./references/README.md) |
| History | 已归档 provenance、tombstone 与历史计划 | [History](./history/README.zh-CN.md) |

这张表是层级：先读当前真相和机器真相；product/runtime/delivery/source/policies 解释当前工作；program 记录 active 或 contract-linked baton；references 与 history 分别保留支撑上下文和历史 provenance。

## 维护者治理入口

- 维护者验证与文档治理统一留在 `docs/references/series-doc-governance-checklist.md`。
- 不再服务当前 program baton 的历史与 provenance 审计放入 `docs/history/`；仍解释当前运行方式的材料留在 `docs/references/`。
- 仍被 `human_doc:*` 语义 ID 引用的 program brief 继续留在 `docs/program/`。如果标题或文件名里含有旧 gateway、bridge、harness 或 Hermes-first 语言，先在文件内加生命周期说明，把材料标成已吸收、内部集成或 provenance，再考虑移动。
- RCA 文档按内容生命周期维护。同一个文件可以只有部分内容仍属当前事实；当前事实合入 owner doc，active baton 留在 program，支撑说明进入 references，已完成或被替代的计划文本在链接审计后进入 history。
- `README*` 与 `docs/**` 是人读面。Runtime contract、测试、脚本和 dashboard 可以暴露 `human_doc:*` 语义指针帮助读者定位上下文，但不能把 repo 文档路径钉成稳定机读 API。
- 仓库目录治理现在通过 `scripts/repo-hygiene.sh` 在 `scripts/verify.sh` 各 lane 和 grouped test 执行前运行。tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json` 这类生成物 / 本地状态；`.agents/` 下唯一允许跟踪的插件入口是 `.agents/plugins/marketplace.json`。

## 参考层

- `docs/product/`：面向 product 与 operator 的人类可读指南
- `docs/runtime/`：runtime topology 与 execution/projection 说明
- `docs/delivery/`：deliverable family、route、proof、export 与示例材料
- `docs/source/`：source readiness 与 augmentation 材料
- `docs/policies/`：稳定治理与运行规则
- `docs/program/`：合同引用的 baton、已吸收 tranche brief 与 follow-on records 的人类可读记录
- `docs/references/`：解释当前运行、目标状态或维护者实践的支持性技术参考，但不承担公开身份
- `docs/history/`：归档 provenance、tombstone、repo-local migration 记录，以及不再服务当前 active program baton 的历史计划
- 本地 AI / Superpowers 过程草稿继续在被忽略的 `docs/superpowers/` 下维护，不进入 repo-tracked history。
- [AI-first 质量边界 Policy](./policies/ai_first_quality_boundary.md)：固定 author / reviewer 判断必须由 AI-authored artifact 持有，pack、schema、gate、audit 与 projection 只承担机械约束和证据传递。
- [视觉模式记忆 Policy](./policies/visual_pattern_memory_policy.md)：固定视觉叙事、风格、信息密度、route 选择 caveat 和 review failure mode 先按自然语言 memory 管理，不能替代 AI author/reviewer artifact、route contract、export gate 或 canonical artifact authority。
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md)：保留 future-facing 设计目标的参考文档，退出根层活跃表面
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md)：source-plane 的 future target 继续留在同一 reference 层

## 文档规则

- `README*` 与 `docs/README*` 统一围绕 repo-verified direct route、OPL 托管集成路径与 service-safe domain entry surface 叙事。
- 对外文档在适用时保持中英双语镜像。
- 参考材料只在仍支撑当前合同时保留。
- OPL、gateway、bridge、harness 和旧 route 词汇不得回到第一公开身份；只有在明确说明内部集成、运行托管、provenance 或 tombstone 语境时才使用。
- 机器可读 runtime-program contract 应引用 contract/schema/source 路径来表达可执行真相，或使用 `human_doc:*` 语义 ID 表达读者上下文；不应让 prose 文档层级变成测试或 runtime 的路径兼容约束。
