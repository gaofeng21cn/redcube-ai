# Program Docs

`docs/program/` holds the active baton, absorbed tranche briefs, and contract-linked program records.

This directory is not the public identity layer. `RedCube AI` remains a visual-deliverable domain agent first; OPL is a Codex-first, stage-led runtime framework that may host RCA through an internal integration path. Older filenames that mention gateway, federation, bridge, harness, or Hermes-first routes are retained here only when machine-readable contracts still point to their `human_doc:*` semantic IDs.

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
- Absorbed Phase 2 tranche records: `phase-2/`

Historical material moved out of this layer:

- repo-local Hermes migration provenance: `../history/hermes/`
- historical plans with no active runtime-program contract link: `../history/plans/`
- local AI / Superpowers process drafts stay ignored under `../superpowers/` and are not repo-tracked history.
