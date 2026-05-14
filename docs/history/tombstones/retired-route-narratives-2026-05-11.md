# Retired Route Narratives Tombstone

日期锚点：`2026-05-11`

本文保留旧路线词汇的可检索落点，避免读者把它们重新读成当前 RedCube 公开身份。

## Retired wording

- gateway-first / frontdoor-first / federation-first
- harness-first / Domain Harness OS as public identity
- OPL-first / OPL bridge as RedCube public entry
- Hermes-first / repo-local Hermes as default runtime owner
- Phase 2 as an open-ended new product direction

## Current owner surface

- RedCube AI 是 visual-deliverable domain agent，持有 visual truth、layout/review verdict、route owner 与 artifact authority。
- OPL 是 stage-led、以 Agent executor 为最小执行单位的完整智能体运行框架，可通过内部托管路径调用 RedCube；它不持有 RedCube visual truth。
- Codex CLI 是未显式选择 hosted/proof backend 时的默认最小具体执行单元。
- `gateway` / `harness` 只作为仓内边界层、执行层或历史语境词汇保留。
- Hermes 只作为 legacy/optional provider、显式 hosted/proof backend 或历史 proof lane 出现。

## Contract-linked exception

部分旧标题文档仍被 `contracts/runtime-program/*.json` 或 `current-program.json` 通过 `human_doc:*` 引用。它们按生命周期迁入 `docs/active/`、`docs/history/` 或 `docs/references/`，并通过 lifecycle note 降级；这些保留不代表旧路线重新成为当前公开主线。

当前仍受引用保护的主要语义组：

- `human_doc:program_phase_2_*`：保留在 `docs/history/phase-2/`，读作 absorbed tranche provenance。
- `human_doc:program_upstream_hermes_agent_*`：保留在 `docs/history/hermes/`，读作 historical proof / blocker / closeout provenance。
- `human_doc:runtime_architecture`：保留在 `docs/runtime/runtime_architecture.md`，只解释当前 runtime topology。
- `human_doc:domain_harness_os_positioning`：保留在 `docs/references/positioning/domain-harness-os-positioning.md`，只作为内部边界词汇参考。

## Current truth entry

- `../../README.md`
- `../../status.md`
- `../../architecture.md`
- `../../docs_portfolio_consolidation.md`
- `../README.md`

## Physical follow-through note

2026-05-13 follow-through 后，默认 active path 只读作 direct product entry、service-safe domain entry、product sidecar、stage descriptor 与 OPL-hosted handoff parity。旧 Hermes/Gateway/local-manager 文件名若仍在 `docs/history/` 或 `docs/references/` 出现，原因只能是 `human_doc:*` 合同引用、proof provenance 或 tombstone 可检索性；无合同引用的旧 active-path 物理入口不得重新进入 active code/tests/package surface。
