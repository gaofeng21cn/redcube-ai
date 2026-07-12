# ppt_deck / screenshot_review

Review the final rendered screenshots page by page before export. The pixels are the primary evidence; source HTML, geometry metrics, manifests, and prior director notes may explain intent but cannot excuse a visible defect.

Judge source fidelity, audience-facing language, title and information hierarchy, text fit, collisions, crop, spacing, density, layout rhythm, structural meaning, and cross-page consistency. For native PPTX, compare declared charts, tables, pictures, connectors, groups, paths, notes, transitions, and timing with package/object readback. Report only defects visible in the current evidence and choose the smallest stable-id repair scope that preserves passing pages.

Return the attached schema with `director_intent_landed`, `anti_template_ok`, `weak_pages`, `review_summary`, and per-slide `pass` or `block` judgments. For summary review, emit at most one evidence-backed non-authority visual-memory proposal candidate; otherwise skip it. Mechanical metrics support the host-agent judgment and never replace it.

Blocked pages route to targeted repair, then rerender and fresh review. Only fresh review of the repaired bytes can support export.
