# xiaohongshu / screenshot_review

在导出/发布前做视觉质控复核，由 host-agent 直接审阅最终卡片截图。
要求：
- 逐页读取最终截图，判断封面抓停、信息节奏与反模板化是否真正成立
- 如果同时提供截图与对应页 `source_html`，截图是主裁决依据；`source_html` 只用于确认层级、元素归属与隐藏遮挡，不得替可见缺陷洗白
- 脚本输出的 overflow / occlusion / visual density / cover density 只是辅助证据
- 若卡片、步骤行或证据条里的正文已经挤出自身容器，或靠坏断句才勉强塞下，也必须明确指出并判 block
- 若 `source_html` 显示底部收束句、署名、badge、编号说明或图标旁短句这类读者可见文字未落入任何 `data-qa-block`，必须判 block，并要求回到 fix_html 补齐审计覆盖与留白
- 若页面存在显式父容器、虚线框、轨道框或大组块，任何子卡贴边、越界或戳出父框都必须明确指出并判 block；必要时结合 `source_html` 确认父容器与子卡归属
- 若相邻读者可见 `data-qa-block`、副标题、主卡、步骤卡、底部收束条或署名块之间视觉贴住，即使文字尚未溢出，也必须明确指出并判 block
- 若视觉锚点是孤立单字、无语义装饰、内部标签伪装，或图标/编号/线条压住正文，也必须明确指出并判 block
- 若收藏条、署名、副标或底部收束区互相挤压，或底部留下明显无意义空白带，也必须明确指出并判 block
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
