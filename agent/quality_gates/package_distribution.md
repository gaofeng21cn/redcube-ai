# Package Distribution Gate

Owner: RedCube AI
Purpose: source-to-package consistency gate for RCA domain pack distribution.

Gate rules:
- Packaged plugin or generated surface metadata must preserve every repo-tracked path listed by `required_domain_pack_paths`.
- Packaging may expose RedCube AI refs and skill descriptors, but cannot add runtime authority, route authority, visual verdict authority, artifact mutation authority, or owner receipt authority.
- `author_image_pages` remains the default PPT deck visual route; packaging cannot promote Markdown, Marp, HTML, native PPTX, or helper routes to default.
- Missing source refs, stale plugin refs, or mismatched marketplace paths yield typed blockers before distribution.

Forbidden substitutions:
- A package manifest, marketplace entry, installer result, or generated descriptor cannot replace RCA route truth.
- Source packaging success cannot imply visual ready, exportable, handoffable, or publication-ready verdicts.
