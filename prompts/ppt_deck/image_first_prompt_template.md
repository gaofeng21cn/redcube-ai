# PPT Deck Image-First Full-Slide Prompt Template

Use this template when a `ppt_deck` page should be generated as a complete GPT-image-2 full-slide bitmap and later assembled by HTML/PPTX tooling.

## Unified Style Profile

Profile: `ppt_deck_image_first_handdrawn_medical_default_v1`

Keep the default style constraints active even when `style_reference_dir` is supplied by the user:

- White dotted notebook paper background with subtle paper texture.
- Bold black hand-drawn sketch outlines and hand-drawn arrows.
- Pastel marker blocks in mint green, sky blue, soft yellow, with small red only for risk or boundary emphasis.
- Sticker tape corners, a few medical/system icons, large Chinese main title, few short Chinese labels, minimal small text.
- Avoid forbidden styles from the profile.

## Per-Slide Prompt Shape

```text
Use case: <teaching-medical-concept | medical-platform-architecture | governance-boundary | summary>
Asset type: Full 16:9 PPT slide page image, 1920x1080.
Primary request: Create a complete 16:9 PPT slide page image in Chinese, full page, as one single finished lecture slide, not separate elements.
Exact main title: <short Chinese title>
Content structure: <one core judgement, full-page layout, major diagram parts, arrows, callouts, and limited labels>
Style: white dotted notebook paper background, bold black sketch outlines, pastel marker blocks, hand-drawn arrows, sticker tape, small medical/system icons, large readable Chinese title, few short labels.
Facts: only use whitelisted shared source truth, approved slide blueprint text, and verified operator assets; if source support is missing, use general wording.
Avoid: dark futuristic console, cyberpunk dashboard, glassmorphism, photo collage, 3D dashboard, dense data table, excessive gradient, logo watermark, screenshot collage, English-heavy labels, tiny unreadable paragraphs, isolated icon sets, separate components, page numbers, slide numbers, chapter tabs, fake QR codes, fake download links, fake DOI, fake logo, unverified hospital names, unverified patient demographics, unverified publication status.
```

## Override Policy

`style_reference_dir` may point to user-supplied local reference images for inspiration. It must not relax the full-slide contract, Chinese lecture readability, medical boundary defaults, fragmentation controls, or forbidden style list.

Verified QR/download/UI/paper/logo assets are handled after generation through a deterministic overlay manifest and machine checks when applicable. Do not use PIL, Canvas, or HTML rebuilds to patch model-composed page errors; redraw blocked pages through `repair_image_pages`.
