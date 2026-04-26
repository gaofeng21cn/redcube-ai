# ppt_deck / fix_html

目标：针对 `screenshot_review` 点名的 blocked slides 做 AI-first 局部修复，直接在当前 HTML 之上修页，而不是整套重绘。

作用域规则：
- 只输出 `context.blueprint.slides` 中点名的页面，不要补写未点名页面
- `current_content_html` 是该页当前版本；如果结构可救，优先修复而不是推倒重来
- `context.repair_scope.preserved_slide_ids` 对应的页面必须视为已锁定，不要顺手统一、不要改其他页
- 若 `context.reference_slides` 非空，把这些相邻已锁定页面当成 deck 连续风格锚点；修页时要把字体级差、卡片尺度、页内留白拉回同一体系，不要只把当前页局部糊平

硬约束：
- 这是局部修页，不是整套重创作
- 必须逐条消化 `revision_context` 里的 blocked checks、mechanical findings、AI findings、recommended_fix
- 若问题是遮挡、溢出、标题字号漂移、线条压字、留白不足、错误换行、卡片贴边，优先局部收缩内容、重排层级、调整留白与换行
- 除非当前结构已经无法成立，否则不要把这页改成另一种页面家族
- 每页必须保留完整 `data-slide-root=true` 与匹配的 `data-slide-id`
- 每页至少保留 2 个语义化 `data-qa-block`，并至少保留 1 个 `data-primary-point="true"`
- 修复后的所有读者可见文字都必须被最近的语义化 `data-qa-block` 覆盖；裸露的底部说明、图注、讲者信息、badge、节点说明和图标旁短句都要收进可审计块
- 不得输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 不得把内部流程、revision_context、模板名、registry、审稿话术写进 audience-facing HTML
- 必须继续遵守 `audience_visibility_contract`：`speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks`、`operator_playbook`、`operator_playbook_full_text`、`source_id`、`material_id` 都是作者/系统工作面，不得在修页时被补进标题、正文、页脚、badge、图注或卡片
- 如果 blocked 页里有内部管理编号、项目编号、source/material ID 或“讲稿/备忘录/建议怎么讲”式文案，修页必须把这些内容从听众可见 HTML 中移除，并按用户对外口径改写为正式论文顺序、研究结论或边界说明
- 正文页标题字号必须与整套 deck 的统一档位保持一致；不要靠临时缩字逃避布局
- 必须遵守 `context.deck_style_reference.typography_plan`；正文页标题、卡片标题、正文、标签、页码要回到整套 deck 的统一字号梯度
- 连接线、轨道线、时间线必须退到数字/徽标/关键词下层
- render shell 已加载 Font Awesome Free；修页时优先沿用同一套 Font Awesome Free 语义图标，不要引入无关 emoji 或零散装饰
- 视觉锚点必须语义明确；孤立单字贴纸、无意义角标和疑似内部标签都要修掉
- 若页面有显式父容器、组块边框、轨道框或虚线框，修页时必须把子卡重新收回父容器内，并恢复稳定内边距；不能留下“父框在，子卡戳出去”的关系
- 自然换行优先于硬挤一行；中文页默认中文优先，不要无意义中英混用
- 若标题或短句在当前字号梯度下本可单行成立，则禁止继续保留无必要 `<br/>`
- 短中文词组只能在自然语义处分行；不要把“推进中 / 被偷换”“正式主链 / 不靠聪明捷径”这类短句硬拆
- 中文短术语和核心词组必须完整阅读；不得把“科研路径”“质量边界”“署名责任”“可审查”“医生监督”等词拆成单字尾行。空间不足时用更短文案、更宽容器、语义换行，或用 inline-block/word-break: keep-all 保护短词
- 修页时必须检查纵向信息分布；如果信息都挤在中段而底部大片发空，优先下移结构、扩大底部承载区或重分配层次，而不是只在中段局部打补丁
- 底部 summary / takeaway 区必须是有效信息承载或视觉收束，不得只剩一条装饰条，同时让上中段继续拥挤
- 若是 `multi_zone_compare` 的左拆右并页，修页时必须恢复明显主从比例：左侧辅助区应更窄、更轻，右侧主峰区应更大、更集中，不能继续读成等权双栏
- 修页时要检查页码连续性；位置、语法、字重和灰度要与前后页一致，不要顺手改成另一套页码样式
- 若是 `ring_cross` / 四向骨架页，修页时要恢复中心与四侧卡片近似等距；不能只修溢出却留下明显失衡
- 若是 `judgement_ladder` / `timeline_band`，遇到卡片内放不下时，优先减字、扩卡和重排，不要靠手插 `<br/>` 继续制造断句
- 相邻读者可见 `data-qa-block`、导语、主卡、步骤卡、总结卡和底部说明之间必须恢复至少 6px 可见安全间距；标题区贴主面板、导语贴卡片、底部说明贴组块都要修

## runtime_artifact
```json
{
  "slides": [
    {
      "slide_id": "S02",
      "content_html": "<div data-slide-root=\"true\" data-slide-id=\"S02\">...</div>"
    }
  ],
  "render_summary": [
    "已按 screenshot_review 点名问题做局部修复，未重画整套 deck。"
  ]
}
```
