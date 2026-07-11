# Phase 2 Operator Surface Consistency Hardening

Owner: `RedCube AI`
Purpose: `historical_phase_2_operator_surface_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 tranche brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts、typed blockers 和当前 owner docs。

## Lifecycle

本文只保存 operator-surface consistency hardening 的历史 provenance。它不再是当前 operator route guide、CLI help contract、runtimeWatch locator contract、test lane、absorption gate 或 implementation checklist。

现行 operator truth 回到 `docs/product/human_quickstart.md`、CLI/MCP behavior、runtimeWatch contracts/source/tests、`docs/runtime/`、`docs/status.md`、runtime artifacts、owner receipts 和 typed blockers。

## Historical Fact

这条 absorbed tranche 当时收紧了三类历史边界：

- `workspace doctor` 只承担诊断角色，并把 brand-new workspace 指向 Source Readiness bootstrap，而不是不存在的 init 命令。
- command-scoped CLI help 应返回 machine-readable help surface，而不是执行真实 bootstrap、audit 或 route run。
- `CLI review watch` 与 `MCP runtime_watch` 围绕同一 workspace/topic/deliverable/run locator 和 `runtimeWatch` governance truth 收口。

这些事实只说明当时 operator-surface hardening 已吸收。它们不能声明 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete，也不能替代当前 CLI/MCP behavior 或 runtimeWatch source/tests。

## Current Owner Read

| Theme | Current owner |
| --- | --- |
| human/operator quickstart | `docs/product/human_quickstart.md`, CLI help, source/tests |
| runtimeWatch / locator truth | `docs/runtime/`, runtime-program contracts, runtime-family source/tests |
| RCA completion and open gaps | `docs/active/rca-ideal-state-gap-plan.md` |

## No-Resurrection Rule

不要把本文恢复成当前 workspace doctor 行为说明、CLI help spec、runtimeWatch locator checklist、test command list、operator prompt 或 readiness evidence。需要推进 operator surface 时，回到 current product/runtime owner docs、contracts/source/tests、CLI/MCP behavior、runtime artifacts、owner receipts 和 typed blockers。
