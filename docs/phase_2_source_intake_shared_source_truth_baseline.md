# Phase 2 Source Intake + Shared Source Truth Baseline

日期锚点：`2026-04-07`

当前这份文档记录的是已经吸收到主线的最小 baseline：

- `source intake`
- `shared source truth`

它已经不是 activation-package freeze，
但也不是“整个 Phase 2 都已完成”。

## 当前结论

- `Phase 1`：已完成并冻结
- `P0`：已完成，`green baseline credible = true`
- `stable deliverable manual-test-driven hardening`：已完成并吸收到 `main`
- `Phase 2 activation package freeze`：已完成并吸收到 `main`
- 当前 active tranche：`Phase 2 source intake + shared source truth baseline`
- formal entry：仍只有 `MCP / CLI`
- `controller`：仍不是 repo-verified formal entry

## 这条 baseline 已经把什么纳入正式主线

1. `CLI / MCP` 的 `source intake` 正式成为 `Source Readiness` 的 baseline surface
2. canonical quartet 固定为：
   - `source-index.json`
   - `extracted-materials.json`
   - `source-audit.json`
   - `source-brief.json`
3. `legacy import` 与普通 intake 走同一 canonical path
4. `ppt_deck` / `xiaohongshu` 在同一 substrate 上通过 hydrated contract 消费 `shared_source_truth`
5. review / audit / gate surface 继续围绕 hydrated truth，而不是 prompt patch

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

- `Phase 2` 更大范围的 review / export / gate / audit hardening
- source readiness 更深层的扩展与强化
- 新 family / overlay 扩张
- poster academic contract 主线
- OPL federation

## 最小 closeout evidence

- `contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json`
- `contracts/runtime-program/current-program.json`
- `tests/phase-2-source-intake-shared-source-truth-baseline.test.js`
- `tests/source-intake.test.js`
- `tests/import-legacy-project.test.js`
- `tests/ppt-deliverable-e2e.test.js`
- `tests/xiaohongshu-deliverable-e2e.test.js`

## 当前下一候选 tranche

- `phase_2_review_export_gate_audit_hardening`
