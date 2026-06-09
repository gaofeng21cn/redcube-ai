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

本目录按主题组读取，不再维护逐文件 current-read table。子文件只保留历史 proof body、旧假设、verification provenance 或 blocker / closeout 语境；当前规则、默认 executor、provider boundary、runtime substrate、service-safe entry 和 OPL hosted split 回到上方 current truth owner。

| 历史主题 | Provenance refs | 当前读法 |
| --- | --- | --- |
| Repo-local Hermes / managed-family closure | `hermes_managed_family_closure_truth.md`、`hermes_stable_family_closure_truth.md`、`hermes_runtime_substrate_canonical_closure.md` | 只解释历史 repo-local managed family、stable-family output 与 Hermes-backed topology closure 的验证来源；不恢复 repo-local managed control plane、generic session/runtime owner、managed web runtime、Hermes-first owner 或 production readiness。 |
| Repo-local Hermes substrate activation / capability extraction | `hermes_runtime_capability_extraction_map.md`、`hermes_runtime_substrate_activation_package.md` | 只保留当时 runtime 能力抽取与 activation package 的迁移输入；当前 provider/runtime owner 边界以 OPL runtime docs、Temporal-backed provider posture、runtime-program contracts 和 active gap plan 为准。 |
| Upstream Hermes API / proof lane | `upstream_hermes_agent_activation_package.md`、`upstream_hermes_agent_service_safe_domain_entry.md`、`upstream_hermes_agent_live_verification_blocker.md`、`upstream_hermes_agent_live_verification_closeout.md` | 只证明历史 upstream API、run-event、service-safe adapter、blocker 与 live closeout proof lane 曾被验证或阻断；不升级成熟 product entry、OPL hosted end-user shell、default runtime owner、production substrate 或 production readiness。 |
| Upstream Hermes cutover / target-shape planning | `upstream_hermes_agent_fast_cutover_board.md`、`upstream_hermes_agent_final_target_shape.md` | 只保存 2026-04 历史 cutover 假设和 target-shape provenance；当前目标已更新为 OPL stage-led runtime、Temporal production substrate、Codex-first concrete executor、Hermes optional/proof adapter 和 RCA domain authority split。 |

若子文件里出现 `current`、`next`、`activation`、`cutover`、`target`、command list、test count、live proof transcript 或 handoff prompt，只按原 tranche 时点读取；不得作为当前 backlog 或默认路线执行。

## No-Resurrection Boundary

本目录中的旧词只能按历史语境读取：

- `Hermes-backed`、`upstream Hermes`、`managed runtime`、`runManagedDeliverable`、`getManagedRun`、`superviseManagedRun` 表示历史 proof lane 或 retired migration surface。
- `current`、`next`、`activation`、`cutover`、`target` 等词若出现在历史正文中，只表示原始 tranche 当时语境。
- 历史正文中的 verification command、test file、launcher、pass-count 或 live proof transcript 只按原始 closeout / blocker provenance 和提交历史读取；当前可执行验证入口回到 `scripts/verify.sh`、`scripts/run-test-group.ts`、source/tests、contracts、owner receipts 和 typed blockers。
- 任何把这些历史 proof lane 写回 active public entry、default runtime owner、generated/default caller、generic session/workbench/runtime shell、production readiness、visual ready、exportable、handoffable、domain ready 或 production ready 的改动，都是 stale pollution。

若历史 brief 中仍有 current rule，需要先抽取到核心五件套、`docs/active/rca-ideal-state-gap-plan.md`、runtime/delivery/source/policy owner docs、machine-readable contracts 或 source/test surface；不要在本目录继续追加活跃计划。
