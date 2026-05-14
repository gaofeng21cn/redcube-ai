# RedCube AI 理想目标态

Owner: `RedCube AI`
Purpose: `north_star_reference`
State: `active_support`
Machine boundary: 本文是人读目标态参考。机器可读真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-14`

## 结论

理想状态下，`RedCube AI` 是生产级 visual-deliverable Foundry Agent。它把资料接收、叙事判断、视觉方向、页面生成、质量审阅、回修、导出、交付包、运行记录和经验沉淀收束在同一条可恢复、可审计、可继续的交付线上。

RCA 的第一身份保持为视觉交付领域智能体。它可以被用户通过 direct product entry / `redcube-ai` app skill 直接使用，也可以作为 OPL Framework 上的 admitted domain agent 被托管、唤醒和投影。两条入口进入 RCA 后都回到同一套 RCA-owned service-safe domain entry、stage pack、route truth、review/export gate 和 artifact authority。

OPL 在理想状态中承担通用运行外围：stage attempt、provider-backed runtime、queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace locator 和 shared contracts。RCA 继续持有 visual truth、communication strategy、visual direction、review verdict、export verdict、canonical artifact 和领域经验写回权。

本文描述目标态，不替代当前状态判断。当前真实落地程度以 [Status](../status.md)、[Project](../project.md)、[Architecture](../architecture.md)、[Invariants](../invariants.md)、[Decisions](../decisions.md) 与 `contracts/runtime-program/current-program.json` 为准。

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
  -> OPL Runtime Manager
  -> provider-backed family runtime
  -> RedCube service-safe domain entry
  -> selected executor adapter
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

- workspace locator、runtime root locator、stage attempt metadata、queue metadata、provider receipt refs、operator projection、freshness、repair hints 和 domain receipt refs。

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
- OPL 保存 attempt metadata、provider receipt、domain receipt ref、blocked reason、human gate 和 operator projection。
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

理想维护体验是：新增能力主要补 family stage、route、review gate、native helper 和 manifest，而不是复制 runtime 外围。

开发者应能：

1. 声明或更新 deliverable family descriptor。
2. 定义 stage sequence、route policy、prompt refs、skill refs 和 knowledge refs。
3. 实现或复用 TypeScript orchestration 与 Python native helper。
4. 把 artifact locator、review state、export bundle、receipt schema 和 projection builder 接到 product-entry manifest。
5. 跑 direct product-entry proof、OPL-hosted handoff proof、review/export proof、no-forbidden-write proof 和 line-budget / test lane。
6. 让用户通过 direct skill 或 OPL-hosted path 进入同一 deliverable loop。

维护者不应重复实现：

- 通用 durable queue。
- provider-backed worker residency。
- retry/dead-letter transport。
- human gate transport。
- family-level operator projection。
- workspace registry 的通用生命周期。
- OPL App 的通用 runtime shell。

## 理想完成门槛

RCA 达到理想生产级状态时，应满足以下门槛：

- Direct product entry、CLI/MCP、app skill 和 service-safe domain entry 长期稳定。
- OPL-hosted path 能真实运行 controlled visual stage attempt，并产出 RCA-owned domain receipt 或 no-regression evidence。
- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的默认 route、显式可选 route、review gate 和 export gate 都有可重复 proof。
- 每个 stage attempt 都有 source refs、artifact refs、review refs、owner receipt、blocked reason 或 human gate receipt。
- Review/export gate 能 fail closed，并能从明确 blocked item 进入 repair stage。
- Workspace / runtime artifact root 承载真实产物，repo source tree 不写真实 runtime artifacts。
- Domain memory retrieval、writeback proposal、accepted/rejected receipt 和 memory body owner 边界可运行。
- OPL 只保存 locator、metadata、receipt refs、operator projection 和 repair hints；RCA 保持 visual truth、quality verdict 和 artifact authority。
- 用户工作台能清楚展示进度、阻塞、下一步、产物和证据来源。
- 旧 gateway-first、Hermes-first、repo-local runtime pilot、hidden fallback 和 prompt-only route 不回到 active public identity。

## 当前差距与完善计划

截至 `2026-05-14`，RCA 已经具备 direct product entry、CLI/MCP、service-safe domain entry、product sidecar、stage descriptor、family action catalog、image-first 主线、review/export gate、domain memory descriptor locator、controlled memory apply proof、domain owner receipt contract 和 no-regression evidence ref 等主要 repo-verified surface。它还没有达到完整生产级理想态。

本节只维护 RCA 自己的完善计划。MAS、MAG、MDS 或 One Person Lab App 的并行 backlog 不写入本文；RCA 只说明哪些 visual-deliverable 能力由 RCA 持有，哪些通用外围应上收到 OPL Framework / One Person Lab App。

OPL 系列项目的全局主参考是 `/Users/gaofeng/workspace/one-person-lab/docs/active/opl-family-development-reference.zh-CN.md`。涉及跨仓总顺序、shared primitive owner、App/workbench 通用目标和旧兼容面退役纪律时，以该主参考和 OPL docs 为准。

### 通用模块上收 OPL 清单

RCA 的目标形态是 `visual-deliverable Domain Knowledge / Authority Pack`。下列能力具有跨 domain 复用价值，应优先沉淀到 OPL，而不是在 RCA 内长期维护一套私有平台：

| 模块 | 上收后的 OPL 责任 | RCA 保留的 authority |
| --- | --- | --- |
| Provider-backed stage runtime | stage attempt、provider receipt、query/signal、heartbeat、retry/dead-letter、restart recovery、operator action ledger | stage semantics、allowed task、visual closeout、domain receipt、forbidden-write boundary |
| Queue / human gate transport | typed queue、resume token、approval transport、human gate signal、handoff history | route approval meaning、visual stop rule、blocked item 语义、next owner |
| Workspace / source intake shell | workspace locator、source receipt shell、material gap attention item、artifact root locator、provenance navigation | source readiness verdict、communication strategy、audience promise、message hierarchy |
| Artifact gallery / handoff shell | artifact inventory view、gallery shell、handoff packet navigation、package/export attempt ledger、restore/provenance projection | canonical artifact authority、artifact mutation permission、export verdict、handoff meaning |
| Route / decision graph renderer | 通用 route graph shell、节点/边展示、decision trail drilldown、superseded/active path UI | route selection、visual direction rationale、family-specific route policy、review/export interpretation |
| Review / repair transport | blocked item queue、repair target threading、rerun request envelope、screenshot/export proof locator、human approval lane | visual director review、screenshot review verdict、repair decision、ready/exportable/handoffable verdict |
| Native helper catalog / execution envelope | helper registration、environment/provisioning metadata、execution receipt、version/proof index、operator-safe launch shell | Python helper implementation、PPT/image/export mutation logic、helper-specific RCA proof、review gate integration |
| Memory locator / writeback transport | memory descriptor discovery、body-free inventory、consumed refs、proposal refs、accepted/rejected receipt refs、freshness grouping | visual pattern memory body、route caveat、accept/reject authority、lesson quality judgment |
| Observability / SLO / repair projection | trace/log/event transport、freshness/SLO projection、stale scan、repair command projection、attention queue | domain blocker meaning、safe repair hint、visual quality facts、artifact/export authority boundary |

上收边界的验收标准：

- OPL 只保存 locator、metadata、receipt refs、provider receipts、operator projection 和 action routing shell。
- RCA 返回 owner receipt、typed blocker、no-regression evidence、artifact refs、review refs 或 export refs。
- OPL/App 不能生成 RCA visual ready、exportable 或 handoffable verdict。
- memory body、canonical artifacts、review/export judgment 和 artifact mutation permission 不迁入 OPL state 或 repo source tree。

| 目标面 | 当前实际状态 | 差距 | 完善计划 |
| --- | --- | --- | --- |
| Public entry / package | 单一 `redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`invokeDomainEntry` 和 sidecar surface 已是当前公开入口。旧 workbench、frontdoor、federation、standalone Hermes probe 与 gateway-action alias 已退出 active surface。 | CLI/MCP/product manifest 仍需要持续保持 action parity；任何新增 action 都必须从 `family_action_catalog` 派生并进入同一命名体系。 | 新增或修改入口时同步 CLI、MCP、manifest、tests 和 status；保持 `domainActions`、`callDomainTool`、`listDomainTools`、`DomainTool*` 命名，不恢复旧 alias。 |
| OPL-hosted controlled stage | RCA 已提供 OPL discovery、stage control projection、product sidecar dispatch、owner receipt / typed blocker / no-regression evidence ref 合同。 | 真实 OPL-hosted controlled visual stage long soak 和 artifact-producing domain owner receipt 尚未作为完成证据跑出。 | 下一步只补真实 hosted attempt 证明：由 OPL provider 发起 attempt，RCA 产出 domain receipt 或 typed blocker / no-regression evidence ref；不把 OPL completion 提升为 RCA visual ready。 |
| Deliverable family proof | `ppt_deck` 与 `xiaohongshu` 已以 image-first 为默认路线；HTML/native PPTX 是显式可选路线；`poster_onepager` 保持 guarded route。 | 三个 family 的长期、重复、真实 artifact proof 还没有全部达到生产 soak 水平；poster 仍是受控 knowledge poster 边界。 | 逐 family 跑 direct proof、OPL-hosted proof、review/export proof 和 repair proof；新增 family 必须先有 descriptor、route policy、artifact locator、review/export gate 与 no-forbidden-write proof。 |
| Stage attempt receipts | stage descriptor、route artifacts、runtime watch、review/export projection 已存在；domain owner receipt contract 已 landed。 | 每个真实 stage attempt 的 source refs、artifact refs、review refs、blocked reason、human gate receipt 和 owner receipt 还未全部常态化。 | 把 attempt receipt 写入 workspace/runtime root，并从 product shell / OPL projection 只读展示；repo 只保留 descriptor、schema、test fixture 和 locator。 |
| Domain memory | descriptor locator、seed fixture locator、writeback proposal、accept/reject contract、receipt locator 和 operator projection 已进入 repo-source contract surface。 | 真实 visual pattern memory body、accepted/rejected receipt instances 和 review/export closeout writeback 尚未作为常态运行流闭环。 | 先在 RCA runtime/domain-memory root 产生真实 receipt instance，再让 OPL 消费 locator/projection；不把 memory body 或视觉 verdict 迁入 OPL。 |
| Native helper / Python surface | Python helper catalog 已声明 package module 为 preferred invocation，仍允许 thin script wrapper 作为迁移期 ref。 | 部分 helper 仍有 `script` / `compatibility_script` 形态；这不是理想终态。 | 按 catalog 逐项迁到 package-module invocation，更新 runtime callsite 和 helper tests；完成后再把 wrapper allowance 收紧。 |
| User workbench | 当前是 CLI/product shell/operator projection；面向人的 desktop/Web 工作台不是 RCA 仓内已完成产品。 | 进度、阻塞、artifact gallery、review state、attention queue 的人用 UI 仍属于 OPL App 或 product shell 后续形态。 | 先保证 projection source 稳定，再在 OPL App 或 RCA product shell 读取这些 source；UI 不持有 visual truth 或 artifact rewrite authority。 |
| Persistence / lifecycle | 当前坚持 file authority + rebuildable artifact indexes；SQLite 仍是 deferred option。 | 还没有达到跨 deliverable 全局查询、长期 retention ledger 和 session index 的成熟侧车索引形态。 | 只有在真实文件规模、查询压力或 retention 维护成本出现后，再引入 rebuildable SQLite sidecar；不得把 SQLite 升级成 visual truth 或 artifact blob owner。 |

### RCA-only 完善顺序

1. `controlled_visual_stage_attempt`
   选一个低风险真实 workspace，优先 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 direct product-entry continuation 进入同一 RCA service-safe domain entry，返回 `domain_receipt`、`typed_blocker` 或 `no_regression_evidence`。
2. `emit_domain_owner_receipt`
   预留为 artifact-producing owner receipt 的 RCA-owned callable surface。它把 artifact delta、review state、repair target、export proof、handoff packet、residual risk 和 no-forbidden-write proof 纳入同一 owner receipt shape；direct path 与 OPL-hosted path 使用同一 return shape。
3. `apply_visual_memory_writeback`
   预留为 visual pattern memory live apply 的 RCA-owned callable surface。从真实 closeout 生成 reusable visual lesson proposal，由 RCA owner accept/reject；accepted body 写入 RCA-owned runtime/workspace memory store，OPL 只消费 locator 和 receipt refs。
4. `apply_visual_workspace_lifecycle`
   预留为 visual workspace lifecycle guarded apply 的 RCA-owned callable surface。它对真实 visual workspace 执行 cleanup / restore / retention guarded apply；RCA 返回 artifact mutation receipt 或 typed blocker，OPL 只维护 locator、retention ledger 和 restore/provenance projection。
5. `opl_app_projection`
   让 OPL App 或 RCA product shell 展示 workspace、deliverables、review、artifacts、attention 和 safe actions；所有动作路由到 OPL provider signal、RCA product-entry、RCA sidecar 或 manual handoff，并返回 receipt/typed blocker。
6. `legacy_physical_cleanup`
   有 direct/hosted parity、fixture/provenance 和 no-active-caller proof 后，再删除或 tombstone 旧 Hermes / Gateway / local-manager / bridge residue。

### 本轮计划 closeout

#### planned

- 把 RCA ideal-state / gap 计划从泛化 backlog 收口成可执行 closeout 结构，保留 current truth 与 target-state 的区别。
- 预留 `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle` 三个后续代码 surface 名称，作为 RCA-owned workspace/runtime apply surface，而不是 OPL-owned truth surface。
- 在 status、architecture、decisions 与 runtime architecture 中同步说明：这些 surface 只写 workspace runtime refs、domain receipt、typed blocker、no-regression evidence 或 lifecycle receipt；RCA 持有 authority，OPL 只消费 locator/projection/receipt refs。
- 明确真实 OPL Temporal controlled visual-stage long soak 尚未完成，不能把 OPL stage completion、provider completion 或 no-regression ref 写成 RCA visual ready / production soak success。

#### done

- 本文把 RCA-only 完善顺序改成后续代码 surface 可直接承接的命名：`emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`。
- 本文把本轮计划按 `planned / done / deferred / skipped / verification / commit-push state` 结构记录，方便后续实现 lane 和吸收 lane 接力。
- 核心维护文档同步了 owner split：RCA 写 domain-owned workspace/runtime refs 并持有 visual truth、review/export verdict、memory body 和 canonical artifact authority；OPL 只读取 descriptor、locator、projection、receipt refs、operator projection 和 repair hints。

#### deferred

- `emit_domain_owner_receipt` 的代码实现、CLI/MCP/product sidecar wiring、真实 artifact-producing receipt instance 与对应 tests 延后到代码 shape 确认后处理。
- `apply_visual_memory_writeback` 的代码实现、真实 reusable visual lesson body 写入、accepted/rejected runtime receipt instance 与 restore/no-forbidden-write proof 延后到 runtime/domain-memory lane。
- `apply_visual_workspace_lifecycle` 的 cleanup / restore / retention apply implementation、真实 workspace mutation receipt、retention ledger 对齐与 projection UI 延后到 lifecycle lane。
- 真实 OPL Temporal controlled visual-stage long soak、真实 domain owner receipt 或 no-regression evidence 的长时证明仍未完成；当前文档只描述计划与边界。

#### skipped

- 本轮不修改代码、tests、fixtures、package surface 或 generated artifacts。
- 本轮不修改 `contracts/runtime-program/current-program.json`，避免在代码 shape 未确认前改变机器合同。
- 本轮不声明 OPL Temporal long soak、artifact-producing owner receipt、memory writeback 或 workspace lifecycle apply 已完成。
- 本轮不移动旧历史文档，也不恢复旧 gateway / frontdoor / workbench / repo-local Hermes active surface。

#### verification

- 文档 lane 建议先跑只读验证：`git diff -- docs/references/rca-visual-deliverable-agent-ideal-state.zh-CN.md docs/status.md docs/architecture.md docs/decisions.md docs/runtime/runtime_architecture.md`
- 建议跑文档/格式轻量检查：`npm run test:meta -- --test-name-pattern docs`，若该 lane 不支持 pattern，则改跑 `npm run test:meta`。
- 若需要确认未触碰代码面，跑：`git diff --name-only`，预期只出现本 closeout 限定的五个 Markdown 文件。

#### commit-push state

- 本轮是文档 lane 更新；提交、push、吸收到 main 与 worktree 清理由协调者统一处理。
- 当前计划不要求立即 open production soak claim；代码实现 lane 完成后再更新机器合同和 status truth。

本轮明确退役并清理的旧面：

- `REDCUBE_WORKBENCH_ROOT` workspace root 兼容输入。
- standalone `scripts/probe-upstream-hermes-agent.ts` proof 入口。
- `@redcube/hermes-agent-client` / `@redcube/hermes-substrate` 这类 repo-local Hermes package surface。
- `GatewayActionMap`、`getCliGatewayActions`、`callGatewayTool`、`listGatewayTools`、`GatewayTool*`、`deps.gateway` 等旧 action/tool alias。
- `frontdoor`、`federation`、`source-pack-federation`、`product frontdesk`、`OPL bridge` 作为 active source/API surface 的入口。
- active 小红书质量样例里的 `source_workbench*` 字段；当前语义统一为 `source_visual_reference*`。

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
