# Upstream Hermes-Agent Activation Package

状态锚点：`2026-04-12`

这份 activation package 已完成 closeout。
它现在承载的不是“下一步预告”，而是 F1 已冻结的真实 upstream 连接证据：

- `RedCube AI` 不再把 repo-local `Hermes` 命名当成 runtime owner 证明
- 真实上游 `Hermes-Agent` API server 已经被 probe 到 `/v1/health`、`/v1/models`、`/v1/runs`、`/v1/runs/{run_id}/events`
- 后续 F2/F3 都必须建立在这份冻结件之上，而不是回退成命名包装

## 目标

- 停止把 repo-local `Hermes` 命名当成 upstream runtime owner 证据。
- 冻结一条真实上游 `Hermes-Agent` 连接证明路径。
- 为后续 `runManagedDeliverable / getManagedRun / superviseManagedRun` runtime owner 切换准备 service-safe adapter preflight。

## 必须出现的 upstream surface

- 核心 health endpoint：`/v1/health`
- 核心 run-event endpoint：`/v1/runs/{run_id}/events`
- `GET /v1/health`
- `GET /v1/models`
- `POST /v1/runs`
- `GET /v1/runs/{run_id}/events`
- `X-Hermes-Session-Id`

只要这些 surface 里任意一个缺失，或者 run surface 只能返回 repo-local 假实现，就不能把仓库写成“已切到上游 `Hermes-Agent`”。

## Probe 命令

```bash
hermes gateway run -q
REDCUBE_HERMES_GATEWAY_COMMAND='<known-good upstream gateway launch command>' scripts/verify.sh integration
node scripts/probe-upstream-hermes-agent.mjs --json
node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface
```

## 已冻结的 fresh proof

- `hermes gateway run -q` 可启动 upstream API server
- `curl http://127.0.0.1:8642/v1/health` 返回 `ok`
- `curl http://127.0.0.1:8642/v1/models` 返回 `hermes-agent`
- `node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface` 返回 `ok: true`

## 环境变量

- `REDCUBE_HERMES_UPSTREAM_BASE_URL`
- `REDCUBE_HERMES_UPSTREAM_API_KEY`
- `REDCUBE_HERMES_UPSTREAM_MODEL`
- `REDCUBE_HERMES_GATEWAY_COMMAND`

如果 upstream host 不是 loopback，本 package 要求显式提供 `REDCUBE_HERMES_UPSTREAM_API_KEY`，否则 probe 必须 fail-closed。
如果验证宿主上的全局 `hermes` CLI 仍落后于上游 gateway 启动修复，integration / e2e lane 可以通过 `REDCUBE_HERMES_GATEWAY_COMMAND` 指向一条已知良好的 upstream 启动命令；这不是 repo-local runtime fallback。
当前 live lane 还要求 `/v1/runs` 与 `/v1/runs/{run_id}/events` 真正跑出 terminal event；如果 upstream 只返回 `: stream closed`，verify lane 现在会在套件开始前 fail-closed。

## 当前 truthful stop boundary

F1 已经通过，但下面这些仍然决定后续 cutover 是否继续保持真实：

- upstream `Hermes-Agent` API server 可达
- upstream `Hermes-Agent` 已配置真实 provider credentials
- probe 能通过 `/v1/runs` 与 `/v1/runs/{run_id}/events` 看到 terminal event

## 已知外部风险

- 当前上游 `Hermes` 在默认 `hermes gateway run` 路径上会因 `gateway/run.py` 中 `RedactingFormatter` 未定义而崩溃。
- 当前 fresh proof 使用 `hermes gateway run -q` 绕开这个上游问题；这不是 RedCube repo 内部已修复能力。
- 当前 repo verification 已冻结 `REDCUBE_HERMES_GATEWAY_COMMAND` 作为 honest launch override，用于当全局 `hermes` CLI 仍落后于已知良好的 upstream checkout 时，把 live lane 显式指向真实上游命令。
- 在 `2026-04-12` 的当前验证宿主上，即使切到最新 upstream launch override，`/v1/runs/{run_id}/events` 仍只返回 `: stream closed` 而没有 terminal event；这说明 F4 当前卡在真实上游 run-surface，不是 repo 内部 contract drift。

## 下一步

在这份 activation package 之后，允许继续：

- 迁 `runManagedDeliverable / getManagedRun / superviseManagedRun` owner
- 收口 service-safe domain entry adapter
- 做 `ppt_deck`、`xiaohongshu`、guarded `poster_onepager` 的 fresh end-to-end proof
