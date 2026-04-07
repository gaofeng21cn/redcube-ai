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
Current repo-verified formal entry surfaces are `MCP` and `CLI`; `controller` is not a repo-verified independent entry in the current mainline.
As long as the same substrate and contracts are kept, this line can later move to a managed web runtime without changing the domain identity.

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
- the current explicitly activated follow-on baton is `Phase 2 activation package freeze for source intake + shared source truth`; it freezes activation conditions, canonical artifacts, gate surfaces, operator flow, minimum tests, and closeout evidence while keeping `Phase 2` implementation closed
- poster support is still incomplete:
  - the current poster lane is a `knowledge poster`
  - academic `paper poster / conference poster` support is still being hardened
- `Phase 2 / source intake + shared source truth` remains closed in the current baton
- OPL federation integration is still a follow-on step

## Documentation

- [Docs index](docs/README.md)

Detailed operator docs remain repo-tracked, but they are not part of the default bilingual public surface unless synchronized English `.md` and Chinese `.zh-CN.md` mirrors are published together.

<details>
<summary><strong>For Technical Collaborators / Agent Executors</strong></summary>

## Runtime Shape

```text
User / Agent
  -> MCP / CLI
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
- The current active mainline is `redcube-runtime-program`: `P0 review-closeout` is passed with a credible clean-clone baseline; `stable deliverable manual-test-driven hardening` is already closed out; and the current explicitly activated follow-on baton is the `Phase 2 activation package freeze for source intake + shared source truth`, which still keeps `P1` and `Phase 2 / source intake + shared source truth` implementation closed.
- shared `Gateway`, run/watch, review, audit, and artifact persistence surfaces are verifiable through `CLI` and `MCP`.

Current honest limits:

- `controller` has not landed as an independent formal entry in this repository.
- `poster_onepager` is only the current `knowledge poster` surface.
- `paper_poster / conference_poster` remains a follow-on academic-poster contract, not the current active mainline.
- The current active mainline remains `redcube-runtime-program`: `P0 review-closeout` is passed with a credible clean-clone baseline; `stable deliverable manual-test-driven hardening` is durably closed; and the currently activated follow-on baton is the `Phase 2 activation package freeze for source intake + shared source truth`. That baton defines activation conditions, canonical source artifacts, gate surfaces, operator flow, minimum tests, and closeout evidence, but it still does not open `P1` or `Phase 2 / source intake + shared source truth` implementation.
- broader source-intake implementation work and OPL federation remain follow-on work after a future explicit promotion decision.

## Recommended Entry Priority

1. `MCP`
2. `CLI`

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
