# RedCube AI 当前状态

Owner: `RedCube AI`
Purpose: `current_status_and_gap_readout`
State: `current_truth`
Machine boundary: 人读状态面。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

更新时间：`2026-05-20`

## 当前角色

`RedCube AI` 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 当前口径已收敛为 OPL generated/hosted wrapper/session/workbench/generic shell consumer；RCA 只保留 domain handler target、direct entry、refs-only adapter、minimal visual authority function 和 native helper implementation。旧 repo-local managed runtime 物理实现已删除，active source/package/test surface 不再保留内部 managed runtime fixture。

RCA 的标准 OPL Agent semantic pack 已归位到 `agent/`。`agent/prompts/*.md` 是 stage-level canonical prompt policy；`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 Declarative Visual Pack 的 repo-source 语义。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 继续作为 detailed implementation prompt assets，由 `agent/prompts/*.md` 定位；`contracts/stage_control_plane.json` 的 `prompt_refs` 只指向 `agent/prompts/*.md`。

`Codex CLI` 是当前第一公民 executor。`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现，不承诺行为或输出质量与 Codex CLI 等价。

当前 acceptance / readiness 口径是 AI-first / executor-first：OPL 搭建 stage-led runtime、queue、receipt ledger、replay / recovery shell 与 operator projection；Codex/default executor 执行视觉阶段；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。合同只固定边界、安全、receipt、replay 和恢复语义，不能把机械 conformance 或 provider completion 升级成视觉判断。

## 当前运行与文档事实

- Direct route 已落地：`RedCube Product Entry -> service-safe domain entry -> executor adapter -> visual-domain truth surfaces`。
- OPL-hosted route 已有合同和 projection：stage control projection、family action catalog、product sidecar export/dispatch、OPL generic primitive consumption、stability read-model consumption、operator evidence readiness projection、workspace receipt inventory projection 和 private functional audit surface。
- RCA 已有 `ppt_deck` 与 `xiaohongshu` image-first 默认路线；HTML/native PPTX 是显式可选路线。`poster_onepager` 仍保持 guarded knowledge poster 边界。
- `contracts/`、runtime-program contracts、product-entry manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 与真实交付物证据是机器真相；`docs/**` 只做解释、导航、治理和 provenance。
- Workspace/file lifecycle 当前按 repo-source 与 live/runtime 写集分层：`agent/`、`contracts/`、`runtime/authority_functions/`、`packages/`、`docs/` 只承载 semantic pack、机器合同、authority-function descriptor/receipt refs、domain handler/native helper 和人读治理；真实 workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物进入 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`，不写回开发 checkout。
- RCA repo source 当前只持有 locator、index、schema、receipt ref、restore/retention policy 和 refs-only lifecycle proof；visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 与 owner receipt 继续由 RCA owner chain 授权。OPL 上收通用 lifecycle primitive、scheduler/runner/session store/workbench shell，RCA 私有 runtime adapter 不能反向定义长期结构。
- 过程性 dated follow-through、closeout tranche 和 proof 命令摘要进入 `docs/history/`；当前目标态与 gap 只读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md) 和 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。

## 当前功能/结构闭合状态

当前功能/结构差距按 active plan 维护：

`functional_structure_gap_count=0`

已闭合为标准 OPL consumer 口径的 8 项：`opl_generated_surface_production_consumption`、`repo_local_wrapper_active_caller_migration`、`focused_hosted_attempt_real_path_cutover`、`artifact_gallery_handoff_shell`、`review_repair_transport`、`opl_app_operator_drilldown`、`workspace_source_lifecycle_receipt_shell`、`legacy_physical_cleanup`。这些闭合表示 RCA 不再声明对应 generic shell/runtime owner，且旧 managed runtime 物理实现已删除；production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable 仍属于证据门。

2026-05-18 active surface scan 进一步确认：旧 managed supervision action、旧 managed run lookup action 和 `product_entry_continuation` 只作为 retired-surface guard、deletion proof、negative test 或 provenance identifier 出现；active product-entry manifest、status 与 runtime inventory 不再用这些名字声明 RCA repo-local managed runtime owner。Manifest、stage-control plane、OPL stage plan 和 runtime inventory 的 active machine fields 采用 `opl_provider_runtime_contract`、`repo_local_stage_runner_*`、`session_continuity_*` 口径。历史 `managed-product-entry-hardening` 文件名和 baton id 仅保留 session-continuity provenance，不作为当前 owner 语义。

2026-05-18 fresh OPL stage admission read-model 曾阻断 RCA stage pack：AI / effect-boundary stage 缺 machine-readable `runtime_event_refs`。随后 OPL admission 口径收紧为所有 `runtime_guard_required=true` stage 都必须声明 refs。当前 RCA-owned `family_stage_control_plane` 生成源与 `contracts/stage_control_plane.json` 已为 6 个 stage 同步补齐 `stage_contract.runtime_event_refs` 与 `trust_boundary.runtime_event_refs`，包括 `runtime_event:rca.source_intake.source_truth_frozen`、`runtime_event:rca.communication_strategy.accepted`、`runtime_event:rca.visual_direction.accepted`、`runtime_event:rca.artifact_creation.candidate_rendered`、`runtime_event:rca.review_and_revision.gate_recorded`、`runtime_event:rca.package_and_handoff.export_handoff_recorded`。这属于功能/结构 gap 修复；它不声明 production visual-stage long soak 或 artifact-producing owner receipt 完成。

2026-05-19 stage cohort-loop refs 已补齐：六个 RCA stage 的 `stage_contract` 均声明 source scope、auditable visual source query、OPL queue trigger、visual progress / session continuity monitor 和 operator freshness metric refs。OPL `stages cohort-loop --domain rca` 读取当前 RCA main 后返回 6/6 `closed_loop_ready`、`blocker_count=0`。该状态只证明 RCA declarative launch/readiness loop 可被 OPL 消费，不表示 production visual-stage long soak、artifact-producing owner receipt、visual ready、exportable 或 handoffable 已完成。

2026-05-20 OPL stage production evidence route 已把 RCA stage 的 unobserved expected receipt / monitor freshness 缺口纳入 OPL-owned refs-only `stage_production_evidence_receipt_record|verify` safe action。RCA 不复制该通用 evidence ledger 或 App route；RCA 只负责回填真实 artifact-producing owner receipt、typed blocker、no-regression、visual memory/lifecycle receipt、direct/hosted parity 或 Temporal controlled visual-stage long-soak refs。OPL receipt verified 仍不等于 visual ready、exportable、handoffable、artifact mutation authorization 或 production visual-stage soak 成功。

2026-05-19 OPL legacy cleanup dry-run 读取当前 RCA manifest 后返回 `plan_status=ready` / `lifecycle_apply.status=dry_run_ready`，OPL refs-only lifecycle ledger 也已能 `verify` 读回 RCA 空计划 closure batch receipt。RCA `physical_skeleton_follow_through` 已补齐 provenance refs、history refs 和 tombstone refs，清除了 OPL cleanup gate 对 provenance / tombstone evidence 的 blocker。该状态只证明 RCA legacy cleanup proof 可被 OPL refs-only ledger 消费，不表示 production visual-stage long soak、artifact-producing owner receipt、visual ready、exportable 或 handoffable 已完成。

2026-05-20 production acceptance/readiness closeout 的当前文档口径是：结构 conformance 通过不是 visual ready；readiness clean / observable 只表示 launch、replay、runtime evidence、owner receipt refs 和 typed blocker 可被观察与追溯。最终合并后的 expected result 是 RCA stage evidence 中出现 runtime budget refs 与 replay evidence refs、RCA production acceptance 中保留 owner receipt / artifact / review-export acceptance refs、OPL readiness surface 能消费这些 refs 并报告 clean/observable；这些结果仍不声明 production visual-stage long soak、跨 family repeated no-regression 或更多 workspace scaleout 已完成。

2026-05-20 evidence scaleout refs 已补到 RCA production acceptance、operator evidence readiness projection、workspace receipt inventory projection 和 product sidecar projection。当前新增 refs 覆盖 artifact-producing owner receipt、workspace receipt scaleout ref model、visual memory body reuse ref、repeated no-regression evidence refs 和 naming tombstone follow-through；这些都是 RCA-owned refs-only evidence，不把 visual truth、review/export verdict、artifact blob、memory body 或 production soak success 交给 OPL。同日 `contracts/production_acceptance/rca-production-acceptance.json` 与 `contracts/production_acceptance/rca-evidence-receipt-fixture.json` 已显式补齐 `remaining_evidence_gate_blockers`：`opl_hosted_controlled_visual_stage_long_soak`、`real_memory_lifecycle_receipt_instances` 和 `cross_family_repeated_no_regression_evidence` 均返回 RCA-owned typed blocker ref，供 OPL refs-only ledger 消费；这些 blocker 只关闭 evidence gate request accounting，不声明 visual-stage long soak、真实 receipt instance 或 repeated no-regression production soak 成功。

2026-05-20 Lane 4B 进一步把 evidence scaleout 从泛化 refs 收敛到真实 artifact-producing visual route：`ppt_deck.image_first.artifact_producing.v1`，stage 顺序固定为 `author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`。production acceptance fixture、manifest operator projection 与 workspace receipt proof 都暴露同一 route ref；workspace proof 明确会产出 owner receipt ref、memory receipt refs 和 no-regression evidence ref；visual memory reuse 只暴露 locator/content refs，memory body 继续留在 RCA；repeated no-regression 记录为 `ppt_deck` / `xiaohongshu` family refs-only cadence；naming tombstone follow-through 继续禁止 compatibility alias。该轮关闭的是 evidence scaleout 可追踪性，不声明 production visual-stage long soak、跨 workspace scaleout 完成、visual ready、exportable 或 handoffable。

2026-05-20 一步到位落地计划的 closeout 机器面已落到 `contracts/runtime-program/rca-one-shot-production-hardening-closeout.json`，并由 `contracts/runtime-program/current-program.json#/current_state/active_baton/closeout` 指向。该 surface 明确记录四条 lane 的 `planned`、`done`、`deferred`、`skipped`、`verification` 与 `commit_push_state`：B/C/A 已吸收入主线，D 负责文档与 contract closeout；`Codex CLI` 仍是 production 默认 executor，`fallback_with_proof` 只属于 explicit experimental proof lane；剩余 production visual-stage long soak、real memory lifecycle receipt scaleout 和 cross-family repeated no-regression 仍是 RCA-owned typed blocker/backlog。`docs/**` 继续只做人读治理，测试断言只指向 machine-readable contracts、schema、manifest、receipt refs 和行为面。

2026-05-20 Lane B-RCA 把 `opl_expected_receipt_monitor_freshness_handoff` 补到 production acceptance、evidence fixture、operator evidence readiness projection、runtime-program snapshot 和 product sidecar projection。该 handoff 只给 OPL `stage_production_evidence_receipt_record|verify` workorder 回填 body-free owner receipt refs、workspace receipt proof refs、visual memory reuse refs、repeated no-regression refs、monitor freshness refs 和 RCA typed blocker refs；OPL 可记录 expected receipt / monitor freshness refs，但不能接收 visual truth、review/export verdict body、artifact blob、memory body，也不能据此声明 visual ready、exportable、handoffable 或 production visual-stage soak complete。

2026-05-21 OPL 已实际消费 RCA `opl_expected_receipt_monitor_freshness_handoff`：6 个 RCA stage 均通过 OPL `stage-production-evidence:redcube:<stage>:record|verify` 把 RCA-owned typed blocker refs 写入并验证到 OPL refs-only stage evidence ledger。OPL App/operator drilldown、framework readiness 与 production closeout 现在把这些 RCA stage evidence tail 读成 `domain_owned_typed_blocker`，RCA 对应 workorder accounting 不再显示为 open。该状态只说明 RCA 已把 expected receipt / monitor freshness 缺口以 typed blocker 交给 OPL 读模型消费；RCA 仍未声明 Temporal controlled visual-stage long soak、真实 memory/lifecycle receipt instances、cross-family repeated no-regression、visual ready、exportable 或 handoffable 完成。

2026-05-21 RCA 新增 `temporal_autonomy_readiness` 机器面，并接入 product-entry manifest、product sidecar projection 和 production acceptance fixture。当前结论是：RCA 已具备标准 OPL/Temporal 托管所需的 descriptor、queue/wakeup handoff、progress re-query、runtimeWatch、owner receipt、workspace receipt proof 和 no-regression refs；provider 在线管理、restart/resume/re-query、retry/dead-letter 仍归 OPL/Temporal。该 surface 状态为 `standard_opl_temporal_contract_ready_live_rca_soak_pending`，明确 `can_be_opl_temporal_hosted=true`，但 `long_time_autonomy_claimed=false`、`production_visual_stage_long_soak_complete=false`。剩余 blocker 仍是 `rca-typed-blocker:controlled-soak:temporal-long-soak-pending`，需要真实 OPL-hosted visual-stage long soak 关闭。

当前标准 OPL Agent 结构口径：

- RCA package surface = `agent/` canonical declarative visual pack、family action catalog、stage control projection、service-safe domain entry、domain handler targets、refs-only projections、visual authority functions、Python native helper implementation。
- OPL-owned/generated surface = CLI/MCP/Skill/product-entry/status/session/sidecar/workbench wrapper、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell。
- active RCA source 中不再维护旧 repo-local deliverable runner、run store、DAG scheduler 或 public managed lookup/supervision action。

Physical source morphology 现在按同一标准治理：`agent/` 是 Declarative Visual Pack，`contracts/` 与 runtime-program leaf parts 是机器合同，`packages/` / native helper / product-entry / sidecar / operator evidence 源码只能承担 visual domain handler、minimal authority function、native helper implementation、refs-only adapter、fixture 或 diagnostic。RCA 当前 artifact-heavy 目录不是可复制的新 Agent 通用 scaffold；历史 `managed` 命名只能作为 provenance、semantic-id、retired guard 或 tombstone，不恢复为 active runtime owner 或 compatibility alias。

当前物理源码仍有命名与包边界 tail：MCP server、product-entry session store、workspace/run envelope helpers、runtimeWatch、sidecar guarded actions、operator evidence/stability projections 和 generated-surface handoff mapping 仍是 active source。它们不能被写成 RCA-owned generic runtime，也不能被写成已经完全像新 Agent 模板；它们的当前角色是 protocol/domain handler target、refs-only adapter、native helper envelope、operator read model 或 provenance。后续 cleanup 需要 OPL generated wrapper / session shell / App workbench evidence、direct/hosted parity、owner receipt roundtrip、no-regression proof 和 no-compatibility-alias migration。

## 当前测试/证据差距

以下是结构闭合后的 production evidence tail，不再计入功能/结构差距：

- 真实 artifact-producing owner receipt。
- visual memory body reuse 和真实 visual pattern memory accepted/rejected receipts。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证。
- Temporal controlled visual-stage long soak 和 provider restart/re-query/retry/dead-letter proof。
- Cross-family repeated no-regression proof。

RCA 的 domain-owned production acceptance 机器面是：
`contracts/production_acceptance/rca-production-acceptance.json`。该 surface 明确记录 structural / physical conformance 已通过，且 production acceptance 只由 RCA-owned visual artifact-producing receipt chain 或 RCA-owned typed blocker 关闭；visual ready、exportable、handoffable 和 domain_ready 继续归 RCA visual / review / export authority。当前 evidence tail 以 refs-only 形式指向 RCA owner receipt、artifact locator / artifact receipt、review/export gate、memory/lifecycle receipt 和 next verification command refs。OPL conformance、readiness clean/observable、OPL hosted/provider completion、replay evidence 与 cleanup proof 都不能升级为 RCA visual/export/domain ready。

当前 scaleout refs 已经把 production evidence tail 变成可追踪读模型：workspace receipt inventory 可以暴露 receipt-kind coverage 和 scaleout ref model，operator evidence readiness 可以聚合 production evidence scaleout refs，sidecar export 可以给 OPL/App 读取这些 refs；三条 remaining gate 也已有 typed blocker ref 可被 OPL 验证。Lane 4B 后，读模型还会明确展示被选中的 artifact-producing route、owner/workspace receipt 输出形状、visual memory reuse ref scope、repeated no-regression cadence 与 naming tombstone follow-through。真实跨 workspace scaleout、Temporal controlled visual-stage long soak 和最终 visual-ready/exportable/handoffable verdict 仍需后续真实运行证据关闭。

此外仍有一类命名/合同卫生债：历史合同文件名、field name 或 task intent 中的 `managed` 可能仍作为已落地 session-continuity / product-entry provenance 语义存在，例如 `managed-product-entry-hardening`。这些不是旧 runtime active implementation；后续若要更干净，应通过语义 ID 迁移或 tombstone policy 逐步改名，避免破坏 runtime-program provenance。

## 当前物理源码形态差距

- MCP / CLI / product-entry / sidecar / status / session wrapper 仍有 repo-local adapter；目标是 OPL generated/hosted shell default 化，RCA 只保留 service-safe domain entry、domain handler target、receipt、typed blocker 与 visual authority refs。
- `product-entry-session-store` 只允许是 refs-only snapshot adapter；目标是 OPL generic session shell 稳定后消除 RCA 持有 session runtime 的误读。
- workspace/run helpers、runtimeWatch、operator evidence、stability projection 和 sidecar guarded actions 只允许输出 refs、receipt、typed blocker、no-regression evidence 或 visual action metadata；不得扩展成 generic attempt ledger、supervisor、review/repair transport 或 workbench。
- `runtime`、`gateway`、`sidecar`、`managed`、`session` 等历史词继续出现时，必须有 provenance、retired guard、domain adapter 或 refs-only read-model 解释；新增 active caller 不增加 compatibility alias。

## 当前保留的 visual authority surfaces

RCA 长期只保留无法声明化的 visual authority surfaces；active machine contract 只使用 `authority_surface_id`。source readiness verdict、communication / visual direction decision、review/export verdict 与 visual memory accept/reject 是 AI-first judgment surface；artifact mutation authorization、owner receipt signer 与 native helper implementation 是 programmatic authority/helper surface，只能依 owner receipt、blocked item、repair target、helper catalog、typed blocker 和 refs 工作。

这些 surfaces 必须遵守 AI-first stage output 边界：故事、视觉方向、页面判断、review verdict 和 repair judgment 由 AI-authored stage artifact 持有；代码只做 validator、materializer、receipt signer、guard 和 refs-only projection。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前入口与路线

- Public identity：`RedCube AI` Foundry Agent / OPL-compatible visual-deliverable package。
- Direct route：`redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`getProductEntrySession`、`invokeDomainEntry`。
- OPL-hosted route：OPL discovery 读取 RCA descriptor、family action catalog、stage control projection、memory descriptor 和 sidecar refs，再进入 RCA service-safe domain entry。
- CLI/MCP/session/source/workbench/supervision：默认由 OPL generated/hosted caller 持有通用 wrapper、session shell、source shell、supervision 和 workbench；RCA 侧只暴露 domain handler target、refs-only adapter 或 minimal authority function，旧 repo-local supervision/runtime 只保留在 history/provenance 语境。
- Default visual routes：`ppt_deck` 和 `xiaohongshu` 默认 image-first；native editable PPTX 与 HTML lane 必须显式选择。
- Runtime file boundary：真实 PPT/图片/PDF、receipt 实例、中间产物和导出包属于 workspace / runtime artifact root，不属于开发仓源码目录。

## 当前不能声明

- 不能声明 RCA 已完成 production visual-stage long soak。
- 不能把 OPL provider completion、transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 RCA visual ready、exportable、handoffable 或 artifact-producing owner receipt。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- 不能把 OPL legacy cleanup dry-run / apply / verify ready 写成 production evidence tail 已完成；它只证明 cleanup proof refs 可被 OPL gate / refs-only ledger 消费。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。

## 当前验证口径

- 测试分组唯一机器可读入口是 `scripts/test-registry.ts`；`scripts/run-test-group.ts` 从注册表推导 smoke、fast、meta、integration、full 等执行组，并 fail-closed 拒绝未登记的根级测试文件。
- `scripts/verify.sh` 与 `scripts/run-test-group.ts` 先执行 `scripts/repo-hygiene.sh`；tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json`。
- 旧 gateway/frontdoor/Hermes-default 等污染 guard 只覆盖源码、contracts、plugins、scripts、tests、tools 与 Python helper 等机器 / 源码面；`README*` 与 `docs/**` 是人读 prose，不作为测试断言对象。

## 下一跳

- 目标态：[RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md)
- 差距与顺序：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)
- 文档治理：[RCA 文档组合治理](./docs_portfolio_consolidation.md)
- 历史归档：[历史索引](./history/README.md)
