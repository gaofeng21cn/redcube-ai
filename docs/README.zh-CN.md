# 文档索引

[English](./README.md) | **中文**

这个目录是 `RedCube AI` 的技术阅读层。
默认公开叙事固定为：
`OPL shell -> RCA domain agent -> Codex default execution`。

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.zh-CN.md) | 先理解 RedCube 交付什么，再进入技术细节 |
| 技术规划与架构读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 读取当前边界、执行模型和验证面 |
| 开发者与维护者 | `docs/program/`、`docs/references/`、`docs/policies/`、`docs/history/` | 追踪实现记录、参考资料、治理规则与归档 |

## 当前基线

- `OPL` 是顶层壳层入口。
- `RCA / RedCube AI` 是壳层下的视觉交付 domain agent。
- `Codex` 是本地 operator 工作流的默认执行宿主。
- `Hermes-Agent` 是 session/run/watch/resume 场景下的显式长期在线 gateway lane。

## 技术工作集

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)

## 验证入口

- `npm test` / `npm run test:fast`
- `npm run test:meta`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:historical`
- `npm run test:full`

## 历史与参考层

- `docs/program/`：仓库跟踪的 program 记录，包含 absorbed 里程碑
- `docs/history/`：历史归档索引
- `docs/references/`：支持性技术参考
- `docs/policies/`：稳定治理与运行规则

## 文档规则

- `README*` 与 `docs/README*` 统一围绕默认入口链路叙事。
- 对外文档在适用时保持中英双语镜像。
- 历史材料继续沉淀在 program/history/reference 层。
