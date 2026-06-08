# Upstream Hermes-Agent Service-Safe Domain Entry

Owner: `RedCube AI`
Purpose: `historical_upstream_hermes_service_safe_entry_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 service-safe entry brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

状态锚点：`2026-04-12`

生命周期说明：本文件记录 service-safe domain entry 的历史 Hermes-hosted proof 语境，当前应按 OPL-hosted integration / provider-backed runtime 口径读取。它不改变 RCA 的 direct public identity，也不把 Hermes-first route 提升为默认对外入口。

## 历史 service-safe entry 摘要

本文记录 `runDeliverableRoute / runManagedDeliverable` 具备显式 external `Hermes-Agent` hosted/proof backend 后，当时如何冻结一个可被 OPL-hosted integration 调用的 service-safe domain entry surface。

当前 service-safe entry、formal entry、default executor、OPL-hosted integration 和 product-entry truth 不从本文读取；请回到 core docs、active plan、runtime-program contracts、product-entry manifest、domain handler source/tests、owner receipts 和 typed blockers。

## 历史冻结件

- machine-readable contract:
  - `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable adapter surface:
  - `@redcube/domain-entry` `invokeDomainEntry`
- supported protocol surface:
  - `redcube-mcp` tool `invoke_domain_entry`

## 历史最小 envelope

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

当时最小支持的 `task_intent`：

- `run_managed_deliverable`
- `run_deliverable_route`

当时 adapter 也按同一份合同 fail-closed：

- 缺少 `entry_mode` 会直接拒绝
- 缺少 `runtime_session_contract.runtime_owner` 会直接拒绝
- 缺少 `return_surface_contract.surface_kind` 会直接拒绝
- `run_managed_deliverable -> managed_run`、`run_deliverable_route -> route_run` 的 surface-kind 对应关系一旦不匹配也会直接拒绝

## 当前读法

这不是成熟的用户产品入口、聊天壳、App shell、production substrate 或 default runtime owner proof。
它只是历史 service-safe domain adapter provenance；当前 direct route 和 OPL-hosted route 必须重新由当前 contracts/source/tests、owner docs、owner receipts 和 typed blockers 证明。

## No-Resurrection Boundary

- 不把 historical `run_managed_deliverable` / `managed_run` wording 恢复为 public compatibility path、facade、wrapper 或测试断言。
- 不把 external `Hermes-Agent` hosted/proof backend 写成默认 runtime owner、production substrate、OPL hosted readiness 或 production readiness。
- 不把本文作为 App/product-shell backlog、delete authority、mature Product Entry proof 或 visual-domain readiness evidence。
