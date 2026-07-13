# Package Distribution Gate

Owner: RedCube AI
Purpose: source-to-package consistency gate for RCA domain pack distribution.

Gate rules:
- Packaged plugin or generated surface metadata must preserve every repo-tracked path listed by `required_domain_pack_paths`.
- Packaging may expose RedCube AI refs and skill descriptors, but cannot add runtime authority, route authority, visual verdict authority, artifact mutation authority, or owner receipt authority.
- `author_image_pages` remains the default PPT deck visual route; packaging cannot promote Markdown, Marp, HTML, native PPTX, or helper routes to default.
- Missing source refs, stale plugin refs, or mismatched marketplace paths close the distribution-ready claim and produce quality debt plus exact repair refs. The stage still materializes the best package candidate or a no-output diagnostic and may advance. Typed blockers are reserved for unavailable executors, wrong-target identity/currentness, authority/safety/permission boundaries, irreversible actions, or explicit human decisions.

Forbidden substitutions:
- A package manifest, marketplace entry, installer result, or generated descriptor cannot replace RCA route truth.
- Source packaging success cannot imply visual ready, exportable, handoffable, or publication-ready verdicts.
