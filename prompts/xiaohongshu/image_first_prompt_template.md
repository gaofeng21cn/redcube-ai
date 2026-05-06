# Xiaohongshu Image-First Full-Page Prompt Template

Use this template when a `xiaohongshu` page should be generated as a complete GPT-Image-2 bitmap page and then reviewed by RedCube.

## Unified Style Profile

Profile: `xiaohongshu_image_first_note_default_v1`

Keep these defaults active even when `style_reference_dir` is supplied:

- Full 3:4 Xiaohongshu note page image, 1086x1448.
- Clear Chinese title and short labels; avoid tiny paragraphs.
- Warm paper or clean mobile-note background, readable hierarchy, strong cover hook when page role is cover.
- Hand-drawn markers, restrained icons, safe margins, clear bottom closure and author signature grammar.
- Medical and scientific facts must come only from the page fact whitelist.

## Per-Page Prompt Shape

```text
Asset type: Full 3:4 Xiaohongshu note page image, 1086x1448.
Primary request: Create one complete 3:4 Xiaohongshu image page in Chinese, full page, not separate elements.
Exact page title: <short Chinese title>
Page goal: <one page-level purpose>
Fact whitelist: <allowed facts, numbers, dates, treatment boundaries, source labels>
Visual action: <main scene/action/diagram metaphor>
Style: warm paper or clean mobile-note page, readable hierarchy, strong title, limited text, restrained hand-drawn markers, safe margins, stable signature grammar.
Avoid: HTML screenshot, loose icon sheet, photo collage, fake QR code, copied logo, invented institution, copied reference-page facts, tiny dense text, page-number errors, internal metadata.
```

## Override Policy

`style_reference_dir` may point to user-supplied local reference images for style grounding. It must not relax the full-page contract, fact whitelist, medical boundary, no-fragmentation rule, or forbidden content list.
