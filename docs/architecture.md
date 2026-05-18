# RedCube AI 架构

对外主语：`RedCube AI` 是独立 visual-deliverable Foundry Agent；公开发布形态是 built on `OPL Framework` 的 `OPL-compatible package`。`gateway / harness` 仅保留为内部架构边界语言。

## 主链路

当前对外主链路以 direct route 为第一主语，OPL 路线保留为 hosted integration surface。OPL 是 stage-led 的完整智能体运行框架，可以托管 RCA，但它不是 RCA 的第一公开身份：

- direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- OPL-hosted route：`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

在 OPL stage-led family framework 中，这两条路线都可以被投影为 stage attempt，但 RCA owner 边界不变：OPL 只提供 stage descriptor discovery、queue/wakeup、handoff、receipt、approval/retry、trace/projection；RedCube 持有视觉 route truth、review/export gate、canonical artifacts 和 visual-domain quality 判断。

两条路线在进入 `invokeDomainEntry` 之后，继续按同一条执行链工作：

`service-safe domain entry -> executor adapter -> concrete executor -> audit / review / publication projection`

当前 route equivalence 的可验证边界由 product-entry manifest 暴露：`status`、`invoke`、`session continuation` 与 internal OPL integration 的共享真相面固定为 `domain_entry_surface`、`session_continuity`、`progress_projection`、`artifact_inventory`、`runtime_loop_closure`、`review_state`、`publication_projection`。这条边界只证明多入口落到同一 deliverable/runtime truth，不创建第二公开 skill，也不创建第二套运行语义；direct/default product-entry 的 runtime owner 是 `configured_family_runtime_provider`，默认 task intent label `run_opl_stage_execution_plan` 返回 `opl_stage_execution_plan`，由 OPL provider 持有 stage attempt runtime / attempt ledger。这里的 label 不表示 RCA 继续维护 repo-local managed runtime；Codex CLI 是 provider/executor adapter 可选的第一公民 concrete executor，显式 Hermes proof lane 才声明 `upstream_hermes_agent`。
这里的 `status` 是 agent-facing product-entry overview / intake / entry-shell contract；`redcube product status` 是当前 product-status command，不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。
`family_action_catalog` 是 RCA-owned callable action metadata 单一声明面；repo-root OPL standard pack 把它与 stage、memory、artifact、receipt 和私有功能审计一起声明为 OPL pack compiler 输入。`OPL` 从该 pack 生成统一 CLI / MCP / Skill / product-entry / tool descriptor bundle，RCA 现有 CLI、MCP/product-entry commands、`invokeDomainEntry`、product sidecar 和 local scripts 作为 generated descriptors 指向的 action target / authority function。`OPL` 只读取该 pack/catalog 做 family-level discovery/export/parity，不写 RedCube visual-domain truth、stage-run truth、review/publication projection 或 canonical artifacts。Product-entry MCP public routes只暴露 catalog actions；`invokeOplHostedProductEntry` 保留为 internal OPL integration contract，不作为公开 MCP action。
`redcube product sidecar export --workspace-root <dir> --format json` 是给 OPL typed family queue / OPL family runtime provider 在线唤醒使用的 product sidecar adapter projection；`redcube product sidecar dispatch --task <task.json> --format json` 只接受 RCA-owned guarded actions：`runtime_watch`、`emit_no_regression_evidence`、`emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`、`evaluate_visual_transition`、`emit_workspace_receipt_proof`、`notification_receipt`。这些 guarded actions 与 forbidden writes 来自 canonical sidecar action metadata，并同步到 manifest、family action catalog、product sidecar export 和 CLI/MCP guards。`supervise_managed_run` 与 `product_entry_continuation` 已从 default sidecar dispatch/action 面物理删除/收薄；`get_managed_run` / `supervise_managed_run` 也已从 public MCP/CLI/gateway surface 退役。generic supervision / continuation 归 OPL runner/session shell，RCA direct product-entry/session API 与内部 visual authority surfaces 不作为 standard sidecar template 或 default generated surface。该 sidecar 不写 visual truth、canonical artifacts、review verdict 或 publication gate。
`standard_domain_agent_skeleton` 是 RCA 对 OPL standard domain-agent skeleton 的 manifest mapping 与低风险 repo-source follow-through：repo-source 边界限定为 `agent / contracts / runtime / docs`，runtime 只声明 product sidecar、projection builder、lifecycle adapter、visual transition spec/evaluator、owner receipt contract、domain memory locator 和 workspace receipt inventory read model；真实 PNG/PPTX/PDF、receipt 实例和 export bundle 继续落在 workspace/runtime artifact root，并通过 `artifact_locator_contract`、`product_sidecar_receipt_refs`、`domain_owner_receipt_contract`、`controlled_memory_apply_proof/runtime_receipt_instances`、`visual_transition_evaluator` 与 `workspace_receipt_inventory_projection` 暴露 ref。
`stage_control_projection` 是给 OPL family Stage Control Plane 的 descriptor 和 stage-plan adapter：它把 RCA 已有 `ppt_deck`、`xiaohongshu`、`poster_onepager` route stages 投影到 `source_intake`、`communication_strategy`、`visual_direction`、`artifact_creation`、`review_and_revision`、`package_and_handoff` 等 family stage kinds，并允许 OPL provider 基于 `opl_stage_execution_plan` 调度 stage attempts。product-entry manifest 中的每个 stage descriptor 都包含 goal、owner、skills、allowed_action_refs、handoff、source refs、freshness、stage-to-action parity 与 authority boundary，供 OPL 真实 discovery smoke 消费；它不改变 hydrated `stage_sequence`，不持有 RedCube visual truth、review owner 或 artifact authority。Codex App direct skill 调用与 OPL 托管调用必须在 `invokeDomainEntry` / product-entry command contract 后收敛。

这四个 surface 合起来构成当前发布 package：single `redcube-ai` app skill 是用户/Agent 入口，`invokeDomainEntry` 是 service-safe domain entry，product sidecar/projection 是 OPL provider 和 family queue 的可读/受控派发边界，`stage_control_projection` 是 OPL Stage Control Plane 的只读 stage descriptor。它们全部指向同一 downstream RCA domain truth；RCA 继续独立持有 visual truth、route owner、review/export verdict 和 artifact authority。

RCA functional closure 的新增生产边界是：`domain_owner_receipt_contract` 统一 domain receipt、typed blocker 与 no-regression evidence return shape；`lifecycle_guarded_apply_proof` 覆盖 cleanup/restore/retention 的 guarded apply 语义；`visual_transition_spec` 声明 RCA-owned transition table、guard contract、oracle fixture 与 owner action；`visual_transition_evaluator` 只按显式 guard refs 返回 next-stage metadata、repair action、owner receipt / no-regression refs 或 typed blocker；`physical_skeleton_follow_through` 证明 `agent/ contracts/ runtime/ docs/` 入口可被 OPL 消费；`review_helper_baseline_follow_through` 记录 PPT review helper 的 baseline removal、geometry audit / markdown report 与 summary projection 拆分。这些 surface 仍是 RCA-owned projection，不把 visual truth、review/export verdict、canonical artifact 或 memory body 移给 OPL；generic transition runner、retry/dead-letter、route graph、workbench 和 provider attempt ledger 继续由 OPL 持有。

当前 sidecar runtime apply surface 已包含 `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle` 和 `emit_workspace_receipt_proof`。这些都属于 RCA-owned workspace/runtime surface：写入和返回的是 workspace runtime refs、domain receipt、typed blocker、no-regression evidence、memory receipt refs、lifecycle mutation receipt 或 proof pack；RCA 继续持有 visual truth、review/export verdict、memory body、canonical artifacts 和 artifact mutation authority。`workspace_receipt_inventory_projection` 只读这些 runtime receipt refs，供 OPL/App/operator 索引当前 workspace 的 receipt coverage；它不是 artifact gallery、workbench 或 production evidence producer。OPL-hosted path 只能消费 locator、projection、receipt refs、operator projection 和 repair hints，不能把 provider completion 或 stage metadata 升级成 RCA visual ready / exportable / handoffable verdict。真实 OPL Temporal controlled visual-stage long soak 当前仍未完成。

RCA 现在消费 OPL `family_scheduler_replacement` projection：OPL 持有 family scheduler、daemon 和 generic lifecycle owner；RCA 不在仓内实现 generic scheduler/runtime manager。旧 repo-local managed DAG scheduler 已物理删除；当前视觉 stage 顺序只通过 hydrated deliverable contract、`family_stage_control_plane` 和 `opl_stage_execution_plan` 暴露为 route-handler refs。

RCA 也消费 OPL stability read-model projection：`opl_stability_read_model_consumption` 只挂 OPL `family-conflict-envelope`、`control_loop_summary`、`usage_projection`、`resource_pressure`、`runtime observability-export` 和 external stability policy 的 refs。它让 OPL/App/operator 能看到 RCA stage refs、owner receipt refs、typed blocker/no-regression evidence refs 和已观测资源压力信号；它不执行 domain action、不写 RCA domain truth、不授权 visual-ready / quality / export verdict、不写 artifact blob 或 memory body，也不把 generic fallback、字符串 retry、event bus 或 runtime adapter started 写成成功语义。

RCA 现在也暴露 `operator_evidence_readiness_projection`：这是 RCA-owned read-only operator surface，从 `no_regression_owner_receipt_opl_consumption_proof`、`domain_owner_receipt_contract`、`controlled_memory_apply_proof/runtime_receipt_instances`、`lifecycle_guarded_apply_proof`、`controlled_soak_no_regression_attempt`、`workspace_receipt_inventory_projection`、`opl_generic_primitive_consumption/functional_harness_consumer_coverage` 与 `opl_stability_read_model_consumption` 派生。它给 OPL/App/operator 展示 next evidence gaps，包括真实 artifact-producing owner receipt、真实 OPL-hosted controlled visual-stage long soak、真实 memory/lifecycle receipt instances 和跨 family repeated no-regression evidence。该 projection 只读、refs-only，不写 visual truth、artifact blob 或 memory body，不声明 production soak complete，也不实现 OPL generic runtime、workbench 或 observability。

RCA 现在也暴露 `opl_substrate_adapter_export`：这是 RCA domain-owned OPL substrate adapter/export surface，只把 workspace/source/artifact/memory 的 locator、index、lifecycle 与 operator projection refs 投给 OPL。它是 opaque/index-only export，不导出 visual truth、layout/review/export verdict、deliverable artifact body、visual memory body 或 owner receipt authority；OPL 只能索引这些 refs 并路由回 RCA owner surface，不能把 refs 提升成 visual-ready、exportable、handoffable 或 memory accept/reject verdict。

当前 deliverable facade 只覆盖已存在的 `ppt_deck` 与 `xiaohongshu` surface；默认 truth surface 是 `buildOplStageExecutionPlan` / `opl_stage_execution_plan`，显式 stage rerun 继续使用 `runDeliverableRoute`，审计与投影继续使用 `createDeliverable`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`。旧 repo-local deliverable runner、run store 和 DAG scheduler 已从 active runtime package 物理删除。

当前仓内可执行的 runtime 基线按三层 owner 收口：

- `RedCube AI` 维护 visual-domain truth、本地 canonical artifacts、稳定 capability surface，以及 audit / review / projection surface
- 第一公民 concrete executor 继续由 `Codex CLI` 通过统一 executor-adapter contract 被选择
- OPL hosted integration 只作为 OPL 侧 product-managed adapter/projection layer 管理 family runtime provider、registration/status 索引、doctor/repair/resume 与 native helper catalog
- `Hermes-Agent` 只在显式 hosted/proof backend、legacy provider 或技术参考层作为外部 runtime substrate 出现；Temporal 是 OPL production online runtime 的必需 provider

## 入口 taxonomy 与 OPL handoff

当前这条主线需要区分三层入口：

- `direct product entry`
  - 第一公开主语是单一 `redcube-ai` app skill；`CLI` / `MCP` 提供可验证协议入口，`status` 只作为 skill 下的 machine-readable product-entry overview / intake / entry-shell contract，`session` 负责续跑
- `OPL-hosted handoff`
  - 给 OPL family-level caller 使用的 handoff contract；`OPL` 只承担 family-level session/runtime/projection 与 shared modules/contracts/indexes，且只作为 hosted integration surface
- `OPL-compatible package surface`
  - RedCube Foundry Agent 对 OPL Framework 暴露的 package 形态：app skill、service-safe domain entry、product sidecar/projection、stage control projection 与 standard domain-agent skeleton mapping；该层只负责 compatibility/discovery/handoff，不承担 visual-domain authority
- `future product shell`
  - 给成熟最终用户前台壳预留的未来产品层；不表示 RCA 重新维护 generic managed runtime

当前真实状态里，direct route、OPL-hosted handoff 与 OPL-compatible package surface 已经 repo-verified；剩余完善不再是旧 runtime 结构差距，而是 production visual-stage evidence、真实 owner receipt / memory lifecycle receipt 和少量历史命名/合同卫生。

已经冻结的 direct domain 级链路是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

与 `OPL` 的家族级衔接则必须收敛到同一条下游形态：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

`OPL -> RedCube` 的最小 handoff envelope 至少包括：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层 envelope 之上，`RedCube AI` 再补充：

- `entry_session_contract`
- `delivery_request`
- 以及其中的 `deliverable_family`、`topic_id`、`deliverable_id` 这类 domain payload

## 最终目标形态

当前已经冻结的 ideal target 不是让 `RedCube AI` 自己变成 runtime 平台，而是让它收敛成一个可直接进入、也可被 `OPL` 内部桥接调用的 visual-domain 产品 / 服务节点：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

与之对应的 direct domain 路线则是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

这里的关键约束是：

- direct `RedCube` product entry 和 OPL hosted integration 必须共用同一个 downstream domain-agent entry（service-safe domain entry）contract
- OPL hosted integration 只消费 product-entry registration、hosted invocation、session continuity、runtimeWatch、artifact inventory、review/publication projection，不创建第二套 RedCube truth
- product sidecar adapter 只把这些 RCA-owned surfaces 投影给 OPL provider；family runtime provider 是 24h online substrate / wakeup substrate，OPL 是 typed family queue / control plane，RCA 继续持有 visual-domain truth、review/publication projection 与 artifact authority
- today repo-verified 的 public domain-entry service surface 是 `invokeProductEntry` / `getProductEntrySession`
- `invokeOplHostedProductEntry` 继续作为 internal OPL integration contract
- 成熟的最终用户产品入口前台壳仍未落地

## Hermes-Agent、RedCube AI 与 concrete executor 的分工

`Hermes-Agent` 在 `RedCube AI` 当前主线里只作为显式 hosted/proof backend 或技术参考载体；启用时可承担：

- session / run / watch / memory / scheduling
- gateway / messaging / interrupt / resume
- family 级长期在线 runtime substrate

当前第一公民 concrete executor 是 `Codex CLI host-agent runtime`。在 OPL stage-led runtime framework 中，它也是未显式选择 hosted/proof backend 时的最小具体执行单元，负责：

- 默认 agent execution lane
- 受保护创作 stage 的结构化生成执行
- 作为 `codex_cli` adapter 的 concrete runtime

`RedCube AI` 自己继续持有：

- `gateway -> family -> profile -> pack` 这条 domain 主链
- visual deliverable 的对象边界、审计、review / publication projection
- executor routing contract
- `pack` 作为 domain boundary / pack-id 载体的语义真相

当前 executor-adapter contract 也已经冻结成统一口径：

- public executor backend 固定为 `codex_cli` 与 `hermes_agent`
  - active surfaces 不保留退役 adapter alias
  - `hermes_agent` 只表示显式 full-agent-loop proof backend
- `execution_shape` 固定为 `structured_call` 与 `agent_loop`
  - 显式 HTML route 的 `render_html` 默认 `structured_call`
  - 显式 HTML repair route 的 `fix_html` 默认先 `structured_call`，复审仍要求回修时最多升级一次 `hermes_agent + agent_loop`
  - `simple_llm` 与 `openai_compatible_gateway` 不作为 RedCube 一等 backend
- 默认正式 backend 是 `codex_cli`
  - 它对应本机 Codex CLI autonomous runtime
- 备选 proof backend 是 `hermes_agent`
  - 只有 caller 显式传 Hermes proof adapter，或 `fix_html` escalation policy 触发时才会启用
  - 当前已经对齐到 `ppt_deck`、`xiaohongshu`、`poster_onepager` 三个 family
  - 底层不是单轮 chat relay，而是 external Hermes-Agent loop bridge
  - 默认 model / reasoning 继承本机 Hermes 默认配置，不在 repo 内 pin 死

这意味着 RedCube 现在的 family runtime 并不是“写死 Codex-only”，而是：

`gateway -> runtime family contract -> executor adapter -> concrete agent runtime`

其中：

- `runtime family contract` 继续定义 route、artifact、review surface 与 visual-domain truth
- `executor adapter` 只负责把这些 contract 下沉到具体执行器
- 第一公民主线仍是 Codex CLI；Hermes-Agent loop 先作为 opt-in proof lane 保持可选，不提前替换默认

`ppt_deck` runtime family 的 core 现在也按这个边界组织：`core.ts` 保留 route / lifecycle / visual-domain assembly，execution adapter、creative owner/source stamp、primary surface 和 structured artifact batch/executor helper 进入 `ppt-deck-runtime-family-parts/execution-adapters.ts`。这让 core 不再直接承载 executor/backend 分支，同时保持 public route、payload shape 和 runtime-family contract 不变。

当前还要额外冻结一个边界：

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现在统一走 `runtime-family + Codex CLI structured generation`
- repo-local `pack/compiler` 不再 author story / blueprint / visual direction / final visual artifact 这类创作真值
- `pack` 可以继续存在，但只能作为 typed shell、pack-id carrier 或非创作边界，不能再回退成脚本编译创作路径

因此，“接入 Hermes”不等于“所有视觉生成步骤都改成 Hermes 自己执行”。

更准确的目标是：

- 由 `RedCube AI` 统一稳定 capability surface 与 visual-domain truth
- 由 `Executor Adapter` 在 domain 内按 deliverable route 选择具体执行器；当前第一公民主线是 `Codex CLI`，`Hermes-Agent loop` 则以同 contract 下的 full-agent-loop proof lane 形式并挂
- 由 OPL stage-led hosted integration 统一长期托管、状态索引、doctor/repair/resume 与 native helper catalog；Temporal 是 OPL family runtime provider 的 production required substrate，未来自有 sidecar 只有在 provider abstraction 无法表达 task/wakeup/approval/audit/product isolation contract 时才进入 promotion 评估

## Language Target

RCA 的长线实现语言目标是 `TypeScript + Python`：

- `TypeScript` 继续承担 product entry、CLI/MCP、contracts、gateway、runtime-family shell、typed service boundaries 与测试主干。
- `Python` 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，以及可与 MAS/MAG 共享的自动化工具链；当前 repo-tracked helper catalog 是 `contracts/runtime-program/python-native-helper-catalog.json`。
- `ppt_deck` 当前默认 visual route 是 `author_image_pages`：runtime 继续持有叙事、大纲、蓝图和视觉导演稿，页面视觉通过 Responses `image_generation` 生成完整 16:9 PNG，并继续进入 `visual_director_review`、`screenshot_review` 与 `export_pptx`。HTML `render_html/fix_html` 与 native editable PPTX `author_pptx_native/repair_pptx_native` 是生产可选、显式选择路线；native PPT 只在用户要求可编辑 / 原生 PPTX / DrawingML 时作为可编辑交付路线启用。
- `xiaohongshu` 当前默认 visual route 也收敛到 `author_image_pages`：runtime 持有 source truth、故事线、单篇策划与视觉导演稿，GPT-Image-2 生成完整 3:4 PNG note pages，随后进入 `visual_director_review`、`screenshot_review`、必要时 `repair_image_pages`，最后由 `publish_copy` 与 `export_bundle` 产出发布文案、PNG 序列和 manifest。`render_html/fix_html` 只作为显式 HTML authoring lane，用于确定性网页稿或历史 HTML 维护。

## Service-Safe Domain Entry

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/gateway` `invokeDomainEntry`
- MCP tool: `invoke_domain_entry`

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

## Product Entry Service Surface

当前 repo-verified 的 product-entry service surface 是：

- contract: `contracts/runtime-program/redcube-product-entry-mvp.json`
- hosted integration contract: `contracts/runtime-program/opl-framework-hosted-product-entry.json`（文件名保留历史 provenance）
- managed hardening contract: `contracts/runtime-program/managed-product-entry-hardening.json`
- callable surfaces:
  - `@redcube/gateway` `invokeProductEntry`
  - `@redcube/gateway` `invokeOplHostedProductEntry`（OPL-hosted integration）
  - `@redcube/gateway` `getProductEntrySession`

它们继续把执行下沉到同一个 `invokeDomainEntry`，同时把 session continuity 持久化到用户级 runtime-state，而不是把 product entry 写成 repo-local runtime 自己的新宿主。

公开 MCP product-entry route 只承载 `family_action_catalog` 中的 action。`invokeOplHostedProductEntry` 仍是 internal OPL-hosted integration callable surface，供 OPL handoff contract 使用，不作为 `redcube_product_entry` MCP action key 暴露。

## Python Native Helper Surface

当前 repo-owned Python helper surface 是 package-module-only：

- catalog: `contracts/runtime-program/python-native-helper-catalog.json`
- invocation: `python -m redcube_ai.<helper_module>`
- proof lane: `contracts/runtime-program/ppt-native-authoring-proof-lane.json`

退役的 thin wrapper 包括 `packages/redcube-runtime/scripts/ppt_deck_review.py`、`packages/redcube-runtime/scripts/ppt_deck_export.py`、`packages/redcube-runtime/scripts/ppt_deck_native.py` 与 `python/redcube_ai/hermes/agent_loop_bridge.py`。这些路径不得作为 active caller、contract anchor 或 compatibility layer 恢复；no-active-caller proof 与 retired-surface guard 由 native helper catalog tests 和 retired surface guard 维护。

## 结构角色

### 1. Public docs

- `README*`
- `docs/README*`

这层负责对外说明项目是什么、当前主线在哪里、如何理解 formal-entry 与 product role。

### 2. Core maintainer docs

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`

这层负责 AI / 维护者快速建立上下文。

### 3. Machine-readable runtime program

- `contracts/runtime-program/current-program.json`
- `contracts/runtime-program/*.json`

这层负责活跃主线指针、absorbed tranche、follow-on board 与 provenance contract。

### 4. Program briefs

- `docs/active/*.md`
- `docs/history/phase-2/*.md`

这层负责与 contracts 对应的人类可读 tranche brief，不是默认公开首页叙事。

### 5. Stable rules and references

- `docs/policies/*`
- `docs/references/*`

这层分别承载稳定规则和非活跃参考材料。

### 6. Lifecycle reading layers

- `docs/product/*`
- `docs/runtime/*`
- `docs/delivery/*`
- `docs/source/*`

这层按 product、runtime、delivery 与 source 生命周期职责承载人类可读说明。机器可读合同继续使用 contract/schema/source/artifact 路径或 `human_doc:*` 语义 ID，不把这些 Markdown 路径当成稳定 API。
