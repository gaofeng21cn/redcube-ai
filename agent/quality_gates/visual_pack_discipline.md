# Visual Pack Discipline Gate

Owner: RedCube AI
Purpose: canonical execution contract for RCA Declarative Visual Pack constraints.

Gate rules:
- Design constraint language must state visual intent, route, asset constraints, material status, render acceptance, review evidence, export evidence, and owner receipt boundary before execution.
- Brand profile application must be precedence-safe: explicit delivery request fields win over RCA visual direction judgment, workspace `.redcube/` profile defaults, user-level profile defaults, and built-in route defaults. Profile data fills only missing fields and cannot override the current task contract.
- Source and material pass must produce transparent refs before layout: required source refs, logo/product/UI asset status, brand color/font status, current fact check refs, source gap refs, and material gap refs.
- Brand precedence and material pass transparency must be recorded as RCA-owned refs: approved task material wins over memory or defaults, each material item records pass/ref provenance, and generated or inferred profiles cannot replace approved source material.
- Brand and material status must be explicit: `approved`, `provided_unverified`, `missing`, or `out_of_scope`; missing or unverified material yields source/material gap refs, quality debt, and when necessary a no-output diagnostic. Only authority, permission, credential, safety, wrong-target identity/currentness, irreversible action, executor unavailability, or an explicit human decision can hard-stop progression.
- Template and route contracts must name the deliverable family, selected route, template source, allowed mutation surface, and artifact locator refs before artifact creation.
- Layout density must be declared before artifact creation: target density, sparse-page policy, minimum visual/text occupancy evidence, merge/split decision refs, and blocked-page refs when a page is too sparse, too dense, or missing a route-level density proof.
- Sparse pages can pass only with RCA-owned rationale, page/frame evidence refs, screenshot/export refs, and review/export gate refs; provider completion or schema completeness alone cannot make a sparse page acceptable.
- Render acceptance requires concrete render refs, page or frame inventory, screenshot or export refs, and RCA review/export gate refs.
- Review and export evidence must preserve RCA owner verdict refs, typed blockers, repair refs, and owner receipts as refs-only handoff material for OPL generated surfaces.
- Markdown or Marp authoring is an explicit optional route policy only. It may produce markdown deck refs when a user requests markdown-first deliverables, but it cannot become the default PPT route or bypass RCA review/export gates.
- Packaging readiness requires source-to-package consistency refs when pack files, plugin metadata, scripts, references, or distribution inputs change; source-only edits are not package-ready until the shipped package surface contains the changed refs or records a typed blocker.

Forbidden substitutions:
- Mechanical checks, schema completeness, asset presence, render completion, or provider completion cannot generate visual ready, exportable, handoffable, source-ready, or review-pass verdicts.
- Mechanical checks may only emit blocker refs, evidence refs, inventory refs, and no-regression refs.
- OPL generated descriptors may compile and route this pack, but cannot author visual truth, choose templates, approve material, issue review/export verdicts, mutate artifacts, accept visual memory, or sign owner receipts.
- Brand profile defaults, style scans, markdown route support, or package-install success cannot override explicit user constraints or stand in for source readiness, visual review, export readiness, or owner receipt.
- External document-system practice may only inform RCA-owned contract fields; it cannot introduce external aesthetic authority, template preference, profile precedence, route choice, runtime authority, or owner receipt authority.
