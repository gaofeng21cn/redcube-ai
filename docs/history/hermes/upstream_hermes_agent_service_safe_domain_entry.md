# Upstream Hermes-Agent Service-Safe Domain Entry

Owner: `RedCube AI`
Purpose: `historical_upstream_hermes_service_safe_entry_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 service-safe entry brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

状态锚点：`2026-04-12`

生命周期说明：本文件记录 service-safe domain entry 的历史 Hermes-hosted proof 语境，当前应按 OPL-hosted integration / provider-backed runtime 口径读取。它不改变 RCA 的 direct public identity，也不把 Hermes-first route 提升为默认对外入口。

## 目标

在 `runDeliverableRoute / runManagedDeliverable` 已经具备显式 external `Hermes-Agent` hosted/proof backend 之后，
继续冻结一个 `OPL Runtime Manager` 可通过 OPL-hosted integration 调用的 service-safe domain entry surface。

这层 surface 的边界是：

- OPL-hosted integration 由 `OPL Runtime Manager` 作为 thin product-managed adapter/projection layer 挂到 configured family runtime provider
- 默认 concrete executor 仍是 `Codex CLI`
- visual domain truth 仍由 `RedCube AI` 负责
- 不引入聊天 UI，不改写当前 formal-entry matrix

## 冻结件

- machine-readable contract:
  - `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable adapter surface:
  - `@redcube/gateway` `invokeDomainEntry`
- supported protocol surface:
  - `redcube-mcp` tool `invoke_domain_entry`

## 最小 envelope

`invokeDomainEntry` 冻结的最小 envelope 与 `OPL -> RedCube` handoff 一致：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

RedCube domain payload 继续单独补：

- `deliverable_family`
- `topic_id`
- `deliverable_id`

当前最小支持的 `task_intent`：

- `run_managed_deliverable`
- `run_deliverable_route`

当前 adapter 也按同一份合同 fail-closed：

- 缺少 `entry_mode` 会直接拒绝
- 缺少 `runtime_session_contract.runtime_owner` 会直接拒绝
- 缺少 `return_surface_contract.surface_kind` 会直接拒绝
- `run_managed_deliverable -> managed_run`、`run_deliverable_route -> route_run` 的 surface-kind 对应关系一旦不匹配也会直接拒绝

## 当前真相

这不是成熟的用户产品入口，也不是聊天壳。
它只是一个 service-safe、machine-readable 的 domain adapter，
让 `OPL Runtime Manager` 可以在不越过 visual-domain boundary 的前提下，
通过 external `Hermes-Agent` substrate 的 projection / hosted backend 调用同一条 RedCube domain-entry mainline。
