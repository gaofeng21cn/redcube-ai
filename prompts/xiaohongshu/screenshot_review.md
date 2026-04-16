# xiaohongshu / screenshot_review

在导出/发布前做视觉质控复核，由 host-agent 直接审阅最终卡片截图。
要求：
- 逐页读取最终截图，判断封面抓停、信息节奏与反模板化是否真正成立
- 如果同时提供截图与对应页 `source_html`，截图是主裁决依据；`source_html` 只用于确认层级、元素归属与隐藏遮挡，不得替可见缺陷洗白
- 脚本输出的 overflow / occlusion / visual density / cover density 只是辅助证据
- judgement 主语必须是 host-agent / director-first，不允许 deterministic script 代替视觉审稿
- optimize_existing 时输出 baseline_comparison_passed
- 阻断问题未清零前不得进入 publish_copy / export_bundle

## runtime_artifact
```json
{
  "director_intent_landed": true,
  "anti_template_ok": true,
  "weak_pages": [],
  "review_summary": "封面抓停、机制推进与结尾动作都已经在最终卡片截图里成立，可以继续进入发布文案阶段。",
  "slide_reviews": [
    {
      "slide_id": "N01",
      "judgement": "pass",
      "visual_findings": [
        "封面首眼抓取点明确，移动端阅读路径清楚。"
      ],
      "recommended_fix": "none"
    }
  ]
}
```
