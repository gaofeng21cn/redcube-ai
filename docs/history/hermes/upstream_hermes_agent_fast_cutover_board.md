# Upstream Hermes-Agent Fast Cutover Board

Owner: `RedCube AI`
Purpose: `historical_upstream_hermes_cutover_board`
State: `historical_provenance`
Machine boundary: 人读历史 board。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

状态锚点：`2026-04-12`

生命周期说明：本文件是 contract-linked 的历史 cutover board / proof provenance。2026-05-10 之后的当前运行口径以 provider-backed OPL runtime target、Temporal production substrate target、默认 `Codex CLI` 最小执行单元、以及 RCA-owned visual-domain truth 为准；本文不再作为 RedCube 对外第一身份或 Hermes-first 默认 runtime owner 说明。

## 历史 SSOT

本文件只保留 `2026-04-12` upstream Hermes-Agent fast-cutover 主题的历史读法：

- 为什么当时要停止继续深磨 repo-local managed runtime。
- 当时如何区分 upstream runtime proof 与 RCA visual-domain truth。
- 哪些 contract-linked proof / blocker / closeout 仍需要这个人读上下文。

当前执行、差距、owner-delta 和下一轮 baton 不从本文读取。当前 owner 是：

- `docs/active/rca-ideal-state-gap-plan.md`
- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `contracts/runtime-program/current-program.json`
- source/tests、runtime artifacts、owner receipts 和 typed blockers

配套历史冻结件：

- final target brief：`docs/history/hermes/upstream_hermes_agent_final_target_shape.md`
- final target contract：`contracts/runtime-program/upstream-hermes-agent-final-target-shape.json`

## 当时的 cutover 假设

| 历史维度 | 2026-04-12 读法 | 当前读法 |
| --- | --- | --- |
| Runtime substrate | 通过真实 upstream `Hermes-Agent` proof 替代 repo-local managed runtime 主责。 | Production online runtime substrate 回到 OPL / Temporal provider 目标；Hermes-Agent 只作为显式 optional / proof backend 或 executor adapter 评估。 |
| RCA 边界 | RCA 保持 `source truth`、family/profile/pack、audit/review/export/projection 和 visual-domain gates。 | RCA 继续持有 visual truth、route truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。 |
| Product / hosted entry | 形成可被未来 OPL Runtime Manager 调用的 service-safe domain entry。 | Direct route 和 OPL-hosted route 都回到 RCA service-safe domain entry；OPL/generated shells 持有通用 runtime/workbench/session wrapper。 |
| Default executor | 当时关注 upstream Hermes runtime proof。 | `Codex CLI` 是当前第一公民 concrete executor；其他 executor 必须显式 adapter 接入。 |

## 历史阶段摘要

| Phase | 当时目标 | 当前保留价值 |
| --- | --- | --- |
| F1 | 给出真实 upstream Hermes connection / adapter / client / endpoint proof。 | 作为 `upstream_hermes_agent_activation_package.md` 和 live-verification blocker / closeout 的历史入口。 |
| F2 | 把 run creation、watch、resume/interrupt、scheduling/recovery/session linkage 从 repo-local runtime 主责迁出。 | 作为旧 managed runtime owner 退役语境；不授权恢复 Hermes-first runtime owner。 |
| F3 | 收口 service-safe domain entry / adapter，并保持 CLI/MCP 可验证。 | 作为 RCA service-safe domain entry provenance；当前 owner 回到 product-entry manifest、domain handler target、contracts 和 source/tests。 |
| F4 | 对 `ppt_deck`、`xiaohongshu` 和 guarded `poster_onepager` 做端到端 proof。 | 只解释 live verification closeout / blocker 的历史范围；不能升级成当前 visual ready、exportable、handoffable、domain ready 或 production ready。 |

## 历史排除范围

这条历史线当时明确排除 new family onboarding、academic poster 新 contract、Web 前台壳、自然语言聊天壳和通用 agent 平台化。当前仍按 active owner 读取这些主题；本文不能重新开启任何一项 backlog。

## 退役提示词

原 board 曾保存一段可复制的长线 Codex prompt。该 prompt 已退役：它只证明当时存在 fast-cutover 执行意图，不再是当前 Agent prompt、runbook、执行顺序、delete authority 或 readiness proof。

后续 agent 如果需要推进 Hermes / executor / runtime 相关工作，必须重新从当前核心 docs、runtime-program contracts、active gap plan、source/tests、owner receipts 和 typed blockers 建立 live truth；不得从本文继续下一棒。

## No-Resurrection Boundary

- 不把 repo-local `Hermes` 命名包装成已接入 upstream `Hermes-Agent`。
- 不把 upstream Hermes proof lane 写成当前默认 runtime owner、production substrate、generic session/workbench owner 或 OPL provider readiness。
- 不把历史 `runManagedDeliverable / getManagedRun / superviseManagedRun` wording 恢复为 public API、compatibility alias、facade、wrapper 或测试断言。
- 不把历史 proof lane 写成 RCA visual ready、exportable、handoffable、domain ready、human approval、production ready 或 production visual-stage long-soak complete。
- 若要删除或收薄相关活跃源码/测试/入口，必须重新满足 no-active-caller、replacement parity、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof 和 tombstone/provenance pointer。
