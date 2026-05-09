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
- 若中文短术语或核心词组在截图里被拆成单字尾行，例如“科研路径”“质量边界”“署名责任”“可审查”“医生监督”等被断开，必须判 block，并要求回到 fix_html 通过减字、放宽容器、语义换行或 inline-block/word-break: keep-all 修复
- 对 `ring_cross` / 四向围绕中心的骨架页，若某一方向卡片明显比其他方向更贴近中心，必须指出布局失衡；必要时判 block
- 对 `ring_cross`，中心圆/中心节点与下方或四周卡片只要出现接触、压入、重叠，或明显小于 8px 可见间距，必须判 block；不能把这种问题降级为“视觉压迫感”观察项
- 若 `judgement_ladder` / `timeline_band` 的卡片内容通过不自然换行才勉强塞下，也必须指出这不是合格成品
- 若卡片、标签或节点容器里的正文已经挤出自身边界，或靠坏断句才勉强塞下，也必须明确指出并判 block；不能因为整页没有滚动条就放过
- 若机械指标出现 `surface_text_scroll_overflow`、`surface_text_targets_overlap` 或 `surface_text_targets_too_close`，这代表内部卡片/节点层面的真实可见风险，必须作为截图质控阻断项处理
- 若 `source_html` 显示底部说明、图注、讲者信息、badge、节点说明或图标旁短句这类读者可见文字未落入任何 `data-qa-block`，必须判 block，并要求回到 fix_html 补齐审计覆盖与留白
- 若页面存在显式父容器、虚线框、轨道框或大组块，任何子卡贴边、越界或戳出父框都必须明确指出并判 block；必要时结合 `source_html` 确认父子归属
- 若相邻读者可见 `data-qa-block`、导语、主卡、步骤卡、总结卡或底部说明之间视觉贴住，即使文字尚未溢出，也必须明确指出并判 block
- 若读者可见页面出现“汇报讨论用途”“客观专业版”“本次汇报边界”“不在展示页暴露”“RCA”“RedCube”“source intake”“author_pptx_native”“slide_blueprint”“visual_direction”等操作者、系统或 route 层文案，必须判 block；推荐修复必须要求改写为项目负责人可读的研究目标、数据边界、团队确认项或结论
- 若主标题安全区被左上角 section chip、角标卡片、badge、tag 或装饰标签侵入，必须判 block；推荐修复必须要求移到页脚或删除
- 若表格正文低于 11pt、表格单元格 padding/行高造成明显空白、或卡片内容与容器尺寸不匹配导致“字小但框大”，必须判 block；推荐修复必须要求提高字号、收紧单元格与容器，而不是继续缩字
- 若怀疑截图裁切错误、下一页串入或非当前页内容可见，必须基于当前页截图中的明确可见文字/位置下判定，并在 `visual_findings` 写出该可见证据；不得仅凭相邻页标题、整套 deck 顺序或 `source_html` 上下文推断为 block
- 必须保存逐页截图与 review 记录
- optimize_existing 必须做 baseline relative review，输出 baseline_comparison_passed
- `slide_reviews[].judgement` 只能输出 `"pass"` 或 `"block"`；若页面只是轻微观察项或需后续关注，仍输出 `"pass"`，并把页码放入 `weak_pages`、把观察写进 `visual_findings`，禁止输出 `pass_with_minor_watch`、`soft_pass`、`warning` 等扩展枚举

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
