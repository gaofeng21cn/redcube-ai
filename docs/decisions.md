# RedCube AI 关键决策

Owner: `RedCube AI`
Purpose: `active_decision_log`
State: `current_policy_with_historical_context`
Machine boundary: 人读决策日志。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

## 2026-06-03

### 决策：RCA Codex Developer Mode source 使用仓库根层 manifest

- `rca-local` 在 OPL Developer Mode 下可以把 Codex marketplace source 指向 `redcube-ai` developer checkout 根目录；因此 RCA 必须在根层提供 `.codex-plugin/plugin.json`，避免 Codex 看到的 plugin metadata 来自 managed/cache copy，而执行入口来自开发 repo。
- 根层 manifest 只作为 developer source locator，`skills`、icon 和默认 prompt 继续引用 `plugins/rca/` 下的 canonical RCA plugin scaffold；不得复制根层 `skills/rca` 或第二套 icon 来制造 parallel skill truth。
- `scripts/install-codex-plugin.ts` 只校验 developer checkout 根层 manifest、`plugins/rca` packaged scaffold 和 skill source，并删除旧 repo-local `.agents/plugins/marketplace.json` 副产物。Codex marketplace registration 由 OPL-owned wrapper 写入 `OPL_STATE_DIR/codex-plugin-marketplaces/rca-local`，wrapper 内 plugin source 指向当前 active developer checkout。
- 该决策只收敛 Codex plugin metadata/source channel。它不改变 RCA visual truth、review/export verdict、artifact authority、owner receipt 或 OPL/RCA runtime authority，也不声明 visual ready、exportable、handoffable、domain ready 或 production ready。

### 决策：RCA artifact completion 改由 OPL Stage Folder 物理合同推导

- RCA route handler 写入 OPL Stage Folder Contract：`$OPL_STATE_DIR/runtime-state/domains/redcube_ai/deliverables/<program_id>/<topic_id>/<deliverable_id>/stages/<nn-stage>/attempts/<attempt_id>/`。每个 attempt 必须有 `attempt.json`、`manifest.json`、`outputs/`、`evidence/`、`receipts/` 和 current/latest pointer。
- `success` 只能由 required output roles、valid role manifest、RCA owner receipt refs 和 receipt file 共同成立；`blocked` 只能由 RCA typed blocker refs 和 evidence file 成立。只有 output 文件、没有 role manifest / receipt / evidence 的 attempt 是 orphan，不完成 stage。
- `contracts/stage_artifact_kernel_adoption.json` 是给 OPL family conformance 读取的统一 adoption contract；它把 Stage Folder physical runtime、stage output role interface、review/repair/export receipt、native helper manifest、gallery/handoff shell 和 OPL state-index sidecar 边界收口到同一机器入口。
- Stage output 接口固定为角色而不是文件名：`source_truth_pack`、`material_inventory`、`strategy_brief`、`visual_direction`、`render_manifest`、`review_verdict`、`export_bundle`、`handoff_manifest`。文件名可以变化，role + manifest + receipt / typed blocker refs 才是 OPL/RCA 之间的机器接口。
- `visual_director_review`、`screenshot_review`、`repair_image_pages` 和 `export_pptx` 必须产出 review/export owner receipt refs 或 typed blocker refs；这些 refs 进入 Stage Folder `stage_receipts` / `review_export_refs`，gallery、handoff、projection 和 current pointer 只能消费这些 refs，不能自行解释完成状态。
- Python / Office / PPT / screenshot native helper 输出必须进入 Stage Manifest 的 `helper_output_refs`，记录 role、output ref、hash、evidence ref 与 review receipt ref；helper 输出本身不构成 stage completion。
- RCA 从 workspace root 派生 `program_id`，再与 `topic_id`、`deliverable_id` 构成 Stage Folder identity，避免不同 workspace 中同名 topic/deliverable 在共享 OPL runtime-state 下碰撞。
- OPL 负责 Stage Folder locator、index、rebuild、status/explain、orphan/broken/stale projection、gallery/handoff shell 和 App/operator read-model；旧 status/read-model、`stage_progress_log`、gallery 和 handoff 都是从物理 Stage Folder 重建的派生投影。
- RCA 继续持有 visual truth、review/export verdict、artifact authority、typed blocker 和 owner receipt。OPL 不能签发 RCA owner receipt，不能写 visual truth，不能写 review/export verdict，不能把 provider completion 或物理 folder 存在升级成 visual-ready、exportable、handoffable 或 production-ready claim。

## 2026-05-30

### 决策：RCA session continuation 采用 OPL Progress-First currentness 与 delta 分账

- RCA product-entry session projection 必须按 OPL family shared contract 输出 `progress_delta_classification`、`deliverable_progress_delta` 和 `platform_repair_delta`；visual-facing alias 只能作为解释层，不能成为 parallel schema。
- same-session currentness resolver 以 `entry_session_id + deliverable identity + latest attempt/closeout` 裁决当前 envelope。continuation 生成新 session plan 前必须先消费 latest closeout；缺 closeout binding 时返回 RCA typed blocker。`progress_projection` 与 `runtime_loop_closure` 必须暴露 `next_forced_delta`，并区分 visual deliverable delta、operator typed blocker resolution 与 OPL provider ledger closeout binding。
- cross-provider currentness 只有在 provider attempt ref 与 provider attempt ledger ref 同时存在、彼此不同、且都不是本地 `product-entry-session:*` ref 时才能 `can_claim_current=true`；半缺失或本地 session ref masquerade 必须 fail closed。
- route-local repeated block 进入 OPL stall lineage 口径，连续无 deliverable delta 时升级到 mechanism repair / human gate / stop-loss candidate，而 platform/cache/interface repair 不得算作视觉交付推进。
- 该决策只让 OPL/App/operator 区分 visual deliverable progress 与 platform repair；不授权 OPL/RCA session wrapper 写 visual truth、artifact body、memory body、review/export verdict 或 production-ready claim。

## 2026-05-20

### 决策：Temporal controlled visual-stage long-soak 先接 RCA refs-only evidence intake

- `emit_temporal_controlled_visual_stage_long_soak_evidence` 是 RCA-owned domain handler guarded action，供 OPL/Temporal hosted attempt 在形成真实长时 visual-stage evidence 后把 refs-only closeout 输入 RCA owner surface。
- 输入必须同时携带 workspace root、soak id、Temporal stage attempt、retry/dead-letter、requery/resume、provider residency、独立 stage execution AI task、独立 quality AI task、RCA owner receipt、review/export 和 forbidden-write proof refs；缺 ref 时返回 RCA typed blocker。
- action 成功时只写 workspace runtime evidence JSON，并返回 `rca-long-soak:visual-stage:<soak-id>` 与 `workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:<soak-id>`；manifest / operator projection / production workorder 只投影 ref、locator、status 和 hash。
- 该 intake 不写 visual truth、artifact body/blob、memory body、review/export verdict、publication gate 或 generic runtime state；也不因为 refs 可见而声明 production visual-stage long soak complete。
- 当前真实 OPL/Temporal controlled long-soak、provider restart/re-query/retry/dead-letter live proof 和 production-like repeated no-regression 仍是 open evidence tail；本决策只关闭 RCA 缺少可接收 long-soak refs 的能力差距。

### 决策：Visual-facing user stage log 由 RCA closeout 提供，OPL 只做投影

- RCA 每个 visual stage 的 closeout 必须按 OPL 标准 `user_stage_log_contract` 返回用户可读 stage 语义，说明本阶段的视觉交付问题、stage 目标、实际完成的视觉工作、变更 surface、结果、剩余 blocker 和证据 refs；无法给出时返回 typed blocker。
- OPL 负责 `stage_progress_log.user_stage_log` 的通用投影和 duration/token/cost 观测，但不能从 artifact body、review state 或 screenshot 中推断视觉语义，不能写 visual truth、artifact body、review/export verdict 或 production-ready claim。
- `contracts/stage_control_plane.json` 的每个 `stage_contract` 都声明该合同。该合同只提高用户可见性和可审计性，不等同于 visual ready、exportable、handoffable 或 production visual-stage long soak 完成。

### 决策：production acceptance/readiness 采用 AI-first / executor-first 口径

- RCA acceptance/readiness 的目标是 AI-first / executor-first：OPL 负责 stage-led runtime、queue、receipt ledger、replay / recovery shell 与 operator projection；Codex/default executor 执行视觉阶段；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。
- 合同只固定边界、安全、receipt、replay 和恢复语义。runtime budget refs、replay evidence refs、owner receipt / acceptance refs 与 OPL readiness consumption 都是可观察性和可追溯性证据，不替代 RCA AI-authored visual judgment。
- Structural conformance passed 只证明标准 OPL Agent 结构口径已通过；readiness clean / observable 只证明 launch、replay、runtime evidence 和 owner receipt refs 可被消费。二者都不能写成 visual ready、exportable、handoffable、domain_ready 或 production visual-stage long soak 完成。
- 本轮 expected merged result 是 refs-only evidence 面闭合：RCA stage evidence refs 纳入 runtime budget / replay evidence，RCA production acceptance 保留 owner receipt / artifact / review-export acceptance refs，OPL readiness surface 能消费这些 refs。真实长时 visual-stage soak、跨 family repeated no-regression 和更多 workspace scaleout 继续作为 production scaleout evidence，不作为结构 blocker。

## 2026-05-23

### 决策：外部 work order owner closeout 由 RCA 返回 refs-only no-regression 或 typed blocker

- `emit_external_work_order_owner_closeout` 是 RCA-owned domain handler guarded action，供 OPL 在外部 work order patch 吸收后通过 generated `domain_action_adapter` descriptor 调用。
- 输入只接受 OPL execution receipt、absorbed head、target verification refs、patch absorption / cleanup refs、Agent Lab re-evaluation ref 与 no-forbidden-write refs；输出只允许 RCA-owned `no_regression_evidence` 或 `typed_blocker`。
- 该 action 不写 visual truth、artifact body/blob、memory body、quality verdict、export verdict 或 artifact-producing owner receipt；它只能关闭 source-patch no-regression closeout，不能声明 visual ready、exportable、handoffable 或 production visual-stage long soak complete。
- 证据不足或 payload 带 body/verdict 字段时 fail closed 为 `typed_blocker`，让 OPL 记录 RCA domain-owned blocker，而不是由 OPL/OMA 代写 owner receipt。

## 2026-05-18

### 决策：把 RCA retained functions 硬化为 AI-first visual authority surfaces

- `visual_pack_compiler_handoff.minimal_authority_function_contract` 已退役既有 `function_id` / `allowed_functions` 兼容字段，当前唯一机器接口是 `authority_surface_id` / `allowed_authority_surface_ids` / `authority_surface_boundaries`，并明确 `source_readiness_verdict`、`communication_visual_direction_decision`、`review_export_verdict` 和 `visual_memory_accept_reject` 是 AI-first judgment surface。
- `artifact_mutation_authorization`、`owner_receipt_signer` 和 `native_helper_implementation` 现在机器化标为 programmatic authority/helper surface，只能依 owner receipt、blocked item、repair target、helper catalog、typed blocker 和 refs 工作，不能生成 visual ready、exportable 或 handoffable verdict。
- 该决策同步到 functional privatization audit、pack compiler input、root contracts、status 和 ideal-state docs；它不实现 OPL generic runtime、artifact gallery/handoff shell、review/repair transport、App/workbench shell 或 production visual-stage soak。

### 决策：旧 repo-local managed runtime 物理退役，RCA 收敛为标准 OPL consumer

- 旧 repo-local deliverable runner、managed run store、managed DAG scheduler、managed event/prompt/run/liveness/surface/bridge helpers、gateway managed action handlers、runtime-protocol managed run helper/types 和 managed runtime 专属测试已经从 active source/test/package surface 删除。
- `legacy_physical_cleanup` 已从 remaining functional gap 移入 completed gap；production live-soak 相关项从 functional/structural gap 降为 production evidence tail。当前 `functional_structure_gap_count=0` 只表示旧 managed runtime owner 已关闭，不表示 strict source-purity 物理完成；仍有 active caller 的 product/session/domain_action_adapter/runtimeWatch/operator projection/executor record adapter 继续按 default-caller cutover/delete tail 管理。
- 当前标准 OPL Agent 口径是：RCA 提供 declarative visual pack、service-safe domain entry、domain handler targets、refs-only projections、visual authority functions 和 native helper implementation；OPL 持有 generated/hosted wrappers、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport 和 operator/App shell。
- 后续不得把旧 repo-local deliverable runner、run store、DAG scheduler、supervision diagnostic 或 public lookup action 恢复成兼容别名、internal fixture、standard domain_action_adapter template 或 active docs truth。需要追溯时只读 `docs/history/**`、旧 commit 或 tombstone/provenance。
- 默认 service-safe task intent 改为 `run_opl_stage_execution_plan`；旧 managed deliverable task intent 不保留 public 兼容别名。历史 `managed-product-entry-hardening` 文件名、runtime-program baton 和 run record nullable field 只作为 session-continuity provenance / historical run envelope，不作为 RCA generic runtime owner。
- 本轮清理不声明 production visual-stage long soak、artifact-producing owner receipt、真实 visual memory lifecycle receipt 或 cross-family repeated no-regression 已完成；这些仍属于 production evidence tail。

## 2026-05-21

### 决策：OPL/Temporal 托管自治是 RCA 标准默认运行口径

- `temporal_autonomy_readiness` 现在声明 `standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending`：RCA 作为标准 OPL Agent，任务启动后默认由 OPL/Temporal 持久在线调度、唤醒、restart/resume/re-query、retry/dead-letter 和 attempt 投影。
- RCA 不内置 generic daemon、scheduler、attempt loop 或 attempt ledger；RCA 只提供 declarative visual pack、service-safe domain entry、domain handler targets、refs-only projections、visual authority functions、owner receipt、typed blocker 和 native helper implementation。
- `runDeliverableRoute`、runtime route-run records 和 route-local helpers 的默认执行权必须来自 OPL-owned `cross_provider_attempt_index`：owner、provider attempt ref、provider attempt ledger ref 与 stage attempt / lease / receipt ref 缺一不可。缺失时返回 RCA typed blocker `missing_opl_stage_attempt`，不得创建 repo-local run/event state；`allowLocalDiagnosticRecord` 只用于 explicit refs-only diagnostics。
- `Codex CLI` 仍是默认 concrete stage executor；Hermes-Agent 等其他 executor / proof adapter 必须显式选择，不能被写成与 Codex CLI 质量或行为等价。
- 该默认自治口径不声明 production visual-stage long soak、真实 memory/lifecycle receipt instances、cross-family repeated no-regression、visual ready、exportable 或 handoffable 已完成；这些仍由 RCA-owned typed blocker、owner receipt 或真实运行证据关闭。

### 决策：退役 runtime_watch domain_action_adapter 默认派发

- `runtime_watch` 已从 RCA domain handler guarded action / generated `domain_action_adapter` default dispatch 面退役；需要 watch / progress 时由 OPL status / workbench / runtime read model 消费 RCA direct `runtimeWatch` read surface。
- RCA 继续保留 direct `runtimeWatch` 作为 review / progress refs-only read model，不把它写成 RCA domain_action_adapter 默认 action、generic supervisor、session runtime 或兼容别名。
- 该变更不声明 OPL replacement 已完成，也不声明 production visual-stage long soak、visual ready、exportable 或 handoffable 完成。

## 2026-05-17

### 决策：退役 default generic domain_action_adapter dispatch

- 旧 managed supervision action 与 `product_entry_continuation` 已从 RCA domain handler 默认 dispatch / guarded action 面物理删除或收薄；generic supervision 和 product-entry continuation 归 OPL runner / generated session shell。
- RCA 保留 direct product-entry/session API、direct `runtimeWatch` refs-only read model、owner receipt、visual memory/workspace lifecycle、visual transition、workspace receipt proof、notification receipt 和 visual authority surfaces；这些保留项不构成 standard domain_action_adapter template 或新 Agent 默认 domain_action_adapter action。
- `privatized_functional_module_audit.physical_deletion_guard` 现在把 default generic dispatch、public managed lookup 和旧 repo-local visual runtime surfaces 列为已删除或已收薄 surface；剩余 active code path 只能是 declarative visual pack、refs-only adapter、diagnostic direct surface 或 minimal visual authority function。

## 2026-05-16

### 决策：privatized functional module audit 成为 OPL 可读的机器审计面

- RCA 在 runtime-program contracts、manifest、status 和 domain handler projection 中维护 `privatized_functional_module_audit`，统一盘点 product-entry session snapshot refs adapter、workspace/source intake、memory/writeback receipt transport、artifact export lifecycle、review/repair transport、native helper envelope、operator projection shell、generic CLI/MCP wrappers、Codex executor adapter、observability/stability read model、visual pack compiler handoff 和 minimal visual authority functions。
- 该 audit 只做 refs-only read model：OPL 可以索引模块边界、generic primitive consumer 关系、hosted/generated surface expectation、refs-only adapter 和 declarative pack handoff，但不能据此写 RCA visual truth、artifact blob、memory body，不能声明 visual-ready、exportable、handoffable 或 production soak complete。
- 2026-05-17 后，default domain_action_adapter dispatch 里的 旧 managed supervision action 与 `product_entry_continuation` 已成为已删除/已收薄 tombstone candidate；随后旧 repo-local deliverable runner、run store 和 DAG runtime 也已物理删除。review/export gate、artifact authority、owner receipt、route-level executor policy 和 Python native helper implementation 继续归 RCA，因为它们是 visual authority 或 native implementation，不是 generic runtime。
- 真实仍需由 OPL 生成或托管的代码面是 generic scheduler/runner/attempt ledger、session/workbench shell、native-helper generic envelope、artifact lifecycle/handoff shell、review/repair transport、observability/SLO/read-model、executor adapter 与 CLI/MCP/product/status wrapper；RCA 只消费这些通用 primitive 的 projection，或提供 declarative visual pack / refs-only adapter / minimal authority function。

### 决策：domain handler / generated descriptor / action / status parity 由 canonical metadata 驱动

- RCA domain handler guarded actions、forbidden writes、manifest generated descriptor refs、family action catalog、CLI help 和 MCP product-entry routes 统一从 RCA-owned canonical action/status metadata 派生。OPL 侧 generated descriptor id 可以继续是 `domain_action_adapter`；RCA repo-local active/default command 是 `domain-handler export|dispatch`。
- `redcube_product_entry` MCP public routes 只暴露 `family_action_catalog` 中的 action；`invoke_opl_hosted_product_entry` 不再作为公开 MCP action。
- `invokeOplHostedProductEntry` 继续保留为 internal OPL integration contract，供 OPL hosted handoff 调用；它不是第二公开 skill，也不是独立 RCA runtime owner。
- 该决策不把 OPL provider completion、transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 visual-ready、exportable、handoffable、artifact-producing owner receipt 或 production visual-stage soak。

### 决策：RCA substrate adapter export 只导出 opaque/index-only refs

- RCA 在 manifest、domain handler projection 和 runtime-program contracts 中新增 `opl_substrate_adapter_export`，作为 RCA domain-owned OPL substrate adapter/export surface。
- 该 surface 只导出 OPL 可消费的 workspace/source/artifact/memory locator、index、lifecycle 与 operator projection refs；它不导出 visual truth、layout/review/export verdict、deliverable artifact body、visual memory body 或 owner receipt authority。
- OPL 可以索引和路由 refs，但不能读取或写入 RCA visual truth，不能授权 layout/review/export verdict，不能存储 artifact body，不能读写 visual memory body，不能 accept/reject memory，也不能签发 RCA owner receipt。

### 决策：RCA 只消费 OPL family scheduler replacement，不实现 generic scheduler

- RCA 在 runtime-program contracts、manifest/domain_action_adapter projection 和 guards 中声明消费 OPL `family_scheduler_replacement`。
- OPL 持有 family scheduler、daemon 和 generic lifecycle owner；RCA 不新增 generic scheduler、generic daemon、generic transition runner 或 App/workbench shell。
- 旧 repo-local DAG runtime 已删除；当前视觉 stage 顺序只通过 hydrated deliverable contract、`family_stage_control_plane` 和 `opl_stage_execution_plan` 暴露为 route-handler refs。RCA 继续持有 visual truth、review/export verdict、artifact authority、visual memory body、owner receipt、typed blocker 和 safe action refs。

### 决策：Python native helper wrapper 退役为 package-module-only

- Python helper catalog、runtime callsite 和 native proof lane 统一使用 `python -m redcube_ai.<helper_module>` package module invocation。
- `packages/redcube-runtime/scripts/ppt_deck_review.py`、`packages/redcube-runtime/scripts/ppt_deck_export.py`、`packages/redcube-runtime/scripts/ppt_deck_native.py` 与 `python/redcube_ai/hermes/agent_loop_bridge.py` thin wrapper 已退役。
- Catalog / proof lane 不再声明 `script` / legacy wrapper script marker wrapper authority；后续不得恢复 compatibility layer、script caller 或 contract anchor。
- Native helpers 继续受 RCA route、visual director review、screenshot review 和 export gate 约束，不能绕过 product-entry/runtime-family mainline。

### 决策：RCA 只消费 OPL stability read-model，不实现观测/控制 runtime

- RCA 在 runtime-program contracts、manifest 和 domain handler projection 中新增 `opl_stability_read_model_consumption`，只引用 OPL `family-conflict-envelope`、`control_loop_summary`、`usage_projection`、`resource_pressure`、`runtime observability-export` 和 external stability policy 的 refs-only read model。
- OPL 继续持有 conflict envelope schema、control-loop summary builder、usage/resource pressure aggregator、observability exporter、external stability policy runtime、fallback/retry/event-bus/runtime-adapter 稳定性语义；RCA 不复制这些 generic surface。
- 该投影只提升 OPL/App/operator 对 RCA stage refs、owner receipt refs、typed blocker/no-regression evidence refs 和资源压力信号的可见性；不能写 RCA domain truth，不能执行 RCA domain action，不能授权 visual-ready、quality verdict、exportable、artifact blob 或 visual memory body。
- 外部 `cybernetics` 类模式只作为 vocabulary/reference：generic fallback 只能成为 degraded attempt 或 alternative route proposal，字符串 retry 必须进入 typed SLO/retry policy schema，event bus 只能是只读分类，runtime adapter started 不能写成行为、质量或 resume 等价。

### 决策：operator evidence readiness 只做 RCA-owned refs-only next-gap projection

- RCA 在 manifest、status 与 runtime-program contracts 中新增 `operator_evidence_readiness_projection`，聚合 no-regression / owner receipt proof、domain owner receipt contract、controlled memory runtime receipt refs、lifecycle guarded apply proof、controlled soak blocker、workspace receipt inventory、OPL generic primitive consumer coverage 与 stability read-model consumer refs。
- 该 projection 面向 OPL/App/operator 展示 next evidence gaps：真实 artifact-producing domain owner receipt、真实 OPL-hosted controlled visual-stage long soak、真实 memory/lifecycle receipt instances 和跨 family repeated no-regression evidence。
- 该 projection 不写 visual truth、artifact blob 或 memory body，不声明 production soak complete 或 artifact-producing owner receipt 已完成，也不实现 OPL generic runtime、workbench 或 observability。

### 决策：workspace receipt inventory 只做 RCA-owned refs-only read model

- RCA 在 manifest、status、session 和 domain handler projection 中新增 `workspace_receipt_inventory_projection`，从 workspace runtime receipt root 读取 domain owner、visual pattern memory accepted/rejected 与 lifecycle cleanup/restore/retention receipt refs。
- 该 read model 只让 OPL/App/operator 索引当前 workspace 的 receipt coverage，并把 `real_memory_lifecycle_receipt_instances` 缺口指向可见 refs；它不写 receipt instance、不读取 memory body、不生成 artifact gallery/handoff shell，也不实现 workbench。
- 该 projection 不声明 visual-ready、exportable、handoffable、artifact-producing owner receipt 或 production soak complete；真实 OPL-hosted controlled visual-stage long soak、真实 reusable visual memory body 和真实 artifact-producing attempt 仍是后续 runtime evidence。

### 决策：visual transition evaluator 是 RCA-owned thin guard surface，generic runner 归 OPL

- RCA 在 manifest、domain handler projection、runtime-program contracts 和 focused tests 中新增 `visual_transition_evaluator` 与 `evaluate_visual_transition` guarded action。
- 该 evaluator 只消费 `visual_transition_spec`、`transition_id`、`current_stage` 和显式 guard refs，返回 `visual_transition_evaluation` 或 RCA typed blocker；它可以投出 next stage、owner action、repair action、domain owner receipt ref、no-regression evidence ref 和 transition bridge evidence refs。
- OPL 继续持有 generic transition runner、matrix runner、retry/dead-letter、route-decision graph、transition bridge evidence workbench、provider attempt ledger 和 App projection；RCA 不写 runner state、不实现 workbench、不复制 OPL runtime。
- 该 evaluator 不写 visual truth、review/export verdict、artifact blob、memory body 或 receipt instance，也不声明 visual-ready、exportable、handoffable、artifact-producing owner receipt 或 production visual-stage soak。

## 2026-05-14

### 决策：owner receipt / memory writeback / workspace lifecycle apply 由 RCA 持有 authority

- `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle` 已作为 domain handler guarded actions 落地。
- 这三个 surface 只写 RCA-owned workspace/runtime refs，并返回 domain receipt、typed blocker、no-regression evidence、memory receipt refs 或 lifecycle mutation receipt；不把 visual truth、review/export verdict、memory body、canonical artifacts 或 artifact mutation authority 写入 OPL。
- OPL 只消费 locator、projection、receipt refs、operator projection 和 repair hints；OPL stage completion、provider completion 或 no-regression ref 不能被升级为 RCA visual ready、exportable、handoffable 或 production soak success。
- 真实 OPL Temporal controlled visual-stage long soak 当前仍未完成；本轮完成的是 RCA-owned workspace/runtime receipt 写入面、机器合同、focused tests 与文档同步，不声明 production soak success。

### 决策：退役旧 active 接口时直接清理，不保留兼容别名

- `REDCUBE_WORKBENCH_ROOT` 不再作为 workspace root 输入；当前只认显式 workspace 参数、`REDCUBE_WORKSPACE_ROOT` 与用户级 runtime-state 配置。
- standalone `scripts/probe-upstream-hermes-agent.ts` 已退役；Hermes proof 入口统一走 runtime-protocol Hermes API / loop bridge tests 与 Python helper catalog tests。
- CLI / MCP 注入接口统一使用 product/domain action / domain tool 命名；不保留 `GatewayActionMap`、`getCliGatewayActions`、`callGatewayTool`、`listGatewayTools`、`GatewayTool*` 或 `deps.gateway` 兼容别名。
- 退役词汇守门测试改为 `tests/rca-retired-surface-guard.test.ts`，表达“旧 surface 不复活”，不再把这类测试写成 compat 保留。
- 仍被 `human_doc:*` 指向的历史计划文档原位保留为 provenance；新计划不再围绕 workbench、retired public entry、federation、source-pack-federation、repo-local Hermes substrate 或 product frontdesk 继续扩展。

## 2026-05-13

### 决策：RCA functional closure 以 owner receipt / memory receipt refs / lifecycle guarded proof 收口

- `RedCube AI` 在 product-entry manifest 和 domain handler projection 中新增 `domain_owner_receipt_contract`、`lifecycle_guarded_apply_proof`、`physical_skeleton_follow_through` 与 `review_helper_baseline_follow_through`，并把 `controlled_memory_apply_proof` 扩展到 accepted/rejected runtime receipt refs。
- RCA owner receipt 统一返回 `domain_receipt`、`typed_blocker` 或 `no_regression_evidence`，且只暴露 refs、source refs、forbidden-write proof refs 和 owner 边界；OPL 只能保存 receipt refs、typed blocker 或 no-regression evidence ref。
- cleanup/restore/retention 的 OPL-owned locator metadata 可以被 OPL 编排；任何 RedCube domain artifact 删除、重写、review/export verdict 或 memory body 写入都必须由 RCA 返回 domain receipt 或 typed blocker。
- `agent/ contracts/ runtime/ docs/` 物理 skeleton 本轮只做低风险 repo-source entrypoint follow-through 和 parity proof，不移动 workspace artifacts、receipt instances、memory body、PNG/PPTX/PDF 或 review/export verdict。
- `python/redcube_ai/native_helpers/ppt_deck/review.py` baseline 的后续拆分边界固定为 screenshot capture、geometry audit、markdown report、summary projection；2026-05-13 follow-through 已拆出 geometry audit、markdown report 与 summary projection，并删除 `review.py` line-budget baseline。

## 2026-05-12

### 决策：RCA controlled soak 暂以 typed blocker 收口

- `RedCube AI` 在 product-entry manifest 和 domain handler projection 中新增 `controlled_soak_no_regression_attempt`。
- 该 historical surface 当前仍以 `deferred_typed_blocker` 表示真实 production soak 未完成；新的 RCA intake contract 是 `rca.temporal_controlled_visual_stage_long_soak.v1`，对应 guarded action `emit_temporal_controlled_visual_stage_long_soak_evidence`，已经能接收 OPL/Temporal long-soak refs-only evidence。
- OPL 只能读取 no-regression refs、blocker 和下一跳 contract gap；它不持有 visual truth、review/export verdict、canonical artifact、memory body 或 receipt instance。
- 真实 controlled soak 需要由 RCA-owned surface 产出 long-soak evidence ref、runtime locator ref、domain receipt、typed blocker 或 no-regression evidence；没有 live provider residency、restart/resume/re-query、retry/dead-letter、独立 stage execution AI / quality AI task 和 owner-chain refs 之前不能声明 production soak success。

### 决策：PPT review helper baseline 已降级为默认 line-budget 守门

- `python/redcube_ai/native_helpers/ppt_deck/review.py` 当前为 1154 行，属于既有 native screenshot/layout review helper 的集中实现。
- 2026-05-13 follow-through 不改变 review 行为，已把 geometry audit 与 result summary / markdown report 拆成 focused modules；`scripts/line-budget.ts` 不再保留 `review.py` baseline。
- 后续结构拆分只剩 Playwright screenshot capture 主体，应继续按行为保持的 native review 验证推进。

## 2026-05-10

### 决策：RCA 文档第一身份收口到视觉交付，OPL 降为托管运行框架路径

- `RedCube AI` 的公开首页、docs 入口和核心五件套先表达独立 visual-deliverable domain agent 身份，再表达 OPL 托管路径。
- 公开发布包装固定为 `RedCube AI Foundry Agent / OPL-compatible package built on OPL Framework`：single `redcube-ai` app skill、service-safe domain entry、RCA domain handler target、OPL-generated `domain_action_adapter` descriptor/projection、stage control projection 和 standard domain-agent skeleton mapping 是同一 package 的不同 surface。
- `OPL` 在 RCA 文档中固定解释为 stage-led 的完整智能体运行框架，可作为外部依赖托管 RCA；它不成为 RCA 对外第一身份，也不接管 visual-domain truth、canonical artifacts、review/export gate 或 publication projection。
- `Codex CLI` 是 OPL provider/executor adapter 可选的第一公民 concrete executor；RCA direct/default product-entry 的 runtime owner 是 `configured_family_runtime_provider`，默认返回 OPL stage execution plan。
- 旧 `gateway`、retired public entry、`federation`、`harness-first`、`OPL-hosted handoff`、旧 Hermes 优先口径只能出现在内部集成、provenance、合同引用、或 tombstone 语境中；仍被 runtime-program 合同引用的 reader-context brief 按生命周期迁入 `docs/active/` 或 `docs/history/`，通过 lifecycle note 降级，不再保留旧 `docs/program/` 活跃目录。

### 决策：RCA 对齐 OPL Temporal-backed production runtime，Temporal 为 OPL 生产必需 substrate

- `RedCube AI` 的 OPL 长期托管口径更新为 `OPL Product Entry -> OPL stage-led family runtime provider -> RCA domain-handler export|dispatch -> RedCube service-safe domain entry`。
- Temporal 是 OPL production online runtime 的必需 provider；`Hermes-Agent` / `hermes_agent` 只作为显式非默认 Agent executor adapter、显式 hosted/proof backend 或 executor proof lane 保留，不再作为目标 24h session/wakeup substrate。
- `redcube domain-handler export|dispatch` 继续是 OPL provider 到 RCA owner surface 的受控桥接；`domain_action_adapter` 只作为 OPL-generated descriptor / internal migration refs 保留。OPL/Temporal/Hermes/local provider 只能 enqueue、dispatch、signal、query、投影 attempt/receipt，不得写 visual truth、review verdict、publication projection truth、canonical artifacts 或 export authority。
- RedCube 继续持有 visual stage pack、prompt/skill、route truth、review/export gate、canonical artifacts 和 visual-domain quality authority。下方 Hermes-oriented thin-manager 决策保留为迁移背景，后续新投入按 Temporal-backed production runtime 解释。

### 决策：RCA 消费 OPL 统一 Agent Executor Adapter receipt

- RCA 的 runtime owner 不再是 concrete executor；默认 runtime owner 是 OPL provider。`Codex CLI` 仍是第一公民 concrete executor 选项；显式非默认 executor 通过 OPL generic Agent Executor Adapter 进入，RCA 只消费 OPL executor receipt / domain handler receipt refs。
- `Hermes-Agent`、`Claude Code` 等只作为显式 opt-in backend。它们必须可接入、可回执、可审计、fail-closed，但不承诺输出质量、视觉审美、tool semantics、resume 或 artifact 结果与 Codex CLI 等价。
- RCA 保留 visual route truth、review/export gate、canonical artifacts、publication projection truth 和 visual-domain quality authority；generic executor owner 不进入 RCA。
- 当前状态：除真实 production-hosted controlled visual stage soak 外，本边界已落地到 status/runtime architecture/domain handler/receipt proof 口径；旧 Hermes/Gateway/local-manager active path 已降为 explicit proof/provenance/history。

## 2026-05-05

### 决策：RCA 作为 OPL stage-led framework 上的独立 domain agent

- `RedCube AI` 的 OPL 对齐口径固定为：RCA 是可被 Codex App skill 直接调用、也可由 OPL stage-led family framework 托管的独立 visual-deliverable domain agent。
- `OPL` 只持有 stage descriptor discovery、queue、wakeup、handoff、receipt、approval/retry/dead-letter、trace/projection 和 parity；RCA 持有 visual stage pack、prompt/skill、route truth、review/export gate、canonical artifacts 和 visual-domain quality authority。
- 后续流程优化优先改 RCA stage pack、visual direction prompt、review gate、runtime-family route 和 export proof；不得把视觉路线、审美判断或 artifact authority 搬到 OPL 机械脚本。
- Direct skill path 保持一等入口；经 OPL 托管调用时也必须回到同一套 RedCube-owned `invokeDomainEntry` / product-entry surface。

### 决策：`ppt_deck` 默认视觉路线切到 image-first，HTML/native 保持显式可选

- `ppt_deck` 的默认视觉路线固定为 `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`。
- `author_image_pages` 通过 Codex executor 的原生 imagegen / image_generation 能力生成完整 16:9 PNG 页面；RCA 不直接读取 Base URL / API key 调 provider，`export_pptx` 将整页图装配成 PPTX/PDF，并明确不承诺 editable shapes。
- 用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。
- 旧的 `render_html` executor wording 只描述显式 HTML route 的执行形态，不再表示 `ppt_deck` 默认视觉路线。

### 决策：RCA 暂不引入 SQLite 作为持久层，保留为 OPL State Index Kernel 可重建 sidecar index deferred option

- MAS/MDS 的 SQLite program 解决的是 `.ds` 运行态大量小文件、历史游标、retention ledger 与 cold archive restore 问题；RCA 当前主要增长面是 deliverable artifact、manifest、review/export bundle，而不是同等级别的 runtime 小文件生命周期。
- RCA 现阶段继续采用 `file authority + artifact index + Git source control`：canonical artifacts、review state、export bundle、gallery manifest 与 product-entry/session truth 保持文件 authority。
- SQLite 只在未来出现实测触发条件时进入评估：artifact/session 文件数量明显增长、跨 deliverable 查询变慢、operator 需要全局 artifact inventory，或 JSON retention ledger 已难以维护。
- 若未来启用 SQLite，它只能作为 OPL-owned State Index Kernel / SQLite sidecar index：可删除、可重建，只索引 session/deliverable/route/artifact/review/export 的 locator、hash、manifest/receipt ref 与 provenance。它不属于 RCA 私有 runtime，不存放 PNG/PPTX/PDF body，不成为 visual-domain truth、canonical artifact truth、review/export judgment、owner receipt body 或 visual memory body owner；RCA file authority 与 artifact index 继续持有 canonical truth。

## 2026-04-26

### 决策：RCA 对齐 OPL hosted integration 与 TS/Python 目标形态

- 状态：薄管理层命名已被 2026-05-10 Temporal-backed production runtime 与 2026-05-11 OPL stage-led framework 口径 supersede；TS/Python 目标和 RCA owner split 继续有效。
- OPL-hosted route 的目标形态改为 `OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry`。
- OPL hosted integration 只负责 OPL 侧 profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、native helper catalog 与高频状态索引，不持有 RedCube visual-domain truth、canonical artifacts、review/publication projection truth 或 concrete executor。
- RCA 的实现语言目标固定为 `TypeScript + Python`：TypeScript 管 product/runtime contract、CLI/MCP、domain entry package/protocol boundary 与 typed service boundaries；Python 管 native Office/PPT、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 共享自动化生态。
- RCA domain handler target 只作为 OPL typed family queue / OPL family runtime provider wakeup 的受控投影与 dispatch 面启用；OPL-generated `domain_action_adapter` descriptor 不成为 OPL 自有 visual truth adapter，也不持有 review verdict、publication gate 或 canonical artifact authority。

## 2026-04-23

### 决策：默认公开能力面收口为稳定 capability surface

- `RedCube AI` 对外默认合同优先冻结为 `CLI`、`MCP`、`invokeDomainEntry`、`invokeProductEntry`、本地脚本与 repo-tracked contracts 这一组稳定 callable surface。
- `configured_family_runtime_provider` 是默认 product-entry runtime owner；`Codex CLI` 继续作为当前第一公民 concrete executor 选项。
- `Hermes-Agent` 相关路径只保留为显式 hosted/proof backend 或技术参考，不改写默认公开合同。

## 2026-04-11

### 决策：采用核心五件套文档骨架

- `docs/project.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`
- `docs/status.md`

原因：让 AI 和维护者能快速定位项目目标、当前主线、硬约束和关键决策。

### 决策：Phase 2 tranche brief 统一下沉到 `docs/history/phase-2/`

原因：`phase_2_*.md` 继续平铺在 docs 根目录会让入口混乱；它们保留为 absorbed provenance brief，但不再占据根目录层级或 active 层级。

### 决策：`contracts/runtime-program/*.json` 与 `docs/history/phase-2/*.md` 成对维护

原因：一个是机器真相，一个是人类可读 brief，不能再各自漂移。

### 决策：目标 substrate 优先于旧宿主硬化

原因：历史主线与当前基线仍然有验证价值，但一旦新的 runtime substrate 目标已经明确，新增投入就应默认服务目标形态。旧宿主形态只能保留为迁移桥、provenance 或回归对照，而不是继续被当成长线产品方向。

### 决策：`Hermes-Agent` 只指上游外部 runtime substrate

- 后续凡是提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务本体。
- 仓内 `docs/history/hermes/*` 与同名 package 只代表本地迁移工件、pilot substrate 或历史 provenance。

### 决策：repo-local Hermes 迁移材料退入 `docs/history/hermes/`

- 当前还不能把 `docs/history/hermes/*` 写成上游 `Hermes-Agent` 已接管 runtime 的证据。
- 这组文档保留为历史 local-runtime migration artifact，用于追溯为何会走到今天这一步。
- 当前真实主线应回到核心五件套：先完成 truth reset，再推进真实的上游 `Hermes-Agent` pilot。

### 历史决策：统一 runtime substrate，不强制统一 visual executor

- 状态：此段保留为 2026-04-11 旧 Hermes 优先迁移背景；2026-05-10 之后已被 Temporal-backed production runtime 与 stage-led OPL framework 口径 supersede。
- `Hermes-Agent` 在当时迁移设想中优先承担 runtime substrate / orchestration owner；当前只作为显式非默认 Agent executor adapter、显式 hosted/proof backend 或 executor proof lane。
- `RedCube AI` 继续持有 visual deliverable 的 family/profile/pack authority、audit truth 与 executor routing。
- 具体生成步骤允许继续通过 `Executor Adapter` 选择最合适的执行器；只有在拿到显式 proof 后，才允许把某条 route 迁到新的 executor。
- executor backend 的 public contract 只冻结 `codex_cli` 与 `hermes_agent`；旧内部 adapter 名称只映射到这两类 backend，不成为新的 public backend。
- `execution_shape` 单独表达为 `structured_call` 或 `agent_loop`；显式 HTML route 的 `render_html` 默认 `structured_call`，`fix_html` 先结构化回修，复审仍阻断时最多升级一次 `hermes_agent + agent_loop`。
- route-level `structured_call` routing 只作为 opt-in domain config 生效；未配置或未命中时继承 effective default executor，effective default executor 优先取 request、OPL handoff、domain local config，再回到内建 `codex_cli`。
- 本仓不维护 `simple_llm` 或 `openai_compatible_gateway` 作为一等 backend；不同 provider/model 适配交给外部 `Hermes-Agent` runtime 或相应 domain adapter proof。

## 2026-04-13

### 决策：移除 repo-local pack/compiler 创作路径，保留 pack 的 boundary 语义

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 统一改为 `runtime-family + Codex CLI structured generation`。
- repo-local `pack/compiler` 不再 author storyline、blueprint、visual_direction、render_html 这类创作真值。
- `pack` 继续保留为 domain boundary、pack-id carrier 与 typed shell，但不得再回退成脚本填充 / 编译式创作主链。
- legacy `pack-runtime` compiler registry 从 workspace 与依赖图移除，避免测试或后续修改误把旧路径重新接回 active mainline。

## 2026-04-21

### 决策：RCA 对外第一身份收口为独立 visual-deliverable domain agent

- `RedCube AI` 对外主语固定为独立 domain agent，可被 `Codex`、`OPL` 或其他通用 agent 直接调用。
- `gateway / harness` 继续保留为内部架构边界语言，不再作为仓库对外第一身份。
- repo-verified direct route 与 OPL-hosted integration route 必须共同指向同一个 downstream domain-agent entry（`invokeDomainEntry` service-safe surface）。
- 对外第一公开入口优先收口到单一 `redcube-ai` app skill；`invokeOplHostedProductEntry` 只保留为 OPL-hosted integration surface。
- `status` 只作为该 skill 下的 machine-readable product-entry overview / intake / entry-shell contract；repo-local `redcube product` CLI 当前只保留 `invoke` direct domain target，product status / session / manifest wrapper 由 OPL generated/default caller 持有，不代表 GUI / WebUI / 最终用户前台壳已落地。

### 历史决策：保持 honest owner split，不改 default executor owner

- 状态：此段保留为 2026-04-21 owner split 背景；当前 active owner split 以 2026-05-10 provider-backed OPL runtime target 为准。
- `Hermes-Agent` 不再作为默认 managed runtime owner；OPL stage-led family runtime provider 承担托管路径，Temporal 是 production required provider，Hermes 只保留为显式非默认 Agent executor adapter 或 proof lane。
- `RedCube AI` 继续持有 visual-domain truth 与 domain durable surfaces。
- `Codex CLI` 继续是 executor adapter 选中的第一公民 concrete executor 选项；runtime owner split 以 OPL provider 持有 stage attempt runtime / attempt ledger 为准。

### 决策：OPL 角色收口到 family-level runtime hosting

- `OPL` 在这条主线中只保留 family-level session/runtime/projection 编排与 shared modules/contracts/indexes。
- `RedCube AI` 不被表达为 `OPL` 内部 workflow，而是独立 domain-agent 节点；OPL-hosted 调用与 direct 调用只是入口差异，不是 domain ownership 差异。
