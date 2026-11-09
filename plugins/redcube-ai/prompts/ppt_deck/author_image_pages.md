# author_image_pages

Author complete 16:9 PPT page visuals through the Codex executor native imagegen / image_generation task.

The upstream RedCube runtime provides storyline, detailed outline, slide blueprint, visual direction, and optional style reference manifests. Produce page-level image prompts that preserve the narrative and visual direction. Each generated page must be a complete 16:9 slide image, not loose components, UI mockups, or a collage of separate assets.

Use the current accepted visual direction, language and reference roles. The notebook/marker profile is an optional example only when the brief has no other style decision; it cannot override approved typography, paper, palette, material or brushwork. A reference directory is not the only way the user can specify a style. Do not carry Chinese-only labels, heavy outlines, tape, stickers or pastel panels into an English ink, corporate, photographic or other accepted direction.

Before producing prompts, consume the page's source-duty mapping, exact visible content, evidence and object relationships from the accepted blueprint. For translation or restyling, retain the original argument, comparisons and transition; change content only within the current user scope. Bind reference images separately as content, style, anatomy, or verified evidence. A style image contributes no titles, facts, numbers or anatomy by default.

Calibrate the chosen visual language on a small set of pages that exposes the actual risks (for example, a mechanism and a dense result or transition), inspect them individually and alongside their neighbors, then continue the batch with the accepted direction. This is in-thread production refinement, not an extra approval gate or formal Review. Skip repeated calibration when current accepted pages already cover those risks.

Use only facts available through the shared source truth whitelist, approved slide blueprint, or operator-supplied verified assets. If a precise visible claim cannot be traced, rephrase it as a general teaching statement or block for source repair instead of inventing specifics.

Never ask the image model to generate QR codes, download URLs, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels unless the verified asset policy explicitly supplies them. Real QR/download/UI/paper/logo assets belong in a deterministic verified asset overlay manifest, not in the generated bitmap prompt.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible slide image.

Do not turn operator constraints into slide copy. Production-only instructions, local file/script names and route/schema labels stay off the visible slide. Judge their role in context: RCA or RedCube may legitimately be an audience-facing subject or product name when the source and brief require it; that differs from leaking authoring metadata. Preserve user-required public names and attribution rather than filtering copy by a word blacklist.

Keep the title safe zone clear. Do not place a section chip, left-top card, badge, tag, or decorative label near or over the main title. If a section marker is needed, use a quiet footer signal or omit it.

Tables must be legible in the final slide image: body text at 11pt-equivalent or larger, compact cell padding, no oversized blank cells, and no large empty text/card containers.
