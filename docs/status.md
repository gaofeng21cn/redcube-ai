# RedCube AI 当前状态

更新时间：`2026-05-18`

## 当前角色

`RedCube AI` 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 当前口径已收敛为 OPL generated/hosted wrapper/session/workbench/generic shell consumer；RCA 只保留 domain handler target、direct entry、refs-only adapter、minimal visual authority function 和 native helper implementation。旧 repo-local managed runtime 物理实现已删除，active source/package/test surface 不再保留内部 managed runtime fixture。

RCA 的标准 OPL Agent semantic pack 已归位到 `agent/`。`agent/prompts/*.md` 是 stage-level canonical prompt policy；`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 Declarative Visual Pack 的 repo-source 语义。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 继续作为 detailed implementation prompt assets，由 `agent/prompts/*.md` 定位；`contracts/stage_control_plane.json` 的 `prompt_refs` 只指向 `agent/prompts/*.md`。

`Codex CLI` 是当前第一公民 executor。`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现，不承诺行为或输出质量与 Codex CLI 等价。

## 当前运行与文档事实

- Direct route 已落地：`RedCube Product Entry -> service-safe domain entry -> executor adapter -> visual-domain truth surfaces`。
- OPL-hosted route 已有合同和 projection：stage control projection、family action catalog、product sidecar export/dispatch、OPL generic primitive consumption、stability read-model consumption、operator evidence readiness projection、workspace receipt inventory projection 和 private functional audit surface。
- RCA 已有 `ppt_deck` 与 `xiaohongshu` image-first 默认路线；HTML/native PPTX 是显式可选路线。`poster_onepager` 仍保持 guarded knowledge poster 边界。
- `contracts/`、runtime-program contracts、product-entry manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 与真实交付物证据是机器真相；`docs/**` 只做解释、导航、治理和 provenance。
- 过程性 dated follow-through、closeout tranche 和 proof 命令摘要进入 `docs/history/`；当前目标态与 gap 只读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md) 和 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。

## 当前功能/结构闭合状态

当前功能/结构差距按 active plan 维护：

`functional_structure_gap_count=0`

已闭合为标准 OPL consumer 口径的 8 项：`opl_generated_surface_production_consumption`、`repo_local_wrapper_active_caller_migration`、`focused_hosted_attempt_real_path_cutover`、`artifact_gallery_handoff_shell`、`review_repair_transport`、`opl_app_operator_drilldown`、`workspace_source_lifecycle_receipt_shell`、`legacy_physical_cleanup`。这些闭合表示 RCA 不再声明对应 generic shell/runtime owner，且旧 managed runtime 物理实现已删除；production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable 仍属于证据门。

2026-05-18 active surface scan 进一步确认：`supervise_managed_run`、`get_managed_run` 和 `product_entry_continuation` 只作为 retired-surface guard、deletion proof、negative test 或 provenance identifier 出现；active product-entry manifest、status 与 runtime inventory 不再用这些名字声明 RCA repo-local managed runtime owner。Manifest、stage-control plane、OPL stage plan 和 runtime inventory 的 active machine fields 采用 `opl_provider_runtime_contract`、`repo_local_stage_runner_*`、`session_continuity_*` 口径。历史 `managed-product-entry-hardening` 文件名和 baton id 仅保留 session-continuity provenance，不作为当前 owner 语义。

2026-05-18 fresh OPL stage admission read-model 曾阻断 RCA stage pack：AI / effect-boundary stage 缺 machine-readable `runtime_event_refs`。随后 OPL admission 口径收紧为所有 `runtime_guard_required=true` stage 都必须声明 refs。当前 RCA-owned `family_stage_control_plane` 生成源与 `contracts/stage_control_plane.json` 已为 6 个 stage 同步补齐 `stage_contract.runtime_event_refs` 与 `trust_boundary.runtime_event_refs`，包括 `runtime_event:rca.source_intake.source_truth_frozen`、`runtime_event:rca.communication_strategy.accepted`、`runtime_event:rca.visual_direction.accepted`、`runtime_event:rca.artifact_creation.candidate_rendered`、`runtime_event:rca.review_and_revision.gate_recorded`、`runtime_event:rca.package_and_handoff.export_handoff_recorded`。这属于功能/结构 gap 修复；它不声明 production visual-stage long soak 或 artifact-producing owner receipt 完成。

当前标准 OPL Agent 结构口径：

- RCA package surface = `agent/` canonical declarative visual pack、family action catalog、stage control projection、service-safe domain entry、domain handler targets、refs-only projections、visual authority functions、Python native helper implementation。
- OPL-owned/generated surface = CLI/MCP/Skill/product-entry/status/session/sidecar/workbench wrapper、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell。
- active RCA source 中不再维护旧 repo-local deliverable runner、run store、DAG scheduler 或 public managed lookup/supervision action。

## 当前测试/证据差距

以下是结构闭合后的 production evidence tail，不再计入功能/结构差距：

- 真实 artifact-producing owner receipt。
- visual memory body reuse 和真实 visual pattern memory accepted/rejected receipts。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证。
- Temporal controlled visual-stage long soak 和 provider restart/re-query/retry/dead-letter proof。
- Cross-family repeated no-regression proof。

此外仍有一类命名/合同卫生债：历史合同文件名、field name 或 task intent 中的 `managed` 可能仍作为已落地 session-continuity / product-entry provenance 语义存在，例如 `managed-product-entry-hardening`。这些不是旧 runtime active implementation；后续若要更干净，应通过语义 ID 迁移或 tombstone policy 逐步改名，避免破坏 runtime-program provenance。

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
