# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：repo-local managed runtime baseline（未接入上游 `Hermes-Agent`）
- 当前本地宿主：`Codex` operator / development host
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；成熟的 lightweight `product entry` 仍未落地
- 当前统一协作模型：目标由 `Hermes-Agent` 承担 runtime substrate / orchestration，`RedCube AI` 继续持有 domain authority 与 visual truth，具体 deliverable execution 保持 executor-adapter 可插拔

## 当前基线（repo-verified）

- 当前 active tranche：truth reset / upstream `Hermes-Agent` pilot prep
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在真实上游 `Hermes-Agent` substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 `Hermes / managed family closure truth`，`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续作为 absorbed provenance 保留。
2. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 repo-local managed closure 已经成立，但这仍是本地实现，不是上游 `Hermes-Agent` 接管。
3. 下一步应按 `docs/program/upstream_hermes_agent_fast_cutover_board.md` 先冻结真实的上游 `Hermes-Agent` pilot 条件；当前冻结件已经落在 `docs/program/upstream_hermes_agent_activation_package.md`，并通过 `node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface` fail-closed 检查 upstream proof。
4. 在那之前，任何 `docs/program/hermes/*` 都只能作为历史 local-runtime migration artifact 读取。
5. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
6. 继续避免 reference-grade 材料和 phase brief 挤占 docs 根目录。
7. 与 runtime substrate 迁移并行，需要冻结 `RedCube Product Entry` 与 `OPL -> RedCube` handoff contract，但在真实入口壳与上游 substrate 证据到位前，不把它写成已落地产品入口。
8. pilot 期间必须把 `runtime substrate / domain authority / executor adapter` 三层边界写清，不允许把“接入 Hermes”偷换成“所有视觉执行都已单脑化”。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- 当前 CI 分层口径：`quality` lane 在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
