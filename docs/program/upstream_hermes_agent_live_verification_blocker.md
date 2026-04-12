# Upstream Hermes-Agent Live Verification Blocker

状态锚点：`2026-04-12`

## 当前结论

`RedCube AI` 这一棒已经把 service-safe domain entry adapter、公开目标叙事与 machine-readable contract 收紧到新的 truthful mainline，
但 `docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 端到端 closeout 还不能诚实写成完成。

原因不是 repo-local runtime 回退，也不是文档不同步；
而是当前验证宿主上的 live upstream proof 出现了新的外部 blocker：

- focused upstream probe 可以成功拿到 `run.completed` terminal event
- 但 live `ppt_deck` e2e 目前会在 `screenshot_review` 失败
- `scripts/verify.sh e2e` 还出现过一次 `/v1/runs/{run_id}/events` 没有 terminal event 的 fail-closed preflight

## 已冻结的通过证据

1. service-safe domain entry adapter 已经变成 fail-closed envelope：
   - `entry_mode` 缺失会拒绝
   - `runtime_session_contract.runtime_owner` 缺失会拒绝
   - `return_surface_contract.surface_kind` 缺失会拒绝
   - `task_intent -> surface_kind` 不匹配会拒绝
2. 显式 API-server 启动的 upstream gateway probe 可通过：
   - 启动命令：`API_SERVER_ENABLED=true API_SERVER_HOST=127.0.0.1 API_SERVER_PORT=8642 API_SERVER_MODEL_NAME=hermes-agent hermes gateway run --replace`
   - probe：`REDCUBE_HERMES_UPSTREAM_BASE_URL=http://127.0.0.1:8642 REDCUBE_HERMES_UPSTREAM_MODEL=hermes-agent node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface`
   - probe 返回：`run.completed`

## 当前 blocker

1. `scripts/verify.sh e2e` 曾在 live preflight 上 fail-closed：
   - `run events endpoint did not emit a terminal event`
2. focused `ppt_deck` live e2e 当前在 `screenshot_review` 失败：
   - 测试：`tests/ppt-deliverable-e2e.test.js`
   - 断言：`AssertionError: screenshot_review false !== true`

## 这意味着什么

- 本仓当前可以诚实宣称：
  - upstream runtime owner cutover 已落地
  - service-safe domain entry adapter 已收紧
  - public docs / contracts / tests 已同步到新的目标链路
- 本仓当前不能诚实宣称：
  - F4 端到端验证已在当前宿主全绿
  - `ppt_deck / xiaohongshu / poster_onepager` 的 live lane 已全部重新收口

## 下一步

1. 保留本次文档 / 合同 / adapter tighten 改动。
2. 继续针对 upstream live lane 排查：
   - `screenshot_review` 为什么在 `ppt_deck` focused e2e 返回 `ok=false`
   - `/v1/runs/{run_id}/events` terminal event 偶发缺失是否仍存在
3. 未拿到 fresh green proof 之前，不把 F4 写成 closeout completed。
