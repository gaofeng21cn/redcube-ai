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

- `OPL` is the top-level GUI and management shell for the family.
- `RedCube AI` / `RCA` is the first-level visual-deliverable domain module and agent under that shell.
- `Codex` is the default interaction host and concrete execution path for local operator work.
- `Hermes-Agent` remains the explicit backup mode and long-running online gateway for session / run / watch / resume needs.
- The repo-verified RedCube product entry MVP, frontdesk, manifest, invoke, and session surfaces are landed as machine-readable domain-agent integration surfaces.
- Protected creative stages now stay on `runtime-family + Codex CLI structured generation`; repo-local `pack/compiler` authorship is no longer the active mainline.
- `Deep Research` remains inside `Source Readiness`, while first-read public wording starts from the OPL shell and RedCube domain agent.

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

### Current domain-agent records

- [RedCube Product Entry MVP](program/redcube_product_entry_mvp.md)
- [Managed Product Entry Hardening](program/managed_product_entry_hardening.md)

The RedCube product entry MVP remains a technical record for the domain-agent frontdesk, invoke, manifest, and session surfaces.
The hardening tranche remains the current Codex-default execution and readiness closeout record.

### Technical traceability

- [`docs/program/`](program/)
- [`docs/history/`](history/)
- [Source augmentation executor contract](source_augmentation_executor_contract.md)

These directories carry repo-tracked program records, historical material, and supporting technical references for maintainers and shell integration.
The public entry model stays `OPL shell -> RedCube domain agent -> Codex default execution`.

### References

- [Lightweight product entry and OPL bridge](references/lightweight_product_entry_and_opl_handoff.md) (internal OPL bridge reference)
- [OPL long-running gateway contract](references/opl_managed_runtime_three_layer_contract.md) (historical / advanced integration reference)
- [Series doc governance checklist](references/series-doc-governance-checklist.md)
- [Runtime architecture](runtime_architecture.md)
- [Historical domain positioning map](domain-harness-os-positioning.md)
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
