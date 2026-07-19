# Review Export Memory Gate

Owner: RedCube AI
Purpose: protect review/export verdicts and visual memory lifecycle.

Gate rules:
- Review verdicts require AI-first inspection of rendered pages, screenshots, or exported artifacts.
- Always preserve the best export candidate or a no-output diagnostic. RCA review/export gates authorize only export-ready and handoff-ready claims; unresolved review findings become quality debt and repair refs without blocking stage transition. Typed blockers are reserved for unavailable executors, wrong-target identity/currentness, authority/safety/permission boundaries, irreversible actions, or explicit human decisions.
- Visual memory writeback proposals must link to rendered artifact evidence and review refs.
- Visual memory accept/reject requires RCA owner judgment and receipt refs.
- OPL may transport review, repair, memory proposal, and receipt refs only.
- Agent Lab efficiency refs, including source pack reuse, prompt/static-prefix cache, blocked-page-only repair, page-local batch telemetry, and export preview cache, remain refs-only observability and cannot replace screenshot review, review/export verdicts, or RCA owner receipts.
- `package_and_handoff` produces new or transformed reviewable bytes after Meta Review. Its producer/repairer output remains a candidate until a fresh reviewer/re-reviewer inspects the declared export/package dependency scopes, rendered equivalence, caption/source fidelity, notes/content consistency, and manifest/file/hash closure. Layout, render, export, or package-only changes do not invalidate accepted content/reference scopes.
- Artifact-identity receipts and exact hashes prove which candidate bytes exist and support separate release-integrity checks; they never become content, claim, reference, quality, export, publication, handoff-ready, or owner-accepted authority. Those claims require a decisive dependency-scoped reviewer/re-reviewer outcome, the controller-materialized formal Review receipt, separate exact-byte integrity evidence where required, and the RCA-signed owner receipt. Attempt role or route name alone grants none of these authorities.
