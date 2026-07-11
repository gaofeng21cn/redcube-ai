# Upstream Hermes-Agent Activation Package

Owner: `RedCube AI`
Purpose: `historical_upstream_hermes_activation_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

状态锚点：`2026-04-12`

生命周期说明：本文件是已完成的 upstream Hermes proof provenance，仍因 program 合同引用而原位保留。它不表示 Hermes 是 RCA 当前默认 runtime owner；当前默认 concrete executor 是 `Codex CLI`，OPL 托管路径按 provider-backed / Temporal-target 口径读取。

## 历史 activation 摘要

这份 activation package 只保留 F1 upstream connection proof 的历史上下文：

- 当时停止把 repo-local `Hermes` 命名当成 upstream runtime owner 证据。
- 当时需要真实上游 `Hermes-Agent` API server 暴露 `/v1/health`、`/v1/models`、`/v1/runs`、`/v1/runs/{run_id}/events`。
- 当时用 run-event proof、loop bridge 和 Python helper catalog 说明 proof lane 不是 repo-local 假实现。

当前不从本文派生 F2/F3/F4 工作、runtime owner cutover、default backend 或 verification command。当前 owner 是核心 docs、`docs/active/rca-ideal-state-gap-plan.md`、runtime-program contracts、source/tests、owner receipts 和 typed blockers。

## 历史 proof surface

| 历史 proof surface | 当前读法 |
| --- | --- |
| `/v1/health`、`/v1/models`、`/v1/runs`、`/v1/runs/{run_id}/events`、`X-Hermes-Session-Id` | 证明当时 upstream proof lane 的连接要求；不是当前 production substrate 或 default runtime owner proof。 |
| `REDCUBE_HERMES_UPSTREAM_BASE_URL`、`REDCUBE_HERMES_UPSTREAM_API_KEY`、`REDCUBE_HERMES_UPSTREAM_MODEL` | 历史 upstream proof 配置语境；当前 secret/auth/runtime truth 必须重新验证。 |
| `REDCUBE_HERMES_GATEWAY_COMMAND`、`REDCUBE_PYTHON_COMMAND` | 历史 live proof 的 launch / helper override 语境；不是 current runbook 或 fallback authorization。 |
| runtime topology / Python helper focused tests | 当前测试 owner 仍在 source/tests；本文只记录为什么曾需要这些 proof。 |

## 历史命令记录

```bash
hermes gateway run -q
REDCUBE_HERMES_GATEWAY_COMMAND='<known-good upstream gateway launch command>' scripts/verify.sh integration
node --test tests/runtime-topology-regression.test.js
node --test tests/python-native-helper-catalog.test.js
```

这些命令是 2026-04-12 proof provenance，不是当前默认验证入口。若后续需要重新证明 Hermes-Agent backend、executor adapter 或 Python helper path，必须从当前 contracts/source/tests 和 fresh environment truth 重建验证。

## No-Resurrection Boundary

- 不把 upstream activation proof 写成 RCA 当前 default runtime owner、production substrate、OPL hosted readiness 或 production readiness。
- 不把 `runManagedDeliverable / getManagedRun / superviseManagedRun` 恢复为 public compatibility path、facade、wrapper 或测试断言。
- 不把 `REDCUBE_HERMES_GATEWAY_COMMAND` 写成长期 fallback 或 repo-local runtime repair。
- 不把旧 upstream CLI/venv 风险列表当作当前 blocker；当前 blocker 必须由 fresh tests、contracts、owner receipts 或 typed blockers 重新给出。
