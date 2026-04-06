# Docs

**English** | [中文](./README.zh-CN.md)

This file is the bilingual documentation index for `RedCube AI`.

Public framing:

- External: `RedCube AI` is a `Visual Deliverable Gateway`.
- Internal: it is powered by a `Visual Deliverable Harness OS`.
- Under `OPL` top-level semantics: it is a visual-deliverable domain gateway, not the OPL system itself.
- In the Codex / OMX operating model: `Agent-first` does not mean `external_llm` only; a `Codex-native host agent` can be the primary executor.

Shared lifecycle framing:

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

Shared review overlay:

- `visual_director_review`
- `screenshot_review`

Current capability snapshot:

- `ppt_deck`: verified production-grade baseline family
- `xiaohongshu`: verified production-grade baseline family
- `poster_onepager`: extension-proven `knowledge poster` surface, not an academic-poster closeout

## External Bilingual Surface

This index and the repository home are the default GitHub-facing bilingual public surface.
Any detailed document promoted into that surface must ship with synchronized English `.md` and Chinese `.zh-CN.md` mirrors.

## Repo-Tracked Internal Operator Docs

### For Human Operators

- [Human quickstart](human_quickstart.md) (Chinese only)
- [Deliverable examples](deliverable_examples.md) (Chinese only)

### For Technical Collaborators / Agent Executors

- [Runtime architecture](runtime_architecture.md) (Chinese only)
- [Public GitHub publishing](public-github-publish.md) (Chinese only)

### Private / Local Configuration Docs

- [Private author profile and prompts setup](private-profile-setup.md) (Chinese only, internal/private)

## Stable Internal Rules

- [Policies index](policies/README.md) (Chinese only)
- [Runtime operating model policy](policies/runtime_operating_model.md) (Chinese only)
- [Deliverable contract model policy](policies/deliverable_contract_model.md) (Chinese only)

## Repository History

- [Changelog](../CHANGELOG.md)

## Documentation Boundary

- `README*` and `docs/README*`: the default bilingual public surface
- detailed `docs/*.md`: repo-tracked operator/internal docs by default
- `docs/policies/`: repo-tracked stable internal rules by default
- `docs/superpowers/`: local AI/Superpowers notes, plans, and drafts that should not enter Git-tracked public docs.
