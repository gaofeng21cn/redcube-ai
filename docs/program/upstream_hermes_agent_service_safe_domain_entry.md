# Upstream Hermes-Agent Service-Safe Domain Entry

状态锚点：`2026-04-12`

## 目标

在 `runDeliverableRoute / runManagedDeliverable` 已经把 runtime run surface 切到真实上游 `Hermes-Agent` 之后，
继续冻结一个 future `OPL Gateway` 可直接调用的 service-safe domain entry surface。

这层 surface 的边界是：

- runtime session / run / watch 仍交给上游 `Hermes-Agent`
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
让 future `OPL Gateway` 可以在不越过 visual-domain boundary 的前提下，
调用同一条已经切到上游 `Hermes-Agent` 的 runtime mainline。
