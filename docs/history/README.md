# History

[中文](./README.zh-CN.md)

This directory holds archived provenance and process records that should not be read as the current runtime or product-entry contract.

Use this layer for:

- repo-local migration records that explain why earlier runtime shapes existed
- absorbed process notes that are useful for traceability but no longer belong in the active program baton
- tombstones for retired gateway, frontdoor, federation, harness-first, OPL-first, or Hermes-first narratives that should not be read as current RedCube identity

Current groups:

- `hermes/`: repo-local Hermes migration provenance. These files do not prove that upstream `Hermes-Agent` owns the active runtime.
- `plans/`: historical plans that are retained for traceability but no longer serve the active program baton.
- `tombstones/`: retired wording and route narratives that should stay searchable without returning to the active public identity. Current tombstone: `tombstones/retired-route-narratives-2026-05-11.md`.
- Future tombstone notes should state the retired wording, the current owner surface, and whether any machine-readable `human_doc:*` links still require an in-place program brief.

Active program briefs that are still linked from machine-readable runtime-program contracts remain in `../program/`.
Contract-linked Phase 2 and upstream Hermes proof briefs remain there until their `human_doc:*` semantic IDs are retired or remapped.
Local AI/Superpowers process drafts stay ignored under `../superpowers/` and are not imported into repo-tracked history.
