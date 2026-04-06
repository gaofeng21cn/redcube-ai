# ppt_deck / visual_director_review

视觉总监复盘是 screenshot_review 前的正式 overlay。
要求：
- 判断导演意图、峰值页、节奏与反模板化是否落地
- 明确 weak_pages / homogeneous_layout_risk / rewrite_action
- judgment 主语必须是 host-agent / director-first，不允许 deterministic heuristic 冒充导演审片

## runtime_seed
```json
{
  "visual_director_review": {
    "director_intent_landed": true,
    "anti_template_ok": true,
    "memory_hook_present": true,
    "homogeneous_layout_risk": 0.22,
    "weak_pages": [],
    "rewrite_action": "none",
    "review_summary": "导演意图、峰值页与反模板化约束已在当前 deck 中显式落地。"
  }
}
```
