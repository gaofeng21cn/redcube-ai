# Phase 2 Review / Export / Gate / Audit Hardening

Owner: `RedCube AI`
Purpose: `historical_phase_2_review_export_gate_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 tranche brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和 RCA-owned review/export gates。

这份 absorbed tranche 对应的 hardening axis 口径固定为：`review / export / gate / audit hardening`。

日期锚点：`2026-04-08`

生命周期说明：本文是已吸收的 Phase 2 review/export/gate/audit hardening brief，保留为 contract-linked provenance。当前 review verdict、export authority 与 artifact truth 由 RCA-owned review/export surfaces 和 runtime artifacts 持有。

这份文档记录的是已经吸收到同一主线上的一条 hardening tranche：

- `review`
- `export`
- `gate`
- `audit`

它不是：

- `RedCube AI` 的全部长期目标
- `controller` 已经成为正式入口的证明
- 把 academic poster / OPL-hosted runtime integration / managed web runtime 一并写成已完成

## 当前结论

- `source intake + shared source truth` 继续作为稳定 `Source Readiness` 能力面保留在主线
- `auditDeliverable` 现在会读取 canonical `source-audit.json`，在 source readiness 缺失或阻塞时显式 block
- `runtimeWatch` 现在会暴露 `source_readiness_summary` 与 `gate_summary`
- `required_export_bundle` 继续从 hydrated deliverable contract 暴露，而不是靠 prompt-only 推断
- formal entry 仍只有 `MCP / CLI`
- `controller` 仍不是 repo-verified formal entry

## 这条 tranche 实际收紧了什么

### 1. Canonical source readiness gate

权威 gate 仍是：

- `topics/<topic>/canonical/source-audit.json`

现在：

- `auditDeliverable` 会读取它
- `runtimeWatch` 会读取它
- 两者都围绕同一 canonical artifact 输出一致 summary

### 2. Shared governance summaries

当前要求以下 summary 成为共享治理面：

- `source_readiness_summary`
- `quality_summary`
- `gate_summary`

其中 `gate_summary` 至少收口：

- `source_readiness_status`
- `review_status`
- `approval_status`
- `latest_review_stage`
- `export_status`
- `required_export_bundle_id`

### 3. Review / export truth 不再割裂

当前稳定 family 仍是：

- `ppt_deck`
- `xiaohongshu`

它们继续共享：

- `visual_director_review`
- `screenshot_review`
- canonical review state
- hydrated export contract

但各自的导出面仍按 family-specific contract 区分：

- `ppt_deck`：`export_pptx`
- `xiaohongshu`：`export_bundle`

## 仍不在本 tranche 内的内容

- `controller` 扩展
- 新 family / overlay 扩张
- poster academic contract 主线
- OPL-hosted runtime integration
- managed web runtime migration

## 最小 closeout evidence

- `contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json`
- `tests/phase-2-review-export-gate-audit-hardening.test.ts`
- `tests/deliverable-review-loop.test.ts`
- `tests/review-platform.test.ts`
- `tests/ppt-deliverable-surface.test.ts`
- `tests/harness-completion-audit.test.ts`

## 下一候选 tranche

- `phase_2_family_source_truth_consumption_convergence`

它的意义是：

- 继续收紧 family 间的 source-truth consumption
- 不是把当前 absorbed tranche 误写成全部终点
