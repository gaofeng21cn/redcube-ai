# ppt_deck detailed_outline

## AI-first 页数与结构合同

- `source_materials_full_text`、`source_slide_plan_suggestions`、`source_fact_summary` 与 `page_budget.planning_signals` 是资料和参考信号，不是批准合同。
- 只有 `page_budget.hard_constraints` 中的硬性页数约束必须遵守，例如 `max_slides`。
- 页数、章节结构、证据取舍与故事推进由 AI 基于完整资料、用户目标和硬性约束决定；不得因为资料包里有推荐逐页内容就机械锁定页数、顺序或标题。
- 如果上游 storyline / detailed_outline / slide_blueprint 已经作为当前 product-entry session 的人工审阅批准产物进入后续阶段，才把它作为批准合同继续沿用。
- 如果用户要求“先给我审阅、审阅后再继续”，本 stage 是人工审阅停靠点，输出必须足够支持后续完整 deck，而不是终稿压缩版。

## 内容要求

- 每页必须明确 `core_sentence`、`evidence_points`、`page_objective`、`page_core_content` 与 `render_recipe_id`。
- `source_materials_full_text` 是完整资料输入，必须通读全文后规划页面；不得只消费材料开头、`source_fact_summary`、`ready_sources` 或任何截断 excerpt。
- 如果上下文提供 `manuscript_evidence_table`，必须把它当作 storyline 已从全文抽取出的结构化证据表来消费；每篇论文的研究问题、终点、方法、关键数字结果、结论边界都要能在逐页大纲里找到落点。
- 如果任务是待投稿/成文论文同步，每篇论文必须至少有一页听众可见内容直接写出关键数字证据，例如样本量、事件率、AUROC、Brier、校准、风险分层、Knosp 分布等；数字只能来自 `source_materials_full_text`。
- 待投稿/成文论文同步的页面主语是“论文故事、结论、证据、边界”，不得硬扯“科室价值”“应用场景”“管理建议”“服务临床动作”或把论文写成已经可推广使用的工具。
- 若存在具名讲者署名，封面页必须把署名落成 audience-facing cover element，而不是写成“封面必须署名”这类元指令。
- 听众可见字段只允许承载标题、结论、证据摘要、边界和必要数字；`speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks` 是讲者/作者工作面，不得复制或改写成页面正文。
- 如果源材料、题目或管理上下文里存在内部编号、项目编号、source_id、material_id，且用户给出了对外称呼或序号，所有听众可见标题和正文必须使用对外称呼；内部编号只留在 provenance 或 notes，不作为论文标题。
- 不得直接跳到 HTML；必须为后续逐页设计保留讲授推进关系与证据落点。

## AI-first output schema

下列 JSON 只说明字段形状，不是页数预算、章节模板或可复制文案。实际 slide 数、章节标题、页面顺序、证据取舍由 AI 通读完整资料后决定。

```json
{
  "chapter_structure": [
    {
      "chapter_id": "C1",
      "title": "<AI-authored chapter title from full source context>",
      "slide_range": "01-03"
    }
  ],
  "slides": [
    {
      "slide_id": "S01",
      "slide_no": 1,
      "chapter_id": "C1",
      "page_type": "<AI-authored page type>",
      "layout_family": "<allowed layout family>",
      "title": "<audience-facing slide title>",
      "page_goal": "<private authoring goal>",
      "page_objective": "<private authoring objective>",
      "core_sentence": "<audience-facing main claim>",
      "evidence_points": [
        "<visible evidence or source-backed result>",
        "<visible evidence or source-backed result>"
      ],
      "public_sources": [
        "<audience-readable source label>"
      ],
      "page_core_content": [
        {
          "label": "<optional visible label>",
          "text": "<audience-facing content backed by source_materials_full_text>"
        }
      ],
      "visual_anchor_tracks": [
        "<private visual planning anchor>"
      ],
      "speaker_notes": "<private speaker note, never visible slide body>",
      "transition_sentence": "<private transition note>",
      "render_recipe_id": "ppt.<allowed_recipe_id>"
    }
  ]
}
```
