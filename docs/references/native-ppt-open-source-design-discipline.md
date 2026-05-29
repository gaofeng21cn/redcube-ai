# Native PPT 开源路线设计纪律参考

Owner: `RedCube AI`
Purpose: `native_ppt_open_source_design_discipline_reference`
State: `reference_draft`
Machine boundary: 人读参考文档。本文不定义 RCA 机器接口、route 合同、测试断言或完成状态；机器真相仍以 `contracts/runtime-program/*`、runtime-family source、native helper 输出、shape manifest、render proof、review/export receipts 为准。

## 结论

RCA 不把 `ppt-master`、`officecli-pptx` skill、Presenton、PptxGenJS、Marp 或 Slidev 接管为 native PPTX 主流程。RCA 只吸收这些路线反复证明有效的设计纪律：先锁定设计规格、模板画像和叙事主线，再产出显式坐标、可编辑对象和可渲染证据；每页必须能通过截图级视觉检查、contact-sheet 级横向比较和最终导出验证。

映射到 RCA native PPTX AI-first 路线时，设计权威仍在 live Codex executor 生成的 `editable_shape_plan`：AI 负责 claim spine、layout intent、composition signature、坐标、对象角色、字体层级、grid 与视觉变化；Python / Office helper 只负责物化、结构校验、渲染、导出和证据回传。`officecli` 可以作为 materializer / QA gate，不拥有视觉设计判断，也不能替代 RCA `visual_director_review`、`screenshot_review` 和 `export_pptx`。

本次调研后的直接判断是：问题不能靠后期质控救。强 PPT agent 的核心投入在前置设计层，即 template/profile extraction、semantic layout selection、placeholder capacity、page rhythm 和 render-aware operations。RCA native PPTX 必须在进入 Python / officecli materialization 之前，已经拥有一份足够专业且容量安全的 AI-authored design contract。

## 官方来源摘要

| 路线 | 官方事实 | 可吸收纪律 | RCA 边界 |
|---|---|---|---|
| `ppt-master` | README 明确目标是从 PDF、DOCX、URL 或 Markdown 生成原生可编辑 PowerPoint，输出真实 shapes、text boxes、charts，而不是整页图片；其 skill 规定串行 pipeline、gate-before-entry、每页重读 spec lock，并要求逐页生成。来源：[README](https://github.com/hugohe3/ppt-master)、[SKILL.md](https://github.com/hugohe3/ppt-master/blob/main/skills/ppt-master/SKILL.md)。 | `spec_lock`、serial stage、逐页读取规格、SVG/render 预览、post-processing/export、真实可编辑对象优先。 | RCA 可借鉴流程纪律，不采用其 harness、模板库、脚本或 agent ownership；RCA native PPTX 仍由 `visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx` 管。 |
| `officecli-pptx` skill / OfficeCLI | OfficeCLI 官方仓库定位为 AI agents 读写 Office 文件的本地 CLI，支持 PowerPoint slides、shapes、images、tables、charts、animations、themes、notes 等，并提供 JSON、path addressing、`validate`、`view issues`、`view screenshot`、`watch`。来源：[OfficeCLI README](https://github.com/iOfficeAI/OfficeCLI)、本机官方 `officecli-pptx` skill。 | explicit coordinates、DOM/path 可寻址、结构化 JSON、validate/issues、自校正、渲染截图和 live preview。 | RCA 可使用 materializer / QA gate 纪律；`officecli validate`、`view issues` 和截图不能代替 LibreOffice/Poppler true render proof 或 RCA visual verdict。 |
| `agent-slides` | 官方站点定位为面向 Claude Code、Cursor、Gemini CLI、Codex 等 coding agent 的开源 PowerPoint skill；其流程先从企业模板抽取 layout rules、color zones、font contracts 与 spatial zones，再 preflight/build/audit/polish，并强调 schema validation、QA 与 deterministic output。来源：[agent-slides](https://agent-slides.com/)、[PyPI](https://pypi.org/project/agent-slides/)。 | template extraction、machine-readable design profile、spatial zones、schema-validated operations、technical lint、story critique、transactional / deterministic build。 | RCA 不引入其 CLI 或 skill owner；吸收的是“模板和设计语言先抽成机器合同，再让 AI 选 layout 并输出可验证 operations”的前置设计纪律。 |
| `PPTAgent` / `DeepPresenter` | 公开项目和论文路线围绕 reference slide / presentation 生成，强调从参考材料学习页面组织、布局与内容结构，再生成可编辑演示；其后续路线继续强调 environment-grounded reflection。来源：[PPTAgent GitHub](https://github.com/icip-cas/PPTAgent)、[AgentSlides / PPTAgent 论文入口](https://agent-slides.com/)。 | reference deck analysis、content schema、布局语义迁移、action-title / page intent 先行、render-grounded reflection。 | RCA 不引入 PPTAgent runtime；吸收“先分析参考页或模板画像，再生成语义版式与坐标”的纪律，落到 `reference_deck_analysis`、`semantic_layout_selection`、`template_layout_grammar.reference_discipline` 和 rendered proof retry。 |
| Presenton | 官方 README 和文档定位为可自托管、开放源码 AI presentation generator/API，支持自带模型、templates/themes、prompt 或文档输入，并导出 PPTX/PDF；README 明确有 fully editable PPTX export。来源：[Presenton README](https://github.com/presenton/presenton)、[Presenton Docs](https://docs.presenton.ai/)。 | BYOK/self-host、模板/主题可控、API workflow、PPTX/PDF export readiness。 | RCA 不把 Presenton 作为 generation service；只吸收“模板/主题是显式输入、导出是可验证交付状态”的纪律。 |
| `pptx-from-layouts-skill` | 官方 README 定位为面向 Claude Code / Codex 等 coding agent 的 PowerPoint skill：先 profile 模板的 slide master layouts，再把语义内容映射到合适 layout 与 placeholder，避免把模板当背景图后叠文本。来源：[README](https://github.com/tristan-mcinnis/pptx-from-layouts-skill)。 | 模板不是配色皮肤；需要 master layout inventory、semantic layout selection、placeholder fit、保持模板 spacing/typography。 | RCA 当前 native route 不依赖外部模板文件，但 `template_layout_grammar` 应承担同样职责：先定义母版式 semantic zones 与 placeholder 规则，再让 AI 输出 shape 坐标。 |
| `dom-to-pptx` | 官方 README 定位为把 HTML element 转为 fully editable PowerPoint slide，并保留 gradients、shadows、rounded images 和 responsive layouts；它建立在 PptxGenJS 之上。来源：[README](https://github.com/atharva9167j/dom-to-pptx)。 | 先用成熟 layout/render surface 设计，再转成可编辑 PPTX；执行层要解决字体、间距、CSS 视觉到 PPT 对象的 fidelity。 | RCA 不把 HTML route 伪装成 native route；可借鉴其“先有可视布局系统、再做 editable conversion”的执行纪律，用 render proof 检查 officecli 物化是否偏离 AI plan。 |
| template-profiler 类 skill | 面向 coding agent 的 PPT skill 通常先把模板或参考 deck 抽成 design profile / layout catalog，再让 agent 基于 profile 生成可验证页面；关键不是某个样式，而是让设计输入变成机器可消费约束。 | design profile、模板 layout inventory、semantic placeholder、contact-sheet review、逐页 render inspection。 | RCA 不引入第二套 skill owner；把同类思想落到 `design_spec_lock`、`deck_layout_rhythm_plan`、`template_layout_grammar`、zone containment 与 screenshot/contact-sheet QA。 |
| PptxGenJS | 官方文档定位为 JavaScript 生成 PowerPoint，支持文本、表格、shapes、images、charts、custom slide masters、SVG、Asian fonts，并可写出 `.pptx`、base64、blob、buffer、stream；quick start 显示对象以 `x/y` 等参数显式放置。来源：[PptxGenJS Home](https://gitbrent.github.io/PptxGenJS/)、[Quick Start](https://gitbrent.github.io/PptxGenJS/docs/quick-start/)、[Saving](https://gitbrent.github.io/PptxGenJS/docs/usage-saving.html)。 | editable primitives、coordinate-first API、slide masters、跨运行环境导出、demo corpus。 | RCA 可参考 DrawingML writer/API shape discipline，不把 PptxGenJS API 作为 RCA 设计 owner；writer 只能承接已锁定的 AI shape plan。 |
| Marp | 官方站点把 Marp 定位为 Markdown presentation ecosystem，可导出 HTML/PDF/PowerPoint；Marp CLI 的 `--pptx` 默认生成渲染页，`--pptx-editable` 是实验能力，并警告可编辑导出复现度更低、复杂样式可能不完整。来源：[Marp](https://marp.app/)、[Marp CLI](https://github.com/marp-team/marp-cli)。 | Markdown source truth、theme/CSS、Chromium render、export commands、明确标注 editable export 风险。 | RCA 应把“可编辑性”和“视觉复现度”分开验证；不能用普通 PPTX export 证明 native editable quality。 |
| Slidev | 官方导出文档说明 Slidev 可导出 PDF/PPTX/PNG/Markdown，PPTX 导出依赖 Playwright 渲染，且 PPTX 中 slides 作为 images 导出，文本不可选择，notes 可逐页带入。来源：[Slidev Exporting](https://sli.dev/guide/exporting.html)。 | browser render QA、export UI/CLI、notes preservation、截图式分享物。 | Slidev 对 RCA 的参考价值是 screenshot/export QA，不是 native editable PPTX 方案；RCA native lane 必须输出可编辑 shapes。 |
| PPTist | 官方 README 定位为 Web slide editing/presentation app，支持文本、图片、shapes、lines、charts、tables、notes、gridlines、rulers、selection panel、alignment、import/export PPTX/PDF/images；同时声明 Office PPT authoring/export 并非 100% fidelity。来源：[PPTist README](https://github.com/pipipi-pikachu/PPTist)。 | 编辑器级对象模型、grid/ruler/alignment、selection/layer 管理、功能边界声明。 | RCA 可吸收 canvas/editor discipline；不能把浏览器编辑器 fidelity 当成 RCA native PPTX export verdict。 |

## 共性设计纪律

### 1. Spec Lock 先于页面生产

这些路线的共同点是先把设计输入变成稳定约束，再进入页面生成。`ppt-master` 用 spec lock 和 serial pipeline 抑制长 deck 中的上下文漂移；Presenton 和 PPTist 强调模板/主题；PptxGenJS 和 OfficeCLI 通过显式 API/路径表达对象；Marp/Slidev 用 Markdown、theme 和导出配置固定来源。

RCA native PPTX 约束：

- `editable_shape_plan.design_spec_lock` 必须在首个 native slide materialization 前存在。
- spec lock 至少包含 canvas、grid、margin、font family、type scale、palette、motif、layout rhythm、visual density、chart/table rule、image rule、借鉴的设计纪律和禁止项。薄的 `spec_id + motif + layout_archetypes` 不算设计锁。
- `design_spec_lock.borrowed_principles` 必须把吸收的外部纪律写成机器可检字段，至少包括 `ppt_master_style_spec_lock`、`template_layout_grammar`、`template_profile`、`semantic_layout_selection`、`reference_deck_analysis`、`per_page_visual_plan`、`layout_rhythm` 和 `rendered_quality_gate`；`qa_gates` 至少包括 `bounds`、`font_floor`、`text_fit`、`structural_visual` 和 `layout_variety`。
- `design_spec_lock.professional_design_brief` 必须说明本 deck 或样片采用的专业设计语域、参考型 layout family、首屏视觉层级、模板画像策略、容量策略和禁止项。没有这层 brief 时，不能直接进入 shape 坐标生成。
- 如果没有用户提供的 PPT 模板，AI 也必须生成“母版式”模板等价物：layout archetype inventory、semantic zones、placeholder / content schema、spacing rhythm 和禁止项；不能把配色或几张卡片称为模板。
- `editable_shape_plan.template_layout_grammar.reference_discipline` 必须声明 `template_profile_required`、`semantic_layout_selection_required`、`placeholder_capacity_required`、`reference_deck_analysis_required` 和 `action_title_required`，把 PPTAgent / agent-slides / pptx-from-layouts 这类路线的模板学习纪律变成 RCA 自己的前置设计合同。
- `editable_shape_plan.deck_layout_rhythm_plan` 必须与 spec lock 同级存在，用来声明每页 rhetorical role、selected archetype、primary grid、composition budget 和 proof object，防止 contact sheet 先天重复。
- `editable_shape_plan.template_layout_grammar` 必须与 spec lock 同级存在，用来声明可选 archetype、semantic zones、zone gap、safe inset、connector lane 与 shape-to-zone 绑定规则。每个 archetype 需要 usage、layout description、required zones、content schema、required role groups 和 prohibited mistakes。
- 每页必须先输出 `template_layout_binding`，选择一个 archetype 并声明本页 zones；每个非装饰、非 auxiliary 的可见 shape，包括结构线、连接器、band、panel 与正文，都必须通过 `layout_zone_id` 绑定到同页 zone，且坐标必须落在该 zone 内。
- zone containment 是生成时几何合同，不是截图后感性判断。`ai_first_shape_outside_template_layout_zone` 必须带回 `zone_bounds`、`shape_bounds`、`required_inside_zone` 和 zone inset 要求，让下一轮 AI 改同一个 shape 或重设 zone，而不是让 helper 自动搬运。
- 每页选中的 archetype 必须由实际 shape roles 和 required-zone coverage 兑现；只声明专业模板名但继续画通用卡片网格会在 materialization 前失败。
- 后续 `author_pptx_native` 与 `repair_pptx_native` 只能消费并局部修订已锁定规格，不能由 helper 重新选择模板或临时生成视觉系统。
- 如果 live Codex executor 在 `editable_shape_plan` 生成边界超时或执行失败，route 必须留下 `redcube_native_ppt_codex_invocation_blocker` diagnostic artifact ref，包含 prompt/context telemetry、timeout、model/sandbox 和 stage input refs；如果外层 route child 超时，probe 必须留下 `redcube_real_route_probe_route_timeout_blocker` refs-only artifact，包含已完成 planning route ids / artifact refs 与 timeout telemetry。这些都只是 typed blocker evidence，不能替代 native PPTX、PDF、screenshots 或 review/export proof。

### 2. Claim Spine 驱动页面，而不是模板填空

高质量 native PPT 不是把文本塞进模板。`ppt-master` 的 strategist/executor 分工、OfficeCLI skill 的“一页一个 idea”、Presenton 的 prompt/document generation 和 Marp/Slidev 的 Markdown source 都指向同一个纪律：先有 narrative spine，再选 layout。

RCA native PPTX 约束：

- 每页必须有 `claim`、`evidence`、`visual_role`、`audience_takeaway`。
- title 不能只是章节名或泛化主题，必须承载该页最大信息。
- deck 级 claim spine 必须能解释每页顺序；native helper 不得通过填充空卡片补齐页数。
- 单页样片优先做低密度 executive board。若同一页同时出现系统图、gate ladder、receipt strip、takeaway card 与 proof band，设计已经过载，应回到 claim spine 和 layout profile 重新选型。

### 3. Layout Variety 是质量门，不是装饰偏好

`ppt-master` 强调逐页生成与 page rhythm，OfficeCLI skill 明确要求 layout patterns 变化，PPTist 暴露 grid/ruler/alignment/selection 这类编辑器能力，PptxGenJS 提供 primitives 和 masters。它们共同避免“每页同一张卡片网格”的 AI deck 痕迹。

RCA native PPTX 约束：

- 每页声明 `layout_intent` 与 `composition_signature`。
- 连续三页不得复用同一 concrete composition。
- 常规 deck 至少 75% slides 应有互异的 composition signature；例外必须写入 shape manifest reason。
- `layout variety` 由 shape manifest 和 screenshot/contact-sheet QA 同时检查。

### 4. Explicit Coordinates 与 Editable Shapes 是 native PPTX 的最低语义

PptxGenJS 和 OfficeCLI 都以对象 API、坐标和路径为基本接口；`ppt-master` 明确 native editable 不是整页图；PPTist 的编辑器模型也以可选中、可移动、可缩放对象为中心。Marp/Slidev 的导出文档反向说明：图像式 PPTX 能分享和播放，但不等于 native editable quality。

RCA native PPTX 约束：

- native lane 输出必须包含可编辑 text boxes、shapes、charts/tables/images，不能把整页 PNG 包进 PPTX 后宣称 native。
- 每个 shape 必须有 role、bounds、z-order、font、fill/line、content source、editability classification。
- charts、tables、metric grids 必须有结构化数据与渲染对象对应，不能只画成不可编辑图片。
- export bundle 必须保留 source PPTX、shape manifest、render proof、final hashes 和 repair evidence。

### 5. Font Floor、Grid 与 Fit Math 必须机器可检查

OfficeCLI skill 把标题、正文、caption、KPI 的字体下限、shape 高度、边距、gap、contrast 写成明确规则；PptxGenJS/OfficeCLI 的坐标 API 让这些规则可机器检查；PPTist 的 grid/ruler/alignment 说明专业设计依赖可见度量。

RCA native PPTX 约束：

- body text 默认不低于 18pt；caption、axis label、footer、短 KPI sublabel 可低于正文，但必须标注 role。
- title/body hierarchy 必须显式，不依赖 theme 默认值。
- 16:9 canvas 必须有边距、column grid、inter-block gap 和 negative-space 目标。
- shape manifest 必须记录 text overflow、edge overflow、contrast、font floor、grid alignment 和 dense-slide exception。
- 短 gate / route label 的宽度和角色必须在计划时确定。短标签应单行显示；句子级说明应使用 `point_text` 放进更大的内容面板，不能让 `gate_card` / `route_label` 在窄框里强制换行。

### 5.1 结构线必须避让正文

流程图、时间线、gate ladder 和 system map 的连接线是可见结构对象，不是背景装饰。Office/PPT 编辑器类工具通常通过对齐、吸附、层级和连接器端点保证线条不穿过正文；坐标型 writer 则要求 author 在写入前明确避让。

RCA native PPTX 约束：

- `line` / `connector` 必须进入 shape manifest，并带有可识别的结构 role。
- `route_label`、`point_text`、`evidence_item`、`gate_card`、`metric`、`takeaway` 等可读正文不得压在 connector/rail/track 上。
- deterministic preflight 先按坐标阻断 `ai_first_structural_text_collision`；rendered screenshot QA 继续检查线条穿字、方向误读和视觉层级。
- 修复应移动线条到空白 gutter、改用分段连接、或移动标签，不能把线条降级成不可见装饰来逃过 QA。

### 6. Render QA 是正式证据，不是人工肉眼补看

Marp/Slidev 把浏览器渲染作为导出基础；OfficeCLI 提供 HTML/screenshot/watch；`ppt-master` 有 live preview 和 visual edits；RCA 当前 native proof environment 已规定 true render proof 使用 LibreOffice headless -> PDF -> Poppler PNG。

RCA native PPTX 约束：

- `officecli validate`、`view issues`、内部 renderer screenshot 都只能作为 gate refs。
- 正式 native PPT proof 必须通过 LibreOffice headless -> PDF -> Poppler PNG。
- render QA 必须逐页检查文字溢出、边界溢出、遮挡、空占位、低对比、关键图表数据缺失、CJK 字体替换风险。
- PowerPoint/Keynote/Google Slides 打开能力可以作为人工补充，不替代 RCA true render proof。

### 7. Screenshot 与 Contact-Sheet QA 保证跨页专业感

单页 render pass 只能证明没有明显破损。专业 deck 还需要横向检查节奏、重复、颜色、密度和 claim spine。Marp/Slidev 的图片导出、OfficeCLI screenshot/watch、`ppt-master` live preview 都说明截图级检查适合 AI 自修复。

RCA native PPTX 约束：

- 每次 native sample claim 必须附逐页 screenshots。
- 还应生成 contact sheet，用于检查 layout variety、视觉节奏、色彩漂移、标题层级、过密页面和重复模板。
- screenshot/contact-sheet QA 只产生 RCA review input；最终 verdict 仍由 `visual_director_review` 与 `screenshot_review` 签收。

### 8. Export Verification 收口交付，而不是生成文件即完成

PptxGenJS 的 saving API、Presenton 的 PPTX/PDF export、Marp/Slidev 的导出命令和 OfficeCLI 的 validate/issues 都把“写出文件”与“交付可用”分开。RCA native PPTX 必须保持同样纪律。

RCA native PPTX 约束：

- `.pptx` 必须通过 ZIP 完整性验证。
- source PPTX、exported PPTX/PDF、screenshots、shape manifest、review state、export proof summary 必须在 artifact inventory 中互相引用。
- export bundle 必须记录 source/final hash、renderer proof、repair log 和 blocked-page-only repair evidence。
- 没有 review/export receipts 时，只能说“生成了 proof artifacts”，不能说 visual ready、exportable、handoffable 或 production ready。

## 对 RCA native PPTX AI-first 的约束清单

1. `design_spec_lock` 是 authoring prerequisite，不是可选注释。
2. `deck_layout_rhythm_plan`、`template_layout_grammar`、required role groups 与每页 `template_layout_binding` 是 shape 坐标前置条件，不是后置 QA 标签。
3. 每页必须有 claim spine entry、layout intent、composition signature、proof object 和 editable shape plan。
4. native helper 不选择模板、不重写视觉系统、不拥有视觉判断。
5. native helper 不推断缺失的 `quality_role`、文字字号、非文本 shape 的可见填充/线条，也不把 `slide_blueprint.slides` 当成 native shape plan 代用品；这些都必须由 AI-authored `editable_shape_plan` 明确给出。
6. 可编辑性必须落在真实 DrawingML / Office objects；整页图片 PPTX 只能算 image-first 或 screenshot export。
7. font floor、grid、bounds、contrast、overflow、chart/table metrics 必须进入 shape manifest。
8. layout variety 必须由 manifest 和 contact sheet 双重检查。
9. `officecli`、PptxGenJS、LibreOffice、Poppler、PowerPoint、Marp/Slidev/Presenton/PPTist 只能作为 materialization、render、export 或参考 discipline，不自动获得 RCA route ownership。
10. native sample claim 必须有 live Codex executor shape plan、true render screenshots、RCA review/export evidence。
11. mock Codex helper、template fixture、refs-only AgentLab score、provider completion、Codex invocation diagnostic ref 和 route timeout blocker ref 不能展示成视觉质量证明。
12. 最终完成口径必须落到 `visual_director_review`、`screenshot_review`、`export_pptx`、artifact inventory、hash/ZIP/render proof 和 owner receipt。
13. 样片模式必须由正式 product-entry input 激活：`delivery_request.constraints.native_visual_sample=true` 写入 hydrated contract，route cache 纳入 constraints，`author_pptx_native` 才能切到 compact sample prompt / output contract；不能通过手工 patch deliverable、mock helper 或 helper template 代替。

## 使用建议

这份 reference 的用途是约束后续 native PPTX route、prompt pack、shape manifest 和 QA gate 的设计口径。它不要求 RCA 迁移到任何外部项目，也不授权把外部项目的生成结果直接纳入 RCA artifact authority。后续如果新增 writer adapter 或 proof runner，应先证明它能服从以上 discipline，再进入 RCA native lane。
