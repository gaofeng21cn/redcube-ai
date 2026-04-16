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
- 如果同时提供截图与对应页 `source_html`，截图是主裁决依据；`source_html` 只用于确认层级意图、元素归属与隐藏遮挡，不得拿源码为可见缺陷开脱
- judgment 主语必须是 host-agent / director-first，不允许 Python 几何脚本冒充视觉审稿人
- 脚本给出的 overflow / occlusion / density / speaker metrics 只是辅助证据，不是最终审稿文案
- 必须顺着整套 deck 横向比对版式一致性，而不是只看单页过不过线；若某页整体字号、卡片尺度、标签粗细明显偏大或偏小，也要判为 weak/block
- 若标题或短句在截图里明明可以单行成立，却被人为拆成两行，必须明确指出；必要时判 block
- 对 `ring_cross` / 四向围绕中心的骨架页，若某一方向卡片明显比其他方向更贴近中心，必须指出布局失衡；必要时判 block
- 若 `judgement_ladder` / `timeline_band` 的卡片内容通过不自然换行才勉强塞下，也必须指出这不是合格成品
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
