# Product Docs

`docs/product/` holds human-facing product and operator materials: quickstart guidance, product-entry handoff notes, profile setup, and publishing coordination.

This layer explains how a person or agent should approach RedCube AI as a product surface. It does not define machine-readable runtime truth.

## Current Role

Product docs sit below the repository home and above runtime/delivery details.
They explain how a human or operator approaches RedCube AI today. Historical
publishing or setup notes stay here only while they still support the current
product surface; completed or superseded plans move to history after link
review.

Current product-facing materials still being consolidated:

- [Human quickstart](./human_quickstart.md)
- [Private profile setup](./private-profile-setup.md)
- [Public GitHub publishing](./public-github-publish.md)

Runtime contracts should continue to use `human_doc:*` semantic pointers or contract/schema/source paths, not prose document paths.
