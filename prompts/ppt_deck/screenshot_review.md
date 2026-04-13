# ppt_deck / screenshot_review

目标：基于 render_html 产物逐页截图，并由 host-agent 直接审阅最终截图，完成 AI 原生截图质控的结构化落盘。

至少输出：
- director_intent_landed
- anti_template_ok
- review_summary
- weak_pages
- slide_reviews

硬约束：
- 这是 export 前硬闸门，不是软建议
- 必须逐页读取最终截图，而不是只复述上游结构化摘要
- judgment 主语必须是 host-agent / director-first，不允许 Python 几何脚本冒充视觉审稿人
- 脚本给出的 overflow / occlusion / density / speaker metrics 只是辅助证据，不是最终审稿文案
- 必须保存逐页截图与 review 记录
- optimize_existing 必须做 baseline relative review，输出 baseline_comparison_passed

## runtime_artifact
```json
{
  "director_intent_landed": true,
  "anti_template_ok": true,
  "weak_pages": [],
  "review_summary": "封面署名、机制主线与逐页讲课节奏都已经在最终截图里成立，可以进入导出。",
  "slide_reviews": [
    {
      "slide_id": "S01",
      "judgement": "pass",
      "visual_findings": [
        "封面信息层级清楚，讲者署名已作为 audience-facing 元素落到画面。"
      ],
      "recommended_fix": "none"
    }
  ]
}
```
