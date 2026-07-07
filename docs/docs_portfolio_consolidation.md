# RCA 文档组合治理

Status: `active_docs_governance`
Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口。RCA runtime-program 机器真相继续归 `contracts/runtime-program/current-program-parts/**` 与 `contracts/runtime-program/current-program.index.json`；其他机器真相归 schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。`contracts/runtime-program/current-program.json` 已退役，不再生成、保留或作为 canonical/check/read-through 输入。

## 当前结论

`docs/**` 是 RCA 的中文内部开发与维护参考，不再维护 docs 层双语镜像。稳定路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。历史文件可以保留旧双语或旧路径描述作为 provenance，但 active/reference 索引必须指向当前无后缀路径。历史目录 README 也按中文 canonical 维护；不要保留指向自身的旧 English 镜像链接。

RCA 采用 OPL-family canonical docs taxonomy：

`active/public/product/runtime/delivery/source/policies/specs/references/history`

这个目录集合按长期职责保留，不按当前文件数量决定。RCA 当前 `active/product/runtime/delivery/source/policies/references/history` 都已有真实承载；`public/specs` 可以保持薄索引，但必须写清职责和新增正文准入规则。OPL family Foundry Agent OS target delta 的机器 owner 是 `contracts/foundry-agent-os-domain-kernel-manifest.json`，人读 support owner 是 `docs/active/foundry-agent-os-target-delta.md`；它只解释 Visual Authority Kernel 与 OPL upcollect surfaces，不替代 active gap plan 或 readiness evidence。

## 与 OPL 的分层

OPL 系列项目全局主参考是 OPL 仓的 `docs/active/opl-family-development-reference.md`。它持有全局 framework 目标、跨仓差距顺序、shared primitive 上收、App/workbench 目标和同名 docs taxonomy；机器或跨仓定位应使用 semantic id、contract/source ref 或 repo owner 口径，不把本机绝对路径当稳定接口。

RCA 文档只维护 visual-deliverable domain agent 的目标、差距、visual truth、review/export verdict、artifact authority、direct product-entry path、OPL-hosted domain_handler/projection/receipt 边界，以及 RCA-to-OPL 上收候选。MAS、MAG、MDS 或 OPL-owned App/workbench 的并行 backlog 不写入 RCA active docs。

## 目录职责

| 目录 | 长期职责 | 当前 RCA 承载 |
| --- | --- | --- |
| `docs/` root | docs 入口、核心五件套、docs governance | `README.md`、核心五件套、本文件。 |
| `docs/active/` | 当前执行、当前计划、当前差距、active baton、当前完成门槛、target-delta support | `rca-ideal-state-gap-plan.md` 是唯一 active gap plan；`foundry-agent-os-target-delta.md` 是 `contracts/foundry-agent-os-domain-kernel-manifest.json` 的人读 support，不替代 active plan。 |
| `docs/public/` | public narrative index | 当前较薄；除非未来有真正公开材料，否则保持薄索引。 |
| `docs/product/` | quickstart、profile、public publish、product/operator handoff | 真实承载。 |
| `docs/runtime/` | runtime topology、executor/backend、service-safe entry、watch/projection | 真实承载但较薄，核心是 runtime architecture。 |
| `docs/delivery/` | deliverable family、route、proof、export、manual validation | 真实承载；不保存 route evolution probe 过程流水。 |
| `docs/source/` | source readiness、augmentation、deep research trigger/gate | 真实承载。 |
| `docs/policies/` | AI-first、visual memory、runtime operating model、deliverable contract model 等稳定规则 | 真实承载。 |
| `docs/specs/` | 当前仍有效的技术规格索引 | 当前较薄；不扩成杂物层。 |
| `docs/references/` | target state、OPL handoff、memory locator、product-entry support、治理 checklist、support references | 真实承载；不承担 active owner。 |
| `docs/history/` | Hermes proof/provenance、absorbed tranche、历史定位、历史计划、tombstone | 真实承载。 |

## 非 canonical 目录

旧 `docs/program/` active baton 目录已物理退役。当前计划和差距进入 `docs/active/`；已吸收 product-entry support brief 进入 `docs/references/product-entry/`；已吸收 Phase 2 tranche 进入 `docs/history/phase-2/`；upstream Hermes proof/provenance 进入 `docs/history/hermes/`；历史定位材料进入 `docs/history/positioning/`。`human_doc:program_*` 与 `human_doc:domain_harness_os_positioning` 继续作为语义化读者上下文 ID，不暗示物理目录名。

`capabilities` 不作为 RCA docs active 目录复活。Capability truth 优先归 contracts、runtime manifest、CLI/MCP surface、delivery/source/runtime owner docs 或 domain action catalog。

当前 docs 生命周期复核只保留当前归位，不在本文保存逐项迁移清单。详细迁移 provenance、退役路径和历史 closeout 读 [RCA process history](./history/process/README.md) 与 [RCA retired surface provenance](./history/process/retired-surface-provenance.md)。

| Semantic theme | Current owner / disposition |
| --- | --- |
| Public/spec thin indexes | `docs/public/` 和 `docs/specs/` 只保持薄索引职责，不承接旧 program、capabilities 或 reference 正文。 |
| Human-doc inventory | [文档索引](./README.md) 持有 repo-tracked `README*` 与 `docs/**/*.md` 的路径组级 lifecycle role；它只导航，不替代核心五件套、contracts/source/tests 或 runtime evidence。 |
| Product-entry / OPL handoff support | `docs/references/product-entry/` 三个 contract-linked brief、`docs/references/integration/opl-family-contract-adoption.md`、memory locator 与 opt-in executor routing refs 是 support SSOT；重复 handoff overview、managed product-entry hardening 和 path compatibility 只保留在 history/tombstone。 |
| Runtime / delivery / source historical freezes | 旧 OPL managed runtime 三层讨论、route evolution probe、direct-delivery/source future freeze、Deep Research auto-first product semantics 和 creative-stage audit 只作为 history/provenance 读取；当前 truth 回到 owner docs、active gap plan、machine-readable contracts、source 和 tests。 |
| Old route vocabulary | `docs/history/phase-2/`、`docs/history/hermes/`、`docs/history/plans/`、`docs/history/positioning/` 和 `docs/history/tombstones/` 只保留 provenance/tombstone；Gateway、Hermes-first、frontdoor、federation、source-pack-federation、old workbench 或 Phase 2 词汇不得回流 active/current。 |
| Capability-like material | 不恢复 `docs/capabilities/`；新增 capability-like 内容先进入 contracts、manifest、domain action catalog 或对应 owner doc。 |
| Foundry Agent OS target delta | `contracts/foundry-agent-os-domain-kernel-manifest.json` 是机器 SSOT；`docs/active/foundry-agent-os-target-delta.md` 只解释 retained Visual Authority Kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根和 false-authority flags。 |

## 内容级整合规则

1. 当前 visual truth、route truth、review/export verdict、artifact authority 合入核心五件套、runtime/delivery/source owner docs 或 machine surfaces。
2. 当前 baton 和 active plan 留在 `docs/active/`；已完成且只解释合同面的 support brief 进入 `docs/references/`。
2.1. dated follow-through、tranche closeout、命令证据流水、run/probe id、截图路径和阶段性校准过程进入 `docs/history/process/`、`docs/history/plans/` 或其他 precise history/provenance 层；active/reference 主文档只保留当前定位、边界、差距、证据缺口和下一步顺序。
3. Foundry Agent OS target delta 的机器合同入口是 `contracts/foundry-agent-os-domain-kernel-manifest.json`；`docs/active/foundry-agent-os-target-delta.md` 只解释 retained Visual Authority Kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根和 false-authority flags。
4. Product/operator/profile/release 支撑进入 `docs/product/`。
5. Runtime topology、service-safe entry、watch/projection 进入 `docs/runtime/`。
6. Deliverable route/proof/export/manual validation 进入 `docs/delivery/`。
7. Source readiness、augmentation、deep research trigger/gate 进入 `docs/source/`。
8. AI-first、visual memory、runtime model、deliverable contract model 等稳定规则进入 `docs/policies/`。
9. 目标态、OPL handoff、governance checklist 和支持性技术参考进入 `docs/references/`，不得写成 current truth。
10. Hermes-first、gateway/harness/bridge/federation 旧叙事进入 `docs/history/` 或 tombstone。

## Direct Retirement

当旧模块、旧接口、旧 CLI alias、旧 wrapper、旧 facade、旧测试入口或旧文档入口已被当前 owner surface 替代时，默认直接退役。迁移 active caller 后删除旧面；需要来龙去脉时只保留 history/tombstone/provenance，不新增 compatibility shim、别名、re-export facade 或 compatibility-only 聚合测试。

## 长清单与历史词治理

RCA 当前只允许一个 active completion plan：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。其他长清单按职责拆分：

- product-entry support brief 只解释已落地 contract surface、direct/hosted 边界或 session-continuity provenance；不得继续追加 active follow-up board，也不得再新建覆盖 direct / hosted entry 的重复 overview。
- source/delivery future target freeze 与 dated product-semantics long list 只保存在 history/provenance；当前 active/reference 层不再保留这类长清单正文。
- real-route evolution probe、native sample root、效率读数、probe 输出字段和 route/run transcript 只保存在 history/process、runtime/evidence ledger 或提交历史；delivery 当前层只保留当前 route/proof/export 边界。
- Phase 2、Hermes proof、creative-stage audit、gateway/frontdoor/federation/source-pack-federation、old workbench 或 managed runtime 记录只进入 history/provenance/tombstone。
- `managed`、`session`、`gateway`、`domain_action_adapter`、`runtime` 等历史词如果仍出现在 active docs，必须同时说明它是 semantic-id、refs-only adapter、domain handler target、retired guard 或 provenance，不得表达 RCA-owned generic runtime。
- 长表只保留当前 owner、当前状态、证据门和下一步；dated proof、命令输出、旧分支名和 absorbed tranche 进入 `docs/history/**`。
- 若历史文档中的规则仍 current，先抽取到核心五件套、active gap plan、policy/runtime/delivery/source owner、contract 或 source surface；不在历史文件中继续追加新状态。
- Active plan 不保存可直接复制的长 Agent prompt 模板或过程流水；它可以保存结构化下一轮 baton 字段，例如 write scope、non-goals、live truth inputs、required actions、verification commands、completion gate 和 foldback target。dated closeout、proof transcript、审计枚举和一次性 closeout evidence 进入 `docs/history/process/**`；长期仍有效的部分折回本文、核心五件套、owner docs 或 machine contracts。

## Coverage Ledger Foldback

Dated coverage entries, docs lifecycle inventories, SSOT closeouts and retirement proof/read-model foldbacks are compressed under [RCA process history](./history/process/README.md), with durable no-resurrection rules in [RCA retired surface provenance](./history/process/retired-surface-provenance.md).

The process history index is now topic-level only. It records retained records, compressed provenance groups, a coverage summary, remaining reopened scope and next write scope; it must not grow back into seven-repo OPL series snapshots, branch cleanup attempts, command transcripts, proof-by-proof tranches, or absorbed closeout logs. The current RCA human-doc recheck covers every tracked root `README*`, `docs/**/*.md`, and docs-like tracked support `README.md` outside `docs/` through this lifecycle map, directory indexes, and retained provenance owners.

Future foldback uses this routing:

| Future evidence | Owner |
| --- | --- |
| Durable RCA current truth, gap, owner-delta or no-ready boundary | Core five docs, active gap plan, owner docs, contracts, source or tests |
| Foundry Agent OS target-delta owner split or default-read-root rule | `contracts/foundry-agent-os-domain-kernel-manifest.json`, with `docs/active/foundry-agent-os-target-delta.md` as human support |
| Production evidence proof, route probe details, run/probe ids, screenshots, no-regression refs | Runtime/evidence ledger, retained process record, precise history/provenance owner, or git history |
| Docs lifecycle tranche closeout | `docs/history/process/README.md` as a compressed theme row, not a dated proof ledger |
| Retired command/helper/fallback/test/workflow no-resurrection | `retired-surface-provenance.md` plus machine guard/source/test owner |

Current active owner remains [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md). Product-entry support is indexed by `docs/product/` and `docs/references/product-entry/`; historical Hermes / Phase 2 / managed runtime / route probe records stay under [历史文档](./history/README.md).

Latest process-history coverage summary is indexed by [RCA process history](./history/process/README.md). It records the complete human-doc inventory scope, retained dated evidence files, compressed closeout groups, remaining reopened scope and next write scope; the durable lifecycle rules are folded back into this file and [文档索引](./README.md).
