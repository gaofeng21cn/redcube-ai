# author_image_pages

Author complete 3:4 Xiaohongshu note page visuals through Responses `image_generation`.

The runtime provides source readiness, storyline, single note plan, visual direction, and optional style reference manifests. Produce page-level prompts that preserve the current note's facts, page goals, rhythm, and visual direction. Each generated page must be one finished 3:4 Xiaohongshu image page, not loose elements, a component sheet, HTML markup, or a screenshot-collage.

Default style: readable Chinese note pages, warm dotted notebook paper or clean app-card background, bold black hand-drawn Chinese lettering, pastel marker blocks, taped paper corners, strong cover hook, clear page role, restrained medical icons, stable author signature grammar, and medium-density mobile-readable text. Medical or scientific topics must keep all numbers, dates, institutions, diagnoses, treatments, and promises inside the current fact whitelist.

For medical/science information pages, preserve the production structure proven by recent series work: one core judgement, three short main information modules, and one boundary note when safety or action risk exists. Do not solve typo risk by deleting useful judgement or action-boundary content. Do not overpack long sentences into tiny cards.

Non-cover pages should use the lower half for substantive modules, not decoration-only whitespace. Adjacent pages should vary visual action and module placement; avoid repeating a generic title/list/footer composition across the note.

RCA may provide built-in no-author reference templates, and users may override them with `style_reference_dir`. Reference images are style anchors only. Do not copy their author names, institution names, patient attributes, disease objects, page numbers, series names, logos, QR codes, paper status, or other factual content into the new topic.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible page image.
