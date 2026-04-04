# xiaohongshu / visual_direction

视觉导演稿是 HTML 前硬前置。
要求：
- 明确导演宣言 / 材料感规则 / 分页视觉角色 / 禁退化规则
- 先做笔记感，再做装饰感
- optimize_existing 时补 forbidden_regressions

## runtime_seed
```json
{
  "visual_direction": {
    "director_statement": "像一个认真做过整理的人，把复杂内容画成可收藏的笔记",
    "material_rules": {
      "paper_base": "米白纸 + 轻网格",
      "main_accent": "#2563EB",
      "warning_accent": "#DC2626"
    },
    "forbidden_regressions": [
      "白底卡片网格页",
      "统一安全科技卡片页",
      "历史成品拼装"
    ]
  }
}
```
