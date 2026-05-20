# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-20`

## 文档读法

- 本文只维护 RCA 当前差距、owner 边界、功能/结构 gap、测试/证据 gap 和完善顺序。
- RCA 的 north-star 目标态回到 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)。
- 过程性 dated follow-through、closeout tranche、proof 命令摘要和旧路线归入 `docs/history/`，不在本文承担 current truth。
- 差距按目标态判断，不按当前 RCA 代码是否仍可运行判断。旧 repo-local deliverable runner、run store 和 DAG runtime 已物理删除；product-entry session store、workspace/source intake、memory/writeback transport、artifact export lifecycle、review/repair transport、native helper generic envelope、operator projection、generic CLI/MCP wrapper、executor adapter 和 status/product shell，只要承担通用 framework/runtime 职责，就必须进入 OPL 上收、generated surface 替换、refs-only 收薄或退役分类。
- Descriptor ready、transition fixture、no-regression evidence、provider completion 或 focused proof 都不能写成 visual ready、exportable、handoffable、artifact-producing owner receipt 或 production visual-stage soak；`production consumption complete` 仅限 OPL generated/hosted surface consumption，不等于生产 soak 完成。
- 过时模块、接口、测试、fixture、CLI/MCP alias、product wrapper、gateway/runtime facade 和 docs 入口不保留兼容面。旧 managed run、session/runtime owner、gateway/frontdoor/federation、product-entry continuation、supervision/sidecar compatibility 等 active caller 迁出后直接删除、archive 或 tombstone；测试只保留 current contract、no-resurrection guard 和 provenance，不维护旧 public path。

## 当前定位

RCA 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework / App 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 不把这些通用能力继续写成长期私有平台。

RCA 的目标形态是：

```text
Declarative Visual Pack
  + OPL generated/hosted surfaces
  + minimal visual authority functions
```

当前 acceptance/readiness closeout 口径固定为 AI-first / executor-first：OPL 搭台，Codex/default executor 执行视觉 stage，RCA 保留 visual judgment、artifact authority、owner receipt 与 typed blocker。合同只固定边界、安全、receipt、replay 和恢复，不把执行器、provider、readiness projection 或 structural conformance 写成 visual ready / exportable / handoffable verdict。

## 当前边界

RCA 必须持有：

- source readiness、communication strategy、visual direction、route truth 和 deliverable family policy。
- visual stage pack、prompt/skill、knowledge refs、review/export gate 和 visual transition table。
- canonical artifact authority、artifact mutation authorization、export/handoff verdict 和 owner receipt。
- visual memory body、accept/reject decision、writeback receipt 和 domain learning boundary。
- native helper implementation、typed blocker、safe action refs 和 no-forbidden-write guard。

OPL 必须持有：

- provider-backed stage runtime、queue/wakeup、attempt ledger、retry/dead-letter、human gate transport 和 receipt ledger。
- generic state-machine runner、workspace/source shell、memory/artifact locator、artifact gallery/handoff shell、review/repair transport、observability/SLO 和 App/workbench shell。
- CLI/MCP/Skill/product-entry/sidecar/status/session/workbench/harness wrapper 的 generated/hosted surface，除非 RCA 明确保留为 direct domain handler、refs-only adapter、authority function 或迁移桥。

## 当前功能/结构差距

`classification_closed` 已推进到 standard OPL consumer 口径：RCA 不再声明 generated/hosted wrapper、session、workbench、artifact/review/source shell 或 generic runtime owner；这些面由 OPL generated/hosted surface 持有，RCA 只保留 domain handler target、refs-only adapter、minimal authority function 和 native helper implementation。

旧 repo-local managed runtime 的物理清理已经闭合：active source/package/test surface 不再保留旧 deliverable runner、run store、DAG scheduler、managed event/prompt/run/liveness/surface/bridge helpers、gateway public managed action handlers 或 runtime-protocol managed run helper/types。需要追溯这些实现时只读 history/provenance 或旧 commit。

当前功能/结构差距已清零：

`functional_structure_gap_count=0`

2026-05-18 fresh blocker 说明该计数必须以 OPL read model 为准：`communication_strategy`、`visual_direction`、`review_and_revision` 曾因 `effect_boundary_missing_runtime_event_refs` 被 `family_stage_admission` 阻断。随后 OPL admission 口径收紧为所有 `runtime_guard_required=true` stage 都必须声明 refs。当前修复把 6 个 stage 的 machine-readable event refs 写回 RCA-owned `family_stage_control_plane` 生成源和 `contracts/stage_control_plane.json` 的 `stage_contract.runtime_event_refs` / `trust_boundary.runtime_event_refs`，让 OPL admission / proof bundle 能读取可审计事件边界。该项已闭合为结构修复，不进入 evidence tail。

2026-05-19 的 stage cohort-loop refs 已作为结构闭环落地。RCA 当前六个 stage 都声明 `source_scope_refs`、`cohort_query_refs`、OPL queue `trigger_refs`、`monitor_refs` 和 `dashboard_metric_refs`；OPL isolated verification 对当前 RCA main 返回 `stage_count=6`、`closed_loop_ready_count=6`、`blocker_count=0`。这关闭的是 declarative launch/readiness loop gap；真实 artifact-producing owner receipt、visual memory body reuse、workspace receipt scaleout、provider long soak 和 visual ready/exportable/handoffable verdict 仍归 evidence gate。

2026-05-20 OPL 已把 stage production expected receipt / monitor freshness 的 unobserved 缺口变成 `stage_production_evidence_receipt_record|verify` safe action route，并在 App/operator route 中提供空 `payload_template`、`payload_ref_hints`、机器可审计 `payload_workorder` 与 record 前 preflight。该能力属于 OPL App/operator evidence transport 和 refs-only ledger，不属于 RCA 私有功能面；RCA 的关闭责任是提供真实 artifact-producing owner receipt instance、typed blocker、no-regression evidence、visual memory/lifecycle receipt、direct/hosted parity 或 Temporal controlled visual-stage long-soak refs，并把这些真实 refs 填入 OPL workorder。空 template、声明型占位 ref、OPL ledger receipt ref、artifact/visual memory/domain truth body 都不能作为 RCA 成功证据提交。OPL 验证 stage evidence receipt 只能证明 refs-only roundtrip 可用，不能声明 visual ready、exportable、handoffable、artifact mutation authorization、App/workbench consumption 或 production visual-stage soak 成功。

2026-05-20 Lane B-RCA 已把可回填的 RCA owner evidence 收口成 `opl_expected_receipt_monitor_freshness_handoff`。该 surface 由 RCA production acceptance / operator evidence readiness / sidecar projection 暴露，只包含 body-free owner receipt ref、workspace receipt proof ref、visual memory reuse locator/content ref、repeated no-regression ref、monitor freshness ref 和 typed blocker ref；它是 OPL expected receipt / monitor freshness workorder 的输入，不是 RCA 私有 ledger，也不携带 visual truth、review/export verdict body、artifact blob 或 memory body。

已闭合为标准 OPL consumer 口径的 8 项：

- `opl_generated_surface_production_consumption`
- `repo_local_wrapper_active_caller_migration`
- `focused_hosted_attempt_real_path_cutover`
- `artifact_gallery_handoff_shell`
- `review_repair_transport`
- `opl_app_operator_drilldown`
- `workspace_source_lifecycle_receipt_shell`
- `legacy_physical_cleanup`

这些闭合表示 generic shell/runtime owner 归 OPL，RCA 以 refs-only/domain-handler/authority-function 方式消费。Temporal controlled visual-stage long soak、真实 artifact-producing owner receipt、真实 memory lifecycle receipt、workspace receipt scaleout 和 cross-family repeated no-regression evidence 不再计入功能/结构差距，保留为 production evidence tail。

2026-05-20 继续校准 bridge-module 审计口径：OPL App drilldown 不再只把 RCA 的 10 个 remaining bridge module 投影成 module id，而是必须携带每项的 replacement owner/surface、exit gate、retained RCA authority、required-before-retire 和 forbidden generic owner flags。该读面用于证明这些项是 OPL replacement 上的 refs-only/domain-authority bridge，而不是 RCA 长期持有 generic runtime/session/workbench/wrapper/observability owner；它仍不关闭真实 production evidence tail，也不授权 OPL 删除 RCA domain helper 或 artifact authority code。

2026-05-19 的 standard pack 合同校准把 `pack_compiler_input` 固定为 `canonical_semantic_pack_root="agent/"`，并从 `required_domain_pack_paths` 移除 `agent human README`。README 仍可作为人读入口或导航存在，但不能作为 OPL scaffold 的 required semantic pack 文件；每个 required path 必须指向真实 prompt / stage / skill / quality gate / knowledge 内容。

2026-05-19 的 physical source morphology 调研把 RCA 的源码目标进一步固定：`agent/` 是 Declarative Visual Pack，`contracts/` 和 `contracts/runtime-program/current-program.index.json` / `current-program-parts/**` 是机器合同与 leaf-level program truth，`packages/` / `src` 只保留 visual domain handler、minimal authority function、native helper implementation、refs-only adapter、fixture 或 diagnostic。RCA 的 artifact-heavy 代码是可保留的 visual authority / native helper 实现，不是未来新 Agent 的通用 scaffold；session continuity store、product sidecar/status、operator evidence、stability projection、native helper catalog、runtime-program leaf sync 都必须继续写成 OPL generated/hosted shell 的 domain target、refs-only read model 或 visual authority implementation。

2026-05-19 fresh `opl agents conformance --family-defaults --json` 返回 RCA structural conformance `passed`，family 汇总为 4/4 structural pass。此前 README-only required pack path blocker 已关闭；旧 managed run / supervision / compatibility-script exact token active path gate 已改成中性 retired/tombstone surface 语义。该门槛不声明 production visual-stage long soak、artifact-producing owner receipt、visual memory body reuse、workspace receipt scaleout 或 App/release consumption 已完成。

这条判断吸收的是成熟 agent/runtime 项目对职责分层的经验，不引入它们作为依赖。2026-05-19 live check 中，OpenAI Agents SDK 将 Agent 与 Runner / sessions / handoffs / guardrails 分层；LangGraph 将 state persistence、checkpoint、thread、store、replay 分层；AutoGen 将 agents、tools/workbench、teams 与 state/termination 分层；CrewAI 用声明式 agent role/goal/tools 与 crew/process 承载协作。RCA 对应落点是：visual pack、visual authority/native helpers、runtime orchestration、session continuity、artifact/workbench/evidence gate 分离；OPL 持有通用 shell，RCA 持有 visual judgment 与 artifact authority。

当前 RCA 的物理源码仍有 naming / package hygiene tail：`apps/redcube-mcp/src/server.ts` 仍是 repo-local protocol adapter 并暴露 product-entry grouped surface；`packages/redcube-runtime/src/product-entry-session-store.ts` 仍是 product-entry session store refs adapter；`packages/redcube-runtime-protocol/src/workspace.ts` 与 `runs.ts` 仍持有 workspace/run envelope helpers；`packages/redcube-gateway/src/actions/runtime-watch.ts`、`product-sidecar-guarded-actions.ts` 和 product sidecar handoff parts 仍承担 runtimeWatch、sidecar guarded action、operator evidence 和 generated-surface mapping。它们当前是 domain handler target、refs-only adapter、native helper envelope 或 provenance，不是 RCA generic runtime owner。后续应通过 generated caller parity、contract-safe rename、tombstone 和 no-compatibility-alias 继续清理历史 runtime / gateway / session / sidecar / managed 命名。

因此，历史 `managed`、`managed run`、session store、runtime family、product-entry continuation、sidecar supervision 等命名只允许作为 provenance、semantic-id、retired guard、refs-only adapter 或 domain handler 出现。若未来新增或恢复让 RCA 看起来持有 generic scheduler、runner、attempt ledger、workbench、artifact lifecycle shell、review/repair transport 或 generated wrapper owner 的源码，即使现有 `functional_structure_gap_count=0`，也必须重新打开 physical morphology gap。

2026-05-19 的 OPL legacy cleanup dry-run 读取当前 RCA manifest 后返回 `plan_status=ready` 与 `lifecycle_apply.status=dry_run_ready`，OPL refs-only lifecycle ledger 也已能 verify 读回 RCA 空计划 closure batch receipt。RCA `physical_skeleton_follow_through` 已向 OPL 暴露 provenance refs、history refs 和 tombstone refs，清除了此前 OPL gate 对 `missing_provenance_retention_evidence` 与 `missing_history_or_tombstone_evidence` 的 blocker。该状态只证明 OPL cleanup gate / refs-only ledger 能安全消费 RCA legacy cleanup proof，不表示 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable 已完成。

本轮 production acceptance/readiness closeout 的 expected merged result 是 refs-only evidence 面闭合：RCA stage evidence refs 包含 runtime budget refs 与 replay evidence refs；RCA production acceptance/readiness 文档面保留 owner receipt / artifact receipt / review-export acceptance refs；OPL readiness consumption 能把这些 refs 读成 launch / replay / runtime evidence clean and observable。该结果关闭的是结构与可观察性验收，不关闭真实长时 visual-stage soak、跨 family repeated no-regression 或更多 workspace scaleout；这些继续作为 production scaleout evidence，不作为结构 blocker。

2026-05-20 evidence scaleout lane 已把 production tail 的五类 ref 明确接入 RCA machine surfaces：artifact-producing owner receipt ref、workspace receipt scaleout ref model、visual memory body reuse ref、repeated no-regression evidence refs、naming tombstone follow-through refs。Lane 4B 进一步固定真实 artifact-producing visual route 为 `ppt_deck.image_first.artifact_producing.v1`，即 `author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`。production acceptance fixture、manifest operator projection 与 workspace receipt proof 现在都能读到该 route ref；workspace proof 会产出 owner receipt ref、memory receipt refs 和 no-regression evidence ref；visual memory reuse 只暴露 locator/content refs；repeated no-regression 以 `ppt_deck` / `xiaohongshu` family refs-only cadence 记录；naming tombstone follow-through 继续禁止 compatibility alias。该变更只提升 operator/readiness 可观察性与 scaleout 证据可追踪性，仍不声明 production visual-stage long soak、跨 workspace scaleout 完成、visual ready、exportable 或 handoffable。

2026-05-20 一步到位 closeout 已新增 `contracts/runtime-program/rca-one-shot-production-hardening-closeout.json`。该合同把本轮 A/B/C/D 的计划、完成项、延期项、跳过项、验证要求和 commit/push 状态集中成 machine-readable surface，并由 `current-program` active baton closeout 指向。当前可升级为 current truth 的内容是：artifact-producing image-first route refs 已进入 production acceptance / operator evidence / workspace receipt / sidecar projection；production executor routing 默认 fail-closed 且 Codex CLI 仍为第一公民 executor；repo-local wrapper morphology 已收薄到 domain handler target、refs-only adapter、minimal authority function、native helper implementation 和 provenance。当前不能升级的内容是：Temporal controlled visual-stage long soak、真实 memory lifecycle receipt scaleout、cross-family repeated no-regression production cadence 和最终 visual-ready/exportable/handoffable verdict。

## 当前 cleanliness tail

RCA 已符合标准 OPL Agent 的结构口径，但仍有两类完善尾巴需要继续推进：

- `production_evidence_tail`：artifact-producing route/owner receipt/workspace receipt/memory reuse/no-regression/tombstone refs 已可追踪；仍需真实跨 workspace scaleout、Temporal controlled visual-stage long soak、最终 RCA-owned review/export verdict 与 cross-family repeated no-regression production evidence。
- `naming_contract_hygiene_tail`：历史 runtime-program contract、human_doc 语义 ID、field name 或 task intent 中仍可能保留 `managed` 作为 session-continuity / provenance 命名。它们不代表 active 旧 runtime owner；后续清理必须通过 contract migration / tombstone policy / compatibility-free rename 做，不把旧 runtime surface 复活为 alias。

2026-05-19 后，`contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**` 是 current-program 的 leaf-level canonical source；`current-program.json` 只保留为既有 consumer 的 generated read-through snapshot。`scripts/sync-current-program-leaf-index.ts` 负责按 `split_policy.max_leaf_json_line_count` 从聚合快照递归生成/校验 index 与 leaf parts，`npm run contracts:current-program:check` 和 `runtime-program-provenance` 测试共同锁定每个 leaf ref 与聚合快照的 JSON pointer value 一致性。后续不再把巨型 `current-program.json`、巨型 section 文件或手工拆分当成唯一编辑入口。

2026-05-18 cleanup pass 已把 active manifest/status 读者面中的 managed-web / managed-continuation wording 收敛为 OPL stage runtime、end-user shell 与 production evidence tail 口径。`run_opl_stage_execution_plan` 是当前默认 task intent；旧 managed deliverable task intent 不保留 public compatibility alias，后续若要迁移历史数据必须走显式 deprecation / tombstone contract，不重新引入默认公开 alias。

当前仍保留的非领域平台形状只允许按以下接口存在：

| Surface | Active caller | RCA 角色 | 不能上收理由 | 退役门 |
| --- | --- | --- | --- | --- |
| product-entry `session_continuity` store | `getProductEntrySession`、manifest/session projection、OPL generated session shell | entry-session domain snapshot refs adapter | OPL 可持有 generic session shell，但不能伪造 RCA topic / deliverable / review / artifact refs | OPL generated session shell 成为默认 caller，RCA 仅返回 refs-only snapshot |
| product sidecar export/dispatch | OPL family runtime provider、manifest、family action catalog | domain sidecar target / guarded action adapter | OPL 可生成 sidecar wrapper，但 RCA 必须签发 owner receipt、typed blocker、memory/lifecycle receipt 和 visual transition decision refs | OPL wrapper 默认化后，RCA 只保留 guarded domain action handlers |
| product status / manifest action metadata | OPL descriptors、CLI/MCP/skill projections、direct product entry | declarative pack input / domain handler target | OPL 可生成 wrapper；RCA 继续持有 action semantics、route truth 和 visual authority refs | generated wrapper parity 成为唯一公开 shell，RCA 不再扩展 generic wrapper 代码 |
| Python native helper catalog | native PPT/review/export proof lanes、helper catalog tests | domain-native helper implementation | OPL 可持有 generic helper envelope；RCA 仍需实现 Office/PPT/screenshot/export domain helper | helper envelope 上收完成后，RCA helper 只以 package module target 暴露 |
| operator evidence / stability projections | product sidecar export、manifest、OPL/App operator drilldown | refs-only read model | OPL 可持有 App/workbench shell和 observability read model；RCA 只能输出 domain receipt、blocker 和 evidence refs | OPL App/workbench live 后，RCA projection 不包含 layout/workbench 状态 |

2026-05-19 新增 `contracts/production_acceptance/rca-production-acceptance.json` 作为 RCA-owned production acceptance machine surface。它把此前 `production_live_soak_not_claimed_by_conformance` / `domain_ready_not_claimed_by_conformance` 收口为 domain-owned visual production acceptance evidence：结构和物理 conformance 已通过，但 conformance 不授权 visual/export/domain ready；当前 evidence tail 只能是 `closed_by_domain_owned_acceptance_receipt` 或 `domain_owned_typed_blocker_with_next_verification_ref`。本轮状态为 `closed_by_domain_owned_acceptance_receipt`，并以 refs-only 方式记录 visual owner receipt、artifact receipt、review/export gate、memory/lifecycle receipt 与 next verification commands。

2026-05-20 进一步把 remaining evidence gate 的 blocker refs 机器化：`remaining_evidence_gate_blockers` 现在列出 `opl_hosted_controlled_visual_stage_long_soak`、`real_memory_lifecycle_receipt_instances` 和 `cross_family_repeated_no_regression_evidence` 三条 RCA-owned typed blocker ref。OPL 可以把这些 blocker 作为 refs-only receipt/gate accounting 消费；它们不声明 controlled visual-stage long soak、真实 memory/lifecycle receipt instances、cross-family repeated no-regression 或 visual/export readiness 成功。

Fresh OPL App/operator drilldown 读取当前 family state 后，RCA 相关 evidence gate request 已全部通过 OPL refs-only ledger verified；family summary 中 `domain_evidence_gate_count=4`、`domain_open_evidence_gate_request_count=0`、`domain_verified_evidence_gate_request_count=4`。这关闭的是 request/gate accounting，不是 visual production evidence tail：RCA 仍需真实跨 workspace scaleout、Temporal controlled visual-stage long soak、artifact-producing owner receipt、visual memory/lifecycle receipt 和最终 RCA-owned review/export verdict。

因此，production acceptance 不再作为功能/结构差距，也不由 OPL/provider completion 关闭。若未来真实运行证据缺失，该 surface 必须降级为 RCA-owned typed blocker 并给出下一条验证命令 ref；不能把 OPL structural pass、provider completion、transition fixture 或 cleanup proof 写成 visual ready、exportable、handoffable 或 domain_ready。

## Retained Private Authority Surfaces

RCA 长期只允许保留 visual domain 的 minimal authority surfaces；active machine contract 只使用 `authority_surface_id`，不再保留旧 `function_id` 兼容字段：

| Authority surface | Work mode | Judgment owner | 程序角色 |
| --- | --- | --- | --- |
| `source_readiness_verdict` | AI-first judgment | source readiness stage artifact 判断 source 是否足以支撑视觉叙事和交付目标。 | validator / typed blocker |
| `communication_visual_direction_decision` | AI-first judgment | AI-authored communication strategy / visual direction stage artifact 持有传播策略、视觉方向和 route selection。 | materializer / refs projection |
| `review_export_verdict` | AI-first judgment | visual review / export gate artifact 给出 review verdict、exportable、handoffable。 | gate validator / receipt signer |
| `visual_memory_accept_reject` | AI-first judgment | visual memory learning stage 判断经验是否可沉淀。 | receipt writer / refs projection |
| `artifact_mutation_authorization` | Programmatic guard | blocked item、repair target 与 owner receipt。 | materializer / guard |
| `owner_receipt_signer` | Programmatic guard | RCA receipt schema 与 domain provenance。 | receipt signer |
| `native_helper_implementation` | Programmatic guard | native helper catalog、package module 与 owner receipt policy。 | helper implementation / guard |

故事、视觉方向、页面判断、review verdict 和 repair judgment 必须由 AI-authored stage artifact 承担。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前测试/证据差距

结构 conformance 已通过不等于 visual ready；readiness clean / observable 也只表示 launch、replay、runtime evidence、typed blocker 和 receipt refs 可被 OPL/App/operator 观察。真实 visual-ready、exportable、handoffable 仍需要 RCA-owned AI-first review/export verdict 与 domain owner receipt 链路支撑。

## 当前物理源码形态差距

这部分是 naming / package hygiene tail。它不重开已闭合的旧 managed runtime 清理，但也不能被 `functional_structure_gap_count=0` 写成物理源码完全标准化。

- MCP、CLI/product-entry、sidecar、status/session/workbench wrapper 的 repo-local adapter 仍可见；目标是 OPL generated/hosted wrapper 成为默认 shell，RCA 只保留 service-safe domain entry、domain handler target、owner receipt、typed blocker 和 authority refs。
- `product-entry-session-store` 只能是 refs-only session snapshot adapter；目标是 OPL generic session shell 稳定后不再让 RCA 源码像 session runtime owner。
- workspace/run helpers、runtimeWatch、operator evidence、stability projection 和 sidecar guarded actions 只能输出 refs、receipt、typed blocker、no-regression evidence 或 visual authority action metadata；不得扩成 generic attempt ledger、supervisor、review/repair transport 或 workbench。
- `runtime`、`gateway`、`sidecar`、`managed`、`session` 等历史词若继续存在，必须是 semantic-id、provenance、retired guard、domain adapter 或 refs-only read model；新增 active caller 不保留 compatibility alias。

以下是结构闭合后的证据门，不能写成 production visual-stage soak、visual ready、exportable 或 handoffable 已完成：

- artifact-producing owner receipt route 已固定为 image-first PPT route，后续还需真实 workspace 运行持续积累 receipt instances。
- visual memory body reuse 已有 locator/content ref，后续还需真实 visual pattern memory accepted/rejected receipt scaleout。
- workspace receipt proof 已能产出 owner/memory/no-regression refs，后续还需跨 workspace retention ledger / inventory 规模化验证。
- Temporal controlled visual-stage long soak、provider restart/re-query/retry/dead-letter proof 和 repair cadence。
- Expected receipt instance 与 monitor freshness evidence 已有 RCA body-free handoff refs，可供 OPL workorder 回填；后续仍需真实 workspace owner receipt instance、typed blocker、visual memory/lifecycle receipt 或 long-soak refs 持续刷新，OPL stage evidence receipt 只能证明 refs-only route、payload workorder 和 preflight 可用。
- Cross-family repeated no-regression proof。

## 完善顺序

1. `production_evidence_tail`
   用低风险真实 workspace 继续跑 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 generated continuation shell 进入 RCA service-safe domain entry，累计 `domain_receipt`、`typed_blocker`、`no_regression_evidence`、artifact-producing owner receipt 和 memory/lifecycle receipt。

2. `runtime_evidence_scaleout`
   继续补真实 artifact-producing receipt、visual memory body reuse、workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。

3. `naming_contract_hygiene`
   将历史 `managed` 命名从 active reader-facing 口径继续降到 provenance / semantic-id 语境。任何改名都必须先确认 active caller、runtime-program pointer 和 test contract，直接迁移到 OPL stage/session/continuation 词汇，不新增 compatibility alias。

4. `physical_source_morphology_hygiene`
   继续确保 packages / runtime-program / MCP / product-entry / sidecar / native-helper / operator-evidence 源码只表达 visual authority、native helper implementation、domain handler target 或 refs-only adapter。优先治理 product-entry session store、runtimeWatch、workspace/run envelope helpers、sidecar guarded actions 和历史 `managed`/`runtime`/`gateway` 命名。新增 family、helper 或 projection 时，先落 `agent/` pack 与 `contracts/`，再只在 packages 中实现必要 visual authority；不把 artifact-heavy implementation 复制成 generic agent runtime。

## 当前不能写成

- 不能写成 RCA 已完成 production visual-stage long soak。
- 不能写成 OPL provider completion 等于 RCA visual ready、exportable 或 handoffable。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- 不能把 transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 artifact-producing owner receipt。
- 不能把 OPL legacy cleanup dry-run / apply / verify ready 写成 RCA production evidence tail 已完成；它只证明 provenance/history/tombstone proof 足够 OPL cleanup gate 和 refs-only ledger 消费。
- 不能把 OPL control-loop summary、usage/resource pressure、observability export 或 external stability policy 写成 RCA visual quality/export verdict、自动降级、自动修复或 production success。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。

## 验证口径

- 文档维护使用 `git diff --check` 和 stale wording scan。
- 代码/contract 变更必须跑 repo-native focused verification。
- 测试只固定 machine-readable contract、schema、CLI/MCP 行为、manifest、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据；不固定 docs prose wording。
