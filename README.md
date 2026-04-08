# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center"><strong>Agent-first Visual Deliverable Gateway</strong></p>
<p align="center">Slides · Xiaohongshu Notes · Posters</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Experts, PIs, and professional teams delivering visual outcomes from structured knowledge.
    </td>
    <td width="33%" valign="top">
      <strong>What It Controls</strong><br/>
      Deliverable quality, review cadence, stage gates, and closeout from draft to export.
    </td>
    <td width="33%" valign="top">
      <strong>What It Produces</strong><br/>
      High-quality visual deliverables for teaching, reporting, communication, and publishing.
    </td>
  </tr>
</table>

> `RedCube AI` helps experts turn structured knowledge into formal visual deliverables that can be reviewed, rerun, and exported with more control.
> It is the visual-deliverable `Domain Harness OS` on the shared `Unified Harness Engineering Substrate`.

## Product Position

If your goal is to keep turning structured knowledge into formal visual outputs, `RedCube AI` gives you one governed delivery line instead of a pile of one-off prompts, scattered scripts, and manual cleanup.

It is designed for experts who want the speed of agents without losing control over quality.

Today, its default local execution shape is the `Codex-default host-agent runtime`.
Its formal-entry matrix is now fixed as: default formal entry `CLI`, supported protocol layer `MCP`, internal control surface `controller`.
Current repo-verified public entry surfaces are `CLI` and `MCP`; `controller` is not a repo-verified independent public formal entry in the current mainline.
The current repository mainline is `Auto-only`; if a future `Human-in-the-loop` product is built, it should reuse the same substrate as a compatible sibling or upper-layer product rather than split this repository into same-repo dual-mode logic.
As long as the same substrate and contracts are kept, this line can later move to a managed web runtime without changing the domain identity.

The current mainline also freezes one explicit execution-handle and durable-surface contract:

- `program_id` is the active mainline control-plane pointer.
- `topic_id` is the topic aggregate identity for canonical source truth and publication projection.
- `deliverable_id` is the durable deliverable identity for review, export, and delivery contracts.
- `run_id` is the per-run execution handle for one routed delivery execution.
- `auditDeliverable` / `runtimeWatch` are the current canonical audit-and-watch surfaces.
- `getReviewState` / `getPublicationProjection` are the current canonical review-and-projection surfaces.
- on the same deliverable/topic boundary, `auditDeliverable` and `runtimeWatch` now stay aligned with the canonical `review_state`, topic-level `publication_projection`, and hydrated `delivery_contract`

## What It Helps You Do

- Turn source materials into formal `slides` for teaching, reporting, academic talks, and internal briefings.
- Turn structured knowledge into `Xiaohongshu notes` for science communication, educational publishing, and serialized content.
- Produce single-page `posters` when you need something more shareable than slides and more structured than a social post.
- Keep review checkpoints, reruns, and exports inside one governed process instead of rebuilding the workflow every time.

## Current Deliverables

| Deliverable | Current state | Typical use |
| --- | --- | --- |
| `Slides` | Production-grade baseline | Teaching decks, academic talks, internal briefings, formal reports |
| `Xiaohongshu notes` | Production-grade baseline | Knowledge posts, science communication, serialized publishing |
| `Posters` | Partially complete | The current poster surface is a `knowledge poster`; academic paper/conference poster support is still being hardened |

Important boundary for the poster lane:

- poster support already exists
- the current poster surface is useful for `knowledge posters`
- a full academic `paper poster / conference poster` contract is still a follow-on program

## Why It Exists

Many content-generation tools are good at producing a draft quickly but weak at controlling delivery quality.

`RedCube AI` is built around a different priority:

- decide what the deliverable is actually for before generating final output
- keep intermediate state reviewable instead of hiding everything in transient chat context
- let agents do the heavy execution while humans keep approval authority
- treat review, rerun, and export as first-class parts of the workflow

## Best-Fit Use Cases

`RedCube AI` is especially useful when:

- you already have source materials and need to turn them into a formal visual deliverable
- you want one governed pipeline instead of separate slide, social-post, and export workflows
- you care about review checkpoints, not just one-shot generation
- you want an agent to do the heavy execution while a human stays in charge of acceptance

## Fast Start Through Your Agent

For most expert users, the fastest path is not to learn low-level commands first. The better entry is to hand your goal, audience, source material, and constraints to your own agent, then let it run `RedCube AI`.

Typical three-step start:

1. Prepare an isolated workspace and place your source materials in it.
2. Tell your agent whether you want `slides`, a `Xiaohongshu note`, or a `poster`, who the audience is, and what the final goal is.
3. Ask your agent to use `RedCube AI` as the visual-deliverable gateway and keep the work reviewable end to end.

You can give your agent an instruction like this:

> Read the materials in this workspace first. Then decide whether the requested deliverable should be a PPT deck, a Xiaohongshu post, or a knowledge poster. If I already specified the deliverable type, follow that choice. Use RedCube AI (`https://github.com/gaofeng21cn/redcube-ai`) as the visual-deliverable gateway and Domain Harness OS. Make the audience, deliverable goal, information structure, review checkpoints, and export requirements explicit. If the direction is unclear, ask clarifying questions before generating a vague draft.

## Current Limits

`RedCube AI` is already usable, but it is not yet the final form.

The main unfinished areas are:

- `stable deliverable manual-test-driven hardening` has completed closeout for `ppt_deck` and `xiaohongshu`, with a tracked stable backlog and no recorded findings
- `source intake + shared source truth` is now on the mainline as part of the stable `Source Readiness` capability surface; `CLI` and `MCP` hydrate canonical shared source truth on the same substrate, and `ppt_deck` / `xiaohongshu` consume it through the shared gateway mainline
- review / export / gate / audit hardening now has an absorbed tranche on the same mainline: `auditDeliverable` and `runtimeWatch` surface canonical source readiness plus export gate summaries across the stable families
- current behavior convergence keeps `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` aligned on the same deliverable/topic boundary instead of letting audit and projection drift apart
- family source-truth consumption convergence now has an absorbed tranche on the same mainline: `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager` now converge around one hydrated `source_truth_contract` plus one shared `source_truth_consumption` summary while the authoritative fail-closed source gate stays in `auditDeliverable` / `runtimeWatch`
- publication projection / delivery contract convergence now has an absorbed tranche on the same mainline: `delivery_contract` is now hydrated across `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager`, while `publication-state.json` aligns topic-level projection entries to hydrated delivery contracts plus canonical review state
- direct-delivery operator handoff hardening now has an absorbed tranche on the same mainline: `ppt_deck` and guarded `poster_onepager` now expose one machine-readable `operator_handoff` surface while `xiaohongshu` remains explicit human publication
- poster support is still incomplete:
  - the current poster lane is a `knowledge poster`
  - academic `paper poster / conference poster` support is still being hardened
- broader source-plane expansion remains follow-on work on the same mainline
- OPL federation integration is still a follow-on step

## Documentation

- [Docs index](docs/README.md)

Detailed operator docs remain repo-tracked, but they are not part of the default bilingual public surface unless synchronized English `.md` and Chinese `.zh-CN.md` mirrors are published together.

<details>
<summary><strong>For Technical Collaborators / Agent Executors</strong></summary>

## Runtime Shape

```text
User / Agent
  -> CLI (default) / MCP
      -> Gateway
          -> Overlay / Family / Profile / Pack
              -> Domain Harness OS (on Unified Harness Engineering Substrate)
                  -> Codex-default host-agent runtime (current default)
                  -> managed web runtime (future option on same substrate)
```

Formal control chain:

```text
Gateway
      -> Overlay / Family / Profile / Pack
          -> Harness Execution
              -> Artifact Store / Run Store / Event Log
```

## Current Technical Reality

Current repo mainline has these verified runtime surfaces:

- `P19 / Creative Ownership Recovery And Director-First Mainline` is treated as completed and non-regressing.
- `P20 / Extension Proof And Third-Family Onboarding` is completed for `poster_onepager` as a `knowledge poster` extension proof.
- `P21 / Operations And Evaluation OS` has repo-visible closeout artifacts and is treated as completed scope, not the current active mainline.
- The current active mainline is `redcube-runtime-program`: `P0 review-closeout` is passed with a credible clean-clone baseline; `stable deliverable manual-test-driven hardening` is already closed out; `Phase 2 activation package freeze` is completed and absorbed; `source intake + shared source truth` is already a stable `Source Readiness` capability surface for `ppt_deck` and `xiaohongshu` through `CLI` and `MCP`; `review / export / gate / audit hardening` remains absorbed provenance; `family source-truth consumption convergence` remains absorbed provenance; `publication projection / delivery contract convergence` remains absorbed provenance; and the current absorbed tranche freezes direct-delivery `operator_handoff` semantics across `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` while keeping `xiaohongshu` human publication semantics distinct from `ppt_deck` / `poster_onepager` direct delivery.
- shared `Gateway`, run/watch, review, audit, and artifact persistence surfaces are verifiable through `CLI` and `MCP`.

Current honest limits:

- `controller` has not landed as an independent formal entry in this repository.
- `poster_onepager` is only the current `knowledge poster` surface.
- `paper_poster / conference_poster` remains a follow-on academic-poster contract, not the current active mainline.
- the current active tranche is `direct-delivery operator handoff hardening`, but the product longrun goal is broader than that one absorbed tranche.
- further source-plane expansion remains follow-on work on the same mainline.
- OPL federation remains follow-on work after the current minimum baseline.

## Recommended Entry Priority

1. `CLI`
2. `MCP`

## Installation And Basic Verification

```bash
npm install
npm test
npm run typecheck
```

CLI:

```bash
npm run redcube -- help
```

MCP:

```bash
npm run mcp
```

Minimal CLI example:

```bash
npm run redcube -- deliverable create \
  --workspace-root /ABS/PATH/TO/WORKSPACE \
  --overlay ppt_deck \
  --profile-id lecture_student \
  --topic-id thyroid-basics \
  --deliverable-id lecture-01 \
  --title "Thyroid Basics" \
  --goal "Explain thyroid fundamentals to undergraduate students"
```

</details>

## Documentation Boundary

- `README*` and `docs/README*` define the default bilingual public surface for GitHub readers.
- Detailed `docs/*.md` and `docs/policies/*.md` remain repo-tracked operator/internal docs by default unless they are explicitly promoted with synchronized bilingual mirrors.
- `docs/superpowers/` is local AI/Superpowers documentation and should stay ignored.
- Development drafts and transient planning artifacts should not be published as public documentation.
