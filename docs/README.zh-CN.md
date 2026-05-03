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
| 开发者与维护者 | `docs/program/`、`docs/references/`、`docs/policies/` | 追踪实现记录、参考资料与治理规则 |

## 当前基线

- `RedCube AI` 持有 visual-domain truth、`invokeDomainEntry`、direct repo-verified 的 product-entry service surface，以及由单一 `redcube-ai` app skill、`CLI`、`MCP`、本地脚本与 repo-tracked contract 组成的稳定可调用面。
- `Codex CLI` 继续作为 executor-adapter 合同后面的默认 concrete executor，服务本地 operator 工作流。
- `OPL Runtime Manager` 是目标形态中的 federated 薄管理层，位于外部 `Hermes-Agent` substrate 之上；它可以索引 product-entry registration、session continuity、runtimeWatch、artifact、review/publication projection，但不持有 RedCube visual truth。
- `Hermes-Agent` 这类 hosted runtime carrier 只保留在显式 opt-in backend/proof lane 或技术参考层，不改写默认公开合同。
- `OPL` 在需要 family-level routing 时通过内部 bridge surface 进入。
- 实现语言目标是 `TypeScript + Python`：TypeScript 持有 product/runtime contract 与 service boundary，Python 在 RedCube route/gate 下承担 native PPT/Office helper 与文档/PPT 修复循环。
- `frontdesk` 命令键只作为单一 `redcube-ai` app skill 之下的 agent-facing product-entry overview / intake / entry-shell contract 保留，不代表成熟 GUI、WebUI 或最终用户前台壳已落地。

## 技术工作集

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)

## 维护者治理入口

- 维护者验证与文档治理统一留在 `docs/references/series-doc-governance-checklist.md`。
- 历史与 provenance 审计继续留在同一 reference 层，不再占据默认公开入口。

## 参考层

- `docs/program/`：仓库跟踪的 program 记录，包含 absorbed 里程碑
- `docs/references/`：支持性技术参考
- `docs/policies/`：稳定治理与运行规则
- [AI-first 质量边界 Policy](./policies/ai_first_quality_boundary.md)：固定 author / reviewer 判断必须由 AI-authored artifact 持有，pack、schema、gate、audit 与 projection 只承担机械约束和证据传递。
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md)：保留 future-facing 设计目标的参考文档，退出根层活跃表面
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md)：source-plane 的 future target 继续留在同一 reference 层

## 文档规则

- `README*` 与 `docs/README*` 统一围绕 repo-verified direct route、内部 OPL Runtime Manager bridge/reference surface 与 service-safe domain entry surface 叙事。
- 对外文档在适用时保持中英双语镜像。
- 参考材料只在仍支撑当前合同时保留。
