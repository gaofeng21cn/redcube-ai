# RCA Docs 生命周期治理审计

Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance_audit`
State: `history_provenance`
Machine boundary: 人读治理审计记录。机器真相继续归 contracts、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、核心五件套、active gap plan 与 docs owner indexes。

日期：`2026-05-20`

## 审计输入

本轮以以下当前参考为主：

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`
- `docs/references/rca-visual-deliverable-agent-ideal-state.md`
- `docs/active/rca-ideal-state-gap-plan.md`
- OPL 全局 `docs/active/opl-family-development-reference.md`
- OPL 全局 `docs/active/current-state-vs-ideal-gap.md`
- RCA machine-readable contracts、CLI/MCP/product-entry manifest、generated surface handoff 与 production acceptance surfaces

## 当前结论

RCA 的 current truth 已收敛为标准 OPL consumer 口径：RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 与 native helper implementation；OPL 持有 generated/hosted wrapper、generic stage runtime、session/workbench shell、artifact/review/source transport、queue、attempt ledger、operator projection 和 App/workbench shell。

`functional_structure_gap_count=0` 只表示 RCA 不再声明 generic shell/runtime owner，且旧 repo-local managed runtime 物理实现已删除。它不表示 production visual-stage long soak、真实 artifact-producing owner receipt scaleout、真实 memory/lifecycle receipt scaleout、cross-family repeated no-regression 或最终 visual ready/exportable/handoffable 已完成。

## 文档处置

| 文档/目录 | 本轮处置 | 当前唯一任务 |
| --- | --- | --- |
| `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` | 保持核心五件套为 current truth / current policy。 | 建立 RCA 当前身份、运行边界、硬约束和仍有效决策。 |
| `docs/active/rca-ideal-state-gap-plan.md` | 保持唯一 active completion plan。 | 维护功能/结构差距、测试/证据差距和后续顺序；不承载过程流水。 |
| `docs/references/rca-visual-deliverable-agent-ideal-state.md` | 保持 north-star reference。 | 只写目标态和长期 owner boundary；当前状态回到核心五件套和 active plan。 |
| `docs/references/product-entry/*` | 保持 contract-linked support。 | 解释 direct entry、OPL-hosted entry 与 session continuity 已落地合同面；不新增 active board。 |
| `docs/references/integration/*`、`domain_memory_descriptor_locator.md`、`rca_executor_routing_config.md` | 保持 support reference。 | 解释 direct/hosted、memory locator、family adoption 和 opt-in executor routing；不定义 runtime owner。 |
| `docs/references/direct_delivery_longrun_target_state.md` | 迁入 `docs/history/plans/2026-04-09-direct-delivery-longrun-target-state.md`。 | 仅保留 dated future target freeze provenance。 |
| `docs/references/source_readiness_deep_research_longrun_target_state.md` | 迁入 `docs/history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md`。 | 仅保留 dated source-plane future target freeze provenance。 |
| `docs/source/deep_research_auto_first_product_contract.md` | 迁入 `docs/history/plans/2026-04-08-deep-research-auto-first-product-contract.md`。 | 仅保留 absorbed 5 步 auto-first 产品语义 provenance。 |
| `docs/source/source_augmentation_executor_contract.md` | 保持当前 source owner doc。 | 解释当前 source augmentation / Deep Research 执行器合同。 |
| `docs/delivery/*` | 保持 current delivery support。 | 解释当前 image-first PPT、native PPT proof 和 examples；历史 validation brief 留在 history。 |
| `docs/runtime/*` 与 `docs/policies/*` | 保持 current runtime / policy support。 | 固定 current runtime owner split、AI-first quality、visual memory 和运行纪律。 |
| `docs/history/**` | 保持 archive / provenance / tombstone。 | 保存旧 Gateway、Hermes-first、frontdoor/federation、Phase 2、dated plan 和 tombstone；不得回流 active truth。 |

## 退役词读法

- `gateway / harness`：仅作为内部边界、包名、历史执行层或 tombstone 词汇，不是公开第一身份。
- `Hermes-Agent / hermes_agent`：仅作为上游外部 runtime 项目、显式 hosted/proof backend、非默认 executor adapter 或历史 proof lane；不是 RCA 默认 runtime owner，也不是 OPL production substrate。
- `managed`：若仍在合同文件名、semantic id 或历史 baton 中出现，只按 session-continuity provenance、semantic id、tombstone 或 refs-only adapter 读取；不得恢复为 repo-local generic runtime owner。
- `frontdoor / federation / source-pack-federation / product frontdesk`：只保留在 history/tombstone/provenance；active docs 不再扩写。
- `compat / compatibility alias / facade / wrapper`：active caller 迁走后直接删除或 tombstone；测试只保 current contract、negative guard 和 provenance。

## 后续维护规则

- 新增长清单先问它是 current truth、active plan、support reference 还是 history/provenance；不能归类时不落入 active/reference。
- Current truth 优先合入核心五件套、owner docs 或 machine-readable contract，不在 historical brief 中继续追加新状态。
- Production evidence tail 只补真实 owner receipt、typed blocker、memory/lifecycle receipt、direct/hosted parity、Temporal controlled visual-stage long soak 或 no-regression evidence；不把 OPL refs-only ledger、provider completion、cleanup receipt 或 conformance pass 写成 visual ready。
- RCA docs 不维护 MAS/MAG/OPL backlog；跨仓全局顺序回到 OPL 主参考。
