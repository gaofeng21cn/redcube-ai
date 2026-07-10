# ppt_deck visual_direction

视觉导演稿必须在 HTML 之前完成。
## AI-first 视觉导演合同

- 必须基于当前 `slide_blueprint.slides` 的真实页数、真实 `slide_id` 与页面内容生成视觉导演稿。
- `rhythm_curve` 必须覆盖当前 blueprint 中的每一页；不得照抄示例 slide_id，也不得把长 deck 压成固定 8 页节奏。
- `peak_pages` 必须从当前 blueprint 的真实 `slide_id` 中选择，数量由内容峰值决定；不要默认使用 S01/S04/S06/S08。
- `page_family_ceiling` 由 AI 根据当前 deck 的页面数量、layout family 分布与叙事重复风险自行设定；它是视觉多样性约束，不是页数预算。
- `blueprint.claim_spine_lock` 是不可改写的叙事合同：视觉编码必须让 claim 的首次具名、引入、证明和收束页角色可观察，并遵守 `source_refs` 与 `forbidden_drift`；不得在视觉导演阶段重命名或改写 claim。
- 不得把 `runtime_seed` 或输出 schema 中的占位值当成默认视觉方向。

要求：
- 定义 visual_manifest / rhythm_curve / peak_pages / page_family_ceiling
- 定义整套 deck 共用的 `typography_plan`，明确封面标题、正文页标题、卡片标题、正文、标签、页码等字号梯度
- 从导演稿阶段就定义页面纵向信息分布：避免信息长期只堆在中段，底部要承担收束、承重或呼吸平衡
- 从导演稿阶段就定义相邻可读块安全间距：标题区、导语、主面板、步骤卡、底部说明之间必须有清楚呼吸，视觉贴住按失败处理
- 主标题安全区必须保持清空：左上角、标题带附近不得放 section chip、角标卡片、badge、tag 或装饰标签；如需章节信号，优先放页脚或省略
- 表格和数据矩阵必须按汇报可读性设计：正文不低于 11pt，单元格内边距紧凑，行高服务阅读而不是制造空白，卡片或表格容器不得出现大面积空白
- 明确 allowed / forbidden elements
- 显式规定 deck 的视觉锚点系统；PPT 优先使用 Font Awesome Free 图标，保持整套 deck 的图标语法一致
- 禁止把孤立单字贴纸、随机装饰符号或疑似内部标签当成视觉锚点
- 禁止把整章退化成统一安全模板页
- optimize_existing 时必须补 keep_old_strengths / forbidden_regressions
- 每页的 action-title promise 必须对应可观察的语义构图：dependency map 有关系边，timeline 有顺序节点，decision ladder 有门/分支，数据判断有诚实 chart/table encoding；一条装饰线、圆点或等宽卡片不能替代语义关系。
- `rhythm_curve.role` 和下游指令必须明确每页的 proof object 与首眼关系，确保 native/image/HTML author 都能消费同一导演意图。

## runtime_seed

下列 JSON 只说明字段形状，不提供默认 8 页节奏、固定峰值页或固定页面家族配额。

```json
{
  "visual_direction": {
    "visual_manifest": "<AI-authored visual thesis for the current slide_blueprint>",
    "what_it_is": [
      "<AI-authored visual identity>",
      "<AI-authored visual identity>"
    ],
    "what_it_is_not": [
      "<forbidden visual regression>",
      "<forbidden visual regression>"
    ],
    "allowed_elements": [
      "<AI-authored allowed element>"
    ],
    "forbidden_elements": [
      "<AI-authored forbidden element>"
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
      "<AI-authored continuity rule for this deck>",
      "<AI-authored continuity rule for this deck>"
    ],
    "rhythm_curve": [
      {
        "slide_id": "<slide_id from current slide_blueprint>",
        "role": "<AI-authored visual role for that slide>"
      }
    ],
    "peak_pages": [
      "<slide_id from current slide_blueprint>"
    ],
    "page_family_ceiling": {
      "<layout_family from current slide_blueprint>": "<AI-authored reuse ceiling for this deck>"
    },
    "forbidden_regressions": [
      "<AI-authored forbidden regression>",
      "<AI-authored forbidden regression>"
    ],
    "final_instruction_to_html_generator": [
      "<AI-authored instruction for render_html>",
      "<AI-authored instruction for render_html>"
    ]
  }
}
```
