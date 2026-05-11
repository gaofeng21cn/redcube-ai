# Docs Portfolio Consolidation

日期锚点：`2026-05-11`

## 本轮边界

本轮只整理叙述性 `docs/**` 与文档索引，不改源码、测试或 `contracts/runtime-program/*.json`。

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

## 本轮归档原则

- `docs/program/hermes/**` 属于 repo-local Hermes migration provenance，已迁入 `docs/history/hermes/`。
- `docs/superpowers/**` 仍按本仓约定保持未跟踪；本轮不把本地 AI / Superpowers 过程草稿导入 repo-tracked history。
- `docs/program/phase-2/**`、`docs/program/opl_gateway_federated_product_entry.md` 与 `docs/program/upstream_hermes_agent_*.md` 仍存在 runtime-program 合同引用，因此本轮只用 `docs/program/README.md` 与文件头 lifecycle note 标明 absorbed / internal integration / provenance 性质，不做物理迁移。
- `docs/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md` 是已自标历史状态且无 runtime-program 合同引用的计划工件，归入 `docs/history/plans/`。
- `docs/deliverable_examples.md` 已按 delivery lifecycle 迁入 `docs/delivery/deliverable_examples.md`。
- `docs/runtime_architecture.md` 已按 runtime lifecycle 迁入 `docs/runtime/runtime_architecture.md`。
- `docs/source_augmentation_executor_contract.md` 已按 source lifecycle 迁入 `docs/source/source_augmentation_executor_contract.md`。
- `docs/human_quickstart.md`、`docs/private-profile-setup.md` 与 `docs/public-github-publish.md` 已按 product lifecycle 迁入 `docs/product/`。
- `docs/image-first-ppt-production-route.md`、`docs/native-ppt-proof-environment.md` 与 `docs/stable_deliverable_manual_test_brief.md` 已按 delivery lifecycle 迁入 `docs/delivery/`。
- `docs/deep_research_auto_first_product_contract.md` 已按 source lifecycle 迁入 `docs/source/`。
- `docs/domain-harness-os-positioning.md` 已降为 positioning reference，迁入 `docs/references/positioning/`。

## 2026-05-11 RCA / OPL 口径收敛规则

- `README*` 与 `docs/README*` 先写 RCA 的视觉交付领域智能体身份；OPL 只作为 Codex-first、stage-led 的完整智能体运行框架和可外部依赖的托管路径出现。
- Codex CLI 是默认 concrete executor，也是未显式选择 hosted/proof backend 时的最小执行单元。
- `gateway`、`frontdoor`、`federation`、`harness-first`、`OPL bridge`、Hermes-first 旧口径不进入公开第一身份。需要保留时，必须落在 internal integration、provenance、compatibility key 或 tombstone 语境。
- 合同引用优先于物理归档：仍被 `contracts/runtime-program/*.json` 通过 `human_doc:*` 指向的 program brief 不移动；若内容已过时，在文件头写清 lifecycle state、current truth owner 和 reader warning。
- 无合同引用、且只保留历史价值的旧计划进入 `docs/history/`；仍解释当前运行但不拥有 baton 的材料进入 `docs/references/`。

## 机器面边界

- `README*` 与 `docs/**` 是人类可读说明和导航层。
- runtime-program contracts、CLI/MCP surfaces、tests 与 dashboards 可以使用 `human_doc:*` 语义 ID 指向读者上下文。
- 机器面不得把 `README*` 或具体 `docs/**/*.md` prose path 当成稳定 API；可执行真相应引用 contract/schema/source/artifact 路径。
- 文档迁移时，优先维护人读链接与目录 README；机器合同只在语义 ID 变化时修改。

## 验证口径

叙述性文档不作为测试断言对象。本轮默认验证为：

- `git diff --check`
- Markdown 链接目标的轻量静态检查
