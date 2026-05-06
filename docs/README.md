# Docs Guide

**English** | [中文](./README.zh-CN.md)

This directory is the technical reading layer for `RedCube AI`.
The current public reading path is anchored on the direct route, with the OPL Runtime Manager bridge kept as an internal integration/reference surface:

- direct route: `User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- internal OPL bridge: `User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

## Start Here By Audience

| Audience | Start here | Why |
| --- | --- | --- |
| Potential users and domain experts | [Repository home](../README.md) | Understand what RedCube delivers before opening technical files |
| Technical readers and planners | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md), [Contracts Overview](../contracts/README.md) | Read current boundary, execution model, and active governance surface |
| Developers and maintainers | [Program](./program/README.md), [References](./references/README.md), [Policies](./policies/README.md), [History](./history/README.md) | Track active baton records, references, stable rules, and archived provenance |

## Current Baseline

- `RedCube AI` holds visual-domain truth, `invokeDomainEntry`, the direct repo-verified product-entry service surface, and the stable callable surface built from the single `redcube-ai` app skill, `CLI`, `MCP`, local scripts, and repo-tracked contracts.
- `Codex CLI` remains the default concrete executor selected behind the executor-adapter contract for local operator workflows.
- `OPL Runtime Manager` is the target thin federated manager over the external `Hermes-Agent` substrate; it may index product-entry registration, session continuity, runtimeWatch, artifacts, and review/publication projection, but it does not own RedCube visual truth.
- Hosted runtime carriers such as `Hermes-Agent` stay in explicit opt-in backend/proof lanes or technical-reference positions; they do not redefine the default public contract.
- `OPL` joins through the internal bridge surface when family-level routing is needed.
- The implementation target is `TypeScript + Python`: TypeScript owns product/runtime contracts and service boundaries, while Python owns native PPT/Office helpers and document/PPT repair loops under RedCube routes and gates.
- `ppt_deck` defaults to image-first full-slide PNG authoring through `author_image_pages`; HTML `render_html/fix_html` and editable native PPTX `author_pptx_native/repair_pptx_native` remain explicit selectable routes.
- `xiaohongshu` now follows the same image-first product route: `author_image_pages` generates full 3:4 PNG note pages with GPT-Image-2, `screenshot_review` consumes the PNG/page manifest, and `repair_image_pages` redraws only blocked pages. HTML `render_html/fix_html` remains explicit for deterministic web drafts and historical maintenance.
- Runtime truth remains file-authority first with rebuildable artifact indexes. SQLite persistence is deferred for RCA until measured artifact/session file growth or cross-deliverable query pressure justifies a rebuildable sidecar index.
- `frontdesk` command keys remain agent-facing product-entry overview / intake / entry-shell contracts below the single `redcube-ai` app skill; they do not imply a mature GUI, WebUI, or end-user front office.

## Technical Working Set

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)
- [Contracts Overview](../contracts/README.md)
- [Docs Portfolio Consolidation](./docs_portfolio_consolidation.md)

## Maintainer Governance Surface

- Maintainer verification and documentation governance live in `docs/references/series-doc-governance-checklist.md`.
- Historical and provenance audits stay in `docs/history/` when they no longer serve the active program baton; still-current operator references stay in `docs/references/`.

## Reference Layers

- `docs/program/`: active program baton and contract-linked records that remain readable from `contracts/runtime-program/current-program.json`
- `docs/references/`: supporting technical references that explain current operation, target states, or maintainer practice
- `docs/policies/`: stable governance and operating rules
- `docs/history/`: archived provenance, repo-local migration records, and historical plans that no longer serve the active program baton
- Local AI/Superpowers process drafts stay ignored under `docs/superpowers/` and are not part of repo-tracked history.
- [AI-first quality boundary policy](./policies/ai_first_quality_boundary.md): stable rule that keeps author/reviewer judgment in AI-authored artifacts while packs, schemas, gates, audits, and projections stay mechanical.
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md): future-facing design reference kept outside the active root doc surface
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md): source-plane future target kept in the same reference layer

## Documentation Rules

- Keep `README*` and `docs/README*` aligned with the repo-verified direct route, the internal OPL Runtime Manager bridge/reference surface, and the service-safe domain entry surface.
- Keep English and Chinese public docs mirrored where applicable.
- Keep reference materials only when they still support current contracts.
- Do not move a program brief that is still linked from a machine-readable runtime-program contract unless that contract is changed in the same scoped tranche.
