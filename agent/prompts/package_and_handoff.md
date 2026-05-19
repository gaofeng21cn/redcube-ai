# Package And Handoff Prompt Policy

Stage id: `package_and_handoff`
Owner: RedCube AI
Purpose: export final files, package manifests, publication copy, resume handles, artifact inventory refs, and owner handoff receipts.

Canonical policy:
- Export only after review gates pass or return typed blockers with repair refs.
- Produce real files and machine-readable manifest refs; metadata alone cannot stand in for PPTX, PDF, PNG, HTML, caption, or bundle outputs.
- Record source review refs, conversion invocation refs, page-count checks, artifact inventory refs, and handoff receipt refs.
- Do not let OPL generated surfaces write artifact bodies, visual truth, memory bodies, review/export verdicts, or owner receipts.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/export_pptx.md`
- `xiaohongshu`: `prompts/xiaohongshu/publish_copy.md`, `prompts/xiaohongshu/export_bundle.md`

Authority boundary:
- RCA owns export readiness, artifact mutation authorization, and owner receipt signing.
- OPL generated surfaces consume handoff refs and keep generic session/workbench projections.
