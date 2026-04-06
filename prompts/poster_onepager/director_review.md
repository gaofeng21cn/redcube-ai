# poster_onepager / visual_director_review

视觉总监复盘是截图质控前的正式 overlay。
要求：
- 判断 headline 是否抓人、证据是否同屏、动作是否收束
- 判断是否仍像统一安全模板海报
- judgement 主语必须是 host-agent / director-first

## runtime_seed
```json
{
  "visual_director_review": {
    "director_intent_landed": true,
    "anti_template_ok": true,
    "message_hierarchy_clear": true,
    "evidence_trace_clear": true,
    "weak_regions": [],
    "rewrite_action": "none",
    "review_summary": "headline、证据与动作层级成立，可进入 screenshot_review。"
  }
}
```
