# Phase 2 Source Intake + Shared Source Truth Baseline

Owner: `RedCube AI`
Purpose: `historical_phase_2_source_truth_baseline_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 baseline brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、workspace artifacts、owner receipts 和当前 source owner docs。

日期锚点：`2026-04-07`

生命周期说明：本文是已吸收的 source intake baseline provenance，保留为 contract-linked Phase 2 记录。当前 source readiness truth 以 canonical workspace artifacts、`docs/source/` 与 runtime-program contracts 为准。

当前这份文档记录的是已经吸收到主线的最小 baseline：

- `source intake`
- `shared source truth`

它已经不是 activation-package freeze，
但也不是“整个 Phase 2 都已完成”。

它现在更准确的角色是：

- 已吸收到 `main` 的 baseline evidence
- 当前主线能力的 provenance 说明面

它不是：

- `RedCube AI` 全部长期目标的代称
- 当前 program 的唯一 operator truth
- 默认要求“停在这里等下一棒人工晋升”的停车令

## 当前结论

- `Phase 1`：已完成并冻结
- `P0`：已完成，`green baseline credible = true`
- `stable deliverable manual-test-driven hardening`：已完成并吸收到 `main`
- `Phase 2 activation package freeze`：已完成并吸收到 `main`
- 当前 active tranche：`Phase 2 direct-delivery lifecycle stage convergence`
- formal entry：仍只有 `MCP / CLI`
- `controller`：仍不是 repo-verified formal entry
- 当前下一方向应理解为同一主线上的持续 hardening，而不是把这份 absorbed baseline 误写成整个项目的终点

## 这条 baseline 已经把什么纳入正式主线

1. `CLI / MCP` 的 `source intake` 正式成为 `Source Readiness` 的 baseline surface
2. canonical quartet 固定为：
   - `source-index.json`
   - `extracted-materials.json`
   - `source-audit.json`
   - `source-brief.json`
3. `ppt_deck` / `xiaohongshu` 在同一 substrate 上通过 hydrated contract 消费 `shared_source_truth`
4. review / audit / gate surface 继续围绕 hydrated truth，而不是 prompt patch

## Formal Entry / Review / Audit / Gate Surface

### Formal Entry

- `MCP`
- `CLI`

### Review Surface

- `visual_director_review`
- `screenshot_review`

### Audit / Gate Surface

- `source-audit.json`
- `auditDeliverable`
- `reviewRenderOutput`
- `runtimeWatch`

## Family 衔接方式

### `ppt_deck`

当前 baseline 要求以下 stages 可消费 `shared_source_truth`：

- `storyline`
- `detailed_outline`
- `slide_blueprint`
- `visual_direction`

### `xiaohongshu`

当前 baseline 要求以下 stages 可消费 `shared_source_truth`：

- `research`
- `storyline`
- `single_note_plan`
- `visual_direction`

## 明确不做

- 不把 `controller` 写成正式入口
- 不把 `RedCube AI` 写成整个 `OPL`
- 不把 poster academic contract 拉回当前 active mainline
- 不用 hidden fallback chains 作为主行为模型
- 不用 prompt patch 代替 contract hydration
- 不把 managed web runtime migration 混入当前 tranche

## 当前仍属后续 tranche 的内容

- source readiness 更深层的扩展与强化
- direct-delivery lifecycle stage convergence
- 新 family / overlay 扩张
- poster academic contract 主线
- OPL-hosted runtime integration

## 最小 closeout evidence

- `contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json`
- `contracts/runtime-program/current-program.json`
- `tests/phase-2-source-intake-shared-source-truth-baseline.test.ts`
- `tests/source-intake.test.ts`
- `tests/ppt-deliverable-e2e.test.ts`
- `tests/xiaohongshu-deliverable-e2e.test.ts`

## 当前下一候选 tranche

- `phase_2_direct_delivery_lifecycle_stage_convergence`

在 `autonomous longrun program mode` 下，这个候选 tranche 的意义是：

- 当前主线在 publication projection / delivery contract convergence 之后继续收紧 direct-delivery operator handoff 的 hardening 方向
- 不是把当前主线重新切成“必须人工点名才允许继续”的停车点
