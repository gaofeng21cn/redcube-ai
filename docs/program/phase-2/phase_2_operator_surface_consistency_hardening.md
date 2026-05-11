# Phase 2 Operator Surface Consistency Hardening

生命周期说明：本文是已吸收的 Phase 2 operator-surface hardening brief，保留为 contract-linked provenance。当前 operator truth 以 CLI/MCP surfaces、runtimeWatch 合同、`docs/status.md` 与 `docs/runtime/` 为准。

## 当前状态

本 tranche closeout 已完成并吸收到当前 mainline。当前仓库正式口径是：`workspace doctor` 继续保持诊断角色，command-scoped CLI help 必须 machine-readable 且 `--help` 不执行真实命令，`CLI review watch` / `MCP runtime_watch` 围绕同一 `runtimeWatch` governance truth 收口。

## 冻结目的

这条 same-mainline slice 不再讨论“要不要继续做 workspace/operator quickstart”，而是收紧已经吸收的 quickstart surface，修掉冻结时当前 repo 里仍可观察到的 operator-facing 漂移：

- `workspace doctor` 的 brand-new workspace 推荐动作仍残留过时的 `initialize_workspace_contract` 语义影子，而实际 canonical bootstrap writer 已经是 `source intake / source research`
- `CLI` 顶层 `help` 已存在，但关键子命令上的 `--help` 仍会直接执行命令并返回运行结果或 usage error，而不是稳定的 machine-readable command help
- `CLI review watch` 与 `MCP runtime_watch` 仍未完全围绕同一 `workspace/topic/deliverable/run` locator 收口

## 吸收结论

- `workspace doctor` 继续只做**诊断**；当 workspace 还是 brand-new 时，它必须把 operator 明确引向 `source intake` 或 `source research`，而不是指向不存在的 init 命令
- `workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run` 仍是当前 canonical operator route
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 继续围绕同一 `topic_id` / `deliverable_id` / `run_id` 边界对齐
- `review watch` 与 `runtime_watch` 允许通过同一组 locator 字段落到同一个 `runtimeWatch` gateway truth；预加载 `run` 仅作为显式 in-process 输入，不得再形成漂移的 public operator surface
- command-scoped CLI help 必须 machine-readable，且 `--help` 不得执行真正的 bootstrap、audit 或 route run

## In scope

### 1. Workspace doctor bootstrap guidance hardening

- brand-new workspace 上，`recommended_action` 不再暗示不存在的 `initialize_workspace_contract`
- 诊断输出明确暴露 canonical topics / runs 目录，并把后续动作收紧到 `source intake` / `source research`

### 2. Command help hardening

- 为以下命令冻结 machine-readable command help：
  - `workspace doctor`
  - `source intake`
  - `source research`
  - `deliverable create`
  - `deliverable audit`
  - `deliverable run`
  - `review watch`
- `--help` 必须返回 help surface，而不是执行命令

### 3. CLI / MCP runtime watch boundary convergence

- `CLI review watch` 与 `MCP runtime_watch` 围绕同一 `workspaceRoot/topicId/deliverableId/runId` locator 收口
- `runtimeWatch` 继续输出统一的：
  - `source_readiness_summary`
  - `gate_summary`
  - `operator_handoff`
  - `lifecycle_stage_summary`

## Hard Boundaries

- 不扩展 `controller`
- 不新增 family / overlay
- 不把 `xiaohongshu` 改写成 direct-delivery
- 不推进 academic poster
- 不推进 managed web runtime / OPL-hosted runtime integration

## 预期验证面

- `tests/gateway-actions.test.ts`
- `tests/workspace-operator-quickstart.test.ts`
- `tests/cli-v2-smoke.test.ts`
- `tests/mcp-gateway.test.ts`
- `tests/deliverable-review-loop.test.ts`
- `tests/phase-2-behavior-convergence.test.ts`

## 吸收门槛

- brand-new workspace 的 doctor 输出与 quickstart truth 一致
- 子命令 `--help` 不再执行真正命令
- `CLI review watch` 与 `MCP runtime_watch` 共享同一 locator truth
- governance summaries 没有漂移
