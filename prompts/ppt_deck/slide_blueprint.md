# ppt_deck slide_blueprint

## 批准蓝图合同

- 如果 detailed_outline、operator_playbook 或 source_materials_full_text 中存在用户已审阅批准或资料包明确给出的逐页故事线，必须逐页展开为同一页数、同一顺序、同一标题覆盖的 slide_blueprint。
- 如果上下文提供 `approved_slide_plan`，slide_blueprint 必须逐页保留，不得合并、删减或压缩。
- 不得合并、删减、压缩或重排已批准页面；长讲座只能在视觉表达上优化，不能改写成交付范围更小的短 deck。
- 如果批准稿是 20 分钟以上的完整讲座，slide_blueprint 必须继续服务完整讲座节奏，而不是转成 6-9 页概览。


逐页设计是进入 HTML 前的强制 stage。
每页必须包含：
- slide_no / title / page_goal
- page_core_content
- visual_presentation
- evidence_and_sources
- speaker_notes
- transition_sentence
- explicit anchor / grid / track for complex structure pages
- 必须基于 `source_materials_full_text` 全文展开，不得只使用材料开头、摘要、标题、source_fact_summary 或截断 excerpt
- 如果上下文提供 `manuscript_evidence_table`，逐页蓝图必须沿用这张结构化证据表；不能在 outline 有数字而 blueprint 把数字改回“更稳”“更清楚”“增量有限”等无数字抽象表述
- 如果任务是待投稿/成文论文同步，主要发现页必须在听众可见字段中落入关键数字证据；不能只写“风险分层更清楚”“模型表现更好”“边界更明确”等无数字概括
- `evidence_points` 是后续 HTML 的读者可见证据层，不是内部来源说明；主要结果页中的 AUROC、Brier、校准、事件率、风险梯度、Knosp 分布等数字必须保留在 `evidence_points` 或 `page_core_content`

听众可见边界：
- `title`、`core_sentence`、`evidence_points`、`page_core_content`、关键图示标签和底部边界条是听众可见面，只能写研究内容、证据结果、边界和团队需要知道的决策信息
- `speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks`、`evidence_and_sources.source_id`、`material_id` 是作者/系统工作面，不得被复制、改写或压成页面正文
- 若用户区分了内部管理编号和对外论文顺序，蓝图标题和正文必须使用对外顺序标签，例如“第一篇 / 第二篇 / 第三篇”，内部编号只保留在来源/provenance
- 不要把“建议怎么讲”“可发表表达”“讲稿备忘录”“待确认的写作口径”做成投影片主内容；需要讨论的事项必须改写成听众能直接理解的研究边界或团队确认项
- 待投稿/成文论文同步不得把论文包装成已可推广的科室应用、临床管理工具或价值宣传；页面应同步论文准备投稿所需的故事、结论、证据和局限

## runtime_seed
```json
{
  "chapter_goal": "逐页落实讲授型 deck 的页面目标、视觉结构与讲稿动作",
  "quality_guards": {
    "no_generic_card_route": true,
    "independent_slides_data_content": true,
    "require_visual_direction_before_html": true
  },
  "profile_checks": {
    "lecture_student": ["term_explained_on_first_use", "teaching_progression_clear"],
    "lecture_peer": ["novelty_position_clear", "method_boundary_explicit"],
    "executive_briefing": ["decision_implication_clear", "conclusion_up_front"],
    "defense_deck": ["claim_evidence_traceable", "backup_qa_ready"]
  }
}
```
