# poster_onepager / render_html

将 poster_blueprint 与 visual_direction 落成单页 HTML 海报。
要求：
- 4:5 / 1080x1350 / 无滚动
- final markup 必须由 AI 直接创作，代码只负责 shell boundary、审阅与 artifact persistence
- 每页至少提供 2 个语义化 `data-qa-block`，并至少标记 1 个 `data-primary-point="true"`，供截图质控读取
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 必须把 headline / 证据 / 动作同屏表达清楚
- 不得把内部说明、模板注册表、slot 名称写进最终画面

## runtime_seed
```json
{
  "render_contract": {
    "render_strategy": "prompt_director_first",
    "shell_file": "render_shell.html",
    "recipe_registry": {
      "hero_band": "poster.hero_band",
      "evidence_columns": "poster.evidence_columns",
      "pathway_strip": "poster.pathway_strip",
      "action_footer": "poster.action_footer",
      "default": "poster.evidence_columns"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "每页必须是 audience-facing 成品，不得把内部提示或模板信息写进画面",
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
