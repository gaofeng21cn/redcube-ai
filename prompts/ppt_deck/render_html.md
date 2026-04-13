# ppt_deck / render_html

目标：基于 slide_blueprint + visual_direction 生成单文件 HTML deck。

作用域规则：
- 若 `context.render_scope = "slide_batch"`，只输出当前 batch 对应的 slides，不要补写其他页面
- 若 `context.render_scope = "summary"`，只输出 `render_summary`，不要重复生成整页 HTML

必须保留：
- #slide-display-area
- #prev-btn
- #next-btn
- slidesData = [{ content: `...` }]

硬约束：
- 没有 visual_direction 不得继续
- 每页在 slidesData 中独立 content
- 16:9 / 1152x648 / 无滚动 / 无明显溢出
- 每页必须保留至少 2 个语义化 `data-qa-block`，并至少标记 1 个 `data-primary-point="true"`，供截图质控读取
- 标题区与导语区必须形成独立 header safe zone；主体白板、轨道、横带、标签和大型结构不得侵入首屏阅读入口
- 若使用导语句，它必须完整留在标题区内；不要让浅色导语穿过主体面板顶部，也不要让主体面板压住导语
- `foundation / substrate / base band` 只承担结构基座，不得压住正文、说明卡片、讲者信息或封面辅助卡；所有可读内容都必须完整留在页边界内
- 任何带字元素都必须拥有独立留白：标签、badge、航线节点、callout、段落、底部说明和图内节点不得彼此遮挡，也不得跨压导航轨道或解释段
- 若同一页面家族重复出现，后续页面必须切换首眼信号、构图重心或风险张力，不能只是上一页的弱化复写
- 对封面/控制舱页，主舱说明文与右侧辅助卡必须完整留在可读区；不允许出现底部裁断或说明文被 foundation 条带挤压
- 对风险/审计推进页，禁止旁路或风险截断必须做成第一眼可判的粗短高对比信号，不能退化成细线点缀
- 对 `audit_tension` / `timeline_band` 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图
- 若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带
- 若某页 blueprint 附带 `revision_focus`，必须把它当作该页的硬重画 brief；`recommended_fix` 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体
- 风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数
- 若已有上一轮通过的 `render_html` 产物，且 `revision_context` 只点名部分 blocked slides，则只重画这些页面；其余通过页应原样复用，不要为了“顺手统一”重新发明
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 禁止 renderSlide / layoutByType / cardsGrid / pageType
- 必须落实视觉导演稿中的节奏曲线、峰值页、页面家族上限、禁退化语法
- 复杂结构页必须显式网格 / 轨道 / 锚点
- 若上下文提供 `revision_context`，必须优先修复其中点名的 blocked slides、遮挡/裁切与最弱页问题；不要无视上一轮审稿意见原样重画
- 若封面页 blueprint 已给出具名讲者署名，要把它当成正式封面信息排版，而不是系统注释
- final HTML markup 必须由 AI 直接创作；runtime 只负责 shell 边界、审阅契约与持久化，不得退回模板编译

## runtime_seed
```json
{
  "render_contract": {
    "render_strategy": "prompt_director_first",
    "shell_file": "render_shell.html",
    "recipe_registry": {
      "cover_hero": "ppt.hero_signal",
      "multi_zone_compare": "ppt.compare_zones",
      "timeline_band": "ppt.timeline_rail",
      "judgement_ladder": "ppt.judgement_ladder",
      "ring_cross": "ppt.ring_cross",
      "central_axis": "ppt.central_axis",
      "summary_peak": "ppt.summary_peak",
      "default": "ppt.compare_zones"
    },
    "shell_guards": [
      "保留 slide-display-area / prev-btn / next-btn / slidesData",
      "输出 render plan 供 review 与审计读取",
      "每页必须是 audience-facing 成品页，不得把内部提示、制作流程、模板注册表写进画面",
      "标题区与导语区必须形成独立安全带；主体结构不得侵入 header 入口",
      "foundation / substrate / base band 只承担结构基座，不得压住正文或辅助卡；所有可读内容都必须完整留在页边界内",
      "任何带字元素都必须拥有独立留白，不得彼此遮挡，也不得跨压导航轨道或解释段",
      "同一家族重复页必须切换首眼信号或构图张力，不能只是上一页的弱化复写",
      "对 audit_tension / timeline_band 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图",
      "若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带",
      "若某页 blueprint 附带 revision_focus，必须把它当作该页的硬重画 brief；recommended_fix 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体",
      "风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数",
      "若已有上一轮通过的 render_html 产物，且 revision_context 只点名部分 blocked slides，则只重画这些页面；其余通过页应原样复用，不要为了顺手统一重新发明",
      "禁止输出 <script> / <style> block；如需视觉样式，直接写 inline style",
      "审阅依赖的根节点 metadata 由 runtime 注入，但 AI 仍需交付 review-ready 的 data-qa-block / data-primary-point 结构"
    ]
  }
}
```

## runtime_artifact
```json
{
  "render_markup_artifact": {
    "artifact_surface": "codex_cli_json_output",
    "binding_model": "slides_data_shell_only",
    "required_review_contract": [
      "slide_root",
      "data-qa-block",
      "data-primary-point"
    ],
    "creative_authorship": "ai_first"
  }
}
```
