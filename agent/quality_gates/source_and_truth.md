# Source And Truth Gate

Owner: RedCube AI
Purpose: protect source intake and source truth before downstream visual planning.

Gate rules:
- Source truth must come from approved task inputs, source packages, or explicit user-provided verified assets.
- Missing source evidence yields source-gap refs, quality debt, and when needed a no-output diagnostic; it closes source-ready and downstream ready claims but never blocks stage transition. Typed blockers are reserved for unavailable executors, wrong-target identity/currentness, authority/safety/permission boundaries, irreversible actions, or explicit human decisions.
- Source readiness may be summarized for OPL, but the source judgment remains RCA-owned.
- OPL descriptor admission cannot certify source completeness.
