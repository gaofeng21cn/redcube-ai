# poster_onepager / render_html

将 poster_blueprint 与 visual_direction 落成单页 HTML 海报。
要求：
- 4:5 / 1080x1350 / 无滚动
- final markup authorship 必须来自 prompt-pack authored markup artifact
- 代码只负责 shell boundary、slot hydration、artifact persistence
- 必须把 headline / 证据 / 动作同屏表达清楚

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
      "根节点写入 recipe_id / director_role / peak_region"
    ]
  }
}
```

## runtime_artifact
```json
{
  "render_markup_artifact": {
    "artifact_surface": "prompt_pack_artifact",
    "binding_model": "slot_hydration_only",
    "authored_markup_registry": {
      "poster.hero_band": "render-artifacts/poster.hero_band.html",
      "poster.evidence_columns": "render-artifacts/poster.evidence_columns.html",
      "poster.pathway_strip": "render-artifacts/poster.pathway_strip.html",
      "poster.action_footer": "render-artifacts/poster.action_footer.html"
    },
    "allowed_shell_bindings": [
      "metadata_attrs",
      "display_gates",
      "text_slots",
      "source_slots"
    ]
  }
}
```
