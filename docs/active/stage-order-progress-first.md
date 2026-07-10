# RCA Stage 顺序与 Progress-first

Owner: `RedCube AI`
Purpose: `stage_order_and_progress_first_active_contract_note`
State: `active`
Machine boundary: 本文是人读 active 说明；机器真相归 canonical stage descriptor、生成的 stage control plane、hydrated overlay contract 与 product-entry 行为。

## 单一顺序真相

- 6 个 top-level Stage 的 canonical descriptor source 是 `agent/stages/manifest.json`；每个 Stage 显式声明 `next_stage_refs`、`handoff` 和 `allowed_action_refs`。
- Action 语义的 canonical source 是 `packages/redcube-domain-entry/src/actions/family-action-catalog.ts`；`contracts/action_catalog.json` 只保存 tracked projection。`standard-stage-pack.v2` 下每个 mutating Action 都声明 `ordered_stage_attempts_no_skip` route，route 覆盖与 manifest allow-list 双向一致；read-only Action 不声明 route。
- OPL Framework 从 manifest 编译 hosted `family_stage_control_plane`。RCA 的 `buildRedCubeFamilyStageControlPlaneContract()` 也只消费同一 manifest，为现有 repo-local consumer 生成 compatibility projection。
- `contracts/stage_control_plane.json` 是 tracked compatibility projection；其中 RCA-owned Stage 语义、strategy refs、顺序与 handoff 来自 manifest，OPL 标准 conformance 字段继续归 Framework floor。该 aggregate 不单独手写或反向定义 Stage 顺序。
- deliverable route 的执行顺序归 hydrated overlay `stage_sequence`：`stages` 是主序列，`alternate_stages` 是显式替代路线，`requires_stages` 是依赖恢复依据。

## Product-entry 语义

- `invoke_product_entry` 的 top-level Action route 从 `source_intake` 无跳步推进到 `review_and_revision`；`package_and_handoff` 是显式可选的后续终点，因此合法 terminal 是 review gate 或完成 package handoff。该合同描述跨 top-level Stage 的完成边界。
- delivery request 的 `route` / `stop_after_stage` 描述 hydrated overlay 内的 deliverable stage 定点执行，不得反向改写 top-level Action route。
- 没有 route/stop 时，OPL stage execution plan 返回完整主序列。
- 主序列 route 或 stop 返回从起点到目标的正常前缀。
- alternate route 返回该 route 及其传递依赖，不静默改跑完整默认链。
- 显式 stop 位于 route 之前，或 route/stop 之间不存在有向顺序时，product-entry 在提交 provider attempt 前 fail closed。

## Progress-first

Progress-first 适用于合法 Stage attempt 内的推进：普通缺口应优先形成可修复 delta、route-back ref、owner receipt、typed blocker 或 human gate。它不允许把非法 route/stop 顺序、未知 Stage 或依赖环降级成完整默认链；这些输入会改变执行目标，必须先 fail closed。

## 模块边界

- 主模块：RCA 持有 Stage 语义、route contract、visual truth、review/export verdict 与 handoff refs。
- 协同模块：OPL Framework 消费 descriptor refs、生成/托管 stage-control surface 并调度 stage attempt。
- 不触碰：RCA 不新增 repo-local runner、queue、gate wrapper 或第二套 Stage 聚合。
