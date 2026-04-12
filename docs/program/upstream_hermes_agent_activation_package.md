# Upstream Hermes-Agent Activation Package

这份 activation package 不是“已接入上游”的完成宣言。
它只做一件事：把 `RedCube AI` 进入 fast cutover F1 之前必须满足的真实 upstream 证明条件，冻结成可执行、可验证、可 fail-closed 的合同。

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
node scripts/probe-upstream-hermes-agent.mjs --json
node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface
```

## 环境变量

- `REDCUBE_HERMES_UPSTREAM_BASE_URL`
- `REDCUBE_HERMES_UPSTREAM_API_KEY`
- `REDCUBE_HERMES_UPSTREAM_MODEL`

如果 upstream host 不是 loopback，本 package 要求显式提供 `REDCUBE_HERMES_UPSTREAM_API_KEY`，否则 probe 必须 fail-closed。

## 当前 truthful stop boundary

只要下面任一条件不成立，就仍然属于外部 blocker，而不是仓内已完成切换：

- upstream `Hermes-Agent` API server 可达
- upstream `Hermes-Agent` 已配置真实 provider credentials
- probe 能通过 `/v1/runs` 与 `/v1/runs/{run_id}/events` 看到 terminal event

## 下一步

在这份 activation package 的 probe 通过之前：

- 不迁 `runManagedDeliverable / getManagedRun / superviseManagedRun` owner
- 不收口成“已完成 service-safe entry”
- 不允许把 repo-local runtime 继续包装成 upstream `Hermes-Agent`
