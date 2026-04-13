# poster_onepager / screenshot_review

目标：在 export 前完成单页海报截图质控，由 host-agent 直接审阅最终海报截图。
要求：
- 直接读取最终海报截图，判断 headline、证据栏与动作收束是否真正成立
- Python 的 overflow / occlusion / visual_density 只是辅助证据，不能代替视觉结论
- judgement 主语必须是 host-agent / director-first
- visual_director_review 未通过前不得继续
- 通过后才能进入 export_bundle

## runtime_artifact
```json
{
  "director_intent_landed": true,
  "anti_template_ok": true,
  "message_hierarchy_clear": true,
  "weak_regions": [],
  "review_summary": "headline、证据与动作层级都已经在最终海报截图里成立，可以进入导出。",
  "slide_reviews": [
    {
      "slide_id": "P01",
      "judgement": "pass",
      "visual_findings": [
        "主标题抓手明确，证据区与行动区层级连续。"
      ],
      "recommended_fix": "none"
    }
  ]
}
```
