# Upstream Hermes-Agent Live Verification Blocker

状态锚点：`2026-04-12`

## 当前结论

这份文档现在保留的是 `2026-04-12` 同日稍早出现过的历史 blocker 证据。

它曾经真实阻塞过 `docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 closeout，
但它现在已经不再是当前 stop boundary。

当前 fresh closeout 证据已冻结到：

- `contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`
- `docs/program/upstream_hermes_agent_live_verification_closeout.md`

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

## 历史 blocker

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
- 本文当前只继续承担：
  - 历史 blocker freeze
  - 对“这次问题曾真实发生过”的证据保留
  - 对“closeout 不是靠改写历史得到的”这件事的约束

## 当前 resolution

1. `npm run test:e2e` 已在当前宿主 fresh 全绿：
   - `ppt_deck` 通过 `screenshot_review / export_pptx / optimize_existing`
   - `xiaohongshu` 通过 `publish_copy / export_bundle / optimize_existing`
2. `node scripts/run-test-group.mjs integration --test-name-pattern 'poster_onepager|knowledge-poster'` 已在当前宿主 fresh 全绿：
   - 补齐 guarded `poster_onepager` 的 upstream live proof
3. 历史 `ppt_deck screenshot_review` 失败与 `/v1/runs/{run_id}/events` terminal-event 缺失，在这一轮标准 launcher + Playwright Python contract 下都没有再次复现

## 下一步

1. 保留这份 blocker 作为历史证据，不把它删除或伪装成从未发生。
2. 以 `upstream-hermes-agent-live-verification-closeout` 作为当前 F4 closeout 证明件继续推进。
3. 把后续 truthful gap 明确切换到 mature `product entry` 与 `OPL Gateway` federation，而不是继续停在已解锁的历史 blocker 上。
