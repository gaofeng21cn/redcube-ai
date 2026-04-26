# poster_onepager / poster_blueprint

单页海报 blueprint 是正式 Story Architecture stage。

## AI-first 蓝图合同

- 明确 `headline` / `subheadline` / `render_recipe_id` / `panels` / `anchor_tracks`。
- 每个 panel 必须给出 `region` / `label` / `text` / `support_points`。
- 不允许只留模糊区块名，不允许把 visual_direction 混进同一段描述。
- 必须根据 storyline、`source_materials_full_text` 和海报目标自行组织 panel；不得复制本 prompt 的占位语言或固定 hero/proof/pathway/cta 文案。

## runtime_seed

下列 JSON 只说明字段形状，不提供固定四段故事、固定行动清单或默认运营话术。

```json
{
  "poster_blueprint": {
    "render_recipe_id": "poster.<allowed_recipe_id>",
    "headline": "<AI-authored headline from storyline>",
    "subheadline": "<AI-authored subheadline from storyline>",
    "panels": [
      {
        "panel_id": "<stable panel id>",
        "region": "<hero_band | evidence_columns | pathway_strip | action_footer | AI-authored region>",
        "label": "<audience-facing panel label>",
        "text": "<audience-facing panel text grounded in source_materials_full_text>",
        "support_points": [
          "<source-backed support point>",
          "<source-backed support point>"
        ]
      }
    ],
    "anchor_tracks": [
      "<visual anchor track>",
      "<visual anchor track>",
      "<visual anchor track>"
    ]
  }
}
```
