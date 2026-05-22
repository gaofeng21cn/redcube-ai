# RCA 私有实现与 OPL 迁移台账

Owner: `RedCube AI`
Purpose: `opl_private_implementation_migration_inventory`
State: `active_inventory`
Machine boundary: 本文是人读迁移治理台账。机器真相继续归 contracts、runtime-program leaf contracts、CLI/MCP/API 行为、product-entry manifest、product sidecar projection、workspace/runtime receipt、artifact locator、review/export gate 和 RCA owner receipt。
Date: `2026-05-22`

## 当前 clean truth

RCA 是 OPL-compatible visual-deliverable domain agent。旧 repo-local managed runtime / DAG runner / run store 已物理退役；当前 RCA 只应保留 declarative visual pack、service-safe domain entry、domain handler target、refs-only adapter、minimal visual authority function 和 native helper implementation。

OPL Framework 持有 generated/hosted wrappers、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell、generic native-helper envelope 与 observability/SLO/read model。RCA 持有 visual truth、source readiness、communication/visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt、typed blocker 和 native helper implementation。

本台账只维护当前 active surface 的分类、保留 authority、可上收 generic 子域和退役门。dated scan、line-count 变化、拆分过程、proof 命令和 closeout receipt 进入 contracts 或 `docs/history/**`，不在本文继续追加流水。

## Classification

| class | 含义 |
| --- | --- |
| `domain_authority_retained` | visual judgment、artifact authority、memory accept/reject、owner receipt、native helper implementation。 |
| `opl_framework_migration_candidate` | 当前 repo-local wrapper / projection shell 长期应由 OPL generated/hosted primitive 承担。 |
| `already_thin_adapter` | 已收薄为 refs-only adapter/projection/provenance，仍因 direct route、domain handler 或测试暂留。 |
| `needs_split_before_migration` | 同一文件混合 visual authority 与 generic sidecar/session/workbench/projection shell。 |

## Active Inventory

| surface group | current active caller | 当前 RCA 角色 | 可迁往 OPL 的 generic 子域 | 迁移/退役门槛 |
| --- | --- | --- | --- | --- |
| Product sidecar API and guarded action catalog | product sidecar export/dispatch、family action catalog、manifest/status exports | domain sidecar target、guarded visual authority action metadata、forbidden-write policy、retired-surface tombstone refs | generated sidecar wrapper、typed queue dispatch shell、command surface registration、MCP/product-entry sidecar scaffolding | OPL generated sidecar/default caller live；RCA owner receipt / typed blocker / no-forbidden-write roundtrip preserved；no compatibility alias scan clean |
| Product sidecar refs-only projections | manifest/sidecar/audit projection builders、OPL provider bridge | OPL generated interface consumption、generic primitive consumption、stability read-model consumption、substrate adapter export 的 refs-only migration input | generated product/status/workbench/sidecar projection、observability/stability read model、substrate adapter shell | OPL generated/hosted shell 成为 default caller；RCA manifest/sidecar 只保留 domain handler refs；production evidence tail 用真实 owner receipt 或 typed blocker 关闭 |
| Product-entry manifest and shell catalog | product-entry manifest/status/session projection | manifest orchestration、visual route truth refs、authority surface refs、artifact locator refs、domain handler refs | generated product-entry/status/session/workbench shell、skill/operator action catalog | OPL generated manifest shell 成为 active/default caller；direct route parity 和 no-compatibility-alias proof 成立；RCA 仅保留 domain refs |
| Product-entry continuity / session snapshot refs | `invokeProductEntry`、`getProductEntrySession`、manifest/status/start/preflight projection | session continuity、progress projection、artifact inventory、runtime-loop closure 的 refs-only builder | generated product-entry/session shell、generic session restore cursor、runtime-loop read model | generated/hosted product-entry session 成为 default caller；direct/hosted parity、no-forbidden-write 和 no compatibility alias 通过 |
| Standard domain-agent skeleton descriptors | OPL pack/skeleton conformance、product-entry manifest | semantic pack refs、artifact locator contract、domain memory locator、controlled attempt / receipt refs、typed blocker refs | OPL scaffold/generator owner、generated skeleton manifest shell、artifact locator generated primitive、Temporal soak workbench projection | OPL source owns skeleton mapping and default caller；RCA owner receipt / typed blocker roundtrip preserved；no production-ready claim from descriptor ready |
| Domain memory descriptors | skeleton / memory descriptor projection | visual pattern memory descriptor locator、writeback proposal contract、accept/reject command contract、operator receipt projection | memory locator/index/read-model shell、operator receipt display | OPL may host/index/display refs only；RCA keeps memory body and accept/reject authority |
| MCP / CLI protocol adapters | MCP route、CLI/product-entry commands | protocol adapter and domain action target | generated MCP/CLI shell | OPL generated MCP/CLI default caller and direct protocol no-regression proof |
| RuntimeWatch / workspace/run envelope helpers | direct review watch、OPL operator projection target、workspace/run envelope tests | refs-only run/progress/review read model and locator envelope | generic workspace/run locator shell、operator workbench read model | OPL locator/workbench parity; no attempt ledger/session owner fields; `runtime_watch` stays retired from sidecar default dispatch |
| Deliverable route registry and direct route helpers | runtime family / route tests、direct route tests | visual route truth, family policy, direct route/domain handler target | OPL route display and generic stage attempt shell only | do not migrate route judgment; OPL consumes refs and dispatches back to RCA domain entry |
| Python native helpers | native PPT route、screenshot/review route、helper catalog tests | domain-native Office/PPT/screenshot/export helper implementation | generic native-helper execution envelope only | keep implementation in RCA; later call through OPL envelope without moving visual helper authority |

## Bad-smell flags

- Sidecar/action aggregation must stay thin: sidecar files may expose action metadata, dispatch envelopes and refs-only projections, but must not become RCA-owned generic sidecar/workbench runtime.
- Session/workbench wrapper risk: product-entry continuity and session snapshot refs must remain refs-only.
- Retired private lifecycle adapter risk: do not restore RCA-local lifecycle adapter bodies as compatibility wrappers after OPL shared primitives are pinned.
- Projection/workbench authority risk: operator evidence, stability and efficiency projections must not generate visual ready/exportable/handoffable verdict.
- Compatibility alias risk: `managed`, `gateway`, `runtime`, `session` terms are allowed only as semantic id, provenance, retired guard, domain adapter, package name or refs-only read model.
- Descriptor/generated surface ready must not be written as production visual-stage long soak, artifact-producing owner receipt, visual ready, exportable or handoffable.
- Tests must not treat file existence, suite pass, transition fixture, OPL provider completion or OPL refs-only ledger receipt as RCA visual quality verdict.

## Immediate Thinning Items

1. Move product sidecar export projection and guarded action registration into OPL generated/hosted sidecar shell once default caller parity is live; keep RCA guarded authority handlers as domain targets.
2. Move product-entry shell catalog and manifest wrapper generation into OPL generated product-entry/skill/operator shell once generated manifest shell is the active/default caller.
3. Continue thinning product-entry continuity/session refs only after generated/hosted product-entry session becomes the default caller; do not restore retired private lifecycle adapter bodies.
4. Keep standard-domain-agent runtime descriptors as migration input until OPL owns skeleton mapping and owner receipt / typed blocker roundtrip is proven.
5. Continue reducing `session` / `managed` / `gateway` naming through tombstone/semantic-id migration without compatibility alias.
6. Keep Python native helpers as RCA domain implementation; only the invocation envelope can migrate to OPL.

## OPL Primitive Dependencies

- generated product/MCP/session/sidecar shell default caller;
- generated product-entry/session caller parity;
- generic native-helper execution envelope;
- artifact gallery/handoff shell and review/repair transport;
- workspace/source/run locator and session shell;
- operator/App workbench projection that consumes RCA refs only;
- Temporal controlled visual-stage long-soak evidence from real hosted attempts.

## Forbidden Claims

- RCA structural conformance does not prove visual ready/exportable/handoffable.
- OPL ledger/stage evidence/transition fixture does not prove artifact-producing owner receipt.
- Native helper mechanical checks cannot replace AI-authored review/export verdict.
- Active repo-local session/sidecar caller means OPL has not fully taken over that shell.
