# xiaohongshu / render_html

将单篇策划与视觉导演稿正式落成 HTML。
要求：
- 3:4 画幅，无滚动，无外链图片
- slidesData 每页独立 content
- 不允许模板化渲染或历史成品拼装
- 每页至少提供 2 个语义化 `data-qa-block`，并至少标记 1 个 `data-primary-point="true"`，供截图质控读取
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 需要输出 HTML 生成说明与同构门禁留痕
- 版式与文案必须由 AI 直接创作，shell 只负责装配、审阅与持久化边界
- 生成的 audience-facing HTML 必须被视为当前 `authored_markup_registry` 的唯一合法来源；不得把 registry、模板名或内部制作痕迹写进画面

## runtime_seed
```json
{
  "render_contract": {
    "render_strategy": "prompt_director_first",
    "shell_file": "render_shell.html",
    "recipe_registry": {
      "cover_note": "xhs.hero_note",
      "myth_compare": "xhs.split_contrast",
      "sequence_stack": "xhs.staggered_steps",
      "process_track": "xhs.track_rail",
      "evidence_strip": "xhs.evidence_bands",
      "action_checklist": "xhs.checklist_close",
      "default": "xhs.annotated_cards"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "每页必须是 audience-facing 成品页，不得把内部提示、制作流程、模板注册表写进画面",
      "最终 audience-facing HTML 是当前 authored_markup_registry 的唯一合法来源；不得把 registry 名称、模板名或内部制作痕迹写进画面",
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
    "authored_markup_registry": {
      "xhs.hero_note": "slidesData[*].content",
      "xhs.split_contrast": "slidesData[*].content",
      "xhs.staggered_steps": "slidesData[*].content",
      "xhs.track_rail": "slidesData[*].content",
      "xhs.evidence_bands": "slidesData[*].content",
      "xhs.checklist_close": "slidesData[*].content",
      "xhs.annotated_cards": "slidesData[*].content"
    },
    "required_review_contract": [
      "slide_root",
      "data-qa-block",
      "data-primary-point"
    ],
    "creative_authorship": "ai_first"
  }
}
```
