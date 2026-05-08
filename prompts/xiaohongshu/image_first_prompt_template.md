# Xiaohongshu Image-First Full-Page Prompt Template

Use this template when a `xiaohongshu` page should be generated as a complete GPT-Image-2 bitmap page and then reviewed by RedCube.

## Unified Style Profile

Profile: `xiaohongshu_image_first_medical_handdrawn_note_default_v1`

Keep these defaults active even when `style_reference_dir` is supplied:

- Full 3:4 Xiaohongshu note page image, 1086x1448.
- Clear Chinese title and short labels; avoid tiny paragraphs.
- Warm dotted notebook paper or clean mobile-note background, readable hierarchy, strong cover hook when page role is cover.
- Bold black hand-drawn Chinese lettering, pastel marker blocks, taped paper corners, restrained medical icons, safe margins, and clear bottom closure.
- Built-in RCA style references, when present, are sanitized no-author visual templates; use them for visual grammar only.
- For medical/science information pages, use medium-density mobile-readable structure: one core judgement, three short main information modules, and one boundary note when safety/action risk is present.
- Keep lower-half content substantive on non-cover pages; do not leave the bottom half as decoration-only whitespace.
- Medical and scientific facts must come only from the page fact whitelist.

## Per-Page Prompt Shape

```text
Asset type: Full 3:4 Xiaohongshu note page image, 1086x1448.
Primary request: Create one complete 3:4 Xiaohongshu image page in Chinese, full page, not separate elements.
Exact page title: <short Chinese title>
Page goal: <one page-level purpose>
Fact whitelist: <allowed facts, numbers, dates, treatment boundaries, source labels>
Visual action: <main scene/action/diagram metaphor>
Readable density: <core judgement + 3 short modules + boundary note when applicable; module text 8-14 Chinese chars preferred>.
Layout rhythm: <unique layout family for this page; lower-half substantive module; avoid repeating adjacent page composition>.
Style: warm paper or clean mobile-note page, readable hierarchy, strong title, medium-density but mobile readable text, restrained hand-drawn markers, taped note-card grammar, safe margins, stable signature grammar.
Avoid: HTML screenshot, loose icon sheet, photo collage, fake QR code, copied logo, invented institution, copied reference-page facts, title-only keyword tags, tiny dense text, lower-half decoration-only layout, page-number errors, internal metadata.
```

## Override Policy

By default, RCA may supply a curated built-in no-author style reference template for style grounding in the style manifest. `style_reference_dir` may point to user-supplied local reference images and replaces the built-in reference manifest for that deliverable. Neither built-in nor user-supplied references may relax the full-page contract, fact whitelist, medical boundary, no-fragmentation rule, or forbidden content list.
