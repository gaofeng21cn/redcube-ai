# Hermes 历史迁移索引

Owner: `RedCube AI`
Purpose: `historical_hermes_provenance_index`
State: `history`
Machine boundary: 人读历史索引。当前机器真相继续归 `contracts/runtime-program/current-program.json`、runtime-program leaf parts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts、核心五件套和 runtime owner docs。

本目录保存 RCA repo-local Hermes migration line、upstream `Hermes-Agent` proof lane、service-safe domain entry proof 和相关 blocker / closeout 的历史 provenance。它解释过去为什么推进、如何验证和在哪里停车；它不改变当前 public capability contract，不恢复 Hermes-first runtime ownership，也不证明 upstream `Hermes-Agent` 持有 RCA 当前 runtime truth。

当前 RCA 默认读法是：

- `RedCube AI` 的第一身份是 visual-deliverable domain agent。
- Direct route 和 OPL-hosted route 都必须回到 RCA-owned service-safe domain entry、visual truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。
- OPL / Temporal provider 持有 provider-backed scheduling、wakeup、retry/dead-letter、query projection、generated/default caller 和 workbench shell；RCA 不把这些通用 runtime shell 写成长期私有 owner。
- `Codex CLI` 是当前第一公民 concrete executor；`Hermes-Agent` 只作为显式 optional / proof backend、executor adapter 评估、diagnostic 或历史参考读取。

当前 truth owner：

- `../../project.md`
- `../../status.md`
- `../../architecture.md`
- `../../active/rca-ideal-state-gap-plan.md`
- `../../../contracts/runtime-program/current-program.json`

## 历史 brief 读法

| 文档 | 历史角色 | 当前读法 |
| --- | --- | --- |
| `hermes_managed_family_closure_truth.md` | repo-local managed family closure proof | 只保留当时 managed closure 的 verification provenance；不恢复 repo-local managed control plane、generic session/runtime owner 或 Hermes-first owner。 |
| `hermes_runtime_capability_extraction_map.md` | repo-local Hermes capability extraction map | 只解释当时哪些 runtime 能力曾被计划抽成 substrate；当前 provider/runtime owner 边界回到 OPL runtime docs 与 runtime-program contracts。 |
| `hermes_runtime_substrate_activation_package.md` | repo-local Hermes activation package | 只保留 absorbed activation package；不表示当前已接入 upstream `Hermes-Agent` 或 Hermes 是默认 substrate。 |
| `hermes_runtime_substrate_canonical_closure.md` | repo-local Hermes-backed canonical closure proof | 只保存当时 Hermes-backed route/runtime topology closure；当前 default executor 和 provider boundary 以 status、architecture 和 runtime-program 为准。 |
| `hermes_stable_family_closure_truth.md` | stable family migration closure proof | 只记录 stable family runtime output closure；不声明 new family onboarding、managed web runtime 完成或 production readiness。 |
| `upstream_hermes_agent_activation_package.md` | upstream API connection proof package | 只证明历史 F1 upstream API / run-event surface 曾可验证；当前不是默认 runtime owner 或 production substrate 证明。 |
| `upstream_hermes_agent_fast_cutover_board.md` | historical upstream cutover board | 只保存 2026-04-12 fast cutover 顺序和约束；当前不作为活跃 backlog 或 Hermes-first target plan 执行。 |
| `upstream_hermes_agent_final_target_shape.md` | historical target-shape brief | 只保留旧 target-shape provenance；当前目标已更新为 OPL stage-led runtime / Temporal production substrate / RCA domain authority split。 |
| `upstream_hermes_agent_live_verification_blocker.md` | historical live verification blocker | 只证明 blocker 曾真实发生；当前 stop boundary 以 closeout brief、status 和 active gap plan 读取。 |
| `upstream_hermes_agent_live_verification_closeout.md` | historical live verification closeout | 只证明历史 Hermes-hosted proof lane 的 live run surface closeout；不升级 mature product entry、OPL hosted end-user shell 或 production readiness。 |
| `upstream_hermes_agent_service_safe_domain_entry.md` | historical service-safe domain entry proof | 只记录 service-safe adapter proof 语境；当前 direct public identity 与 OPL-hosted integration 边界回到 current docs/contracts。 |

## No-Resurrection Boundary

本目录中的旧词只能按历史语境读取：

- `Hermes-backed`、`upstream Hermes`、`managed runtime`、`runManagedDeliverable`、`getManagedRun`、`superviseManagedRun` 表示历史 proof lane 或 retired migration surface。
- `current`、`next`、`activation`、`cutover`、`target` 等词若出现在历史正文中，只表示原始 tranche 当时语境。
- 任何把这些历史 proof lane 写回 active public entry、default runtime owner、generated/default caller、generic session/workbench/runtime shell、production readiness、visual ready、exportable、handoffable、domain ready 或 production ready 的改动，都是 stale pollution。

若历史 brief 中仍有 current rule，需要先抽取到核心五件套、`docs/active/rca-ideal-state-gap-plan.md`、runtime/delivery/source/policy owner docs、machine-readable contracts 或 source/test surface；不要在本目录继续追加活跃计划。
