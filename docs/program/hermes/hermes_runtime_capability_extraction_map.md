# Hermes Runtime Capability Extraction Map

## 目标

把哪些能力必须迁入 Hermes substrate、哪些仍留在 RedCube domain、哪些仍是 family-specific surface，用能直接指导实现的方式冻结下来。

## 迁入 Hermes substrate 的能力

### 1. Route run session envelope

- 代码面：`packages/redcube-runtime/src/deliverable-routes.js`、`packages/redcube-runtime/src/index.js`、`packages/redcube-hermes-substrate/src/index.js`
- Hermes 负责：run start / complete / fail、event append / read、runtime topology 落盘、run telemetry identity
- 必须保持：`run_id` 不变；`topic_id` / `deliverable_id` 不丢；fail-closed 行为不退化

### 2. Executor identity and bridge projection

- 代码面：`packages/redcube-runtime/src/executors.js`、`packages/redcube-runtime/src/managed-deliverable.js`
- Hermes 负责：当前主执行 substrate 身份、compatibility adapter 切换回 primary substrate 的控制语义
- Codex-local host-agent 只保留：transition deployment host / regression bridge / development shell

### 3. Shared runtime topology surface

- 代码面：`packages/redcube-overlay-core/src/contracts.ts`、governance review/audit/watch/projection surface
- Hermes 负责：统一输出 `runtime_topology`
- 必须保持：所有 stable family 看到的是同一份 topology truth

## 仍属于 RedCube domain logic 的能力

- workspace contract 与 durable identity
- Source Readiness 与 shared source truth
- gate semantics、review truth、publication projection
- direct-delivery vs human-publication family ontology

## 暂不抽成 substrate 的 family-specific surface

- `ppt_deck`：`detailed_outline`、`slide_blueprint`、`export_pptx`
- `xiaohongshu`：`single_note_plan`、`publish_copy`、human-publication projection
- `poster_onepager`：`poster_blueprint`、knowledge-poster guard

## 明确不提前抽象的内容

- academic poster contract
- managed web runtime control plane
- family-specific narrative recipe selection
- 任何会改写既有 durable truth 的“桥接层假统一”
