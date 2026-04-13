# ppt_deck / visual_director_review

视觉总监复盘是 screenshot_review 前的正式 overlay。
要求：
- 判断导演意图、峰值页、节奏与反模板化是否落地
- 检查标题带、导语区与主体结构是否分区清楚；若主体白板、轨道或标签侵入 header 入口，必须计为弱页
- 检查 foundation / substrate / base band 是否压住正文、说明卡片、讲者信息或封面辅助卡；凡出现底边裁断或基座压字，必须计为弱页
- 检查所有带字元素是否拥有独立留白；若 badge、航线节点、callout、图内节点或底部说明彼此压字，必须计为弱页
- 若同一页面家族重复出现，检查后续页是否真正切换了首眼信号、构图重心或风险张力；若只是上一页的弱化复写，必须计为弱页
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
