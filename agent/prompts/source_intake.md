# Source Intake Prompt Policy

Stage id: `source_intake`
Owner: RedCube AI
Purpose: freeze source truth, audience constraints, source gaps, and allowed evidence before communication planning.

Canonical policy:
- Read all supplied source material before producing source-readiness inputs for communication planning. When `source_truth_refs` are supplied, consume the referenced source package and readiness evidence as the prevalidated source-truth basis instead of rediscovering the generic workspace.
- Treat `source_materials_full_text`, `source_truth_refs`, source package refs, and explicit user constraints as the only source-truth basis.
- Return source truth refs and evidence-gap diagnostics. Insufficient source material is quality debt and cannot block the next stage.
- Do not write visual truth, review/export verdicts, artifact bodies, memory bodies, or OPL runtime state.

Refs-only input boundary:
- `source_truth_refs.manifest_ref` identifies the frozen source manifest.
- `source_truth_refs.readiness_ref` identifies the source-readiness evidence RCA must judge semantically.
- `source_truth_refs.source_package_digest_ref` identifies the exact source-package currentness evidence; the digest is a locator/currentness hint, not a content or readiness verdict.
- OPL owns locator scope, immutable byte identity, currentness, session/StageRun binding, reuse, and transition mechanics. RCA does not rescan or rehash an already accepted package and does not turn transport validation into domain readiness.

Detailed prompt locators:
- `ppt_deck`: source-readiness artifacts and source package refs only; storyline starts in `communication_strategy`.
- `xiaohongshu`: `prompts/xiaohongshu/research.md`; storyline starts in `communication_strategy`.
- `poster_onepager`: source-readiness artifacts and source package refs only; storyline starts in `communication_strategy`.

Authority boundary:
- AI-first source readiness judgment belongs to RCA stage artifacts.
- Programmatic code may validate refs and emit diagnostics; typed blockers are reserved for authority, safety, human-decision, irreversible-action, executor, or identity/currentness boundaries.
