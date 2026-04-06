# paper_poster / render_bundle

academic poster 的 render_bundle 是 render-stage artifact manifest，不是 knowledge poster 的 slot-only HTML 兜底。
要求：
- 输入必须消费 `layout_plan`、`poster_storyboard`、`paper_asset_library`
- 输出必须显式保留 figures / tables / citations / affiliations / venue_metadata 的可追溯关系
- 必须显式说明 far_view_readability、citation_visibility、print_export_safe 的落地结果
- 不允许生成 hero/proof/pathway/cta seed，不允许回退 slot_hydration_only

## required_output
- `render_targets`
- `asset_manifest`
- `figure_bindings`
- `citation_bindings`
- `affiliation_bindings`
- `venue_metadata_bindings`
- `quality_assertions`
- `handoff_notes`

## runtime_seed
```json
{
  "render_bundle": {
    "render_targets": [
      "poster_html",
      "poster_png",
      "poster_pdf"
    ],
    "asset_manifest": {
      "figures": ["fig-1"],
      "tables": [],
      "citations": ["cite-1"],
      "affiliations": ["institution-1"],
      "venue_metadata": ["venue_name", "venue_year"]
    },
    "figure_bindings": [
      {
        "figure_id": "fig-1",
        "layout_region": "center_primary",
        "caption_zone": "caption-1"
      }
    ],
    "citation_bindings": [
      {
        "citation_id": "cite-1",
        "visibility": "visible_in_caption_or_reference_zone"
      }
    ],
    "affiliation_bindings": [
      {
        "institution": "{{institution_1}}",
        "region": "top_right"
      }
    ],
    "venue_metadata_bindings": [
      {
        "field": "venue_name",
        "region": "top_band"
      }
    ],
    "quality_assertions": {
      "far_view_readability": true,
      "citation_visibility": true,
      "print_export_safe": true
    },
    "handoff_notes": [
      "ready_for_future_visual_director_review",
      "ready_for_future_screenshot_review"
    ]
  }
}
```
