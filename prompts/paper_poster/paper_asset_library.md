# paper_poster / paper_asset_library

academic poster 的 Source Readiness 不是通用 brief 扩写，而是 paper-aware asset library 建模。
要求：
- 输入必须围绕 paper / figures / tables / citations / affiliations / venue_metadata 组织
- 不允许退回 knowledge-poster 的 hero/proof/pathway/cta seed
- 不允许把 narrative copy 当成最终输出；必须先沉淀 machine-readable 资产库
- 必须显式记录 source_gap / missing_asset / rights_or_reuse_notes

## required_output
- `paper_identity`
- `paper_summary`
- `claims`
- `figures`
- `tables`
- `citations`
- `affiliations`
- `venue_metadata`
- `source_gaps`

## runtime_seed
```json
{
  "paper_asset_library": {
    "paper_identity": {
      "paper_id": "{{paper_id}}",
      "title": "{{paper_title}}",
      "authors": ["{{author_1}}"],
      "venue_metadata": {
        "venue_name": "{{venue_name}}",
        "year": "{{venue_year}}",
        "session": "{{venue_session}}"
      }
    },
    "paper_summary": {
      "research_question": "{{research_question}}",
      "core_claim": "{{core_claim}}",
      "evidence_scope": "{{evidence_scope}}"
    },
    "figures": [
      {
        "figure_id": "fig-1",
        "claim_links": ["claim-1"],
        "caption_source": "{{figure_caption}}",
        "reproduction_notes": "{{figure_reuse_note}}"
      }
    ],
    "tables": [],
    "citations": [
      {
        "citation_id": "cite-1",
        "label": "{{citation_label}}",
        "claim_links": ["claim-1"]
      }
    ],
    "affiliations": [
      {
        "author": "{{author_1}}",
        "institution": "{{institution_1}}"
      }
    ],
    "venue_metadata": {
      "poster_profile": "conference_poster",
      "venue_name": "{{venue_name}}",
      "submission_constraints": ["{{constraint_1}}"]
    },
    "source_gaps": []
  }
}
```
