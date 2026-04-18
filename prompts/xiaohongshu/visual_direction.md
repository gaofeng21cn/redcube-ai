# xiaohongshu / visual_direction

视觉导演稿是 HTML 前硬前置。
要求：
- 必须显式包含 visual motif / rhythm curve / peak pages / page family ceiling / forbidden regressions / anti-template constraints / source language discipline / visual anchor system / signature exposure grammar
- 不是“风格描述 + 颜色建议”
- optimize_existing 时必须写出 baseline-relative forbidden regressions
- 封面、机制峰值页和结尾页都要定义清楚的视觉锚点；XHS 优先 Font Awesome Free，emoji 只做补充
- 禁止把孤立单字贴纸、随机图形或内部标签当成视觉锚点
- 必须显式定义相邻可读块安全间距：副标题、主卡、步骤条、底部收束、署名之间要有清楚呼吸；视觉贴住按失败处理

## runtime_seed
```json
{
  "visual_direction": {
    "director_statement": "像一个认真做过整理的人，把复杂内容画成可收藏的笔记",
    "visual_motif": "米白纸面 + 蓝色高亮 + 红色纠偏批注 + 便签式收束",
    "material_rules": {
      "paper_base": "米白纸 + 轻网格",
      "main_accent": "#2563EB",
      "warning_accent": "#DC2626"
    },
    "rhythm_curve": [
      {"slide_id":"N01","role":"hook_peak"},
      {"slide_id":"N02","role":"tension"},
      {"slide_id":"N03","role":"clarify"},
      {"slide_id":"N04","role":"mechanism_peak"},
      {"slide_id":"N05","role":"evidence_peak"},
      {"slide_id":"N06","role":"memory_close"}
    ],
    "peak_pages": ["N01", "N04", "N05"],
    "page_family_ceiling": {
      "cover_note": 1,
      "myth_compare": 1,
      "sequence_stack": 1,
      "process_track": 1,
      "evidence_strip": 1,
      "action_checklist": 1
    },
    "anti_template_constraints": [
      "禁止连续两页退化成同构白底卡片堆叠",
      "封面、机制页、证据页必须首眼差异明显",
      "不能把所有页面压成同一标题+三卡骨架",
      "相邻可读文字块、卡片与底部收束条之间必须保留安全间距，视觉贴住按失败处理"
    ],
    "source_language_discipline": "来源必须翻译成读者能理解的公开口径，不允许内部资料/来源索引/内部文件名",
    "forbidden_regressions": [
      "白底卡片网格页",
      "统一安全科技卡片页",
      "历史成品拼装",
      "有高亮无结构、像装饰页"
    ]
  }
}
```
