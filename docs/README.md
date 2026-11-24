# RedCube AI 文档

本页是导航与 RCA 文档生命周期应用入口；规则 owner 为 [`one-person-lab` 文档生命周期政策](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/docs-lifecycle-policy.md)。机器事实由 [contracts](../contracts/README.md)、[Agent pack](../agent/README.md)、native helper 源码和各 owner 的实际回执提供。

| 文档 | 唯一职责 |
| --- | --- |
| [项目定位](./project.md) | 产品对象、受众、交付范围与长期能力方向 |
| [架构](./architecture.md) | 组件归属、调用链、Package/Carrier/Executor、数据与来源归属、Mini App |
| [硬约束](./invariants.md) | 维护者必须遵守的安全、权威和数据边界 |
| [关键决策](./decisions.md) | 当前架构取舍的原因 |
| [当前状态](./status.md) | 源码能证明什么、哪些完成声明尚无证据 |
| [未完成验收](./active/rca-ideal-state-gap-plan.md) | 剩余工作的负责人、下一动作、关闭证据 |
| [使用入口](./product/human_quickstart.md) | 用户与 operator 安装、调用与审阅边界 |
| [运行边界](./runtime/runtime_architecture.md) | OPL-hosted runtime 边界与图像密集 Attempt 恢复责任 |
| [交付合同模型](./policies/deliverable_contract_model.md) | 交付任务与路线的组织方式及候选 vs 正式交付边界 |
| [AI-first 质量边界](./policies/ai_first_quality_boundary.md) | 创作、审阅与机械验证的分工 |
| [视觉模式记忆](./policies/visual_pattern_memory_policy.md) | 经验复用、接受和写回边界 |
| [交付示例](./delivery/deliverable_examples.md) | PPT 和小红书典型输入与目标 |
| [Image-first PPT 路线](./delivery/image-first-ppt-production-route.md) | 默认整页图路线、事实/资产约束、评测与首轮工作流边界及 developer proof |
| [整页图导出与审阅证据](./delivery/image-deck-export.md) | `ppt_deck_export` 与 `ppt_review_evidence` 清单、回读与开发证明边界 |
| [HTML PPT 路线](./delivery/html-ppt-route-quality.md) | 显式 HTML 路线的 authoring、repair 与只读投影 |
| [Native PPT Proof 环境](./delivery/native-ppt-proof-environment.md) | 可编辑 PPT 的本地/Docker/doctor 开发 proof 环境说明 |
| [Native PPT 非劣效规格](./specs/native-ppt-ppt-master-parity.md) | 原生对象、模板、跨 viewer 与同源盲评验收规格 |
| [Native PPT 设计来源参考](./references/native-ppt-open-source-design-discipline.md) | 外部开源 PPT 设计来源归属表 |

## RCA 生命周期应用说明

- `agent/` 与 `prompts/` 属于可执行/被消费的行为资源（Stage、专业 Skill、质量门与提示词模板），不按普通 prose 去重；改动需同步追踪 manifest、action 与实际调用者。
- `plugins/redcube-ai/` 仅在 Git 中跟踪 4 份载体独有清单/元数据（`.codex-plugin/plugin.json`、`plugin.json`、`opl-package.json`、`skills/redcube-ai/agents/openai.yaml`），其余文件由 `scripts/sync_carrier.py` 按 `contracts/carrier_projection.json` 在构建/验证期从 tracked canonical source 确定性物化并被 `.gitignore` 忽略。
- 法律与授权文件保留原职责；已完成计划、执行流水与退役界面说明从当前树删除，历史通过 Git 追溯。
- 验证文档与资源链接、结构一致性及投影后，只报告本次实际检查范围与结果。
