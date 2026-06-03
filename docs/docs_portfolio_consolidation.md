# RCA 文档组合治理

Status: `active_docs_governance`
Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口。RCA 机器真相继续归 `contracts/runtime-program/current-program.json`、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

## 当前结论

`docs/**` 是 RCA 的中文内部开发与维护参考，不再维护 docs 层双语镜像。稳定路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。历史文件可以保留旧双语或旧路径描述作为 provenance，但 active/reference 索引必须指向当前无后缀路径。历史目录 README 也按中文 canonical 维护；不要保留指向自身的旧 English 镜像链接。

RCA 采用 OPL-family canonical docs taxonomy：

`active/public/product/runtime/delivery/source/policies/specs/references/history`

这个目录集合按长期职责保留，不按当前文件数量决定。RCA 当前 `active/product/runtime/delivery/source/policies/references/history` 都已有真实承载；`public/specs` 可以保持薄索引，但必须写清职责和新增正文准入规则。

## 与 OPL 的分层

OPL 系列项目全局主参考是 OPL 仓的 `docs/active/opl-family-development-reference.md`。它持有全局 framework 目标、跨仓差距顺序、shared primitive 上收、App/workbench 目标和同名 docs taxonomy；机器或跨仓定位应使用 semantic id、contract/source ref 或 repo owner 口径，不把本机绝对路径当稳定接口。

RCA 文档只维护 visual-deliverable domain agent 的目标、差距、visual truth、review/export verdict、artifact authority、direct product-entry path、OPL-hosted domain_handler/projection/receipt 边界，以及 RCA-to-OPL 上收候选。MAS、MAG、MDS 或 OPL-owned App/workbench 的并行 backlog 不写入 RCA active docs。

## 目录职责

| 目录 | 长期职责 | 当前 RCA 承载 |
| --- | --- | --- |
| `docs/` root | docs 入口、核心五件套、docs governance | `README.md`、核心五件套、本文件。 |
| `docs/active/` | 当前执行、当前计划、当前差距、active baton、当前完成门槛 | 当前只承接 `rca-ideal-state-gap-plan.md` 这类仍在推进的完成计划。 |
| `docs/public/` | public narrative index | 当前较薄；除非未来有真正公开材料，否则保持薄索引。 |
| `docs/product/` | quickstart、profile、public publish、product/operator handoff | 真实承载。 |
| `docs/runtime/` | runtime topology、executor/backend、service-safe entry、watch/projection | 真实承载但较薄，核心是 runtime architecture。 |
| `docs/delivery/` | deliverable family、route、proof、export、manual validation | 真实承载。 |
| `docs/source/` | source readiness、augmentation、deep research trigger/gate | 真实承载。 |
| `docs/policies/` | AI-first、visual memory、runtime operating model、deliverable contract model 等稳定规则 | 真实承载。 |
| `docs/specs/` | 当前仍有效的技术规格索引 | 当前较薄；不扩成杂物层。 |
| `docs/references/` | target state、OPL handoff、memory locator、product-entry support、治理 checklist、support references | 真实承载；不承担 active owner。 |
| `docs/history/` | Hermes proof/provenance、absorbed tranche、历史定位、历史计划、tombstone | 真实承载。 |

## 非 canonical 目录

旧 `docs/program/` active baton 目录已物理退役。当前计划和差距进入 `docs/active/`；已吸收 product-entry support brief 进入 `docs/references/product-entry/`；已吸收 Phase 2 tranche 进入 `docs/history/phase-2/`；upstream Hermes proof/provenance 进入 `docs/history/hermes/`；历史定位材料进入 `docs/history/positioning/`。`human_doc:program_*` 与 `human_doc:domain_harness_os_positioning` 继续作为语义化读者上下文 ID，不暗示物理目录名。

`capabilities` 不作为 RCA docs active 目录复活。Capability truth 优先归 contracts、runtime manifest、CLI/MCP surface、delivery/source/runtime owner docs 或 domain action catalog。

当前 docs 生命周期复核结论：

- `docs/public/` 和 `docs/specs/` 继续保持薄索引职责，不承接旧 program、capabilities 或 reference 正文。
- [文档索引](./README.md) 现在持有 repo-tracked `README*` 与 `docs/**/*.md` 的路径组级 lifecycle role。该清单只做导航和归位，不替代核心五件套、contracts/source/tests 或 runtime evidence。
- `docs/references/opl-managed-runtime-three-layer-contract.md` 已迁入 `docs/history/runtime/opl-managed-runtime-three-layer-contract.md`，因为它只保留历史 owner-boundary 讨论，不再承担 current support reference。
- `docs/references/product-entry/` 承接已落地的 `redcube_product_entry_mvp`、`product_entry_session_continuity` 与 `opl_framework_hosted_product_entry` support brief；它们解释 contract surface，不承担 active plan。旧 `managed_product_entry_hardening` 只保留在 history tombstone。
- `docs/references/integration/lightweight-product-entry-and-opl-handoff.md`、`docs/references/domain_memory_descriptor_locator.md`、`docs/references/integration/opl-family-contract-adoption.md`、`docs/references/rca_executor_routing_config.md` 仍是 support reference；它们解释 direct / hosted 边界、memory locator、family contract adoption 和 opt-in executor routing，不承担 active plan。
- `docs/references/direct_delivery_longrun_target_state.md`、`docs/references/source_readiness_deep_research_longrun_target_state.md` 与 `docs/source/deep_research_auto_first_product_contract.md` 已归入 `docs/history/plans/`，分别保存 2026-04-09 direct-delivery future freeze、2026-04-09 source-plane future freeze 和 2026-04-08 Deep Research / auto-first 产品语义 provenance。当前 delivery/source truth 回到 owner docs、active gap plan 和 machine-readable contracts。
- `docs/references/positioning/domain-harness-os-positioning.md` 已迁入 `docs/history/positioning/domain-harness-os-positioning.md`；该语义 ID 只作为 historical positioning / internal boundary vocabulary 保留。
- 旧 `docs/references/creative-stage-ai-first-audit-2026-04-13.md` 已迁入 `docs/history/plans/creative-stage-ai-first-audit-2026-04-13.md`；其中 upstream Hermes 创作 owner 表述只按 2026-04-13 历史 audit 读取，当前 executor / owner truth 回到核心五件套、AI-first policy、ideal-state reference 和 active gap plan。
- `docs/history/phase-2/`、`docs/history/hermes/`、`docs/history/plans/` 和 `docs/history/tombstones/` 只保留 provenance / tombstone；其中的旧 Gateway、Hermes-first、frontdoor、federation、source-pack-federation、old workbench 或 Phase 2 词汇不得回流 active/current。
- 没有恢复 `docs/capabilities/`；新增 capability-like 内容应先进入 contracts、manifest、domain action catalog 或对应 owner doc。

## 内容级整合规则

1. 当前 visual truth、route truth、review/export verdict、artifact authority 合入核心五件套、runtime/delivery/source owner docs 或 machine surfaces。
2. 当前 baton 和 active plan 留在 `docs/active/`；已完成且只解释合同面的 support brief 进入 `docs/references/`。
2.1. dated follow-through、tranche closeout、命令证据流水、run/probe id、截图路径和阶段性校准过程进入 `docs/history/process/`、`docs/history/plans/` 或其他 precise history/provenance 层；active/reference 主文档只保留当前定位、边界、差距、证据缺口和下一步顺序。
3. Product/operator/profile/release 支撑进入 `docs/product/`。
4. Runtime topology、service-safe entry、watch/projection 进入 `docs/runtime/`。
5. Deliverable route/proof/export/manual validation 进入 `docs/delivery/`。
6. Source readiness、augmentation、deep research trigger/gate 进入 `docs/source/`。
7. AI-first、visual memory、runtime model、deliverable contract model 等稳定规则进入 `docs/policies/`。
8. 目标态、OPL handoff、governance checklist 和支持性技术参考进入 `docs/references/`，不得写成 current truth。
9. Hermes-first、gateway/harness/bridge/federation 旧叙事进入 `docs/history/` 或 tombstone。

## Direct Retirement

当旧模块、旧接口、旧 CLI alias、旧 wrapper、旧 facade、旧测试入口或旧文档入口已被当前 owner surface 替代时，默认直接退役。迁移 active caller 后删除旧面；需要来龙去脉时只保留 history/tombstone/provenance，不新增 compatibility shim、别名、re-export facade 或 compatibility-only 聚合测试。

## 长清单与历史词治理

RCA 当前只允许一个 active completion plan：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。其他长清单按职责拆分：

- product-entry support brief 只解释已落地 contract surface、direct/hosted 边界或 session-continuity provenance；不得继续追加 active follow-up board。
- source/delivery future target freeze 与 dated product-semantics long list 只保存在 history/provenance；当前 active/reference 层不再保留这类长清单正文。
- Phase 2、Hermes proof、creative-stage audit、gateway/frontdoor/federation/source-pack-federation、old workbench 或 managed runtime 记录只进入 history/provenance/tombstone。
- `managed`、`session`、`gateway`、`domain_action_adapter`、`runtime` 等历史词如果仍出现在 active docs，必须同时说明它是 semantic-id、refs-only adapter、domain handler target、retired guard 或 provenance，不得表达 RCA-owned generic runtime。
- 长表只保留当前 owner、当前状态、证据门和下一步；dated proof、命令输出、旧分支名和 absorbed tranche 进入 `docs/history/**`。
- 若历史文档中的规则仍 current，先抽取到核心五件套、active gap plan、policy/runtime/delivery/source owner、contract 或 source surface；不在历史文件中继续追加新状态。
- Active plan 不保存下一轮 Agent prompt 模板。需要给未来执行者的 scope、验证命令、审计枚举和 closeout evidence 进入 `docs/history/process/**`；长期仍有效的部分折回本文、核心五件套、owner docs 或 machine contracts。

## Coverage Ledger Foldback

Dated coverage entries that previously lived in this active governance document are archived in [RCA docs portfolio coverage ledger archive](./history/process/2026-06-02-rca-docs-portfolio-coverage-ledger-archive.md).

This file now keeps only current lifecycle rules, directory roles, content placement rules, direct-retirement posture, long-list governance, and stale-word no-resurrection policy. Do not append future six-repo snapshots, branch cleanup attempts, command transcripts, proof-by-proof tranches, or absorbed closeout logs here. New dated coverage belongs under `docs/history/process/` or another precise `docs/history/**` owner; durable conclusions must be folded back into the core five docs, active gap plan, owner docs, contracts, source, or tests.

Current active owner remains [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md). Product-entry support is indexed by `docs/product/` and `docs/references/product-entry/`; historical Hermes / Phase 2 / managed runtime records stay under [历史文档](./history/README.md).

Latest full docs lifecycle cleanup closeout: [2026-06-03 RCA docs lifecycle cleanup closeout](./history/process/2026-06-03-rca-docs-lifecycle-cleanup-closeout.md). It records the README/docs inventory, role classification, stale-word scan scope and docs-only verification for this cleanup; the durable lifecycle rules are folded back into this file and [文档索引](./README.md).
