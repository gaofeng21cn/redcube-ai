# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：上游 `Hermes-Agent` route / managed run surface + RedCube visual-domain truth
- 当前本地宿主：`Codex` operator / development host
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；成熟的 lightweight `product entry` 仍未落地
- 当前统一协作模型：目标由 `Hermes-Agent` 承担 runtime substrate / orchestration，`RedCube AI` 继续持有 domain authority 与 visual truth，具体 deliverable execution 保持 executor-adapter 可插拔
- 已冻结的最终目标形态：`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- direct domain 目标形态：`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- 当前 truthful gap：成熟的最终用户 `product entry` 仍未落地

## 当前基线（repo-verified）

- 当前 active tranche：upstream `Hermes-Agent` runtime owner cutover + service-safe domain entry adapter
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料
- 当前 upstream activation proof：`contracts/runtime-program/upstream-hermes-agent-activation-package.json`
- 当前 F4 blocker freeze：`contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`
- 当前 probe 命令：`node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在真实上游 `Hermes-Agent` substrate 上继续保持同一真相面
- 让 future `RedCube Product Entry` 与 future `OPL Gateway` handoff 收敛到同一个 service-safe domain entry surface，而不是分裂成两套 domain 入口协议

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 upstream `Hermes-Agent` runtime owner cutover；`Hermes / managed family closure truth`、`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续只作为 absorbed provenance 保留。
2. `runDeliverableRoute`、`runManagedDeliverable`、`getManagedRun` 与 `superviseManagedRun` 现在通过上游 `Hermes-Agent` API server 执行 run surface，并在 upstream proof 缺失时 fail-closed。
3. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 domain truth 仍由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 收口，没有改写 visual-domain boundary。
4. service-safe `RedCube` domain entry adapter 已冻结为 `redcube_service_safe_domain_entry`，供 future `OPL Gateway` 使用；它仍不是成熟的最终用户产品入口。
5. `OPL -> RedCube` 的最小 handoff envelope 已冻结，并且 `invokeDomainEntry` 现在会对缺失 `entry_mode`、缺失 `runtime_session_contract.runtime_owner`、缺失 `return_surface_contract.surface_kind` 以及 task-intent / surface-kind 不匹配的请求 fail-closed；但它仍是 future product-entry contract，不是当前成熟的用户入口。
6. 当前真实 upstream proof 仍以 `hermes gateway run -q` 为默认口径；若验证宿主上的全局 `hermes` CLI 仍落后于上游 `RedactingFormatter` 启动修复，可显式设置 `REDCUBE_HERMES_GATEWAY_COMMAND` 指向已知良好的 upstream gateway 启动命令，这属于 honest upstream launch override，不是 repo-local 兜底。
7. `scripts/run-test-group.mjs` 的 integration / e2e / full live lane 现在会先做 `/v1/health + /v1/models + /v1/runs + /v1/runs/{run_id}/events` preflight；只要 run-event surface 没有 terminal event，就会在套件开始前 fail-closed。
8. 同一组 live lane 现在还会用 `--test-concurrency=1` 串行化 test files，以尊重当前 upstream Hermes 的 concurrent-run ceiling，而不是把 repo 自己的验证并发误写成 runtime 主线能力。
9. 同一组 live lane 现在还会在套件开始前冻结 `REDCUBE_PYTHON_COMMAND`；若未显式提供，会先用 `python3 -c "import sys; import playwright; print(sys.executable)"` 探测带 Playwright 的 Python，并在缺失时 fail-closed，而不是继续假设 upstream Hermes 自带 virtualenv 已经满足 screenshot review / export helper 依赖。
10. 在 `2026-04-12` 的当前验证宿主上，显式 API-server 启动的 focused upstream probe 仍可通过，并拿到 `run.completed` terminal event；但 F4 fresh verification 已出现新的 live blocker，详见 `contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`。
11. “最终目标形态”文档冻结已经完成，但它冻结的是理想型与边界，不是对 mature product entry 已落地的过度宣称。
12. `docs/program/hermes/*` 继续只作为历史 local-runtime migration artifact 读取。
13. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
14. 当前 `ppt_deck` focused live e2e 目前在 `screenshot_review` 失败，`scripts/verify.sh e2e` 也出现过 `/v1/runs/{run_id}/events` 没有 terminal event 的 fail-closed preflight；因此 F4 closeout 不能继续写成全绿。
15. 下一棒仍是按 `docs/program/upstream_hermes_agent_fast_cutover_board.md` 收口 F4，但当前必须先解决 `contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json` 记录的外部 upstream/live blocker，再继续 absorb 端到端 closeout 叙事。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- 当前 CI 分层口径：GitHub-hosted CI 默认只跑 `quality` lane；它在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
- `integration` / `e2e` / `full` 继续作为 live-upstream 显式验证 lane，只应在能证明真实 Hermes run surface 的准备好宿主上执行
