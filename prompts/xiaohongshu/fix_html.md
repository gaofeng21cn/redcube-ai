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
- 不得输出 `<script>` / `<style>` block；样式只能写在 inline style
- 不得把内部流程、质控话术、模板名、registry 写进 audience-facing HTML
- 不要外链图片，不要无意义中英混用

## runtime_artifact
```json
{
  "slides": [
    {
      "slide_id": "N01",
      "content_html": "<div data-slide-root=\"true\" data-slide-id=\"N01\">...</div>"
    }
  ],
  "render_summary": [
    "已按 screenshot_review 点名问题做局部修卡，未重画整组图文。"
  ]
}
```
