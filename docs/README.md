# Docs Guide

**English** | [中文](./README.zh-CN.md)

This directory is the technical reading layer for `RedCube AI`.
The current public reading path is anchored on two repo-verified routes:

- direct route: `User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- federated route: `User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

## Start Here By Audience

| Audience | Start here | Why |
| --- | --- | --- |
| Potential users and domain experts | [Repository home](../README.md) | Understand what RedCube delivers before opening technical files |
| Technical readers and planners | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md), [Contracts Overview](../contracts/README.md) | Read current boundary, execution model, and verification surface |
| Developers and maintainers | `docs/program/`, `docs/references/`, `docs/policies/`, `docs/history/` | Track implementation records, references, governance, and archives |

## Current Baseline

- `Hermes-Agent` is the upstream managed runtime owner for session, run, watch, and resume.
- `RedCube AI` holds visual-domain truth, `invokeDomainEntry`, and the repo-verified product-entry service surface.
- `Codex CLI` remains the default concrete executor selected behind the executor-adapter contract for local operator workflows.
- `OPL` joins through the federated handoff surface when family-level routing is needed.

## Technical Working Set

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)
- [Contracts Overview](../contracts/README.md)

## Verification Surface

- `npm test` / `npm run test:fast`
- `npm run test:meta`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:historical`
- `npm run test:full`

## Historical and Reference Layers

- `docs/program/`: tracked program records, including absorbed milestones
- `docs/history/`: archive index
- `docs/references/`: supporting technical references
- `docs/policies/`: stable governance and operating rules
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md): future-facing design reference kept outside the active root doc surface
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md): source-plane future target kept in the same reference layer

## Documentation Rules

- Keep `README*` and `docs/README*` aligned with the repo-verified direct route, federated OPL route, and service-safe domain entry surface.
- Keep English and Chinese public docs mirrored where applicable.
- Keep historical materials available in program/history/reference layers.
