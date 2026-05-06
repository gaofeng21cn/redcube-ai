# Program Docs

`docs/program/` holds the active baton and contract-linked program records.

Current rules:

- Keep briefs here when `contracts/runtime-program/current-program.json` or a tranche contract points to them.
- Keep current product-entry, service-safe domain-entry, OPL bridge, and runtime baton records readable from this directory.
- Treat `phase-2/` as absorbed tranche provenance that remains in place because runtime-program contracts still link to those briefs.
- Treat `upstream_hermes_agent_*.md` as the current target-shape / blocker / closeout record set unless a later contract moves the baton.
- Move repo-local migration notes that no longer serve the baton into `docs/history/`.

Current entry groups:

- Product-entry and bridge: `redcube_product_entry_mvp.md`, `managed_product_entry_hardening.md`, `opl_gateway_federated_product_entry.md`
- Upstream Hermes-Agent target and verification records: `upstream_hermes_agent_*.md`
- Absorbed Phase 2 tranche records: `phase-2/`

Historical material moved out of this layer:

- repo-local Hermes migration provenance: `../history/hermes/`
- historical plans with no active runtime-program contract link: `../history/plans/`
- local AI / Superpowers process drafts stay ignored under `../superpowers/` and are not repo-tracked history.
