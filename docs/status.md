# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：上游 `Hermes-Agent` route / managed run surface + RedCube visual-domain truth
- 当前本地宿主：`Codex` operator / development host
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；repo-verified 的 lightweight `product entry` service surface 也已落地，`redcube product frontdesk` 现在作为 direct frontdesk，`redcube product manifest` 会额外导出 repo mainline 摘要、`product_entry_status` 状态摘要，以及显式的 `frontdesk_surface`、`operator_loop_surface` 与 `operator_loop_actions`。当前 operator loop 诚实收口为 `redcube product invoke`，并把 `start_deliverable / continue_session / federated_handoff` 冻结成当前用户动作面；当前 manifest 也已经开始带出 `family_orchestration` companion preview，用来暴露 creative / publish gate、session resume，以及 repo-tracked `family action graph` 实体；现在又统一补上了 `product_entry_quickstart` companion、`product_entry_overview` companion 与轻量 `product_entry_readiness` companion，分别回答“先从哪进、怎么续跑、当前处在什么状态、现在能不能直接用以及还差什么”；`redcube product session` 继续作为拿到 `entry_session_id` 之后的同交付续跑 / 观察面；成熟的最终用户前台壳仍未落地
- 当前家族对齐意义：在三个业务仓里，`RedCube AI` 目前是最早落下显式 `product frontdesk` contract 的参考形态之一；后续 family 其他仓会继续往这层“frontdesk 与 operator loop 分开、但 contract 仍共用同一 truth”靠拢
- 当前统一协作模型：目标由 `Hermes-Agent` 承担 runtime substrate / orchestration，`RedCube AI` 继续持有 domain authority 与 visual truth，具体 deliverable execution 保持 executor-adapter 可插拔
- 已冻结的最终目标形态：`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- direct domain 目标形态：`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- 当前 truthful gap：成熟的最终用户 `product entry` 前台壳与 managed web productization 仍未落地

## 当前基线（repo-verified）

- 当前 active tranche：repo-verified `RedCube Product Entry` + `OPL Gateway Federation` + managed product-entry hardening
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料
- 当前 upstream activation proof：`contracts/runtime-program/upstream-hermes-agent-activation-package.json`
- 当前 product-entry MVP contract：`contracts/runtime-program/redcube-product-entry-mvp.json`
- 当前 federated product-entry contract：`contracts/runtime-program/opl-gateway-federated-product-entry.json`
- 当前 managed product-entry hardening contract：`contracts/runtime-program/managed-product-entry-hardening.json`
- 当前 F4 live closeout proof：`contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`
- 历史 F4 blocker freeze：`contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`
- 当前 probe 命令：`node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在真实上游 `Hermes-Agent` substrate 上继续保持同一真相面
- 让 landed `RedCube Product Entry` 与 landed `OPL Gateway` handoff 继续收敛到同一个 service-safe domain entry surface，而不是分裂成两套 domain 入口协议

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 upstream `Hermes-Agent` runtime owner cutover；`Hermes / managed family closure truth`、`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续只作为 absorbed provenance 保留。
2. `runDeliverableRoute`、`runManagedDeliverable`、`getManagedRun` 与 `superviseManagedRun` 现在通过上游 `Hermes-Agent` API server 执行 run surface，并在 upstream proof 缺失时 fail-closed。
3. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 domain truth 仍由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 收口，没有改写 visual-domain boundary。
4. `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现已统一切到 `runtime-family + upstream Hermes structured generation`；repo-local `pack/compiler` 创作路径已从 active mainline 删除，`pack` 只保留 domain boundary / pack-id 语义。
5. legacy `pack-runtime` compiler registry 已从 workspace 与依赖图移除，避免测试或后续改动再次把创作真值拉回脚本层。
6. service-safe `RedCube` domain entry adapter 已冻结为 `redcube_service_safe_domain_entry`，并继续作为 `invokeProductEntry` / `invokeFederatedProductEntry` 的共同下游 domain adapter。
7. `RedCube Product Entry` 现在已经 repo-verified：`invokeProductEntry`、`redcube product invoke` 与 `invoke_product_entry` 会在需要时创建 deliverable、继续同一 `entry_session_id`，再统一下沉到 `invokeDomainEntry`。
8. `OPL -> RedCube` 的最小 handoff envelope 现在也已 repo-verified：`invokeFederatedProductEntry`、`redcube product federate` 与 `invoke_federated_product_entry` 会对 `target_domain_id`、`entry_mode`、`runtime_session_contract.runtime_owner`、`return_surface_contract.surface_kind` 继续 fail-closed，然后转进同一个 downstream `product entry`。
9. product-entry session continuity 现在已经落到用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/`；`getProductEntrySession`、`redcube product session` 与 `get_product_entry_session` 会读回 latest managed progress、review state 与 publication projection。
10. product-entry discovery surface 现在也已经 repo-verified：`redcube product frontdesk` 作为 direct frontdesk，`redcube product manifest` 与 `get_product_entry_manifest` 会把 `frontdesk_surface`、direct / federated / session 三类入口，以及显式的 `recommended_shell / recommended_command`、`operator_loop_actions` 一起冻结成 machine-readable manifest，避免 `OPL` 或其他 host 自己猜入口命令与载荷结构。
11. 同轮也已把 manifest 提升到 family product-entry manifest v2 companion 层：当前会额外带出 `family_orchestration.action_graph / human_gates / resume_contract`，方便顶层 `OPL` 或其他 caller 看懂 RedCube 当前的 frontdoor graph、gate 与续跑边界。
11. 当前真实 upstream proof 仍以 `hermes gateway run -q` 为默认口径；若验证宿主上的全局 `hermes` CLI 仍落后于上游 `RedactingFormatter` 启动修复，可显式设置 `REDCUBE_HERMES_GATEWAY_COMMAND` 指向已知良好的 upstream gateway 启动命令，这属于 honest upstream launch override，不是 repo-local 兜底。
12. `scripts/run-test-group.mjs` 的 integration / e2e / full live lane 现在会先做 `/v1/health + /v1/models + /v1/runs + /v1/runs/{run_id}/events` preflight；只要 run-event surface 没有 terminal event，就会在套件开始前 fail-closed。
13. 同一组 live lane 现在还会用 `--test-concurrency=1` 串行化 test files，以尊重当前 upstream Hermes 的 concurrent-run ceiling，而不是把 repo 自己的验证并发误写成 runtime 主线能力。
14. 同一组 live lane 现在还会在套件开始前冻结 `REDCUBE_PYTHON_COMMAND`；若未显式提供，会先用 `python3 -c "import sys; import playwright; print(sys.executable)"` 探测带 Playwright 的 Python，并在缺失时 fail-closed，而不是继续假设 upstream Hermes 自带 virtualenv 已经满足 screenshot review / export helper 依赖。
15. 在 `2026-04-12` 的当前验证宿主上，`npm run test:e2e` 已在当前宿主 fresh 全绿；标准 `run-test-group` live launcher 已 fresh 通过 `/v1/health + /v1/models + /v1/runs + /v1/runs/{run_id}/events` preflight，并拿到 terminal `run.completed` event；当前 closeout proof 见 `contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`。
16. `docs/program/hermes/*` 继续只作为历史 local-runtime migration artifact 读取。
17. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
18. `docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 已完成 absorb，而 follow-on 的三阶段 product-entry 落地也已经吸收到当前主线：当前真实 gap 不再是 repo-verified service surface，而是成熟 end-user shell 与更上层 managed web productization 仍未落地。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- linked worktree 下先在当前 worktree 执行一次 `npm install`；`run-test-group` 现在会对 workspace package resolution 做 fail-closed 检查，避免验证静默吃到 root checkout 或其他 sibling checkout 的本地改动
- 当前 CI 分层口径：GitHub-hosted CI 默认只跑 `quality` lane；它在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
- `integration` / `e2e` / `full` 继续作为 live-upstream 显式验证 lane，只应在能证明真实 Hermes run surface 的准备好宿主上执行
