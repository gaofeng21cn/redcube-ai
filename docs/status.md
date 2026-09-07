# RedCube AI 当前状态

本页只报告源码事实和证据边界；剩余工作的 owner、下一动作和关闭条件见 [未完成验收](./active/rca-ideal-state-gap-plan.md)。

## 当前源码

- `contracts/opl_agent_package_manifest.json` 声明 Package `rca`、当前 Codex carrier 和稳定 entrypoints；source version 从该文件及同步的 Node/Python/Plugin declarations 读取。
- `agent/` 为声明式 visual pack；`contracts/action_catalog.json` 提供完整交付、image proof 和 native proof 的 hosted action binding。
- `contracts/generated_surface_handoff.json` 的 repo-local handler targets 为空，`structural_cutover_complete=true`，`production_evidence_complete=false`。
- `contracts/functional_privatization_audit.json` 仅保留 visual authority decisions 与 Python native helpers；物理源码归属由 `contracts/physical_source_morphology_policy.json` 声明。旧私有 CLI、domain-entry、runtime、governance 和 overlay roots 已不存在。
- 当前 manifest 仍包含 source-contract、carrier、health/proof 与 clean-runner metadata。它们不能单独证明完整 installed truth、发布 currentness 或 executor readiness；跨仓 consumer 的现状必须由其 owner fresh 读取。

## 领域证据

`contracts/live_stage_run_progress_evidence.json` 记录
`post_standardization_live_stage_evidence_required` typed blocker，
owner、quality/export、long-soak 和 no-regression refs 尚为空，并明确
`domain_ready=false`、`production_ready=false`。

原生 PPT 实现已提供 typed materialization、template preservation、package readback、编辑回归与 parity evaluator 的源码面。`contracts/runtime-program/ppt-master-learning-landing.json` 已区分当前上游学习和历史 blind benchmark pin；这些实现不证明跨 viewer 实测、同源双跑盲评或 RCA parity receipt 已完成。

`contracts/memory_descriptor.json` 当前状态为
`descriptor_proof_contract_landed_runtime_writeback_pending`。descriptor 和 refs-only fixture 不能证明真实 memory body migration、writeback 或 scaleout 已完成。

## 验证边界

`scripts/verify.sh` 是默认源码验证入口，lane 由 `scripts/test-registry.ts` 定义。
`npm run private-platform:readback` 读取结构退役状态；`npm run typecheck` 检查类型。
这些检查只证明源码和声明，不证明真实安装、公开发布或视觉交付。

安装和发布结论需要完整 carrier installed/callable readback、实际 executor route，以及 owner immutable revision、RCA channel `latest-stable` 和匿名 exact-digest readback。真实领域结论还需要 hosted StageRun、artifact lineage、RCA review/export 和 owner receipt。本页不保存版本化 tag、SHA、测试计数或某台机器的历史快照。
