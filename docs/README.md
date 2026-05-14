# Docs Guide

**English** | [中文](./README.zh-CN.md)

This directory is the technical reading layer for `RedCube AI`.
The current public reading path starts from RedCube as the `RedCube AI Foundry Agent`: an OPL-compatible visual-deliverable package built on the OPL Framework. OPL is the stage-led agent runtime framework that can host RedCube as an external dependency, so the OPL path is documented as an internal hosted integration path rather than the first public story:

- direct route: `User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- OPL-hosted route: `User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

## Start Here By Audience

| Audience | Start here | Why |
| --- | --- | --- |
| Potential users and domain experts | [Repository home](../README.md) | Understand what RedCube delivers before opening technical files |
| Technical readers and planners | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md), [Contracts Overview](../contracts/README.md) | Read current boundary, execution model, and active governance surface |
| Developers and maintainers | [Product](./product/README.md), [Runtime](./runtime/README.md), [Delivery](./delivery/README.md), [Source](./source/README.md), [Policies](./policies/README.md), [Active](./active/README.md), [References](./references/README.md), [History](./history/README.md) | Track lifecycle docs, stable rules, active baton records, references, and archived provenance |

## OPL Family Layering

The global OPL-family development reference lives at
`/Users/gaofeng/workspace/one-person-lab/docs/active/opl-family-development-reference.zh-CN.md`.
It owns OPL Framework global targets, global gaps, generic primitive
absorption, App/workbench targets, and cross-repo execution order.

This RCA repo only owns the visual-deliverable domain-agent target state,
current gaps, visual truth, review/export verdicts, artifact authority, the
direct product-entry path, OPL-hosted sidecar/projection/receipt boundaries,
and the list of generic source/workspace intake, artifact gallery,
route/decision graph, review/repair transport, native-helper envelope, memory
locator, and observability primitives that should move up into OPL. MAS, MAG,
MDS, and OPL-owned App/workbench backlogs are not maintained in RCA docs.

## Current Baseline

- `RedCube AI` holds visual-domain truth, `invokeDomainEntry`, the direct repo-verified product-entry service surface, and the stable callable surface built from the single `redcube-ai` app skill, `CLI`, `MCP`, local scripts, and repo-tracked contracts.
- The release shape is `RedCube AI Foundry Agent`: one app skill, one service-safe domain entry, product sidecar/projection refs, and read-only stage-control projection metadata. This is the OPL-compatible package surface; it is not a GUI/WebUI shell and it does not move route, review, export, or artifact authority into OPL.
- `Codex CLI` remains the default concrete executor and the minimum execution unit selected behind the executor-adapter contract for local operator workflows.
- OPL owns the stage-led hosted integration and provider-backed family runtime path. Temporal is the production substrate target; Hermes remains a legacy/optional provider or proof lane. OPL may index product-entry registration, session continuity, runtimeWatch, artifacts, and review/publication projection, but it does not own RedCube visual truth.
- Hosted runtime carriers such as `Hermes-Agent` stay in explicit opt-in backend/proof lanes or technical-reference positions; they do not redefine the default public contract.
- `OPL` joins only when family-level routing, hosting, wakeup, or projection is needed; it is not RedCube's public identity.
- The implementation target is `TypeScript + Python`: TypeScript owns product/runtime contracts and service boundaries, while Python owns native PPT/Office helpers and document/PPT repair loops under RedCube routes and gates.
- `ppt_deck` defaults to image-first full-slide PNG authoring through `author_image_pages`; HTML `render_html/fix_html` and editable native PPTX `author_pptx_native/repair_pptx_native` remain explicit selectable routes.
- `xiaohongshu` now follows the same image-first product route: `author_image_pages` generates full 3:4 PNG note pages with GPT-Image-2, `screenshot_review` consumes the PNG/page manifest, and `repair_image_pages` redraws only blocked pages. HTML `render_html/fix_html` remains explicit for deterministic web drafts and historical maintenance.
- Runtime truth remains file-authority first with rebuildable artifact indexes. SQLite persistence is deferred for RCA until measured artifact/session file growth or cross-deliverable query pressure justifies a rebuildable sidecar index.
- `status` command keys remain agent-facing product-entry overview / intake / entry-shell contracts below the single `redcube-ai` app skill; they do not imply a mature GUI, WebUI, or end-user front office.

## Technical Working Set

- [Project](./project.md)
- [Status](./status.md)
- [Architecture](./architecture.md)
- [Invariants](./invariants.md)
- [Decisions](./decisions.md)
- [Contracts Overview](../contracts/README.md)
- [Docs Portfolio Consolidation](./docs_portfolio_consolidation.md)

## Lifecycle Layers

| Layer | Responsibility | Start here |
| --- | --- | --- |
| Current truth | Current product role, active boundary, execution model, invariants, and durable decisions | [Project](./project.md), [Status](./status.md), [Architecture](./architecture.md), [Invariants](./invariants.md), [Decisions](./decisions.md) |
| Machine truth | Runtime-program contracts, schemas, source, generated artifacts, and callable surfaces | [Contracts Overview](../contracts/README.md) |
| Product | Human/operator entry, product handoff, profile and publishing coordination | [Product docs](./product/README.md) |
| Runtime | Runtime topology, executor/backend boundaries, service-safe entry, watch/projection semantics | [Runtime docs](./runtime/README.md) |
| Delivery | Deliverable families, routes, proof environments, export expectations, examples | [Delivery docs](./delivery/README.md) |
| Source | Source readiness, augmentation, deep research trigger/gate, source truth consumption | [Source docs](./source/README.md) |
| Policies | Stable governance and operating rules | [Policies](./policies/README.md) |
| Active | Current execution, current plans, current gaps, contract-linked baton, and closeout evidence | [Active](./active/README.md) |
| Specs | Current technical spec index | [Specs](./specs/README.md) |
| References | Supporting technical references that do not own the active baton or public identity | [References](./references/README.md) |
| History | Archived provenance, tombstones, and historical plans | [History](./history/README.md) |

Read this table as hierarchy: current truth and machine truth come first;
product/runtime/delivery/source/policies explain current work; `docs/active`
tracks active or contract-linked baton material; references and history preserve
support context and provenance.
RCA follows the OPL-family canonical docs taxonomy:
`active/public/product/runtime/delivery/source/policies/specs/references/history`.
The former `docs/program/` active baton directory has been physically retired:
current baton records live in `docs/active/`, absorbed Phase 2 records live in
`docs/history/phase-2/`, and upstream Hermes proof records live in
`docs/history/hermes/`. `human_doc:program_*` IDs remain stable semantic reader
context, not physical path commitments.

## Maintainer Governance Surface

- Maintainer verification and documentation governance live in `docs/references/series-doc-governance-checklist.md`.
- Historical and provenance audits stay in `docs/history/` when they no longer serve the active program baton; still-current operator references stay in `docs/references/`.
- Contract-linked reader context uses stable `human_doc:*` IDs while the physical documents live in their lifecycle layer. Current baton briefs are in `docs/active/`; absorbed and proof material is in `docs/history/`.
- RCA docs are maintained by content lifecycle. A file can stay in place while only part of its body is current; merge current facts into the owner doc, keep active baton records in `docs/active/`, move support explanation to references, and archive completed or superseded plan text after link review.
- `README*` and `docs/**` are human-readable surfaces. Runtime contracts, tests, scripts, and dashboards may expose `human_doc:*` semantic pointers for reader context, but they must not pin repo documentation paths as stable machine-readable APIs.
- Repository hygiene now runs before `scripts/verify.sh` lanes and before grouped test execution through `scripts/repo-hygiene.sh`. The tracked mainline must not contain generated or local-state payloads such as `dist/`, `build/`, `out/`, `__pycache__`, `*.egg-info`, `.DS_Store`, project-level `.codex/`, `.omx/`, `.runtime-program/`, `runtime-state/`, or `.agent-contract-baseline.json`. `.agents/plugins/marketplace.json` is the only tracked `.agents/` plugin source entrypoint.

## Reference Layers

- `docs/product/`: product-facing and operator-facing human guides
- `docs/runtime/`: runtime topology and execution/projection explanations
- `docs/delivery/`: deliverable family, route, proof, export, and example materials
- `docs/source/`: source readiness and augmentation materials
- `docs/policies/`: stable governance and operating rules
- `docs/active/`: human-readable current baton and active closeout records
- `docs/history/phase-2/`: absorbed tranche briefs and follow-on records
- `docs/references/`: supporting technical references that explain current operation, target states, or maintainer practice without becoming public identity
- `docs/history/`: archived provenance, tombstones, repo-local migration records, and historical plans that no longer serve the active program baton
- Local AI/Superpowers process drafts stay ignored under `docs/superpowers/` and are not part of repo-tracked history.
- [AI-first quality boundary policy](./policies/ai_first_quality_boundary.md): stable rule that keeps author/reviewer judgment in AI-authored artifacts while packs, schemas, gates, audits, and projections stay mechanical.
- [Visual pattern memory policy](./policies/visual_pattern_memory_policy.md): stable rule that keeps visual story, style, density, route caveats, and review failure lessons as natural-language memory without replacing AI author/reviewer artifacts, route contracts, export gates, or canonical artifact authority.
- [Direct-delivery longrun target state](./references/direct_delivery_longrun_target_state.md): future-facing design reference kept outside the active root doc surface
- [Source readiness deep research longrun target state](./references/source_readiness_deep_research_longrun_target_state.md): source-plane future target kept in the same reference layer

## Documentation Rules

- Keep `README*` and `docs/README*` aligned with the repo-verified direct route, the OPL-hosted integration path, and the service-safe domain entry surface.
- Keep English and Chinese public docs mirrored where applicable.
- Keep reference materials only when they still support current contracts.
- Keep OPL, gateway, bridge, harness, and legacy route wording out of the first public identity unless the sentence is explicitly about internal integration, runtime hosting, provenance, or tombstone context.
- Machine-readable runtime-program contracts should point to contract/schema/source paths for executable truth, or to `human_doc:*` semantic IDs for reader context; they should not make prose documentation layout a test/runtime compatibility constraint.
