# Screenshot Review Gate

Owner: RedCube AI
Purpose: protect rendered-page inspection before repair or export.

Gate rules:
- Screenshot review must inspect rendered pages or image-first PNG pages before export.
- The render evidence packet must include page refs, page manifest, non-empty evidence, expected count/aspect ratio signal, duplicate/hash signal, crop/overflow risk, field leakage signal, text/readability signal, material or brand gap refs, and export artifact refs when export has run.
- Missing screenshots, missing page manifests, hard-block visual QA, duplicate page hashes, crop risk, field leakage, unreadable layout, or missing required material status must fail closed to repair refs or typed blockers.
- Repair scope comes from blocked page refs; unblocked pages may be reused only with preserved page refs or hashes.
- Mechanical checks may emit blocker refs, repair target refs, preserved page refs, evidence refs, inventory refs, or no-regression refs. They cannot emit visual ready, exportable, handoffable, publication-ready, review-pass, or source-ready verdicts.
- Agent Lab efficiency telemetry may reference screenshot review gate refs, but cannot issue review verdicts, export verdicts, or visual ready claims.
