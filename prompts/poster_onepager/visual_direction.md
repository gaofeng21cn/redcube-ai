# poster_onepager / visual_direction

视觉导演稿必须把单页海报的注意力路径讲清。
## AI-first 视觉导演合同

- 必须基于当前 `poster_blueprint.panels` 的真实区域、真实 panel 内容与海报目标生成视觉导演稿。
- `peak_region` 必须从当前 blueprint 的 panel region 中选择；不得默认写成 `hero_band`。
- `panel_emphasis` 和 `page_family_ceiling` 必须围绕当前 blueprint 的实际 panel region 生成；不得固定成 hero/evidence/pathway/action_footer 四段。
- 不得把 `runtime_seed` 或输出 schema 中的占位值当成默认视觉方向。

要求：
- 必须显式包含 visual_manifest / poster_motif / peak_region / panel_emphasis / anti_template_constraints
- 不允许退化成统一营销海报模板
- 不允许把来源和行动按钮藏成脚注
- 必须定义 headline、证据区、路径区、行动区或当前 blueprint 实际 panel 之间的相邻可读块安全间距；视觉贴住按失败处理

## runtime_seed

下列 JSON 只说明字段形状，不提供固定四段阅读路径、固定峰值区或固定区域配额。

```json
{
  "visual_direction": {
    "visual_manifest": "<AI-authored visual thesis for the current poster_blueprint>",
    "poster_motif": "<AI-authored poster motif>",
    "peak_region": "<region from current poster_blueprint.panels>",
    "panel_emphasis": {
      "<region from current poster_blueprint.panels>": "<AI-authored emphasis for that panel>"
    },
    "page_family_ceiling": {
      "<region from current poster_blueprint.panels>": "<AI-authored reuse ceiling>"
    },
    "anti_template_constraints": [
      "<AI-authored anti-template constraint>",
      "<AI-authored anti-template constraint>"
    ],
    "forbidden_regressions": [
      "<AI-authored forbidden regression>",
      "<AI-authored forbidden regression>"
    ],
    "final_instruction_to_html_generator": [
      "保持 4:5 单页画幅，不允许滚动",
      "<AI-authored instruction for render_html>",
      "<AI-authored instruction for render_html>"
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
