# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器可读真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-17`

## 文档读法

- `定位`：本文是 RCA 的 active gap / implementation order，不是 north-star 目标态本身；目标态回到 `rca-visual-deliverable-agent-ideal-state.md`。
- `当前实态`：RCA 已把 OPL standard scaffold、generic primitives、functional harness consumer 和 stability read-model 消费面收成合同、manifest、sidecar projection 和 focused guard。RCA 不持有 functional harness、generic runtime、generic scheduler、daemon、typed queue、stage attempt orchestrator、attempt ledger、typed closeout transport、generic runner、generic transition runner、workbench、memory transport、memory refs-only writeback chain、artifact lifecycle、review/repair transport、restart/dead-letter/repair/human gate 状态链、native-helper generic envelope、conflict engine、control-loop builder、usage/resource pressure aggregator、observability exporter、external stability policy runtime，或可由 OPL pack compiler 生成的 CLI/MCP/product-entry/sidecar/status/session/workbench wrapper。RCA 只保留 visual truth、review/export verdict、artifact authority、visual memory body、owner receipt、native helper implementation、typed blocker、safe action refs 和无法声明化的 visual authority functions。sidecar/action/status parity cleanup 与 native helper wrapper retirement 已作为当前 repo 基础面保留。
- `差距定义`：功能/结构差距按理想态判断，不按当前 RCA 代码是否已经可用判断。managed DAG、attempt/state-machine runner、managed-run/session store、workspace/source intake、memory/writeback transport、artifact export lifecycle、review/repair transport、native helper generic envelope、operator projection、generic CLI/MCP wrapper、executor adapter 和 status/product shell，只要承担通用 framework/runtime 职责，就应列为 OPL 上收、generated surface 替换、收薄或退役对象；只有无法声明化的 visual authority function 才能长期保留。
- `当前新增功能面`：RCA 已新增 `visual_transition_evaluator`，把 `visual_transition_spec` 的 RCA-owned transition table 变成 sidecar 可调用的 refs-only guard evaluation。它返回 next stage、owner action、repair action、receipt/no-regression refs 或 typed blocker；不实现 OPL generic transition runner、retry/dead-letter、route graph/workbench 或 runner state。
- `当前审计面`：RCA 的 `privatized_functional_module_audit` 现在覆盖 managed DAG scheduler、attempt/state-machine runner、managed-run JSON store、product-entry session store、workspace/source intake、memory/writeback receipt transport、artifact export lifecycle、review/repair transport、native helper envelope、operator projection shell、generic CLI/MCP wrappers、Codex executor adapter 与 observability/stability read model。当前代码仍有私有功能实现；机器矩阵逐项标明 `codePaths`、active callers、OPL replacement expectation、RCA refs-only projection、迁移动作、保留理由、不可上收原因和 physical deletion guard。该审计只能说明长期 generic owner claim 已被分类和否定，不能说明仍需实现、迁移或清理的功能面已经完成。
- `最短路径`：后续必须同时维护功能/结构差距与测试/证据差距。功能/结构差距至少包括 OPL generated surface 未被生产消费、repo-local CLI/MCP/product-entry/session/sidecar/status/workbench wrapper 的 active caller 尚未迁到 OPL generated surface、focused hosted attempt 尚未接成真实 hosted path、artifact gallery/handoff shell、review/repair transport、OPL App/operator drilldown、workspace/source shell、lifecycle/receipt inventory 与 legacy physical cleanup 尚未闭合。测试/证据差距包括真实 artifact-producing owner receipt、visual memory body reuse、真实 workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。
- `Agent Lab 迁移口径`：OPL `agent-lab longline --json` 已承接 framework-level longline orchestration、hosted-attempt reconciliation projection 和 no-forbidden-write cross-domain regression。RCA repo-native guard 只断言该 OPL suite 的 passed / disposition / authority boundary，并继续把 visual quality scorer、render/export owner receipt fixture 和 artifact authority checks 留在 RCA。
- `验收顺序`：focused OPL-hosted controlled attempt 既有 hosted path 接通与 caller/receipt owner 迁移的功能面，也有真实 workspace/receipt 的证据面。Temporal long soak 属于生产运行证据；legacy physical cleanup 属于 replacement proof 与 no-active-caller proof 成立后的功能/结构收尾。
- `禁写口径`：不能把 OPL completion、transition hosted-attempt fixture、no-regression evidence 或 provider completion 写成 RCA visual ready、exportable、handoffable、artifact-producing owner receipt 或 production visual-stage soak 完成。

## 结论

本文对照 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)，只维护 RCA 自己的当前差距、完善顺序、与 OPL 的 owner 边界和通用能力上收清单。MAS、MAG、MDS 或 One Person Lab App 的并行 backlog 不写入本文；RCA 只说明哪些 visual-deliverable 能力由 RCA 持有，哪些通用外围应上收到 OPL Framework / One Person Lab App。

RCA 当前已具备 direct product entry、CLI/MCP、service-safe domain entry、product sidecar、stage descriptor、family action catalog、image-first 主线、review/export gate、domain memory descriptor locator、controlled memory apply proof、domain owner receipt contract、no-regression evidence ref、OPL 可消费的 no-regression / owner receipt focused proof、visual transition evaluator、workspace receipt inventory、operator evidence readiness projection、OPL stability read-model consumption、OPL substrate adapter export 和 private functional audit surface。它还没有达到完整生产级理想态。

RCA 的单仓计划只维护视觉交付领域真相、declarative visual pack 和 minimal authority functions。descriptor、contract/schema、domain transition spec/table、review/export gate、artifact locator、receipt schema、tests 和 domain entry 服务 OPL 发现、托管、审计和投影；sidecar/thin adapter、projection builder、CLI/MCP/product-entry/status/session wrapper 只作为 OPL pack compiler 的生成目标或迁移桥，不构成 RCA 长期手写 surface。

当前功能/结构差距计数保持 `functional_structure_gap_count=8`。这 8 项是：OPL generated surface production consumption、repo-local wrapper active caller migration、focused hosted attempt 接通、artifact gallery/handoff、review/repair transport、App/operator drilldown、workspace/source/lifecycle shell、legacy physical cleanup。

当前测试/证据差距是：真实 artifact-producing receipt、memory body reuse、workspace receipt scaleout、Temporal long soak、cross-family repeated proof。这些缺口必须在目标结构生产接通、caller 迁移和旧面清理后用真实运行证据关闭；不能用 transition fixture、no-regression ref、operator projection 或 provider completion 代替。

过程性 dated follow-through、closeout tranche 和 evidence 命令摘要已归入 [RCA standard agent 文档过程归档](../history/plans/rca-standard-agent-doc-process-history-2026-05.md)。本文后续只保留当前定位、边界、差距和完善顺序。

OPL 系列项目的全局主参考是 OPL 仓的 `docs/active/opl-family-development-reference.md`。涉及跨仓总顺序、shared primitive owner、App/workbench 通用目标和旧兼容面退役纪律时，以该主参考和 OPL docs 为准；机器或跨仓定位应使用 semantic id、contract/source ref 或 repo owner 口径，不把本机绝对路径当稳定接口。

## 通用模块上收 OPL 清单

RCA 的目标形态是 `Declarative Visual Pack + minimal authority functions`。下列能力具有跨 domain 复用价值，应优先沉淀到 OPL，而不是在 RCA 内长期维护一套私有平台或手写 generated wrapper：

| 模块 | 上收后的 OPL 责任 | RCA 保留的 authority |
| --- | --- | --- |
| Provider-backed stage runtime | stage attempt、provider receipt、query/signal、heartbeat、retry/dead-letter、restart recovery、operator action ledger | stage semantics、allowed task、visual closeout、domain receipt、forbidden-write boundary |
| Queue / human gate transport | typed queue、resume token、approval transport、human gate signal、handoff history | route approval meaning、visual stop rule、blocked item 语义、next owner |
| Workspace / source intake shell | workspace locator、source receipt shell、material gap attention item、artifact root locator、provenance navigation | source readiness verdict、communication strategy、audience promise、message hierarchy |
| Artifact gallery / handoff shell | artifact inventory view、gallery shell、handoff packet navigation、package/export attempt ledger、restore/provenance projection | canonical artifact authority、artifact mutation permission、export verdict、handoff meaning |
| Route / decision graph renderer | 通用 route graph shell、节点/边展示、decision trail drilldown、superseded/active path UI | route selection、visual direction rationale、family-specific route policy、review/export interpretation |
| Review / repair transport | blocked item queue、repair target threading、rerun request envelope、screenshot/export proof locator、human approval lane | visual director review、screenshot review verdict、repair decision、ready/exportable/handoffable verdict |
| Native helper catalog / execution envelope | helper registration、environment/provisioning metadata、execution receipt、version/proof index、operator-safe launch shell | Python helper implementation、PPT/image/export mutation logic、helper-specific RCA proof、review gate integration |
| Memory locator / writeback transport | memory descriptor discovery、body-free inventory、consumed refs、proposal refs、accepted/rejected receipt refs、freshness grouping | visual pattern memory body、route caveat、accept/reject authority、lesson quality judgment |
| State-machine runner / transition matrix | transition schema、幂等 tick、retry/dead-letter、human gate transport、dispatch receipt、matrix runner、transition bridge evidence refs-only workbench drilldown | visual route transition table、source/readiness/review/export guard、repair action、blocked item typed blocker、artifact owner receipt |
| Observability / SLO / repair projection | trace/log/event transport、freshness/SLO projection、stale scan、repair command projection、attention queue、control-loop summary、usage/resource pressure、read-only observability export、external stability policy | domain blocker meaning、safe repair hint、visual quality facts、artifact/export authority boundary、owner receipt / typed blocker / no-regression evidence refs |

上收边界的验收标准：

- OPL 只保存 locator、metadata、receipt refs、provider receipts、transition evidence refs-only projection、operator projection 和 action routing shell。
- RCA 返回 owner receipt、typed blocker、no-regression evidence、artifact refs、review refs 或 export refs。
- OPL/App 不能生成 RCA visual ready、exportable 或 handoffable verdict。
- memory body、canonical artifacts、review/export judgment 和 artifact mutation permission 不迁入 OPL state 或 repo source tree。

## 总体差距矩阵

| 目标面 | 当前实际状态 | 功能/结构差距 | 测试/证据差距 | 完善计划 |
| --- | --- | --- | --- | --- |
| Public entry / package | 单一 `redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`invokeDomainEntry` 和 sidecar surface 已是当前公开入口；sidecar guarded actions、manifest sidecar、family action catalog、CLI help 和 MCP product-entry routes 已收口到 canonical metadata。旧 workbench、frontdoor、federation、standalone Hermes probe 与 gateway-action alias 已退出 active surface。 | OPL generated surface 还没有生产消费；repo-local CLI、MCP、product-entry、session、sidecar、status 和 workbench wrapper 的 active caller 仍需迁到 OPL generated surface。当前 RCA 入口可以作为 domain handler target 或迁移桥，不能写成长期手写 generated wrapper。 | 新增 action 仍需要同步 CLI/MCP/manifest/tests/status 的 parity proof；旧 alias 不允许作为兼容测试入口回流。 | 新增或修改入口时同步 CLI、MCP、manifest、tests 和 status；OPL generated wrapper 可用后迁走 active caller，保留 RCA domain handler / visual authority entry，旧 wrapper 无 authority caller 后直接删除或 tombstone。 |
| OPL-hosted controlled stage | RCA 已提供 OPL discovery、stage control projection、product sidecar dispatch、owner receipt / typed blocker / no-regression evidence ref 合同、generic primitive consumer projection、stability read-model consumption、operator evidence readiness projection 和 workspace receipt inventory projection。 | Focused hosted attempt 仍缺真实 hosted path 接通、active caller 迁移和 receipt/lifecycle owner 边界闭合；workspace/source shell、artifact gallery/handoff shell、review/repair transport 和 lifecycle/receipt inventory 仍是 OPL/App 待生成或待托管功能面。 | 真实 artifact-producing owner receipt、visual memory body reuse、真实 workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof 尚未产出；workspace receipt inventory 目前只证明当前 workspace receipt refs 可见。 | 先接通 OPL provider / generated shell 到 RCA service-safe domain entry，再由 RCA 产出 domain receipt、typed blocker 或 no-regression evidence ref；证据阶段扩展到真实 artifact-producing attempt 和 live soak，不把 OPL completion、readiness projection、stability projection、receipt inventory 或 observability export 提升为 RCA visual ready。 |
| Framework-level longline guard | OPL Agent Lab longline suite 已提供统一 `agent_lab_longline_suite` read model，覆盖 RCA `controlled visual-stage soak orchestration`、`hosted-attempt reconciliation projection` 和 `no-forbidden-write cross-domain regression` 的迁移 disposition；RCA 测试只调用 OPL CLI 并断言 suite / domain / authority boundary。 | RCA 内重复 framework-level longline / recovery / no-forbidden-write 断言若仍有 active caller，需要在 OPL Agent Lab replacement proof 后收缩或删除；保留的 RCA 测试只应覆盖 visual authority。 | 需要继续证明 OPL suite pass 不被写成 RCA visual quality verdict、artifact mutation permission、memory accept/reject 或 production soak success。 | 删除或收缩 RCA 内重复 framework-level longline / recovery / no-forbidden-write 断言时，以 OPL Agent Lab JSON disposition 和 no-active-caller proof 为准；RCA 保留 visual quality scorer、render/export owner receipt fixture 和 artifact authority checks。 |
| Deliverable family proof | `ppt_deck` 与 `xiaohongshu` 已以 image-first 为默认路线；HTML/native PPTX 是显式可选路线；`poster_onepager` 保持 guarded route。 | 已有 family 的 descriptor、route policy、artifact locator、review/export gate 是 RCA 保留结构面；新增 family 仍需要先补 descriptor、route policy、artifact locator、review/export gate 与 no-forbidden-write guard。 | 三个 family 的长期、重复、真实 artifact proof 还没有全部达到生产 soak 水平；新增 family 需要准入 proof。 | 逐 family 跑 direct proof、OPL-hosted proof、review/export proof 和 repair proof；新增 family 必须先有 descriptor、route policy、artifact locator、review/export gate 与 no-forbidden-write proof。 |
| Stage attempt receipts | stage descriptor、route artifacts、runtime watch、review/export projection 已存在；domain owner receipt contract 已 landed。 | Stage receipt schema / locator 已成立，但 attempt receipt 的 workspace/source shell、artifact refs、review refs、human gate receipt、handoff packet 和 lifecycle inventory 还没有在 generated shell / product shell 中闭合。 | 每个真实 stage attempt 的 source refs、artifact refs、review refs、blocked reason、human gate receipt 和 owner receipt 还未全部常态化。 | 把 attempt receipt 写入 workspace/runtime root，并从 OPL generated shell / product shell 只读展示；repo 只保留 descriptor、schema、test fixture 和 locator。 |
| Domain memory | descriptor locator、seed fixture locator、writeback proposal、accept/reject contract、receipt locator 和 operator projection 已进入 repo-source contract surface；`workspace_receipt_inventory_projection` 已可读取当前 workspace 的 accepted/rejected memory receipt refs 和 lifecycle receipt refs。 | Memory descriptor/locator 结构已成立；workspace memory/lifecycle receipt inventory 仍需闭合到 generated shell / operator drilldown，跨 workspace inventory/read model 仍需规模化，memory transport 不能停留在 RCA-local 手写 wrapper。 | 真实 visual pattern memory body、review/export closeout writeback、visual memory body reuse、真实 workspace receipt scaleout 和 production memory reuse 尚未闭环。 | 先在 RCA runtime/domain-memory root 产生真实 receipt instance，再让 OPL 消费 locator/projection/read-model refs；不把 memory body 或视觉 verdict 迁入 OPL。 |
| Domain transition spec | RCA 已通过 `visual_transition_spec` 和 `visual_transition_evaluator` 在 product-entry manifest、sidecar projection、runtime-program contract 和 focused tests 中声明 source/readiness 到 communication strategy、visual direction、artifact creation、review/repair、package/export 的 RCA-owned transition table、guard contract、oracle fixture、owner action和 refs-only guard evaluation；OPL generic runner/workbench 语义已经归入 `opl_generic_primitive_consumption`，RCA 只保留 transition spec/table、evaluator、typed blocker、owner receipt refs 和 bridge evidence refs。 | Transition spec/evaluator 是 RCA 保留结构面；OPL provider bridge、generic runner/workbench 和 focused hosted attempt 的真实生产接入仍未完成，不能写成只是 evidence gate。 | 真实 provider-hosted transition attempt 的 retry/dead-letter、长时运行和 Temporal long soak 仍未作为运行证据产出；当前证据是 RCA guard evaluation 与 receipt 对账形状，不是 visual-stage production soak。 | 由真实 OPL provider attempt bridge 消费 transition result 和 RCA evaluator/receipt refs，验证 live receipt 对账；RCA 不生成 generic runner state，不携带 artifact blob、memory body 或 review/export verdict。 |
| Native helper / Python surface | Python helper catalog、runtime callsite 和 proof lane 已收敛到 package-module invocation；native-helper generic envelope 在 `opl_generic_primitive_consumption` 中归 OPL，RCA 保留 Python helper implementation；`ppt_deck_review.py`、`ppt_deck_export.py`、`ppt_deck_native.py` 与 `agent_loop_bridge.py` thin wrapper 已退役。 | 当前 wrapper 退役已经完成；后续如果 native-helper generic envelope、launcher、receipt envelope 或 active caller 回流到 RCA-local wrapper，必须重新列为功能/结构差距并直接退役。 | 真实 native PPT / review / export production proof 仍按显式 route 和 helper proof lane 后续扩展；wrapper 退役本身不是 production visual-stage soak。 | 继续用 package-module helper catalog、runtime callsite guard 和 proof lane维护 helper 边界；不恢复 `script` / `compatibility_script` compatibility layer。 |
| New-agent template readiness | 新 OPL Agent 应复用 OPL-owned standard scaffold / generic primitives，并由 domain repo 提供 owner-boundary、descriptor/stage/action/memory/artifact locator、sidecar/receipt schema、docs taxonomy 和 no-forbidden-write gate | RCA 已具备 canonical docs taxonomy、`agent/` anchor、runtime-program contract、product sidecar、deliverable family packages、plugin skill、native helper implementation 和 visual transition spec；`opl_generic_primitive_consumption` 已把可复用 scaffold/generic primitive 消费面投影出来。 | 通用 template/checklist 和 generated surface production consumption owner 仍在 OPL；RCA 只能作为 consumer exemplar，不能把 artifact-heavy 物理目录写成通用 scaffold 完成态。 | 通用 template/checklist 仍需 OPL 侧抽取和 consumer proof；RCA 只能作为 consumer exemplar。 | RCA 只作为 OPL scaffold consumer exemplar；通用 template/checklist 的 owner 在 OPL，RCA 保留 artifact-heavy domain implementation。 |
| User workbench | 当前是 CLI/product shell/operator projection；面向人的 desktop/Web 工作台不是 RCA 仓内已完成产品。 | App/operator drilldown、artifact gallery、review state、attention queue、workspace/source shell 和 safe action routing 仍未闭合到 OPL App / generated workbench shell；RCA 当前 operator projection 只是 refs-only source。 | 真实工作台中进度、阻塞、artifact gallery、review state、attention queue 的可用 drilldown 证据仍不足。 | 先保证 projection source 稳定，再在 OPL App 或 RCA product shell 读取这些 source；UI 不持有 visual truth 或 artifact rewrite authority。 |
| Persistence / lifecycle | 当前坚持 file authority + rebuildable artifact indexes；SQLite 仍是 deferred option。 | Lifecycle/receipt inventory、cleanup/restore/retention shell 和跨 deliverable session index 仍需由 OPL generated shell 或 rebuildable sidecar 闭合；不得把 SQLite 或 repo-local store 升级成 visual truth。 | 需要等真实文件规模、查询压力、retention 维护成本或 workspace receipt scaleout 后再用证据推动。 | 只有在真实文件规模、查询压力或 retention 维护成本出现后，再引入 rebuildable SQLite sidecar；不得把 SQLite 升级成 visual truth 或 artifact blob owner。 |
| OPL pack compiler / generated surface | OPL 应从 RCA descriptor、stage graph、action metadata、visual policies、receipt schema、artifact/memory/source locator 和 authority manifest 生成 CLI/MCP/product-entry/sidecar/status/session/workbench/harness；RCA 已通过 `visual_pack_compiler_handoff` 暴露声明式 visual pack 输入和 generated-surface handoff。 | 缺 OPL generated surface production consumption、repo-local CLI/MCP/product-entry/session/sidecar/status/workbench wrapper active caller migration、artifact gallery/handoff shell、review/repair transport、App/operator drilldown、workspace/source shell、lifecycle/receipt inventory 和 legacy physical cleanup；这些都是功能/结构差距。 | 迁移后仍需 no-regression proof、真实 artifact-producing owner receipt、visual memory body reuse、真实 workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。 | OPL pack compiler 可用后，把 active caller 迁到 generated/replacement；原 RCA shell 若不再承载 authority function、diagnostic cleanup 或 fixture/provenance，直接删除或 tombstone。RCA 只保留 review/export verdict、artifact authority、visual memory accept/reject、owner receipt signer、source readiness verdict 和 native helper implementation。 |

## 最短实施顺序

1. `pack_compiler_generated_surface_production_consumption`
   由 OPL generated descriptor scope 生产消费 RCA visual pack，先关闭 generated surface production gap，再继续 wrapper migration。
2. `repo_local_wrapper_active_caller_migration`
   把 repo-local CLI/MCP/product-entry/session/sidecar/status/workbench wrapper 的 active caller 迁到 OPL generated surface；RCA 只保留 domain handler target、direct entry、refs-only adapter 和 visual authority function。
3. `focused_opl_hosted_controlled_attempt`
   接通一个低风险真实 workspace 的 hosted path，优先 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 generated continuation shell 进入 RCA service-safe domain entry，返回 `domain_receipt`、`typed_blocker` 或 `no_regression_evidence`。
4. `artifact_gallery_handoff_and_review_repair_transport`
   将 artifact gallery/handoff、review/repair transport 和 handoff packet 闭合到 OPL/App generated shell；RCA 继续持有 artifact authority、review/export verdict 和 mutation permission。
5. `opl_app_operator_drilldown`
   让 OPL App 或 RCA product shell 展示 workspace、deliverables、review、artifacts、attention 和 safe actions；UI 只消费 refs、receipt、typed blocker 和 repair hints。
6. `workspace_source_lifecycle_shell`
   将 workspace/source intake shell、lifecycle/receipt inventory、cleanup/restore/retention shell 闭合到 generated shell 或 rebuildable sidecar；RCA 不把 repo-local store 升级成 generic runtime owner。
7. `legacy_physical_cleanup`
   在 replacement proof、no-active-caller proof 和 domain authority refs preserved 成立后，删除或 tombstone 旧 Hermes / Gateway / local-manager / bridge residue。
8. `runtime_evidence_scaleout`
   在结构差距关闭后，补真实 artifact-producing receipt、memory body reuse、workspace receipt scaleout、Temporal long soak 和 cross-family repeated proof。

## 当前基础面与后续证据缺口

RCA 当前可作为后续完善基础的 repo surface 包括：

- `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`、`emit_workspace_receipt_proof` 已进入 product sidecar guarded action、manifest、family action catalog、runtime-program contract 和 focused tests。
- sidecar/action/status parity cleanup 已把 product sidecar guarded actions / forbidden writes、manifest sidecar、family action catalog、CLI help 和 MCP product-entry routes 收到 canonical metadata；`invokeOplHostedProductEntry` 仍是 internal OPL integration contract，不是公开 MCP action。`supervise_managed_run` 与 `product_entry_continuation` 已退出 default sidecar dispatch/action 面，归 OPL runner/session shell；RCA direct API、diagnostic 和内部 visual authority surface 不作为 standard sidecar default。
- native helper wrapper cleanup 已完成 package-module-only 收敛和 no-active-caller proof；deleted wrapper paths 由 retired-surface guard 防止复活。
- `no_regression_owner_receipt_opl_consumption_proof` 已进入 manifest / sidecar projection / focused tests；它只证明 OPL 可保存 no-regression evidence ref、domain owner receipt ref 或 typed blocker，并显式禁止 visual ready、exportable、handoffable 或 production soak success claim。
- `opl_stability_read_model_consumption` 已进入 manifest / sidecar projection / runtime-program contract / focused tests；它只证明 RCA 对 OPL control-loop、usage/resource pressure、conflict envelope、observability export 和 external stability policy 的 refs-only 消费边界，不生成 OPL exporter、fallback runtime、event bus 或 visual-stage success claim。
- `operator_evidence_readiness_projection` 已进入 manifest / status / runtime-program contract / focused tests；它只聚合现有 refs-only surfaces 并展示 next gates，不生成 visual truth、artifact blob、memory body、artifact-producing receipt 或 production soak claim；其中 OPL generated surface production consumption、App/operator drilldown、workspace/source shell、artifact gallery/handoff shell、review/repair transport、lifecycle/receipt inventory 和 legacy cleanup 仍属于功能/结构差距。
- `workspace_receipt_inventory_projection` 已进入 manifest / status / session / sidecar / runtime-program contract / focused tests；它只读取 workspace receipt refs 并展示 coverage，不生成 receipt instance、artifact gallery、workbench、visual truth、memory body 或 production soak claim。
- `visual_transition_evaluator` 已进入 manifest / sidecar / runtime-program contract / focused tests；它只评估 RCA-owned transition guard refs 并返回 next-stage metadata、owner action、receipt refs 或 typed blocker，不实现 OPL generic runner、route graph、dead-letter、workbench 或 provider attempt ledger。
- `opl_substrate_adapter_export` 已进入 manifest / sidecar / runtime-program contract / focused tests；它只导出 OPL 可消费的 opaque/index-only workspace/source/artifact/memory refs，不导出 artifact body、memory body、layout/review/export verdict 或 owner receipt authority。
- `privatized_functional_module_audit.functional_structure_gap_closure` 已进入 manifest / sidecar / runtime-program contract / focused tests；它把 RCA consumer thinning lane 的长期 owner claim 分类为 `opl_hosted_surface`、`opl_generated_surface`、`refs_only_adapter`、`declarative_pack` 或 `minimal_authority_function`。这不等于功能/结构完成；剩余的 `opl_generated_surface_production_consumption`、`opl_app_operator_drilldown`、active caller migration、workspace/source/lifecycle shell 和 legacy cleanup 仍是功能/结构差距。
- RCA 写 domain-owned workspace/runtime refs，并持有 visual truth、review/export verdict、memory body 和 canonical artifact authority；OPL 只读取 descriptor、locator、projection、receipt refs、operator projection 和 repair hints。
- direct product entry、CLI/MCP、service-safe domain entry、product sidecar、stage descriptor、family action catalog、image-first route、review/export gate 与 domain owner receipt contract 是当前 active surface。

这些基础面仍不能升级成 production soak claim。当前功能/结构差距至少包括：OPL generated surface 未生产消费；repo-local CLI/MCP/product-entry/session/sidecar/status/workbench wrapper 的 active caller 仍需迁到 OPL generated surface；artifact gallery/handoff shell、review/repair transport、OPL App/operator drilldown、workspace/source shell、lifecycle/receipt inventory 和 legacy physical cleanup 仍需闭合；focused hosted attempt 仍需从 fixture/shape 走到真实 hosted path。测试/证据差距按顺序包括：

- 真实 OPL Temporal controlled visual-stage long soak 仍未完成；不能声明 provider-hosted production soak success；当前 transition hosted-attempt 证据只覆盖 repo-local receipt 对账形状，不升级为 visual_ready、exportable 或 handoffable。
- 真实 artifact-producing owner receipt、visual memory body reuse、真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证和 cross-family repeated proof 仍是后续 runtime/product evidence lane。
- OPL standard scaffold / generic primitives / stability read-model 在 RCA 侧的消费合同、manifest、sidecar 和 guard 已完成；后续只需要防回归，不再作为功能缺口重复跟踪。
- `poster_onepager` 仍保持 guarded knowledge poster 边界，尚未扩展为 academic/conference poster production lane。

维护验证时优先跑 repo-native verification，再按变更范围选择 focused owner-boundary tests。叙述性 docs 不作为测试断言对象；验证证据应来自 contracts、manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 和真实交付物证据。

## 已退役并清理的旧面

- `REDCUBE_WORKBENCH_ROOT` workspace root 兼容输入。
- standalone `scripts/probe-upstream-hermes-agent.ts` proof 入口。
- `@redcube/hermes-agent-client` / `@redcube/hermes-substrate` 这类 repo-local Hermes package surface。
- `GatewayActionMap`、`getCliGatewayActions`、`callGatewayTool`、`listGatewayTools`、`GatewayTool*`、`deps.gateway` 等旧 action/tool alias。
- `frontdoor`、`federation`、`source-pack-federation`、`product frontdesk`、`OPL bridge` 作为 active source/API surface 的入口。
- active 小红书质量样例里的 `source_workbench*` 字段；当前语义统一为 `source_visual_reference*`。

## 当前不能写成

- 不能写成 RCA 已完成 production visual-stage long soak。
- 不能写成 OPL provider completion 等于 RCA visual ready、exportable 或 handoffable。
- 不能把 transition hosted-attempt fixture、no-regression evidence 或 focused receipt proof 写成 artifact-producing owner receipt。
- 不能把 OPL control-loop summary、usage/resource pressure、observability export 或 external stability policy 写成 RCA visual quality/export verdict、自动降级、自动修复或 production success。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。
