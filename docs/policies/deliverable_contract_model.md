# 交付合同模型

本页解释视觉任务的领域组织方式。阶段和 action 由 `agent/stages/manifest.json`、`contracts/action_catalog.json` 与对应 route contracts 定义，不从旧 overlay/runtime package 推导。

## 任务与路线

每次任务绑定 source refs、受众、品牌约束、交付格式和 artifact lineage。`ppt_deck`、`xiaohongshu`、`poster_onepager` 是现有交付 families；具体任务的 rubric、密度、版式与导出要求进入领域输入和 AI-authored 设计，不依赖固定模板偷偷决定。

PPT 和小红书默认 image-first。HTML 与 native PPTX 必须依据当前用户要求明确选择；native 必须有可编辑对象或原生路线的语义依据，模板文件、PPTX 扩展名或质量检查失败不能自动切换路线。完整路由规则由主 Skill 与 route contracts 持有。

## 阶段与产物

标准阶段图覆盖 source intake、communication strategy、visual direction、artifact creation、独立 Meta Review 和 package/handoff。各 family 可以保留不同的内部叙事与页面步骤，但不创建第二 StageRun 状态机。

source readiness 决定已有材料能支持哪些事实；communication strategy 决定受众、storyline、outline 和页面任务；visual direction 决定视觉表达；后续创作、审阅和导出消费准确的上游 refs。Research 补足来源，不代替叙事判断。

视觉审阅包含 director review 与真实截图证据，native 路线还需准确 package/object 和 renderer readback。具体 author/reviewer 权责见 [AI-first 质量边界](./ai_first_quality_boundary.md)。

## 候选与正式交付

可读候选、质量债、正式 Review 和 owner acceptance 是不同状态。质量预算耗尽可以继续交付最佳可读候选，缺页或无输出需要明确诊断；不能把文件存在、family 支持或测试通过称为 production-grade、visual-ready 或正式接受。

海报能力的范围是当前知识海报任务；学术/会议场景需单独验证。公开上传与发布遵守用户明确授权。
