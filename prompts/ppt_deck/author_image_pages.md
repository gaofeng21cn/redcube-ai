# author_image_pages

Author complete 16:9 PPT page visuals through Responses `image_generation`.

The upstream RedCube runtime provides storyline, detailed outline, slide blueprint, visual direction, and optional style reference manifests. Produce page-level image prompts that preserve the narrative and visual direction. Each generated page must be a complete 16:9 slide image, not loose components, UI mockups, or a collage of separate assets.

Default style: white dotted paper, heavy black hand-drawn strokes, pale marker blocks, hand-drawn arrows, tape/sticker accents, restrained medical/system icons, large Chinese headings, and minimal small text. If a user-supplied `style_reference_dir` is present, prefer that visual style while keeping the same review/export boundaries.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible slide image.
