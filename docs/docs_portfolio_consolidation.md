# Docs Portfolio Consolidation

日期锚点：`2026-05-11`

## 本轮边界

本轮只整理叙述性 `docs/**` 与文档索引，不改源码、测试或 `contracts/runtime-program/*.json`。

本轮 RCA runtime/program/history cleanup 的新增约束是：先审计 `contracts/runtime-program/*.json` 的 `human_doc:*` 引用；仍被引用的 program/reference 文档不移动，只补 lifecycle header、README 索引和 tombstone 读法。

本轮审阅按正文内容判断生命周期。已逐篇覆盖：

- `docs/product/`、`docs/runtime/`、`docs/delivery/`、`docs/source/` 的 README 与正文文档。
- `docs/program/` 根层 brief 与 `docs/program/phase-2/` 全部 tranche brief。
- `docs/references/` 根层 reference、`docs/references/positioning/` 与 `docs/history/` 索引、Hermes history、plans、tombstones。
- 根层 `README*`、`docs/README*`、核心五件套和本治理文档。

## 当前分层

- `docs/README*`：公开 / 默认 docs 入口，指向核心五件套与稳定阅读层；它们是人读面索引，不是机器合同入口。
- 核心五件套：`project.md`、`status.md`、`architecture.md`、`invariants.md`、`decisions.md`，继续承担当前真相入口。
- `docs/product/`：面向使用者、operator 与发布协作的 product-facing 指南。
- `docs/runtime/`：运行拓扑、executor / substrate、service-safe entry 与 watch / projection 语义说明。
- `docs/delivery/`：交付物 family、route、proof 环境、示例和手工验证材料。
- `docs/source/`：source readiness、source augmentation、deep research intake 与 source truth 消费说明。
- `docs/policies/`：长期稳定规则。
- `docs/program/`：active baton、absorbed tranche 与 contract-linked program records。仍被 runtime-program 机器合同以 `human_doc:*` 语义 ID 引用的 brief 保持原位，避免只改 Markdown 导致读者索引漂移；旧标题或旧文件名通过 lifecycle note 降级。
- `docs/references/`：解释当前运行、目标状态或维护者实践的支持性技术参考，不承担公开第一身份。
- `docs/history/`：repo-tracked 历史 provenance、tombstone、归档过程记录与不再服务当前 baton 的历史计划；本地 AI / Superpowers 草稿继续保持未跟踪。

## 生命周期目录职责

| 目录 | 生命周期职责 | 当前归属示例 |
| --- | --- | --- |
| `docs/product/` | product entry、quickstart、operator handoff、发布和 profile 设置 | 人类快速上手、profile setup、公开发布说明 |
| `docs/runtime/` | runtime topology、executor backend、service-safe entry、watch / projection | 运行架构说明 |
| `docs/delivery/` | deliverable family、route、proof、export 与人工验证 brief | 典型交付示例、PPT image-first route、native PPT proof |
| `docs/source/` | source readiness、augmentation、research trigger / gate | source augmentation executor contract |
| `docs/policies/` | 跨生命周期稳定规则 | AI-first boundary、runtime operating model、deliverable contract model |
| `docs/program/` | 当前主线 baton、absorbed tranche、follow-on records、仍被合同引用的旧 brief | phase-2 closeouts、product-entry hardening、internal OPL integration brief |
| `docs/references/` | 仍有价值但不承担 active baton 或公开第一身份的技术参考 | OPL handoff、target-state references、治理 checklist |
| `docs/history/` | 已归档 provenance、tombstone 与历史计划 | Hermes migration records、历史 plans、retired route notes |

根层 `docs/*.md` 只保留默认入口、核心五件套和文档组合治理入口；新增稳定材料应先落到上述生命周期目录。

## 内容级整合规则

文档生命周期按内容判断，文件名和所在目录只作为辅助信号。一个文件可以同时包含当前事实、absorbed tranche、support reference 和 historical plan；维护时先把这些内容拆清楚：

1. 当前事实合入核心五件套、runtime-program contract、schema/source 或对应 owner doc。
2. active baton 和仍被 `human_doc:*` 引用的 brief 留在 `docs/program/`，并写清 lifecycle state。
3. 解释当前运行、服务支撑阅读的材料进入 `docs/references/`。
4. 已完成、被替代或只剩 provenance 的计划进入 `docs/history/` 或 tombstone。
5. `docs/README*` 和各子目录 README 第一屏必须让读者看出当前状态、层级、新旧关系和下一跳。

## 当前 owner map

| 内容层 | 当前 owner | 机器边界 | 文档处理 |
| --- | --- | --- | --- |
| 公开身份与读者入口 | `README*`、`docs/README*`、核心五件套 | 无；人读入口 | 只呈现 RCA visual-deliverable domain agent 第一身份，OPL 作为托管路径 |
| Visual truth / route truth / review verdict / artifact authority | RCA runtime-family、review/export gate、canonical artifact surfaces | contracts、schema、runtime artifacts、CLI/MCP/API surface | 合入 `docs/architecture.md`、`docs/status.md`、`docs/runtime/`、`docs/delivery/` |
| Product entry / session continuity | RCA product entry 与 `invokeProductEntry` | `contracts/runtime-program/current-program.json`、product-entry contracts | `docs/program/redcube_product_entry_mvp.md` 与 `managed_product_entry_hardening.md` 保留为 current baton |
| OPL-hosted integration | OPL Runtime Manager / configured family runtime provider；RCA 仍持有下游 visual truth | `human_doc:program_opl_framework_hosted_product_entry`、runtime-program contracts | 保留在 `docs/program/`，标为 internal integration |
| Upstream Hermes proof lane | 显式 hosted/proof backend 与历史 proof 证据 | `human_doc:program_upstream_hermes_agent_*`、proof contracts | contract-linked 原位保留；按 provenance/proof lane 读取 |
| Phase 2 hardening tranche | 已吸收到 RCA current mainline 的分项 hardening evidence | `human_doc:program_phase_2_*` 与 phase-2 runtime-program contracts | 原位保留为 absorbed tranche，不作为新公开方向 |
| Gateway / harness / bridge / federation / Hermes-first 旧叙事 | 无当前公开 owner；只剩内部边界、proof、reference 或 history | 部分仍有 `human_doc:*` link | contract-linked 原位降级；无链接材料进入 `docs/history/` 或 tombstone |

## 关键文档处置表

| 文档 / 分区 | 内容级判断 | 处置 | 保留理由 / 当前 owner |
| --- | --- | --- | --- |
| `docs/product/human_quickstart.md` | current product/operator support | 留在 `docs/product/` | 支撑人类与 Agent 使用 RCA 当前 workspace / source readiness / deliverable 流程 |
| `docs/product/private-profile-setup.md` | current product-local setup support | 留在 `docs/product/` | 支撑 workspace `.redcube/` 与用户级私有层，不定义 runtime truth |
| `docs/product/public-github-publish.md` | support reference for public repo hygiene | 留在 `docs/product/` | 仍服务公开仓库发布协作；不作为运行主线 |
| `docs/runtime/runtime_architecture.md` | current runtime owner explanation | 留在 `docs/runtime/` | 解释 direct route、OPL-hosted route、executor/backend split 与 watch/projection 语义 |
| `docs/delivery/*` | current delivery support / selectable proof lanes | 留在 `docs/delivery/` | 说明 image-first 默认路线、native PPT selectable lane、manual test brief 与示例 |
| `docs/source/source_augmentation_executor_contract.md` | current source executor contract support | 留在 `docs/source/` | 支撑 `source augment` / `source execute-augmentation` 的 source readiness contract |
| `docs/source/deep_research_auto_first_product_contract.md` | absorbed product-semantics support | 留在 `docs/source/`，更新状态说明 | 5 步 auto-first 口径已进入 current source/product docs；机器真相仍在 contracts/artifacts |
| `docs/program/redcube_product_entry_mvp.md` | current baton | 留在 `docs/program/`，补 lifecycle note | `current-program.json` 指向 product-entry brief |
| `docs/program/managed_product_entry_hardening.md` | current baton / session continuity | 留在 `docs/program/`，补 lifecycle note | `current-program.json` 指向 managed product-entry brief |
| `docs/program/opl_framework_hosted_product_entry.md` | contract-linked internal integration | 原位保留 | OPL 托管路径仍需读者上下文；RCA 不让出 visual truth |
| `docs/program/upstream_hermes_agent_*.md` | contract-linked proof / provenance | 原位保留，按 proof/provenance 文档阅读 | current contracts 仍有 `human_doc:*` 指针；当前 owner 是 RCA direct path + OPL provider-backed hosting |
| `docs/program/phase-2/*.md` | absorbed tranche / contract-linked baton history | 原位保留，统一 lifecycle note | 多个 tranche contract 仍指向这些 human docs；其内容已吸收进 current runtime/delivery/source/governance |
| `docs/references/positioning/domain-harness-os-positioning.md` | contract-linked positioning reference | 留在 `docs/references/positioning/` | `human_doc:domain_harness_os_positioning` 仍被合同引用；`gateway/harness` 只按内部边界词读 |
| `docs/references/direct_delivery_longrun_target_state.md` | future-facing target reference | 留在 `docs/references/` | 说明 longrun target，不改写 current truth |
| `docs/references/source_readiness_deep_research_longrun_target_state.md` | future-facing source target reference | 留在 `docs/references/` | 说明 future target，不宣称已 absorbed |
| `docs/references/opl_*` 与 `lightweight_product_entry_and_opl_handoff.md` | supporting integration reference | 留在 `docs/references/` | 解释 OPL family contract / handoff，不承担 active baton |
| `docs/history/hermes/*` | repo-local Hermes migration provenance | 留在 `docs/history/hermes/` | 明确不证明上游 Hermes-Agent 持有当前 runtime |
| `docs/history/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md` | historical plan | 留在 `docs/history/plans/` | 已完成归档，作为 provenance 保存 |
| `docs/history/tombstones/retired-route-narratives-2026-05-11.md` | retired narrative tombstone | 新增 tombstone | 给 gateway-first / bridge-first / Hermes-first 等旧词汇一个可检索但非当前的落点 |

## 本轮归档原则

- `docs/program/hermes/**` 属于 repo-local Hermes migration provenance，已迁入 `docs/history/hermes/`。
- `docs/superpowers/**` 仍按本仓约定保持未跟踪；本轮不把本地 AI / Superpowers 过程草稿导入 repo-tracked history。
- `docs/program/phase-2/**`、`docs/program/opl_framework_hosted_product_entry.md` 与 `docs/program/upstream_hermes_agent_*.md` 仍存在 runtime-program 合同引用，因此本轮只用 `docs/program/README.md` 与文件头 lifecycle note 标明 absorbed / internal integration / provenance 性质，不做物理迁移。
- `docs/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md` 是已自标历史状态且无 runtime-program 合同引用的计划工件，归入 `docs/history/plans/`。
- `docs/deliverable_examples.md` 已按 delivery lifecycle 迁入 `docs/delivery/deliverable_examples.md`。
- `docs/runtime_architecture.md` 已按 runtime lifecycle 迁入 `docs/runtime/runtime_architecture.md`。
- `docs/source_augmentation_executor_contract.md` 已按 source lifecycle 迁入 `docs/source/source_augmentation_executor_contract.md`。
- `docs/human_quickstart.md`、`docs/private-profile-setup.md` 与 `docs/public-github-publish.md` 已按 product lifecycle 迁入 `docs/product/`。
- `docs/image-first-ppt-production-route.md`、`docs/native-ppt-proof-environment.md` 与 `docs/stable_deliverable_manual_test_brief.md` 已按 delivery lifecycle 迁入 `docs/delivery/`。
- `docs/deep_research_auto_first_product_contract.md` 已按 source lifecycle 迁入 `docs/source/`。
- `docs/domain-harness-os-positioning.md` 已降为 positioning reference，迁入 `docs/references/positioning/`。
- 本轮没有继续移动 `docs/program/phase-2/**`、`docs/program/upstream_hermes_agent_*.md`、`docs/program/opl_framework_hosted_product_entry.md` 或 `docs/references/positioning/domain-harness-os-positioning.md`，因为它们仍被 runtime-program 合同或 `human_doc:*` 语义 ID 引用；改为原位 lifecycle 降级与 README/index 解释。
- 本轮新增 tombstone，只承接退役叙事和读法，不替代仍被合同引用的 program/reference 正文。

## 2026-05-11 RCA / OPL 口径收敛规则

- `README*` 与 `docs/README*` 先写 RCA 的视觉交付领域智能体身份；OPL 只作为 Codex-first、stage-led 的完整智能体运行框架和可外部依赖的托管路径出现。
- Codex CLI 是默认 concrete executor，也是未显式选择 hosted/proof backend 时的最小执行单元。
- `gateway`、`frontdoor`、`federation`、`harness-first`、`OPL-hosted handoff`、Hermes-first 旧口径不进入公开第一身份。需要保留时，必须落在 internal integration、provenance、contract reference 或 tombstone 语境。
- 合同引用优先于物理归档：仍被 `contracts/runtime-program/*.json` 通过 `human_doc:*` 指向的 program brief 不移动；若内容已过时，在文件头写清 lifecycle state、current truth owner 和 reader warning。
- 无合同引用、且只保留历史价值的旧计划进入 `docs/history/`；仍解释当前运行但不拥有 baton 的材料进入 `docs/references/`。

## 2026-05-11 RCA runtime/program/history cleanup

本轮 fresh `human_doc:*` 审计结论：

- `current-program.json` 仍引用 product-entry、OPL-hosted integration 与多份 `program_upstream_hermes_agent_*` brief。
- Phase 2 tranche contracts 仍引用多个 `program_phase_2_*` brief、`human_doc:runtime_architecture` 与 `human_doc:domain_harness_os_positioning`。
- Upstream Hermes blocker / closeout contracts 仍引用 `program_upstream_hermes_agent_fast_cutover_board` 与 `program_upstream_hermes_agent_live_verification_closeout`。

本轮处置：

- `docs/runtime/runtime_architecture.md` 瘦身为 current runtime topology / executor-backend / watch-projection / OPL-hosted boundary 说明；Phase 2 closeout、old gateway/harness narrative 与 Hermes proof 细节下沉到 program/reference/history 索引读取。
- `docs/program/phase-2/README.md` 新增为 absorbed tranche 子目录索引；各 tranche brief 原位保留，等待未来合同退链后再迁入 history。
- `docs/program/upstream_hermes_agent_*.md` 因合同链接原位保留，继续按 historical proof / blocker / closeout provenance 读取。
- `docs/references/positioning/domain-harness-os-positioning.md` 因 `human_doc:domain_harness_os_positioning` 原位保留，继续按 internal boundary vocabulary 读取。
- `docs/history/tombstones/retired-route-narratives-2026-05-11.md` 补充 contract-linked exception 清单，防止旧 gateway/harness/Hermes-first 文件名被误读成当前 owner。

本轮未移动 contract-linked program/reference 文件，也未修改 runtime-program contracts；因此无需运行 `npm run test:meta`。

## 机器面边界

- `README*` 与 `docs/**` 是人类可读说明和导航层。
- runtime-program contracts、CLI/MCP surfaces、tests 与 dashboards 可以使用 `human_doc:*` 语义 ID 指向读者上下文。
- 机器面不得把 `README*` 或具体 `docs/**/*.md` prose path 当成稳定 API；可执行真相应引用 contract/schema/source/artifact 路径。
- 文档迁移时，优先维护人读链接与目录 README；机器合同只在语义 ID 变化时修改。

## 验证口径

叙述性文档不作为测试断言对象。本轮默认验证为：

- `git diff --check`
- Markdown 链接目标的轻量静态检查
