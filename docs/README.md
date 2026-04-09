# Docs

**English** | [中文](./README.zh-CN.md)

This bilingual index is the default public surface for `RedCube AI`.
It stays aligned with the product truth: `RedCube AI` is the visual-deliverable `Domain Harness OS` on the shared `Unified Harness Engineering Substrate`, running via the `Codex-default host-agent runtime`; its formal-entry matrix is `CLI` as default formal entry, `MCP` as supported protocol layer, and `controller` as internal control surface. The current repository mainline is `Auto-only`.

## Unified Documentation Governance

- External documents must ship as paired English `.md` and Chinese `.zh-CN.md` files with synchronized updates.
- Internal design, planning, and operational notes default to Chinese unless explicitly elevated into the bilingual surface.
- Terminology may remain English when it denotes stable domain language, but avoid unnecessary mixed-language prose.
- Keep `docs/README*` consistent so readers can immediately see which content is public bilingual versus internal.
- For more detail, see [Documentation Governance](documentation-governance.md) (Chinese only).

## External Bilingual Surface

- [Repository home](../README.md)

This index along with the repository home forms the default GitHub-facing bilingual surface. Any document meant for external readers must land on this surface with mirrored English and Chinese variants.

## Repo-Tracked Internal Operator Docs

### For human operators

- [Human quickstart](human_quickstart.md)
- [Deliverable examples](deliverable_examples.md)
- [Stable deliverable manual test brief](stable_deliverable_manual_test_brief.md) (historical program evidence, Chinese only)

### Mainline program artifacts and provenance

- [Phase 2 activation package freeze](phase_2_source_intake_activation_package_freeze.md) (Chinese only)
- [Phase 2 source intake + shared source truth baseline](phase_2_source_intake_shared_source_truth_baseline.md) (Chinese only)
- [Phase 2 review / export / gate / audit hardening](phase_2_review_export_gate_audit_hardening.md) (Chinese only)
- [Phase 2 family source-truth consumption convergence](phase_2_family_source_truth_consumption_convergence.md) (Chinese only)
- [Phase 2 publication projection / delivery contract convergence](phase_2_publication_projection_delivery_contract_convergence.md) (Chinese only)
- [Phase 2 direct-delivery operator handoff hardening](phase_2_direct_delivery_operator_handoff_hardening.md) (Chinese only)
- [Phase 2 direct-delivery lifecycle stage convergence](phase_2_direct_delivery_lifecycle_stage_convergence.md) (Chinese only)
- [Phase 2 source-readiness deep research trigger + gate convergence](phase_2_source_readiness_deep_research_trigger_gate_convergence.md) (Chinese only)
- [Source-readiness deep research longrun target state](source_readiness_deep_research_longrun_target_state.md) (future-facing design target, Chinese only)
- [Direct-delivery longrun target state](direct_delivery_longrun_target_state.md) (future-facing design target, Chinese only)

### For technical collaborators / agent executors

- [Runtime architecture](runtime_architecture.md)
- [Source Augmentation / Deep Research executor contract](source_augmentation_executor_contract.md) (Chinese only)
- [Domain Harness OS positioning map](domain-harness-os-positioning.md)
- [Public GitHub publishing](public-github-publish.md)
- [Documentation Governance](documentation-governance.md) (Chinese only)

### Private / local configuration docs

- [Private author profile and prompts setup](private-profile-setup.md)

## Stable Internal Rules

- [Policies index](policies/README.md)
- [Runtime operating model policy](policies/runtime_operating_model.md)
- [Deliverable contract model policy](policies/deliverable_contract_model.md)

## Repository history

- [Changelog](../CHANGELOG.md)

## Documentation Boundary

- `README*` and `docs/README*`: default bilingual public surface.
- Detailed `docs/*.md`: repository-tracked internal/operator documents unless explicitly promoted.
- `docs/policies/`: stable internal rules, Chinese by default.
- `docs/superpowers/`: local AI / Superpowers notes, plans, and drafts; keep them untracked.
