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
| Developers and maintainers | `docs/program/`, `docs/references/`, `docs/policies/` | Track implementation records, references, and governance |

## Current Baseline

- `RedCube AI` holds visual-domain truth, `invokeDomainEntry`, the direct repo-verified product-entry service surface, and the stable callable surface built from the single `redcube-ai` app skill, `CLI`, `MCP`, local scripts, and repo-tracked contracts.
- `Codex CLI` remains the default concrete executor selected behind the executor-adapter contract for local operator workflows.
- `OPL Runtime Manager` is the target thin federated manager over the external `Hermes-Agent` substrate; it may index product-entry registration, session continuity, runtimeWatch, artifacts, and review/publication projection, but it does not own RedCube visual truth.
- Hosted runtime carriers such as `Hermes-Agent` stay in explicit opt-in backend/proof lanes or technical-reference positions; they do not redefine the default public contract.
- `OPL` joins through the internal bridge surface when family-level routing is needed.
- The implementation target is `TypeScript + Python`: TypeScript owns product/runtime contracts and service boundaries, while Python owns native PPT/Office helpers and document/PPT repair loops under RedCube routes and gates.

## Technical Working Set

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)
- [Contracts Overview](../contracts/README.md)

## Maintainer Governance Surface

- Maintainer verification and documentation governance live in `docs/references/series-doc-governance-checklist.md`.
- Historical and provenance audits stay in the same reference layer instead of the default public entry path.

## Reference Layers

- `docs/program/`: tracked program records, including absorbed milestones
- `docs/references/`: supporting technical references
- `docs/policies/`: stable governance and operating rules
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md): future-facing design reference kept outside the active root doc surface
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md): source-plane future target kept in the same reference layer

## Documentation Rules

- Keep `README*` and `docs/README*` aligned with the repo-verified direct route, the internal OPL Runtime Manager bridge/reference surface, and the service-safe domain entry surface.
- Keep English and Chinese public docs mirrored where applicable.
- Keep reference materials only when they still support current contracts.
