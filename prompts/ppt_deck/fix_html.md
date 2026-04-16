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
- 不得输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 不得把内部流程、revision_context、模板名、registry、审稿话术写进 audience-facing HTML
- 正文页标题字号必须与整套 deck 的统一档位保持一致；不要靠临时缩字逃避布局
- 必须遵守 `context.deck_style_reference.typography_plan`；正文页标题、卡片标题、正文、标签、页码要回到整套 deck 的统一字号梯度
- 连接线、轨道线、时间线必须退到数字/徽标/关键词下层
- 自然换行优先于硬挤一行；中文页默认中文优先，不要无意义中英混用
- 若标题或短句在当前字号梯度下本可单行成立，则禁止继续保留无必要 `<br/>`
- 短中文词组只能在自然语义处分行；不要把“推进中 / 被偷换”“正式主链 / 不靠聪明捷径”这类短句硬拆
- 若是 `ring_cross` / 四向骨架页，修页时要恢复中心与四侧卡片近似等距；不能只修溢出却留下明显失衡
- 若是 `judgement_ladder` / `timeline_band`，遇到卡片内放不下时，优先减字、扩卡和重排，不要靠手插 `<br/>` 继续制造断句

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
