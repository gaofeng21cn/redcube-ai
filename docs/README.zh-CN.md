# 文档索引

[English](./README.md) | **中文**

这里是 `RedCube AI` 的双语文档索引，也是默认对外公开面。
内容与当前真相重置保持一致：该项目在共享 `Unified Harness Engineering Substrate` 上承载视觉交付的 `Domain Harness OS`，仓库已经有可用的本地 runtime 基线，但**还没有**真正完成上游 `Hermes-Agent` 集成。其 formal-entry matrix 固定为默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`，当前仓库主线按 `Auto-only` 理解。

## 核心维护工作集

在阅读详细 program brief 之前，先看这里：

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)

## 默认对外双语公开面

- [仓库首页](../README.zh-CN.md)

这份索引和仓库首页共同构成默认的 GitHub 双语对外面。任何面向公众的详细文档都应出现在这里，并配套中英文版本。

## 当前主线状态

当前交付主线已经稳定可用，但 runtime 叙事仍处在过渡期。
Phase 2 的 source-truth、governance、operator-surface 与 runtime-watch 工作继续作为 absorbed provenance 保留。
当前最诚实的停车边界是：本地 managed runtime 基线已落地，但上游 `Hermes-Agent` 集成仍待后续真实 pilot。

## 当前基线、长线目标与任务层级

- 当前 repo-verified 基线：repo-local managed runtime + 本地 operator host 仍是今天可验证的执行形态。
- 长线目标：runtime substrate 迁向上游 `Hermes-Agent`，但 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不变。
- 当前已冻结的下一道闸门：[Upstream Hermes-Agent activation package](program/upstream_hermes_agent_activation_package.md)
- 当前停车边界：managed family closure truth 已落地；若要继续推进 managed web runtime control plane、新 family 或 academic poster 语义，必须先冻结新的 activation package。
- `docs/program/hermes/*` 这组历史材料现在只作为本地迁移工件与 provenance，不得再被读成“上游 `Hermes-Agent` 已经接管 runtime”。

## 仓库跟踪的内部操作文档

### 面向人类操作同事

- [人类快速上手](human_quickstart.md)
- [典型交付示例](deliverable_examples.md)
- [稳定交付手工测试 brief](stable_deliverable_manual_test_brief.md)（历史 program 证据）

### 本地 runtime 迁移工件与 provenance

- [历史本地迁移工件：Hermes runtime substrate activation package](program/hermes/hermes_runtime_substrate_activation_package.md)
- [历史本地迁移工件：Hermes runtime capability extraction map](program/hermes/hermes_runtime_capability_extraction_map.md)
- [历史本地迁移工件：Hermes runtime substrate canonical closure](program/hermes/hermes_runtime_substrate_canonical_closure.md)
- [Hermes stable family closure truth](program/hermes/hermes_stable_family_closure_truth.md)
- [Hermes managed family closure truth](program/hermes/hermes_managed_family_closure_truth.md)
- [Phase 2 activation package freeze](program/phase-2/phase_2_source_intake_activation_package_freeze.md)
- [Phase 2 source intake + shared source truth baseline](program/phase-2/phase_2_source_intake_shared_source_truth_baseline.md)
- [Phase 2 review / export / gate / audit hardening](program/phase-2/phase_2_review_export_gate_audit_hardening.md)
- [Phase 2 family source-truth consumption convergence](program/phase-2/phase_2_family_source_truth_consumption_convergence.md)
- [Phase 2 publication projection / delivery contract convergence](program/phase-2/phase_2_publication_projection_delivery_contract_convergence.md)
- [Phase 2 direct-delivery operator handoff hardening](program/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md)
- [Phase 2 direct-delivery lifecycle stage convergence](program/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md)
- [Phase 2 source-readiness deep research trigger + gate convergence](program/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md)
- [Source-readiness deep research longrun target state](source_readiness_deep_research_longrun_target_state.md)（future-facing 目标态文档）
- [Direct-delivery longrun target state](direct_delivery_longrun_target_state.md)（future-facing 目标态文档）
- [Phase 2 workspace / operator quickstart convergence](program/phase-2/phase_2_workspace_operator_quickstart_convergence.md)（已吸收 provenance）
- [Phase 2 operator surface consistency hardening](program/phase-2/phase_2_operator_surface_consistency_hardening.md)（已吸收 provenance）
- [Phase 2 runtime watch locator integrity hardening](program/phase-2/phase_2_runtime_watch_locator_integrity_hardening.md)（已吸收 provenance）
- [Phase 2 family parity governance surface convergence](program/phase-2/phase_2_family_parity_governance_surface_convergence.md)（已吸收 provenance）

### 面向技术协作 / Agent 执行者

- [运行架构](runtime_architecture.md)
- [机器可读合同说明](../contracts/README.md)
- [Source Augmentation / Deep Research 执行器合同](source_augmentation_executor_contract.md)
- [Domain Harness OS 定位映射](domain-harness-os-positioning.md)
- [GitHub 公开发布流程](public-github-publish.md)

### 私有 / 本地配置文档

- [私有作者信息与 prompts 配置](private-profile-setup.md)

## 稳定内部规则

- [内部规则索引](policies/README.md)
- [运行模型规则](policies/runtime_operating_model.md)
- [交付合同模型规则](policies/deliverable_contract_model.md)

## 仓库历史

- [更新日志](../CHANGELOG.md)

## 文档边界

- `README*` 与 `docs/README*`：默认双语对外公开面。
- `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`：AI / 维护者核心工作集。
- `docs/program/*/*.md`：repo-tracked 的 program brief。
- 详细 `docs/*.md`：默认仓库跟踪的内部操作文档，中文为主。
- `docs/policies/`：稳定内部规则，默认中文维护。
- `docs/superpowers/`：现有 repo-tracked 设计档案可保留为内部历史材料；新增本地 AI / Superpowers 草稿默认不进入跟踪。
