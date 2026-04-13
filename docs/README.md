# Docs

**English** | [中文](./README.zh-CN.md)

This bilingual index is the default public surface for `RedCube AI`.
It stays aligned with the current truthful mainline: `RedCube AI` is the visual-deliverable `Domain Harness OS` on the shared `Unified Harness Engineering Substrate`; route and managed run surfaces now execute through local Codex CLI host-agent runtime, while visual-domain truth remains local to `RedCube AI`. Its formal-entry matrix is `CLI` as default formal entry, `MCP` as supported protocol layer, and `controller` as internal control surface. The current repository mainline is `Auto-only`.
The current public entry truth is also explicit: `operator entry`, `agent entry`, and a thin repo-verified `product entry` service surface are real today, while a mature end-user product shell is still future work. The current startup self-check surface is `redcube product preflight`, and the current machine-readable discovery surface for that shell is `redcube product manifest`, mirrored by the MCP tool `get_product_entry_manifest`.

## Core Maintainer Working Set

Start here before reading detailed program briefs:

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)

## Default Public Bilingual Surface

- [Repository home](../README.md)

This index along with the repository home forms the default GitHub-facing bilingual surface. Any document meant for external readers must land on this surface with mirrored English and Chinese variants.

## Current Mainline Status

The current deliverable mainline is stable and usable, and the active runtime story has converged onto local Codex CLI host-agent execution.
Phase 2 source-truth, governance, operator-surface, and runtime-watch work remain absorbed provenance.
The current truthful stop boundary is: local Codex CLI run ownership, repo-verified product entry, OPL federation, and managed session continuity are landed, while a mature end-user shell and managed web productization still remain follow-on work.
Protected creative stages for `ppt_deck`, `xiaohongshu`, and `poster_onepager` now stay on `runtime-family + Codex CLI structured generation`; repo-local `pack/compiler` authorship has been removed from the active mainline.

## Current Baseline, Long-Line Target, And Task Ladder

- Current repo-verified baseline: local Codex CLI host-agent runtime owns route / managed run execution, while `RedCube AI` keeps domain truth, operator surfaces, and a thin product-entry service surface.
- Current creative-stage baseline: `pack` remains a domain boundary and pack-id carrier, but no longer acts as a repo-local creative compiler/runtime.
- Long-line target: keep the runtime substrate on Codex-native host-agent execution without changing the `RedCube Gateway -> family / profile / pack -> Domain Harness OS` boundary, while preserving a future managed-web migration path on the same contracts.
- Product-entry target: keep the landed lightweight domain `product entry` callable directly or through `OPL` handoff without changing the visual-domain boundary, then harden it toward a mature end-user shell.
- Current preflight surface: `redcube product preflight` gives hosts the honest startup checks before opening the current direct frontdoor.
- Current discovery surface: `redcube product frontdesk`, `redcube product manifest`, and `get_product_entry_manifest` let hosts discover the current `frontdesk_surface` plus direct / federated / session shell without guessing commands or payload shape, and the manifest/frontdesk now also carry the same `product_entry_preflight` companion.
- Frozen final target shape: [Upstream Hermes-Agent final target shape](program/upstream_hermes_agent_final_target_shape.md) (Chinese only)
- Fastest cutover board: [Upstream Hermes-Agent fast cutover board](program/upstream_hermes_agent_fast_cutover_board.md) (Chinese only)
- Frozen next gate: [Upstream Hermes-Agent activation package](program/upstream_hermes_agent_activation_package.md) (Chinese only)
- Service-safe domain entry adapter: [Upstream Hermes-Agent service-safe domain entry](program/upstream_hermes_agent_service_safe_domain_entry.md) (Chinese only)
- RedCube product entry MVP: [RedCube Product Entry MVP](program/redcube_product_entry_mvp.md) (Chinese only)
- OPL Gateway federated product entry: [OPL Gateway Federated Product Entry](program/opl_gateway_federated_product_entry.md) (Chinese only)
- Managed product-entry hardening: [Managed Product Entry Hardening](program/managed_product_entry_hardening.md) (Chinese only)
- Current F4 live closeout proof: [Upstream Hermes-Agent live verification closeout](program/upstream_hermes_agent_live_verification_closeout.md) (Chinese only)
- Historical F4 live blocker freeze: [Upstream Hermes-Agent live verification blocker](program/upstream_hermes_agent_live_verification_blocker.md) (Chinese only)
- Current stop boundary: managed family closure truth is landed; any move into managed web runtime control-plane work, new family onboarding, or academic-poster semantics needs a new activation package first.
- Historical `docs/program/hermes/*` materials now serve as local migration artifacts and provenance only; they must not be read as proof that upstream `Hermes-Agent` already owns the runtime.

## Repo-Tracked Internal Docs

### For human operators

- [Human quickstart](human_quickstart.md)
- [Deliverable examples](deliverable_examples.md)
- [Stable deliverable manual test brief](stable_deliverable_manual_test_brief.md) (historical program evidence, Chinese only)

### Historical local-runtime migration artifacts and provenance

- [Historical local migration artifact: Hermes runtime substrate activation package](program/hermes/hermes_runtime_substrate_activation_package.md) (Chinese only)
- [Historical local migration artifact: Hermes runtime capability extraction map](program/hermes/hermes_runtime_capability_extraction_map.md) (Chinese only)
- [Historical local migration artifact: Hermes runtime substrate canonical closure](program/hermes/hermes_runtime_substrate_canonical_closure.md) (Chinese only)
- [Hermes stable family closure truth](program/hermes/hermes_stable_family_closure_truth.md) (Chinese only)
- [Hermes managed family closure truth](program/hermes/hermes_managed_family_closure_truth.md) (Chinese only)
- [Phase 2 activation package freeze](program/phase-2/phase_2_source_intake_activation_package_freeze.md) (Chinese only)
- [Phase 2 source intake + shared source truth baseline](program/phase-2/phase_2_source_intake_shared_source_truth_baseline.md) (Chinese only)
- [Phase 2 review / export / gate / audit hardening](program/phase-2/phase_2_review_export_gate_audit_hardening.md) (Chinese only)
- [Phase 2 family source-truth consumption convergence](program/phase-2/phase_2_family_source_truth_consumption_convergence.md) (Chinese only)
- [Phase 2 publication projection / delivery contract convergence](program/phase-2/phase_2_publication_projection_delivery_contract_convergence.md) (Chinese only)
- [Phase 2 direct-delivery operator handoff hardening](program/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md) (Chinese only)
- [Phase 2 direct-delivery lifecycle stage convergence](program/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md) (Chinese only)
- [Phase 2 source-readiness deep research trigger + gate convergence](program/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md) (Chinese only)
- [Source-readiness deep research longrun target state](source_readiness_deep_research_longrun_target_state.md) (future-facing design target, Chinese only)
- [Direct-delivery longrun target state](direct_delivery_longrun_target_state.md) (future-facing design target, Chinese only)
- [Phase 2 workspace / operator quickstart convergence](program/phase-2/phase_2_workspace_operator_quickstart_convergence.md) (absorbed provenance, Chinese only)
- [Phase 2 operator surface consistency hardening](program/phase-2/phase_2_operator_surface_consistency_hardening.md) (absorbed provenance, Chinese only)
- [Phase 2 runtime watch locator integrity hardening](program/phase-2/phase_2_runtime_watch_locator_integrity_hardening.md) (absorbed provenance, Chinese only)
- [Phase 2 family parity governance surface convergence](program/phase-2/phase_2_family_parity_governance_surface_convergence.md) (absorbed provenance, Chinese only)

### Internal reference notes

- [Lightweight product entry and OPL handoff](references/lightweight_product_entry_and_opl_handoff.md) (Chinese only)

### For technical collaborators / agent executors

- [Runtime architecture](runtime_architecture.md)
- [Machine-readable contracts](../contracts/README.md) (Chinese only)
- [Source Augmentation / Deep Research executor contract](source_augmentation_executor_contract.md) (Chinese only)
- [Domain Harness OS positioning map](domain-harness-os-positioning.md)
- [Public GitHub publishing](public-github-publish.md)

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
- `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`: AI / maintainer core working set.
- `docs/program/*/*.md`: repo-tracked program briefs for the active mainline, absorbed tranche, and historical/provenance slices.
- `docs/references/*`: repo-tracked internal reference notes, Chinese by default.
- Detailed `docs/*.md`: repository-tracked internal/operator documents unless explicitly promoted.
- `docs/policies/`: stable internal rules, Chinese by default.
- `docs/superpowers/`: existing repo-tracked design archives may remain as internal history, but new local AI / Superpowers drafts should stay untracked by default.
