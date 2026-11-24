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

## 长期能力方向

RCA 作为可替换、可安装、可托管的 `OPL Package(kind=agent)`，持续提升以下领域能力（进入 `agent/`、质量合同与 native helpers，不新建独立 runtime、scheduler 或 session store）：

- source-to-story communication strategy；
- visual direction、layout grammar、brand/style consistency；
- image-first、HTML 与 editable native PPT 的显式路线选择；
- screenshot/layout/content-fit review；
- exact artifact lineage、export integrity 与 visual memory reuse；
- 独立 reviewer/re_reviewer 的质量判断与 bounded repair。

领域能力提升必须由真实 source/artifact、独立 Review、export、memory 与 owner evidence 证明；未关闭验收项见 [未完成验收](./active/rca-ideal-state-gap-plan.md)。目标方向不构成发布、安装或生产就绪声明。
