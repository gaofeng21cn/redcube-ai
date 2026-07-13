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
