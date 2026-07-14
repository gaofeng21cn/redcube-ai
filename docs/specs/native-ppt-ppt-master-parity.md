# RCA 原生 PPT 非劣效目标态规格

Owner: `RedCube AI`
Purpose: `native_ppt_ppt_master_parity_target_spec`
State: `active_spec`
Machine boundary: 本文定义目标接口、owner、数据流和验收口径；机器真相继续归 contracts、source、tests、真实 PPTX package、render proof、RCA review/export verdict 和 owner receipt。

## 目标

以 `hugohe3/ppt-master@b0beba5b659c664bdbf0c07227fbdee313698dd7` 为外部参考，把值得学习的机制落到 RCA 现有标准 OPL Agent 结构中，使显式 native PPTX 路线在以下维度不劣于参考项目：

- 原生可编辑对象与 PowerPoint 演示语义；
- 多渲染器稳定性和可恢复导出；
- story、page role、数据表达和 template intelligence 的专业性；
- 构图、层级、节奏、视觉峰值和盲评美观度；
- 进度优先：新增能力不能把 OPL-hosted StageRun 的自动推进改成外层逐 stage 手工操作。

该目标不改变 `author_image_pages` 的默认视觉路线。`author_pptx_native` / `repair_pptx_native` 继续是用户明确要求 editable / DrawingML 时选择的路线，并继续受 RCA `visual_director_review -> screenshot_review -> export_pptx` authority gate 约束。

## 2026-07-10 实现读回

非 Live 实现已落地：typed native object fidelity、template preservation、package/relationship readback、真实 edit/save/readback/render 回归、semantic quality gates、professional method registry、Learning Landing Audit 和 blind parity evaluator 均已进入现有 RCA stage/skill/helper/contract 边界。该实现没有引入第二 runtime、第二 skill、上游模板资产或 owner authority。

完整规格仍为 `partial`。Notes、transition、timing 和 optional animation 已有真实 package materialization 与 OOXML readback；未关闭项是 PowerPoint/LibreOffice/Keynote 或 Google Slides fresh cross-viewer human readback、同源 RCA 与 pinned `ppt-master` 双跑、5 名独立盲评、完整 edit evidence、exact package/source identity binding 和 RCA parity owner receipt。当前缺口读 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md) 与 `contracts/live_stage_run_progress_evidence.json`；测试绿、catalog coverage 或单套 proof 不能替代这些证据。

## 外部模式分类

| 模式 | 分类 | RCA 落点 |
| --- | --- | --- |
| serial claim spine、spec lock、逐页 page rhythm | adopt | Story Architect、Visual Director、Native PPT Designer |
| author source / derived export 分离、可重导出备份 | adopt | Stage artifact refs、native helper output、artifact locator |
| SVG/scene primitives 到 DrawingML 的 fail-fast 精细物化 | adapt | Python native helper typed materializer |
| 稳定 shape 图表与 native chart/table 双模式 | adapt | Native PPT Designer object intent + helper adapter |
| PPTX master/layout/placeholder/chart/table intake 与 template fill | adapt | Template Profiler + Python helper |
| notes、transition、timing、可选 animation | adapt | Native PPT Designer + Python helper；静态页必须独立可读 |
| live preview、逐页 QA、chart calibration | adapt | existing preview/render refs + Reviewer，不新增 RCA 私有 workbench |
| 大型 icon/runtime/harness、Claude 专属 subagent 协议 | reject | 不进入 RCA |
| 多图片后端和复杂私有浏览器 UI | watch_only | 仅在 OPL generated/workbench 有明确消费方时采用 |

## Owner 分层

### Stage operating surface

- `storyline` / `detailed_outline` / `slide_blueprint` 冻结 claim spine、page role、evidence plan 和 progress baton。
- `visual_direction` 冻结 design system、page rhythm、visual peak、template profile consumption 和 route-specific constraints。
- `author_pptx_native` / `repair_pptx_native` 消费上述 refs，生成 typed editable scene plan；不自行重写已批准 narrative。
- `visual_director_review` / `screenshot_review` 消费真实 render 与 package readback，返回 unit repair targets 或 pass candidate。
- `export_pptx` 只在 RCA authority gate 通过后发布 artifact refs。

Stage 不沉淀跨 stage 专业方法、不手写 OOXML、不签 visual/export ready。

### Professional specialist skills

- `rca-ppt-story-architect`: claim spine、communication mode、逐页角色、证据密度和长 deck 进度 baton。
- `rca-ppt-visual-director`: visual language、跨页节奏、构图多样性、视觉峰值和 style system。
- `rca-template-profiler`: theme/master/layout/placeholder、semantic zones、capacity、table/chart inventory。
- `rca-native-ppt-designer`: typed scene plan、paragraph/bullet、shape/picture/group/path、chart/table、notes/motion intent。
- `rca-ppt-reviewer`: package/object readback、render-grounded semantic review、contact-sheet review、盲评候选和 route-back。
- `rca-visual-memory-curator`: 只接收经 review 验证的可复用 pattern proposal；accept/reject authority 仍归 RCA。

Professional skill 不持有 runtime、artifact body、helper execution、review/export verdict 或 owner receipt。

### Tool/helper

Python native helper 只做确定性工作：

- 输入/模板 PPTX intake；
- typed scene plan preflight；
- OfficeCLI / OOXML materialization；
- package relationship 和真实对象 readback；
- LibreOffice / Poppler true render；
- notes、transition、timing、animation patch；
- backup、re-export 和 evidence refs。

Helper 不选择 story、layout archetype、style、chart semantics 或 review verdict。任何未知 object kind 必须 fail-fast，禁止静默退化为 `rect`。

### Authority

RCA 继续持有 visual truth、artifact mutation/export authority、review/export verdict、visual memory accept/reject、owner receipt 和 typed blocker。OPL 继续持有 generic stage runtime、queue、attempt ledger、generated shell、workbench 和 transport。

## Typed native scene contract

`editable_shape_plan` 继续是 AI-authored source。每页至少包含：

- `layout_intent`、`composition_signature`、`template_layout_binding`；
- page role、first-glance semantic、visual peak / breathing / dense rhythm；
- `native_shapes[]` typed union；
- optional `speaker_notes`、`transition`、`animation_timeline`；
- repair-safe stable ids 和 package readback expectation。

支持的对象族：

- `text_box`、paragraph、run、native bullet；
- `rect`、`rounded_rect`、`oval`、preset shape；
- `line`、`connector`，含 arrowhead 和 endpoint semantics；
- `picture`，含 crop、alt text 和 aspect-ratio policy；
- `group`、`path`；
- `chart`、`table`、`metric_grid`；
- slide notes、transition、timing、optional animation。

Chart/table 支持两种显式 materialization intent：

- `stable_drawingml`: 用细粒度 DrawingML shapes 保持跨渲染视觉一致；
- `native_data_object`: 生成真实 PowerPoint chart/table 和数据部件，接受不同 viewer 的样式漂移。

选择由 Native PPT Designer 根据用户编辑需求和 Visual Director 的 fidelity 约束写入 plan；helper 不推断。

## Progress-first 约束

- 无显式人工审阅时，OPL-generated `invoke_product_entry` action 仍由 hosted StageRun 自动推进到 terminal review/export gate。
- 新增 preflight、package readback 和 visual review 都在 stage 内完成；不得把内部检查暴露成用户逐项确认。
- 可修复错误返回结构化 unit repair targets，`repair_pptx_native` 只重做阻断页/对象，复用未阻断 artifact hashes。
- notes/motion/template intake 是同一 native route 的能力，不新增第二公开 skill、第二 runtime 或第二 source of truth。
- 外部依赖不可用时返回 typed blocker；不得用降级矩形、截图打包或 synthetic preview 伪装完成。

## 质量与稳定性验收

### 结构和可编辑性

- 每个声明支持的 kind 在真实 PPTX package 中存在对应 object/part/relationship 证据。
- Manifest kind 必须来自 materialized readback，不得复述输入标签。
- 回归任务必须覆盖改一项数据、替换文字、调整颜色、移动关系节点、更新 notes 后重新保存和渲染。
- Chart/table fixture 必须保留原始 `native_shapes`，不得重建为通用卡片。

### 视觉专业性

- evaluator 必须区分 title promise 与真实构图：dependency map、timeline、decision ladder、chart、matrix 等语义必须由对应对象关系证明。
- shape count、role count、decorative count 只能作为诊断信号，不能单独授权 visual pass。
- screenshot/contact-sheet review 检查 story continuity、first-glance hierarchy、page rhythm、layout repetition、visual peak、data honesty 和 audience readability。

### 跨渲染稳定性

- OfficeCLI validate/issues/package readback；
- LibreOffice -> PDF -> Poppler PNG true render；
- 可用时执行 PowerPoint macOS open/save/render readback；
- Keynote 或 Google Slides 至少一个第三 viewer 作为 parity evidence；不可用时不得声明三端稳定性完成。

### 同源非劣效 benchmark

使用同一材料、页数、受众、品牌和编辑要求双跑 RCA 与 pinned `ppt-master`。匿名后独立评审：

- 专业性：story、page semantic、chart choice、evidence expression；
- 美观度：hierarchy、composition、rhythm、variety、visual peak；
- 稳定性：overflow、occlusion、font substitution、object/readback preservation；
- 可编辑性：真实编辑任务成功率。

RCA 只有在专业性和美观度 A/B 非劣效下界不低于参考项目 5 个百分点、critical defect rate 不高于参考项目、结构和编辑任务全部通过时，才可由 RCA authority 形成 parity owner receipt。测试、合同或单次 proof 不得替代该 receipt。

## 完成条件

以下条目必须全部 `done`，否则不得声称彻底落地：

1. Stage route 持续自动推进且 progress baton/targeted repair 不回归。
2. Professional skills 和 route injection 覆盖 story、visual、template、native design、review、memory。
3. Typed materializer 真实支持全部声明对象，未知 kind fail-fast。
4. Template intake/fill、notes、transition、timing、optional animation 可用。
5. evaluator 不再接受一根线/圆点绕过机械卡片检测。
6. benchmark 保留真实 chart/table fixture，并有 package assertions。
7. 至少产出一套真实复杂 native PPT proof，包含 chart/table/picture/connector/notes/transition，并通过真实 render 和 screenshot review。
8. 文档、contracts、tests、generated/hosted projection 与实际能力一致。
9. 所有并行 worktree 已复核、吸收回 `main`、清理；根 checkout 干净。
10. Learning Landing Audit 逐项给出 fresh evidence；无法完成的项必须是明确 typed blocker，不得静默 deferred。
