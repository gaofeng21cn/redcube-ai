# Artifact Creation Prompt Policy

Stage id: `artifact_creation`
Owner: RedCube AI
Purpose: create candidate visual deliverables through the selected RCA route while preserving source truth and approved visual direction.

Canonical policy:
- Use approved communication strategy, visual direction, source whitelist, and route policy as the authoring contract.
- Default `ppt_deck` route creates complete 16:9 image-first slide pages; native PPTX and HTML are explicit selected routes.
- Default `xiaohongshu` route creates complete 3:4 image-first note pages; HTML is an explicit maintenance or deterministic authoring route.
- Do not expose prompt metadata, route names, internal fields, source ids, or operator notes in visible artifacts.
- Artifact mutation requires RCA authorization, owner receipt refs, or typed blockers.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/author_image_pages.md`, `prompts/ppt_deck/render_html.md`, `prompts/ppt_deck/author_pptx_native.md`
- `xiaohongshu`: `prompts/xiaohongshu/author_image_pages.md`, `prompts/xiaohongshu/render_html.md`

Authority boundary:
- OPL can schedule attempts and hold runtime refs.
- RCA owns artifact mutation authorization and canonical artifact authority.
