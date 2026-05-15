# RCA 理想目标态差距与完善计划

Owner: `RedCube AI`
Purpose: `ideal_state_gap_plan`
State: `active_support`
Machine boundary: 本文是人读 gap / completion plan。机器可读真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。
Date: `2026-05-14`

## 结论

本文对照 [RedCube AI 理想目标态](../references/rca-visual-deliverable-agent-ideal-state.md)，只维护 RCA 自己的当前差距、完善顺序、与 OPL 的 owner 边界和通用能力上收清单。MAS、MAG、MDS 或 One Person Lab App 的并行 backlog 不写入本文；RCA 只说明哪些 visual-deliverable 能力由 RCA 持有，哪些通用外围应上收到 OPL Framework / One Person Lab App。

截至 `2026-05-14`，RCA 已经具备 direct product entry、CLI/MCP、service-safe domain entry、product sidecar、stage descriptor、family action catalog、image-first 主线、review/export gate、domain memory descriptor locator、controlled memory apply proof、domain owner receipt contract 和 no-regression evidence ref 等主要 repo-verified surface。它还没有达到完整生产级理想态。

OPL 系列项目的全局主参考是 `/Users/gaofeng/workspace/one-person-lab/docs/active/opl-family-development-reference.md`。涉及跨仓总顺序、shared primitive owner、App/workbench 通用目标和旧兼容面退役纪律时，以该主参考和 OPL docs 为准。

## 通用模块上收 OPL 清单

RCA 的目标形态是 `visual-deliverable Domain Knowledge / Authority Pack`。下列能力具有跨 domain 复用价值，应优先沉淀到 OPL，而不是在 RCA 内长期维护一套私有平台：

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
| State-machine runner / transition matrix | transition schema、幂等 tick、retry/dead-letter、human gate transport、dispatch receipt、matrix runner | visual route transition table、source/readiness/review/export guard、repair action、blocked item typed blocker、artifact owner receipt |
| Observability / SLO / repair projection | trace/log/event transport、freshness/SLO projection、stale scan、repair command projection、attention queue | domain blocker meaning、safe repair hint、visual quality facts、artifact/export authority boundary |

上收边界的验收标准：

- OPL 只保存 locator、metadata、receipt refs、provider receipts、operator projection 和 action routing shell。
- RCA 返回 owner receipt、typed blocker、no-regression evidence、artifact refs、review refs 或 export refs。
- OPL/App 不能生成 RCA visual ready、exportable 或 handoffable verdict。
- memory body、canonical artifacts、review/export judgment 和 artifact mutation permission 不迁入 OPL state 或 repo source tree。

## 总体差距矩阵

| 目标面 | 当前实际状态 | 差距 | 完善计划 |
| --- | --- | --- | --- |
| Public entry / package | 单一 `redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`invokeDomainEntry` 和 sidecar surface 已是当前公开入口。旧 workbench、frontdoor、federation、standalone Hermes probe 与 gateway-action alias 已退出 active surface。 | CLI/MCP/product manifest 仍需要持续保持 action parity；任何新增 action 都必须从 `family_action_catalog` 派生并进入同一命名体系。 | 新增或修改入口时同步 CLI、MCP、manifest、tests 和 status；保持 `domainActions`、`callDomainTool`、`listDomainTools`、`DomainTool*` 命名，不恢复旧 alias。 |
| OPL-hosted controlled stage | RCA 已提供 OPL discovery、stage control projection、product sidecar dispatch、owner receipt / typed blocker / no-regression evidence ref 合同。 | 真实 OPL-hosted controlled visual stage long soak 和 artifact-producing domain owner receipt 尚未作为完成证据跑出。 | 下一步只补真实 hosted attempt 证明：由 OPL provider 发起 attempt，RCA 产出 domain receipt 或 typed blocker / no-regression evidence ref；不把 OPL completion 提升为 RCA visual ready。 |
| Deliverable family proof | `ppt_deck` 与 `xiaohongshu` 已以 image-first 为默认路线；HTML/native PPTX 是显式可选路线；`poster_onepager` 保持 guarded route。 | 三个 family 的长期、重复、真实 artifact proof 还没有全部达到生产 soak 水平；poster 仍是受控 knowledge poster 边界。 | 逐 family 跑 direct proof、OPL-hosted proof、review/export proof 和 repair proof；新增 family 必须先有 descriptor、route policy、artifact locator、review/export gate 与 no-forbidden-write proof。 |
| Stage attempt receipts | stage descriptor、route artifacts、runtime watch、review/export projection 已存在；domain owner receipt contract 已 landed。 | 每个真实 stage attempt 的 source refs、artifact refs、review refs、blocked reason、human gate receipt 和 owner receipt 还未全部常态化。 | 把 attempt receipt 写入 workspace/runtime root，并从 product shell / OPL projection 只读展示；repo 只保留 descriptor、schema、test fixture 和 locator。 |
| Domain memory | descriptor locator、seed fixture locator、writeback proposal、accept/reject contract、receipt locator 和 operator projection 已进入 repo-source contract surface。 | 真实 visual pattern memory body、accepted/rejected receipt instances 和 review/export closeout writeback 尚未作为常态运行流闭环。 | 先在 RCA runtime/domain-memory root 产生真实 receipt instance，再让 OPL 消费 locator/projection；不把 memory body 或视觉 verdict 迁入 OPL。 |
| Domain transition spec | RCA 已有 stage control projection、route equivalence、review/export gate 和 controlled visual attempt proof；OPL 已有 generic transition runner / matrix runner 基础。 | 视觉路线从 source/readiness 到 visual direction、artifact creation、review/repair、package/export 的转换还没有固化为 RCA-owned transition table，也没有接入 OPL runner / provider attempt bridge。 | RCA 声明 visual transition table、guard、oracle fixture、blocked item typed blocker 和 owner action；OPL 只执行 spec，不生成 visual/export verdict。 |
| Native helper / Python surface | Python helper catalog 已声明 package module 为 preferred invocation，仍允许 thin script wrapper 作为迁移期 ref。 | 部分 helper 仍有 `script` / `compatibility_script` 形态；这不是理想终态。 | 按 catalog 逐项迁到 package-module invocation，更新 runtime callsite 和 helper tests；完成后再把 wrapper allowance 收紧。 |
| User workbench | 当前是 CLI/product shell/operator projection；面向人的 desktop/Web 工作台不是 RCA 仓内已完成产品。 | 进度、阻塞、artifact gallery、review state、attention queue 的人用 UI 仍属于 OPL App 或 product shell 后续形态。 | 先保证 projection source 稳定，再在 OPL App 或 RCA product shell 读取这些 source；UI 不持有 visual truth 或 artifact rewrite authority。 |
| Persistence / lifecycle | 当前坚持 file authority + rebuildable artifact indexes；SQLite 仍是 deferred option。 | 还没有达到跨 deliverable 全局查询、长期 retention ledger 和 session index 的成熟侧车索引形态。 | 只有在真实文件规模、查询压力或 retention 维护成本出现后，再引入 rebuildable SQLite sidecar；不得把 SQLite 升级成 visual truth 或 artifact blob owner。 |

## RCA-only 完善顺序

1. `controlled_visual_stage_attempt`
   选一个低风险真实 workspace，优先 `ppt_deck` 或 `xiaohongshu`，从 OPL-hosted attempt 或 direct product-entry continuation 进入同一 RCA service-safe domain entry，返回 `domain_receipt`、`typed_blocker` 或 `no_regression_evidence`。
2. `emit_domain_owner_receipt`
   已作为 RCA-owned callable surface 落地。它把 artifact delta、review state、repair target、export proof、handoff packet、residual risk 和 no-forbidden-write proof 纳入同一 owner receipt shape；direct path 与 OPL-hosted path 使用同一 return shape；缺关键 refs 时返回 typed blocker。
3. `apply_visual_memory_writeback`
   已作为 RCA-owned callable surface 落地。它从 locator-only proposal 执行 RCA owner accept/reject，写 accepted/rejected runtime receipt refs；memory body 仍由 RCA-owned runtime/workspace memory store 持有，OPL 只消费 locator 和 receipt refs。
4. `apply_visual_workspace_lifecycle`
   已作为 RCA-owned callable surface 落地。它对 visual workspace cleanup / restore / retention 请求返回 lifecycle receipt 或 typed blocker；真实 artifact mutation 仍要求 RCA domain receipt，OPL 只维护 locator、retention ledger 和 restore/provenance projection。
5. `declare_visual_transition_spec`
   预留为 RCA-owned visual transition spec surface。它把 source readiness、communication strategy、visual direction、artifact creation、review/repair、export handoff 的状态组合映射成下一 owner、repair action、typed blocker 或 receipt requirement；OPL generic runner 只执行这份 spec，不裁决 visual ready / exportable。
6. `opl_app_projection`
   让 OPL App 或 RCA product shell 展示 workspace、deliverables、review、artifacts、attention 和 safe actions；所有动作路由到 OPL provider signal、RCA product-entry、RCA sidecar 或 manual handoff，并返回 receipt/typed blocker。
7. `legacy_physical_cleanup`
   有 direct/hosted parity、fixture/provenance 和 no-active-caller proof 后，再删除或 tombstone 旧 Hermes / Gateway / local-manager / bridge residue。

## 本轮计划 closeout

### planned

- 把 RCA ideal-state / gap 计划从泛化 backlog 收口成可执行 closeout 结构，保留 current truth 与 target-state 的区别。
- 落地 `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle` 三个 sidecar guarded actions，作为 RCA-owned workspace/runtime apply surface，而不是 OPL-owned truth surface。
- 在 status、architecture、decisions 与 runtime architecture 中同步说明：这些 surface 只写 workspace runtime refs、domain receipt、typed blocker、no-regression evidence 或 lifecycle receipt；RCA 持有 authority，OPL 只消费 locator/projection/receipt refs。
- 明确真实 OPL Temporal controlled visual-stage long soak 尚未完成，不能把 OPL stage completion、provider completion 或 no-regression ref 写成 RCA visual ready / production soak success。

### done

- `emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle` 已进入 product sidecar guarded action、manifest、family action catalog、runtime-program contract 和 focused tests。
- 本文把本轮计划按 `planned / done / deferred / skipped / verification / commit-push state` 结构记录，方便后续真实 OPL-hosted long soak 和 UI/projection lane 接力。
- 核心维护文档同步了 owner split：RCA 写 domain-owned workspace/runtime refs，并持有 visual truth、review/export verdict、memory body 和 canonical artifact authority；OPL 只读取 descriptor、locator、projection、receipt refs、operator projection 和 repair hints。

### deferred

- 真实 OPL Temporal controlled visual-stage long soak 仍未完成；不能声明 provider-hosted production soak success。
- 真实长时 artifact-producing attempt、跨 family 重复 proof、真实 visual pattern memory body 积累、retention ledger 规模化验证和 OPL App / product shell 工作台投影仍是后续 runtime/product lane。
- `poster_onepager` 仍保持 guarded knowledge poster 边界，尚未扩展为 academic/conference poster production lane。

### skipped

- 本轮不生成真实 PNG/PPTX/PDF 运行产物，不把 receipt instance 写入 repo source tree。
- 本轮不声明 OPL Temporal long soak、跨 family production soak、UI workbench 或外部发布动作已完成。
- 本轮不移动旧历史文档，也不恢复旧 gateway / frontdoor / workbench / repo-local Hermes active surface。

### verification

- 已验证 `./scripts/verify.sh`。
- 已验证 `npm run test:fast`。
- 已验证 focused owner-boundary tests：`tests/product-entry-cases/runtime-and-sidecar-surfaces.test.ts`、`tests/opl-family-contract-adoption.test.ts`、`tests/product-entry-cases/manifest-and-start-surfaces.test.ts`、`tests/product-entry-cases/memory-skeleton-retirement-proof.test.ts`、`tests/product-domain-action-api.test.ts`、`tests/cli-v2-smoke-cases/runtime-and-product-entry.test.ts`、`tests/python-native-helper-catalog.test.ts`、`tests/block-content-fit-review*.test.ts`、`tests/ppt-creative-ownership-cases/foundation-and-routes.test.ts`。

### commit-push state

- 代码、合同、测试和文档已吸收到 `main`。
- 本轮没有 push；真实 production soak claim 仍等待 OPL Temporal controlled visual-stage long-run proof。

## 本轮明确退役并清理的旧面

- `REDCUBE_WORKBENCH_ROOT` workspace root 兼容输入。
- standalone `scripts/probe-upstream-hermes-agent.ts` proof 入口。
- `@redcube/hermes-agent-client` / `@redcube/hermes-substrate` 这类 repo-local Hermes package surface。
- `GatewayActionMap`、`getCliGatewayActions`、`callGatewayTool`、`listGatewayTools`、`GatewayTool*`、`deps.gateway` 等旧 action/tool alias。
- `frontdoor`、`federation`、`source-pack-federation`、`product frontdesk`、`OPL bridge` 作为 active source/API surface 的入口。
- active 小红书质量样例里的 `source_workbench*` 字段；当前语义统一为 `source_visual_reference*`。
