# Artifact Creation Prompt Policy

Stage id: `artifact_creation`
Owner: RedCube AI
Purpose: create candidate visual deliverables through the selected RCA route while preserving source truth and approved visual direction.

Canonical policy:
- Use approved communication strategy, visual direction, source whitelist, and route policy as the authoring contract.
- Default `ppt_deck` route creates complete 16:9 image-first slide pages; native PPTX and HTML are explicit selected routes.
- Interpret generic requests for a “PPT”, “slides”, or `.pptx` output as a deliverable/container requirement, not as native editable authoring intent. A referenced or attached `.pptx`, template/style reuse, speaker notes, PDF export, or professional-quality wording is still image-first unless the current user request explicitly requires editable PowerPoint objects.
- Native route admission is a whole-request semantic judgment owned by the decisive Codex Attempt. It requires current-request evidence for editable text/shapes/charts/tables, native PowerPoint/DrawingML objects, preservation of editable master/layout/placeholder/theme objects, or an explicit request for the native PPTX authoring route. These are semantic boundary examples, not trigger tokens; keyword, regex, extension, or deterministic-script matching is forbidden. Missing or ambiguous admission evidence selects `author_image_pages` without a human gate; an Agent preference, template extension, validator behavior, or failed image attempt cannot supply that evidence.
- Default `xiaohongshu` route creates complete 3:4 image-first note pages; HTML is an explicit maintenance or deterministic authoring route.
- Keep image-first, HTML, and native PPTX differences route-local through detailed prompt locators, professional skills, and typed repair targets; do not split the top-level stage for route-specific failures.
- Do not expose prompt metadata, route names, internal fields, source ids, or operator notes in visible artifacts.
- Artifact mutation requires RCA authorization, owner receipt refs, or typed blockers.
- Treat authoring, visual review, repair, and re-review as one `artifact_creation` quality cycle, not as additional top-level stages.
- Use a new OPL StageAttempt and a fresh Codex thread for each formal role: `producer`, `reviewer`, `repairer`, and `re_reviewer`. Never resume the producer thread for Review.
- A producer-thread write-after-check is only `in_thread_refinement`; it cannot issue a Review receipt or close a formal quality gate.
- Preserve the professional evidence order across the bounded quality cycle: candidate -> render/mechanical evidence -> visual-director QA -> screenshot QA -> targeted repair -> rerender -> fresh re-review. Visual-director and screenshot helper calls inside one reviewer/re-reviewer Attempt are `in_attempt_visual_qa`, not additional Attempts or formal Reviews; they return evidence and findings but never materialize a Review receipt.
- Formal reviewers receive only exact artifact/source refs, hashes, declared epistemic scope dependencies, quality rubrics, necessary lineage, and prior findings for re-review. Hashes locate and bind the candidate bytes but do not authorize slide content, claims, or references. They do not receive producer conversation history.
- Evaluate slide content/claims/references, visual layout/render, export, and package as separate dependency scopes. A render/layout/export/package-only delta leaves content and reference Review current; semantic content changes invalidate only scopes whose declared dependency closure includes that content.
- A repair round is one repairer Attempt plus one fresh re-reviewer Attempt. Stop after three repair rounds, select the best consumable artifact, and record `completed_with_quality_debt` when defects remain.
- Keep deliverable repair inside the current artifact lineage. Validator or render failures cannot authorize editing RCA source, skills, contracts, or validation mappings, and cannot invoke OMA improve mode from a visual-delivery Attempt.

Professional skill routing:
- Route page-level PPT authoring, visible text safety, text fit, and blocked-slide repair planning to `agent/professional_skills/rca-ppt-page-author/SKILL.md`.
- Route template-aware layout grammar and placeholder capacity constraints first to `agent/professional_skills/rca-template-profiler/SKILL.md`.
- Route native editable PPTX design spec locks, shape plans, coordinate repair, and Office editability constraints to `agent/professional_skills/rca-native-ppt-designer/SKILL.md` only after explicit native semantic admission evidence from the current user request is recorded; template/profile inputs alone never activate that skill.
- Keep tool/helper calls limited to materialization, screenshots, validation, export, and evidence refs.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/author_image_pages.md`, `prompts/ppt_deck/render_html.md`, `prompts/ppt_deck/author_pptx_native.md`
- `xiaohongshu`: `prompts/xiaohongshu/author_image_pages.md`, `prompts/xiaohongshu/render_html.md`
- `poster_onepager`: `prompts/poster_onepager/render_html.md`

Authority boundary:
- OPL can schedule attempts and hold runtime refs.
- RCA owns artifact mutation authorization and canonical artifact authority.
- OPL owns quality-cycle Attempt scheduling and budget accounting; RCA owns the professional sequence, review verdict, repair target, and artifact lineage.
