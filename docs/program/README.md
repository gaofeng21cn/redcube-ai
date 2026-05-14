# Program Docs

`docs/program/` holds the active baton, absorbed tranche briefs, and contract-linked program records.

`RedCube AI` remains a visual-deliverable domain agent first; OPL is a stage-led runtime framework with Agent executors as the minimum execution unit that may host RCA through an internal integration path. Older filenames that mention gateway, federation, bridge, harness, or Hermes-first routes are retained here when machine-readable contracts still point to their `human_doc:*` semantic IDs.

## Current Hierarchy

| Level | Meaning | Handling |
| --- | --- | --- |
| Current baton | Records that still explain the active product-entry / runtime-program direction. | Keep readable here and align with `contracts/runtime-program/current-program.json`. |
| Absorbed tranche | Closeouts whose behavior already landed but are still useful for provenance or contract-linked context. | Keep in place with lifecycle notes until links move. |
| Legacy brief | Gateway / bridge / harness / Hermes-first material retained for compatibility or `human_doc:*` references. | Mark as internal integration, proof, or provenance; move to `docs/history/` after inbound links are retired. |
| New program | Future work with owner, gate, and closeout criteria. | Add when it needs execution tracking beyond current core docs, contracts, or references. |

Current rules:

- Keep briefs here when `contracts/runtime-program/current-program.json` or a tranche contract points to them.
- Keep current product-entry, service-safe domain-entry, OPL-hosted integration, and runtime baton records readable from this directory.
- Treat `phase-2/` as absorbed tranche provenance that remains in place because runtime-program contracts still link to those briefs.
- Treat `upstream_hermes_agent_*.md` as historical proof / blocker / closeout records now read through the provider-backed OPL runtime target, unless a later contract moves the baton.
- Add or preserve lifecycle notes on legacy-titled files instead of moving contract-linked briefs first.
- Move repo-local migration notes that no longer serve the baton into `docs/history/`.

Current entry groups:

- Product-entry and internal integration: `redcube_product_entry_mvp.md`, `managed_product_entry_hardening.md`, `opl_framework_hosted_product_entry.md`
- Upstream Hermes-Agent proof and verification provenance: `upstream_hermes_agent_*.md`
- Absorbed Phase 2 tranche records: `phase-2/README.md`

## Contract Link Audit

Fresh `human_doc:*` audit shows these groups still have inbound runtime-program links and should not be physically moved in this cleanup lane:

- `current-program.json` still points to `program_redcube_product_entry_mvp`, `program_managed_product_entry_hardening`, `program_opl_framework_hosted_product_entry`, and multiple `program_upstream_hermes_agent_*` briefs.
- Phase 2 tranche contracts still point to `program_phase_2_*` briefs, `human_doc:runtime_architecture`, and `human_doc:domain_harness_os_positioning`.
- Upstream Hermes blocker / closeout contracts still point to `program_upstream_hermes_agent_fast_cutover_board` and `program_upstream_hermes_agent_live_verification_closeout`.

Therefore the safe action is lifecycle labeling and index clarification, not path migration. Once those semantic IDs are retired or remapped in a future contract lane, the corresponding provenance files can move into `../history/`.

## Current Disposition

| File or group | Lifecycle state | Current reader stance |
| --- | --- | --- |
| `redcube_product_entry_mvp.md` | current baton | Direct RCA product-entry service surface; read with `invokeProductEntry` and current CLI/MCP entry contracts. |
| `managed_product_entry_hardening.md` | current baton | Product-entry session continuity and user-level runtime-state behavior. |
| `opl_framework_hosted_product_entry.md` | contract-linked internal integration | OPL-hosted route context; OPL is the stage-led framework with Agent executors as the minimum execution unit and does not own RCA visual truth. |
| `upstream_hermes_agent_*.md` | proof / provenance, contract-linked | Historical upstream Hermes proof lane and blocker/closeout records; current runtime owner and public identity live in the core docs and current contracts. |
| `phase-2/` | absorbed tranche, contract-linked | Hardening evidence already absorbed into current runtime/source/delivery/governance surfaces; keep here while `human_doc:*` links remain. |

Historical material moved out of this layer:

- repo-local Hermes migration provenance: `../history/hermes/`
- historical plans with no active runtime-program contract link: `../history/plans/`
- local AI / Superpowers process drafts stay ignored under `../superpowers/` and are not repo-tracked history.

## 2026-05-14 Development Plan Readout

Current development planning should start from the active product/domain action and Foundry Agent package surface, not from old gateway, workbench, federation, or standalone Hermes probe surfaces.

- `planned`: keep hardening product/domain action parity across CLI, MCP, manifest and app-skill contracts; continue package-module Python helper migration where wrappers still appear in the catalog.
- `done`: retired workbench root compatibility (`REDCUBE_WORKBENCH_ROOT`), removed standalone upstream Hermes probe script, removed stale legacy cleanup test, removed retired `@redcube/hermes-agent-client` package residue, renamed the active retired-surface guard away from compat wording, and renamed active xiaohongshu `source_workbench*` fields to `source_visual_reference*`.
- `deferred`: physical migration of contract-linked Phase 2 / Hermes / harness briefs into history waits until their `human_doc:*` links are remapped or retired; full Python helper wrapper retirement waits for catalog, runtime callsite, and helper proof alignment.
- `skipped`: no compatibility aliases for `GatewayActionMap`, `getCliGatewayActions`, `callGatewayTool`, `listGatewayTools`, `GatewayTool*`, old workbench env roots, source-pack federation, product frontdesk, standalone probe command, or old `source_workbench*` manifest fields.
- `verification`: use `npm run test:smoke` for the small active-entry check; use focused runtime topology / Python helper catalog tests for Hermes proof references; use `npm run test:meta` when changing registry, retired-surface guards, or TypeScript closeout policy.
- `commit-push state`: this readout documents local mainline state; push/PR state is separate from the docs lifecycle.
