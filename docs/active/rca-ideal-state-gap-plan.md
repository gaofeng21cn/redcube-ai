# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-18`

## 文档读法

- 本文只维护 RCA 当前差距、owner 边界、功能/结构 gap、测试/证据 gap 和完善顺序。
- RCA 的 north-star 目标态回到 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)。
- 过程性 dated follow-through、closeout tranche、proof 命令摘要和旧路线归入 `docs/history/`，不在本文承担 current truth。
- 差距按目标态判断，不按当前 RCA 代码是否仍可运行判断。managed DAG、attempt/state-machine runner、managed-run/session store、workspace/source intake、memory/writeback transport、artifact export lifecycle、review/repair transport、native helper generic envelope、operator projection、generic CLI/MCP wrapper、executor adapter 和 status/product shell，只要承担通用 framework/runtime 职责，就必须进入 OPL 上收、generated surface 替换、refs-only 收薄或退役分类。
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

`classification_closed` 已推进到 standard OPL consumer 口径：RCA 不再声明 generated/hosted wrapper、session、workbench、artifact/review/source shell 或 generic runtime owner；这些面由 OPL generated/hosted surface 持有，RCA 只保留 domain handler target、refs-only adapter、minimal authority function、native helper implementation 和 legacy cleanup 前的内部历史回归面。

当前必须保留：

`functional_structure_gap_count=2`

已闭合为标准 OPL consumer 口径的 7 项：

- `opl_generated_surface_production_consumption`
- `repo_local_wrapper_active_caller_migration`
- `focused_hosted_attempt_real_path_cutover`
- `artifact_gallery_handoff_shell`
- `review_repair_transport`
- `opl_app_operator_drilldown`
- `workspace_source_lifecycle_receipt_shell`

这些闭合只表示 generic shell/runtime owner 归 OPL，RCA 以 refs-only/domain-handler/authority-function 方式消费；不能写成 production visual-stage long soak、artifact-producing owner receipt、visual ready、exportable 或 handoffable。

1. `production_live_soak_and_evidence`
   OPL generated/hosted wrapper、session、workbench、artifact/review/source shell 已按合同消费，但还没有完成 Temporal controlled visual-stage long soak、真实 artifact-producing owner receipt、真实 memory lifecycle receipt、workspace receipt scaleout 和 cross-family repeated no-regression evidence。

2. `legacy_physical_cleanup`
   旧 Hermes / Gateway / local-manager / bridge residue 仍需要 no-active-caller proof、domain authority refs preserved 和 no-regression proof 后删除或 tombstone。不保留 compatibility alias。

## Retained Private Authority Functions

RCA 长期只允许保留 visual domain 的 minimal authority functions：

| 函数 | 长期 owner | AI-first 边界 | 程序角色 |
| --- | --- | --- | --- |
| `source_readiness_verdict` | RCA source readiness owner | 判断 source 是否足以支撑视觉叙事和交付目标。 | validator / typed blocker |
| `communication_visual_direction_decision` | RCA visual director stage | 传播策略、视觉方向、route selection 必须由 AI-authored stage artifact 持有。 | materializer / refs projection |
| `review_export_verdict` | RCA review/export gate | review verdict、exportable、handoffable 只能由 visual review / export gate 给出。 | gate validator / receipt signer |
| `artifact_mutation_authorization` | RCA artifact authority | artifact rewrite 必须有 blocked item、repair target 和 owner receipt。 | materializer / guard |
| `visual_memory_accept_reject` | RCA visual memory owner | 视觉经验是否可沉淀由 visual route / review learning 判断。 | receipt writer / refs projection |
| `owner_receipt_signer` | RCA owner surface | 只签 domain receipt、typed blocker、safe action refs 和 provenance currentness。 | receipt signer |
| `native_helper_implementation` | RCA native helper owner | 只能实现 PPT/image/export mutation 或 proof，不给 visual ready verdict。 | helper implementation / guard |

故事、视觉方向、页面判断、review verdict 和 repair judgment 必须由 AI-authored stage artifact 承担。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前测试/证据差距

以下是目标结构正确后的证据门，不能替代上面的功能/结构 gap：

- 真实 artifact-producing owner receipt。
- visual memory body reuse 和真实 visual pattern memory accepted/rejected receipts。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证。
- Temporal controlled visual-stage long soak、provider restart/re-query/retry/dead-letter proof 和 repair cadence。
- Cross-family repeated no-regression proof。

## 完善顺序

1. `production_live_soak_and_evidence`
   用低风险真实 workspace 继续跑 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 generated continuation shell 进入 RCA service-safe domain entry，累计 `domain_receipt`、`typed_blocker`、`no_regression_evidence`、artifact-producing owner receipt 和 memory/lifecycle receipt。

2. `legacy_physical_cleanup`
   在 replacement proof、no-active-caller proof 和 domain authority refs preserved 成立后，删除或 tombstone 旧 Hermes / Gateway / local-manager / bridge residue。

3. `runtime_evidence_scaleout`
   在结构差距关闭后，补真实 artifact-producing receipt、visual memory body reuse、workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。

## 当前不能写成

- 不能写成 RCA 已完成 production visual-stage long soak。
- 不能写成 OPL provider completion 等于 RCA visual ready、exportable 或 handoffable。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- 不能把 transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 artifact-producing owner receipt。
- 不能把 OPL control-loop summary、usage/resource pressure、observability export 或 external stability policy 写成 RCA visual quality/export verdict、自动降级、自动修复或 production success。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。

## 验证口径

- 文档维护使用 `git diff --check` 和 stale wording scan。
- 代码/contract 变更必须跑 repo-native focused verification。
- 测试只固定 machine-readable contract、schema、CLI/MCP 行为、manifest、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据；不固定 docs prose wording。
