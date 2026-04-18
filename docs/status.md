# RedCube AI 当前状态

## 当前角色

- 仓库角色：`OPL` 壳下的一级 RCA / RedCube visual-deliverable domain module / agent
- 当前用户认知入口：`OPL GUI / management shell -> RCA / RedCube domain agent -> governed visual-deliverable workflow`
- 当前执行口径：`Codex` 是默认交互与执行路径；`Hermes-Agent` 是显式备用模式与长期在线 gateway
- 当前本地宿主：`Codex` operator / development host，也是当前默认 concrete executor
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- 当前入口真相：首读模型是 `OPL shell -> RedCube domain agent`；仓内 repo-verified direct surfaces 是 `redcube product frontdesk / start / preflight / invoke / session / manifest`，并继续通过 manifest 暴露 creative / publish gate、session resume、repo-tracked `family action graph`、启动 / 续跑 / 进度读取动作面与 readiness 摘要
- 当前 internal OPL bridge：`invokeFederatedProductEntry`、`invoke_federated_product_entry` 与 `redcube product federate` 只保留给外层 OPL shell / compatibility bridge；公开用户叙事围绕 RedCube direct frontdesk / invoke / session 与 Codex 默认执行
- 当前家族对齐意义：在三个业务仓里，`RedCube AI` 目前是最早落下显式 frontdesk / manifest / session contract 的参考形态之一；后续 family 其他仓会继续往“外层 OPL 壳读取 domain manifest、domain repo 保持自身 truth”的模型靠拢
- 当前 family-shared substrate 复用真相：从 `2026-04-18` 起，`redcube product manifest` 里的 shared contract builder、`family product-entry manifest` 公共壳、`product_entry_quickstart / product_entry_overview / product_entry_readiness / product_entry_start / product_frontdesk` 的公共 payload helper，以及 `family_orchestration` preview shell 的共享 template builder，都直接复用 `one-person-lab` Node 包导出的 shared helper；`RedCube AI` 本仓继续持有 visual-domain 语义与 frontdesk / session / publication truth
- 当前统一协作模型：`OPL` 持有用户可见的顶层管理面；`RedCube AI` 持有 domain authority、review / publication projection 与 visual truth；`Codex` 承担默认交互和执行；`Hermes-Agent` 承担显式备用模式与长期在线 gateway
- 已冻结的最终目标形态：`User -> OPL shell -> RCA / RedCube domain agent -> Codex default execution -> RedCube visual-domain truth surfaces`，并在需要长期在线 session / run / watch / resume 时显式进入 `Hermes-Agent` gateway
- direct domain 目标形态：`User -> RedCube domain agent -> Codex default execution -> RedCube visual-domain truth surfaces`
- 当前 truthful gap：OPL 壳层产品化、RedCube domain-agent frontdesk 表达与 readiness 文案还需要继续收敛

## 当前基线（repo-verified）

- 当前 active tranche：RCA / RedCube domain-agent entry + OPL shell integration + Codex default execution hardening
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前说明边界：核心五件套优先于历史 `docs/program/hermes/` 迁移材料、upstream Hermes proof brief 与 OPL bridge brief
- 当前历史 upstream activation proof：`contracts/runtime-program/upstream-hermes-agent-activation-package.json`
- 当前 RedCube domain-agent entry contract：`contracts/runtime-program/redcube-product-entry-mvp.json`
- 当前 OPL bridge contract：`contracts/runtime-program/opl-gateway-federated-product-entry.json`
- 当前 domain-agent hardening contract：`contracts/runtime-program/managed-product-entry-hardening.json`
- 当前冻结的 downstream execution seam：`RedCube service-safe domain entry`
- 当前 F4 live closeout proof：`contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`
- 历史 F4 blocker freeze：`contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`
- 当前 probe 命令：`codex exec`（通过 `@redcube/codex-cli-client` / `REDCUBE_CODEX_COMMAND`）
- 当前 executor-adapter contract：
  - 默认仍是 `host_agent`，也就是本机 Codex CLI autonomous / host-agent runtime
  - `ppt_deck`、`xiaohongshu`、`poster_onepager` 三个 family 都已并挂同一个显式 opt-in lane：`adapter = hermes_native_proof`
  - `hermes_native_proof` 作为备用 proof executor，只在 caller 显式请求时启用
  - 它走 `@redcube/hermes-substrate -> hermes_native_proof_bridge.py -> run_agent.AIAgent.run_conversation` 的 full-agent-loop proof lane
  - 默认 model / reasoning 不在 repo 内固定，继承本机 Hermes 默认配置；只有显式环境变量 override 才覆盖

## 长线目标（规划层）

- 保持 `OPL shell -> RCA / RedCube domain agent -> family / profile / pack -> governed visual delivery` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在当前 Codex CLI host-agent substrate 上继续保持同一真相面
- 让 direct RedCube domain-agent surfaces 与 OPL bridge surfaces 继续共享同一组 domain truth、session continuity、review state 与 publication projection

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经把用户认知收敛到 `OPL shell + RCA / RedCube domain agent + Codex default execution`；历史 Hermes closure records、Phase 2 tranches 与 runtime substrate canonical closure 只作为 absorbed provenance 保留。
2. `runDeliverableRoute`、`runManagedDeliverable`、`getManagedRun` 与 `superviseManagedRun` 共同服务 RedCube domain-agent execution surface，并在当前默认 `Codex exec` proof 缺失时 fail-closed。
3. `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 的 domain truth 仍由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 收口，没有改写 visual-domain boundary。
4. `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现已统一切到 `runtime-family + Codex CLI structured generation`；repo-local `pack/compiler` 创作路径已从 active mainline 删除，`pack` 只保留 domain boundary / pack-id 语义。
5. legacy `pack-runtime` compiler registry 已从 workspace 与依赖图移除，避免测试或后续改动再次把创作真值拉回脚本层。
6. RedCube domain-agent entry 已经 repo-verified：`invokeProductEntry`、`redcube product invoke` 与 `invoke_product_entry` 会在需要时创建 deliverable、继续同一 `entry_session_id`，再进入同一个 service-safe domain entry execution path。
7. `OPL -> RedCube` bridge 也已 repo-verified：`invokeFederatedProductEntry`、`redcube product federate` 与 `invoke_federated_product_entry` 继续作为 internal OPL bridge 集成面，并共享 downstream RedCube domain-agent session contract。
8. product-entry session continuity 现在已经落到用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/`；`getProductEntrySession`、`redcube product session` 与 `get_product_entry_session` 会读回 latest managed progress、review state 与 publication projection。
9. domain-agent discovery surface 现在也已经 repo-verified：`redcube product frontdesk` 作为 direct frontdesk，`redcube product manifest` 与 `get_product_entry_manifest` 会把 `frontdesk_surface`、`operator_loop_surface`、`operator_loop_actions`、direct / bridge / session 三类入口，以及显式的 `recommended_shell / recommended_command` 一起冻结成 machine-readable manifest，供 `OPL` 或其他 host 读取入口命令与载荷结构。
10. 同轮也已把 manifest 提升到 family product-entry manifest companion 层：当前会额外带出 `family_orchestration.action_graph / human_gates / resume_contract`、`product_entry_quickstart` 与 `product_entry_overview`，方便顶层 `OPL` 或其他 caller 看懂 RedCube 当前的 frontdoor graph、gate、续跑边界与 operator loop。
11. 当前真实 exec preflight 已切到本地 `codex exec`；`scripts/run-test-group.mjs` 会在 integration / e2e / full lane 开始前先做 Codex CLI probe，并在 `REDCUBE_CODEX_COMMAND` 或本机 `codex` 不可用时 fail-closed。
12. 同一组验证 lane 现在还会用 `--test-concurrency=1` 串行化 test files，避免本地 Codex exec 与浏览器导出链路在同一宿主上被过度并发打爆。
13. 同一组验证 lane 现在还会在套件开始前冻结 `REDCUBE_PYTHON_COMMAND`；若未显式提供，会先用 `python3 -c "import sys; import playwright; print(sys.executable)"` 探测带 Playwright 的 Python，并在缺失时 fail-closed。
14. 当前 closeout proof 见 `contracts/runtime-program/managed-product-entry-hardening.json` 与 `contracts/runtime-program/current-program.json` 中的 `green_baseline.local_codex_execution`。
15. 同一个 executor-adapter contract 现在也已经覆盖到全部三条 visual family：`ppt_deck`、`xiaohongshu`、`poster_onepager` 都支持显式 `hermes_native_proof` opt-in，而默认主线仍然保持 `host_agent` / Codex CLI。
16. 这条 `hermes_native_proof` lane 当前定位是备选 proof executor；它的职责是证明 RedCube 的 family runtime contract 已经能承接 Hermes-native full agent loop。
17. `hermes_native_proof` 当前会在 route artifact、runtime bridge、creative execution、review authorship 等 durable surface 上保留真实执行器身份，避免出现“实际走 Hermes，但落盘仍写 Codex host-agent”的第二真相源。
18. `docs/program/hermes/*` 继续只作为历史 local-runtime migration artifact 读取。
19. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
20. `docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 已完成 absorb，而 follow-on 的三阶段 domain-agent entry 落地也已经吸收到当前主线；当前真实 gap 是 OPL 壳层产品化、RedCube domain-agent frontdesk wording 与 readiness 解释继续收敛。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- linked worktree 下先在当前 worktree 执行一次 `npm install`；`run-test-group` 现在会对 workspace package resolution 做 fail-closed 检查，避免验证静默吃到 root checkout 或其他 sibling checkout 的本地改动
- 当前 CI 分层口径：GitHub-hosted CI 默认只跑 `quality` lane；它在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
- `integration` / `e2e` / `full` 继续作为 live execution 显式验证 lane，只应在能证明真实 Codex exec 与浏览器导出链路都准备好的宿主上执行
