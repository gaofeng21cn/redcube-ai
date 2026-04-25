# ppt_deck / visual_director_review

视觉总监复盘是 screenshot_review 前的正式 overlay。
要求：
- 判断导演意图、峰值页、节奏与反模板化是否落地
- 检查标题带、导语区与主体结构是否分区清楚；若主体白板、轨道或标签侵入 header 入口，必须计为弱页
- 检查 foundation / substrate / base band 是否压住正文、说明卡片、讲者信息或封面辅助卡；凡出现底边裁断或基座压字，必须计为弱页
- 检查所有带字元素是否拥有独立留白；若 badge、航线节点、callout、图内节点或底部说明彼此压字，必须计为弱页
- 检查页面纵向信息分布是否均衡；若主要文字与主结构长期堆在中段、底部只剩薄条或大块空白，必须计为弱页
- 对 `multi_zone_compare` 的“左拆右并”页面，检查左侧辅助区是否明显轻于右侧主峰区；若读感接近等权双栏，也必须计为弱页
- 检查页码语法是否跨页一致；若个别页单独切换页码样式并打断整套连续性，也必须计为弱页
- 若同一页面家族重复出现，检查后续页是否真正切换了首眼信号、构图重心或风险张力；若只是上一页的弱化复写，必须计为弱页
- 若读者可见 HTML 泄漏“当前节点 / 下一步进入 / 制作目标 / operator / internal / prompt”等制作者层文案，必须计为弱页并 block
- 若连续页面退化为同构白色卡片或白色父面板堆叠，必须将 anti_template_ok 判为 false，并要求回到 render_html
- 对 `audit_tension` / `timeline_band` 的第二段推进页，检查 controller 是否保持唯一主峰；若红色风险支路膨胀成第二主图，必须计为弱页
- 检查风险/审计推进页底部说明是否最多保留 2 块；若底部说明带堆成三块以上并压扁主图留白，必须计为弱页
- 若上一轮 `recommended_fix` 已明确要求删减、收短、并入或合并某元素，但重绘后仍保留同样抢眼的等价变体，也必须计为弱页
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
