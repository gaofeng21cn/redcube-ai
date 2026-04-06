# ppt_deck / render_html

目标：基于 slide_blueprint + visual_direction 生成单文件 HTML deck。

必须保留：
- #slide-display-area
- #prev-btn
- #next-btn
- slidesData = [{ content: `...` }]

硬约束：
- 没有 visual_direction 不得继续
- 每页在 slidesData 中独立 content
- 16:9 / 1152x648 / 无滚动 / 无明显溢出
- 禁止 renderSlide / layoutByType / cardsGrid / pageType
- 必须落实视觉导演稿中的节奏曲线、峰值页、页面家族上限、禁退化语法
- 复杂结构页必须显式网格 / 轨道 / 锚点
- final HTML markup 必须来自 prompt-pack authored markup artifact，代码只负责 slot hydration

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
      "在每页根节点写入 recipe_id / peak_page / director_role"
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
      "ppt.hero_signal": "render-artifacts/ppt.hero_signal.html",
      "ppt.compare_zones": "render-artifacts/ppt.compare_zones.html",
      "ppt.timeline_rail": "render-artifacts/ppt.timeline_rail.html",
      "ppt.judgement_ladder": "render-artifacts/ppt.judgement_ladder.html",
      "ppt.ring_cross": "render-artifacts/ppt.ring_cross.html",
      "ppt.central_axis": "render-artifacts/ppt.central_axis.html",
      "ppt.summary_peak": "render-artifacts/ppt.summary_peak.html"
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
