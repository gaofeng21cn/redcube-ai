# RCA 私有实现与 OPL 迁移台账

Owner: `RedCube AI`
Purpose: `opl_private_implementation_migration_inventory`
State: `active_inventory`
Machine boundary: 本文是人读迁移治理台账。机器真相继续归 contracts、runtime-program leaf contracts、CLI/MCP/API 行为、product-entry manifest、product domain_action_adapter projection、workspace/runtime receipt、artifact locator、review/export gate 和 RCA owner receipt。
Date: `2026-05-23`

## 当前 clean truth

RCA 是 OPL-compatible visual-deliverable domain agent。旧 repo-local managed runtime / DAG runner / run store 已物理退役；当前 RCA 只应保留 declarative visual pack、service-safe domain entry、domain handler target、refs-only adapter、minimal visual authority function 和 native helper implementation。

OPL Framework 持有 generated/hosted wrappers、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell、generic native-helper envelope 与 observability/SLO/read model。RCA 持有 visual truth、source readiness、communication/visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt、typed blocker 和 native helper implementation。

Product-entry manifest 当前只按 RCA domain refs、manifest assembly、visual route truth refs、authority refs、OPL shell projection 和 refs-only operator evidence 子投影读取。相关 source split 是迁移治理事实，不表示 OPL 已完全接管 generic session/workbench/domain_action_adapter primitive；过程细节不在本文继续追加。

Deliverable route runner 入口也已做源码责任拆分：`run-deliverable-route.ts` 收薄为 `runDeliverableRoute` 调度入口，route dependency recovery、`stop_after_stage` continuation、`fix_html` agent-loop escalation proof、stage artifact / hydrated contract access 和 domain-entry response assembly 分别进入 `run-deliverable-route-parts/`。这只是把混合控制面拆成可迁移子域；active caller 仍在 RCA，OPL generic route attempt shell / retry-dead-letter / attempt ledger 还未成为 default caller。

Executor runtime protocol 当前只保留 route-level executor policy、topology descriptor、receipt refs 与 refs-only route-run record materialization。route-run record / event persistence 是迁移输入和当前 active adapter，不是 RCA 新建长期 generic run store；OPL attempt ledger / runtime record primitive 成为 default caller 后继续退役。

本文里的“仍需 OPL primitive / replacement / default caller”表示退役手段尚未完全默认化或尚未以 active caller 证明，不表示 RCA 私有平台化目标暂停，也不表示 OPL 已经完全接管。已提供并被 RCA 消费的能力会写成 `consumed`、`default caller live` 或 `generated/hosted surface active`；尚未默认化的能力继续作为迁移/退役门槛，而不是保留私有平台的理由。

本台账只维护当前 active surface 的分类、保留 authority、可上收 generic 子域和退役门。dated scan、line-count 变化、拆分过程、proof 命令和 closeout receipt 进入 contracts 或 `docs/history/**`，不在本文继续追加流水。

## Classification

| class | 含义 |
| --- | --- |
| `domain_authority_retained` | visual judgment、artifact authority、memory accept/reject、owner receipt、native helper implementation。 |
| `opl_framework_migration_candidate` | 当前 repo-local wrapper / projection shell 长期应由 OPL generated/hosted primitive 承担。 |
| `already_thin_adapter` | 已收薄为 refs-only adapter/projection/provenance，仍因 direct route、domain handler 或测试暂留。 |
| `needs_split_before_migration` | 同一文件混合 visual authority 与 generic domain_action_adapter/session/workbench/projection shell。 |

## Active Inventory

| surface group | current active caller | 当前 RCA 角色 | 可迁往 OPL 的 generic 子域 | 迁移/退役门槛 |
| --- | --- | --- | --- | --- |
| Product domain_action_adapter API and guarded action catalog | product domain_action_adapter export/dispatch、family action catalog、manifest/status exports | domain domain_action_adapter target、guarded visual authority action metadata、forbidden-write policy、retired-surface tombstone refs | generated domain_action_adapter wrapper、typed queue dispatch shell、command surface registration、MCP/product-entry domain_action_adapter scaffolding | OPL generated domain_action_adapter/default caller live；RCA owner receipt / typed blocker / no-forbidden-write roundtrip preserved；no compatibility alias scan clean |
| Product domain_action_adapter refs-only projections | manifest/domain_action_adapter/audit projection builders、OPL provider bridge | OPL generated interface consumption、generic primitive consumption、stability read-model consumption、substrate adapter export 的 refs-only migration input | generated product/status/workbench/domain_action_adapter projection、observability/stability read model、substrate adapter shell | OPL generated/hosted shell 成为 default caller；RCA manifest/domain_action_adapter 只保留 domain handler refs；production evidence tail 用真实 owner receipt 或 typed blocker 关闭 |
| Product-entry manifest and shell catalog | product-entry manifest/status/session projection | manifest orchestration、visual route truth refs、authority surface refs、artifact locator refs、domain handler refs；OPL shell projection 与 operator evidence refs-only 子投影已拆入 manifest parts modules | generated product-entry/status/session/workbench shell、skill/operator action catalog、generic session/workbench/domain_action_adapter primitive | OPL generated manifest shell 成为 active/default caller；direct route parity 和 no-compatibility-alias proof 成立；RCA 仅保留 domain refs |
| Product-entry continuity / session snapshot refs | `invokeProductEntry`、`getProductEntrySession`、manifest/status/start/preflight projection | session continuity、progress projection、artifact inventory、runtime-loop closure 的 refs-only builder | generated product-entry/session shell、generic session restore cursor、runtime-loop read model | generated/hosted product-entry session 成为 default caller；direct/hosted parity、no-forbidden-write 和 no compatibility alias 通过 |
| Standard domain-agent skeleton descriptors | OPL pack/skeleton conformance、product-entry manifest | semantic pack refs、artifact locator contract、domain memory locator、controlled attempt / receipt refs、typed blocker refs | OPL scaffold/generator owner、generated skeleton manifest shell、artifact locator generated primitive、Temporal soak workbench projection | OPL source owns skeleton mapping and default caller；RCA owner receipt / typed blocker roundtrip preserved；no production-ready claim from descriptor ready |
| Domain memory descriptors | skeleton / memory descriptor projection | visual pattern memory descriptor locator、writeback proposal contract、accept/reject command contract、operator receipt projection | memory locator/index/read-model shell、operator receipt display | OPL may host/index/display refs only；RCA keeps memory body and accept/reject authority |
| MCP / CLI protocol adapters | MCP route、CLI/product-entry commands | protocol adapter and domain action target | generated MCP/CLI shell | OPL generated MCP/CLI default caller and direct protocol no-regression proof |
| RuntimeWatch / workspace/run envelope helpers | direct review watch、OPL operator projection target、workspace/run envelope tests | refs-only run/progress/review read model and locator envelope | generic workspace/run locator shell、operator workbench read model | OPL locator/workbench parity; no attempt ledger/session owner fields; `runtime_watch` stays retired from domain_action_adapter default dispatch |
| Deliverable route registry and direct route helpers | runtime family / route tests、direct route tests | visual route truth, family policy, direct route/domain handler target | OPL route display and generic stage attempt shell only | do not migrate route judgment; OPL consumes refs and dispatches back to RCA domain entry |
| Deliverable route runner shell | `runDeliverableRoute`、`invokeDomainEntry(run_deliverable_route)`、CLI/MCP direct route tests | active direct route wrapper；dependency recovery / continuation / escalation proof 已拆为 migration input parts | generic route attempt shell、dependency retry、stage continuation executor、attempt ledger、retry/dead-letter | OPL route attempt shell 成为 default caller；RCA 只暴露 allowed next stage / precondition / repair target refs 和 visual route implementation |
| Executor runtime protocol route-run records | `startHermesRun` / `completeHermesRun` / `failHermesRun` / `loadHermesRun` / event helpers、deliverable route runner、runtime topology tests | executor policy public surface plus refs-only route-run record materialization；record/event persistence and stale audit 已从 executor descriptor 拆出 | OPL generic Agent Executor Adapter、attempt ledger、runtime record/event log、stale attempt audit/read model | OPL attempt ledger/runtime record default caller live；RCA 保留 route executor policy、executor requirement refs、executor receipt refs；no visual verdict / artifact authority migration |
| Python native helpers | native PPT route、screenshot/review route、helper catalog tests | domain-native Office/PPT/screenshot/export helper implementation | generic native-helper execution envelope only | keep implementation in RCA; later call through OPL envelope without moving visual helper authority |

## Path-Level Current Checkpoints

| path | lines | class | current active caller | 当前实际职责 | 必须保留的 RCA authority | 可迁往 OPL 的 generic 子域 | 迁移/退役门槛 | 推荐验证入口 |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/manifest-return.ts` | 178 | `already_thin_adapter` | `getProductEntryManifest`、product status/session projection、product-entry tests | 最终 manifest assembly；不再内嵌 operator evidence production refs、expected receipt handoff 或 efficiency handoff builder | visual route truth refs、artifact locator refs、owner receipt refs、review/export gate refs 的 RCA-owned exposure | generated product-entry/status/session/workbench shell 的 final wrapper assembly | OPL generated manifest shell 成为 default caller；direct/hosted parity、owner receipt roundtrip、no compatibility alias proof 通过 | `tests/product-entry.test.ts`、`tests/rca-efficiency-handoff-projection.test.ts` |
| `packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/operator-evidence-refs.ts` | 600 | `already_thin_adapter` | `operator_evidence_readiness_projection`、product domain_action_adapter mapped surfaces、OPL/App operator drilldown | body-free production evidence refs、expected receipt / monitor freshness handoff、efficiency handoff refs、OPL owner-payload group return shape / payload path | owner receipt ref shape、typed blocker refs、visual memory content ref boundary、review/export verdict non-disclosure | OPL expected receipt ledger、monitor freshness read model、Agent Lab efficiency suite input shell、owner-payload group accounting | OPL App/workbench/Agent Lab 持续消费 refs；不得投射 visual truth、artifact blob、memory body 或 verdict body；owner-payload shape 不声明 visual/domain/production ready | `tests/product-entry-cases/evidence-scaleout-surfaces.test.ts`、`tests/rca-efficiency-handoff-projection.test.ts` |
| `packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/operator-evidence-readiness.ts` | 203 | `already_thin_adapter` | `buildReturnedManifestProjection`、product-entry manifest/status | refs-only operator readiness projection，聚合 evidence refs 与 remaining evidence gates | evidence blocker classification、RCA-owned production acceptance refs、no visual/export/domain ready claim | OPL App/workbench gap projection shell、observability/read-model display | OPL App/workbench live route parity；RCA projection 只输出 owner receipt、typed blocker、artifact/memory evidence refs | `tests/product-entry.test.ts`、`tests/product-entry-cases/domain_action_adapter-receipt-and-workspace-proof.test.ts` |
| `packages/redcube-domain-entry/src/actions/get-product-entry-session.ts` + `get-product-entry-session-parts/{session-artifacts,session-surfaces}.ts` | 193 + 217 | `already_thin_adapter` with `opl_framework_migration_candidate` retirement gate | `getProductEntrySession`、OPL generated session shell continuation target、native PPT product-entry proof、CLI/MCP product session action | entry-session domain snapshot refs adapter；artifact inventory publication fallback、native proof inventory、PPT route session payload、recommended action 与 summary 已拆为 refs-only session parts | entry session domain refs、topic/deliverable/run locator refs、review/export gate refs exposure、visual route refs；不写 visual truth、artifact blob、memory body 或 verdict body | generated product-entry/session shell、generic session restore cursor、operator navigation/workbench shell、artifact pickup read model display | OPL generated/hosted session shell 成为 default caller；RCA direct/hosted parity、domain authority refs preserved、no-forbidden-write、no compatibility alias 和 no visual verdict migration proof pass | `tests/product-entry-cases/direct-and-oplHosted-entry.test.ts`、`tests/product-domain-action-api-cases/product-and-operator-surfaces.test.ts`、`tests/opl-family-contract-adoption.test.ts` |
| `packages/redcube-domain-entry/src/actions/run-deliverable-route.ts` + `run-deliverable-route-parts/{recovery,fix-html-escalation,domain-entry-response,stage-artifacts,shared}.ts` | 41 + 762 | `needs_split_before_migration` -> source split landed, still `opl_framework_migration_candidate` | `runDeliverableRoute`、`invokeDomainEntry(run_deliverable_route)`、CLI/MCP route commands、PPT/XHS/poster route tests | thin entry plus RCA-local route dependency recovery、stop-after continuation、`fix_html` escalation proof、stage artifact contract access、domain-entry response assembly | visual route preconditions、hydrated stage sequence semantics、`visual_director_review` / `screenshot_review` / export verdict、artifact authority | OPL generic route attempt shell、dependency retry/dead-letter、stage continuation executor、attempt ledger/read model | OPL route attempt shell active/default caller；RCA exposes precondition / allowed-next-stage / repair-target evaluator and domain route handlers; direct route parity and no visual verdict migration proof pass | `tests/runtime-deliverable-route-recovery.test.ts`、`tests/product-entry-cases/runtime-and-domain_action_adapter-surfaces.test.ts`、`tests/opl-agent-pack-contracts.test.ts` |
| `packages/redcube-runtime-protocol/src/executor-runtime.ts` + `executor-runtime-parts/route-run-records.ts` | 453 + 376 | `opl_framework_migration_candidate` split into thin protocol surface plus migration-input part | deliverable route runner、runtime topology regression、package exports、runtime route tests | `executor-runtime.ts` 保留 executor topology/policy descriptor 与 public route-run exports；`route-run-records.ts` 承接 route-run JSON record、event JSONL、rerun linkage、telemetry 和 stale-running-run audit | default Codex executor policy、route executor requirements、executor receipt refs；不能写 visual review/export verdict、artifact body、memory body 或 owner receipt | OPL generic Agent Executor Adapter、attempt ledger、runtime record/event log、stale attempt audit/read model | OPL attempt ledger/runtime record default caller proven；RCA route policy refs preserved；no-regression proof and no compatibility alias scan pass | `tests/runtime-topology-regression.test.ts`、`tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts`、`tests/package-surfaces.ts`、`tests/rca-executor-backend-contract.test.ts` |

## Bad-smell flags

- DomainActionAdapter/action aggregation must stay thin: domain_action_adapter files may expose action metadata, dispatch envelopes and refs-only projections, but must not become RCA-owned generic domain_action_adapter/workbench runtime.
- Session/workbench wrapper risk: product-entry continuity and session snapshot refs must remain refs-only.
- Retired private lifecycle adapter risk: do not restore RCA-local lifecycle adapter bodies as compatibility wrappers after OPL shared primitives are pinned.
- Projection/workbench authority risk: operator evidence, stability and efficiency projections must not generate visual ready/exportable/handoffable verdict.
- Compatibility alias risk: `managed`, `gateway`, `runtime`, `session` and `domain_action_adapter` terms are allowed only when `contracts/physical_source_morphology_policy.json` records a `legacy_name_allowance` as machine contract ref, package/protocol boundary, service-safe domain entry, semantic id, provenance/tombstone, negative guard, refs-only read model, domain handler target, visual authority/native helper path or locator protocol boundary, with compatibility alias, callable alias, public identity and generic owner flags all false.
- Descriptor/generated surface ready must not be written as production visual-stage long soak, artifact-producing owner receipt, visual ready, exportable or handoffable.
- Tests must not treat file existence, suite pass, transition fixture, OPL provider completion or OPL refs-only ledger receipt as RCA visual quality verdict.

## Immediate Thinning Items

1. Move product domain_action_adapter export projection and guarded action registration into OPL generated/hosted domain_action_adapter shell once default caller parity is live; keep RCA guarded authority handlers as domain targets.
2. Continue moving product-entry shell catalog and manifest wrapper generation into OPL generated product-entry/skill/operator shell once generated manifest shell is the active/default caller; current RCA source already splits operator evidence refs-only accounting away from final manifest assembly.
3. Move route dependency recovery, route continuation and attempt proof transport into OPL generic route attempt shell; keep RCA visual route evaluator and family route implementations as domain handlers.
4. Move route-run record persistence, event append/read and stale-running-run audit from RCA protocol adapter into OPL attempt ledger/runtime record primitive after OPL default caller parity is proven; keep RCA route executor policy and receipt refs.
5. Continue thinning product-entry continuity/session refs only after generated/hosted product-entry session becomes the default caller; do not restore retired private lifecycle adapter bodies.
6. Keep standard-domain-agent runtime descriptors as migration input until OPL owns skeleton mapping and owner receipt / typed blocker roundtrip is proven.
7. Continue reducing `session` / `managed` / `gateway` / `runtime` / `domain_action_adapter` naming through tombstone/semantic-id migration without compatibility alias; any active-source retention must remain covered by `legacy_name_allowance`.
8. Keep Python native helpers as RCA domain implementation; only the invocation envelope can migrate to OPL.

## OPL Primitive Dependencies

- generated product/MCP/session/domain_action_adapter shell default caller;
- generated product-entry/session caller parity;
- generic Agent Executor Adapter default caller with attempt ledger/runtime record and event-log primitive;
- generic native-helper execution envelope;
- artifact gallery/handoff shell and review/repair transport;
- workspace/source/run locator and session shell;
- operator/App workbench projection that consumes RCA refs only;
- Temporal controlled visual-stage long-soak evidence from real hosted attempts.

## Forbidden Claims

- RCA structural conformance does not prove visual ready/exportable/handoffable.
- OPL ledger/stage evidence/transition fixture does not prove artifact-producing owner receipt.
- Native helper mechanical checks cannot replace AI-authored review/export verdict.
- Active repo-local session/domain_action_adapter caller means OPL has not fully taken over that shell.
- Active repo-local route runner caller means OPL has not fully taken over route attempt orchestration, even after RCA source split.
