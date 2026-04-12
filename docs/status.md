# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：上游 `Hermes-Agent` route / managed run surface + RedCube visual-domain truth
- 当前本地宿主：`Codex` operator / development host
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；成熟的 lightweight `product entry` 仍未落地
- 当前统一协作模型：目标由 `Hermes-Agent` 承担 runtime substrate / orchestration，`RedCube AI` 继续持有 domain authority 与 visual truth，具体 deliverable execution 保持 executor-adapter 可插拔

## 当前基线（repo-verified）

- 当前 active tranche：upstream `Hermes-Agent` runtime owner cutover + service-safe domain entry adapter
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料
- 当前 upstream activation proof：`contracts/runtime-program/upstream-hermes-agent-activation-package.json`
- 当前 probe 命令：`node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在真实上游 `Hermes-Agent` substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 upstream `Hermes-Agent` runtime owner cutover；`Hermes / managed family closure truth`、`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续只作为 absorbed provenance 保留。
2. `runDeliverableRoute`、`runManagedDeliverable`、`getManagedRun` 与 `superviseManagedRun` 现在通过上游 `Hermes-Agent` API server 执行 run surface，并在 upstream proof 缺失时 fail-closed。
3. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 domain truth 仍由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 收口，没有改写 visual-domain boundary。
4. service-safe `RedCube` domain entry adapter 已冻结为 `redcube_service_safe_domain_entry`，供 future `OPL Gateway` 使用；它仍不是成熟的最终用户产品入口。
5. `OPL -> RedCube` 的最小 handoff envelope 已冻结，但它仍是 future product-entry contract，不是当前成熟的用户入口。
6. 当前真实 upstream proof 仍以 `hermes gateway run -q` 为默认口径；若验证宿主上的全局 `hermes` CLI 仍落后于上游 `RedactingFormatter` 启动修复，可显式设置 `REDCUBE_HERMES_GATEWAY_COMMAND` 指向已知良好的 upstream gateway 启动命令，这属于 honest upstream launch override，不是 repo-local 兜底。
7. `scripts/run-test-group.mjs` 的 integration / e2e / full live lane 现在会先做 `/v1/health + /v1/models + /v1/runs + /v1/runs/{run_id}/events` preflight；只要 run-event surface 没有 terminal event，就会在套件开始前 fail-closed。
8. 在 `2026-04-12` 的当前验证宿主上，使用最新 upstream launch override 后，preflight 仍会收到 `run events endpoint did not emit a terminal event`，原始 stream 载荷是 `: stream closed`；这属于真实 upstream run-surface blocker，F4 fresh end-to-end verification 因此尚未完成。
9. `docs/program/hermes/*` 继续只作为历史 local-runtime migration artifact 读取。
10. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
11. 下一棒仍是按 `docs/program/upstream_hermes_agent_fast_cutover_board.md` 收口 F4，但当前明确被上游 run-event blocker 卡住；在 blocker 消失前，repo 只允许保持 fail-closed 和 truth-aligned evidence。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- 当前 CI 分层口径：`quality` lane 在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
