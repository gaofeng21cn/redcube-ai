# xiaohongshu / render_html

将单篇策划与视觉导演稿正式落成 HTML。
要求：
- 3:4 画幅，无滚动，无外链图片
- slidesData 每页独立 content
- 不允许模板化渲染或历史成品拼装
- 需要输出 HTML 生成说明与同构门禁留痕

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
    "template_registry": {
      "xhs.hero_note": "render-templates/xhs.hero_note.html",
      "xhs.split_contrast": "render-templates/xhs.split_contrast.html",
      "xhs.staggered_steps": "render-templates/xhs.staggered_steps.html",
      "xhs.track_rail": "render-templates/xhs.track_rail.html",
      "xhs.evidence_bands": "render-templates/xhs.evidence_bands.html",
      "xhs.checklist_close": "render-templates/xhs.checklist_close.html",
      "xhs.annotated_cards": "render-templates/xhs.annotated_cards.html"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "在每页根节点写入 recipe_id / peak_page / director_role"
    ]
  }
}
```
