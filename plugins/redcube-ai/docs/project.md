# RedCube AI 项目定位

本页定义产品对象与长期职责；实现结构见 [架构](./architecture.md)，实际完成程度见 [状态](./status.md)。

RedCube AI 面向专家、教师、研究者和专业团队，把源材料转成幻灯片、小红书图文和知识海报，完成叙事、视觉创作、审阅、修订、导出与文件交付。

RCA 是 OPL 的视觉交付领域 Agent，canonical Package identity 为 `rca`，domain identity 为 `redcube_ai`。`redcube-ai` 是仓库、Codex Plugin 和 Skill carrier 名称。身份声明由 `contracts/opl_agent_package_manifest.json` 与 `contracts/domain_descriptor.json` 持有。

## 交付范围

- PPT 默认使用 image-first 整页图路线；明确要求可编辑 PowerPoint 对象时选择 native PPTX，明确要求 HTML/CSS 网页稿时选择 HTML。
- 小红书默认生成 3:4 整页图，包含内容组织和发布文案；对外发布仍由用户明确授权。
- 知识海报采用对应的单页路线。会议或学术海报需按实际任务评估，不能据已有知识海报能力声称独立学术产品线已验收。

用户提供目标、材料、品牌约束与最终接受判断。RCA 持有 source-readiness、communication/visual-direction、review/export、artifact、visual memory 和 owner receipt 的领域权威。

## 产品边界

RCA 提供专业视觉方法、声明式阶段、合同和 native helpers。通用执行、进程、恢复、workspace transport、状态投影和 Package 安装由相应平台负责；用户从已安装且可调用的 OPL-generated 入口执行 RCA。

Package identity、实际 carrier 和 executor 分开，使专业能力与任务语义可以独立演进。Codex Plugin 是当前 carrier projection，不能单独证明完整 Package 或 hosted runtime 可用。

长期能力方向见 [目标态参考](./references/rca-visual-deliverable-agent-ideal-state.md)。目标不构成发布、安装或生产就绪声明。
