# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：`Hermes-Agent` managed-runtime owner + `RedCube AI` visual-domain truth + default `Codex CLI` concrete executor
- 当前本地宿主：`Codex` operator / development host
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；repo-verified 的 lightweight `product entry` service surface 也已落地，`redcube product frontdesk` 现在作为 direct frontdesk，`redcube product manifest` 会额外导出 repo mainline 摘要、`product_entry_status` 状态摘要，以及显式的 `frontdesk_surface`、`operator_loop_surface` 与 `operator_loop_actions`。当前 operator loop 诚实收口为 `redcube product invoke`，并把 `start_deliverable / continue_session / federated_handoff` 冻结成当前用户动作面；当前 manifest 也已经带出 `family_orchestration` companion、`product_entry_quickstart` companion 与 `product_entry_overview` companion，用来暴露 creative / publish gate、session resume、repo-tracked `family action graph`，以及当前 workspace 下的启动 / 续跑 / 进度读取动作面；`redcube product session` 继续作为拿到 `entry_session_id` 之后的同交付续跑 / 观察面；成熟的最终用户前台壳仍未落地
- 当前入口真相：`operator entry` 与 `agent entry` 已存在；repo-verified 的 lightweight `product entry` service surface 也已落地，`redcube product frontdesk` 现在作为 direct frontdesk，`redcube product manifest` 会额外导出 repo mainline 摘要、`product_entry_status` 状态摘要，以及显式的 `frontdesk_surface`、`operator_loop_surface` 与 `operator_loop_actions`。当前 operator loop 诚实收口为 `redcube product invoke`，并把 `start_deliverable / continue_session / federated_handoff` 冻结成当前用户动作面；当前 manifest 也已经带出 `family_orchestration` companion、`product_entry_quickstart` companion、`product_entry_overview` companion 与轻量 `product_entry_readiness` companion，用来暴露 creative / publish gate、session resume、repo-tracked `family action graph`，以及当前 workspace 下的启动 / 续跑 / 进度读取动作面，并额外回答“现在能不能直接用以及还差什么”；`redcube product session` 继续作为拿到 `entry_session_id` 之后的同交付续跑 / 观察面；成熟的最终用户前台壳仍未落地
- 当前家族对齐意义：在三个业务仓里，`RedCube AI` 目前是最早落下显式 `product frontdesk` contract 的参考形态之一；后续 family 其他仓会继续往这层“frontdesk 与 operator loop 分开、但 contract 仍共用同一 truth”靠拢
- 当前 family-shared substrate 复用真相：从 `2026-04-18` 起，`redcube product manifest` 里的 `managed_runtime_contract` builder、`family product-entry manifest` 公共壳、`family product frontdesk` 公共壳、`product_entry_quickstart / product_entry_overview / product_entry_readiness / product_entry_start / product_frontdesk` 的公共 payload helper，以及 `family_orchestration` preview shell 的共享 template builder，都不再在本仓单独维护，而是直接复用 `one-person-lab` Node 包导出的 shared helper；`RedCube AI` 本仓只继续持有 visual-domain 语义与 frontdesk / session / publication truth
- 当前统一协作模型：`Hermes-Agent` 承担长期运行、托管 session/run/watch/resume，`RedCube AI` 继续持有 domain authority、review / publication projection 与 visual truth，具体 deliverable execution 保持 executor-adapter 可插拔；当前默认 concrete executor 仍是 `host_agent` / `Codex CLI`
- 已冻结的最终目标形态：`User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- direct domain 目标形态：`User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- 当前 truthful gap：成熟的最终用户 `product entry` 前台壳与 managed web productization 仍未落地

## 当前基线（repo-verified）

- 当前 active tranche：repo-verified `RedCube Product Entry` + `OPL Gateway Federation` + managed product-entry hardening
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料
- 当前历史 upstream activation proof：`contracts/runtime-program/upstream-hermes-agent-activation-package.json`
- 当前 product-entry MVP contract：`contracts/runtime-program/redcube-product-entry-mvp.json`
- 当前 federated product-entry contract：`contracts/runtime-program/opl-gateway-federated-product-entry.json`
- 当前 managed product-entry hardening contract：`contracts/runtime-program/managed-product-entry-hardening.json`
- 当前 F4 live closeout proof：`contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`
- 历史 F4 blocker freeze：`contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`
- 当前 probe 命令：`codex exec`（通过 `@redcube/codex-cli-client` / `REDCUBE_CODEX_COMMAND`）
- 当前 executor-adapter contract：
  - 默认仍是 `host_agent`，也就是本机 Codex CLI autonomous / host-agent runtime
  - `ppt_deck`、`xiaohongshu`、`poster_onepager` 三个 family 都已并挂同一个显式 opt-in lane：`adapter = hermes_native_proof`
  - `hermes_native_proof` 不改默认，只在 caller 显式请求时启用
  - 它走的不是 chat relay，而是 `@redcube/hermes-substrate -> hermes_native_proof_bridge.py -> run_agent.AIAgent.run_conversation` 的 full-agent-loop proof lane
  - 默认 model / reasoning 不在 repo 内固定，继承本机 Hermes 默认配置；只有显式环境变量 override 才覆盖

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在当前 Codex CLI host-agent substrate 上继续保持同一真相面
- 让 landed `RedCube Product Entry` 与 landed `OPL Gateway` handoff 继续收敛到同一个 service-safe domain entry surface，而不是分裂成两套 domain 入口协议

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经把长期 managed-runtime owner 收口到 `Hermes-Agent`；`Codex CLI host-agent runtime` 在这条主线上继续作为默认 concrete executor，而 `Hermes / managed family closure truth`、`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 只作为 absorbed provenance 保留。
2. `runDeliverableRoute`、`runManagedDeliverable`、`getManagedRun` 与 `superviseManagedRun` 现在共同服务于同一条 `Hermes-Agent -> RedCube service-safe domain entry -> executor adapter` run surface，并在当前默认 `Codex exec` proof 缺失时 fail-closed。
3. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 domain truth 仍由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 收口，没有改写 visual-domain boundary。
4. `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现已统一切到 `runtime-family + Codex CLI structured generation`；repo-local `pack/compiler` 创作路径已从 active mainline 删除，`pack` 只保留 domain boundary / pack-id 语义。
5. legacy `pack-runtime` compiler registry 已从 workspace 与依赖图移除，避免测试或后续改动再次把创作真值拉回脚本层。
6. service-safe `RedCube` domain entry adapter 已冻结为 `redcube_service_safe_domain_entry`，并继续作为 `invokeProductEntry` / `invokeFederatedProductEntry` 的共同下游 domain adapter。
7. `RedCube Product Entry` 现在已经 repo-verified：`invokeProductEntry`、`redcube product invoke` 与 `invoke_product_entry` 会在需要时创建 deliverable、继续同一 `entry_session_id`，再统一下沉到 `invokeDomainEntry`。
8. `OPL -> RedCube` 的最小 handoff envelope 现在也已 repo-verified：`invokeFederatedProductEntry`、`redcube product federate` 与 `invoke_federated_product_entry` 会对 `target_domain_id`、`entry_mode`、`runtime_session_contract.runtime_owner`、`return_surface_contract.surface_kind` 继续 fail-closed，然后转进同一个 downstream `product entry`。
9. product-entry session continuity 现在已经落到用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/`；`getProductEntrySession`、`redcube product session` 与 `get_product_entry_session` 会读回 latest managed progress、review state 与 publication projection。
10. product-entry discovery surface 现在也已经 repo-verified：`redcube product frontdesk` 作为 direct frontdesk，`redcube product manifest` 与 `get_product_entry_manifest` 会把 `frontdesk_surface`、`operator_loop_surface`、`operator_loop_actions`、direct / federated / session 三类入口，以及显式的 `recommended_shell / recommended_command` 一起冻结成 machine-readable manifest，避免 `OPL` 或其他 host 自己猜入口命令与载荷结构。
11. 同轮也已把 manifest 提升到 family product-entry manifest companion 层：当前会额外带出 `family_orchestration.action_graph / human_gates / resume_contract`、`product_entry_quickstart` 与 `product_entry_overview`，方便顶层 `OPL` 或其他 caller 看懂 RedCube 当前的 frontdoor graph、gate、续跑边界与 operator loop。
12. 当前真实 exec preflight 已切到本地 `codex exec`；`scripts/run-test-group.mjs` 会在 integration / e2e / full lane 开始前先做 Codex CLI probe，并在 `REDCUBE_CODEX_COMMAND` 或本机 `codex` 不可用时 fail-closed。
13. 同一组验证 lane 现在还会用 `--test-concurrency=1` 串行化 test files，避免本地 Codex exec 与浏览器导出链路在同一宿主上被过度并发打爆。
14. 同一组验证 lane 现在还会在套件开始前冻结 `REDCUBE_PYTHON_COMMAND`；若未显式提供，会先用 `python3 -c "import sys; import playwright; print(sys.executable)"` 探测带 Playwright 的 Python，并在缺失时 fail-closed。
15. 在 `2026-04-13` 的当前验证宿主上，当前主线的 fresh 口径是 `Hermes-managed runtime ownership + codex exec default concrete executor + runtime-family route execution`；当前 closeout proof 见 `contracts/runtime-program/managed-product-entry-hardening.json` 与 `contracts/runtime-program/current-program.json` 中的 `green_baseline.local_codex_execution`。
16. 同一个 executor-adapter contract 现在也已经覆盖到全部三条 visual family：`ppt_deck`、`xiaohongshu`、`poster_onepager` 都支持显式 `hermes_native_proof` opt-in，而默认主线仍然保持 `host_agent` / Codex CLI。
17. 这条 `hermes_native_proof` lane 当前定位是备选 proof executor，不是默认 cutover：它的职责是证明 RedCube 的 family runtime contract 已经能承接 Hermes-native full agent loop，而不是把现有默认主线偷偷切走。
18. `hermes_native_proof` 当前会在 route artifact、managed runtime bridge、creative execution、review authorship 等 durable surface 上保留真实执行器身份，避免出现“实际走 Hermes，但落盘仍写 Codex host-agent”的第二真相源。
19. `docs/program/hermes/*` 继续只作为历史 local-runtime migration artifact 读取。
20. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
21. `docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 已完成 absorb，而 follow-on 的三阶段 product-entry 落地也已经吸收到当前主线：当前真实 gap 不再是 repo-verified service surface，而是成熟 end-user shell 与更上层 managed web productization 仍未落地。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- linked worktree 下先在当前 worktree 执行一次 `npm install`；`run-test-group` 现在会对 workspace package resolution 做 fail-closed 检查，避免验证静默吃到 root checkout 或其他 sibling checkout 的本地改动
- 当前 CI 分层口径：GitHub-hosted CI 默认只跑 `quality` lane；它在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
- `integration` / `e2e` / `full` 继续作为 live execution 显式验证 lane，只应在能证明真实 Codex exec 与浏览器导出链路都准备好的宿主上执行
