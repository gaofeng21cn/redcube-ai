# 文档索引

Owner: `RedCube AI`
Purpose: `docs_entry_index`
State: `active_support`
Machine boundary: 人读 docs 入口。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

这个目录是 `RedCube AI` 的技术阅读层。
当前公开阅读路径从 `RedCube AI Foundry Agent` 身份开始：它是 built on OPL Framework 的 OPL-compatible visual-deliverable package。OPL 是 stage-led 的智能体运行框架，可以把 RedCube 作为外部依赖托管，因此 OPL 路径在这里只作为内部托管集成路径记录：

- RedCube 直达路径：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- OPL 托管路径：`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.md) | 先理解 RedCube 交付什么，再进入技术细节 |
| 技术规划与架构读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 读取当前边界、执行模型和当前治理面 |
| 开发者与维护者 | [Product](./product/README.md)、[Runtime](./runtime/README.md)、[Delivery](./delivery/README.md)、[Source](./source/README.md)、[Policies](./policies/README.md)、[Active](./active/README.md)、[References](./references/README.md)、[History](./history/README.md) | 追踪生命周期文档、稳定规则、当前 baton、参考资料与历史 provenance |

## OPL 系列分层

OPL 系列项目的全局主参考是 OPL 仓的 `docs/active/opl-family-development-reference.md`。它维护 OPL Framework 的全局目标、全局差距、通用能力上收边界、App/workbench 目标和跨仓开发顺序；机器或跨仓定位应使用 semantic id、contract/source ref 或 repo owner 口径，不把本机绝对路径当稳定接口。

RCA 本仓只维护 visual-deliverable domain agent 的目标、当前差距、visual truth、review/export verdict、artifact authority、direct product-entry path、domain handler target、OPL-generated `domain_action_adapter` descriptor / projection / receipt refs 边界，以及哪些通用 source/workspace intake、artifact gallery、route/decision graph、review/repair transport、native-helper envelope、memory locator 和 observability primitive 应上收到 OPL。RCA 理想目标态读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md)，当前差距和完善计划读 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。MAS、MAG、MDS 或 OPL-owned App/workbench 的并行 backlog 不写入 RCA 文档。

## Workspace / file lifecycle 边界

RCA 的 repo-source layout 按标准 domain agent 职责读取：`agent/` 持有 visual declarative pack，`contracts/` 持有机器合同和 schema/index，`runtime/authority_functions/` 只作为最小 visual authority function 的 runtime-facing descriptor/receipt-ref 边界，`packages/` 持有 domain handler、authority adapter 与 native helper，`docs/` 持有人读治理说明。真实 source workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物不进入开发 checkout；它们必须落到 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。

RCA repo source 只保存 locator、index、schema、receipt ref、restore/retention policy 和 no-forbidden-write 证据。visual truth、review/export verdict、artifact authority、visual memory body accept/reject 与 owner receipt 仍归 RCA owner chain；OPL 只上收通用 workspace/file lifecycle primitive、scheduler/runner/session/workbench shell 和 projection。

当 RCA repo checkout 被临时用作 OPL workspace root 时，`workspace.yaml`、`workspace_*.json` 与 `shared/` 下的 `opl_resource_manifest.json` 属于 OPL workspace topology / materialized resource manifest 生成物，必须保持 ignored，不进入 repo source。RCA 持久的 pack compiler descriptor 输入是 `contracts/opl_domain_manifest_registration.json` 与 `contracts/domain_descriptor.json#/standard_contract_refs/domain_manifest_registration`；live OPL `agents pack-compiler` 还要求当前 OPL workspace binding 已通过 `opl workspace bind --project redcube --path <redcube-ai-repo>` 派生 `getProductEntryManifest` manifest command。

## 当前基线

- `RedCube AI` 持有视觉领域真相、`invokeDomainEntry`、direct repo-verified 的 product-entry service surface，以及由单一 `redcube-ai` 应用技能、`CLI`、`MCP`、本地脚本与仓库跟踪合同组成的稳定可调用面。
- 当前发布形态是 `RedCube AI Foundry Agent`：一个 app skill、一个 service-safe domain entry、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor/projection refs 和只读 stage-control projection metadata 共同组成 OPL-compatible package surface。它不是 GUI/WebUI 壳，也不会把 route、review、export 或 artifact authority 迁给 OPL。
- `Codex CLI` 继续作为 executor-adapter 合同后面的默认具体执行器和最小执行单元，服务本地操作者工作流。
- OPL 持有 stage-led 托管集成与 provider-backed family runtime 路径；Temporal 是 OPL production online runtime 的必需 substrate，`hermes_agent` 只作为显式非默认 executor/proof lane，local provider 只用于 dev/CI/offline diagnostics。OPL 可以索引 product-entry registration、session continuity、runtimeWatch、artifact、review/publication projection，但不持有 RedCube visual truth。
- `Hermes-Agent` 这类 hosted runtime carrier 只保留在显式 opt-in backend/proof lane 或技术参考层，不改写默认公开合同。
- `OPL` 只在需要 family-level routing、托管、唤醒或投影时进入；它不是 RedCube 的公开身份。
- 实现语言目标是 `TypeScript + Python`：TypeScript 持有 product/runtime contract 与 service boundary，Python 在 RedCube route/gate 下承担 native PPT/Office helper 与文档/PPT 修复循环。
- `ppt_deck` 默认通过 `author_image_pages` 走 image-first 整页 PNG 视觉生成；HTML `render_html/fix_html` 与可编辑原生 PPTX `author_pptx_native/repair_pptx_native` 继续作为显式可选路线。Native editable PPTX 读 [Native PPT proof environment](./delivery/native-ppt-proof-environment.md)：该路线固定为 RCA AI-first design pack、AI-authored `editable_shape_plan`、officecli writer / validator、true render QA 和 RCA review/export gates；AgentLab 只记录 refs，mock 不能当视觉样片。PPT feedback token 到 professional capability 的映射单源是 `contracts/capability_map.json`，`contracts/agent_lab_handoff.json` 只作为 suite/context/dry-run ref handoff。
- Template/reference deck profiling 的当前 owner 是 `agent/professional_skills/rca-template-profiler/SKILL.md`；visual direction 和 native PPTX authoring 只消费该 profile，不重新持有 template profiling authority。
- runtime truth 继续以文件 authority 和可重建 artifact index 为主。SQLite 持久层在 RCA 当前阶段 deferred，只有当实测 artifact/session 文件增长或跨交付物查询压力足够明确时，才作为 OPL-owned State Index Kernel / SQLite sidecar index 评估；它只保存 locator、hash、manifest/receipt ref 与 provenance，不存 PNG/PPTX/PDF body，也不持有 visual truth、canonical artifact truth 或 review/export verdict。
- `status` 命令键只作为单一 `redcube-ai` app skill 之下的 agent-facing product-entry overview / intake / entry-shell contract 保留，不代表成熟 GUI、WebUI 或最终用户前台壳已落地；repo-local `redcube product` CLI 当前只保留 `invoke`，product status / session / manifest wrapper 由 OPL generated/default caller 持有。
- `stage_control_projection`、root stage/pack/action refs 和 product-entry manifest refs 已让 OPL 可发现 RCA stage/action descriptor；generic stage control、pack compiler、Foundry series/profile、status/session/workbench wrapper 归 OPL owned/generated/hosted surface。RCA 只保留 Declarative Visual Pack refs、domain handler targets、minimal authority functions 和 native helper implementation，不持有 OPL generic substrate。

## 技术工作集

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)
- [Docs portfolio consolidation](./docs_portfolio_consolidation.md)

## 生命周期分层

| 分层 | 职责 | 当前文件 / 入口 | 生命周期边界 |
| --- | --- | --- | --- |
| 当前真相 | 当前产品角色、活跃边界、执行模型、硬约束和持久决策 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md) | 只写 current truth / policy；dated proof 和旧路线不回流。 |
| 机器真相 | runtime-program contracts、schema、source、generated artifacts 和 callable surfaces | [合同说明](../contracts/README.md) | 机器接口只在 contracts/source/tests/runtime artifacts；docs prose 不是 API。 |
| Product | 人类 / operator 入口、product handoff、profile 与发布协作 | [Product docs](./product/README.md) | 不定义 runtime truth 或 GUI/WebUI 已落地状态。 |
| Runtime | runtime topology、executor/backend 边界、service-safe entry、watch/projection 语义 | [Runtime docs](./runtime/README.md) | 不承载 Phase 2、Hermes proof 或 gateway/harness 历史叙事。 |
| Delivery | deliverable family、route、proof、export 与示例材料 | [Delivery docs](./delivery/README.md) | Route/proof support 不能替代 RCA-owned review/export verdict；probe/run 流水进入 history/process。 |
| Source | source readiness、augmentation、deep research trigger/gate 与 source truth 消费 | [Source docs](./source/README.md) | `planning_ready` 不授权 visual/export/domain/production ready。 |
| Policies | 稳定治理与运行规则 | [Policies](./policies/README.md) | 长期规则才进入；一次性过程证据进 history/process。 |
| Active | 当前执行、当前计划、当前差距与当前完成门槛 | [Active](./active/README.md) | 当前唯一 completion plan 是 `rca-ideal-state-gap-plan.md`；长清单和 proof 流水不进 active。 |
| Specs | 当前仍有效的技术规格索引 | [Specs](./specs/README.md) | 当前保持薄索引；规格真相优先在 contracts/schema/source/owner docs。 |
| References | 不持有 active baton 或公开身份的支持性技术参考 | [References](./references/README.md) | 支撑 current contract / target-state；不承担 active plan。 |
| History | 已归档 provenance、tombstone 与历史计划 | [History](./history/README.md) | 历史标题里的“当前/下一步/Backlog”只按归档时点读取。 |

这张表是层级：先读当前真相和机器真相；product/runtime/delivery/source/policies 解释当前工作；`docs/active` 记录仍在推进的 active plan；references 与 history 分别保留支撑上下文和历史 provenance。
RCA 采用 OPL-family canonical docs taxonomy：
`active/public/product/runtime/delivery/source/policies/specs/references/history`。
旧 `docs/program/` active baton 目录已物理退役：当前计划进入
`docs/active/`，已吸收 product-entry support brief 进入 `docs/references/product-entry/`，
已吸收 Phase 2 tranche 进入 `docs/history/phase-2/`，
upstream Hermes proof/provenance 进入 `docs/history/hermes/`，历史定位材料进入
`docs/history/positioning/`。`human_doc:*` 语义 ID 继续作为稳定读者上下文 ID，
不代表物理路径承诺。

## 维护者治理入口

- 文档生命周期治理规则统一留在 [RCA 文档组合治理](./docs_portfolio_consolidation.md)。
- `docs/references/governance/series-doc-governance-checklist.md` 只作为 OPL series 跨仓巡检支撑清单，不替代本文档索引、文档组合治理、核心五件套、active plan 或 machine contracts。
- 不再服务当前 program baton 的历史与 provenance 审计放入 `docs/history/`；仍解释当前运行方式的材料留在 `docs/references/`。
- 被 `human_doc:*` 语义 ID 引用的读者上下文保持语义稳定，物理文档按生命周期分层：当前计划在 `docs/active/`，support brief 在 `docs/references/`，absorbed / proof / historical positioning 材料在 `docs/history/`。
- RCA 文档按内容生命周期维护。同一个文件可以只有部分内容仍属当前事实；当前事实合入 owner doc，active baton 留在 `docs/active/`，支撑说明进入 references，已完成或被替代的计划文本在链接审计后进入 history。
- `README*` 与 `docs/**` 是人读面。Runtime contract、测试、脚本和 dashboard 可以暴露 `human_doc:*` 语义指针帮助读者定位上下文，但不能把 repo 文档路径钉成稳定机读 API。
- 仓库目录治理现在通过 `scripts/repo-hygiene.sh` 在 `scripts/verify.sh` 各 lane 和 grouped test 执行前运行。Line budget 的唯一 authoritative gate 是 `scripts/line-budget.ts`，package `test:line-budget` 入口只作为同一 gate 的别名；Sentrux structural quality 继续由 `scripts/run-structural-quality-gate.sh` 承担。两者默认是 advisory：日常 `smoke`、`fast`、`ci`、`structure` 和 `npm run test:*` 入口只报告 oversized / growth / stale baseline / structural regression，不因这些报告阻断普通开发；每日结构治理或显式维护使用 `scripts/verify.sh line-budget-strict`、`scripts/verify.sh structure-strict`、`npm run line-budget:strict` 或 `OPL_LINE_BUDGET_STRICT=1`。`scripts/run-test-group.ts` 同时给 Python native helper 子进程注入仓外 cache 环境。tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/`、`.agent-contract-baseline.json` 或 `.agents/` 这类生成物 / 本地状态；RCA Codex plugin scaffold 的 canonical source 现保留在 `plugins/redcube-ai/`，legacy `plugins/rca/` 已退役且不得作为兼容 alias path、repo-local installer 或 tracked `.agents/plugins/marketplace.json` 注册恢复。

## 文档角色清单

本清单覆盖当前 repo-tracked `README*` 与 `docs/**/*.md` 的生命周期角色；过程记录和压缩 coverage summary 见 [RCA process history](./history/process/README.md)。

| 路径组 | 当前职责 | 不承担 |
| --- | --- | --- |
| `README.md`、`README.zh-CN.md` | public repository entry；先说明 RCA visual-deliverable 身份，再说明 OPL-compatible package / hosted integration 边界。 | 不作为机器接口，不声明 GUI/WebUI 已落地，不把 OPL 写成 visual truth owner。 |
| `agent/README.md` | Declarative Visual Pack repo-source 入口。 | 不承接 docs lifecycle governance。 |
| `runtime/README.md` | runtime source package 入口。 | 不承接人读 runtime topology owner；读 `docs/runtime/`。 |
| `contracts/README.md` | machine contract index 的人读说明。 | 不替代 JSON contracts / schema / tests。 |
| `docs/README.md` | docs entry index 与生命周期导航。 | 不保存 dated coverage ledger。 |
| `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` | 核心五件套，持有当前角色、状态、架构、硬约束和仍有效决策。 | 不保存 run/probe 流水、旧 active checklist 或 history proof。 |
| `docs/active/` | 当前 gap plan 与私有实现迁移台账。 | 不新增第二 active checklist，不保存已完成 closeout 流水。 |
| `docs/product/` | Human/operator quickstart、profile、publish 协作。 | 不定义 runtime truth、GUI/WebUI readiness 或 generic runtime。 |
| `docs/runtime/` | Runtime topology、executor/backend、service-safe entry、watch/projection 说明。 | 不恢复 Hermes-first、gateway/harness 或 repo-local managed runtime owner。 |
| `docs/delivery/` | Deliverable route/proof/export/examples support。 | 不替代 visual ready/exportable/handoffable verdict；不保存 dated probe commands、sample roots 或 run transcripts。 |
| `docs/source/` | Source readiness / augmentation / deep research trigger support。 | 不授权 artifact authority 或 review/export verdict。 |
| `docs/policies/` | 稳定规则。 | 不保存一次性执行证据或 dated tranches。 |
| `docs/public/`、`docs/specs/` | 薄索引；未来有真实 public/spec 需求时再扩写。 | 不吸收旧 program/capabilities/reference 正文。 |
| `docs/references/` | Target-state、integration、product-entry、memory locator、executor routing、governance 等 support references。 | 不承担 current truth 或 active baton。 |
| `docs/history/` | Hermes、Phase 2、plans、process、positioning、runtime、tombstone provenance。 | 不作为当前 runtime/product/source/delivery truth。 |

## 参考层

- `docs/product/`：面向 product 与 operator 的人类可读指南
- `docs/runtime/`：runtime topology 与 execution/projection 说明
- `docs/delivery/`：deliverable family、route、proof、export 与示例材料
- `docs/source/`：source readiness 与 augmentation 材料
- `docs/policies/`：稳定治理与运行规则
- `docs/active/`：当前计划、当前差距与当前完成门槛
- `docs/public/`：公开叙事薄索引；除非未来有真实公开材料，不承接旧 program/capability 正文
- `docs/specs/`：当前技术规格薄索引；正文优先回到 contracts、runtime/delivery/source owner docs 或 machine surface
- `docs/history/phase-2/`：已吸收 tranche brief 与 follow-on records
- `docs/references/product-entry/`：已落地 product-entry 合同面的支撑说明
- `docs/references/`：解释当前运行、目标状态或维护者实践的支持性技术参考，但不承担公开身份
- `docs/history/`：归档 provenance、tombstone、repo-local migration 记录，以及不再服务当前 active program baton 的历史计划
- 本地 AI / Superpowers 过程草稿继续在被忽略的 `docs/superpowers/` 下维护，不进入 repo-tracked history。
- [AI-first 质量边界 Policy](./policies/ai_first_quality_boundary.md)：固定 author / reviewer 判断必须由 AI-authored artifact 持有，pack、schema、gate、audit 与 projection 只承担机械约束和证据传递。
- [视觉模式记忆 Policy](./policies/visual_pattern_memory_policy.md)：固定视觉叙事、风格、信息密度、route 选择 caveat 和 review failure mode 先按自然语言 memory 管理，不能替代 AI author/reviewer artifact、route contract、export gate 或 canonical artifact authority。
- [Direct-delivery longrun target state](./history/plans/2026-04-09-direct-delivery-longrun-target-state.md)：历史 future-facing 设计目标 freeze，已退出 active/reference 支撑面
- [Real-route evolution probe](./history/process/real-route-evolution-probe.md)：历史 process/provenance，只保留 probe owner map 和压缩历史读法；active command / test / contract refs 已退役，当前 PPT 三路线 proof 回到 AgentLab suite refs 与 RCA-owned gates，不声明 production readiness
- [Source readiness deep research longrun target state](./history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md)：历史 source-plane future target freeze，当前 source truth 回到 source owner docs 和 contracts
- [Historical OPL managed runtime three-layer contract](./history/runtime/opl-managed-runtime-three-layer-contract.md)：历史 owner-boundary provenance，当前 runtime 口径回到核心五件套、runtime docs、active gap plan 和 contracts

## 文档规则

- `README*` 与 `docs/README*` 统一围绕 repo-verified direct route、OPL 托管集成路径与 service-safe domain entry surface 叙事。
- `docs/**` 是中文内部开发与维护参考。稳定文档路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。
- 参考材料只在仍支撑当前合同时保留。
- OPL、gateway、bridge、harness 和旧 route 词汇不得回到第一公开身份；只有在明确说明内部集成、运行托管、provenance 或 tombstone 语境时才使用。
- 机器可读 runtime-program contract 应引用 contract/schema/source 路径来表达可执行真相，或使用 `human_doc:*` 语义 ID 表达读者上下文；不应让 prose 文档层级变成测试或 runtime 的路径兼容约束。
