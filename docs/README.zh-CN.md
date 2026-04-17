# 文档索引

[English](./README.md) | **中文**

这个目录是 `RedCube AI` 的第二层技术阅读面。
仓库首页应优先写给专家、潜在用户和非技术协作者。
而这里负责承接其后的 program、references、policies 和技术真相材料。

## 按读者类型进入

| 读者 | 建议起点 | 目的 |
| --- | --- | --- |
| 潜在用户与领域专家 | [仓库首页](../README.zh-CN.md) | 先理解这条视觉交付主线是干什么的，再决定是否进入技术细节 |
| 技术规划者、架构读者、方向同步读者 | [项目概览](./project.md)、[当前状态](./status.md)、[架构](./architecture.md)、[硬约束](./invariants.md)、[关键决策](./decisions.md)、[合同说明](../contracts/README.md) | 快速抓住当前真相、边界和主线方向 |
| 开发者与维护者 | `docs/program/`、`docs/references/`、`docs/policies/`、`docs/history/` | 查看当前技术记录、支持性参考、规则和历史材料 |

## 当前基线

- `RedCube AI` 是 `OPL` 家族中当前已 admitted 的视觉交付 domain 主线。
- 当前最诚实的执行主线，已经按三层 contract 理解：`Hermes-Agent` 持有长期托管与 managed-runtime owner，`RedCube AI` 持有 visual-domain governance / truth，而默认 concrete executor 仍是本地 `Codex CLI` host-agent runtime。
- 当前 repo-verified 的 lightweight product-entry service surface 已落地，但成熟 end-user web 壳仍是后续工作。
- 当前受保护创作 stage 统一收口在 `runtime-family + Codex CLI structured generation`，repo-local `pack/compiler` 作者化路径已不再是 active mainline。
- `Deep Research` 继续属于 `Source Readiness`，而公开入口 wording 仍要把 `operator entry`、`agent entry` 和那层薄的 product-entry service surface 分开写清。

## 技术工作集

开始改仓库状态前，先读这些文件：

- [项目概览](./project.md)
- [当前状态](./status.md)
- [架构](./architecture.md)
- [硬约束](./invariants.md)
- [关键决策](./decisions.md)
- [合同说明](../contracts/README.md)

## 默认公开入口

- [仓库首页](../README.zh-CN.md)

仓库首页和这份索引共同构成默认公开入口。
对外文档应在适用时保持中英双语镜像。

## 仓库跟踪的技术文档

### Program 与主线记录

- [Upstream Hermes-Agent final target shape](program/upstream_hermes_agent_final_target_shape.md)
- [Upstream Hermes-Agent activation package](program/upstream_hermes_agent_activation_package.md)
- [Upstream Hermes-Agent service-safe domain entry](program/upstream_hermes_agent_service_safe_domain_entry.md)
- [RedCube Product Entry MVP](program/redcube_product_entry_mvp.md)
- [OPL Gateway Federated Product Entry](program/opl_gateway_federated_product_entry.md)
- [Managed Product Entry Hardening](program/managed_product_entry_hardening.md)
- [Upstream Hermes-Agent live verification closeout](program/upstream_hermes_agent_live_verification_closeout.md)

当前公开入口真相仍从 `operator entry`、`agent entry` 和一层薄的 service-level `product entry` 开始。

### Source Readiness 与已吸收的 Phase 2 provenance

- [Source augmentation executor contract](source_augmentation_executor_contract.md)
- [Phase 2 source intake activation package freeze](program/phase-2/phase_2_source_intake_activation_package_freeze.md)
- [Phase 2 source intake shared source truth baseline](program/phase-2/phase_2_source_intake_shared_source_truth_baseline.md)
- [Phase 2 review export gate audit hardening](program/phase-2/phase_2_review_export_gate_audit_hardening.md)
- [Phase 2 publication projection delivery contract convergence](program/phase-2/phase_2_publication_projection_delivery_contract_convergence.md)
- [Phase 2 family source-truth consumption convergence](program/phase-2/phase_2_family_source_truth_consumption_convergence.md)
- [Phase 2 direct delivery operator handoff hardening](program/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md)
- [Phase 2 direct delivery lifecycle stage convergence](program/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md)
- [Phase 2 source readiness deep research trigger gate convergence](program/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md)
- [Phase 2 workspace operator quickstart convergence](program/phase-2/phase_2_workspace_operator_quickstart_convergence.md)
- [Phase 2 operator surface consistency hardening](program/phase-2/phase_2_operator_surface_consistency_hardening.md)
- [Phase 2 runtime watch locator integrity hardening](program/phase-2/phase_2_runtime_watch_locator_integrity_hardening.md)

### future-facing 目标态文档

- [Source Readiness Deep Research Longrun Target State](source_readiness_deep_research_longrun_target_state.md)（future-facing 目标态文档）
- [Direct Delivery Longrun Target State](direct_delivery_longrun_target_state.md)（future-facing 目标态文档）

### 参考资料

- [轻量产品入口与 OPL Handoff](references/lightweight_product_entry_and_opl_handoff.md)
- [OPL 托管运行时三层合同](references/opl_managed_runtime_three_layer_contract.md)
- [系列项目文档治理清单](references/series-doc-governance-checklist.md)
- [运行架构](runtime_architecture.md)
- [Domain Harness OS 定位映射](domain-harness-os-positioning.md)
- [GitHub 公开发布流程](public-github-publish.md)

### 内部规则

- [内部规则索引](policies/README.md)
- [运行模型规则](policies/runtime_operating_model.md)
- [交付合同模型规则](policies/deliverable_contract_model.md)

### 历史材料

- [更新日志](../CHANGELOG.md)
- `docs/history/`
- `program/hermes/`
- `docs/program/*/*.md`

## 文档规则

- 继续把 [仓库首页](../README.zh-CN.md) 保持成专家和非技术协作者可读的入口。
- 继续把默认公开文档在适用时保持成中英双语镜像。
- program 和 reference 材料可以技术化，但不能再取代公开首页。
- 历史材料可以保留，但不能再写成当前默认 workflow。

## 治理说明

- 文档治理统一冻结在 [系列项目文档治理清单](references/series-doc-governance-checklist.md)、技术工作集和仓库跟踪的 contract/doc surface 中，而不再只写在 `AGENTS.md`。
- `README*` 与 `docs/README*` 是默认公开入口。
- `docs/program/*` 承载 repo-tracked mainline 与 tranche 记录。
- `docs/references/*` 承载支持性技术参考。
- `docs/policies/*` 承载稳定内部规则。
- `docs/history/*` 继续只作历史材料。
