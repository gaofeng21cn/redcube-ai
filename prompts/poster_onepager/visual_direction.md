# poster_onepager / visual_direction

视觉导演稿必须把单页海报的注意力路径讲清。
要求：
- 必须显式包含 visual_manifest / poster_motif / peak_region / panel_emphasis / anti_template_constraints
- 不允许退化成统一营销海报模板
- 不允许把来源和行动按钮藏成脚注

## runtime_seed
```json
{
  "visual_direction": {
    "visual_manifest": "单页海报采用浅底高对比、明显阅读顺序、证据与动作同屏的门诊说明感",
    "poster_motif": "米白纸底 + 深蓝结构线 + 橙色重点提示 + 证据标签芯片",
    "peak_region": "hero_band",
    "panel_emphasis": {
      "hero_band": "最大层级，先让读者停下来",
      "evidence_columns": "中段用双列证据建立可信度",
      "pathway_strip": "下段用步骤条带给出顺序",
      "action_footer": "底部收束成可以照做的一句话"
    },
    "page_family_ceiling": {
      "hero_band": 1,
      "evidence_columns": 1,
      "pathway_strip": 1,
      "action_footer": 1
    },
    "anti_template_constraints": [
      "headline 区必须与证据区首眼差异明显",
      "不能退化成四个同构卡片盒子",
      "行动区必须像结论，不是补充说明"
    ],
    "forbidden_regressions": [
      "统一安全模板海报",
      "只讲口号不讲证据",
      "只讲证据不讲动作",
      "像历史素材拼贴页"
    ],
    "final_instruction_to_html_generator": [
      "保持 4:5 单页画幅，不允许滚动",
      "headline、证据、动作三段必须形成显式层级",
      "来源标签与行动句必须同屏可见"
    ],
    "palette": {
      "paper": "#FFF9F1",
      "ink": "#0F172A",
      "accent": "#1D4ED8",
      "highlight": "#F97316"
    }
  }
}
```
