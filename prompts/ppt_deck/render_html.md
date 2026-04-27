# ppt_deck / render_html

目标：基于 slide_blueprint + visual_direction 生成单文件 HTML deck。

作用域规则：
- 若 `context.render_scope = "slide_batch"`，只输出当前 batch 对应的 slides，不要补写其他页面
- 若 `context.render_scope = "summary"`，只输出 `render_summary`，不要重复生成整页 HTML
- 若 `context.reference_slides` 非空，只把其中的 `slide_identity`、`source_html_hash` 与 `visual_summary` 当成同一 deck 的连续风格锚点；后续页面只能继承 style tokens、typography、palette、spacing、卡片尺度与标题节奏，不得继承参考页布局结构

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
- 所有读者可见文字都必须被最近的语义化 `data-qa-block` 覆盖；底部说明、图注、讲者信息、badge、节点说明和图标旁短句都算可审计正文
- 标题区与导语区必须形成独立 header safe zone；主体白板、轨道、横带、标签和大型结构不得侵入首屏阅读入口
- 若使用导语句，它必须完整留在标题区内；不要让浅色导语穿过主体面板顶部，也不要让主体面板压住导语
- `foundation / substrate / base band` 只承担结构基座，不得压住正文、说明卡片、讲者信息或封面辅助卡；所有可读内容都必须完整留在页边界内
- 任何带字元素都必须拥有独立留白：标签、badge、航线节点、callout、段落、底部说明和图内节点不得彼此遮挡，也不得跨压导航轨道或解释段
- 若一页存在“大框里套多张子卡”的成组结构，这个大框必须做成显式父容器并挂 `data-qa-block`；子卡全部收在父容器内，四周保留稳定内边距，不能有卡片戳出组块边界
- 若同一页面家族重复出现，后续页面必须切换首眼信号、构图重心或风险张力，不能只是上一页的弱化复写
- 对封面/控制舱页，主舱说明文与右侧辅助卡必须完整留在可读区；不允许出现底部裁断或说明文被 foundation 条带挤压
- 对风险/审计推进页，禁止旁路或风险截断必须做成第一眼可判的粗短高对比信号，不能退化成细线点缀
- 对 `audit_tension` / `timeline_band` 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图
- 若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带
- 若某页 blueprint 附带 `revision_focus`，必须把它当作该页的硬重画 brief；`recommended_fix` 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体
- 正文页主标题字号必须在整套 deck 中保持一致；除封面外，不允许第 4 页、第 6 页这类个别页突然缩小标题来硬塞内容
- S02-S09 正文页标题默认按同一视觉档位排版；优先统一到同一字号并通过自然换行腾挪空间，不要用 32px / 36px 这类临时缩字去回避布局问题
- 连接线、时间线、轨道线必须放在节点徽标、数字圆点与 badge 的下层；不允许线条压在数字或关键词前景上
- render shell 已加载 Font Awesome Free；PPT 默认使用 Font Awesome Free 图标，只有确有必要才使用 emoji，且同一页锚点语法必须一致
- 视觉锚点必须语义明确；禁止用孤立单字贴纸、无意义角标或疑似内部标签充当页面抓手
- 中文讲课页默认中文优先表达；除 contract / review state / publish surface 等必要术语外，不要无意义中英混用
- 所有正文、标签、节点和卡片文案都必须在自然语义处换行；如果空间不足，优先减字和重排，不要让文字溢出、被截断或硬挤成一行
- 中文短术语和核心词组必须完整阅读；不得把“科研路径”“质量边界”“署名责任”“可审查”“医生监督”“垂体功能减退”“术后垂体功能减退”“持续性术后垂体功能减退”“随机森林”“校准斜率”“阈值区间”“净获益”等词拆成单字尾行。空间不足时用更短文案、更宽容器、语义换行，或用 inline-block/word-break: keep-all 保护短词
- 页面纵向信息分布必须均衡；不要把标题以下的大部分信息都堆在中段，而让底部只剩薄条或大块空白
- 若中段已经承载主峰卡、节点链和对照信息，必须让底部继续承担总结、收束或结构支撑；底部 summary 区不能退化成装饰性细条
- 对 `multi_zone_compare` 的“左拆右并”页面，左侧辅助区必须明显窄于、轻于右侧主峰区；不要把左侧做成接近等权的大面板，否则会退化成保守双栏
- 页码语法必须整套一致；不要让个别页面突然从简洁两位页码切成“当前页 / 总页数”，或反过来
- 每个独立可读的主卡片、判断块、总结卡或底部带走点，优先单独挂 `data-qa-block`，让截图审计能直接检查其留白与贴边风险
- `ring_cross` 的中心圆/中心节点、四向卡片、底部结论卡，以及 `timeline_band` 的每张模型/节点卡，只要承载读者可见文字，都必须作为独立可审计 surface，优先单独挂 `data-qa-block`；不能只给外层大组块挂一个 `data-qa-block` 后让内部卡片互相遮挡或溢出
- 相邻读者可见 `data-qa-block`、导语、主卡、步骤卡、总结卡和底部说明之间必须保留至少 6px 可见安全间距；视觉贴住、边缘几乎相接、标题区贴住主体都算失败
- 父容器、组块边框、轨道框或虚线框一旦出现，就要承担真实收纳责任；不能只画一个框，再把子卡悬到框外
- 风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数
- 若已有上一轮通过的 `render_html` 产物，且 `revision_context` 只点名部分 blocked slides，则只重画这些页面；其余通过页应原样复用，不要为了“顺手统一”重新发明
- 必须遵守 `context.deck_style_reference.typography_plan` 这套整 deck 字号梯度；封面可单独更大，但 S02-S09 的标题、卡片标题、卡片正文、标签、页码都要落在同一档位体系里
- 若标题或短句在当前字号梯度下本来可以单行成立，就禁止为了造型主动插入 `<br/>`；无必要的两行标题、短词组硬断开都算失败
- 短中文词组必须在自然语义处换行；像“推进中 / 被偷换”“正式主链 / 不靠聪明捷径”这种本可单行或应整体保留的短句，不要人为拆断
- 对 `ring_cross` / 四向围绕中心的骨架页，中心与上下左右卡片的距离必须近似等距；禁止出现上方明显更贴、中间明显偏移的失衡构图
- 对 `ring_cross`，中心圆/中心节点与任何论文卡片、结论卡片必须保留至少 8px 可见间距；圆形节点与下方卡片接触、压入或重叠都算失败
- 对 `judgement_ladder` / `timeline_band`，若卡片内容放不下，优先减字、扩卡或重排，不要靠手插 `<br/>` 把句子拆坏；重复回修仍不过时，必须删除或合并次级说明句/芯片，不能保留同等长度的等价文案
- 对 `timeline_band` 的卡片，固定高度内必须满足 `scrollHeight <= clientHeight`；不能用 `overflow: visible`、芯片堆叠或异常换行把内容挤出左右卡片
- 禁止输出 `<script>` / `<style>` block；样式只能写在元素 inline style 上
- 禁止 renderSlide / layoutByType / cardsGrid / pageType
- 必须落实视觉导演稿中的节奏曲线、峰值页、页面家族上限、禁退化语法
- 复杂结构页必须显式网格 / 轨道 / 锚点
- 若上下文提供 `revision_context`，必须优先修复其中点名的 blocked slides、遮挡/裁切与最弱页问题；不要无视上一轮审稿意见原样重画
- 若封面页 blueprint 已给出具名讲者署名，要把它当成正式封面信息排版，而不是系统注释
- 若 blueprint slide 提供 `evidence_points`，这些是读者可见的证据点，不是来源元数据；主要结果页必须把其中的关键数字渲染成数据芯片、证据条、表格单元或图示标签，不能在 HTML 中丢掉
- 如果 `content_density_contract.purpose = manuscript_submission_sync`，每篇论文的结果页必须可见呈现对应 `manuscript_evidence_table` / `evidence_points` 中的关键数字；不能把 AUROC、Brier、校准、事件率、风险梯度、Knosp 分布等退化成抽象描述
- final HTML markup 必须由 AI 直接创作；runtime 只负责 shell 边界、审阅契约与持久化，不得退回模板编译
- 生成的 audience-facing HTML 必须被视为当前 `authored_markup_registry` 的唯一合法来源；不得把 registry、模板名或内部制作痕迹写进画面
- 必须遵守 `audience_visibility_contract`：`speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks`、`operator_playbook`、`operator_playbook_full_text`、`revision_context`、`source_id`、`material_id` 都是作者/系统工作面，不得出现在任何听众可见标题、正文、页脚、badge、图注或卡片中
- 若源材料或 contract title/goal 中带有内部管理编号、项目编号或 source/material ID，但用户给出了对外汇报口径，HTML 只能使用对外标签；内部编号不能作为页面标题、页内 badge 或正文说明
- 不要把“建议怎么讲”“可发表表达”“待确认的写作口径”“讲稿备忘录”渲染成给听众看的正文；这些内容只允许作为讲者备注或被改写为明确的研究边界/团队确认项

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
      "最终 audience-facing HTML 是当前 authored_markup_registry 的唯一合法来源；不得把 registry 名称、模板名或内部制作痕迹写进画面",
      "标题区与导语区必须形成独立安全带；主体结构不得侵入 header 入口",
      "foundation / substrate / base band 只承担结构基座，不得压住正文或辅助卡；所有可读内容都必须完整留在页边界内",
      "任何带字元素都必须拥有独立留白，不得彼此遮挡，也不得跨压导航轨道或解释段",
      "同一家族重复页必须切换首眼信号或构图张力，不能只是上一页的弱化复写",
      "对 audit_tension / timeline_band 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图",
      "若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带",
      "若某页 blueprint 附带 revision_focus，必须把它当作该页的硬重画 brief；recommended_fix 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体",
      "风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数",
      "若已有上一轮通过的 render_html 产物，且 revision_context 只点名部分 blocked slides，则只重画这些页面；其余通过页应原样复用，不要为了顺手统一重新发明",
      "若 context.reference_slides 提供了前面几页的 slide_identity、source_html_hash 与 visual_summary，后续页面只能把它们当成 deck 风格锚点，继承 style tokens、typography、palette、spacing、卡片尺度与留白语法，不得继承参考页布局结构，也不要让某一页整体突然更大或更小",
      "必须遵守 context.deck_style_reference.typography_plan；正文页标题、卡片标题、正文、标签与页码都沿用同一套字号梯度，除封面外不要漂移",
      "若标题或短句在当前字号梯度下可单行成立，禁止主动插入 <br/>；短中文词组只能在自然语义处换行；核心短词不得拆成单字尾行",
      "页面纵向信息分布必须均衡；若主信息集中在中段，就要把底部变成有效承载区或视觉收束区，不能留下大块无意义空白",
      "对双区对照或主链说明页，不要把主峰卡、节点链和说明条全部压在中段；必要时下移结构、扩大底部承载区或重分配信息层次",
      "对 multi_zone_compare 的左拆右并页面，左侧辅助区必须明显窄于、轻于右侧主峰区；不要把左区做成接近等权的大面板，否则整页会退化成保守双栏",
      "页码的位置、语法、字重和灰度必须在整套 deck 中保持一致；不要只在某一页单独切换成另一套页码样式",
      "ring_cross / 四向围绕中心的骨架页必须保持近似等距与近似对称，不能让上方卡片明显贴近中心而其他方向疏远",
      "禁止输出 <script> / <style> block；如需视觉样式，直接写 inline style",
      "审阅依赖的根节点 metadata 由 runtime 注入，但 AI 仍需交付 review-ready 的 data-qa-block / data-primary-point 结构",
      "相邻读者可见 data-qa-block、导语、主卡、步骤卡、总结卡和底部说明之间必须保留至少 6px 可见安全间距；视觉贴住按失败处理",
      "ring_cross 中心圆/中心节点与上下左右卡片至少保留 8px 可见间距；timeline_band 卡片不得出现 surface_text_scroll_overflow 式内容溢出",
      "speaker_notes、transition_sentence、page_goal、page_objective、visual_anchor_tracks、operator_playbook、operator_playbook_full_text、revision_context、source_id、material_id 不得成为听众可见 HTML 文案",
      "内部管理编号和项目编号必须服从用户给出的对外标签；不能把管理编号写成页面中的论文名称"
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
    "authored_markup_registry": {
      "ppt.hero_signal": "slidesData[*].content",
      "ppt.compare_zones": "slidesData[*].content",
      "ppt.timeline_rail": "slidesData[*].content",
      "ppt.judgement_ladder": "slidesData[*].content",
      "ppt.ring_cross": "slidesData[*].content",
      "ppt.central_axis": "slidesData[*].content",
      "ppt.summary_peak": "slidesData[*].content"
    },
    "required_review_contract": [
      "slide_root",
      "data-qa-block",
      "data-primary-point"
    ],
    "creative_authorship": "ai_first"
  }
}
```
