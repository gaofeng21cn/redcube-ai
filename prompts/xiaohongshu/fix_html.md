# xiaohongshu / fix_html

目标：针对 `screenshot_review` 点名的卡片做 AI-first 局部修复，直接修当前 HTML，不要回退成整套 `render_html` 重画。

作用域规则：
- 只输出 `context.plan.slides` 中点名的卡片
- `current_content_html` 是该卡片当前版本；能局部修就不要整页换版
- `context.repair_scope.preserved_slide_ids` 代表未点名卡片，必须保持原样

硬约束：
- 优先修复遮挡、溢出、换行、层级、留白、封面密度与阅读节奏问题
- 如果只是封面抓停不够、正文太挤、卡片贴边、数字/线条压字，必须在当前页面家族里修
- 不要把手账感修没，不要退化成统一卡片模板
- 每页必须保留 `data-slide-root=true`、匹配的 `data-slide-id`、至少 2 个 `data-qa-block`、至少 1 个 `data-primary-point="true"`
- 修复后的所有读者可见文字都必须被最近的语义化 `data-qa-block` 覆盖；裸露的底部收束句、署名、badge 和图标旁短句都要收进可审计块
- 不得输出 `<script>` / `<style>` block；样式只能写在 inline style
- 不得把内部流程、质控话术、模板名、registry 写进 audience-facing HTML
- 不要外链图片，不要无意义中英混用
- 如果 `context.author_branding` 存在，修页时必须保留作者署名露出，不要把署名块修掉
- 如果页面属于 `process_track`，优先扩大卡片有效宽度、拉开节点与正文距离、把版心压回中下区，清掉压字和上重下轻
- render shell 已加载 Font Awesome Free；修页时保留或补上语义明确的视觉锚点，emoji 只做补充
- 禁止继续保留孤立单字贴纸、疑似内部标签或与主题无关的装饰锚点
- 图标、编号、轨道节点、收藏条和 badge 都必须让开正文；若有压字、贴边或页脚挤压，优先重排结构和留白
- 相邻读者可见 `data-qa-block`、主卡、步骤卡、底部收束条和署名块之间必须恢复至少 6px 可见安全间距；视觉贴住、边缘几乎相接或标题副句压主卡都要修
- 若页面有显式大框、虚线框、轨道框或父容器，修页时必须把子卡重新收回父容器内，并恢复稳定内边距；不能留下“父框在，子卡戳出去”的关系
- 标题、短句与标签都按自然语义换行；如果当前字号下可以单行成立，就不要保留多余 `<br/>`
- 结尾页要恢复第三问、收藏条、署名页脚的稳定三层关系；封面页要恢复标题、副句、主卡与署名的稳定呼吸

说明：
- repair summary 由 runtime 根据 target_slide_ids 与 review context 自动落盘；本阶段只负责交付被点名卡片的 HTML

## runtime_artifact
```json
{
  "slides": [
    {
      "slide_id": "N01",
      "content_html": "<div data-slide-root=\"true\" data-slide-id=\"N01\">...</div>"
    }
  ]
}
```
