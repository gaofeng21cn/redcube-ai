# Artifact Authority Gate

Owner: RedCube AI
Purpose: protect candidate artifact creation, mutation, export packaging, and handoff.

Gate rules:
- Artifact bodies belong in workspace/runtime artifact roots and are referenced through artifact locator contracts.
- Artifact mutation requires RCA route policy, helper catalog refs, repair target refs, or owner receipt refs.
- Native helpers may materialize artifacts, manifests, screenshots, PPTX/PDF, PNG sequences, and package directories.
- Generated OPL surfaces may consume artifact refs; they cannot store artifact bodies or authorize artifact mutation.
