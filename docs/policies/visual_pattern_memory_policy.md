# Visual Pattern Memory Policy

Status: `active policy`
Date: `2026-05-11`
Owner: `RedCube AI`
Purpose: keep reusable visual-deliverable experience available to RCA stages without turning visual work into a rigid recipe engine.
State: `active policy`
Machine boundary: this is a human-readable policy. Machine truth remains in RCA runtime-program contracts, product-entry manifests, route artifacts, prompt packs, review artifacts, export bundles, canonical artifact indexes, and tests.

## Conclusion

RCA should keep reusable visual experience as natural-language visual pattern memory while it remains exploratory.

The memory should help Codex reason about audience, story rhythm, visual density, style, route choice, and recurring review failures. It must not replace AI-authored visual direction, AI reviewer judgment, screenshot review, image-first/native/HTML route contracts, or export gates.

The correct shape is:

- prose-first visual pattern cards;
- minimal tags for deliverable family, stage, audience, style, and provenance;
- small stage-specific retrieval;
- writeback from review/export closeout when a lesson is reusable;
- hard separation from canonical artifact and review verdict authority.

The incorrect shape is:

- a universal layout recipe engine;
- hidden templates that author content or visuals outside AI-authored artifacts;
- mechanical scorecard-only visual acceptance;
- global prompt stuffing with every style rule and every prior failure.

## Suitable Memory Content

Good visual pattern memories include:

- PPT / xiaohongshu / poster story rhythm patterns that repeatedly work for an audience;
- information-density lessons, such as when a page needs one core judgment plus short modules;
- mobile readability, contact-sheet review, or series-level consistency lessons;
- style-profile caveats that help Codex pick tone, palette, typography, or composition direction;
- recurring screenshot-review / visual-director-review failure modes;
- when to prefer image-first, HTML, or native PPT route based on user intent and artifact needs.

Bad memory writebacks include:

- generated slide/page content for the current deliverable;
- review verdicts that belong in `visual_director_review` or `screenshot_review`;
- export readiness or publication projection truth;
- canonical PNG/PPTX/PDF artifact state;
- hidden deterministic composition logic that should be in route code or prompt packs.

## Current Candidates

| surface | memory treatment |
| --- | --- |
| xiaohongshu production quality lessons from external workbench absorption | Natural-language visual pattern memory candidate. |
| PPT executive / defense / peer deck examples and contact-sheet review lessons | Natural-language memory candidate when described as reusable judgment, not copied artifact truth. |
| poster / one-pager visual hierarchy lessons | Natural-language memory candidate. |
| default image-first style profiles and prompt templates | Prompt/profile assets with optional memory refs; not a runtime recipe engine. |
| image-first PPT and xiaohongshu routes | Strong route contracts; not memory. |
| native PPT route and DrawingML proof | Strong route/helper contract; not memory. |
| `visual_director_review`, `screenshot_review`, export bundle, artifact index | Strong review/export/artifact truth; not memory authority. |

## Stage Use

Memory should be retrieved in small sets:

- `source_readiness`: retrieve only source/audience caveats that affect visual scope.
- `story_architecture`: retrieve story rhythm and audience framing patterns.
- `visual_authorship`: retrieve style, density, composition, route, and asset-use patterns.
- `review_overlay`: retrieve recurring visual failure modes and repair expectations.
- `delivery_packaging`: retrieve export-process lessons that do not override route gates.

Memory can influence prompt context and reviewer attention. It cannot accept a visual, approve export, or mutate canonical artifacts by itself.

## Relationship To AI-First Boundary

This policy extends [AI-first Quality Boundary Policy](./ai_first_quality_boundary.md).

Visual pattern memory can guide the AI author and reviewer. It does not move authorship from AI artifacts into pack/runtime code. It also does not allow packs, schemas, audits, or projections to claim final visual quality without AI-authored review evidence.

## OPL Boundary

OPL may index memory refs, surface consumed-memory provenance, and carry closeout writeback receipts. OPL must not own RCA visual pattern content, choose visual routes, issue review/export verdicts, or mutate canonical artifacts.

Family-level governance for this boundary is tracked in `/Users/gaofeng/workspace/one-person-lab/docs/references/operating-governance/family-domain-memory-governance.zh-CN.md`.

## Now / Next / Defer

Now:

- keep this policy as the RCA memory owner reference;
- preserve image-first / HTML / native route contracts as structured route truth;
- keep `rca.visual_pattern_memory.migration_plan.v1`, `rca.visual_pattern_memory.seed_fixture_locator.v1`, `rca.visual_pattern_memory.writeback_proposal_generator.v1`, `rca.visual_pattern_memory.accept_reject.v1`, `rca.visual_pattern_memory.writeback_receipt_locator.v1`, and `rca.visual_pattern_memory.operator_receipt_projection.v1` as repo-source contract surfaces for migration, RCA decision, and operator-visible receipt projection;
- use `rca.controlled_visual_stage_attempt.fixture.v1` as a descriptor/sidecar/quality-ref proof that direct RedCube skill calls and OPL-hosted stage attempts converge on the same RCA-owned review/revision/export refs;
- expose the standard top-level `domain_memory_descriptor` / `family-domain-memory-ref.v1` projection from the same RCA-owned descriptor locator, so OPL can index RCA visual pattern memory refs without owning memory content;
- record reusable visual lessons as prose in future review/export closeouts, runtime/domain-memory roots, or reference docs.

Next:

- keep OPL family index at `resolved_memory_descriptor_count=3` / `missing_memory_descriptor_count=0` while preserving RCA-owned visual memory bodies and decisions;
- run an OPL-hosted controlled visual stage attempt that consumes visual pattern memory refs and emits accepted/rejected receipt refs;
- route reusable visual lessons from real `visual_director_review` and `screenshot_review` closeout into accepted/rejected domain-memory writebacks under runtime/domain-memory authority;
- surface the locator-only operator receipt projection in product-entry/operator views once real receipt instances exist outside repo.

Defer:

- a universal visual recipe engine;
- OPL-owned visual memory content;
- automatic route or layout selection by memory score alone;
- hidden deterministic fallback templates that bypass AI-first authorship.
