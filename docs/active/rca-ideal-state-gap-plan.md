# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-19`

## 文档读法

- 本文只维护 RCA 当前差距、owner 边界、功能/结构 gap、测试/证据 gap 和完善顺序。
- RCA 的 north-star 目标态回到 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)。
- 过程性 dated follow-through、closeout tranche、proof 命令摘要和旧路线归入 `docs/history/`，不在本文承担 current truth。
- 差距按目标态判断，不按当前 RCA 代码是否仍可运行判断。旧 repo-local deliverable runner、run store 和 DAG runtime 已物理删除；product-entry session store、workspace/source intake、memory/writeback transport、artifact export lifecycle、review/repair transport、native helper generic envelope、operator projection、generic CLI/MCP wrapper、executor adapter 和 status/product shell，只要承担通用 framework/runtime 职责，就必须进入 OPL 上收、generated surface 替换、refs-only 收薄或退役分类。
- Descriptor ready、transition fixture、no-regression evidence、provider completion 或 focused proof 都不能写成 visual ready、exportable、handoffable、artifact-producing owner receipt 或 production visual-stage soak；`production consumption complete` 仅限 OPL generated/hosted surface consumption，不等于生产 soak 完成。

## 当前定位

RCA 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework / App 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 不把这些通用能力继续写成长期私有平台。

RCA 的目标形态是：

```text
Declarative Visual Pack
  + OPL generated/hosted surfaces
  + minimal visual authority functions
```

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

2026-05-19 的 OPL legacy cleanup dry-run 读取当前 RCA manifest 后返回 `plan_status=ready` 与 `lifecycle_apply.status=dry_run_ready`。RCA `physical_skeleton_follow_through` 已向 OPL 暴露 provenance refs、history refs 和 tombstone refs，清除了此前 OPL gate 对 `missing_provenance_retention_evidence` 与 `missing_history_or_tombstone_evidence` 的 blocker。该状态只证明 OPL cleanup gate 能安全消费 RCA legacy cleanup proof，不表示 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable 已完成。

## 当前 cleanliness tail

RCA 已符合标准 OPL Agent 的结构口径，但仍有两类完善尾巴需要继续推进：

- `production_evidence_tail`：真实 artifact-producing owner receipt、真实 visual memory body reuse、真实 workspace receipt scaleout、Temporal controlled visual-stage long soak 和 cross-family repeated no-regression evidence。
- `naming_contract_hygiene_tail`：历史 runtime-program contract、human_doc 语义 ID、field name 或 task intent 中仍可能保留 `managed` 作为 session-continuity / provenance 命名。它们不代表 active 旧 runtime owner；后续清理必须通过 contract migration / tombstone policy / compatibility-free rename 做，不把旧 runtime surface 复活为 alias。

2026-05-18 cleanup pass 已把 active manifest/status 读者面中的 managed-web / managed-continuation wording 收敛为 OPL stage runtime、end-user shell 与 production evidence tail 口径。`run_opl_stage_execution_plan` 是当前默认 task intent；`run_managed_deliverable` 不保留 public compatibility alias，后续若要迁移历史数据必须走显式 deprecation / tombstone contract，不重新引入默认公开 alias。

当前仍保留的非领域平台形状只允许按以下接口存在：

| Surface | Active caller | RCA 角色 | 不能上收理由 | 退役门 |
| --- | --- | --- | --- | --- |
| product-entry `session_continuity` store | `getProductEntrySession`、manifest/session projection、OPL generated session shell | entry-session domain snapshot refs adapter | OPL 可持有 generic session shell，但不能伪造 RCA topic / deliverable / review / artifact refs | OPL generated session shell 成为默认 caller，RCA 仅返回 refs-only snapshot |
| product sidecar export/dispatch | OPL family runtime provider、manifest、family action catalog | domain sidecar target / guarded action adapter | OPL 可生成 sidecar wrapper，但 RCA 必须签发 owner receipt、typed blocker、memory/lifecycle receipt 和 visual transition decision refs | OPL wrapper 默认化后，RCA 只保留 guarded domain action handlers |
| product status / manifest action metadata | OPL descriptors、CLI/MCP/skill projections、direct product entry | declarative pack input / domain handler target | OPL 可生成 wrapper；RCA 继续持有 action semantics、route truth 和 visual authority refs | generated wrapper parity 成为唯一公开 shell，RCA 不再扩展 generic wrapper 代码 |
| Python native helper catalog | native PPT/review/export proof lanes、helper catalog tests | domain-native helper implementation | OPL 可持有 generic helper envelope；RCA 仍需实现 Office/PPT/screenshot/export domain helper | helper envelope 上收完成后，RCA helper 只以 package module target 暴露 |
| operator evidence / stability projections | product sidecar export、manifest、OPL/App operator drilldown | refs-only read model | OPL 可持有 App/workbench shell和 observability read model；RCA 只能输出 domain receipt、blocker 和 evidence refs | OPL App/workbench live 后，RCA projection 不包含 layout/workbench 状态 |

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

以下是结构闭合后的证据门，不能写成 production visual-stage soak、visual ready、exportable 或 handoffable 已完成：

- 真实 artifact-producing owner receipt。
- visual memory body reuse 和真实 visual pattern memory accepted/rejected receipts。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证。
- Temporal controlled visual-stage long soak、provider restart/re-query/retry/dead-letter proof 和 repair cadence。
- Cross-family repeated no-regression proof。

## 完善顺序

1. `production_evidence_tail`
   用低风险真实 workspace 继续跑 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 generated continuation shell 进入 RCA service-safe domain entry，累计 `domain_receipt`、`typed_blocker`、`no_regression_evidence`、artifact-producing owner receipt 和 memory/lifecycle receipt。

2. `runtime_evidence_scaleout`
   继续补真实 artifact-producing receipt、visual memory body reuse、workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。

3. `naming_contract_hygiene`
   将历史 `managed` 命名从 active reader-facing 口径继续降到 provenance / semantic-id 语境。任何改名都必须先确认 active caller、runtime-program pointer 和 test contract，直接迁移到 OPL stage/session/continuation 词汇，不新增 compatibility alias。

## 当前不能写成

- 不能写成 RCA 已完成 production visual-stage long soak。
- 不能写成 OPL provider completion 等于 RCA visual ready、exportable 或 handoffable。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- 不能把 transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 artifact-producing owner receipt。
- 不能把 OPL legacy cleanup dry-run ready 写成 RCA production evidence tail 已完成；它只证明 provenance/history/tombstone proof 足够 OPL cleanup gate 消费。
- 不能把 OPL control-loop summary、usage/resource pressure、observability export 或 external stability policy 写成 RCA visual quality/export verdict、自动降级、自动修复或 production success。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。

## 验证口径

- 文档维护使用 `git diff --check` 和 stale wording scan。
- 代码/contract 变更必须跑 repo-native focused verification。
- 测试只固定 machine-readable contract、schema、CLI/MCP 行为、manifest、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据；不固定 docs prose wording。
