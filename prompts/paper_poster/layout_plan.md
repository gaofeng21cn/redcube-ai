# paper_poster / layout_plan

academic poster 的 Visual Authorship 必须由 storyboard + paper assets 驱动，而不是 knowledge poster 的固定 seed layout。
要求：
- 输入必须消费 `poster_storyboard` 与 `paper_asset_library`
- 输出必须显式覆盖 far_view_readability / scan_path_clarity / citation_visibility / print_export_safe
- 必须给出 figure 区域、caption 区域、citation 区域、affiliation / venue_metadata 区域
- 不允许使用 hero/proof/pathway/cta，也不允许退回 slot_hydration_only

## required_output
- `canvas`
- `panel_grid`
- `scan_path`
- `figure_zones`
- `caption_zones`
- `citation_zones`
- `affiliation_zone`
- `venue_metadata_zone`
- `print_export_safe`
- `layout_risks`

## runtime_seed
```json
{
  "layout_plan": {
    "canvas": {
      "format": "conference_poster",
      "orientation": "landscape_or_venue_defined",
      "far_view_readability": "headline_and_key_claim_readable_from_distance"
    },
    "panel_grid": [
      {
        "panel_id": "context",
        "region": "top_left",
        "supports_claims": ["claim-1"]
      },
      {
        "panel_id": "evidence",
        "region": "center",
        "supports_figures": ["fig-1"]
      }
    ],
    "scan_path": {
      "scan_path_clarity": "left_to_right_then_top_to_bottom",
      "entry_point": "research_question",
      "exit_point": "implication_and_contact"
    },
    "figure_zones": [
      {
        "figure_id": "fig-1",
        "region": "center_primary",
        "caption_zone": "caption-1"
      }
    ],
    "caption_zones": [
      {
        "caption_id": "caption-1",
        "citation_visibility": "adjacent_to_figure_and_readable"
      }
    ],
    "citation_zones": [
      {
        "zone_id": "references",
        "region": "bottom_right"
      }
    ],
    "affiliation_zone": "top_right",
    "venue_metadata_zone": "top_band",
    "print_export_safe": {
      "bleed_safe": true,
      "font_floor": "venue_defined_minimum"
    },
    "layout_risks": []
  }
}
```
