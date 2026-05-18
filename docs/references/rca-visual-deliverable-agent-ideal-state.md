# RedCube AI 理想目标态

Owner: `RedCube AI`
Purpose: `north_star_reference`
State: `active_support`
Machine boundary: 本文是人读目标态参考。机器可读真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-18`

## 文档读法

- 本文只写 RCA 的 north-star 目标态和长期 owner boundary。当前闭合状态、执行顺序、functional_structure_gap_count 和 evidence 缺口回到 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md)。
- dated follow-through、closeout tranche、proof 命令和过程证据归档到 `docs/history/`，不在本文承担 current truth。
- 目标态优先于当前物理目录。旧 repo-local managed DAG、attempt/state-machine runner 和 managed-run store 已从 active source/package/test surface 删除；仍存在的 session store、workspace/source intake、memory/artifact lifecycle、review/repair transport、operator projection、CLI/MCP/product-entry/sidecar/status wrapper 只能作为 OPL generated/hosted surface consumer、refs-only adapter、declarative pack input 或 minimal authority function 读取，不是 RCA 长期私有 runtime 约束。
- OPL generated interface descriptor ready 本身只表示 OPL 能生成描述并路由到 RCA domain handler target；当前 8 项已按 OPL consumer 口径闭合。未来若新发现同类 generated/hosted consumption、active caller migration、App/operator drilldown、workspace/source/lifecycle shell 或 physical cleanup 缺口，才重新计入功能/结构 gap。
- RCA 当前 artifact-heavy 目录不是通用新 Agent scaffold；transition hosted-attempt receipt proof、provider completion 或 no-regression evidence 都不能写成 visual-ready、exportable、handoffable 或 production visual-stage soak 完成。

## 结论

理想状态下，`RedCube AI` 是生产级 visual-deliverable Foundry Agent。它把资料接收、叙事判断、视觉方向、页面生成、质量审阅、回修、导出、交付包、运行记录和经验沉淀收束在同一条可恢复、可审计、可继续的交付线上。

RCA 的第一身份保持为视觉交付领域智能体。它可以被用户通过 direct product entry / `redcube-ai` app skill 直接使用，也可以作为 OPL Framework 上的 admitted domain agent 被托管、唤醒和投影。两条入口进入 RCA 后都回到同一套 RCA-owned service-safe domain entry、stage pack、route truth、review/export gate 和 artifact authority。

OPL 在理想状态中承担通用运行外围：stage attempt、provider-backed runtime、queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace locator 和 shared contracts。RCA 继续持有 visual truth、communication strategy、visual direction、review verdict、export verdict、canonical artifact 和领域经验写回权。

因此，RCA 的理想形态是视觉交付 `Declarative Visual Pack + minimal authority functions`。RCA 不维护独立 agent runtime platform，也不长期维护 generic scheduler、generic queue、generic attempt ledger、generic state-machine runner、generic workspace/source intake shell、generic artifact gallery、generic memory transport、generic review/repair transport、native-helper generic envelope、generic observability、通用 App/workbench runtime，或手写的 generic CLI/MCP/product-entry/sidecar/status wrapper。RCA 的 descriptor、contract/schema、service-safe domain entry、domain transition spec/table、review/export gate、artifact locator、receipt schema、tests、visual policies 和 authority function manifest 只把 visual stage pack、route truth、review/export verdict、artifact refs、typed blocker 和 owner receipt 暴露给 OPL。product sidecar、projection builder、lifecycle adapter、session store 和 generic product shell 长期应成为 OPL pack compiler 的生成目标或显式迁移桥；只有 source readiness verdict、communication/visual direction decision、review/export verdict、artifact mutation authorization、visual memory accept/reject、owner receipt signer 和 native helper implementation 这类无法声明化的 authority function 可以留在 RCA。

这条目标态高于当前 RCA 物理目录和实现方式。artifact-heavy 代码可以保留 visual authority 和 native helper implementation，但 session continuity、generic runner、workspace/source shell、artifact gallery/handoff、review/repair transport、operator projection、generic CLI/MCP/product shell 等不因为已经存在就成为长期 RCA 私有平台。旧 repo-local runner/store/DAG 已经物理退役；后续新增实现也必须服务 `Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions`，不能绕回私有 runtime。能由 OPL primitive、pack compiler 或 App shell 承接的，必须列为上收或 generated surface 替换；不能承接的，必须收窄成明确的 visual authority function 或 refs-only adapter。

RCA 可以为了清洁目标态重构 packages、runtime families、prompts、native helper callsite 和 product shell。保留项必须回答它是否直接作出 source readiness、visual direction、review/export verdict、artifact mutation、visual memory accept/reject 或 owner receipt signing；否则默认不能作为 RCA 长期私有功能。当前已知非知识功能面已归为 OPL hosted surface、OPL generated surface、refs-only adapter、declarative pack 或 minimal authority function；未来新发现仍需 generated/hosted production consumption、active caller migration、wrapper retirement、operator drilldown、workspace/source/lifecycle shell 或 physical cleanup 的功能面，才重新构成功能/结构差距。production soak 与真实 receipt 规模化验证另属 evidence tail。

本文描述目标态，不替代当前状态判断。当前真实落地程度以 [Status](../status.md)、[Project](../project.md)、[Architecture](../architecture.md)、[Invariants](../invariants.md)、[Decisions](../decisions.md)、[RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md) 与 `contracts/runtime-program/current-program.json` 为准。

## 产品分层

RCA 的目标产品认知保持四层：

1. `RedCube AI Foundry Agent`
   面向视觉交付的领域智能体。它持有 source intake、communication strategy、visual direction、artifact creation、review/revision、package/handoff 等 stage 语义，以及交付物 family、route policy、视觉质量 gate、artifact authority 和 export truth。
2. `Deliverable Families`
   具体交付物产品线，包括 `ppt_deck`、`xiaohongshu`、`poster_onepager`，以及未来经过合同和 proof 打开的报告、长图、图文包、课程材料等 family。每个 family 有自己的 profile、stage sequence、review gate、export gate 和 handoff contract。
3. `Product Entry / Workspace`
   用户或 agent 进入 RCA 的工作面。它把 brief、source files、topic、deliverable intent、entry session、progress、artifact inventory、review state、export bundle 和 next action 收在同一 workspace / session 里。
4. `OPL-hosted Runtime Path`
   OPL 托管路径提供 durable runtime、attempt ledger、wakeup、human gate、retry/dead-letter、operator projection 和 family-level discovery。它消费 RCA descriptor、sidecar、receipt refs 和 artifact locators，不生成 RCA visual truth。

目标链路如下：

```text
User / Codex / CLI / RCA Product Shell
  -> RedCube Product Entry
  -> RedCube service-safe domain entry
  -> selected executor adapter
  -> RCA-owned stage pack
  -> RCA-owned visual truth / review gate / artifact authority
```

OPL 托管目标链路如下：

```text
User / One Person Lab App / OPL CLI
  -> OPL Product Entry
  -> OPL Framework / stage-led family runtime provider
  -> provider-backed family runtime
  -> RedCube thin sidecar / service-safe domain entry
  -> selected Agent executor
  -> RCA-owned visual truth / review gate / artifact authority
```

两条链路的差异只在进入 RCA 之前。进入 service-safe domain entry 后，route、stage、review、export、artifact 和 receipt 都由 RCA owner surface 收口。

## RCA 的理想职责

RCA 的长期职责是把高价值知识材料转成可信、可审阅、可交付的视觉成果。它应专注领域专业性、视觉判断和交付 authority，把通用 runtime 外围交给 OPL 或等价 provider。

### Source Intake 与 readiness

- 接收 brief、source files、keywords、references、screenshots、draft fragments 和用户约束。
- 冻结 topic 级 source truth、source index、extracted materials、source audit、source brief 和 source readiness pack。
- 在材料不足时明确 blocking gap、residual gap、需要补料的来源、可继续条件和用户确认点。
- 保证后续 storyline / plan / visual 阶段消费的是可追溯 source truth，而不是 prompt-only 摘要。

### Communication Strategy

- 从 source truth、audience、deliverable intent 和传播目标中形成唯一主线。
- 明确 audience promise、核心信息层级、叙事节奏、信息密度和 family-specific 表达策略。
- 把“讲什么、讲给谁、为什么这样讲”作为进入视觉方向前的正式 gate。
- 避免把素材堆叠、章节搬运或模板填充伪装成叙事策略。

### Visual Direction

- 把 communication strategy 转换成视觉语言、页面节奏、构图系统、风格约束、字体/色彩边界、图像策略和可审阅的视觉导演稿。
- 针对不同 family 选择合适 route：image-first、native editable PPTX、HTML lane 或其他显式开启的 authoring lane。
- 保证 route selection 是合同化决策，能被 review 和 rerun 追踪。
- 让视觉方向服务内容表达，不用机械模板、固定主题色或后处理 heuristic 掩盖设计问题。

### Artifact Creation

- 使用 stage pack、prompts、skills、native helpers 和 executor adapter 生成正式页面、图片、PPTX、PDF、文案、manifest 和 export bundle。
- `ppt_deck` 默认优先 image-first full-slide authoring；用户明确要求可编辑时进入 native PPTX lane；用户明确要求网页稿时进入 HTML lane。
- `xiaohongshu` 默认优先 image-first full-page note authoring，发布文案与页面图像一起进入 review / export。
- `poster_onepager` 保持知识海报边界，只有在合同和 gate 打开后再扩展到学术 poster 或 conference poster。

### Review 与 Revision

- 持有 visual director review、screenshot review、layout/geometry review、content fit review、export proof 和 publication / handoff projection。
- 对空白页、比例错误、裁切、低信息密度、重复页面、字段泄漏、文字不可读、内容错配和导出失败 fail closed。
- 回修必须从明确 stage、明确 blocked item 和明确 artifact refs 进入；保留未阻断页面，重绘或重写被阻断部分。
- 最终可交付判断来自 RCA-owned review/export gate，不来自 provider completion、脚本退出码或 OPL stage completion。

### Package 与 Handoff

- 导出 PPTX、PDF、PNG 序列、发布文案、manifest、review summary、artifact gallery、source refs、provenance refs 和 handoff packet。
- 交付包必须能回答：素材来自哪里、用了哪个 route、哪些页面被回修、哪些 gate 通过、哪些风险仍需人工知情。
- 外部发布、投稿、上传、社媒发布和客户发送保持 human-supervised action，除非未来另有明确合同和权限。

## Stage 是 RCA 的专家工作单元

RCA 的理想运行逻辑以视觉交付专家阶段为中心，而不是以单个工具调用或脚本节点为中心。每个 stage 都要有清楚的目标、输入、owner、gate、输出和下一跳。

RCA 的标准 stage plane 应至少覆盖：

- `source_intake`：冻结 source truth、readiness、gap 和 topic / deliverable locator。
- `communication_strategy`：生成 storyline、audience promise、message hierarchy 和 family-specific strategy。
- `visual_direction`：生成 visual direction、style constraints、page rhythm、composition rules 和 route selection。
- `artifact_creation`：生成页面、图片、PPTX、文案、manifest 和中间 artifact refs。
- `review_and_revision`：执行 visual review、screenshot/layout review、export proof、blocked item repair 和 rerun。
- `package_and_handoff`：生成 final bundle、operator handoff、artifact inventory、review state 和 closeout receipt。

每个 stage 至少声明：

- `goal`：本阶段完成的视觉交付目标。
- `inputs`：source refs、workspace locator、上游 artifact refs、用户约束、memory refs。
- `entry_conditions`：允许进入本阶段的 readiness、approval、source 和 artifact 条件。
- `executor_requirements`：默认 executor、显式可选 executor adapter、native helper 需求。
- `prompt_refs`：创作、审阅、回修和 handoff prompt。
- `skill_refs`：RCA skill、Office/PPT/browser/image/PDF/native helper 能力。
- `knowledge_refs`：视觉模式记忆、失败案例、风格参考、历史 review feedback。
- `quality_gates`：visual direction gate、screenshot review、export proof、publication/handoff gate。
- `outputs`：artifact refs、review verdict、blocked reason、repair target、owner receipt、handoff packet。
- `handoff`：下一 stage、resume token、human gate、stop rule 和 next action。

OPL 可负责 stage 的发现、排队、唤醒、恢复和投影。Stage 内的视觉判断、创作策略、review verdict 和 artifact authority 归 RCA。

## Deliverable Families 目标态

| Family | 理想 owner truth | 默认 route | 显式可选 route | 最终 authority |
| --- | --- | --- | --- | --- |
| `ppt_deck` | 演讲叙事、页面节奏、视觉导演、整页质量、PPT/PDF export truth | image-first full-slide authoring | native editable PPTX、HTML lane | RCA-owned visual quality / export gate |
| `xiaohongshu` | 图文传播策略、单篇策划、3:4 页面图、发布文案、系列一致性 | image-first full-page authoring | HTML lane | RCA-owned note page / publish copy gate |
| `poster_onepager` | 单页知识结构、视觉层级、信息密度、导出包 | guarded poster onepager route | future academic/conference poster route after contract | RCA-owned poster export gate |
| Future visual families | 领域化视觉交付策略、route、gate 和 handoff | 经过 proof 后声明 | 经过合同后开启 | RCA-owned family gate |

新增 family 的理想准入门槛：

- 有明确用户场景、输入材料、输出文件和交付判断。
- 有 family-specific stage sequence、route policy、review gate 和 export gate。
- 有 artifact locator、manifest、receipt schema、workspace layout 和 retention policy。
- direct skill path 与 OPL-hosted path 都回到同一 service-safe domain entry。
- 通过 no-forbidden-write proof，不把真实运行产物写进 repo source tree。

## Workspace 与运行文件边界

理想情况下，每个 RCA 任务都有明确 workspace。Workspace 是运行状态、source truth、artifact truth 和交付文件生命周期的承载点。

Workspace 应保存：

- 用户输入、source files、extracted materials、source audit 和 source readiness pack。
- entry session、topic id、deliverable id、run id、stage attempt receipts 和 owner receipts。
- storyline、plan、visual direction、page artifacts、image manifests、PPTX/PDF/PNG、publish copy 和 export bundle。
- review state、blocked items、repair log、rerun history、human gate receipts 和 handoff packet。
- visual pattern memory body、accepted/rejected writeback receipt、restore proof、retention receipt。

RCA repo 应保存：

- TypeScript orchestration、CLI/MCP、gateway、contracts、schemas、runtime family shell、projection builders、tests 和 docs。
- Python native helpers、Office/PPT repair helpers、screenshot/export helpers 和 fixture/proof tools。
- Prompts、skills、stage definitions、quality gate code、small fixtures 和 machine-readable descriptors。

OPL 应保存或投影：

- workspace locator、runtime root locator、stage attempt metadata、queue metadata、provider receipt refs、transition evidence refs-only projection、operator projection、freshness、repair hints 和 domain receipt refs。

这个边界保证开发仓库干净、可发布、可审查；真实运行文件有生命周期、可恢复、可清理、可迁移；RCA visual truth 不被 framework 或 host runtime 改写。

## Domain Memory 目标态

RCA 的领域记忆应优先服务视觉交付质量，而不是存放泛泛的 prompt 碎片。理想 memory 体系包括：

- 可复用视觉模式：信息层级、图文关系、密度控制、标题策略、转场节奏、图像风格约束。
- 可复用失败模式：裁切、低信息密度、字段泄漏、视觉重复、文字不可读、source mismatch、导出问题。
- route caveat：哪些任务适合 image-first，哪些必须 native editable PPTX，哪些适合 HTML。
- review learning：哪些 reviewer feedback 应沉淀为 future gate，哪些只是本次人工偏好。
- source-to-visual pattern：某类素材怎样转换成页面结构、图表、步骤图、对比图或海报区块。

OPL 可以持有 memory descriptor、locator、consumed refs、writeback proposal refs 和 receipt refs。RCA 持有 memory body、accept/reject authority、视觉 route 判断和经验质量判断。

## AI-first 质量边界

RCA 的理想质量体系是 AI-first 的视觉交付体系。AI-authored stage 应承担故事、视觉、页面和回修判断；结构化 gate、schema、scorecard、screenshot audit 和 export proof 用来表达证据、阻断点和 rerun target。

理想边界：

- 视觉创作由 RCA stage pack 和 executor 完成。
- 机械检查负责发现可验证问题：比例、空白、重复、裁切、字段泄漏、导出失败、manifest 缺失。
- 审美和传播判断由 RCA visual review / director review 持有。
- 后处理只允许作为 route 内显式 repair stage，不能成为隐藏 fallback chain。
- provider completion 只说明执行器完成了尝试，不说明 artifact ready。
- `ready`、`exportable`、`handoffable` 只能由 RCA-owned gate 给出。

长期保留的 visual authority functions 必须逐项满足：

| 函数 | 长期 owner | AI-first 边界 | 程序角色 |
| --- | --- | --- | --- |
| `source_readiness_verdict` | RCA source readiness owner | 判断 source 是否足够支撑视觉叙事和交付目标。 | validator / typed blocker |
| `communication_visual_direction_decision` | RCA visual director stage | 传播策略、视觉方向和 route selection 必须由 AI-authored stage artifact 持有。 | artifact materializer / refs projection |
| `review_export_verdict` | RCA review/export gate | review verdict、exportable 和 handoffable 只能由 visual review / export gate 给出。 | gate validator / receipt signer |
| `artifact_mutation_authorization` | RCA artifact authority | artifact rewrite 必须有 blocked item、repair target 和 owner receipt。 | materializer / guard |
| `visual_memory_accept_reject` | RCA visual memory owner | 视觉经验是否可沉淀由 visual route / review learning 判断。 | receipt writer / locator projection |
| `owner_receipt_signer` | RCA owner surface | 只签 domain receipt、typed blocker、safe action refs 和 provenance currentness。 | receipt signer |
| `native_helper_implementation` | RCA native helper owner | helper 只能实现 PPT/image/export mutation 或 proof，不给 visual ready verdict。 | helper implementation / guard |

## Direct Path 与 OPL-hosted Path 等价

理想状态中，direct 调用和 OPL 托管调用具有语义等价性。

Direct path 应提供：

- `redcube-ai` app skill。
- `redcube product status / manifest / invoke / session`。
- `invokeProductEntry`、`getProductEntrySession` 和 `invokeDomainEntry`。
- 同一 entry session 下的 source intake、plan、deliverable、review、export 和 continuation。

OPL-hosted path 应提供：

- OPL discovery 读取 RCA descriptor、family action catalog、stage control projection 和 memory descriptor。
- OPL queue/wakeup/provider runtime 通过 product sidecar export/dispatch 进入 RCA。
- OPL 保存 attempt metadata、provider receipt、domain receipt ref、transition evidence refs-only projection、blocked reason、human gate 和 operator projection。
- OPL runner/session shell 持有 generic supervision / continuation；RCA sidecar default dispatch 不暴露 `supervise_managed_run` 或 `product_entry_continuation`。
- OPL App 展示 progress、artifact refs、review state、blocked items 和 next action。

等价门槛：

- 两条 path 指向同一 downstream domain entry。
- 两条 path 使用同一 workspace / topic / deliverable locator。
- 两条 path 读取同一 review/export truth。
- 两条 path 的 final artifact authority 归 RCA。
- OPL stage completion 不能升级成 RCA visual ready verdict。

## 用户工作台理想态

成熟 RCA product shell 或 One Person Lab App 中的 RCA 面板应面向用户呈现工作进展，而不是暴露内部实现细节。

它应展示：

- `Workspace`：资料、source readiness、缺口、artifact root、recent activity。
- `Deliverables`：family、topic、deliverable、route、stage、progress、artifact inventory。
- `Review`：blocked pages/items、review verdict、repair status、export proof 和 residual risk。
- `Artifacts`：PPTX、PDF、PNG、publish copy、manifest、gallery、handoff packet。
- `Attention`：需要用户补资料、确认方向、批准继续、选择 route、处理发布动作的事项。
- `Operator Drilldown`：provider receipt、domain receipt、memory refs、source refs、repair command 和 provenance。

所有按钮和动作应路由到明确 owner：

- framework-level 动作走 OPL runtime / provider。
- RCA domain-level 动作走 RCA product entry / sidecar / direct skill。
- visual verdict、export verdict、artifact rewrite 和 memory accept/reject 回到 RCA gate。
- 外部发布动作保持 human-supervised。

## 开发者与维护者体验

理想维护体验是：新增能力主要补 family stage、route、review gate、native helper、manifest、declarative visual pack 和 minimal authority function，而不是复制 runtime 外围或手写可由 OPL 生成的产品外壳。

开发者应能：

1. 声明或更新 deliverable family descriptor。
2. 定义 stage sequence、route policy、prompt refs、skill refs 和 knowledge refs。
3. 实现或复用 TypeScript orchestration 与 Python native helper。
4. 把 artifact locator、review state、export bundle、receipt schema、visual policies 和 authority function manifest 接到 product-entry manifest / OPL pack compiler 输入。
5. 跑 direct product-entry proof、OPL-hosted handoff proof、review/export proof、no-forbidden-write proof、transition fixture proof 和 line-budget / test lane。
6. 让用户通过 direct skill 或 OPL-hosted path 进入同一 deliverable loop。

维护者不应重复实现：

- 独立 agent runtime platform。
- 通用 durable queue。
- provider-backed worker residency。
- generic attempt ledger / state-machine runner。
- retry/dead-letter transport。
- human gate transport。
- family-level operator projection。
- workspace registry 的通用生命周期。
- memory transport / artifact lifecycle / review-repair transport。
- native-helper generic envelope。
- OPL App 的通用 runtime shell。
- generated CLI/MCP/product-entry/sidecar/status/session/workbench wrapper。

## 理想完成门槛

RCA 达到理想生产级状态时，应满足以下门槛：

- Direct product entry、CLI/MCP、app skill 和 service-safe domain entry 长期稳定。
- OPL-hosted path 能真实运行 controlled visual stage attempt，并产出 RCA-owned domain receipt 或 no-regression evidence。
- Transition hosted-attempt receipt proof 必须从 repo-local fixture 推进到真实 provider attempt 证据，同时保持 OPL 只存 refs，不裁决 visual ready / exportable / handoffable，不携带 artifact blob、memory body 或 review/export verdict。
- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的默认 route、显式可选 route、review gate 和 export gate 都有可重复 proof。
- 每个 stage attempt 都有 source refs、artifact refs、review refs、owner receipt、blocked reason 或 human gate receipt。
- Review/export gate 能 fail closed，并能从明确 blocked item 进入 repair stage。
- Workspace / runtime artifact root 承载真实产物，repo source tree 不写真实 runtime artifacts。
- Domain memory retrieval、writeback proposal、accepted/rejected receipt 和 memory body owner 边界可运行。
- OPL 只保存 locator、metadata、receipt refs、operator projection 和 repair hints；RCA 保持 visual truth、quality verdict 和 artifact authority。
- RCA repo 内仍保留的非知识代码均能归类为 visual authority function、domain-native helper 或迁移桥；每项都有 active caller、cannot-absorb reason、receipt/schema 边界和 OPL generated/replacement expectation。能由 OPL pack compiler 生成的 CLI/MCP/product-entry/sidecar/status/projection/harness 不再作为 RCA 长期私有实现扩展。
- 用户工作台能清楚展示进度、阻塞、下一步、产物和证据来源。
- 旧 gateway-first、Hermes-first、repo-local runtime pilot、hidden fallback 和 prompt-only route 不回到 active public identity。

## 当前差距与完善计划

RCA 当前差距、通用模块上收 OPL 清单、总体差距矩阵和长期完善顺序已经拆到 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md)。本文只保留 north-star 目标态和长期 owner 边界，避免目标态与 active plan 在同一文件里继续双写。

暂不物理搬迁的旧文档只剩一种理由：它们仍被 `human_doc:*` 或 runtime-program 合同引用。处理方式是原位 lifecycle 降级、在 README/status/decisions 中声明读法，并在未来 remap/retire 语义 ID 后移动到 `docs/history/` 或 tombstone。

## 当前使用方式

本文适合作为以下场景的目标态参考：

- 规划 RCA production closure。
- 设计新的 deliverable family。
- 判断某项能力应落在 RCA、OPL 还是 workspace/runtime artifact root。
- 设计 RedCube product shell 或 OPL App 中的 RCA 工作台。
- 审核 direct path 与 OPL-hosted path 的等价边界。
- 评估外部视觉生成、PPT、浏览器、Office 或 runtime 工具是否值得吸收。

实际实施时按当前状态递进：

- 当前 truth 读核心五件套。
- 当前机器合同读 `contracts/runtime-program/current-program.json` 与 product-entry manifest。
- 当前运行入口读 `redcube product status / manifest / invoke / session`。
- 当前 OPL 边界读 RCA 的 OPL family contract adoption、stage control projection 和 product sidecar surface。
- 新增机器接口写入 contracts、源码、CLI/MCP 行为、manifest 或 domain-owned runtime surface，不写入本文。
