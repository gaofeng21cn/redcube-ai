# ppt_deck / render_html

目标：基于 slide_blueprint + visual_direction 生成单文件 HTML deck。

作用域规则：
- 若 `context.render_scope = "slide_batch"`，只输出当前 batch 对应的 slides，不要补写其他页面
- 若 `context.render_scope = "summary"`，只输出 `render_summary`，不要重复生成整页 HTML

必须保留：
- #slide-display-area
- #prev-btn
- #next-btn
- slidesData = [{ content: `...` }]

硬约束：
- 没有 visual_direction 不得继续
- 每页在 slidesData 中独立 content
- 16:9 / 1152x648 / 无滚动 / 无明显溢出
- 每页必须保留至少 2 个语义化 `data-qa-block`，并至少标记 1 个 `data-primary-point="true"`，供截图质控读取
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 禁止 renderSlide / layoutByType / cardsGrid / pageType
- 必须落实视觉导演稿中的节奏曲线、峰值页、页面家族上限、禁退化语法
- 复杂结构页必须显式网格 / 轨道 / 锚点
- 若上下文提供 `revision_context`，必须优先修复其中点名的 blocked slides、遮挡/裁切与最弱页问题；不要无视上一轮审稿意见原样重画
- 若封面页 blueprint 已给出具名讲者署名，要把它当成正式封面信息排版，而不是系统注释
- final HTML markup 必须由 AI 直接创作；runtime 只负责 shell 边界、审阅契约与持久化，不得退回模板编译

## runtime_seed
```json
{
  "render_contract": {
    "render_strategy": "prompt_director_first",
    "shell_file": "render_shell.html",
    "recipe_registry": {
      "cover_hero": "ppt.hero_signal",
      "multi_zone_compare": "ppt.compare_zones",
      "timeline_band": "ppt.timeline_rail",
      "judgement_ladder": "ppt.judgement_ladder",
      "ring_cross": "ppt.ring_cross",
      "central_axis": "ppt.central_axis",
      "summary_peak": "ppt.summary_peak",
      "default": "ppt.compare_zones"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "每页必须是 audience-facing 成品页，不得把内部提示、制作流程、模板注册表写进画面",
      "禁止输出 <script> / <style> block；如需视觉样式，直接写 inline style",
      "审阅依赖的根节点 metadata 由 runtime 注入，但 AI 仍需交付 review-ready 的 data-qa-block / data-primary-point 结构"
    ]
  }
}
```

## runtime_artifact
```json
{
  "render_markup_artifact": {
    "artifact_surface": "codex_cli_json_output",
    "binding_model": "slides_data_shell_only",
    "required_review_contract": [
      "slide_root",
      "data-qa-block",
      "data-primary-point"
    ],
    "creative_authorship": "ai_first"
  }
}
```
