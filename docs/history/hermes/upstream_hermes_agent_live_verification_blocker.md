# Upstream Hermes-Agent Live Verification Blocker

Owner: `RedCube AI`
Purpose: `historical_upstream_hermes_live_blocker_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 blocker brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

状态锚点：`2026-04-12`

生命周期说明：本文件保留历史 blocker 证据；它不是当前 runtime owner 或 public identity 文档。当前 RCA 文档按 provider-backed OPL 托管路径、Temporal production online runtime 必需 substrate、默认 `Codex CLI` 最小执行单元读取。

## 历史 blocker 摘要

这份文档现在保留的是 `2026-04-12` 同日稍早出现过的历史 blocker 证据。

它曾经真实阻塞过 `docs/history/hermes/upstream_hermes_agent_fast_cutover_board.md` 的 F4 closeout，
但它现在已经不再是当前 stop boundary。

当前 fresh closeout 证据已冻结到：

- `contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json`
- `docs/history/hermes/upstream_hermes_agent_live_verification_closeout.md`

## 历史通过证据

1. service-safe domain entry adapter 已经变成 fail-closed envelope：
   - `entry_mode` 缺失会拒绝
   - `runtime_session_contract.runtime_owner` 缺失会拒绝
   - `return_surface_contract.surface_kind` 缺失会拒绝
   - `task_intent -> surface_kind` 不匹配会拒绝
2. 显式 API-server 启动的 upstream gateway probe 当时可通过，并证明 Hermes API structured_call / agent_loop run-event proof 可读取 terminal `run.completed`。具体启动命令和测试入口只按提交历史 / runtime-program provenance 读取，不在本文继续保留为可执行 runbook。

## 历史 blocker

1. 当时 e2e verification 曾在 live preflight 上 fail-closed：
   - `run events endpoint did not emit a terminal event`
2. focused `ppt_deck` live e2e 当时在 `screenshot_review` 失败；具体测试名和 assertion 只按历史 blocker provenance 读取。

## 历史 resolution

1. 当时 e2e lane 已在同一宿主 fresh 通过，覆盖 `ppt_deck` 的 `screenshot_review / export_pptx / optimize_existing` 和 `xiaohongshu` 的 `publish_copy / export_bundle / optimize_existing`。
2. 当时 focused integration proof 已补齐 guarded `poster_onepager` 的 upstream live proof。
3. 历史 `ppt_deck screenshot_review` 失败与 `/v1/runs/{run_id}/events` terminal-event 缺失，在这一轮标准 launcher + Playwright Python contract 下都没有再次复现

## 当前读法

本文只证明 blocker 曾真实发生并被同日 closeout 覆盖；它不能证明 current runtime owner、production substrate、default backend、mature product entry、OPL hosted readiness、visual ready、exportable、handoffable、domain ready 或 production ready。

当前 gap、next baton、runtime owner 和 App/product-shell work 必须回到 `docs/active/rca-ideal-state-gap-plan.md`、core docs、runtime-program contracts、source/tests、owner receipts 和 typed blockers。不要从本文继续推进。
