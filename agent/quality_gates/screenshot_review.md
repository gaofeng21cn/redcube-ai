# Screenshot Review Gate

Owner: RedCube AI
Purpose: protect rendered-page inspection before repair or export.

Gate rules:
- Screenshot review must inspect rendered pages or image-first PNG pages before export.
- The render evidence packet must include page refs, page manifest, non-empty evidence, expected count/aspect ratio signal, duplicate/hash signal, crop/overflow risk, field leakage signal, text/readability signal, material or brand gap refs, and export artifact refs when export has run.
- Zero readable screenshots or a corrupt/unreadable visual artifact is a hard stop. Missing page manifests, provenance gaps, duplicate hashes, crop risk, field leakage, unreadable layout, ordinary visual QA, or missing material status records non-blocking quality debt plus repair refs; it blocks ready claims, not stage transition.
- Review and repair retries are a bounded quality budget. When the budget is exhausted, preserve the best consumable artifact and continue to packaging/export with `completed_with_quality_debt`.
- Repair scope comes from blocked page refs; unblocked pages may be reused only with preserved page refs or hashes.
- Mechanical checks may emit blocker refs, repair target refs, preserved page refs, evidence refs, inventory refs, or no-regression refs. They cannot emit visual ready, exportable, handoffable, publication-ready, review-pass, or source-ready verdicts.
- Agent Lab efficiency telemetry may reference screenshot review gate refs, but cannot issue review verdicts, export verdicts, or visual ready claims.
- Screenshot/render gates block review, export, handoff, publication, and readiness claims when rendered evidence is missing or unsafe. They do not block ordinary communication strategy, visual direction exploration, candidate generation, or source triage that does not claim rendered artifact readiness.
