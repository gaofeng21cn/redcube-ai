# paper_poster / poster_storyboard

academic poster 的 Story Architecture 必须从论文主张与证据映射展开，而不是 knowledge poster 的单页导览脚本。
要求：
- 上游输入必须引用 `paper_asset_library`
- 输出必须围绕 claims / figures / tables / citations / affiliations / venue_metadata 组织 poster 叙事
- 必须显式给出 scan_path_clarity 与 figure_claim_alignment 的叙事依据
- 不允许直接跳成 final markup，不允许写成 slot_hydration_only

## required_output
- `poster_goal`
- `story_arc`
- `claim_ladder`
- `panel_intents`
- `figure_usage_plan`
- `citation_visibility_plan`
- `affiliation_placement_note`
- `story_gaps`

## runtime_seed
```json
{
  "poster_storyboard": {
    "poster_goal": "{{poster_goal}}",
    "story_arc": [
      "problem",
      "method",
      "result",
      "implication"
    ],
    "claim_ladder": [
      {
        "claim_id": "claim-1",
        "statement": "{{core_claim}}",
        "backing_figures": ["fig-1"],
        "backing_tables": [],
        "backing_citations": ["cite-1"]
      }
    ],
    "panel_intents": [
      {
        "panel_id": "context",
        "intent": "解释研究问题与受众进入点",
        "required_assets": ["claim-1", "cite-1"]
      },
      {
        "panel_id": "evidence",
        "intent": "展示 figures / tables 与 figure_claim_alignment",
        "required_assets": ["fig-1"]
      }
    ],
    "figure_usage_plan": [
      {
        "figure_id": "fig-1",
        "priority": "primary",
        "reason": "supports {{core_claim}}"
      }
    ],
    "citation_visibility_plan": "所有 claims 必须有 citations，且不被缩到不可读。",
    "affiliation_placement_note": "作者 affiliations 与 venue_metadata 必须可见。",
    "story_gaps": []
  }
}
```
