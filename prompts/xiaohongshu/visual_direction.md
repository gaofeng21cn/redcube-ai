# xiaohongshu / visual_direction

视觉导演稿是 HTML 前硬前置。
## AI-first 视觉导演合同

- 必须基于当前 `single_note_plan.slides` 的真实页数、真实 `slide_id` 与页面内容生成视觉导演稿。
- `rhythm_curve` 必须覆盖当前 plan 的每一页；不得照抄 N01-N06 示例，也不得把内容强行压成固定 6 页。
- `peak_pages` 必须从当前 plan 的真实 `slide_id` 中选择，数量由内容峰值决定。
- `page_family_ceiling` 由 AI 根据当前 note 的页面数量、layout family 分布与同构风险自行设定；它是视觉多样性约束，不是页数预算。
- 不得把 `runtime_seed` 或输出 schema 中的占位值当成默认视觉方向。

要求：
- 必须显式包含 visual motif / rhythm curve / peak pages / page family ceiling / forbidden regressions / anti-template constraints / source language discipline / visual anchor system / signature exposure grammar
- 不是“风格描述 + 颜色建议”
- optimize_existing 时必须写出 baseline-relative forbidden regressions
- 封面、机制峰值页和结尾页都要定义清楚的视觉锚点；XHS 优先 Font Awesome Free，emoji 只做补充
- 禁止把孤立单字贴纸、随机图形或内部标签当成视觉锚点
- 必须显式定义相邻可读块安全间距：副标题、主卡、步骤条、底部收束、署名之间要有清楚呼吸；视觉贴住按失败处理

## runtime_seed

下列 JSON 只说明字段形状，不提供默认 6 页节奏、固定峰值页或固定页面家族配额。

```json
{
  "visual_direction": {
    "director_statement": "<AI-authored director statement for the current single_note_plan>",
    "visual_motif": "<AI-authored visual motif>",
    "material_rules": {
      "paper_base": "<AI-authored paper/base material>",
      "main_accent": "#2563EB",
      "warning_accent": "#DC2626"
    },
    "rhythm_curve": [
      {"slide_id":"<slide_id from current single_note_plan>","role":"<AI-authored visual role>"}
    ],
    "peak_pages": ["<slide_id from current single_note_plan>"],
    "page_family_ceiling": {
      "<layout_family from current single_note_plan>": "<AI-authored reuse ceiling for this note>"
    },
    "anti_template_constraints": [
      "<AI-authored anti-template constraint>",
      "<AI-authored anti-template constraint>"
    ],
    "source_language_discipline": "<AI-authored source-language discipline>",
    "forbidden_regressions": [
      "<AI-authored forbidden regression>",
      "<AI-authored forbidden regression>"
    ]
  }
}
```
