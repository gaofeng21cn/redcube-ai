# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

[![CI](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml)

<p align="center"><strong>Agent-first Visual Deliverable Gateway</strong></p>
<p align="center">PPT Decks · Xiaohongshu Posts · AI-first Intent · Human-auditable</p>

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

> Externally, RedCube AI is a `Visual Deliverable Gateway`; internally, it runs on an `Agent-first, human-auditable Visual Deliverable Harness OS`. Typed contracts are engineering guardrails, not the product identity.

Agent-first here does not mean `external_llm` only. In the Codex / OMX operating model, a `Codex-native host agent` can be the primary creative executor, while code stays on contract, governance, audit, and artifact boundaries.

## What Is Proven Today

The current repository is no longer a loose prototype. The following baseline is already verified on `main`:

- `PPT deck` and `Xiaohongshu note` are both formal families on the same runtime mainline
- `typecheck`, end-to-end routes, review / publish governance, and full regression suite are green
- TypeScript baseline, typed contract surfaces, typed service boundaries, and high-churn package boundaries are covered by a machine-readable closeout audit

In other words: RedCube already works as an agent-first visual-deliverable baseline with typed engineering guardrails, not just a prompt experiment.

## Position In The OPL Federation

Under the top-level `One Person Lab (OPL)` semantics:

- `RedCube AI` is the formal gateway for the visual-deliverable domain.
- It is a harness-based runtime surface, not a one-shot script bundle.
- `ppt_deck` is the family currently mapping most directly to `Presentation Ops`.
- `xiaohongshu` shares the same harness but is not automatically equal to `Presentation Ops`.

Target path:

`User / Agent -> OPL Gateway (optional) -> RedCube Gateway -> RedCube Harness OS`

## Current Scope

RedCube currently has two production-grade baseline families:

| Family | Current state | Typical use |
| --- | --- | --- |
| `ppt_deck` | Verified baseline | Teaching decks, reports, academic talks, internal briefings |
| `xiaohongshu` | Verified baseline | Knowledge posts, science communication, serialized social publishing |

These families share the same:

- gateway
- runtime / harness
- governance model
- reference quality OS
- review / rerun / publish control model

The difference lives in family / profile / pack contracts, not in hidden one-off scripts.

## Lifecycle Model

RedCube is converging on one shared macro lifecycle across families:

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

Review is tracked as a shared dual-layer overlay:

- `visual_director_review`
- `screenshot_review`

Important clarification:

- `research` is not meant to be a Xiaohongshu-only creative stage
- it belongs to shared source readiness / source augmentation
- it should be triggered when source truth is missing, weak, or insufficient for downstream story and visual work

Family-specific route granularity can still differ:

- `Xiaohongshu`
  - story architecture currently maps to `storyline + single_note_plan`
  - delivery packaging currently maps to `publish_copy + export_bundle`
- `PPT deck`
  - story architecture currently maps to `storyline + detailed_outline + slide_blueprint`
  - delivery packaging currently maps to `export_pptx`

The architectural goal is semantic alignment first, not premature route renaming.

## Current Limits

RedCube is already usable, but it is not yet the final form.

Current limits to be honest about:

- creative ownership is still the highest-priority unfinished issue:
  - director-first contracts already exist
  - but deterministic compilers and JS pack logic still own part of the actual expression path
  - full AI-first / director-first authoring has not been fully restored yet
  - the shared dual-layer review model is not fully converged yet:
    - `xiaohongshu` already exposes `visual_director_review + screenshot_review`
    - `ppt_deck` still needs an explicit `visual_director_review` surface
- third-family extension proof is not finished yet
- formal operations / evaluation OS is not finished yet
- OPL federation integration is not finished yet

## Fast Start

For most users, the fastest path is to provide your target, audience, source material, and constraints to your agent, then let it run RedCube AI as the gateway.

Typical three-step start:

1. Prepare an isolated workspace and place your source materials in it.
2. Specify deliverable type (`PPT` or `Xiaohongshu`), audience, and final objective.
3. Ask your agent to execute via RedCube AI and review key checkpoints with you.

Continue reading:

- [Docs index](docs/README.md)

Detailed operator docs remain repo-tracked, but they are not part of the default bilingual public surface unless synchronized English `.md` and Chinese `.zh-CN.md` mirrors are published together.

## Runtime Shape

```text
Agent
  -> Gateway
      -> Overlay
          -> Harness OS
              -> Executor Adapter
              -> Artifact Store
              -> Run Store
              -> Event Log
```

Current lifecycle reality:

- the shared source plane already exists
- both families already share governance, artifacts, and runtime surfaces
- but the creative chain is still not aligned enough:
  - deterministic JS still owns too much of story architecture and visual authorship
  - `ppt_deck` and `xiaohongshu` still expose slightly different route surfaces
  - semantic lifecycle alignment is ahead of route naming convergence

## Recommended Entry Priority

1. `MCP`
2. `CLI`

## What Comes Next

The next long-term direction is not “more random features”. It is:

1. recover AI-first / director-first creative ownership from residual deterministic JS logic
2. prove RedCube is a real extensible visual-deliverable OS
3. turn runtime quality into a true operations / evaluation surface
4. integrate RedCube into the OPL federation as a formal domain node

That next sequence is currently organized as:

- `P19 / Creative Ownership Recovery And Director-First Mainline`
- `P20 / Extension Proof And Third-Family Onboarding`
- `P21 / Operations And Evaluation OS`
- `P22 / OPL Federation Integration`

## Installation And Basic Verification

```bash
npm install
npm test
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

## Documentation Boundary

- `README*` and `docs/README*` define the default bilingual public surface for GitHub readers.
- Detailed `docs/*.md` and `docs/policies/*.md` remain repo-tracked operator/internal docs by default unless they are explicitly promoted with synchronized bilingual mirrors.
- `CONTRIBUTING.md` and `SECURITY.md` are GitHub-recognized repository metadata docs maintained in this repo, but they are outside the default bilingual public surface.
- `docs/superpowers/` is local AI/Superpowers documentation and should stay ignored.
- Development drafts and transient planning artifacts should not be published as public documentation.
