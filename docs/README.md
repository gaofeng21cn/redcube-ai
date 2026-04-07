# Docs

**English** | [中文](./README.zh-CN.md)

This bilingual index is the default public surface for `RedCube AI`.
It stays aligned with the product truth: `RedCube AI` is the visual-deliverable `Domain Harness OS` on the shared `Unified Harness Engineering Substrate`, running via the `Codex-default host-agent runtime` with repo-verified formal entry surfaces `MCP` and `CLI`; `controller` is not a repo-verified independent entry in the current mainline.

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
- [Stable deliverable manual test brief](stable_deliverable_manual_test_brief.md)
- [Phase 2 activation package freeze](phase_2_source_intake_activation_package_freeze.md) (Chinese only)
- [Phase 2 source intake + shared source truth baseline](phase_2_source_intake_shared_source_truth_baseline.md) (Chinese only)

### For technical collaborators / agent executors

- [Runtime architecture](runtime_architecture.md)
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
