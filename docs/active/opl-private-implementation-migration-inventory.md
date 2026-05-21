# RCA 私有实现与 OPL 迁移台账

Owner: `RedCube AI`
Purpose: `opl_private_implementation_migration_inventory`
State: `active_inventory`
Machine boundary: 本文是 human-readable 迁移治理台账。机器真相继续归 contracts、runtime-program leaf contracts、CLI/MCP/API 行为、product-entry manifest、product sidecar projection、workspace/runtime receipt、artifact locator、review/export gate 和 RCA owner receipt。
Date: `2026-05-21`

## 当前 clean truth

RCA 是 OPL-compatible visual-deliverable domain agent。旧 repo-local managed runtime / DAG runner / run store 已物理退役；当前 RCA 只应保留 declarative visual pack、service-safe domain entry、domain handler target、refs-only adapter、minimal visual authority function 和 native helper implementation。

OPL Framework 持有 generated/hosted wrappers、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell、generic native-helper envelope 与 observability/SLO/read model。RCA 持有 visual truth、source readiness、communication/visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt、typed blocker 和 native helper implementation。

本轮 scan 没有发现 active old managed runtime 复活；风险集中在大型 product sidecar / manifest / session / gateway / native-helper envelope 文件仍容易被读成 RCA 私有平台。当前它们必须按 refs-only adapter、domain handler target、native helper implementation 或 migration input 读取。

## Classification

| class | 含义 |
| --- | --- |
| `domain_authority_retained` | visual judgment、artifact authority、memory accept/reject、owner receipt、native helper implementation。 |
| `opl_framework_migration_candidate` | 当前 repo-local wrapper / projection shell 长期应由 OPL generated/hosted primitive 承担。 |
| `already_thin_adapter` | 已收薄为 refs-only adapter/projection/provenance，仍因 direct route 或 tests 暂留。 |
| `needs_split_before_migration` | 同一文件混合 visual authority 与 generic sidecar/session/workbench/projection shell。 |

## Inventory

| surface | lines | class | current active caller | 当前实际职责 | 为什么属于该分类 | RCA 必须保留的 authority | 可迁往 OPL 的 generic 子域 | 迁移/退役门槛 | 推荐验证入口 |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `packages/redcube-gateway/src/actions/product-sidecar-guarded-actions.ts` | 671 | `already_thin_adapter` | product sidecar guarded action tests、manifest/sidecar dispatch | guarded authority action metadata 与 privatized functional module audit projection；不再包含 `runtime_watch` default dispatch | 2026-05-21 已把 OPL generated wrapper / generic primitive / stability read-model / substrate export projection 拆到 `product-sidecar-parts/opl-generic-boundaries.ts`；本文件不再承载通用平台 projection body | artifact mutation authorization、visual memory accept/reject、owner receipt signer、typed blocker、visual transition decision refs | generated sidecar dispatch shell、generic lifecycle/memory transport、operator evidence shell 与 runtime watch status/workbench/read-model 归 OPL；RCA 只消费 refs/projection | OPL wrapper parity；owner receipt roundtrip；no compat alias；后续再把 authority action handlers 与 dispatch envelope 拆开 | `tests/product-entry-cases/runtime-and-sidecar-surfaces.test.ts`、`tests/product-domain-action-api-cases/definitions-and-delegation.test.ts` |
| `packages/redcube-gateway/src/actions/product-sidecar-parts/opl-generic-boundaries.ts` | 473 | `opl_framework_migration_candidate` | manifest/sidecar/audit projection builders | OPL generated interface consumption、generic primitive consumption、stability read-model consumption 和 substrate adapter export 的 refs-only projection | 这是从 guarded actions 中拆出的平台边界模块；当前仍在 RCA repo 内作为 migration input / consumer projection，不能写成 RCA 已拥有或 OPL 已完全默认接管 | RCA retained authority list only；不含 visual truth body、artifact body、review/export verdict body 或 memory body | generated CLI/MCP/product-entry/sidecar/status/session/workbench wrapper、generic scheduler/runtime/workbench、observability/stability read model、substrate adapter shell | OPL generated/hosted shell 成为默认 caller；RCA manifest/sidecar 只保留 domain handler refs；production long-soak evidence 关闭 | `tests/opl-family-contract-adoption.test.ts`、`tests/product-entry-cases/runtime-and-sidecar-surfaces.test.ts` |
| `packages/redcube-gateway/src/actions/product-sidecar.ts` | 1008 | `opl_framework_migration_candidate` | product sidecar export/dispatch、OPL provider bridge | refs-only sidecar export, dispatch envelope, runtime framework projection | sidecar wrapper/typed queue transport 长期归 OPL；RCA 只保留 domain target/actions | domain action metadata、owner receipt refs、typed blockers | generated sidecar wrapper、typed queue dispatch shell | OPL sidecar default caller；RCA receipt parity；no forbidden writes | product-entry sidecar tests, `npm run test:fast` |
| `packages/redcube-gateway/src/actions/get-product-entry-manifest.ts` | 943 | `opl_framework_migration_candidate` | product-entry manifest/status/session projection | product-entry / stage / action / runtime-program manifest aggregation | manifest/status/workbench shell 应由 OPL generated surface default 化 | visual route truth refs、authority surface refs、artifact locator refs | generated product/status/workbench manifest shell | OPL generated shell production/default caller；direct route parity | `tests/product-entry-cases/manifest-and-start-surfaces.test.ts` |
| `packages/redcube-gateway/src/actions/standard-domain-agent-skeleton.ts` | 940 | `already_thin_adapter` | OPL pack/skeleton conformance tests | standard agent skeleton mapping and descriptor projection | 当前是 contract mapping / conformance support，不是 runtime owner | RCA semantic pack refs | OPL scaffold/generator owner | keep until OPL source fully owns skeleton mapping; no runtime behavior | `tests/opl-agent-pack-contracts.test.ts` |
| `packages/redcube-gateway/src/actions/product-entry-continuity-surfaces.ts` | 696 | `opl_framework_migration_candidate` | product entry/session continuity read surfaces | product-entry continuity refs/provenance | session continuity shell 长期归 OPL; RCA only refs-only snapshot | topic/deliverable/review/artifact refs | generic session shell | OPL generated session shell default; no managed compatibility alias | product-entry session tests |
| `packages/redcube-runtime-protocol/src/executor-runtime.ts` | 722 | `opl_framework_migration_candidate` | executor runtime protocol / route tests | executor adapter/runtime protocol envelope | executor adapter envelope 长期是 OPL generic primitive；RCA 只 supplies service-safe target | selected executor route refs, service-safe domain entry | generic executor adapter envelope | OPL executor adapter parity; no behavior/resume equivalence claim | runtime protocol tests |
| `packages/redcube-runtime/src/deliverable-route-local.ts` | 680 | `already_thin_adapter` | deliverable route / direct route tests | local route helper and direct domain handler support | 已不是 managed runtime; keep as direct route/domain handler target | visual route execution target | generic stage runner/attempt shell | no active generic runner claim; route parity with OPL hosted plan | deliverable route tests |
| `packages/redcube-runtime/src/deliverable-routes.ts` | 652 | `domain_authority_retained` | runtime family / route tests | route registry and visual family policy | visual route truth belongs RCA | deliverable family policy, route truth | OPL route display/attempt shell only | do not migrate route judgment; OPL consumes refs | route/family tests |
| `apps/redcube-mcp/src/server.ts` | <600 current scan threshold | `opl_framework_migration_candidate` | MCP route | protocol adapter / direct product entry adapter | MCP wrapper should be generated/hosted; RCA keeps domain action target | service-safe domain action target | generated MCP shell | OPL generated MCP default; direct protocol no-regression | MCP smoke tests |
| `packages/redcube-runtime/src/product-entry-session-snapshot-ref-adapter.ts` | <600 | `already_thin_adapter` | product-entry session projection | session snapshot refs adapter | refs-only adapter; not generic session owner | topic/deliverable/review/artifact snapshot refs | generic session shell | OPL session shell default; no session-runtime owner fields | session/product-entry tests |
| `packages/redcube-runtime-protocol/src/workspace.ts` / `runs.ts` | <600 each | `already_thin_adapter` | workspace/run envelope tests | workspace/run locator/envelope helpers | helper may look generic but contract boundary marks refs-only | workspace/run refs for visual route | generic workspace/run locator shell | OPL locator parity; no attempt ledger/session owner | workspace/run tests |
| `python/redcube_ai/native_helpers/ppt_deck/native.py` | 804 | `domain_authority_retained` | native PPT route, helper catalog tests | PPTX/native helper implementation | domain-native helper implementation must remain RCA; only envelope may move OPL | native helper implementation, artifact generation support | generic native-helper execution envelope | do not migrate implementation; call through OPL envelope later | native helper tests |
| `python/redcube_ai/native_helpers/ppt_deck/review.py` | 826 | `domain_authority_retained` | screenshot/review route | visual screenshot/layout review helper | mechanical checks produce blockers/rerun targets, not visual verdict | review helper implementation, blocker refs | generic helper envelope only | keep as domain helper; split only for maintainability | review/native tests |
| `python/redcube_ai/native_helpers/ppt_deck/native_layouts.py` | 881 | `domain_authority_retained` | native PPT layouts | domain-native layout implementation | layout implementation is visual domain code, not OPL primitive | native layout generation | none except helper envelope | do not migrate implementation | native PPT tests |

## Bad-smell flags

- Hand-written sidecar/action aggregation: `product-sidecar.ts` 仍是主要风险；`product-sidecar-guarded-actions.ts` 已移出 OPL generic projection body，但仍是 guarded action metadata / audit 聚合面。
- Session/workbench wrapper risk: product-entry continuity/session snapshot refs must remain refs-only.
- Projection/workbench authority risk: operator evidence/stability projections must not generate visual ready/exportable/handoffable verdict.
- Compatibility alias risk: `managed`, `gateway`, `runtime`, `session` terms only allowed as semantic id, provenance, retired guard, domain adapter or refs-only read model.
- Descriptor/generated surface ready must not be written as production visual-stage long soak or artifact-producing owner receipt.
- Tests must not treat file existence, suite pass, transition fixture or OPL provider completion as RCA visual quality verdict.

## Immediate thinning items

1. Continue thinning `product-sidecar.ts` sidecar export/dispatch envelope once OPL generated wrapper is the default caller; keep it as a domain sidecar target until then and do not add generic sidecar actions.
2. Continue reducing `session` / `managed` naming through tombstone/semantic-id migration without compatibility alias.
3. Keep Python native helpers as domain implementation; only the invocation envelope can migrate to OPL.

## OPL primitive dependencies

- generated product/MCP/session/sidecar shell default caller;
- generic native-helper execution envelope;
- artifact gallery/handoff shell and review/repair transport;
- workspace/source/run locator and session shell;
- operator/App workbench projection that consumes RCA refs only;
- Temporal controlled visual-stage long-soak evidence from real hosted attempts.

## Forbidden claims

- RCA structural conformance does not prove visual ready/exportable/handoffable.
- OPL ledger/stage evidence/transition fixture does not prove artifact-producing owner receipt.
- Native helper mechanical checks cannot replace AI-authored review/export verdict.
- Active repo-local session/sidecar caller means OPL has not fully taken over that shell.
