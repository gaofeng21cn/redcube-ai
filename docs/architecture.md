# RedCube AI 架构

Owner: `RedCube AI`
Purpose: `current_architecture_and_owner_boundary`
State: `current_truth`
Machine boundary: 人读架构说明。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

对外主语：`RedCube AI` 是独立 visual-deliverable Foundry Agent；公开发布形态是 built on `OPL Framework` 的 `OPL-compatible package`。`gateway / harness` 仅保留为内部架构边界语言。

## 主链路

当前对外主链路以 direct route 为第一主语，OPL 路线保留为 hosted integration surface。OPL 是 stage-led 的完整智能体运行框架，可以托管 RCA，但它不是 RCA 的第一公开身份：

- direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- OPL-hosted route：`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

在 OPL stage-led family framework 中，这两条路线都可以被投影为 stage attempt，但 RCA owner 边界不变：OPL 只提供 stage descriptor discovery、queue/wakeup、handoff、receipt、approval/retry、trace/projection；RedCube 持有视觉 route truth、review/export gate、canonical artifacts 和 visual-domain quality 判断。
`contracts/foundry_agent_series.json` 和 resolved `contracts/domain_descriptor.json` 中的 `series_design_profile` 是这条边界的机器可读外显，且与 MAS/MAG/OMA 使用同一 canonical `opl_foundry_agent_series_design_profile.v1`：共同 lifecycle、generic input/output slots、stage pack sections、closeout shape 和 authority invariants 不随 domain 改写。RCA 的视觉资料输入、visual stage pack、PPT/PDF/PNG/export bundle 输出和视觉 authority 函数写在 `domain_specific_profile`、stage/action contracts 与 authority refs 中。该 profile 不改变 runtime substrate，不创建 RCA 私有 lifecycle，也不把 OPL provider completion升级为 visual ready、exportable、handoffable 或 domain ready。

两条路线在进入 `invokeDomainEntry` 之后，继续按同一条执行链工作：

`service-safe domain entry -> executor adapter -> concrete executor -> audit / review / publication projection`

当前 route equivalence 的可验证边界由 product-entry manifest 暴露：`status`、`invoke`、`session continuation` 与 internal OPL integration 的共享真相面固定为 `domain_entry_surface`、`session_continuity`、`progress_projection`、`artifact_inventory`、`runtime_loop_closure`、`review_state`、`publication_projection`。这条边界只证明多入口落到同一 deliverable/runtime truth，不创建第二公开 skill，也不创建第二套运行语义；direct/default product-entry 的 runtime owner 是 `configured_family_runtime_provider`，默认 task intent label `run_opl_stage_execution_plan` 返回 `opl_stage_execution_plan`，由 OPL provider 持有 stage attempt runtime / attempt ledger。这里的 label 不表示 RCA 继续维护 repo-local managed runtime；Codex CLI 是 provider/executor adapter 可选的第一公民 concrete executor，显式 Hermes proof lane 才声明 `upstream_hermes_agent`。
这里的 `status` 是 agent-facing product-entry overview / intake / entry-shell contract；当前 repo-local `redcube product` CLI 只保留 `invoke` direct domain target，product status / session / manifest wrapper 由 OPL generated/default caller 持有。该 status surface 不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。
`family_action_catalog` 是 RCA-owned callable action metadata 单一声明面；repo-root OPL standard pack 把它与 stage、memory、artifact、receipt 和私有功能审计一起声明为 OPL pack compiler 输入。`OPL` 从该 pack 生成统一 CLI / MCP / Skill / product-entry / tool descriptor bundle，RCA 现有 CLI、MCP/product-entry commands、`invokeDomainEntry`、`domain-handler export|dispatch` 和 local scripts 作为 generated descriptors 指向的 action target / authority function。OPL 侧 descriptor 可以继续使用 `domain_action_adapter` 作为 generated surface id；RCA active/default repo-local callable surface 是 domain handler target。`OPL` 只读取该 pack/catalog 做 family-level discovery/export/parity，不写 RedCube visual-domain truth、stage-run truth、review/publication projection 或 canonical artifacts。Product-entry MCP public routes只暴露 catalog actions；`invokeOplHostedProductEntry` 保留为 internal OPL integration contract，不作为公开 MCP action。
`agent/` 是 repo-source canonical Declarative Visual Pack：`agent/prompts/*.md` 持有六个 family stage 的 canonical prompt policy，`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 stage、skill、quality gate 和 knowledge 边界。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 只作为 detailed legacy prompt assets 被 canonical prompt policy 定位，不能作为 `stage_control_plane.prompt_refs` 的直接目标。`contracts/pack_compiler_input.json` 用 `required_domain_pack_paths` 锁住完整 pack 文件，OPL generated surfaces 只消费这些 refs。
`redcube domain-handler export --workspace-root <dir> --format json` 是给 OPL typed family queue / OPL family runtime provider 在线唤醒使用的 RCA domain handler refs-only projection；`redcube domain-handler dispatch --task <task.json> --format json` 只接受 RCA-owned guarded domain handler actions：`emit_no_regression_evidence`、`emit_temporal_controlled_visual_stage_long_soak_evidence`、`emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`、`evaluate_visual_transition`、`emit_workspace_receipt_proof`、`emit_external_work_order_owner_closeout`、`notification_receipt`。其中 `emit_temporal_controlled_visual_stage_long_soak_evidence` 只接收 OPL/Temporal attempt、retry/dead-letter、requery/resume、provider residency、独立 stage execution AI / quality AI task、RCA owner receipt、review/export 和 forbidden-write refs，并写 workspace runtime evidence ref；它不写 visual truth、artifact body、memory body 或 review/export verdict，也不声明 production visual-stage long soak complete。这些 guarded actions 与 forbidden writes 来自 canonical action metadata，并同步到 manifest、family action catalog、OPL-generated `domain_action_adapter` descriptor refs 和 CLI/MCP guards。`runtime_watch` 已从 default generated `domain_action_adapter` dispatch/action 面退役；progress / watch 由 OPL status / workbench / runtime read model 消费 RCA direct `runtimeWatch` read surface。旧 managed supervision action 与 `product_entry_continuation` 已从 default generated `domain_action_adapter` dispatch/action 面物理删除/收薄；旧 managed run lookup action / 旧 managed supervision action 也已从 public MCP/CLI/gateway surface 退役。generic supervision / continuation 归 OPL runner/session shell，RCA direct product-entry/session API 与内部 visual authority surfaces 不作为 standard `domain_action_adapter` template 或 default generated surface。RCA domain handler 不写 visual truth、canonical artifacts、review verdict 或 publication gate。
`standard_domain_agent_skeleton` 是 RCA 对 OPL standard domain-agent skeleton 的 manifest mapping 与低风险 repo-source follow-through：repo-source 边界限定为 `agent / contracts / runtime / docs`，runtime 只声明 domain handler target、projection builder、lifecycle adapter、visual transition spec/evaluator、owner receipt contract、domain memory locator 和 workspace receipt inventory read model；真实 PNG/PPTX/PDF、receipt 实例和 export bundle 继续落在 workspace/runtime artifact root，并通过 `artifact_locator_contract`、OPL-generated `domain_action_adapter` receipt refs、`domain_owner_receipt_contract`、`controlled_memory_apply_proof/runtime_receipt_instances`、`visual_transition_evaluator` 与 `workspace_receipt_inventory_projection` 暴露 ref。
`stage_control_projection` 是给 OPL family Stage Control Plane 的 descriptor 和 stage-plan adapter：它把 RCA 已有 `ppt_deck`、`xiaohongshu`、`poster_onepager` route stages 投影到 `source_intake`、`communication_strategy`、`visual_direction`、`artifact_creation`、`review_and_revision`、`package_and_handoff` 等 family stage kinds，并允许 OPL provider 基于 `opl_stage_execution_plan` 调度 stage attempts。product-entry manifest 中的每个 stage descriptor 都包含 goal、owner、skills、allowed_action_refs、handoff、source refs、freshness、stage-to-action parity 与 authority boundary，供 OPL 真实 discovery smoke 消费；它不改变 hydrated `stage_sequence`，不持有 RedCube visual truth、review owner 或 artifact authority。Codex App direct skill 调用与 OPL 托管调用必须在 `invokeDomainEntry` / product-entry command contract 后收敛。
当前 `stage_control_projection.prompt_refs` 只指向 `agent/prompts/*.md` 的 canonical stage prompt policy；详细 prompt 全文和 family-specific route wording 通过 `legacy_prompt_asset_refs` 与 `agent/prompts` 内的 locator 继续指向 `prompts/ppt_deck/` 和 `prompts/xiaohongshu/`。

这四个 surface 合起来构成当前发布 package：single `redcube-ai` app skill 是用户/Agent 入口，`invokeDomainEntry` 是 service-safe domain entry，RCA `domain-handler export|dispatch` 是 OPL provider 和 family queue 的可读/受控派发目标，OPL-generated `domain_action_adapter` descriptor/projection 是框架侧 wrapper id，`stage_control_projection` 是 OPL Stage Control Plane 的只读 stage descriptor。它们全部指向同一 downstream RCA domain truth；RCA 继续独立持有 visual truth、route owner、review/export verdict 和 artifact authority。

RCA functional closure 的新增生产边界是：`domain_owner_receipt_contract` 统一 domain receipt、typed blocker 与 no-regression evidence return shape；`lifecycle_guarded_apply_proof` 覆盖 cleanup/restore/retention 的 guarded apply 语义；`visual_transition_spec` 声明 RCA-owned transition table、guard contract、oracle fixture 与 owner action；`visual_transition_evaluator` 只按显式 guard refs 返回 next-stage metadata、repair action、owner receipt / no-regression refs 或 typed blocker；`physical_skeleton_follow_through` 证明 `agent/ contracts/ runtime/ docs/` 入口可被 OPL 消费；`review_helper_baseline_follow_through` 记录 PPT review helper 的 baseline removal、geometry audit / markdown report 与 summary projection 拆分。这些 surface 仍是 RCA-owned projection，不把 visual truth、review/export verdict、canonical artifact 或 memory body 移给 OPL；generic transition runner、retry/dead-letter、route graph、workbench 和 provider attempt ledger 继续由 OPL 持有。

当前 domain_action_adapter runtime apply surface 已包含 `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`、`emit_workspace_receipt_proof` 和 `emit_external_work_order_owner_closeout`。这些都属于 RCA-owned workspace/runtime surface：写入和返回的是 workspace runtime refs、domain receipt、typed blocker、no-regression evidence、memory receipt refs、lifecycle mutation receipt、proof pack 或外部 work-order closeout evidence；RCA 继续持有 visual truth、review/export verdict、memory body、canonical artifacts 和 artifact mutation authority。`emit_external_work_order_owner_closeout` 专门消费 OPL execution receipt、absorbed head、target verification refs、patch absorption / cleanup refs 与 no-forbidden-write refs，并返回 RCA-owned refs-only `no_regression_evidence` 或 `typed_blocker`；它不签发 artifact-producing visual owner receipt，也不声明 visual ready、exportable、handoffable 或 production soak complete。`workspace_receipt_inventory_projection` 只读这些 runtime receipt refs，供 OPL/App/operator 索引当前 workspace 的 receipt coverage；它不是 artifact gallery、workbench 或 production evidence producer。OPL-hosted path 只能消费 locator、projection、receipt refs、operator projection 和 repair hints，不能把 provider completion 或 stage metadata 升级成 RCA visual ready / exportable / handoffable verdict。真实 OPL Temporal controlled visual-stage long soak 当前仍未完成。

## Workspace / file lifecycle 结构

RCA repo-source 目录按标准 domain agent 职责分层：

- `agent/`：visual declarative pack，包含 stage prompts、stage policies、skill/knowledge refs 与 quality gate refs。
- `contracts/`：机器合同、schema、descriptor、locator/index contract、receipt ref contract 与 restore/retention policy。
- `runtime/authority_functions/`：最小 visual authority function 的 runtime-facing anchor；只暴露 action metadata、owner receipt refs、typed blocker refs、no-regression refs 或 guarded apply refs，不承载 runtime artifact root。
- `packages/`：RCA domain handler、AI-first authority adapter、receipt signer、typed blocker materializer 与 Python/native helper implementation；不能扩展成 generic runner、queue、session store 或 workbench。
- `docs/`：人读治理、当前状态、边界说明和 provenance，不作为机器接口。

真实 workspace/file lifecycle 由 OPL generic lifecycle primitive 与 RCA owner authority 分层完成。OPL 持有通用 locator/index、scheduler/runner/session/workbench shell、retention/restore orchestration、artifact gallery/handoff shell 与 projection；RCA repo source 只持有 refs、policy、schema 和 proof。真实 source workspace、PNG/PPTX/PDF/export bundle、runtime artifact、receipt instance、cache、venv、pycache、pytest cache 和 install sync 副产物必须落在 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`，不能写回开发 checkout。

RCA 的 authority 边界不因 refs-only lifecycle 上收而外移：visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 和 owner receipt 继续由 RCA owner surface 决定；OPL 只能消费 locator、receipt ref、typed blocker 或 no-regression evidence。

RCA 现在消费 OPL `family_scheduler_replacement` projection：OPL 持有 family scheduler、daemon 和 generic lifecycle owner；RCA 不在仓内实现 generic scheduler/runtime manager。旧 repo-local managed DAG scheduler 已物理删除；当前视觉 stage 顺序只通过 hydrated deliverable contract、`family_stage_control_plane` 和 `opl_stage_execution_plan` 暴露为 route-handler refs。

RCA 也消费 OPL stability read-model projection：`opl_stability_read_model_consumption` 只挂 OPL `family-conflict-envelope`、`control_loop_summary`、`usage_projection`、`resource_pressure`、`runtime observability-export` 和 external stability policy 的 refs。它让 OPL/App/operator 能看到 RCA stage refs、owner receipt refs、typed blocker/no-regression evidence refs 和已观测资源压力信号；它不执行 domain action、不写 RCA domain truth、不授权 visual-ready / quality / export verdict、不写 artifact blob 或 memory body，也不把 generic fallback、字符串 retry、event bus 或 runtime adapter started 写成成功语义。

RCA 现在也暴露 `operator_evidence_readiness_projection`：这是 RCA-owned read-only operator surface，从 `no_regression_owner_receipt_opl_consumption_proof`、`domain_owner_receipt_contract`、`controlled_memory_apply_proof/runtime_receipt_instances`、`lifecycle_guarded_apply_proof`、`controlled_soak_no_regression_attempt`、`workspace_receipt_inventory_projection`、`opl_generic_primitive_consumption/functional_harness_consumer_coverage` 与 `opl_stability_read_model_consumption` 派生。它给 OPL/App/operator 展示 next evidence gaps，包括真实 artifact-producing owner receipt、真实 OPL-hosted controlled visual-stage long soak、真实 memory/lifecycle receipt instances 和跨 family repeated no-regression evidence。该 projection 只读、refs-only，不写 visual truth、artifact blob 或 memory body，不声明 production soak complete，也不实现 OPL generic runtime、workbench 或 observability。

RCA 现在也暴露 `rca_efficiency_handoff_projection`：这是给 OPL Agent Lab 的 refs-only efficiency suite input，来源是现有 runtime/session/artifact/review/export refs，包括 duration、cost、cache、reuse、render execution、screenshot review gate 和 export result。它的 suite kind 是 OPL Agent Lab `standard`，不引入 RCA-specific suite kind。该投影只允许 OPL Agent Lab 比较效率与编排可观察性；quality floor refs 继续指向 RCA-owned screenshot review、review/export gate、artifact authority、visual memory authority 和 owner receipt surface。OPL Agent Lab 不能写 RCA visual truth、artifact blob 或 memory body，不能授权 quality verdict、visual ready、exportable 或 handoffable。

RCA 现在也暴露 `opl_substrate_adapter_export`：这是 RCA domain-owned OPL substrate adapter/export surface，只把 workspace/source/artifact/memory 的 locator、index、lifecycle 与 operator projection refs 投给 OPL。它是 opaque/index-only export，不导出 visual truth、layout/review/export verdict、deliverable artifact body、visual memory body 或 owner receipt authority；OPL 只能索引这些 refs 并路由回 RCA owner surface，不能把 refs 提升成 visual-ready、exportable、handoffable 或 memory accept/reject verdict。

当前 deliverable facade 只覆盖已存在的 `ppt_deck` 与 `xiaohongshu` surface；默认 truth surface 是 `buildOplStageExecutionPlan` / `opl_stage_execution_plan`，显式 stage rerun 继续使用 `runDeliverableRoute`，审计与投影继续使用 `createDeliverable`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`。旧 repo-local deliverable runner、run store 和 DAG scheduler 已从 active runtime package 物理删除。

当前仓内可执行的 runtime 基线按三层 owner 收口：

- `RedCube AI` 维护 visual-domain truth、本地 canonical artifacts、稳定 capability surface，以及 audit / review / projection surface
- 第一公民 concrete executor 继续由 `Codex CLI` 通过统一 executor-adapter contract 被选择
- OPL hosted integration 只作为 OPL 侧 product-managed adapter/projection layer 管理 family runtime provider、registration/status 索引、doctor/repair/resume 与 native helper catalog
- `Hermes-Agent` 只在显式 hosted/proof backend、非默认 executor adapter、proof lane 或技术参考层出现；Temporal 是 OPL production online runtime 的必需 provider

## 入口 taxonomy 与 OPL handoff

当前这条主线需要区分三层入口：

- `direct product entry`
  - 第一公开主语是单一 `redcube-ai` app skill；`CLI` / `MCP` 提供可验证协议入口，`status` 只作为 skill 下的 machine-readable product-entry overview / intake / entry-shell contract，`session` 负责续跑
- `OPL-hosted handoff`
  - 给 OPL family-level caller 使用的 handoff contract；`OPL` 只承担 family-level session/runtime/projection 与 shared modules/contracts/indexes，且只作为 hosted integration surface
- `OPL-compatible package surface`
  - RedCube Foundry Agent 对 OPL Framework 暴露的 package 形态：app skill、service-safe domain entry、RCA domain handler target、OPL-generated `domain_action_adapter` descriptor/projection、stage control projection 与 standard domain-agent skeleton mapping；该层只负责 compatibility/discovery/handoff，不承担 visual-domain authority
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
- RCA domain handler target 只把这些 RCA-owned surfaces 投影给 OPL provider；OPL-generated `domain_action_adapter` wrapper 是框架侧 descriptor，不是 RCA repo-local active/default wrapper。family runtime provider 是 24h online substrate / wakeup substrate，OPL 是 typed family queue / control plane，RCA 继续持有 visual-domain truth、review/publication projection 与 artifact authority
- today repo-verified 的 public domain-entry service surface 是 `invokeProductEntry` / `getProductEntrySession`
- `invokeOplHostedProductEntry` 继续作为 internal OPL integration contract
- 成熟的最终用户产品入口前台壳仍未落地

## Hermes-Agent、RedCube AI 与 concrete executor 的分工

`Hermes-Agent` 在 `RedCube AI` 当前主线里只作为显式 hosted/proof backend、非默认 executor adapter 或技术参考载体。它不承担 RCA 默认 runtime owner，也不承担 OPL production online runtime substrate；OPL production online substrate 固定为 Temporal-backed family provider。

启用 `hermes_agent` 时，它只能在显式 proof / agent-loop lane 内承担一次具体 executor session 的连接、生命周期、回执和审计：

- session / run / watch events 的 executor-side proof
- tool / message / interrupt / resume 能力的 opt-in proof
- fail-closed receipt 与 no-regression evidence

当前第一公民 concrete executor 是 `Codex CLI host-agent runtime`。在 OPL stage-led runtime framework 中，它也是未显式选择 hosted/proof backend 时的最小具体执行单元，负责：

- 默认 agent execution lane
- 受保护创作 stage 的结构化生成执行
- 作为 `codex_cli` adapter 的 concrete runtime

`RedCube AI` 自己继续持有：

- route family、profile / pack descriptor、domain action catalog 与 service-safe domain entry 之间的 visual-domain 语义边界
- visual deliverable 的对象边界、审计、review / publication projection
- executor routing contract
- `pack` 作为 descriptor / pack-id carrier 的语义真相；它不得回退成旧 gateway、retired public entry、federation 或 repo-local managed runtime owner

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
  - production route 失败策略默认 `fail_closed`，不会静默回 Codex 或静默替换 Codex
- 备选 proof backend 是 `hermes_agent`
  - 只有 caller 显式传 Hermes proof adapter，或 `fix_html` escalation policy 触发时才会启用
  - 当前已经对齐到 `ppt_deck`、`xiaohongshu`、`poster_onepager` 三个 family
  - 底层不是单轮 chat relay，而是 external Hermes-Agent loop bridge
  - 默认 model / reasoning 继承本机 Hermes 默认配置，不在 repo 内 pin 死
  - `fallback_with_proof` 只允许 `lane=experimental_proof`，且必须显式声明回到 effective default executor；它不表示 Hermes 与 Codex 在质量或行为上等价

这意味着 RedCube 现在的 family runtime 并不是“写死 Codex-only”，而是：

`service-safe domain entry -> runtime family contract -> executor adapter -> concrete agent runtime`

其中：

- `runtime family contract` 继续定义 route、artifact、review surface 与 visual-domain truth
- `executor adapter` 只负责把这些 contract 下沉到具体执行器
- 第一公民主线仍是 Codex CLI；Hermes-Agent loop 只作为 opt-in proof lane 保持可选，不替换默认 executor，也不替代 OPL Temporal-backed provider

`ppt_deck` runtime family 的 core 现在也按这个边界组织：`core.ts` 保留 route / lifecycle / visual-domain assembly，execution adapter、creative owner/source stamp、primary surface 和 structured artifact batch/executor helper 进入 `ppt-deck-runtime-family-parts/execution-adapters.ts`。这让 core 不再直接承载 executor/backend 分支，同时保持 public route、payload shape 和 runtime-family contract 不变。

当前还要额外冻结一个边界：

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现在统一走 `runtime-family + Codex CLI structured generation`
- repo-local `pack/compiler` 不再 author story / blueprint / visual direction / final visual artifact 这类创作真值
- `pack` 可以继续存在，但只能作为 typed shell、pack-id carrier 或非创作边界，不能再回退成脚本编译创作路径

因此，“接入 Hermes”不等于“所有视觉生成步骤都改成 Hermes 自己执行”。

更准确的目标是：

- 由 `RedCube AI` 统一稳定 capability surface 与 visual-domain truth
- 由 `Executor Adapter` 在 domain 内按 deliverable route 选择具体执行器；当前第一公民主线是 `Codex CLI`，`Hermes-Agent loop` 则以同 contract 下的 full-agent-loop proof lane 形式并挂
- 由 OPL stage-led hosted integration 统一长期托管、状态索引、doctor/repair/resume 与 native helper catalog；Temporal 是 OPL family runtime provider 的 production required substrate，未来自有 domain_action_adapter 只有在 provider abstraction 无法表达 task/wakeup/approval/audit/product isolation contract 时才进入 promotion 评估

## Language Target

RCA 的长线实现语言目标是 `TypeScript + Python`：

- `TypeScript` 继续承担 product entry、CLI/MCP、contracts、domain entry package/protocol boundary、runtime-family shell、typed service boundaries 与测试主干。
- `Python` 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，以及可与 MAS/MAG 共享的自动化工具链；当前 repo-tracked helper catalog 是 `contracts/runtime-program/python-native-helper-catalog.json`。
- `ppt_deck` 当前默认 visual route 是 `author_image_pages`：runtime 继续持有叙事、大纲、蓝图和视觉导演稿，页面视觉通过 Codex executor 原生 imagegen 任务生成完整 16:9 PNG，并继续进入 `visual_director_review`、`screenshot_review` 与 `export_pptx`。RCA 不直接读取 Base URL / API key 调 provider；HTML `render_html/fix_html` 与 native editable PPTX `author_pptx_native/repair_pptx_native` 是生产可选、显式选择路线；native PPT 只在用户要求可编辑 / 原生 PPTX / DrawingML 时作为可编辑交付路线启用。
- native editable PPTX 的架构边界固定为 `RCA AI-first design pack -> editable_shape_plan -> officecli writer / validator -> LibreOffice / Poppler true render QA -> RCA visual_director_review -> screenshot_review -> export_pptx`。设计 pack 与 `editable_shape_plan` 由 AI executor 持有创作真相；officecli/Python helper 只物化、校验、渲染、导出 refs 和 fail-closed blocker，不能选择模板、补设计或授权视觉质量。AgentLab 只能读取 suite refs、terminal refs 和 non-regression refs；mock provider / deterministic fixture 只能证明 plumbing 与 fail-closed wiring，不能作为视觉样片或 RCA verdict。真实样片、PPTX/PDF/PNG、shape manifest、review/export receipt 和 probe report 必须落到 workspace / runtime artifact root，例如 `/Users/gaofeng/workspace/projects/redcube-ai/runtime-state/`，不进入 repo-tracked source。
- `xiaohongshu` 当前默认 visual route 也收敛到 `author_image_pages`：runtime 持有 source truth、故事线、单篇策划与视觉导演稿，由 Codex executor 原生 imagegen 任务生成完整 3:4 PNG note pages，随后进入 `visual_director_review`、`screenshot_review`、必要时 `repair_image_pages`，最后由 `publish_copy` 与 `export_bundle` 产出发布文案、PNG 序列和 manifest。`render_html/fix_html` 只作为显式 HTML authoring lane，用于确定性网页稿或历史 HTML 维护。

## Service-Safe Domain Entry

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/domain-entry` `invokeDomainEntry`
- MCP tool: `invoke_domain_entry`

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

## Product Entry Service Surface

当前 repo-verified 的 product-entry service surface 是：

- contract: `contracts/runtime-program/redcube-product-entry-mvp.json`
- hosted integration contract: `contracts/runtime-program/opl-framework-hosted-product-entry.json`（文件名保留历史 provenance）
- managed hardening contract: `contracts/runtime-program/managed-product-entry-hardening.json`
- callable surfaces:
  - `@redcube/domain-entry` `invokeProductEntry`
  - `@redcube/domain-entry` `invokeOplHostedProductEntry`（OPL-hosted integration）
  - `@redcube/domain-entry` `getProductEntrySession`

它们继续把执行下沉到同一个 `invokeDomainEntry`，同时把 session continuity 持久化到用户级 runtime-state，而不是把 product entry 写成 repo-local runtime 自己的新宿主。

公开 MCP product-entry route 只承载 `family_action_catalog` 中的 action。`invokeOplHostedProductEntry` 仍是 internal OPL-hosted integration callable surface，供 OPL handoff contract 使用，不作为 `redcube_product_entry` MCP action key 暴露。

## Python Native Helper Surface

当前 repo-owned Python helper surface 是 package-module-only：

- catalog: `contracts/runtime-program/python-native-helper-catalog.json`
- invocation: `python -m redcube_ai.<helper_module>`
- proof lane: `contracts/runtime-program/ppt-native-authoring-proof-lane.json`

退役的 thin wrapper 包括 `packages/redcube-runtime/scripts/ppt_deck_review.py`、`packages/redcube-runtime/scripts/ppt_deck_export.py`、`packages/redcube-runtime/scripts/ppt_deck_native.py` 与 `python/redcube_ai/hermes/agent_loop_bridge.py`。这些路径不得作为 active caller、contract anchor 或 compatibility layer 恢复；no-active-caller proof 与 retired-surface guard 由 native helper catalog tests 和 retired surface guard 维护。

## 文档结构角色

RCA 文档结构按 `docs/docs_portfolio_consolidation.md` 维护。架构读者只需要记住当前六层：

| 层 | 当前职责 |
| --- | --- |
| `README*` / `docs/README.md` | 入口与导航，先说明 RCA visual-deliverable 身份，再说明 OPL-hosted 集成路径。 |
| 核心五件套 | `project`、`status`、`architecture`、`invariants`、`decisions` 持有当前项目角色、架构边界、约束、决策和状态读法。 |
| Machine truth | `contracts/`、schema、source、CLI/MCP/API 行为、workspace/runtime artifacts、owner receipts 与 review/export gates。 |
| Lifecycle owner docs | `docs/product/`、`docs/runtime/`、`docs/delivery/`、`docs/source/`、`docs/policies/` 解释当前工作面和稳定规则。 |
| Active plan | `docs/active/` 只保留当前差距、完成门槛和迁移台账；当前唯一 completion plan 是 `rca-ideal-state-gap-plan.md`。 |
| References / History | `docs/references/` 保留仍支撑当前合同或目标态的参考；`docs/history/` 保存 absorbed tranche、旧路线、tombstone 和 provenance。 |

历史 tranche brief、旧 follow-on board、proof 命令流水和旧 program 材料不再作为当前架构层。机器可读合同继续使用 contract/schema/source/artifact 路径或 `human_doc:*` 语义 ID，不把 Markdown 路径当成稳定 API。
