# author_image_pages

Author complete 16:9 PPT page visuals through Responses `image_generation`.

The upstream RedCube runtime provides storyline, detailed outline, slide blueprint, visual direction, and optional style reference manifests. Produce page-level image prompts that preserve the narrative and visual direction. Each generated page must be a complete 16:9 slide image, not loose components, UI mockups, or a collage of separate assets.

Default style: white dotted paper, heavy black hand-drawn strokes, pale marker blocks, hand-drawn arrows, tape/sticker accents, restrained medical/system icons, large Chinese headings, and minimal small text. If a user-supplied `style_reference_dir` is present, prefer that visual style while keeping the same review/export boundaries.

Use only facts available through the shared source truth whitelist, approved slide blueprint, or operator-supplied verified assets. If a precise visible claim cannot be traced, rephrase it as a general teaching statement or block for source repair instead of inventing specifics.

Never ask the image model to generate QR codes, download URLs, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels unless the verified asset policy explicitly supplies them. Real QR/download/UI/paper/logo assets belong in a deterministic verified asset overlay manifest, not in the generated bitmap prompt.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible slide image.

Do not turn operator constraints into slide copy. Phrases such as “汇报讨论用途”, “客观专业版”, “本次汇报边界”, “不在展示页暴露”, local file/script names, `RCA`, `RedCube`, `source intake`, `author_pptx_native`, `slide_blueprint`, or `visual_direction` are production metadata and must stay off the visible slide.

Keep the title safe zone clear. Do not place a section chip, left-top card, badge, tag, or decorative label near or over the main title. If a section marker is needed, use a quiet footer signal or omit it.

Tables must be legible in the final slide image: body text at 11pt-equivalent or larger, compact cell padding, no oversized blank cells, and no large empty text/card containers.
