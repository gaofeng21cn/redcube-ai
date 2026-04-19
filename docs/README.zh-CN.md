# 文档索引

[English](./README.md) | **中文**

这个目录是 `RedCube AI` 的第二层技术阅读面。
仓库首页应优先写给专家、潜在用户和非技术协作者。
而这里负责承接其后的 program、references、policies 和技术真相材料。

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.zh-CN.md) | 先理解这条视觉交付主线是干什么的，再决定是否进入技术细节 |
| 技术规划者、架构读者、方向同步读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 快速抓住当前真相、边界和主线方向 |
| 开发者与维护者 | `docs/program/`、`docs/references/`、`docs/policies/`、`docs/history/` | 查看当前技术记录、支持性参考、规则和历史材料 |

## 当前基线

- `OPL` 是整个 family 的顶层 GUI 与管理壳。
- `RedCube AI` / `RCA` 是这个壳下面的一级视觉交付 domain module / agent。
- `Codex` 是本地 operator 工作的默认交互宿主和具体执行路径。
- `Hermes-Agent` 保留为显式备用模式，以及 session / run / watch / resume 这类长期在线需求的 gateway。
- 当前 repo-verified 的 RedCube product entry MVP、frontdesk、manifest、invoke、session surface 已作为机器可读 domain-agent 集成面落地。
- 当前受保护创作 stage 统一收口在 `runtime-family + Codex CLI structured generation`，repo-local `pack/compiler` 作者化路径已不再是 active mainline。
- `Deep Research` 继续属于 `Source Readiness`，首读公开 wording 从 OPL 壳和 RedCube domain agent 开始。

## 技术工作集

开始改仓库状态前，先读这些文件：

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)

## 默认公开入口

- [仓库首页](../README.zh-CN.md)

仓库首页和这份索引共同构成默认公开入口。
对外文档应在适用时保持中英双语镜像。

## 仓库跟踪的技术文档

### 当前 domain-agent 记录

- [RedCube Product Entry MVP](program/redcube_product_entry_mvp.md)
- [Managed Product Entry Hardening](program/managed_product_entry_hardening.md)

RedCube product entry MVP 继续作为 domain-agent frontdesk、invoke、manifest、session surface 的技术记录。
hardening tranche 继续作为当前 Codex-default execution 与 readiness closeout 记录。

### 技术追溯

- [`docs/program/`](program/)
- [`docs/history/`](history/)
- [Source augmentation executor contract](source_augmentation_executor_contract.md)

这些目录承载仓库跟踪的 program 记录、历史材料和支持性技术参考，服务维护者和 shell integration。
公开入口模型保持 `OPL shell -> RedCube domain agent -> Codex default execution`。

### 参考资料

- [轻量产品入口与 OPL bridge](references/lightweight_product_entry_and_opl_handoff.md)（内部 OPL bridge reference）
- [OPL 长期在线 gateway contract](references/opl_managed_runtime_three_layer_contract.md)（历史 / advanced integration reference）
- [系列项目文档治理清单](references/series-doc-governance-checklist.md)
- [运行架构](runtime_architecture.md)
- [历史 domain 定位映射](domain-harness-os-positioning.md)
- [GitHub 公开发布流程](public-github-publish.md)

### 内部规则

- [内部规则索引](policies/README.md)
- [运行模型规则](policies/runtime_operating_model.md)
- [交付合同模型规则](policies/deliverable_contract_model.md)

### 历史材料

- [更新日志](../CHANGELOG.md)
- `docs/history/`
- `program/hermes/`
- `docs/program/*/*.md`

## 文档规则

- 继续把 [仓库首页](../README.zh-CN.md) 保持成专家和非技术协作者可读的入口。
- 继续把默认公开文档在适用时保持成中英双语镜像。
- program 和 reference 材料可以技术化，但不能再取代公开首页。
- 历史材料可以保留，但不能再写成当前默认 workflow。

## 治理说明

- 文档治理统一冻结在 [系列项目文档治理清单](references/series-doc-governance-checklist.md)、技术工作集和仓库跟踪的 contract/doc surface 中，而不再只写在 `AGENTS.md`。
- `README*` 与 `docs/README*` 是默认公开入口。
- `docs/program/*` 承载 repo-tracked mainline 与 tranche 记录。
- `docs/references/*` 承载支持性技术参考。
- `docs/policies/*` 承载稳定内部规则。
- `docs/history/*` 继续只作历史材料。
