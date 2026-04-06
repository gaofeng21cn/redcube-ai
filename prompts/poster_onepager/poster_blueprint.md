# poster_onepager / poster_blueprint

单页海报 blueprint 是正式 Story Architecture stage。
要求：
- 明确 headline / subheadline / render_recipe_id / panels / anchor_tracks
- 每个 panel 必须给出 region / label / text / support_points
- 不允许只留模糊区块名，不允许把 visual_direction 混进同一段描述

## runtime_seed
```json
{
  "poster_blueprint": {
    "render_recipe_id": "poster.evidence_columns",
    "headline": "{{headline}}",
    "subheadline": "{{subheadline}}",
    "panels": [
      {
        "panel_id": "hero",
        "region": "hero_band",
        "label": "先看这句",
        "text": "{{headline}}",
        "support_points": [
          "{{why_now}}",
          "读者真正要判断的是：{{audience_judgement}}"
        ]
      },
      {
        "panel_id": "proof",
        "region": "evidence_columns",
        "label": "为什么可信",
        "text": "{{proof_promise}}",
        "support_points": [
          "公开来源 1：{{source_label_1}}",
          "公开来源 2：{{source_label_2}}"
        ]
      },
      {
        "panel_id": "pathway",
        "region": "pathway_strip",
        "label": "怎么照着做",
        "text": "先读 headline，再看证据，再执行动作。",
        "support_points": [
          "动作 1：先确认当前问题是不是这张海报要解决的事",
          "动作 2：再看公开来源给出的边界",
          "动作 3：最后执行一个最小动作"
        ]
      },
      {
        "panel_id": "cta",
        "region": "action_footer",
        "label": "带走的动作",
        "text": "{{call_to_action}}",
        "support_points": [
          "把这张图保存下来",
          "需要时按同一顺序复核"
        ]
      }
    ],
    "anchor_tracks": [
      "hero-band",
      "evidence-columns",
      "pathway-strip",
      "action-footer"
    ]
  }
}
```
