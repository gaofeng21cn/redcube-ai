# Docs Guide

**English** | [中文](./README.zh-CN.md)

This directory is the technical reading layer for `RedCube AI`.
The repository home should stay readable for experts and potential users.
This guide is for readers who need the repo-tracked program, references, policies, and technical truth behind that public entry.

## Start Here By Audience

| Audience | Start here | Why |
| --- | --- | --- |
| Potential users and domain experts | [Repository home](../README.md) | Understand what the visual-deliverable line is for before reading technical internals |
| Technical readers and planners | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md), [Contracts Overview](../contracts/README.md) | Get the current truth, boundaries, and mainline direction quickly |
| Developers and maintainers | `docs/program/`, `docs/references/`, `docs/policies/`, `docs/history/` | Inspect current technical records, supporting references, rules, and historical material |

## Current Baseline

- `RedCube AI` is the admitted visual-deliverable domain line in the broader `OPL` family.
- The truthful execution line now reads as a three-layer contract: `Hermes-Agent` owns long-running managed-runtime hosting, `RedCube AI` owns visual-domain governance/truth, and the default concrete executor remains local `Codex CLI` host-agent runtime.
- The repo-verified lightweight product-entry service surfaces are landed, while a mature end-user web shell is still future work.
- Protected creative stages now stay on `runtime-family + Codex CLI structured generation`; repo-local `pack/compiler` authorship is no longer the active mainline.
- `Deep Research` remains inside `Source Readiness`, and the public entry wording still has to keep `operator entry`, `agent entry`, and the thin product-entry surface separate.

## Technical Working Set

Read these first before changing repo state:

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)
- [Contracts Overview](../contracts/README.md)

## Default Public Surface

- [Repository home](../README.md)

The repository home plus this guide are the default public entry surfaces.
Public-facing material should stay mirrored in English and Chinese where applicable.

## Repo-Tracked Technical Docs

### Program and mainline records

- [Upstream Hermes-Agent final target shape](program/upstream_hermes_agent_final_target_shape.md)
- [Upstream Hermes-Agent activation package](program/upstream_hermes_agent_activation_package.md)
- [Upstream Hermes-Agent service-safe domain entry](program/upstream_hermes_agent_service_safe_domain_entry.md)
- [RedCube Product Entry MVP](program/redcube_product_entry_mvp.md)
- [OPL Gateway Federated Product Entry](program/opl_gateway_federated_product_entry.md)
- [Managed Product Entry Hardening](program/managed_product_entry_hardening.md)
- [Upstream Hermes-Agent live verification closeout](program/upstream_hermes_agent_live_verification_closeout.md)

Current public entry truth still starts from `operator entry`, `agent entry`, and one thin service-level `product entry`.
That program set still includes the RedCube product entry MVP before the managed hardening tranche.

### Source Readiness and absorbed phase-2 provenance

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

### Future-facing design target

- [Source Readiness Deep Research Longrun Target State](source_readiness_deep_research_longrun_target_state.md) (future-facing design target)
- [Direct Delivery Longrun Target State](direct_delivery_longrun_target_state.md) (future-facing design target)

### References

- [Lightweight product entry and OPL handoff](references/lightweight_product_entry_and_opl_handoff.md)
- [OPL managed runtime three-layer contract](references/opl_managed_runtime_three_layer_contract.md)
- [Series doc governance checklist](references/series-doc-governance-checklist.md)
- [Runtime architecture](runtime_architecture.md)
- [Domain Harness OS positioning map](domain-harness-os-positioning.md)
- [Public GitHub publishing](public-github-publish.md)

### Policies

- [Policies index](policies/README.md)
- [Runtime operating model policy](policies/runtime_operating_model.md)
- [Deliverable contract model policy](policies/deliverable_contract_model.md)

### History

- [Changelog](../CHANGELOG.md)
- [History index](history/README.md)
- `program/hermes/`
- `docs/program/*/*.md`

## Documentation Rules

- Keep [Repository home](../README.md) understandable for experts and non-technical collaborators.
- Keep the default public docs mirrored in English and Chinese where they are part of the public surface.
- Keep repo-tracked program and reference material technical without letting it replace the public home page.
- Keep historical materials available, but do not present them as the active default workflow.

## Governance

- Documentation governance freezes in [series doc governance checklist](references/series-doc-governance-checklist.md), the technical working set, and repo-tracked contract/doc surfaces rather than in `AGENTS.md` alone.
- `README*` and `docs/README*` are the default public entry.
- `docs/program/*` carries repo-tracked mainline and tranche records.
- `docs/references/*` carries supporting technical references.
- `docs/policies/*` carries stable internal rules.
- `docs/history/*` remains historical material.
