# Phase 2 Runtime Watch Locator Integrity Hardening

Owner: `RedCube AI`
Purpose: `historical_phase_2_runtime_watch_locator_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 tranche brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts、typed blockers 和当前 owner docs。

## Lifecycle

本文只保存 runtimeWatch locator integrity hardening 的历史 provenance。它不再是当前 run record contract owner、runtimeWatch locator rule spec、CLI/MCP mismatch behavior checklist、follow-on board 或 absorption gate。

现行 runtimeWatch / locator truth 回到 `docs/runtime/`、machine-readable contracts、CLI/MCP behavior、runtime-family source/tests、runtime artifacts、owner receipts 和 typed blockers。

## Historical Fact

这条 absorbed tranche 当时收紧了 quartet locator 与 run identity 的一致性：

- deliverable-scope run record 持久化 `topic_id` 与 `deliverable_id`。
- `runtimeWatch` 在 persisted run 与 explicit in-process run 两条入口上执行同一 locator integrity rule。
- 只给 workspace/topic/deliverable 而不带 run identity 时，仍允许 deliverable-level review watch。
- CLI `review watch` 与 MCP `runtime_watch` 在 locator mismatch 时共享 fail-closed behavior。

这些事实只说明当时 runtimeWatch locator hardening 已吸收。它不能恢复为 current follow-on board、generated `domain_action_adapter` default dispatch、runtime owner proof、visual ready、exportable、handoffable、domain ready 或 production ready evidence。

## Current Owner Read

| Theme | Current owner |
| --- | --- |
| runtimeWatch / locator support | `docs/runtime/`, runtime-program contracts, CLI/MCP behavior, source/tests |
| operator quickstart | `docs/product/human_quickstart.md` |
| RCA completion and open gaps | `docs/active/rca-ideal-state-gap-plan.md` |

## No-Resurrection Rule

不要把本文恢复成当前 run record schema, locator mismatch checklist, CLI/MCP behavior spec, follow-on board, verification list 或 Agent prompt。需要推进 runtimeWatch / locator integrity 时，回到 current runtime owner docs、contracts/source/tests、CLI/MCP behavior、runtime artifacts、owner receipts 和 typed blockers。
