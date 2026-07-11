# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Last reviewed: `2026-07-11`

Dated native proof、workspace path、attempt id、screenshot path、no-regression ref 流水和 proof 命令摘要不再追加到本文；这些过程证据进入 `docs/history/process/` 或 runtime/evidence ledger。本文只保留 current readout、open gates、owner delta 和完成顺序。

## 当前唯一真相

RCA 当前唯一 active completion plan 就是本文。North-star 目标态读 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)；项目当前角色、架构、硬约束和决策读核心五件套；过程性 dated follow-through、closeout tranche、proof 命令流水、run/probe id 和旧路线读 `docs/history/**`、runtime evidence 或提交历史。

2026-07-11 过度设计审计以 17 项为当前 completion scope；2026-07-10 的 stdlib walker、default registry、validator utility、退役 `getRun` / Hermes public surface、单消费者 Parts factory、overlay value/type/validator 重复和 private-platform retirement guard 八项只作为历史结构子集读取，不能替代本轮逐项验收、main 吸收、worktree 清理或远端读回。历史语境见 [RCA 过度设计收薄设计](../references/rca-overdesign-thinning-design.md)；本文继续是唯一 active completion plan，最终状态必须逐项折回本文、核心 docs、contracts、source 和 tests。

### 2026-07-11 17 项过度设计收口

下表以可复核 implementation ID 和 absorbed commit 记录本轮范围；`done` 只表示实现已吸收。状态以 `plan_completion_audit.json` 和当前 Git ref 为准，不能由这张表推导 visual ready、exportable、handoffable、owner receipt 或 production ready。

| # | Implementation ID | 状态 | 吸收提交 |
| --- | --- | --- | --- |
| 1 | `node_recursive_fs_walkers` | `done` | `a6ddb0b8` |
| 2 | `orphan_state_index_contract_removal` | `done` | `a6ddb0b8` |
| 3 | `cli_import_meta_main` | `done` | `a6ddb0b8` |
| 4 | `unreferenced_logo_asset_removal` | `done` | `a6ddb0b8` |
| 5 | `source_string_only_test_removal` | `done` | `22037a6f` |
| 6 | `source_augmentation_export_facade_removal` | `done` | `22037a6f` |
| 7 | `agent_lab_manifest_body_removal` | `done` | `22037a6f` |
| 8 | `python_dependency_ssot_uv_lock` | `done` | `d5092be5` |
| 9 | `phase2_current_program_snapshot_retirement` | `done` | `22037a6f` |
| 10 | `runtime_state_display_alias_removal` | `done` | `22037a6f` |
| 11 | `runtime_json_write_helper_consolidation` | `done` | `22037a6f` |
| 12 | `action_catalog_contract_projection` | `done` | `e64e557d` |
| 13 | `capability_map_projection_deduplication` | `done` | `22037a6f` |
| 14 | `ppt_execution_adapter_inline` | `done` | `a7d15700` |
| 15 | `managed_python_runtime_uv_and_browser_env` | `done` | `d5092be5`, `67860e68` |
| 16 | `private_platform_guard_scope_consolidation` | `done` | `22037a6f` |
| 17 | `stage_control_plane_contract_projection` | `done` | `e64e557d` |

Closeout 发现 OPL compiler 真实 consumer 还需要标准 declarative manifest carrier，已以 `c2db68e1` 补齐：`agent/stages/manifest.json` 只承载 compiler 所需的六个 stage、repo refs、action refs 和 authority boundary；它不复制 RCA route / professional-skill body。`contracts/stage_control_plane.json` 继续是 RCA direct product-entry 与 Codex executor 的 canonical visual route surface；这些结构验证不授予 OPL visual truth、review/export 或 owner-receipt authority。

2026-06-30 SSOT refresh：本文的默认 active gap 只维护功能面落地、结构收薄、source hygiene、generated/default caller thinning、repo-local adapter retirement、compatibility-free retirement 和 legacy naming guard。真实 Temporal controlled visual-stage long-soak、production-like repeated no-regression、visual ready、exportable、handoffable、human approval、App/operator sustained consumption 和 production-ready 不再混入功能/结构 gap。RCA 当前仍需关注的缺口是 generated/default caller thinning、repo-local adapter delete after cutover、compatibility-free retirement、naming / legacy string hygiene；这些只在 OPL default caller parity、no-active-caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write 和 tombstone/provenance 成立后关闭。

2026-06-30 functional closure gate：`contracts/physical_source_morphology_policy.json#/default_caller_tail_readback/retained_default_caller_boundary_gate` 已把 default-caller tail readback 的 retained boundaries 显式化。当前 `tail_surface_count=0` 只表示没有可立即执行的 tail cleanup candidate；`product_entry_continuity_refs_adapter`、`domain_action_adapter_guarded_actions`、`product_entry_manifest_projection`、`deliverable_route_attempt_shell`、`repo_shell_verification_wrappers`、`runtime_watch_projection`、`operator_evidence_stability_projection`、`executor_runtime_route_run_records` 仍必须等 OPL generated/default caller parity、no-active repo-local default caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write、retired alias no-resurrection 和 tombstone/provenance pointer 齐备后，才能删除或进一步收薄。该 gate 禁止把 empty tail worklist、`cleanup_candidate_count=0`、source guard clean 或 focused tests 写成 physical delete、default-caller cutover、visual-ready、domain-ready 或 production-ready。

## Native PPT `ppt-master` 非劣效一体化工作单

2026-07-10 修复前基线显示，RCA 虽已有 Stage prompt / professional specialist skill / tool-helper 三层结构和按 route 注入的专业 Skill，但 native writer 曾把多类对象退化为普通 shape，benchmark helper 曾丢弃 fixture 原始 `native_shapes`，quality evaluator 也曾允许单一 structural shape 同时满足 non-text visual 和 anti-card gate。本轮已分别从 typed object fidelity、fixture preservation 和 evaluator fail-closed 三处修复这些根因；下表只把 fresh executable evidence 支撑的范围标为 done。

本轮唯一目标态规格是 [RCA 原生 PPT 非劣效目标态规格](../specs/native-ppt-ppt-master-parity.md)。所有并行 lane 都服务同一完成条件，不形成第二 active plan，不把单个 commit、focused tests、mock proof 或 refs-only contract 当成阶段完成。

| Work item | Owner surface | Current status | Completion gate |
| --- | --- | --- | --- |
| Existing owner-closure absorption | domain entry / native route owner boundary | `done` | owner series 与 follow-up 已吸收；generated session currentness、Stage Folder locator 与 AST import closure 在目标侧验证。 |
| Typed native object materializer | Python native helper / OfficeCLI / OOXML | `done` | text/shape/connector/picture/group/path/chart/table/metric-grid package fidelity、unknown kind fail-fast 与 zero-write preflight 已落地。 |
| Native presentation semantics | Native PPT Designer + helper | `done` | notes、transition、timing、optional animation 已由真实 OfficeCLI/OOXML package materialization 与 readback 验证；静态页仍独立可读。 |
| Template intelligence and fill | Template Profiler + helper | `done` | theme/master/layout/placeholder/chart/table preservation 与 template-focused tests 已落地。 |
| Visual semantic evaluator | PPT Reviewer + screenshot/contact-sheet review | `done` | dependency/timeline/ladder/chart/matrix 语义、connector endpoint、anti-decoration/card gate 与 package SHA binding 已落地。 |
| Professional method corpus | Story Architect / Visual Director / Native PPT Designer / Reviewer | `done` | pinned `ppt-master` communication/style/76 visualization source catalog 已全量映射到本地 registries 和 5 个 professional skill/resource consumer；17 个 workflow 均有 provenance 与 adopt/adapt/watch/reject/no-code-needed 分类。 |
| Real benchmark and proof | tests/fixtures + native proof + RCA authority | `partial` | 真实 6 页 native PPT proof、package/OfficeCLI/LibreOffice true render 与独立 visual review 已有证据；同源双跑五人盲评、跨 viewer fresh human readback 和 parity owner receipt 未完成。 |
| Progress-first no-regression | product entry / stage loop | `done` | route auto-continuation、targeted repair、typed blocker 与无第二 executor pass 的回归均保留。 |
| Truth/docs/current-program foldback | contracts / current-program / core docs | `done` | 本文、status/architecture/spec、learning/parity contracts 与 current-program completion audit 已对齐。 |
| Absorb and cleanup | main session | `historical` | 2026-07-10 integration target 的 full 715/715、historical 5/5、smoke 55/55、fast 245/245、family 4/4、typecheck、strict readback、current-program 35 refs、Fallow 0 issues 与 diff-check 仅保留为历史证据；不覆盖本轮 17 项的验证、push 或 cleanup。 |

风险档为 `L3/L4`，验证预算为 `full`。TDD 仅用于已确认的对象退化、fixture 丢失和 evaluator 假阳性回归；最终完成证据必须包含真实 PPTX package/readback、render artifact、visual review 和 mainline completion audit。

### 2026-07-10 Plan Completion Audit

非 Live 功能/结构范围已全部落地。完整 native parity 目标仍是 `partial`，因为以下证据不能由合同、focused tests 或单套真实样片替代：

| 审计项 | 状态 | 完成度 | Fresh / machine evidence | 缺口与 owner 路径 |
| --- | --- | ---: | --- | --- |
| 2026-07-10 八项 overdesign thinning 子集 | `historical` | 不作为当前完成度 | [RCA 过度设计收薄设计](../references/rca-overdesign-thinning-design.md#2026-07-10-历史完成度记录) | 不能替代 2026-07-11 17 项审计的逐项验收、main 吸收与远端读回。 |
| Professional Learning Landing | `done` | 100% | `ppt-master-learning-landing.json`、design registry、professional skill/resource bindings、engine contract tests | 不包含 upstream runtime、asset/SVG body 或 authority。 |
| Native object fidelity | `done` | 100% | object package 48/48、chart/picture/group/connector package readback、unknown-kind fail-fast | 无已知非 Live 缺口。 |
| Editability round trip | `done` | 100% | 独立 editability regression 1/1；chart/text/fill/position/notes edit -> save -> OOXML readback -> LibreOffice render | 缺 renderer 时继续 `missing_renderer_dependency` fail closed。 |
| Blind parity harness | `done` | 100% | same-source lock、anonymous packet、review-set hash、Student-t lower bound、critical defect/edit-task gates、unknown metadata fail-closed | 只产生 candidate，不签 owner receipt。 |
| Live same-source parity verdict | `blocked` | 0% | `ppt-master-parity-benchmark.json` 明确 `non_live_harness_landed_live_evidence_pending` | RCA owner 需真实双跑、5 名独立盲评、完整 edit evidence、private binding 和 fresh owner review。 |
| Native presentation semantics | `done` | 100% | notes、transition、timing、animation target/effect/trigger/duration 均有真实 package materialization 与 OOXML readback | 无已知非 Live 实现缺口。 |
| Cross-viewer human readback | `blocked` | 0% | LibreOffice true render 已有单套 proof；当前无 fresh PowerPoint/Keynote/Google Slides 对照验收 | 需 PowerPoint、LibreOffice，加 Keynote 或 Google Slides 的 fresh same-source human/cross-viewer evidence。 |
| OPL canonical agent id consumption | `done` | 100% | generated interface fresh readback 为 `agent_id=rca`、`target_domain_id=redcube_ai` | 身份分工已闭合；RCA 不复制 OPL 生成器。 |
| Fallow production gate | `done` | 100% | target commit `f07d2e0e`；固定 Fallow 3.3.0、30 entry points、production `--fail-on-issues` 读回 0 issues | 39 个保留项均为逐文件 ABI/analyzer 边界；未使用全局 `publicPackages` 或 `ignoreExportsUsedInFile`。 |
| OPL Temporal transport / restart probe | `partial` | 67% | `rca-temporal-long-soak-probe-20260710.json` 记录 6/9：Temporal reachable、managed worker ready、真实重启后 history requery 与 domain boundary 均成立 | OPL Runway 仍需同一 fresh proof 中完成 Codex attempt、typed closeout 与 retry/dead-letter 观察。 |
| Real RCA visual-stage long soak / production authority | `blocked` | 0% | provider transport probe 未产生 RCA visual-stage artifact、review/export acceptance 或 owner receipt | 仍需同一真实 visual-stage run 的 artifact locator、review/export、retry/dead-letter/requery/resume 与 RCA owner receipt 或稳定 typed blocker；不得据 6/9 transport probe 声称 visual/production ready。 |

机器可读对应面是 `contracts/runtime-program/current-program-parts/current_state/plan_completion_audit.json`。任何 blocked 项都不得从本文的结构完成度推导为 ready、current、accepted 或 production complete。

2026-07-09 retained helper / thin adapter cleanup gate fresh readback 继续落在上述边界内：`private-platform:readback` 只证明 source guard clean，未产生 physical delete authorization、default-caller cutover authority、owner receipt 或 typed blocker instance roundtrip。因此当前执行动作是保留为 refs-only / authority adapter 并记录 no-safe-delete blocker，不删除源码、不新增 alias / facade。

本文执行原则是功能/结构优先：generated/default caller cutover、repo-local session / domain_action_adapter / runtimeWatch / operator projection / neutral route-run adapter thinning、compatibility-free retirement、naming / legacy string hygiene、Stage Artifact / review-repair / artifact locator functional boundary 和 no-resurrection guard 不等待真实 Temporal long-soak 或 production-like repeated no-regression。Visual ready、exportable、handoffable、human approval、production visual-stage long-soak、real visual memory lifecycle receipt、App/operator sustained consumption 和 production-ready claim 只在对应声明前回 owner evidence surface；conformance、mock provider route chain、refs-only production acceptance、single dated sample proof 或 provider completion 不能替代。

## 当前完成进度

当前读数：

| 维度 | 当前状态 | 读法 |
| --- | --- | --- |
| 功能/结构差距 | `legacy_generic_runtime_closed_strict_purity_pending` | `functional_structure_gap_count=0` 只说明旧 generic runtime / shell owner 问题已分类并删除核心 managed runtime；stage control plane 已具备 OPL standard Progress-First delta policy 与 `family-stall-lineage.v1` typed blocker lineage policy，fresh OPL conformance / stage readiness 无 hard blocker；OPL replay-certification drilldown 已消费 declared event-log、attempt-ledger、runtime-event 与 owner-receipt refs，4 条 `human_gate:redcube_operator_review_gate` closeout replay success refs 仍缺失，但 RCA production acceptance 已输出对应 RCA-owned typed blocker refs，并由 OPL `stage-replay-missing-receipt` ledger record/verify，fresh evidence-worklist 读为 RCA 4 条 `blocked_by_domain_owned_typed_blocker_ref`。这些 blocker 只表示 operator-review receipt pending，不是 human approval、visual ready、exportable、handoffable 或 production ready；active repo-local product/session/domain_action_adapter/runtimeWatch/operator projection/neutral route-run record adapters 仍需 OPL default caller cutover 和删除/收薄。 |
| 生产证据 | `native_sample_review_export_closed_with_soak_gap` | `contracts/production_acceptance/rca-production-acceptance.json` 已记录 body-free artifact-producing owner receipt refs，并暴露逐 work item / 逐 stage 的 refs-only payload summary；native editable PPTX live materialization / review / export proof lane 已有 dated evidence。2026-07-10 OPL Temporal transport probe 已达到 6/9，并证明真实 managed-worker restart 后 history 可重查；它尚未完成 Codex typed-closeout attempt、retry/dead-letter，也未运行真实 RCA visual-stage，因此 production-like repeated visual-stage no-regression、domain ready、handoffable 和 production ready 仍开放。 |
| 命名/合同卫生 | `identity_split_guarded_hygiene_tail_open` | `contracts/foundry_agent_series.json` 现为 OPL Foundry policy consumer：`domain_id`/`foundry_agent_id` 为 `rca`，`redcube_ai` 保持 authority owner 与 generated stage control plane target domain，`redcube-ai` 只保留 package / skill locator 角色。它只 pin OPL canonical policy/skeleton/shared release，并保留 RCA visual delta refs；generic series profile、workspace topology、public spine 与 feedback policy body 全部由 OPL owned/generated/hosted surface 持有。`managed`、`gateway`、`runtime`、`session`、`domain_action_adapter` 等历史词仍只能按 semantic-id、tombstone、refs-only adapter、domain handler target 或 package/protocol boundary 读取。 |
| 物理源码形态 | `strict_source_purity_tail_readback_landed` | repo-local session / domain_handler / watch / operator projection / neutral route-run record adapter 仍可见，只能作为 refs-only adapter、domain handler target、native helper implementation 或 default-caller thinning tail；`contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate` 已把这些 retained boundaries 的 active-caller matrix、false-delete guard、no-resurrection / forbidden-write guard 机器化，`#/default_caller_tail_readback` 逐 surface 暴露当前 role guard、缺失 evidence worklist、owner-delta route 和 typed blocker ref shape。该 static / local code-analysis readback 不证明 OPL generated default-caller parity、owner/live acceptance，也不授权 physical delete、default-caller cutover、visual ready、exportable、handoffable、domain ready 或 production ready。 |
| Purpose-first owner delta | `owner_delta_first_gate_active` | 默认 operator 下一步只问哪个 owner 欠什么真实 delta：RCA artifact-producing owner receipt、review/export receipt、visual memory accept/reject receipt、workspace receipt scaleout、production-like no-regression ref、Temporal controlled visual-stage long-soak ref、human review receipt 或 typed blocker。Refs-only accounting、session currentness、workbench projection、provider completion 和 structural conformance 只能作为定位信号，不能写成视觉进展或 production readiness。 |
| Docs lifecycle | `single_active_truth_owner` | 本文只持有 current truth、open gap、结构卫生尾项、下一步 baton 和验证口径；历史路线、retired surface、dated closeout、run/probe 流水和可直接复制的长 prompt 模板进入 history/process/tombstone/provenance。 |

这些状态不能互相升级：结构闭合不等于 visual ready、exportable、handoffable，也不等于 production visual-stage long soak 完成。

## 目标态

RCA 的目标形态固定为：

```text
Declarative Visual Pack
  + OPL generated/hosted surfaces
  + minimal visual authority functions
```

RCA 持有 visual truth、source readiness、communication strategy、visual direction、route truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt、typed blocker 和 native helper implementation。

OPL Framework / App 持有 provider-backed stage runtime、queue/wakeup、attempt ledger、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。

Direct route 与 OPL-hosted route 都必须进入同一套 RCA-owned service-safe domain entry、stage pack、route truth、review/export gate 和 artifact authority。

## 已落地

| Area | Current status | Current owner / evidence |
| --- | --- | --- |
| Standard OPL Agent structure | done, standard OPL roots after cutover | `agent/`、标准 OPL `contracts/stage_control_plane.json` / `contracts/action_catalog.json`、refs-only `contracts/pack_compiler_input.json`、`contracts/runtime-program/current-program.index.json`；OPL generic stage runtime / pack compiler / Foundry series profile 不再由 RCA root contracts 维护 |
| Visual memory curator professional skill | done structurally | `agent/professional_skills/rca-visual-memory-curator/SKILL.md`、`contracts/capability_map.json` 和核心 docs 已把 visual memory proposal / accept-reject review / writeback lifecycle 收为 refs-only professional method layer；RCA 继续持有 memory body、accept/reject judgment、owner receipt 和 typed blocker，OPL 只 transport/project locator、proposal、receipt 和 coverage refs。本项不声明 real memory lifecycle receipt scaleout、visual ready、exportable、handoffable、domain ready 或 production ready。 |
| Capability map professional resolver | done structurally | `contracts/capability_map.json#/capabilities?surface_role=professional_skill` 是 7 个 professional skill body、skill/resource refs 与 authority boundary 的唯一 canonical 声明；`feedback_token_index` 只提供反向 routing，`skill_local_resource_pack` 只提供共享 resource 要求。重复 id/resource/token/path projection 已删除。`tests/rca-ppt-three-route-agent-lab-suite.test.js` 继续验证 canonical skill/resource refs、feedback token index、dry-run token cases 与 AgentLab handoff refs-only 边界，`contracts/agent_lab_handoff.json#/dry_run_token_mapping_check` 不复制 dry-run tokens / flags。本项不声明 visual ready、exportable、handoffable、domain ready 或 production ready。 |
| Generic private runtime cleanup | done | `docs/status.md`、`docs/decisions.md`、`contracts/functional_privatization_audit.json`、`contracts/physical_source_morphology_policy.json` |
| RCA retained authority surfaces | done | `authority_surface_id` contracts、production acceptance surface、product-entry manifest |
| Direct / hosted boundary | done structurally | product-entry manifest、标准 OPL `family_action_catalog`、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor refs、stage control projection；repo-local Foundry generic CLI spine 已退役 |
| Stage artifact kernel adoption | done structurally | `contracts/stage_artifact_kernel_adoption.json` 是 OPL family conformance 的统一 machine-readable adoption contract；`contracts/stage_control_plane.json` 与 `contracts/artifact_locator_contract.json` 固定 Stage Folder role manifest / receipt 接口；`tests/stage-folder-contract.test.js` 覆盖 role manifest、stage receipts、helper output refs、review/repair/export role 映射和 orphan output 边界。 |
| Cognitive stage pack adoption | done structurally, standard root | `contracts/cognitive_kernel_adoption.json`、`contracts/golden_path_profile.json`、`agent/tools/domain_affordances.md` 与标准 `contracts/stage_control_plane.json` 只保留 RCA visual stage ids / refs / stage contract pointers / authority boundary；完整 generic policy/body 由 OPL generated product-entry manifest descriptor 或 OPL substrate 持有；`contracts/pack_compiler_input.json` 只固定 `agent/` pack refs、cognitive pack refs 和 minimal authority refs，不授权 OPL 写 visual truth、artifact body、review/export verdict 或 owner receipt。 |
| Purpose-first adapter thinning | done structurally, evidence tail open | `contracts/foundry_agent_series.json` 的 thin consumer ABI、`contracts/functional_privatization_audit.json` 与 focused pack contract tests 固定 retained surface 只能作为 declarative visual pack refs、domain handler target、minimal authority function 或 tombstone/provenance 读取；`managed/gateway/session/domain_action_adapter` 历史词不能成为 authority source、active public surface 或 generic owner surface。 |
| Domain action dispatch source boundary | `thin_dispatch_parts_landed` | `packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/dispatch-orchestration.ts`、`dispatch-evidence-actions.ts`、`dispatch-receipt-actions.ts`、`dispatch-shared.ts`、`contracts/physical_source_morphology_policy.json#/active_surface_classifications/domain_action_adapter_guarded_actions`、product-entry focused tests | Dispatch orchestration is now a thin action router; evidence / owner-closeout materialization, receipt / memory / lifecycle authority functions and shared typed-blocker/envelope helpers are separate parts under the existing machine source classification. This is a source-boundary thinning step only: it does not claim OPL generated default-caller cutover, no-active repo-local caller, visual ready, exportable, handoffable, domain ready or production ready. |
| Operator evidence projection ref reuse | `shared_projection_ref_constants_landed` | `packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/operator-evidence-refs/evidence-constants.ts`、`operator-evidence-readiness.ts`、`operator-evidence-payload-summaries.ts`、`operator-evidence-refs/{production-tail-workorder,receipt-monitor-handoff}.ts`、`shell-projections.ts`、focused product-entry tests | Operator-evidence manifest / owner-route / workorder builders now reuse one repo-local ref constant set instead of handwriting the same projection pointers in multiple files. This only thins refs-only assembly and does not claim default-caller cutover, physical delete, visual ready, exportable, handoffable, domain ready or production ready. |
| Source morphology guard SSOT | `json_contract_readback_adapter_landed` | `contracts/physical_source_morphology_policy.json`、`packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/physical-source-morphology-policy.ts`、`npm run private-platform:readback` | Physical source morphology 的字段级机器正文只由 JSON 合同持有；TS builder 只读回合同，不再维护 tail-gate/source-ref integrity 派生模块。This is structural guard thinning only; it does not claim visual ready, exportable, handoffable, domain ready, production ready, default-caller cutover or live evidence. |
| Codex plugin legacy alias cutover | `canonical_plugin_scaffold_only` | `plugins/redcube-ai/.codex-plugin/plugin.json`、`plugins/redcube-ai/skills/redcube-ai/SKILL.md`、`tests/codex-plugin.test.js` | Root `.codex-plugin/plugin.json`、repo-local `scripts/install-codex-plugin.ts`、`plugins/rca` 和 `plugins/redcube-ai/skills/rca` alias 已退役；RCA repo 只维护 `plugins/redcube-ai/` canonical scaffold/source locator。Codex marketplace registration / install 由 OPL/plugin Flow owner 管，不声明 visual ready、exportable、handoffable、domain ready 或 production ready。 |
| Node prompt surface retirement | `prompts_node_retired_no_active_caller` | `prompts/node/**` removed after active caller scan; canonical prompt refs remain `agent/prompts/*.md`, with detailed assets limited to `prompts/ppt_deck/` and `prompts/xiaohongshu/`. | This deletes an uncalled historical node prompt corpus only. It does not change stage prompt contracts, pack compiler required paths, product-entry behavior, visual route truth, owner receipts, runtime data or production evidence. |
| Type-only pack package collapse | `pack_type_boundary_collapsed` | `packages/redcube-runtime/src/families/ppt/index.ts`、`packages/redcube-runtime/src/families/{xiaohongshu,poster-onepager}/types.ts`、`tests/pack-first-completion.test.js`、`tests/typescript-service-boundary-cases/package-dependency-boundary.test.js`；the three `packages/redcube-pack-*` package directories and three runtime-family workspace package directories have been removed. This closes package-boundary overdesign only; pack ids remain strings and this does not change visual route truth or owner authority. |
| Registry source single-source | `registry_package_boundary_collapsed` | `packages/redcube-runtime/src/default-registries.ts`、runtime/package-surface tests；default overlay and runtime-family module lists live inside `@redcube/runtime`. Default overlay registry is a static declaration table, not package-name dynamic discovery; overlay catalog no longer exposes `packages.overlay` / `packages.pack`. |
| Overlay package ABI contraction | `overlay_package_abi_contraction_landed` | `packages/redcube-overlay-{ppt,xiaohongshu,poster-onepager}` 已物理退役；原 source 已移入 `packages/redcube-runtime/src/families/{ppt,xiaohongshu,poster-onepager}/overlay/`，`@redcube/runtime` 重新导出原 family overlay public API。Root tsconfig references、runtime package dependencies、package-lock、compiled export contract、package-surface tests、registry tests、family onboarding tests、CLI isolated install fixture 与 PPT focused tests 已同步。`@redcube/overlay-core` 保留为 active shared registry/contract primitive。This closes package-boundary overdesign only; it does not claim visual ready, exportable, handoffable, domain ready, production ready, default-caller cutover or OPL physical delete authority. |
| Review gate summary thinning | `governance_gate_summary_reuse_landed` | `packages/redcube-governance/src/reviews.ts` reuses `review-state-parts/freshness-gates.ts`; `packages/redcube-domain-entry/src/actions/audit-deliverable.ts` intentionally keeps its local fallback builder because it cannot depend on governance without widening package ownership. |
| CLI option parsing stdlib adoption | `node_util_parse_args_landed` | `apps/redcube-cli/src/cli-parts/options.ts` now uses `node:util.parseArgs` tokenization with the existing long-option map semantics preserved for unknown `--key value` options; `tests/cli-v2-smoke-cases/review-and-root-resolution.test.js` locks `--workspace-root`, boolean, inline value and ignored short-option behavior. |
| Domain-entry local helper reuse | `domain_entry_action_utils_landed` | `packages/redcube-domain-entry/src/actions/action-utils.ts` now owns repeated `safeText` / `requireField` / `requireSafeSegment` / JSON read helpers for the product-entry, session, fanout, route-run lookup fail-closed and domain-action action cluster. This is package-local reuse only; tests, scripts and other packages keep local helpers unless they share an existing package owner. |
| Runtime helper owner-local reuse | `runtime_helper_owner_local_reuse_landed` | `packages/redcube-runtime/src/runtime-utils.ts` owns repeated source-augmentation / source-readiness / route helper `safeText` / `ensureDir` / JSON read helpers; `packages/redcube-runtime-protocol/src/protocol-utils.ts` owns Stage Folder / screenshot / source-truth / Python helper helpers; PPT family reuses existing `packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core-helpers.ts`. Remaining raw helper names are helper owners, nullable/readback variants such as `readJsonIfPresent` / `readJsonIfExists`, response parsers, or package singletons where a new util file would add coupling without net simplification. This is owner-local source hygiene only, not a new cross-repo utility package or a grep-zero mandate. |
| Product-entry retained static export thinning | `static_retained_tail_thinned` | `packages/redcube-domain-entry/src/actions/domain-entry-contract.ts`、`packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/policy.ts`；unused exported constants are now file-private or removed. This is static callable-surface cleanup only, not default-caller cutover or live evidence closure. |
| Domain-entry unused public type thinning | `domain_entry_unused_type_exports_thinned` | `packages/redcube-domain-entry/src/index.ts`、`packages/redcube-domain-entry/src/types-parts/foundation.ts`、`packages/redcube-domain-entry/src/types-parts/product-entry.ts`、`tests/typescript-package-surfaces.test.js`；无 active importer 的 request/response helper types now stay file-local instead of being re-exported through the package type barrel. |
| Product-entry manifest mapper reuse | `manifest_mapper_reuse_landed` | `packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/utils.ts` now owns the repeated action-metadata projection and skill command contract mappers used by `get-product-entry-manifest.ts`、`manifest-return.ts` and `shell-catalog.ts`. This is package-local manifest assembly thinning only; it does not change product-entry authority, generated/default caller status, visual/export verdicts or live evidence. |
| Test JSON IO helper reuse | `test_json_io_helper_landed` | `tests/helpers/json-io.ts` owns the shared test-only JSON read/write helper used by high-repeat route tests (`ppt-native-ppt-repair-runtime`、`xiaohongshu-deliverable-e2e`、`ppt-image-first-quality-nonregression`). Remaining local JSON helpers stay allowed where they are package-specific fixtures, contract-local readers, or lower-value one-file helpers; this is not a grep-zero mandate. |
| Retired/legacy guard density thinning | `retired_guard_density_thinned` | `contracts/functional_privatization_audit.json` keeps one compact top-level retirement guard；module rows point to that guard and no longer repeat owner-evidence lane, lifecycle receipt, typed-blocker or delete-authorization bodies. `contracts/physical_source_morphology_policy.json` keeps one retained-boundary gate and one compact readback summary；the empty owner-delta pack、duplicate retained gate and per-surface false-guard copies are removed. OPL default-caller still consumes the required keep/typed-blocker/no-forbidden-write refs from `bridge_exit_gate`. This is contract/test-portfolio thinning only; it does not authorize retired surface resurrection or physical delete. |
| Private-platform strict readback | strict_readback_landed | `scripts/check-private-platform-retirement.ts`、`npm run test:private-platform:strict`、`scripts/verify.sh private-platform:strict`、`tests/rca-private-platform-retirement-readback.test.js` | Strict readback reads the compact functional retirement guard and physical source morphology policy, then checks domain_action_adapter blocked/forbidden writes, active-source resurrection patterns, behavioral forbidden constructs and the product-session TypeScript import closure. `scripts/check-private-platform-retirement.ts` remains the single contract-backed no-resurrection owner; `passed_repo_source_guard_only` does not claim default-caller cutover, physical delete, visual ready, exportable, handoffable, domain ready or production ready. |
| Current-program aggregate retirement | `current_program_aggregate_retired` | `contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**`、`scripts/current-program/**`、`tests/helpers/current-program-contract.js`、`tests/runtime-program-provenance.test.js` | The former `contracts/runtime-program/current-program.json` aggregate is physically deleted. Current-program readers assemble from source parts/index, and `contracts:current-program:check` now fails if the aggregate reappears. This closes the second-truth machine snapshot, not visual/export/domain readiness. |
| Codex executor adapter surface | `codex_executor_adapter_test_surface_landed` | `tests/codex-executor-adapter.test.js`、`scripts/test-registry.ts`、`scripts/run-test-group-lib.ts`、`scripts/check-private-platform-retirement.ts`、CLI help | The old `codex-cli-client` test/public wording surface is retired in favor of Codex executor adapter semantics. RCA still uses Codex CLI as the concrete executor, but the generic executor adapter/attempt ledger owner remains OPL. |
| Codex executor / config routing thinning | `codex_executor_config_tail_thinned` | `packages/redcube-runtime/src/executors/index-parts/batch-session-pool.ts`、`packages/redcube-runtime/src/executors/codex-caller.ts`、`packages/redcube-config/src/index.ts`、focused executor/config tests | Codex batch execution no longer accepts a fake `sessionPool` descriptor / reuse strategy knob while the real exec surface is `--ephemeral` per stage; runtime readback still reports per-stage session ids. `redcube-config` now marks `domain_local_user_config` only when a routing file explicitly declares `default_executor`; a structured route config file by itself inherits the OPL / built-in default instead of creating an RCA-local default executor claim. Retained tail: OPL runtime-manager selected-executor receipt / attempt-ledger parity is not proven here, so this is not default-caller cutover, physical delete, visual ready, handoffable, domain ready or production ready evidence. |
| Runtime OPL owner boundary | `runtime_opl_owner_boundary_landed` | `packages/redcube-runtime-protocol/src/executor-runtime.ts`、`packages/redcube-runtime/src/route-execution-refs.ts`、`runtime-topology.ts`、`packages/redcube-runtime/src/default-registries.ts`、focused runtime tests | Runtime-family catalog, route execution refs and executor models now carry explicit OPL generic owner fields and RCA refs-only route policy roles; RCA-local diagnostic route-run lifecycle API, record bypass and local event-log read surface are removed. This does not delete RCA visual route implementations or transfer visual truth/review/export authority. |
| Overlay surface helper consolidation | `overlay_surface_helper_consolidation_landed` | `packages/redcube-overlay-core/src/surface.ts`、`packages/redcube-runtime/src/families/*/overlay/surface.ts`、`tests/typescript-service-boundaries.test.js` | Repeated overlay bundle/path/validator shell logic is centralized in overlay-core while family-specific validators stay local. `createSurfaceValidators` accepts path-to-validator maps, so runtime-owned family overlay sources do not need repeated `relativePath` / `validate` wrapper objects for each surface artifact. This removes duplicate helper code without creating a new generic runtime owner. |
| Standard stage pack v2 launch gate | done structurally, OPL-owned generic runtime | `contracts/stage_control_plane.json` 中 6 个 visual stage 已改为 OPL `family-stage-control-plane.v1` 标准输入，只保留 RCA stage refs、stage ids、stage contract pointers、artifact authority refs 与 no-visual-authority-transfer boundary；`user_stage_log`、progress delta、typed blocker lineage 和 generic stage runtime body 不再由 RCA root contract 维护。OPL installed runtime / generated substrate 的 live readiness 仍属于 OPL owner surface，不由本 root contract 声明。 |
| Executable visual pack discipline | done structurally | `agent/quality_gates/visual_pack_discipline.md`、`agent/knowledge/markdown_route_policy.md`、`agent/quality_gates/package_distribution.md`、`contracts/pack_compiler_input.json`、product-entry manifest refs 和 `declarative_visual_pack_input.visual_pack_discipline_contract` 已把 Kami 可学习的高层实践折成 RCA-owned brand precedence、source/material pass transparency、density/sparse-page evidence、显式可选 Markdown/Marp refs-only route、package distribution consistency、render evidence、review/export gate 和 owner refs，不采用外部审美、模板、运行面或 authority。 |
| Minimal `/goal` and PPT AgentLab surfaces | done structurally | `contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json`、`contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json`、`contracts/agent_lab_handoff.json` |
| Current-program source shape | done | `contracts/runtime-program/current-program.index.json`、`contracts/runtime-program/current-program-parts/**` 与收薄后的单一 aggregate bundle manifest metadata；`functional_privatization_audit`、OPL adoption、visual pack compiler handoff 和 active baton 的 `production_evidence_scaleout_refs` 等大型 surface 在 current-program 中只保留 `canonical_ref_only_no_body_copy` projection refs，不再复制完整 machine snapshot body。`current-program.index.json` 只保留 source locator `source_part_refs`；重复 locator alias `leaf_refs` 已删除。 |
| Large machine contract snapshots | done structurally | `contracts/runtime-program/opl-family-contract-adoption.json` 已收为 compact aggregate，只保留 canonical contract refs / generated product-entry readback refs；`contracts/stage_control_plane.json` 和 `contracts/action_catalog.json` 已改为 OPL `family-stage-control-plane.v1` / `family-action-catalog.v1` 标准输入，`contracts/pack_compiler_input.json` 保持 refs-first pack input。`contracts/functional_privatization_audit.json` 不再重复嵌入 `generated_interface_consumption` body，只保留 ref 和 canonical `opl_generated_interface_consumption` body。完整 generic machine body 回到 OPL generated/hosted substrate 或 product-entry manifest readback，不在 RCA root contracts 重复复制。 |

已闭合项不在 active plan 里追加 dated closeout。需要追溯 run、probe、commit 或 verification transcript 时读 `docs/history/process/**`、runtime evidence 或提交历史。

## 功能/结构差距

按 strict standard-agent purity，当前仍有开放功能/结构差距。`functional_structure_gap_count=0` 只作为旧 read-model 的 legacy-owner 分类结果读取，不作为 active source 纯净完成声明。

当前必须继续推进：

- `generated_default_caller_cutover`：OPL `opl agents default-callers --agent rca=/Users/gaofeng/workspace/redcube-ai --json` 当前已读到 generated interface / wrapper bundle / active caller cutover proof 为 ready，且 owner decision shape 已观察为 `keep_as_authority_adapter_ref` / `no_further_opl_default_caller_delete_work=true`。RCA repo-local active/default target 保持 `domain-handler export|dispatch`。这只是 structural replacement + keep decision evidence；同一 read model 仍明确 `physical_delete_authorized=false`、`default_caller_delete_ready=false`，因此当前最优处置是保留 RCA authority adapter，而不是继续追 OPL default-caller physical delete。
- `repo_local_adapter_delete_after_cutover`：RCA active source 中的 product-entry/session/internal domain_action_adapter implementation refs/runtimeWatch/operator evidence/stability projection、neutral route-run append-only event refs / route-run refs adapter 和 old compatibility path 在 no-active-caller、owner receipt/typed blocker roundtrip、direct/hosted parity 与 no-forbidden-write proof 成立后删除或收薄到 domain handler target。`loadRouteRun` / runtime `loadRun` lookup public tail 已退役；`readRouteRunEvents` / runtime `readEvents` local event-log read tail 已退役；runId-only lookup fail closed 到 RCA typed blocker / OPL ledger refs 路由。
- `compatibility_free_retirement`：只保护旧 public path 的测试、alias、facade、gateway/runtime/session/domain_action_adapter compatibility path 直接删除；历史只保留在 history/tombstone/provenance。

Purpose-first domain-thinning gate：

- `machine_guard_anchor`：`contracts/foundry_agent_series.json` 的 OPL policy consumer ABI 与 `contracts/functional_privatization_audit.json` 是本轮默认 owner-delta / adapter thinning 的机器锚点；默认 return shape 是 `visual_deliverable_progress_delta_or_rca_owned_typed_blocker`，物理删除必须同时满足 replacement parity、no-active-caller、owner receipt / typed blocker、no-forbidden-write 和 tombstone/provenance。
- `visual_pack_discipline_preserved`：image-first、HTML、native PPTX、review/export gate、artifact locator、visual memory 和 native helper implementation 是 RCA visual pack discipline；不得为了减少 route 而删成 generic shell。
- `cognitive_kernel_preserved`：Cognitive Kernel 只进入 stage 内部策略声明，保留当前 `source_intake -> communication_strategy -> visual_direction -> artifact_creation -> review_and_revision -> package_and_handoff` 外层流程和 `ppt_deck` image-first 默认路线；工具目录是可用 affordance，不是 workflow script，候选池是 stage-internal refs，不增加用户可见选择负担，也不能关闭 RCA review/export gate。
- `generic_surface_thinned_only_after_gate`：session、runtimeWatch、operator evidence/stability projection、domain_action_adapter descriptor、neutral route-run record、product/status/workbench wrapper 只有在 OPL default caller parity、no-active-caller、RCA owner receipt/typed blocker roundtrip、no-forbidden-write proof 和 tombstone/provenance pointer 同时成立后，才能删除或收薄。
- `compatibility_surface_forbidden_after_gate`：退役后不能保留 alias、facade、default dispatch、旧 public path 测试或 success payload compatibility field；只能留下 semantic-id tombstone、negative input guard、history/provenance ref 或 machine-readable no-resurrection policy。
- `production_tail_is_owner_delta`：production evidence tail 的下一步必须产出 artifact/review/export/memory/workspace/no-regression/long-soak/human-review owner evidence 或 typed blocker，不能再以 naming guard、currentness repair、refs-only ledger hygiene 或 provider completion 充当进展。

以下情况会进一步扩大功能/结构差距：

- 新增或恢复 RCA-owned generic scheduler、runner、attempt ledger、session/workbench shell、artifact gallery/handoff shell、review/repair transport、workspace/source shell、observability/SLO、generic native-helper envelope 或 generated wrapper owner。
- retained authority surface 缺少接口、active caller、不能上收原因、receipt/blocker/ref 输出边界或 no-forbidden-write 证据。
- 旧 `managed`、`gateway`、`runtime`、`session`、`domain_action_adapter`、retired public entry、federation、bridge 或 retired executor-priority 口径恢复为 active public entry、callable alias、compatibility facade 或 generic owner。
- 测试重新保护旧 public path 可调用性，而不是 current contract、no-resurrection guard、fail-closed negative input、owner receipt、typed blocker 或 tombstone semantics。

## Ready / Export 声明边界

本文不维护 ready / production evidence worklist。visual ready、exportable、handoffable、human approval、Temporal controlled visual-stage long-soak、production-like repeated no-regression、workspace receipt scaleout、App/operator sustained consumption 和 production-ready claim 只在 RCA-owned evidence contracts、runtime/evidence ledger 或单独 evidence owner 中读取。

Active plan 只保留可独立落地的非 live 缺口：generated/default caller thinning、repo-local adapter delete after cutover、compatibility-free retirement、naming / legacy string hygiene、Stage Artifact / review-repair / artifact locator functional boundary 和 no-resurrection guard。结构 conformance、focused proof、no-regression refs、AgentLab suite、production acceptance refs-only payload、provider completion 或 sample proof 只能作为 false-ready 边界，不在本文形成执行 worklist。

## 结构卫生尾项

这些尾项按 strict purity 归入功能/结构差距的执行清单；它们不表示 RCA 持有 domain truth 之外的合法长期平台。Path-level active caller、当前角色、可迁往 OPL 的 generic 子域和退役门的 SSOT 是 [RCA 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)，并由 `contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`、source/tests 和 runtime evidence 验证。本文只保留三类执行读法：

| Open tail | Active-plan reading | Detail owner |
| --- | --- | --- |
| generated/default caller thinning | RCA repo-local product/session/domain handler/runtimeWatch/operator projection/route-run append-only event refs / route-run refs adapters 只能作为 refs-only adapter、domain handler target、native helper implementation 或 migration input；`loadRouteRun` / runtime `loadRun` lookup public tail、`readRouteRunEvents` / runtime `readEvents` local event-log read tail，以及 `getRun` / `redcube runs get` 均已物理退役；`runtimeWatch` 的 runId-only lookup 继续 fail closed 到 OPL stage attempt / provider ledger refs。OPL generated/default caller parity 成立后继续收薄或删除剩余 generic wrapper。 | 私有实现迁移台账、`contracts/private_functional_surface_policy.json`、source/tests |
| compatibility-free retirement | 旧 public path、alias、facade、gateway/runtime/session/domain_action_adapter compatibility path 只能在 no-active-caller、owner receipt / typed blocker roundtrip、no-forbidden-write 和 tombstone/provenance pointer 成立后直接删除或 tombstone。 | 私有实现迁移台账、`contracts/physical_source_morphology_policy.json`、retired-surface provenance |
| naming / legacy string hygiene | `managed`、`gateway`、`runtime`、`session` 和 `domain_action_adapter` 等词只可作为 semantic-id、tombstone/provenance、negative guard、refs-only adapter、domain handler target 或 package/protocol boundary。 | `contracts/physical_source_morphology_policy.json#legacy_name_allowance`、private inventory、guard tests |

Default-caller / source morphology current readout：runtime-family source、`runDeliverableRoute` /
`run-deliverable-route-parts/`、executor route-run refs-only parts 和 related route refs 的 path-level
classification 归 `contracts/physical_source_morphology_policy.json#/active_surface_classifications`
与 [RCA 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)。本文只保留
当前读法：这些 surfaces 可以是 RCA-owned visual route implementation、domain handler target、
stage artifact / review-export refs、executor policy refs 或 refs-only route-run projections；它们不能成为
RCA-owned generic runtime、session/workbench、attempt ledger、runtime record store、event log、
generated wrapper owner 或 default-caller cutover evidence。2026-07-05 已进一步把 route recovery +
`stop_after_stage` continuation 收成 `recovery.ts::runRouteWithRecoveryAndContinuation()` 共享薄入口，
避免主 route 入口与 `fix_html` escalation 继续各保一份私有 attempt-shell glue。历史 dated slice、source-ref list、
legacy allowance 和 test closeout 过程归 `docs/history/process/`、machine contracts、source/tests
或 git history。2026-07-06 CLI `deliverable run|execute` 的 OPL stage-plan request 也收成单一薄 builder；
两个命令只保留 stop policy 差异，不再复制 workspace/runtime/session/return-surface payload。

不能直接删除的 explicit remainder：

以下 remainder 是当前 SSOT 摘要，不是按日期延展的执行清单。具体字段、历史 proof 和 closeout 过程归机器合同、`docs/history/**`、runtime/evidence ledger 或提交历史；本文只保留删除门、owner 边界和 false-ready guard。

| Remainder theme | Current SSOT | Current handling |
| --- | --- | --- |
| Managed product-entry hardening provenance | `contracts/runtime-program/managed-product-entry-hardening.json` | Tombstone-only / semantic-id history index。Active runtime-program、session continuity 和 morphology policy 不再依赖逐项旧 surface id 清单表达当前保护。 |
| Active source role whitelist | `contracts/physical_source_morphology_policy.json` | Active callable path 只能落在 domain handler target、refs-only read model、native helper、repo-native verification wrapper、package protocol boundary 等当前角色；retired alias、generic gateway / session / runtime / generated-wrapper owner 继续 fail closed。 |
| Payload / retired field no-resurrection | `contracts/physical_source_morphology_policy.json` | Payload guard 只允许 forbidden payload / receipt role 字段表达禁止项；retired alias 不得回到 active payload template、success payload、JSON key 或 readiness claim。 |
| Verification / proof shell wrappers | `contracts/physical_source_morphology_policy.json` | Active `.sh` wrappers 只按 repo-native verification / proof runner / dependency helper 读取，不是 RCA runtime、session、workbench、attempt ledger 或 generated-wrapper owner，也不替代 generated/default caller thinning、physical retirement、visual/export verdict 或 production evidence。 |
| Product-entry manifest projection | `contracts/physical_source_morphology_policy.json` | `getProductEntryManifest` 及 parts 只作为 refs-only manifest projection root；不关闭 generated/default caller thinning、physical retirement、visual/export verdict、production evidence 或 App/operator release evidence。 |
| Deliverable route and executor run refs | `contracts/physical_source_morphology_policy.json` | `runDeliverableRoute` / executor route-run refs 只能产生 route refs、stage artifact refs、domain-entry response refs、executor policy refs、append-only refs emission 和 typed blocker；`loadRouteRun` / runtime `loadRun` public lookup tail、`readRouteRunEvents` / runtime `readEvents` local event-log read tail 均不再存在。剩余 refs/event surfaces 不能成为 RCA-owned generic route attempt shell、retry/dead-letter owner、attempt ledger、runtime record store、event log、session runtime 或 generated wrapper owner。 |
| Default-caller tail readback | `contracts/physical_source_morphology_policy.json#/default_caller_tail_readback` | Static / local readback 只证明 active-caller matrix、false-delete guard、no-resurrection / forbidden-write guard、当前 role guard、missing evidence 和 typed-blocker ref shape；不证明 OPL generated default-caller parity 或 owner/live acceptance，不执行 physical delete、不签 owner receipt、不创建 typed blocker 实例、不声明 default-caller cutover、visual/export/handoff/domain/production ready 或 App/live readiness。 |
| Source-ref integrity | `contracts/physical_source_morphology_policy.json#/source_ref_integrity_gate` | Active source refs 和 machine-boundary refs 必须解析到 repo-local path / directory / anchor；URI / URL、绝对路径、父目录穿越、`human_doc:*` machine ref、悬空 ref 或 retired compatibility ref 越界都会重新打开 naming/source hygiene gap。 |
| Policy source structure | `contracts/physical_source_morphology_policy.json#/policy_source_structure` | JSON 合同是 source morphology guard SSOT；`buildPhysicalSourceMorphologyPolicy` 只是 readback adapter，tail-gate/source-ref integrity TS 派生模块已退役。不表示 physical delete、OPL default caller parity、visual/export/handoff/domain/production ready 或 App/operator release evidence。 |
| Production evidence compatibility aliases | production acceptance active contract / generated manifest | Active machine contracts 不再输出 `legacy_payload_field_aliases`；OPL 仍可消费当前 `domain_receipt_refs` / `no_regression_refs` path，但 RCA 不把它们声明成旧字段兼容映射。 |
| OPL executor policy refs | `pack_compiler_input.executor_policy_source_ref` / `stage_control_plane.stages[*].selected_executor` | RCA 只物化 Codex executor descriptor；generic executor selection、hosted adapter、attempt ledger 和 receipt residency 归 OPL owner surface，本仓不保留 routing config、Hermes adapter/proof 或本地 fallback。 |

本轮关键词扫描补充：`launcher|wrapper|alias|compat|legacy|status|sidecar|product-entry|helper|facade|gateway|harness|bridge` 命中的 active surfaces 中，未发现可安全物理删除且无 active caller 的普通入口。保留项按下表读取，不能写成 RCA repo-local generic runtime，也不能在退役门未齐时删除。

| Retained surface | 保留原因与 active caller | OPL owner surface | 退役门 |
| --- | --- | --- | --- |
| `product-entry` / `session` / `status` / `runtimeWatch` / operator projection / `domain_action_adapter` wrapper tail | `packages/redcube-domain-entry/src/actions/get-product-entry-manifest*`、session / manifest / runtime-domain-action tests 和 CLI/product-entry help 仍消费这些 refs-only projection、domain handler target 或 migration inputs。 | OPL generated/default CLI、MCP、product-entry、status、session、domain_action_adapter、workbench shell。 | OPL generated/default caller parity、no-active repo-local caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof、retired-alias no-resurrection 和 tombstone/provenance pointer 同时成立。 |
| service-safe domain entry / `domain-handler export|dispatch` target | product-entry manifest、AgentLab suites、domain-handler export tests 和 direct/hosted route 都回到同一 RCA-owned downstream target。保留原因是 domain package target，不是 generic wrapper owner。 | OPL generated wrapper / hosted package surface 调用该 target。 | 不作为普通 wrapper 删除；只继续收薄 generated descriptor / shell 部分，保留 RCA review/export、artifact authority、owner receipt、typed blocker 和 visual refs 边界。 |
| Python native helper implementation | `python/redcube_ai/native_helpers/**`、`tests/python-native-helper-catalog.test.js`、native PPT product-entry / live proof tests 仍把它作为 RCA visual-native implementation。 | OPL native-helper envelope / execution host / catalog carrier。 | OPL envelope 能承载 materialization / validation / export refs；RCA route、visual director review、screenshot review 和 export gate 保持；无 active direct helper caller 或 caller 已迁到 hosted envelope；保留 provenance 后收薄。 |
| repo-native verification / proof wrappers | `scripts/verify.sh`、private-platform / default-caller readback、focused guard tests 仍是 repo source guard。保留原因是 verification wrapper，不是 runtime、session、workbench、attempt ledger 或 generated-wrapper owner。 | OPL / CI 只消费验证结果或 harness refs，不拥有 RCA domain truth。 | 对应 guard 迁到 OPL-owned validation surface 或不再有 repo-local source role；no-resurrection 与 no-forbidden-write guard 保持；history/provenance 后删除 wrapper。 |
| Executor policy refs | `contracts/stage_control_plane.json#/stages/*/selected_executor` 是唯一 RCA repo-source 输入；本地 routing schema/config/adapter/proof backend 已删除。 | OPL Agent Executor Adapter / attempt ledger / runtime record owner。 | 保持 refs-only consumption、no-active RCA adapter caller、no-silent-fallback 和 RCA visual authority boundary。 |

详细 active caller、分类和退役门读 [RCA 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)；本文只保留当前状态和顺序。

## 当前 owner-delta 执行顺序

后续推进只按 owner-delta 读取。本文保存可执行 baton 字段，不保存可直接复制的长 Agent prompt 模板。每条工作都必须从当前 RCA `agent/` pack、contracts、runtime-program current-program、source/tests、product-entry manifest、domain handler target、production acceptance、workspace/runtime receipts、artifact locator、review/export gate、OPL/App fresh read-model、Temporal/OPL provider refs、owner receipts 和 typed blockers 取 live truth；dated native proof、workspace path、attempt id、screenshot path、no-regression ref 流水和 proof 命令摘要只读 `docs/history/**` 或 runtime/evidence ledger。

执行顺序只保留非 live 结构清理：`generated_default_caller_thinning`、`naming_contract_hygiene` 和 `compatibility_free_retirement`。OPL readiness、provider completion、stage replay projection、refs-only ledger hygiene、naming guard、single native sample、mock proof、doctor pass 或 structural conformance 只能定位边界和缺口，不能写成 visual ready、exportable、handoffable、domain ready、human approval 或 production ready。

当前 plan 关闭本轮 docs tranche 的条件是：active truth、核心五件套、contracts/source/tests 与 fresh read-model 一致，且 production evidence tail 没有被误写成 readiness verdict。Fresh OPL default-caller readback 已观察到 `keep_as_authority_adapter_ref`，所以该项的合理处置是保留 RCA authority adapter 且 `no_further_opl_default_caller_delete_work=true`；这不是 physical delete 授权，也不是 default-caller delete ready。只有 owner 另行给出 `physical_delete_authorization_ref` 时，才进入 physical-delete lane。Durable 当前结论折回本文、核心五件套、runtime-program contract、policies/specs/references 或 owner docs；dated closeout、run/probe id、proof transcript、worktree/branch closeout 和 old route provenance 进入 `docs/history/**`、runtime/evidence ledger 或提交历史。

1. `generated_default_caller_thinning`
   随 OPL generated/default session、domain_action_adapter、product-entry、workbench、Agent Executor Adapter、attempt ledger 和 native-helper envelope 持续默认化，继续收薄或删除 RCA repo-local adapter，只保留 domain handler target、visual authority function、native helper implementation 和 refs-only return shape。当前 skill activation 已把 repo-local supporting shell keys 收到 direct entry 与受控 proof helper；`status`、`start`、`preflight`、`session`、`manifest` 只保留为 OPL generated shell key / command surface，不能再被读成 RCA repo-local supporting shell；active machine refs 的 manifest pointer 也统一落到 `opl_generated:product_entry_manifest#...`。

   RCA-owned Hermes API / loop bridge、runtime descriptor、routing config、adapter/proof backend 与 `fix_html` 二次 executor 编排均已物理退役。OPL Agent Executor Adapter、attempt ledger 与 runtime record 是 generic owner；RCA 只保留 `stage_control_plane` executor policy refs、显式非 Codex adapter 拒绝测试和历史 provenance。

   收薄执行门以 `contracts/private_functional_surface_policy.json` 为准：每个候选 generic surface 必须有 replacement owner、OPL default caller parity、no-active-caller、RCA owner receipt/typed blocker roundtrip、no-forbidden-write proof、retired-alias no-resurrection 和 tombstone/provenance pointer。未满足时只允许标成 refs-only adapter / migration input；满足后直接删除或 tombstone，不新增兼容层。

2. `naming_contract_hygiene`
   将历史 `managed`、generic session store、gateway/runtime/domain_action_adapter 读者可见语义继续降到 provenance / semantic-id / tombstone。任何后续改名必须先确认 active caller、runtime-program pointer、test contract、retired-alias no-resurrection policy 和 `source_ref_integrity_gate`；active surface 分类清单只能使用 repo-local path / directory / anchor，不能出现悬空 ref、绝对路径、父目录穿越、URI / URL ref 或无 anchor 的 machine boundary ref。

3. `compatibility_free_retirement`
   active caller 迁出后直接删除旧 CLI/MCP alias、product wrapper、gateway/runtime facade、domain_action_adapter compatibility path 和只保护旧 public path 的测试；保留的测试只断言 current contract、fail-closed negative input、owner receipt、typed blocker、semantic-id tombstone 或 no-forbidden-write proof，不保留 repo-local tombstone code path。

## Next-Round Agent Prompt Baton

- Write scope: `docs/active/rca-ideal-state-gap-plan.md`、核心五件套、runtime-program contracts、source/tests、product-entry manifest、domain handler target、production acceptance、workspace/runtime receipt surfaces、artifact locator、review/export gate、OPL/App fresh read-model、Temporal/OPL provider refs、owner receipts 和 typed blockers。
- Non-goals: 不声明 visual ready、exportable、handoffable、domain ready、human approval、production ready 或 production visual-stage long soak complete；不新增 repo-local generic runtime、session/workbench shell、facade、alias、fallback、compatibility wording 或只保护旧 public path 的测试；不把 dated proof、branch/SHA、workspace path、attempt id、截图路径、proof transcript 或长 prompt 模板写回 active docs。
- Live truth inputs: `contracts/foundry_agent_series.json`、`contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`、`contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**`，以及当前 source/tests、CLI/MCP/product-entry behavior、artifact locator / review-export gate contracts 和 OPL/App read-model shape。`contracts/runtime-program/current-program.json` 已退役，不再生成、保留或作为 read-through/canonical/check 输入；Production acceptance refs 只用于 false-ready 边界或后置 evidence lane，不作为本文默认 worklist。
- Required actions: 按 `generated_default_caller_thinning`、`naming_contract_hygiene`、`compatibility_free_retirement` 顺序推进；满足 replacement parity、no-active-caller、owner receipt / typed blocker roundtrip、no-forbidden-write proof 和 tombstone/provenance pointer 后，旧接口、测试、wrapper、facade、alias、compatibility path 直接退役。live / production evidence 只作为 false-ready 边界或单独 evidence lane 读取，不在本文形成默认工作清单。
- Verification commands: docs-only 维护至少跑 `git diff --check` 和 active stale wording scan；触及 code/contracts/tests/workflow/package/CLI/API 时跑 repo-native focused verification，默认入口是 `./scripts/verify.sh` / `npm test` / `npm run test:smoke`；触及 fast registry、route/runtime、visual authority 或 package boundary 时再补 `npm run test:fast` / `scripts/verify.sh meta` / focused contract tests。
- Completion gate: active truth、核心五件套、contracts/source/tests 与 fresh read-model 一致；production evidence tail 没有被误写成 readiness verdict；closed gaps 已从本文移除或改写；history/process/tombstone 只保存 provenance；过时 public surface 没有 active caller 且 replacement proof 成立时已直接退役，不保留兼容面。
- Foldback target: durable current conclusions fold back to本文、核心五件套、runtime-program contract、policies/specs/references 或 owner docs；dated closeout、run/probe id、proof transcript、worktree/branch closeout、old route provenance 和长 prompt 模板进入 `docs/history/**`、runtime/evidence ledger 或提交历史。

## 完成门槛

- `functional_structure_gap_count` 与 `contracts/functional_privatization_audit.json`、`contracts/physical_source_morphology_policy.json`、source surface 和 tests 保持一致。
- `contracts/physical_source_morphology_policy.json` 的 active surface `source_refs` 与 `machine_boundary_refs` 必须解析到真实 repo-local path / directory / anchor；绝对路径、父目录穿越、URI / URL ref、`human_doc:*` machine ref、无 anchor 的 machine boundary ref、active `.sh` wrapper 未被 `repo_shell_verification_wrappers` 覆盖、active product-entry manifest root 未被 `product_entry_manifest_projection` 覆盖，或 active code source 中未被对应 `legacy_name_allowance` 覆盖的 legacy term，都会重新打开 naming/source hygiene gap。该 `source_ref_integrity_gate` 由 focused source-morphology guard 直接覆盖，并把 retired legacy surface id pointer / compatibility payload field policy 限定到 tombstone 或 negative guard 语境；它只证明 active refs 可解析和不复活 generic owner，不能替代 generated/default caller thinning、physical retirement 或 production evidence。
- Production evidence gap 只列真实缺失证据，不混入已闭合结构项，也不把 OPL readiness / provider completion / cleanup proof 写成 visual ready。
- Active plan 只保留当前结论、边界、差距、执行顺序和结构化 baton；dated closeout、命令输出、absorbed tranche、historical comparison、run/probe id 和可直接复制的长 prompt 模板进入 history/provenance 或外部执行记录。
- Doctor 或 stale wording scan 若出现 active-path retired public entry、old Hermes-priority、bridge/gateway/public identity 或 compatibility wording finding，逐条降级到 history/tombstone/provenance 或修正 active wording。
- 代码/contract 变更必须跑 repo-native focused verification；纯 docs 维护至少跑 `git diff --check`。

## 历史索引

- [RCA standard agent 文档过程归档](../history/plans/rca-standard-agent-doc-process-history-2026-05.md)：记录 2026-05 标准 OPL Agent 对齐过程；其中旧 `functional_structure_gap_count=8` 只按归档时点读取。
- [RCA production acceptance/readiness closeout](../history/plans/rca-production-acceptance-readiness-closeout-2026-05-20.md)：记录 AI-first / executor-first 验收读法和 production scaleout remainder。
- [RCA Docs 生命周期治理审计](../history/plans/2026-05-20-doc-lifecycle-governance-audit.md)：记录 active / reference / history 分层处置。
- [历史文档索引](../history/README.md)：保存 Hermes、Phase 2、历史定位、历史计划和 tombstone 的读法。
- [Docs process history](../history/process/README.md)：保存 coverage ledger、docs inventory 和过程 closeout，不承担 active plan。
- [Retired route narratives tombstone](../history/tombstones/retired-route-narratives-2026-05-11.md)：保存旧 gateway、frontdoor、federation、Hermes-first、local-manager 或 bridge residue 的 no-resurrection 语境。

## 验证口径

- 文档维护使用 `git diff --check`，必要时加 stale wording scan。
- Dependency / TS project-reference hygiene 使用 `npm run audit:fallow:production` 或 direct fallow command；读取结果时必须区分可修复 root/dependency owner 问题、真实 public API / barrel residual、有 docs/tests 入口的维护脚本 residual、以及 analyzer 对真实 subpath package usage 的 false-positive。
- 测试只固定 machine-readable contract、schema、CLI/MCP 行为、manifest、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据；不固定 docs prose wording。
- 本文不作为机器接口；若 docs 与 live contracts/source/read-model 冲突，以机器真相为准并修正文档。
