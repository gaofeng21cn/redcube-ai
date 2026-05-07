# Runtime Docs

`docs/runtime/` holds human-readable runtime lifecycle material: topology, executor/backend boundaries, service-safe domain entry, runtime watch, review/projection alignment, and substrate ownership notes.

This layer explains runtime responsibilities. Machine-readable contracts remain under `contracts/runtime-program/`, and runtime/projection truth remains in code, schemas, contracts, and generated artifacts.

Current materials:

- [Runtime architecture](./runtime_architecture.md)

Runtime docs may be referenced from contracts through stable `human_doc:*` semantic IDs, but their Markdown paths are not machine APIs.
