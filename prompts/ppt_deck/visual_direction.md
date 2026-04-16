# ppt_deck visual_direction

视觉导演稿必须在 HTML 之前完成。
要求：
- 定义 visual_manifest / rhythm_curve / peak_pages / page_family_ceiling
- 定义整套 deck 共用的 `typography_plan`，明确封面标题、正文页标题、卡片标题、正文、标签、页码等字号梯度
- 明确 allowed / forbidden elements
- 禁止把整章退化成统一安全模板页
- optimize_existing 时必须补 keep_old_strengths / forbidden_regressions

## runtime_seed
```json
{
  "visual_direction": {
    "visual_manifest": "{{title}} 采用浅底高对比、结构显式、峰值页拉节奏的成熟讲台感",
    "what_it_is": [
      "讲授型工作台",
      "结构先行",
      "证据与动作并重"
    ],
    "what_it_is_not": [
      "统一安全模板页",
      "内部占位来源页",
      "脚本拼卡片"
    ],
    "allowed_elements": [
      "结构轨道",
      "判断梯",
      "来源芯片",
      "显式锚点",
      "章节峰值页"
    ],
    "forbidden_elements": [
      "内部资料来源",
      "统一模板卡片墙",
      "无锚点复杂结构"
    ],
    "palette": {
      "canvas": "#F7F8FC",
      "ink": "#0F172A",
      "accent": "#2563EB",
      "accentSoft": "#DBEAFE",
      "success": "#0F766E"
    },
    "typography_plan": {
      "cover_title": { "font_size": 56, "line_height": 1.08, "font_weight": 800 },
      "body_title": { "font_size": 44, "line_height": 1.12, "font_weight": 780 },
      "section_lead": { "font_size": 24, "line_height": 1.4, "font_weight": 650 },
      "card_title": { "font_size": 21, "line_height": 1.18, "font_weight": 720 },
      "card_body": { "font_size": 16.5, "line_height": 1.45, "font_weight": 600 },
      "meta_label": { "font_size": 12.5, "line_height": 1.1, "font_weight": 600 },
      "page_no": { "font_size": 18, "line_height": 1.0, "font_weight": 600 }
    },
    "continuity_constraints": [
      "关键页必须与相邻页形成明显差异",
      "来源与页码按页控制",
      "复杂结构页必须显式写出锚点/轨道/网格",
      "整套 deck 必须沿用同一套字号梯度，不允许后页整体变大或变小"
    ],
    "rhythm_curve": [
      {
        "slide_id": "S01",
        "role": "opening_peak"
      },
      {
        "slide_id": "S02",
        "role": "stakes_rise"
      },
      {
        "slide_id": "S03",
        "role": "clarify_buffer"
      },
      {
        "slide_id": "S04",
        "role": "mechanism_peak"
      },
      {
        "slide_id": "S05",
        "role": "decision_bridge"
      },
      {
        "slide_id": "S06",
        "role": "evidence_peak"
      },
      {
        "slide_id": "S07",
        "role": "practice_bridge"
      },
      {
        "slide_id": "S08",
        "role": "closing_peak"
      }
    ],
    "peak_pages": [
      "S01",
      "S04",
      "S06",
      "S08"
    ],
    "page_family_ceiling": {
      "cover_hero": 1,
      "central_axis": 1,
      "multi_zone_compare": 2,
      "timeline_band": 1,
      "judgement_ladder": 1,
      "ring_cross": 1,
      "summary_peak": 1
    },
    "forbidden_regressions": [
      "退化成统一安全模板页",
      "更单调",
      "更挤",
      "更像脚本拼卡片"
    ],
    "final_instruction_to_html_generator": [
      "每页在 slidesData 中独立 content",
      "复杂结构页必须显式输出锚点与轨道",
      "关键页必须保留视觉峰值，不允许连续同构",
      "正文页标题、卡片标题、卡片正文、标签与页码都要遵守 typography_plan 的统一级差"
    ]
  }
}
```
