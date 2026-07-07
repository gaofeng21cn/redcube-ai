# Hermes Runtime Capability Extraction Map

Owner: `RedCube AI`
Purpose: `historical_hermes_capability_extraction_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档记录 repo-local Hermes migration line 的能力拆解，不代表当前仓库已经把 runtime owner 交给上游 `Hermes-Agent`，也不代表 Hermes 是当前默认 runtime substrate。当前状态以 `docs/status.md`、`docs/architecture.md`、`contracts/runtime-program/current-program.index.json` 和 `contracts/runtime-program/current-program-parts/**` 为准。

## 历史目标

当时的目标是把哪些能力计划迁入 repo-local Hermes migration substrate、哪些仍留在 RedCube domain、哪些仍是 family-specific surface，用能直接指导实现的方式冻结下来。
当前 runtime substrate、default caller、executor adapter 和 physical-delete 口径不从本文读取；请回到核心 docs、active plan、contracts、source/tests、owner receipts 和 typed blockers。

## 当时计划迁入 Hermes migration substrate 的能力

### 1. Route run session envelope

- 代码面：`packages/redcube-runtime/src/deliverable-routes.ts`、`packages/redcube-runtime/src/index.ts`、`packages/redcube-hermes-substrate/src/index.impl.ts`
- 当时 Hermes migration layer 负责：run start / complete / fail、event append / read、runtime topology 落盘、run telemetry identity
- 必须保持：`run_id` 不变；`topic_id` / `deliverable_id` 不丢；fail-closed 行为不退化

### 2. Executor identity and bridge projection

- 代码面：`packages/redcube-runtime/src/executors.ts`、`packages/redcube-runtime/src/managed-deliverable.ts`
- 当时 Hermes migration layer 负责：主执行 substrate 身份、compatibility adapter 切换回 primary substrate 的控制语义
- 当时 Codex-local host-agent 只保留：transition deployment host / regression bridge / development shell

### 3. Shared runtime topology surface

- 代码面：`packages/redcube-overlay-core/src/contracts.ts`、governance review/audit/watch/projection surface
- 当时 Hermes migration layer 负责：统一输出 `runtime_topology`
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

## No-Resurrection Boundary

本文不授权恢复 repo-local Hermes substrate、compatibility adapter、旧 managed runtime owner、generic runtime topology owner 或 public compatibility path。相关当前工作必须由 OPL / Temporal runtime owner、RCA active plan、runtime-program contracts、source/tests、owner receipts 和 typed blockers 重新证明。
