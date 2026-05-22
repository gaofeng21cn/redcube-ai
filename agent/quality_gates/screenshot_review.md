# Screenshot Review Gate

Owner: RedCube AI
Purpose: protect rendered-page inspection before repair or export.

Gate rules:
- Screenshot review must inspect rendered pages or image-first PNG pages before export.
- Missing screenshots, missing page manifests, hard-block visual QA, duplicate page hashes, crop risk, field leakage, or unreadable layout must fail closed to repair refs.
- Repair scope comes from blocked page refs; unblocked pages may be reused only with preserved page refs or hashes.
- Agent Lab efficiency telemetry may reference screenshot review gate refs, but cannot issue review verdicts, export verdicts, or visual ready claims.
