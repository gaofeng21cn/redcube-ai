# 文档索引

[English](./README.md) | **中文**

这里是 `RedCube AI` 的双语文档索引，也是默认对外公开面。
内容与产品真相保持一致：该项目在共享 `Unified Harness Engineering Substrate` 上承载视觉交付的领域承载操作系统（Domain Harness OS），本地执行呈现为 Codex 默认 host-agent runtime；其 formal-entry matrix 固定为默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`，当前仓库主线按 `Auto-only` 理解。

## 统一文档治理

- 所有对外文档都必须同时提供英文 `.md` 与中文 `.zh-CN.md`，并保持同步更新。
- 内部设计、规划、操作备忘等内容默认使用中文，除非明确提升到公开面再补充英文。
- 术语可以保留英文，但要避免无意义的中英混写，保证语言连贯。
- `docs/README*` 的结构与措辞应统一，帮助读者区分公开面与内部内容。
- 详情可查阅 [文档治理规则](documentation-governance.md)。

## 默认对外双语公开面

- [仓库首页](../README.zh-CN.md)

这份索引和仓库首页共同构成默认的 GitHub 双语对外面。任何面向公众的详细文档都应出现在这里，并配套中英文版本。

## 当前主线状态

当前仓库已吸收的 tranche 是 `Phase 2 / runtime watch locator integrity hardening`。
`operator surface consistency hardening` 继续作为同一主线上的 absorbed provenance，而 `runtime watch locator integrity hardening` 已成为当前已吸收 tranche。
同一主线的下一段继续面也已预冻结为 `family parity / autopilot continuity`，第一条允许打开的 follow-on tranche 固定是 `phase_2_family_parity_governance_surface_convergence`。

## 仓库跟踪的内部操作文档

### 面向人类操作同事

- [人类快速上手](human_quickstart.md)
- [典型交付示例](deliverable_examples.md)
- [稳定交付手工测试 brief](stable_deliverable_manual_test_brief.md)（历史 program 证据）

### 主线 program 工件与 provenance

- [Phase 2 activation package freeze](phase_2_source_intake_activation_package_freeze.md)
- [Phase 2 source intake + shared source truth baseline](phase_2_source_intake_shared_source_truth_baseline.md)
- [Phase 2 review / export / gate / audit hardening](phase_2_review_export_gate_audit_hardening.md)
- [Phase 2 family source-truth consumption convergence](phase_2_family_source_truth_consumption_convergence.md)
- [Phase 2 publication projection / delivery contract convergence](phase_2_publication_projection_delivery_contract_convergence.md)
- [Phase 2 direct-delivery operator handoff hardening](phase_2_direct_delivery_operator_handoff_hardening.md)
- [Phase 2 direct-delivery lifecycle stage convergence](phase_2_direct_delivery_lifecycle_stage_convergence.md)
- [Phase 2 source-readiness deep research trigger + gate convergence](phase_2_source_readiness_deep_research_trigger_gate_convergence.md)
- [Source-readiness deep research longrun target state](source_readiness_deep_research_longrun_target_state.md)（future-facing 目标态文档）
- [Direct-delivery longrun target state](direct_delivery_longrun_target_state.md)（future-facing 目标态文档）
- [Phase 2 workspace / operator quickstart convergence](phase_2_workspace_operator_quickstart_convergence.md)（已吸收 provenance）
- [Phase 2 operator surface consistency hardening](phase_2_operator_surface_consistency_hardening.md)（已吸收 provenance）
- [Phase 2 runtime watch locator integrity hardening](phase_2_runtime_watch_locator_integrity_hardening.md)（当前已吸收 tranche）
- [Phase 2 family parity / autopilot continuation board](phase_2_family_parity_autopilot_continuation_board.md)（已预冻结的 follow-on board）
- [Phase 2 family parity governance surface convergence](phase_2_family_parity_governance_surface_convergence.md)（第一条已预冻结的 follow-on tranche）

### 面向技术协作 / Agent 执行者

- [运行架构](runtime_architecture.md)
- [Source Augmentation / Deep Research 执行器合同](source_augmentation_executor_contract.md)
- [Domain Harness OS 定位映射](domain-harness-os-positioning.md)
- [GitHub 公开发布流程](public-github-publish.md)
- [文档治理规则](documentation-governance.md)

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
- 详细 `docs/*.md`：默认仓库跟踪的内部操作文档，中文为主。
- `docs/policies/`：稳定内部规则，默认中文维护。
- `docs/superpowers/`：本地 AI / Superpowers 的笔记、计划、草案，保持未跟踪。
