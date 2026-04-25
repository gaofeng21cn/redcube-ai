# ppt_deck slide_blueprint

## 批准蓝图合同

- 如果 detailed_outline 或 operator_playbook 中存在用户已审阅批准的逐页故事线，必须逐页展开为同一页数、同一顺序、同一标题覆盖的 slide_blueprint。
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
