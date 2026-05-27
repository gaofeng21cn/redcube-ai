# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-28`

## 当前唯一真相

RCA 当前唯一 active completion plan 就是本文。North-star 目标态读 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)；项目当前角色、架构、硬约束和决策读核心五件套；过程性 dated follow-through、closeout tranche、proof 命令流水和旧路线读 `docs/history/**`。

当前读数：

| 维度 | 当前状态 | 读法 |
| --- | --- | --- |
| 功能/结构差距 | `legacy_generic_runtime_closed_strict_purity_pending` | `functional_structure_gap_count=0` 只说明旧 generic runtime / shell owner 问题已分类并删除核心 managed runtime；active repo-local product/session/domain_action_adapter/runtimeWatch/operator projection/neutral route-run record adapters 仍需 OPL default caller cutover 和删除/收薄。 |
| 生产证据 | `receipt_scaleout_refs_visible_with_soak_gap` | `contracts/production_acceptance/rca-production-acceptance.json` 已记录 body-free artifact-producing owner receipt refs，并暴露逐 work item / 逐 stage 的 refs-only payload summary；2026-05-28 fresh `domain-handler dispatch/export` 已在 6 个用户级 runtime-state workspace 写出并聚合 36 个 refs-only receipt instances，`receipt_kind_coverage_ready=true`；2026-05-27/28 已有 4 条 RCA-owned no-regression refs 被 OPL ledger 记录/验证为跨 route / 跨窗口 refs-only evidence。`workspace_receipt_scaleout_claimed=false`、`declares_production_soak_complete=false`、`repeated_no_regression_claimed_as_soak=false` 仍保持，继续需要 Temporal controlled visual-stage long soak 与 production-like repeated visual-stage no-regression。 |
| 命名/合同卫生 | `active_hygiene_tail` | `managed`、`gateway`、`runtime`、`session`、`domain_action_adapter` 等历史词只能按 semantic-id、tombstone、refs-only adapter、domain handler target 或 package/protocol boundary 读取。 |
| 物理源码形态 | `strict_source_purity_tail` | repo-local session / domain_handler / watch / operator projection / neutral route-run record adapter 仍可见，只能作为 refs-only adapter、domain handler target、native helper implementation 或 default-caller thinning tail；不能写成最终标准智能体组成。 |

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

| Area | Current status | Live evidence |
| --- | --- | --- |
| Standard OPL Agent structure | done | `agent/`、`contracts/stage_control_plane.json`、`contracts/pack_compiler_input.json`、`contracts/runtime-program/current-program.index.json` |
| Generic private runtime cleanup | done | `docs/status.md`、`docs/decisions.md`、`privatized_functional_module_audit` machine surface |
| RCA retained authority surfaces | done | `authority_surface_id` contracts、production acceptance surface、product-entry manifest |
| Direct / hosted boundary | done structurally | product-entry manifest、family action catalog、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor refs、stage control projection |
| Minimal `/goal` AgentLab workflow | done | `contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json`、`contracts/agent_lab_handoff.json`、product-entry manifest `/goal_workflow_agent_lab_suite`、domain-handler export `/mapped_surfaces/goal_workflow_agent_lab_suite` |
| Current-program source shape | done | `contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**` |

## 当前完成进度

| Area | 当前进度 | 当前读法 |
| --- | --- | --- |
| Standard OPL Agent structure | `classified_with_strict_purity_tail` | RCA 已按标准 OPL consumer 口径闭合旧 generic runtime / shell owner 问题；active wrapper / adapter 仍需 default-caller cutover。 |
| Functional / structural gaps | `strict_delete_after_cutover` | `functional_structure_gap_count=0` 只表示 legacy managed runtime owner 与大类边界已闭合；production evidence tail 已有 RCA-owned body-free artifact-producing owner receipt refs，并已暴露 OPL owner-payload group 可消费的 return shape、逐项 payload template 和 per-stage expected receipt / monitor freshness payload path；active repo-local generic wrapper/adapter 仍需要 OPL cutover、no-active-caller 和 delete proof。 |
| Retained authority surfaces | `active_authority` | Visual truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt 留在 RCA；OPL 只消费 refs 和 generated/default caller。 |
| Docs lifecycle | `single_active_truth_owner` | 本文持有 current truth、gap、结构卫生尾项、下一轮 prompt 和验证口径；历史路线和 retired surface 进入 history/tombstone/provenance。 |

已闭合为标准 OPL consumer 口径的 8 项：

- `opl_generated_surface_production_consumption`
- `repo_local_wrapper_active_caller_migration`
- `focused_hosted_attempt_real_path_cutover`
- `artifact_gallery_handoff_shell`
- `review_repair_transport`
- `opl_app_operator_drilldown`
- `workspace_source_lifecycle_receipt_shell`
- `legacy_physical_cleanup`

旧 repo-local deliverable runner、managed run store、managed DAG scheduler、managed event/prompt/run/liveness/surface/bridge helpers、gateway public managed action handlers 与 runtime-protocol managed run helper/types 已退出 active source/package/test surface。追溯这些实现只读 history/provenance 或旧 commit。

## 功能/结构差距

按 strict standard-agent purity，当前仍有开放功能/结构差距。`functional_structure_gap_count=0` 只作为旧 read-model 的 legacy-owner 分类结果读取，不作为 active source 纯净完成声明。

当前必须继续推进：

- `generated_default_caller_cutover`：OPL generated/hosted CLI/MCP/product-entry/status/session/domain_action_adapter/workbench shell 成为默认 caller，RCA repo-local active/default target 保持 `domain-handler export|dispatch`。
- `repo_local_adapter_delete_after_cutover`：RCA active source 中的 product-entry/session/internal domain_action_adapter implementation refs/runtimeWatch/operator evidence/stability projection、neutral route-run record adapter 和 old compatibility path 在 no-active-caller、owner receipt/typed blocker roundtrip、direct/hosted parity 与 no-forbidden-write proof 成立后删除或收薄到 domain handler target。
- `compatibility_free_retirement`：只保护旧 public path 的测试、alias、facade、gateway/runtime/session/domain_action_adapter compatibility path 直接删除；历史只保留在 history/tombstone/provenance。

以下情况会进一步扩大功能/结构差距：

- 新增或恢复 RCA-owned generic scheduler、runner、attempt ledger、session/workbench shell、artifact gallery/handoff shell、review/repair transport、workspace/source shell、observability/SLO、generic native-helper envelope 或 generated wrapper owner。
- retained authority surface 缺少接口、active caller、不能上收原因、receipt/blocker/ref 输出边界或 no-forbidden-write 证据。
- 旧 `managed`、`gateway`、`runtime`、`session`、`domain_action_adapter`、retired public entry、federation、bridge 或 Hermes-first 口径不得恢复为 active public entry、callable alias、compatibility facade 或 generic owner。
- 测试重新保护旧 public path 可调用性，而不是 current contract、no-resurrection guard、fail-closed negative input、owner receipt、typed blocker 或 tombstone semantics。

## 测试/证据差距

结构 conformance、readiness clean / observable、transition fixture、provider completion、focused proof、stage evidence receipt 或 no-regression ref 都只能证明边界和可观察性；它们不能替代 RCA-owned AI-first review/export verdict。当前 production acceptance 已经用 RCA-owned refs-only domain receipt 关闭 artifact-producing owner receipt 槽位，但没有声明 visual ready、exportable、handoffable 或 production soak complete。

当前 production evidence tail：

| Evidence gate | Current readout | Needed proof |
| --- | --- | --- |
| Artifact-producing owner receipt | body-free refs closed | `contracts/production_acceptance/rca-production-acceptance.json` 记录 `artifact_producing_owner_receipt_ref_closed`、artifact/review/export refs 和 RCA-owned `domain_receipt`；不声明 visual ready、exportable 或 handoffable。 |
| Visual memory lifecycle | runtime receipt refs visible | 6 个用户级 runtime-state workspace 已通过 `emit_workspace_receipt_proof` 写出 12 条 accepted/rejected visual memory writeback receipt refs、18 条 cleanup/restore/retention lifecycle receipt refs、6 条 domain owner receipt refs 和 6 条 no-regression evidence refs；这些仍是 body-free refs-only receipt instances，不写 memory body、artifact blob 或 review/export verdict。 |
| Workspace receipt scaleout | refs visible, claim still false | `domain-handler export --workspace-receipt-scaleout-root ...` 读到 `observed_workspace_count=6`、`observed_receipt_count=36`、`receipt_kind_coverage_ready=true`、`missing_receipt_kinds=[]`；机器面仍保持 `workspace_receipt_scaleout_claimed=false` 与 `declares_production_soak_complete=false`，所以不能写成 scaleout complete、visual ready 或 production soak。 |
| Temporal controlled visual-stage long soak | evidence gap | OPL/Temporal hosted provider residency、restart/resume/re-query、retry/dead-letter、repair cadence 和 RCA owner receipt / typed blocker refs。 |
| Cross-family repeated no-regression | cross-route/window refs visible, soak claim still false | 2026-05-27 `emit_no_regression_evidence` 在两个用户级 runtime-state workspace 写出 `rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a` 与 `rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b`；2026-05-28 又在 `ppt_deck` / `xiaohongshu` 两个窗口写出 `rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2` 与 `rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2`；OPL refs-only ledger 已验证 `opl://external-evidence/redcube_ai/rca-cross-family-repeated-no-regression-20260528-4-refs`。剩余是 production-like visual-stage attempt 中持续出现 no-regression refs、与 Temporal controlled visual-stage long soak 形成可复验链路，且不迁移 visual truth、artifact body、memory body 或 review/export verdict。 |

Production acceptance 只能由 RCA-owned machine surface 记录为 owner receipt、typed blocker、artifact/review/export refs、memory/lifecycle refs 和 next verification refs；OPL structural pass 或 provider completion 不能隐式推出 domain-ready。

最小 `/goal` workflow 的当前完成口径是 `agent_lab_external_suite_passed_with_mock_artifact_export_smoke_plus_codex_native_imagegen_sample`：OPL AgentLab 可以直接运行 RCA suite，OMA 可以读取 `contracts/agent_lab_handoff.json` 生成 no-patch / owner-gated closeout 记录，product-entry 可以从 `opl_hosted` + `run_opl_stage_execution_plan` + `auto_to_terminal` 一次性启动 xiaohongshu workflow；focused test 还用 mock image provider 跑到 `export_bundle`，确认 PNG、publish bundle、caption、publication-state 和 series reports 已落盘。真实图片生成由 Codex executor 原生 imagegen task 单独验证，RCA 不直接读取 Base URL、API key 或 provider token。这个口径关闭“重构后是否还能自动从目标入口推进到可检查 artifact/export 证据”的 smoke gap和“live raster 生成是否能经 Codex executor 进入 artifact path”的最小证明，不关闭 production evidence tail，也不授权 OPL/OMA 写 RCA visual truth、artifact body、memory body、review/export verdict 或 owner receipt。

OPL expected receipt / monitor freshness handoff 与 production acceptance 当前使用同一 forbidden payload policy：visual truth body、review/export verdict body、artifact blob/body、memory body、generic runtime state 和 retired managed runtime alias negative-guard field 都只能触发阻断或审计。该 handoff 的成功路径只输出 body-free receipt / monitor refs；`stage_expected_receipt_payload_summary` 按 `source_intake`、`communication_strategy`、`visual_direction`、`artifact_creation`、`review_and_revision` 和 `package_and_handoff` 暴露 expected receipt / monitor freshness refs 模板、runtime event ref model 和 typed blocker path，其中逐 stage `runtime_event_refs` 从 `family_stage_control_plane.stages[*].stage_contract.runtime_event_refs` 派生，供 OPL/App/operator 定位下一步输入，同时不维护第二套泛化 expected-receipt event 字符串。Production evidence tail 的 typed blocker refs 只通过 `production_tail_typed_blocker_refs` 链接到 `production_evidence_tail_workorder`，不能作为 stage expected receipt / monitor freshness 成功 payload 重新阻断 observed refs。`managed_runtime_compatibility_alias` 这类旧字段现在由 `contracts/physical_source_morphology_policy.json` 的 `retired_compatibility_payload_field_policy` 和 focused guard 限定到 `forbidden_payload_fields`、`forbidden_receipt_fields` 或 policy 自身声明位置，不能作为 active alias、public action key、domain_action_adapter template、success payload field、production readiness claim 或 runtime owner 复活。

## 结构卫生尾项

这些尾项现在按 strict purity 归入功能/结构差距的执行清单。它们不表示 RCA 持有 domain truth 之外的合法长期平台，只记录 OPL generated/default caller、owner receipt roundtrip 和 retired-alias no-resurrection proof 继续默认化后的 refs-only adapter thinning。

| Surface | 当前角色 | 退役门 |
| --- | --- | --- |
| `getProductEntrySession` / session continuity refs | entry-session domain snapshot refs adapter | OPL generated session shell default 化后继续收薄，RCA 仅返回 visual/domain snapshot refs。 |
| direct `runtimeWatch` | direct review/progress refs-only read model | OPL App/workbench live route parity 后继续收薄为 domain ref provider；不恢复 domain_action_adapter default dispatch。 |
| `domain-handler export|dispatch` | domain handler target、guarded visual authority action adapter；`domain_action_adapter` 仅作为 OPL-generated descriptor / internal migration refs 保留 | OPL generated domain_handler wrapper default 化后，只保留 guarded domain action handlers。 |
| operator evidence / stability / efficiency projections | refs-only read model 和 OPL/App consumer projection | OPL App/workbench/observability shell 默认化后，RCA 只输出 owner receipt、typed blocker、artifact/memory evidence refs。 |
| neutral route-run record adapter | route-level executor policy、receipt refs 与 neutral route-run record materialization refs；旧 Hermes-named run/event API 已退役，runtime topology 已使用 `domain_entry_protocol_role`，不保留 active `gateway_role`。 | OPL Agent Executor Adapter、attempt ledger、runtime record/event log 和 stale attempt audit read model 成为 default caller。 |
| legacy historical strings | semantic-id、tombstone/provenance、negative input、refs-only read model、domain handler target 或 package/protocol boundary | provenance consumer 迁出后 rename/delete/tombstone；不新增 public entry、alias、facade 或 compatibility command。 |

不能直接删除的 explicit remainder：

- `contracts/runtime-program/managed-product-entry-hardening.json` 是 tombstone-only / semantic-id provenance surface，仍被 runtime-program provenance、session continuity legacy refs 和 morphology policy 消费。
- `domain_action_adapter_dispatch.product_entry_continuation`、`public_cli_mcp_gateway.get_managed_run`、`domain_action_adapter_dispatch.runtime_watch` 与 retired managed supervision 字符串只作为 retired legacy surface id、tombstone/provenance ref 或 negative dispatch input 存在。
- `contracts/physical_source_morphology_policy.json` 的 `retired_legacy_surface_id_pointer_policy` 已把这些 retired legacy surface id 限定到聚合合同和 current-program leaf snapshot 的 tombstone/provenance pointer；guard tests 会扫描 `contracts/**/*.json`，防止它们重新出现在 active callable path、retired-alias resurrection 或 production readiness claim 语境。
- `contracts/physical_source_morphology_policy.json` 的 `retired_compatibility_payload_field_policy` 已把旧 managed compatibility payload 字段限定到 forbidden payload / receipt negative-guard 指针；guard tests 会阻断它出现在 active payload template、success payload、retired-alias resurrection 或 readiness claim。
- Hermes-Agent loop bridge / API client 仍是显式 opt-in proof backend、executor routing schema、runtime-protocol client 与 Python helper catalog target；它不是默认 runtime owner。

详细 active caller、分类和退役门读 [RCA 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)；本文只保留当前状态和顺序。

## 近期完善计划

1. `production_evidence_tail`
   用低风险真实 workspace 继续跑 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 generated continuation shell 进入 RCA service-safe domain entry，继续累计 `typed_blocker`、`no_regression_evidence`、review/export refs 和 scaleout/long-soak 证据。artifact-producing owner receipt 槽位已由 production acceptance 的 body-free RCA-owned receipt refs 关闭；4 条真实 no-regression refs 已进入 production evidence surface 和 OPL refs-only ledger。`production_evidence_tail_workorder` 继续把 owner-chain apply、memory/lifecycle receipt scaleout、Temporal long-soak 和 cross-family no-regression 排成 refs-only typed-blocker work items，`owner_payload_item_summary` 进一步给每个 work item 暴露 success refs path、domain-owned typed blocker path 和空 payload template，供 OPL/App/operator 接续真实证据，不作为 readiness 声明。

   已新增最小自动化 smoke：`contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json` 可由 `/Users/gaofeng/workspace/one-person-lab/bin/opl agent-lab run --suite ... --json` 直接运行；它验证 `/goal` 单目标、OPL-hosted product-entry、`auto_to_terminal` stop policy、AgentLab required observations 和 no-forbidden-write 边界。`tests/rca-goal-workflow-agent-lab-suite.test.ts` 还覆盖 artifact-producing mock route chain，验证小红书 PNG 与 `export_bundle` 实际落盘。

2. `runtime_evidence_scaleout`
   继续扩大真实 visual memory accepted/rejected receipts、workspace receipt inventory、lifecycle receipt、Temporal long soak 和 cross-family repeated no-regression evidence。当前 6-workspace / 36-receipt refs-only scaleout 与 4 条 cross-route/window no-regression refs 只证明 runtime receipt / evidence instances 可由 RCA domain handler 写入并被 export / acceptance surface 聚合；refs-only projection 只做 accounting，不升级为完成声明。

3. `generated_default_caller_thinning`
   随 OPL generated/default session、domain_action_adapter、product-entry、workbench、Agent Executor Adapter、attempt ledger 和 native-helper envelope 持续默认化，继续收薄或删除 RCA repo-local adapter，只保留 domain handler target、visual authority function、native helper implementation 和 refs-only return shape。

4. `naming_contract_hygiene`
   将历史 `managed`、generic session store、gateway/runtime/domain_action_adapter 读者可见语义继续降到 provenance / semantic-id / tombstone。任何改名必须先确认 active caller、runtime-program pointer、test contract、retired-alias no-resurrection policy 和 `source_ref_integrity_gate`；active surface 分类清单的 repo path / directory / anchor 不能悬空。

   upstream Hermes 历史合同保留历史命令值 provenance，但 object key、active architecture executor chain 和 route-chain prose 已改用 upstream launch / service-safe domain entry 语义；provenance guard 阻断新的 `*_gateway_command*` object key 或 `gateway -> ...` active route chain。

   2026-05-26 fallow production pass 已把 TypeScript workspace diagnostic 和 direct dependency owner hygiene 纳入验证面。Root `tsconfig.json` 只保留 package/app build references，测试聚合继续由 `tsconfig.typecheck.json` 承担；root scripts 的 `@redcube/codex-cli-client`、`@redcube/domain-entry`、`@redcube/runtime`、`@redcube/runtime-protocol` 与 `opl-framework-shared` imports 由 root manifest 声明；overlay/runtime-family registry 的动态 manifest modules 已绑定为 literal loader owner；pack packages 暴露 type-only package surface。Fallow 当前仍会把真实使用的 `@redcube/redcube-config` subpath/root imports 报成 unused dependency，已有源码、dist 与 Node resolution 证据，不能删除真实依赖或用 ignore 掩盖。

5. `compatibility_free_retirement`
   active caller 迁出后直接删除旧 CLI/MCP alias、product wrapper、gateway/runtime facade、domain_action_adapter compatibility path 和只保护旧 public path 的测试；保留的测试只断言 current contract、fail-closed negative input、owner receipt、typed blocker、semantic-id tombstone 或 no-forbidden-write proof，不保留 repo-local tombstone code path。

## 下一轮 Agent prompt

Objective:

- 继续治理 `/Users/gaofeng/workspace/redcube-ai` 的 RCA production evidence tail、generated/default caller thinning 和 naming/contract hygiene；保持 RCA visual authority 不被 OPL 或 docs 误上收。

Write scope:

- `docs/active/rca-ideal-state-gap-plan.md`、`docs/status.md`、`docs/active/opl-private-implementation-migration-inventory.md`、runtime-program contracts、product/domain_action_adapter surfaces、tests 和 source 中仍影响 RCA owner boundary 的部分。

Live truth inputs:

- `AGENTS.md`、`TASTE.md`、核心五件套、本文、RCA target-state/reference docs。
- `contracts/runtime-program/current-program.json`、`contracts/runtime-program/current-program.index.json`、functional privatization / physical morphology contracts、owner receipt / memory / artifact / review/export contracts。
- OPL `agents interfaces --domain rca --json`、OPL framework readiness / App drilldown 中 RCA refs-only evidence 读面、RCA focused tests 和 `scripts/verify.sh`。

Required actions:

- 推进 `production_evidence_tail`、`runtime_evidence_scaleout`、`generated_default_caller_thinning`、`naming_contract_hygiene` 和 `compatibility_free_retirement`。
- 对 retained surfaces 核实 active caller、OPL default caller parity、owner receipt roundtrip、tombstone/provenance 和 retired-alias no-resurrection proof。
- 已满足门槛的 legacy public entry、alias、facade、domain_action_adapter compatibility path 或保护旧路径的测试直接删除、archive 或 tombstone。

Non-goals:

- 不把 structural pass、provider completion、focused proof、stage evidence receipt 或 no-regression ref 写成 visual ready、artifact ready、domain ready 或 production ready。
- 不写 artifact body、visual memory body、review/export verdict 或 owner receipt body。
- 不恢复 `managed`、gateway/runtime/session/domain_action_adapter retired alias 或 Hermes-first active path。

Verification commands:

- Docs-only：`rtk git diff --check`、`rtk rg -n "<<<<<<<|>>>>>>>|=======" docs`。
- 触及 source/contracts/tests：`rtk ./scripts/verify.sh`、`rtk npm run test:fast`、`rtk npm run typecheck` 或相关 focused test group。
- Fallow production hygiene：`npx --yes fallow@latest --root . --no-cache --production --format json --summary > /tmp/fallow-rca-after.json`。

Completion gate:

- Active plan 只保留 current truth、still-open evidence gap、结构卫生尾项和下一步；closed gap 不以 dated closeout 形式留在 active path。
- main checkout 上完成触及面验证；worktree/branch 已吸收清理，或明确因近期写入/未提交改动保留。

Foldback target:

- Durable current truth 折回本文、核心五件套、private inventory 或 machine-readable contracts；历史 route、旧计划、proof 流水和 retired surface 进入 `docs/history/**`、tombstone/provenance、ledger 或提交历史。

## 完成门槛

- `functional_structure_gap_count` 与 `contracts/functional_privatization_audit.json`、`contracts/physical_source_morphology_policy.json`、source surface 和 tests 保持一致。
- `contracts/physical_source_morphology_policy.json` 的 active surface `source_refs` 与 `machine_boundary_refs` 必须解析到真实 repo path / directory / anchor；悬空 ref 重新打开 naming/source hygiene gap，不得继续把分类清单读成可信 closeout。
- Production evidence gap 只列真实缺失证据，不混入已闭合结构项，也不把 OPL readiness / provider completion / cleanup proof 写成 visual ready。
- Active plan 只保留当前结论、边界、差距和执行顺序；dated closeout、命令输出、absorbed tranche、historical comparison 和 prompt 模板进入 history/provenance 或外部执行记录。
- Doctor 或 stale wording scan 若出现 active-path retired public entry、old Hermes-priority、bridge/gateway/public identity 或 compatibility wording finding，逐条降级到 history/tombstone/provenance 或修正 active wording。
- 代码/contract 变更必须跑 repo-native focused verification；纯 docs 维护至少跑 `git diff --check`。

## 历史索引

- [RCA standard agent 文档过程归档](../history/plans/rca-standard-agent-doc-process-history-2026-05.md)：记录 2026-05 标准 OPL Agent 对齐过程；其中旧 `functional_structure_gap_count=8` 只按归档时点读取。
- [RCA production acceptance/readiness closeout](../history/plans/rca-production-acceptance-readiness-closeout-2026-05-20.md)：记录 AI-first / executor-first 验收读法和 production scaleout remainder。
- [RCA Docs 生命周期治理审计](../history/plans/2026-05-20-doc-lifecycle-governance-audit.md)：记录 active / reference / history 分层处置。
- [历史文档索引](../history/README.md)：保存 Hermes、Phase 2、历史定位、历史计划和 tombstone 的读法。
- [Retired route narratives tombstone](../history/tombstones/retired-route-narratives-2026-05-11.md)：保存旧 gateway、frontdoor、federation、Hermes-first、local-manager 或 bridge residue 的 no-resurrection 语境。

## 验证口径

- 文档维护使用 `git diff --check`，必要时加 stale wording scan。
- Dependency / TS project-reference hygiene 使用 `npm run audit:fallow:production` 或 direct fallow command；读取结果时必须区分可修复 root/dependency owner 问题、真实 public API / barrel residual、有 docs/tests 入口的维护脚本 residual、以及 analyzer 对真实 subpath package usage 的 false-positive。
- 测试只固定 machine-readable contract、schema、CLI/MCP 行为、manifest、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据；不固定 docs prose wording。
- 本文不作为机器接口；若 docs 与 live contracts/source/read-model 冲突，以机器真相为准并修正文档。
