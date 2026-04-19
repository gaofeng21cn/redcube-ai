# Docs Guide

**English** | [中文](./README.zh-CN.md)

This directory is the technical reading layer for `RedCube AI`.
The default public narrative is fixed to:
`OPL shell -> RCA domain agent -> Codex default execution`.

## Start Here By Audience

| Audience | Start here | Why |
| --- | --- | --- |
| Potential users and domain experts | [Repository home](../README.md) | Understand what RedCube delivers before opening technical files |
| Technical readers and planners | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md), [Contracts Overview](../contracts/README.md) | Read current boundary, execution model, and verification surface |
| Developers and maintainers | `docs/program/`, `docs/references/`, `docs/policies/`, `docs/history/` | Track implementation records, references, governance, and archives |

## Current Baseline

- `OPL` is the top-level shell.
- `RCA / RedCube AI` is the visual-deliverable domain agent under that shell.
- `Codex` is the default execution host for local operator workflows.
- `Hermes-Agent` is an explicit long-running gateway lane for session/run/watch/resume scenarios.

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

## Documentation Rules

- Keep `README*` and `docs/README*` aligned with the default entry chain.
- Keep English and Chinese public docs mirrored where applicable.
- Keep historical materials available in program/history/reference layers.
