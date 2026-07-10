# ppt_deck slide_blueprint

## AI-first 蓝图合同

- `detailed_outline` 是本阶段必须落实的上游合同；它来自当前 session 的 AI 规划或人工审阅结果。
- `source_slide_plan_suggestions`、`source_materials_full_text` 中的推荐逐页内容、`source_fact_summary` 与 `page_budget.planning_signals` 只作为参考，不得被当成批准蓝图。
- 只有 `page_budget.hard_constraints` 中的硬性页数约束必须遵守，例如 `max_slides`。
- `slide_blueprint` 必须忠实展开当前 `detailed_outline`，不得重新回到资料包建议页数，也不得用资料包建议覆盖 outline 的 AI 判断。

## 内容要求

逐页设计是进入 HTML 前的强制 stage。每页必须包含：

- `slide_no` / `title` / `page_goal`
- `page_core_content`
- `visual_presentation`
- `evidence_points` 与 `public_sources`
- `speaker_notes`
- `transition_sentence`
- complex structure pages 的 explicit anchor / grid / track

必须基于 `source_materials_full_text` 全文展开，不得只使用材料开头、摘要、标题、`source_fact_summary` 或截断 excerpt。

如果上下文提供 `manuscript_evidence_table`，逐页蓝图必须沿用这张结构化证据表；不能在 outline 有数字而 blueprint 把数字改回“更稳”“更清楚”“增量有限”等无数字抽象表述。

如果任务是待投稿/成文论文同步，主要发现页必须在听众可见字段中落入关键数字证据；不能只写“风险分层更清楚”“模型表现更好”“边界更明确”等无数字概括。

`evidence_points` 是后续 HTML 的读者可见证据层，不是内部来源说明；主要结果页中的 AUROC、Brier、校准、事件率、风险梯度、Knosp 分布等数字必须保留在 `evidence_points` 或 `page_core_content`。

必须从 `outline.claim_spine_lock` 原样回显 `claim_spine_lock`，并保持其 first-use / introduction / proof / resolution 映射落在本 stage 的真实 `slide_id`；不得改写稳定 claim、来源引用、首次具名规则或 `forbidden_drift`。

## 听众可见边界

- `title`、`core_sentence`、`evidence_points`、`page_core_content`、关键图示标签和底部边界条是听众可见面，只能写研究内容、证据结果、边界和团队需要知道的决策信息。
- `speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks`、`evidence_and_sources.source_id`、`material_id` 是作者/系统工作面，不得被复制、改写或压成页面正文。
- 若用户区分了内部管理编号和对外论文顺序，蓝图标题和正文必须使用对外顺序标签，例如“第一篇 / 第二篇 / 第三篇”，内部编号只保留在来源/provenance。
- 不要把“建议怎么讲”“可发表表达”“讲稿备忘录”“待确认的写作口径”做成投影片主内容；需要讨论的事项必须改写成听众能直接理解的研究边界或团队确认项。
- 不要把交付用途、操作者要求或系统约束写成投影片正文，例如“汇报讨论用途”“客观专业版”“本次汇报边界”“不在展示页暴露”“RCA”“RedCube”“product-entry”“source intake”“author_pptx_native”“slide_blueprint”“visual_direction”等；这些内容只服务生成过程，蓝图必须改写为项目负责人可直接阅读的研究目标、数据边界、分析方向或决策项。
- 即使输入 title / goal / user_intent 中直接出现 `RCA`、`RedCube`、`product-entry` 或 route 名称，`slides[].title`、`page_goal`、`core_sentence`、`page_core_content`、`evidence_points` 等所有 audience-facing 字段也必须先改写为对外表达。例如把“RCA 自主工作流证明”改写为“自主交付链路证明”“可复核交付闭环”或“从目标到导出的验收路径”，不要把内部系统名原样带到页面。
- 待投稿/成文论文同步不得把论文包装成已可推广的科室应用、临床管理工具或价值宣传；页面应同步论文准备投稿所需的故事、结论、证据和局限。

## AI-first output schema

下列 JSON 只说明字段形状，不提供默认页数、默认章节或 profile 模板。

```json
{
  "chapter_goal": "<AI-authored goal for this outline chapter or deck section>",
  "claim_spine_lock": [
    {
      "claim_id": "CLM-001",
      "claim_text": "<unchanged claim_text from outline.claim_spine_lock>",
      "source_refs": ["<unchanged source ref>"],
      "first_use_naming": {
        "full_visible_name": "<unchanged full audience-facing name>",
        "accepted_abbreviation": null,
        "first_use_slide_id": "S01"
      },
      "introduction_slide_id": "S01",
      "proof_slide_ids": ["S02"],
      "resolution_slide_id": "S03",
      "forbidden_drift": ["<unchanged forbidden drift>"]
    }
  ],
  "slides": [
    {
      "slide_id": "S01",
      "slide_no": 1,
      "chapter_id": "C1",
      "page_type": "<page type from detailed_outline or AI-authored refinement>",
      "layout_family": "<allowed layout family>",
      "title": "<audience-facing title>",
      "page_goal": "<private authoring goal>",
      "page_objective": "<private authoring objective>",
      "core_sentence": "<audience-facing main claim>",
      "evidence_points": [
        "<visible evidence from source_materials_full_text or manuscript_evidence_table>"
      ],
      "public_sources": [
        "<audience-readable source label>"
      ],
      "page_core_content": [
        {
          "label": "<optional visible label>",
          "text": "<audience-facing content>"
        }
      ],
      "visual_anchor_tracks": [
        "<private visual anchor>"
      ],
      "speaker_notes": "<private note>",
      "transition_sentence": "<private transition>",
      "render_recipe_id": "ppt.<allowed_recipe_id>"
    }
  ],
  "quality_guards": {
    "ai_authored_from_full_source": true,
    "follow_current_detailed_outline": true,
    "do_not_copy_source_slide_plan_suggestions": true
  }
}
```
