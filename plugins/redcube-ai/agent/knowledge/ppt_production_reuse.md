# PPT Production Reuse And Readback

Applies to page authoring, review and handoff of image-heavy decks. It supports
the existing StageRun and quality cycle; it introduces no private scheduler,
review authority, readiness state or fixed service-wide image limit.

## Produce Only What Changed

Supply each page with its current blueprint, relevant evidence, exact visible
copy, accepted direction and a few role-labeled references. Reuse accepted
upstream artifacts without repeatedly summarizing them. Keep independent page
work separate only after shared content and direction decisions are settled.

Use one current per-page source for image description, script, sources and
speaker notes. Content changes update all dependent outputs; visual-only repair
preserves content and notes. Keep passed image bytes and target repairs by stable
page id. A failed layout does not authorize changing the story or authoring lane.
If failure comes from unsupported claims, unclear relationships or overload,
repair that upstream decision before spending another image call.

## Long-Deck Continuity

Budget image bytes separately from text tokens. Use review-size copies for
whole-page checks and details only for uncertain glyphs, numbers or anatomy.
Persist reviewed image refs, specific findings and remaining work in the current
review artifacts before context grows. Serialize image-bearing results when the
active route has demonstrated ordering incompatibility; do not impose a fixed
batch size or byte ceiling on all environments. Resume from the checkpoint,
not by replaying every image or initializing the delivered resources again.

Tool errors do not prove an operation never ran. Reconcile current files and
invocation results before replaying a writer. Preparation writes candidates;
imports must not overwrite accepted pages as a side effect. Model availability
comes from current tool/provider evidence. Record the actual selected model;
a provider variant is not proof that the built-in tool used that variant.

## Review And Final Evidence

AI reads content, visual meaning, style and rhythm. Mechanical checks establish
resource identity, actual page order, notes, geometry and package integrity.
A contact sheet locates rhythm problems but does not review unseen single pages.
OCR and overflow checks locate suspects; they cannot establish semantic quality.

For already reviewed full-page images, actual PPTX relationship order, exact
media bytes, full-frame geometry, no crop/rotation/covering layer, and matching
notes can preserve that visual judgment without rereading every unchanged page.
A matching media set alone is insufficient. Re-render affected pages if
compositing or editability breaks equivalence. Decode real QR assets or reuse
hash-bound prior scan evidence. A package test is not native PowerPoint playback.

Check every declared handoff copy separately and keep stable final names with
revision/source metadata. Browser previews need all images, navigation,
presentation/Escape and relevant narrow-screen checks. Archive necessary rollback
files and unique reusable assets, validate dependencies, then remove exact
redundancies; never copy every historical production tree into active memory.

## Measure Improvement Honestly

Distinguish the first generated image, in-thread refinement, formal repair and
accepted handoff. Record generation attempts, elapsed time and actual cost when
available; missing cost is unknown, not zero. Compare first-attempt usability,
semantic/factual defects, style deviations, calls per accepted page and user
substantive corrections on matched cases. Bind AI review observations to exact
images and the rubric. Placeholder assets and regex/phrase tests validate
plumbing only. They cannot show an improvement in real generated-slide quality.
