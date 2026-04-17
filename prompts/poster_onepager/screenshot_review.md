# poster_onepager / screenshot_review

目标：在 export 前完成单页海报截图质控，由 host-agent 直接审阅最终海报截图。
要求：
- 直接读取最终海报截图，判断 headline、证据栏与动作收束是否真正成立
- 如果同时提供截图与对应页 `source_html`，截图是主裁决依据；`source_html` 只用于确认层级意图、元素归属与隐藏遮挡，不得替可见缺陷开脱
- Python 的 overflow / occlusion / visual_density 只是辅助证据，不能代替视觉结论
- 若卡片、证据栏或 action footer 里的正文已经挤出自身容器，或靠坏断句才勉强塞下，也必须明确指出并判 block
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
