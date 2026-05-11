# Delivery Docs

`docs/delivery/` holds human-readable deliverable lifecycle material: family examples, route descriptions, proof environments, export expectations, and manual validation briefs.

This layer explains how visual deliverables are shaped and checked. The executable delivery contract remains in runtime-family code, schemas, contract JSON, and generated artifact manifests.

## Current Role

Delivery docs explain current deliverable families, default routes, proof
environments, examples, and manual validation. Route notes that describe older
rendering paths should be labelled as optional, fallback, or historical support
so readers can place them under the current default route.

Current delivery materials:

- [Deliverable examples](./deliverable_examples.md)
- [Image-first PPT production route](./image-first-ppt-production-route.md)
- [Native PPT proof environment](./native-ppt-proof-environment.md)
- [Stable deliverable manual test brief](./stable_deliverable_manual_test_brief.md)

Runtime contracts should use `human_doc:*` semantic pointers for reader context, not this directory layout as a stable machine-readable interface.
