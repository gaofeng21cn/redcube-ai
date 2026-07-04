# RedCube AI 当前状态

Owner: `RedCube AI`
Purpose: `current_status_and_gap_readout`
State: `current_truth`
Machine boundary: 人读状态面。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

Last reviewed: `2026-06-12`

Plugin native profile pointer: `contracts/opl-native-profile.json` 只声明 OPL Flow / OPL Doc 插件同步与 drift 检查所需的 repo-native profile；它不是 visual truth、runtime truth、artifact authority、review/export verdict、owner receipt 或 production-ready 证据。

Live Evidence 后置 / 功能结构优先是 RCA 日常开发读法。repo-local session / domain_action_adapter / runtimeWatch / operator projection / route-run record adapter 的收薄或退役、generated/default caller cutover、strict source-purity、Stage Folder / artifact locator / review-repair transport 的功能边界和 no-resurrection guard，可以作为功能/结构 lane 先推进。Temporal controlled visual-stage long-soak、production-like repeated no-regression、真实 visual memory lifecycle receipt、human review success receipt、App/operator sustained consumption 和 production visual-stage evidence 属于后置 Live Evidence / production evidence lane；它们不反向阻塞可独立完成的结构清理，也不能由 conformance、mock route chain、provider completion、refs-only ledger 或 dated sample proof 替代为 visual ready、exportable、handoffable、domain ready 或 production ready。

Codex Developer Mode source pointer: 仓库根层 `.codex-plugin/plugin.json` 是 `rca-local` 指向 live developer checkout 时的 Codex plugin manifest 入口；它只把 Codex source root 固定到当前 `redcube-ai` repo，并通过 `./plugins/rca/skills/` 和 `./plugins/rca/assets/` 引用现有 RCA app skill scaffold。`plugins/rca/.codex-plugin/plugin.json` 继续作为 packaged/scaffold plugin payload 保留；repo-local `.agents/plugins/marketplace.json` 是已退役副产物，`scripts/install-codex-plugin.ts` 只校验 source 并清理旧副产物。Codex marketplace registration 由 OPL-owned wrapper 写入 `OPL_STATE_DIR/codex-plugin-marketplaces/rca-local`。该入口只解决 Codex plugin metadata/source channel 路径，不声明 visual ready、exportable、handoffable、domain ready 或 production ready。

## 当前角色

`RedCube AI` 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

RCA repo-local `redcube` CLI 的第一层公共语法现在暴露 OPL Foundry Agent series 读面：`redcube status|inspect|interfaces|validate|doctor|peers`，以及 `redcube foundry <operation>`、`redcube work <operation>` 和 deck-oriented alias `redcube deck <operation>`；根层 `npm run rca -- ...` 是指向同一 CLI 的 repo-native shorthand script，`--json` 是 Foundry series commands 的 `--format json` 别名。这些命令读取 `contracts/foundry_agent_series.json` 的 series identity、command spine、接口、peer 和 authority boundary，并把 `workspace -> work/deck -> stage -> run -> vault -> handoff -> connect` 作为 ordinary command spine；它们不替代 RCA-owned product/domain execution target，也不把 product status/session/manifest wrapper、generic workbench 或 generated descriptor owner 从 OPL 迁回 RCA。

OPL Framework 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 当前口径已收敛为 OPL generated/hosted wrapper/session/workbench/generic shell consumer；RCA 只保留 domain handler target、direct entry、refs-only adapter、minimal visual authority function 和 native helper implementation。旧 repo-local managed runtime 物理实现已删除，active source/package/test surface 不再保留内部 managed runtime fixture。

当前 `runDeliverableRoute` / route-local helper 只能作为 RCA visual route handler 和 artifact authority target 运行。默认执行必须携带 OPL-owned `cross_provider_attempt_index`，同时包含 `provider_attempt_owner=one-person-lab`、provider attempt ref、provider attempt ledger ref，以及 stage attempt / lease / receipt ref；缺失时返回 RCA typed blocker `missing_opl_stage_attempt`，且不创建 repo-local run/event state。`allowLocalDiagnosticRecord` 只允许 explicit refs-only diagnostic test 使用，不能作为默认执行 owner。

RCA 的标准 OPL Agent semantic pack 已归位到 `agent/`。`agent/prompts/*.md` 是 stage-level canonical prompt policy；`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 Declarative Visual Pack 的 repo-source 语义，其中 `agent/skills/*.md` 只读作 stage skill policy refs，不是 standalone Codex professional skills。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 继续作为 detailed implementation prompt assets，由 `agent/prompts/*.md` 定位；`contracts/stage_control_plane.json` 的 `prompt_refs` 只指向 `agent/prompts/*.md`。

当前 skill model 读法是三层：stage prompt 管 stage 怎么运行和返回哪些 receipts / refs；professional specialist skill 管跨 stage 可复用专业方法，例如 story architecture、visual direction、page authoring、review、native PPT design 和 template profiling；tool/helper 管 imagegen、screenshot/render、Office/PPT materialization、manifest、validation 和 export refs。RCA professional skills 先 repo-local 化，不新建外部 repo 或外部产品；工具和 helper 只提供 materialization / validation / export evidence，不能变成 skill，也不能替代 RCA visual truth、review/export verdict 或 owner receipt。

OPL family `Foundry Agent OS` 目标下，RCA 的 target delta 读 [RCA Foundry Agent OS 目标差异页](./active/foundry-agent-os-target-delta.md)：generic runtime、workspace/source intake shell、artifact gallery/handoff shell、review/repair transport、native-helper envelope、generated surfaces、Console/workbench 和 capability registry ABI 上收到 OPL；visual truth、layout / review / export verdict、artifact mutation/export authority、visual memory accept/reject、owner receipt、typed blocker 和 visual-native helper authority 保留为 RCA authority kernel。该 target delta 只冻结架构方向，不声明 visual ready、exportable、handoffable、domain ready、long-soak complete 或 production ready。

`contracts/foundry-agent-os-domain-kernel-manifest.json` 是 W4 `domain-kernel-manifest` 的 RCA machine-readable 落点。它把 retained Visual Authority Kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根、owner receipt / typed blocker / review-export signer 归属和 OPL/Vault/Console/Runway/Pack/Capability Registry/gallery-handoff shell false-authority flags 固定为可测试合同；它不声明 visual ready、exportable、handoffable、domain-ready、production visual-stage long-soak complete、production-ready、App release-ready 或 physical delete authority。

`Codex CLI` 是当前第一公民 executor。`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现，不承诺行为或输出质量与 Codex CLI 等价。

本轮 executor adapter owner 读法已在机器字段上收窄：RCA `opl_executor_adapter_receipt` 保留 `owner=opl_runtime_manager`，并把显式 backend 写成 `selected_executor_backend=hermes_agent`。`hermes_agent` 只表示一次显式非默认 executor/backend 选择。`python/redcube_ai/hermes/*`、runtime-protocol Hermes API client 和 loop bridge 仍被 route tests、executor routing schema 与受控 proof helper 消费，因此当前不能物理删除；删除门是 OPL Agent Executor Adapter / attempt ledger / runtime record default caller parity、RCA route policy/receipt refs preserved、focused proof tests 迁到 OPL-owned surface、no-active-caller scan、RCA owner receipt 或 typed blocker。

当前 acceptance / readiness 口径是 AI-first / executor-first：OPL 搭建 stage-led runtime、queue、receipt ledger、replay / recovery shell 与 operator projection；Codex/default executor 执行视觉阶段；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。合同只固定边界、安全、receipt、replay 和恢复语义，不能把机械 conformance 或 provider completion 升级成视觉判断。

从 Kami 高层实践吸收的长期规则只进入 RCA 自己的可执行约束语言：brand profile precedence、source/material pass transparency、素材/品牌状态、density/sparse-page evidence、route/template contract、Markdown/Marp 显式可选 refs-only route、package distribution consistency、rendered evidence、review/export gate 和 owner refs。RCA 不采用 Kami 的固定审美、模板口味、运行面或外部 skill authority；可复用内容必须折回 `agent/` Declarative Visual Pack、`contracts/pack_compiler_input.json`、product-entry / manifest refs、RCA review/export gates 和测试/验证面，不能停留为聊天结论或 docs-only checklist。

Cognitive Kernel 已落为 RCA stage 内部结构，而不是新的用户流程或额外 runtime route。`contracts/cognitive_kernel_adoption.json` 和 `contracts/golden_path_profile.json` 声明 advisory/current adoption 与 golden path；`agent/tools/domain_affordances.md` 是 domain tool affordance catalog；`contracts/stage_control_plane.json` 的 6 个 visual stage 声明 `strategy_refs`、`tool_refs`、`tool_affordance_boundary`、`candidate_pool_policy`、`independent_gate_policy` 和 `handoff_policy`；`contracts/pack_compiler_input.json#/cognitive_stage_pack_contract` 固定 OPL pack compiler 的 refs-only input。工具目录只表达 Codex executor 可用 affordance，不规定顺序；候选池只作为 stage-internal refs 与 lineage；独立 gate 仍回 RCA review/export / owner receipt / typed blocker。该结构不改变 `ppt_deck` image-first 默认路线，不让 OPL 写 visual truth、artifact body、review/export verdict 或 owner receipt。

## 当前运行与文档事实

- Direct route 已落地：`RedCube Product Entry -> service-safe domain entry -> executor adapter -> visual-domain truth surfaces`。
- OPL-hosted route 已有合同和 projection：stage control projection、family action catalog、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor refs、OPL generic primitive consumption、stability read-model consumption、operator evidence readiness projection、workspace receipt inventory projection 和 private functional audit surface。
- RCA route runtime 消费 OPL Stage Folder Contract 作为物理 artifact truth。成功 / 阻塞只由 required output roles、valid role manifest、RCA owner receipt 或 RCA typed blocker refs 推导；裸文件、缺 manifest / receipt / evidence 的输出仍是 orphan。物理路径、文件名、current pointer 与重建细节归 Stage Folder contracts、artifact locator contract、source/tests 和 runtime artifact root；status 只保留 owner/readout 边界。
- RCA 对 OPL Ledger 的 artifact registration 现在只落为轻量 refs-only 合同与投影：`contracts/opl_ledger_artifact_registration.json`、`getProductEntryManifest#/opl_ledger_artifact_registration` 和 `domain-handler export#/mapped_surfaces/opl_ledger_artifact_registration`。OPL Ledger 只能登记 `artifact_ref`、`sha256`、artifact index ref、review ref 与 receipt ref；不复制 MAS per-figure provenance bundle，不写真实 visual deliverable artifact body、review/export verdict、owner receipt body、typed blocker body 或 runtime queue state。
- Purpose-first owner-delta 口径已固定：RCA 默认下一步只承认 artifact-producing owner receipt、visual review/export receipt、visual memory accept/reject receipt、workspace receipt scaleout、production-like no-regression ref、Temporal controlled visual-stage long-soak ref、human review receipt 或 RCA typed blocker；OPL/App/operator 只消费 refs、owner route 和 next forced delta，不能把 refs-only accounting、provider completion、session currentness 或 workbench projection 写成视觉进展。
- `contracts/temporal_stage_run_consumption_policy.json` 是 RCA repo-local 顶层机器 policy；product-entry manifest、domain-handler export、generated handoff 和 action catalog 继续投影同一 `temporal_stage_run_consumption_policy` 语义。Temporal runtime、provider attempt ledger、queue 和 OPL stage attempt 写入归 `one-person-lab/OPL`；RCA repo 只消费 StageRun / provider / ledger / lease / receipt refs，不能自持 Temporal runtime，也不能写 OPL stage attempts。Provider completion、generated surface ready、stage-run terminal state、queue empty、attempt ledger written、mock-safe canary、controlled canary、conformance pass 或 read-model current 都不能 claim RCA domain completion；domain closeout 只能来自 RCA owner receipt、typed blocker、human gate、route-back、review/export receipt、artifact authority receipt 或 no-regression refs。
- RCA live stage-run progress evidence 已落地为 OPL 标准消费入口 `contracts/live_stage_run_progress_evidence.json`，并由 `contracts/stage_run_kernel_profile.json` 指向；旧 `contracts/owner_chain_live_progress_evidence.json` 继续作为 owner-chain 输入/引用。两个 evidence contract 现在都通过 `owner_chain_completion_audit` 指回 `contracts/temporal_stage_run_consumption_policy.json#/owner_chain_completion_audit`。当前读法：已有 mock-safe `ppt_deck` image-first owner-chain canary 和 human ready/export handoff refs 可被 OPL 消费，但 completion audit 仍是 `blocked_requires_real_visual_stage_owner_acceptance`，不授权 owner-chain complete、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。该 lane 不调用真实图片 API，不把 workspace artifact 写入 repo，不携带 visual truth/artifact body/owner receipt body/typed blocker body/review-export verdict body/memory body；真实 Temporal controlled visual-stage long-soak、真实 visual-stage owner acceptance、review-export acceptance、real memory lifecycle receipt instances 与 production-like no-regression 仍是 open evidence gates，当前执行顺序和 open gate 读法由 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md) 维护。
- RCA 现在暴露最小 `/goal` AgentLab suite / handoff：`contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json` 是 OPL `agent-lab run --suite ... --json` 可直接消费的顶层 external suite；`contracts/agent_lab_handoff.json` 是 OMA `agent:evidence` / `improve:external-suite` 的标准 refs-only handoff，但 feedback token / capability / dry-run token case 映射单源是 `contracts/capability_map.json`。handoff 只保留 suite entry、fixture/context、external refs、dry-run check refs 与 forbidden-authority boundary，不再复制 per-token mapping 或 patch-target authority。该 suite 用 `xiaohongshu` / `standard_note` 作为低成本目标 workflow，验证一次 `opl_hosted` product-entry 从单一 goal 进入 `auto_to_terminal` stage execution plan，不要求外层 Codex App 逐阶段监视；同一 focused test 还跑 mock-provider artifact-producing route chain 到 `export_bundle`，确认 PNG、publish bundle、caption、publication-state 和 series reports 都能落盘。AgentLab / OPL Meta Agent 只能作为 refs-only、control-plane、takeover 与 handoff 证据读取；artifact-producing 主链路证据必须回到 RCA product-entry route handler，即 `npm run --prefix /Users/gaofeng/workspace/redcube-ai redcube -- product invoke ... --task-intent run_deliverable_route`。真实图片生成由 Codex executor 原生 imagegen task 承接，RCA 不直接读取 Base URL、API key 或 provider token；手写脚本、独立 HTML 或 Python 样片只能作为 rejected provenance、diagnostic 或 helper proof，不能写成主链路证据。
- RCA 已有 `ppt_deck` 与 `xiaohongshu` image-first 默认路线；HTML/native PPTX 是显式可选路线。`poster_onepager` 仍保持 guarded knowledge poster 边界。
- `ppt_deck` 三技术路线 AgentLab 质量测试按 refs-only 标准 suite input 读取：image-first 默认线由 `contracts/runtime-program/ppt-image-first-quality-nonregression.json` 与 `tests/ppt-image-first-quality-nonregression.test.ts` 覆盖，HTML 显式可选线由 `contracts/runtime-program/ppt-html-route-quality-nonregression.json` 与 `tests/ppt-html-route-quality-nonregression.test.ts` 覆盖，native editable PPTX 显式可选线由 `contracts/runtime-program/ppt-native-pptx-quality-nonregression.json` 与 `tests/ppt-native-pptx-quality-nonregression.test.ts` 覆盖。顶层 suite `contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json` 由 `tests/rca-ppt-three-route-agent-lab-suite.test.ts` 验证：AgentLab 读取 refs-only suite，同时 RCA runtime 用 mock provider 跑 image-first、HTML、native PPTX 三条 route chain 到 `export_pptx`，确认 PNG/HTML/native PPTX、review screenshots、最终 PPTX/PDF 与 artifact gallery 能落盘。该 suite 不改变默认 `author_image_pages` 路线，不写入 RCA visual truth、artifact body、memory body、owner receipt body，也不替代 RCA-owned review/export verdict。
- Native editable PPTX 显式可选线现在固定为 `RCA AI-first design pack -> editable_shape_plan -> officecli writer / validator -> true render QA -> RCA review/export gates`。`contracts/runtime-program/ppt-native-ai-first-design-pack.json` 持有设计纪律；TypeScript route guard、Python materializer/preflight 与 officecli writer/validator 只做 fail-closed 校验、物化、true render proof 和 refs 签出，不选择模板、不补设计、不拥有视觉判断。
- Native live materialization / review / export proof lane 已有 dated evidence；具体 run id、workspace path、attempt id、截图路径和 no-regression refs 流水折回 [RCA dated production evidence foldback](./history/process/2026-06-03-rca-dated-production-evidence-foldback.md)。当前状态只读为：native sample proof 已补强，Temporal controlled visual-stage long soak、production-like repeated no-regression、domain ready、handoffable 和 production ready 仍未关闭。
- Temporal controlled visual-stage long-soak 的 RCA refs-only intake 能力已经落地为 guarded action 和 source contract；它只接收 OPL/Temporal attempt、retry/dead-letter、requery/resume、provider residency、独立 stage execution / quality AI task、RCA owner receipt、review/export 与 forbidden-write proof refs。具体 ref shape、hash/status、typed blocker path 与 inventory count 归 production acceptance、long-soak source contract 和 runtime evidence；当前读法仍是 intake capability landed，真实 Temporal long-soak、provider restart/re-query/retry/dead-letter live proof 与 production-like repeated no-regression 未关闭。
- `contracts/`、runtime-program contracts、product-entry manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 与真实交付物证据是机器真相；`docs/**` 只做解释、导航、治理和 provenance。
- Stage Artifact Kernel adoption 和 Stage control plane 已可被 OPL family conformance / replay / readiness surfaces 消费；RCA 只引用 shared policy release ref / bundle fingerprint，不复制 shared policy body 或把 domain contract 升级为 policy authority。Conformance、replay refs、stage readiness、human-gate typed blocker refs 和 evidence-worklist counts 的字段级读法归 OPL read-model、Stage control plane、production acceptance、Stage Artifact Kernel adoption contract 和 runtime ledger；status 只保留当前结论：RCA replay missing-ref 已有 domain-owned answer / typed blocker 结构，human-gate success receipt 仍未关闭，不能声明 human approval、visual ready、exportable、handoffable、production visual-stage long soak、domain ready 或 production ready。
- `contracts/foundry_agent_series.json` 与 `contracts/domain_descriptor.json` 现在同步暴露 canonical `series_design_profile`：RCA 与 MAS/MAG/OMA 共用同一 `opl_foundry_agent_series_design_profile.v1`，由 OPL 持有 generated descriptors、refs/projection、provider-backed runtime、stage attempts、queue/wakeup、retry/human gate、receipt ledger 与 App/workbench shell；RCA 的 visual materials/source 输入、PPT/PDF/PNG/export bundle/handoff refs 输出和视觉 authority 差异写在 `domain_specific_profile`、stage/action contracts 与 authority refs 中。RCA 继续持有 visual truth、route truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt；OPL 不能写 RCA visual truth、授权 review/export、变更 canonical artifacts、接受/拒绝 visual memory 或签发 RCA owner receipt。
- Workspace/file lifecycle 当前按 repo-source 与 live/runtime 写集分层：`agent/`、`contracts/`、`runtime/authority_functions/`、`packages/`、`docs/` 只承载 semantic pack、机器合同、authority-function descriptor/receipt refs、domain handler/native helper 和人读治理；真实 workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物进入 workspace/runtime artifact root 或 `/Users/gaofeng/workspace/projects/redcube-ai/runtime-state/`，不写回开发 checkout。`/Users/gaofeng/.codex/projects` 是指向 `/Users/gaofeng/workspace/projects` 的 symlink；文档和运行说明按同一物理 runtime-state 根读取，不把它写成两套状态根或双写策略。
- RCA OPL pack compiler descriptor 输入现在有 repo-tracked registration contract：`contracts/opl_domain_manifest_registration.json` 指向 `@redcube/domain-entry#getProductEntryManifest` generated materializer，并声明 live OPL workspace registry 仍必须通过 `opl workspace bind --project redcube --path <redcube-ai-repo>` 持有非空 `manifest_command`。`workspace.yaml`、`workspace_*.json` 与 `shared/` 是 OPL workspace topology / resource manifest 生成物；当 repo checkout 被用作 workspace root 时它们保持 ignored，不进入 repo source、contract source 或 visual truth。
- RCA repo source 当前只持有 locator、index、schema、receipt ref、restore/retention policy 和 refs-only lifecycle proof；visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 与 owner receipt 继续由 RCA owner chain 授权。OPL 上收通用 lifecycle primitive、scheduler/runner/session store/workbench shell，RCA 私有 runtime adapter 不能反向定义长期结构。
- 过程性 dated follow-through、closeout tranche 和 proof 命令摘要进入 `docs/history/`；当前目标态与 gap 只读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md) 和 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。

## 当前功能/结构闭合状态

当前功能/结构差距按 active plan 维护。历史 read-model 中的 `functional_structure_gap_count=0` 只说明旧 repo-local managed runtime / generic owner 问题已经分类并删除了核心实现，不表示 strict source-purity 已物理完成：

`functional_structure_gap_count=0` = legacy managed runtime owner closed, strict wrapper/source-purity cutover still pending

已闭合为标准 OPL consumer 口径的 8 项：`opl_generated_surface_production_consumption`、`repo_local_wrapper_active_caller_migration`、`focused_hosted_attempt_real_path_cutover`、`artifact_gallery_handoff_shell`、`review_repair_transport`、`opl_app_operator_drilldown`、`workspace_source_lifecycle_receipt_shell`、`legacy_physical_cleanup`。这些闭合表示 RCA 不再声明对应 generic shell/runtime owner，且旧 managed runtime 物理实现已删除；它不表示 active CLI/MCP/product-entry/session/domain_action_adapter/runtimeWatch/operator projection/neutral route-run record adapter 已是最终标准智能体源码。Strict purity 的完成口径是 OPL generated/default caller 接管后删除或收薄 repo-local generic wrapper，只保留 visual handler、authority function、native helper 和 machine-readable contracts。Production visual-stage long soak、visual ready、exportable 或 handoffable 仍属于证据门。Artifact-producing owner receipt 槽位已由 `contracts/production_acceptance/rca-production-acceptance.json` 里的 body-free RCA-owned receipt refs 关闭，但该 closure 不能升级成 visual/export/production ready。

当前结构闭合依赖 machine surfaces，而不是 docs receipt 流水。Status 只保留 current-read 摘要，字段、payload、path 和测试细节回到各自 SSOT：

| Surface | Status read | Detail owner |
| --- | --- | --- |
| Declarative Visual Pack / stage control | RCA 已把 stage prompt policy、Progress-First delta、typed blocker lineage、Cognitive Kernel refs 和 Stage Folder artifact interface 固定到机器合同；这些结构只提供索引、重建、operator 定位和 refs-only handoff，不提升 OPL 为 RCA visual authority。 | `agent/`、`contracts/stage_control_plane.json`、`contracts/foundry_agent_series.json`、`contracts/pack_compiler_input.json`、stage/control tests |
| Product-entry / generated surface boundary | product-entry manifest、family action catalog、`domain-handler export|dispatch` target 和 generated descriptor refs 只暴露 descriptor、domain handler target、refs-only projection、owner receipt shape 与 typed blocker；repo-local product/session/status shell 仍是 default-caller thinning tail。 | product-entry manifest、family action catalog、OPL generated descriptor refs、source/tests |
| Product-entry currentness | Session / continuation 按 OPL family Progress-First shared contract 读取 visual deliverable delta、platform repair delta、provider attempt / ledger refs 和 next forced delta；缺 closeout consumption 或 provider ledger binding 时返回 typed blocker，不把 local route-run 当作 current。 | runtime-program current-program parts、product-entry source/tests、OPL read-model |
| Runtime-program and acceptance surfaces | current-program index / parts、production acceptance 和 live progress evidence 是机器 truth；status 只说明这些 surfaces 记录 body-free owner receipt refs、artifact/review/export refs、memory/lifecycle refs、typed blocker refs 和 next verification refs。 | `contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**`、`contracts/production_acceptance/rca-production-acceptance.json`、runtime evidence |
| Retired direct watch / shell residue | `runtimeWatch` 和 supporting shell keys 只能作为 direct refs-only read model、generated shell key、migration input 或 retired provenance；它们不恢复成 RCA-owned generic runtime / status / workbench owner。 | private implementation inventory、physical morphology policy、source/tests、retired-surface provenance |

当前标准 OPL Agent 结构目标口径保持不变：RCA package surface 是 Declarative Visual Pack、service-safe domain entry、domain handler target、visual authority functions、native helper implementation 和必要 body-free receipt / typed blocker refs；OPL-owned/generated surface 是 CLI/MCP/Skill/product-entry/status/session/domain_action_adapter/workbench wrapper、provider-backed stage runtime、attempt ledger、artifact gallery/handoff shell、review/repair transport 和 App/operator shell。

Purpose-first domain-thinning 和 source morphology 的字段级判断不在 status 展开；SSOT 是 `contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`、私有实现迁移台账、source/tests 和 runtime evidence。RCA repo-local wrapper、session、runtimeWatch、operator projection、neutral route-run record、executor adapter 或 `domain_action_adapter` residue 在 default caller parity、no-active-caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof 和 tombstone/provenance pointer 同时成立前，只能作为 refs-only adapter、domain handler target、native helper implementation、diagnostic、package boundary 或 migration input；成立后直接删除或 tombstone，不新增 alias、facade、default dispatch、旧 public path 或 compatibility-only test。

当前 source-morphology / default-caller tail 的字段级 guard 不再由 status 承载。当前 SSOT 是 `docs/active/rca-ideal-state-gap-plan.md#结构卫生尾项`、`docs/active/opl-private-implementation-migration-inventory.md`、`contracts/physical_source_morphology_policy.json`、`contracts/functional_privatization_audit.json`、runtime-program leaf contracts、`npm run private-platform:readback`、`npm run default-caller-tail:readback` 和 focused guard tests。Status 只保留当前读法：retained tail 只能作为 refs-only read model、domain handler target、service-safe domain entry、minimal authority function、native helper implementation、repo-native verification wrapper 或 tombstone/provenance；进一步删除或收薄仍需要 OPL generated/default-caller parity、no-active repo-local caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof、retired-alias no-resurrection proof 和 tombstone/provenance pointer。cleanup/readback、compact summary、owner-delta pack、source-ref integrity、policy source split 和 generated-surface false-ready guard 都是非 Live、非 authority、非第二真相源的结构 guard；它们不授权 physical delete、default-caller cutover、visual ready、exportable、handoffable、domain ready 或 production ready。

Hermes-Agent / executor runtime protocol 仍只读为显式 opt-in proof backend 和 route-level executor policy迁移输入。删除门属于 Agent Executor Adapter / attempt ledger / runtime record default-caller tail；它不是 RCA production visual evidence。

## 当前测试/证据差距

以下是结构闭合后的 production evidence tail，不再计入功能/结构差距。Status 只保留 owner-delta 读法，proof-by-proof receipt 数量、payload path 和 dated ref list 回到 active plan、production acceptance、runtime evidence 与 history/process：

| Evidence tail | Current status read | SSOT detail |
| --- | --- | --- |
| Artifact-producing owner receipt | body-free receipt refs 已关闭为 RCA-owned receipt / artifact / review-export refs；不声明 visual ready、exportable、handoffable 或 production soak complete。 | `contracts/production_acceptance/rca-production-acceptance.json` |
| Visual memory / lifecycle receipts | accepted/rejected visual memory、cleanup/restore/retention lifecycle、domain owner receipt 和 workspace-scaleout no-regression refs 已可写出并聚合；它们仍是 body-free refs-only receipt instances，不写 memory body、artifact blob 或 review/export verdict。 | production acceptance、runtime evidence、domain-handler export/dispatch surfaces |
| Workspace receipt scaleout | 多 workspace body-free receipt 聚合能力可用，但 scaleout / production-soak claim 仍为 false。 | active plan、runtime evidence、workspace receipt inventory projection |
| Repeated no-regression | RCA-owned body-free refs 已有历史证据；当前只证明 RCA owner surface 能跨 route/window 向 OPL 投影 no-regression refs，不声明 repeated route soak、visual ready、exportable 或 production ready。 | `docs/history/process/2026-06-03-rca-dated-production-evidence-foldback.md`、production acceptance |
| Temporal controlled visual-stage long soak | RCA refs-only intake / inventory / operator projection 和顶层 `temporal_stage_run_consumption_policy` 已落地；owner-chain completion audit 当前为 `blocked_requires_real_visual_stage_owner_acceptance`。真实 provider restart/re-query/retry/dead-letter、OPL/Temporal residency、独立 stage execution / quality AI task receipts、真实 visual-stage owner acceptance 和 review-export acceptance 仍未产出。 | `contracts/temporal_stage_run_consumption_policy.json`、production acceptance、long-soak source contract、runtime evidence |

`contracts/owner_chain_live_progress_evidence.json#/domain_owner_chain_scaleout`
是 RCA 给 OPL `domain_owner_chain_scaleout` gate 的当前 refs-only
backfill：它聚合 RCA-owned owner receipt、review/export receipt、typed
blocker 与 no-regression refs。该 ref 只说明 owner-chain evidence lane 可被
OPL 消费，不声明 visual ready、exportable、handoffable、domain ready、
production ready 或 production visual-stage long-soak complete。

RCA 当前已有 refs-only evidence accounting 面让 OPL/App/operator 读取缺口状态与下一步执行顺序：operator evidence readiness projection、workspace receipt inventory projection、domain handler projection、production acceptance surface、typed blocker refs、Temporal long-soak evidence inventory 和 `production_evidence_tail_workorder`。这些 surfaces 的 payload template、success refs path、typed blocker path、accepted return shape 和 forbidden payload policy 归机器合同；status 不复制字段级 payload 表。真实 Temporal long-soak 与 production-like repeated family route no-regression 仍保持 open evidence tail。OPL conformance、readiness clean/observable、hosted/provider completion、replay evidence、cleanup proof、stage evidence receipt、domain-dispatch receipt、payload item success refs visible 或 workorder item completion 都不能升级为 RCA visual/export/domain ready。

Product-entry session currentness 与 runtime loop projection 现在都暴露 OPL shared `next_forced_delta`。当 continuation 缺 closeout consumption 时，下一强制产出是 RCA operator typed blocker resolution；当 newer route run 缺 provider attempt ledger binding 时，下一强制产出是 OPL-owned provider ledger closeout binding；当 visual route 已有有效 provider attempt / ledger refs 且完成时，下一强制产出回到 RCA visual deliverable artifact pickup。Provider currentness 必须同时拥有有效 provider attempt ref 与 provider attempt ledger ref，且两者不能等于或伪装成本地 `product-entry-session:*` ref；半缺失或本地 session ref masquerade 均 fail closed 为 typed blocker。该 hardening 只改变 RCA session/read-model currentness，不写 visual truth、artifact body、memory body、review/export verdict 或 production-ready claim。

AgentLab suite 只证明 OPL/AgentLab 可读取 refs、route plumbing、mock artifact 落盘和 forbidden-authority boundary。最小 `/goal` suite 与 PPT 三路线 suite 的 task / observation / artifact sample 细节归 `contracts/production_acceptance/*agent-lab-suite.json` 和 focused tests；status 只保留：mock proof 不是视觉样片或路线质量证明，live 视觉样片必须通过 Codex-native imagegen、live integrated sample 或 native PPT proof lane 生成，并继续经过 RCA product-entry、visual director review、screenshot review 与 export gate。

OPL expected receipt / monitor freshness handoff 的字段级 payload detail 归 `contracts/production_acceptance/rca-production-acceptance.json`、Stage control plane、physical morphology policy 和 focused guard tests。Status 只保留 current read：该 handoff 只承载 body-free receipt / monitor refs，不写 stage body、不生成 receipt、不关闭 owner-chain 或 production readiness，也不能成为 active public alias、success payload、readiness claim 或 runtime owner。

当前 naming / contract hygiene tail 只按 SSOT 摘要读取，不在 status
继续保存字段级 guard 清单。当前 owner 是
`docs/active/rca-ideal-state-gap-plan.md#结构卫生尾项`、
`docs/active/opl-private-implementation-migration-inventory.md`、
`contracts/physical_source_morphology_policy.json`、
`contracts/functional_privatization_audit.json`、runtime-program leaf
contracts 和 focused guard tests。`managed`、`gateway`、`runtime`、
`session`、`domain_action_adapter`、`bridge` 和 Hermes gateway 命令值只能在
semantic-id、tombstone/provenance、negative guard、refs-only adapter、domain
handler target、package/protocol boundary 或 upstream launch provenance 中出现；
它们不能恢复成 public identity、callable alias、compatibility surface、generic
runtime owner、success payload 或 production readiness claim。

Reader-facing active fields 已收敛到当前口径：session continuity、domain-entry
protocol boundary、service-safe domain entry、`redcube-ai` package / skill
identity 和 framework-side handoff contract。具体允许字段、retired legacy
surface id pointer、compatibility payload field policy、source-ref integrity
gate、legacy-name allowance、active source scan 和 no-resurrection guard 均归
machine contracts 与 tests；status 只保留 current read。该 hygiene tail 证明
命名和源码形态边界受 guard 约束，不声明 source purity、visual ready、
exportable、handoffable、domain ready、production ready 或 production evidence
complete。

## 当前物理源码形态收口与尾项

RCA repo-local product / session / `domain_action_adapter` / `runtimeWatch` /
operator projection / route-run record surfaces 只按 service-safe domain entry、
domain handler target、operator help projection、refs-only adapter、native helper
implementation 或 migration input 分类；OPL generated/hosted shell 是 default
caller 目标。Path-level active caller、source split、large-surface scan、line
budget posture、legacy-name allowance 和 per-surface cutover gate 的 SSOT 是
私有实现迁移台账、`contracts/private_functional_surface_policy.json`、
`contracts/physical_source_morphology_policy.json`、source/tests 和 runtime
evidence。Default caller parity、no-active-caller、RCA owner receipt / typed
blocker roundtrip、no-forbidden-write proof 与 tombstone/provenance pointer
同时成立后，repo-local wrapper、facade、alias、compatibility path 和只保护旧
public path 的测试直接删除或 tombstone，不新增兼容面。

## 当前保留的 visual authority surfaces

RCA 长期只保留无法声明化的 visual authority surfaces；active machine contract 只使用 `authority_surface_id`。source readiness verdict、communication / visual direction decision、review/export verdict 与 visual memory accept/reject 是 AI-first judgment surface；artifact mutation authorization、owner receipt signer 与 native helper implementation 是 programmatic authority/helper surface，只能依 owner receipt、blocked item、repair target、helper catalog、typed blocker 和 refs 工作。

这些 surfaces 必须遵守 AI-first stage output 边界：故事、视觉方向、页面判断、review verdict 和 repair judgment 由 AI-authored stage artifact 持有；代码只做 validator、materializer、receipt signer、guard 和 refs-only projection。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前入口与路线

- Public identity：`RedCube AI` Foundry Agent / OPL-compatible visual-deliverable package。
- Direct route：`redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`getProductEntrySession`、`invokeDomainEntry`。
- OPL-hosted route：OPL discovery 读取 RCA descriptor、family action catalog、stage control projection、memory descriptor 和 domain_action_adapter refs，再进入 RCA service-safe domain entry。
- CLI/MCP/session/source/workbench/supervision：默认由 OPL generated/hosted caller 持有通用 wrapper、session shell、source shell、supervision 和 workbench；RCA 侧只暴露 domain handler target、refs-only adapter 或 minimal authority function，旧 repo-local supervision/runtime 只保留在 history/provenance 语境。
- Default visual routes：`ppt_deck` 和 `xiaohongshu` 默认 image-first；native editable PPTX 与 HTML lane 必须通过 product-entry / route policy 显式选择。
- Runtime file boundary：真实 PPT/图片/PDF、receipt 实例、中间产物和导出包属于 workspace / runtime artifact root，不属于开发仓源码目录。

## 当前不能声明

- 不能声明 RCA 已完成 production visual-stage long soak。
- 不能把 OPL provider completion、transition hosted-attempt fixture、no-regression evidence、focused receipt proof、stage evidence receipt 或 domain-dispatch receipt 写成 RCA visual ready、exportable、handoffable 或 production soak complete；artifact-producing owner receipt 只能按 RCA production acceptance surface 中的 body-free receipt refs 读取。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、visual ready、exportable、handoffable 或新的 artifact-producing owner receipt。
- 不能把 OPL legacy cleanup dry-run / apply / verify ready 写成 production evidence tail 已完成；它只证明 cleanup proof refs 可被 OPL gate / refs-only ledger 消费。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway、retired public entry、federation、旧 Hermes 优先口径、local-manager 或 bridge residue 为 active public entry、runtime owner 或兼容别名。

## 当前验证口径

- 测试分组唯一机器可读入口是 `scripts/test-registry.ts`；`scripts/run-test-group.ts` 从注册表推导 smoke、fast、meta、integration、full 等执行组，并 fail-closed 拒绝未登记的根级测试文件。
- 默认开发测试入口是 `npm test` / `npm run test:smoke` / `scripts/verify.sh`，只覆盖 smoke group。`npm run test:fast` 是显式标准本地入口，继续覆盖 route/runtime/visual-authority core regression；CI、meta、family、integration、e2e、historical 与 full 仍由各自显式 lane 触发。该分层只降低普通开发路径成本，不把 smoke 通过写成 visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak evidence。
- Stage Folder Contract 的 focused gate 是 `tests/stage-folder-contract.test.ts`，覆盖 manifest/receipt/current pointer、role manifest 与 stage receipts、helper output refs、review/repair/export role 映射、orphan output 不完成 stage、同一 canonical stage 内 route-aware 读取、workspace-derived `program_id` 隔离，以及 route execution 写入物理 Stage Folder。
- `scripts/verify.sh` 与 `scripts/run-test-group.ts` 先执行 `scripts/repo-hygiene.sh`；`scripts/verify.sh` 在 lane dispatch 前运行一次 canonical line-budget gate，strict / structure-strict lane 使用 strict 模式，其余 lane 使用 advisory 模式。普通开发入口不因 line budget / Sentrux advisory 阻断，显式 strict lane 才把预算或结构治理问题转成退出失败。tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json`。
- Fallow production dead-code / dependency hygiene 的当前可复现入口是 `npm run audit:fallow:production`，等价于 `npx --yes fallow@latest --root . --no-cache --production --format json --summary`；需要先有当前 checkout 的 workspace `node_modules`，否则 fallow 会提示 resolution 不可信。
- 2026-05-26 hygiene pass 已关闭三类高信号问题：root build graph 不再把文件型 `tsconfig.tests.json` 放入 package/app project references；root scripts 的直接 workspace/upstream helper imports 已在 root `package.json`/lockfile 声明；overlay/runtime-family registry 的 manifest-driven modules 已通过显式 literal loader 绑定到真实 direct dependency owner，pack type packages 也暴露 type-only package surface。
- 当前 fallow residual 中，`@redcube/redcube-config` 在 CLI private-profile、runtime executor routing、source intake author template 和 xiaohongshu author profile 路径有源码、dist 与 Node resolution 证据，不能按 unused dependency 删除；待 analyzer 能正确计入 subpath package usage 或包入口形态进一步调整后再关闭。公共 API / namespace barrel 重名和有 docs/tests 入口的维护脚本只记录为 fallow triage residual，不做破坏性删除。
- 旧 gateway、retired public entry、Hermes-default 等污染 guard 只覆盖源码、contracts、plugins、scripts、tests、tools 与 Python helper 等机器 / 源码面；`README*` 与 `docs/**` 是人读 prose，不作为测试断言对象。

## 下一跳

- 目标态：[RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md)
- 差距与顺序：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)
- 文档治理：[RCA 文档组合治理](./docs_portfolio_consolidation.md)
- 历史归档：[历史索引](./history/README.md)
