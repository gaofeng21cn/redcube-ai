<p align="center">
  <img src="assets/branding/redcube-ai-logo.png" alt="RedCube AI logo" width="132" />
</p>

# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<!--
Owner: `RedCube AI`
Purpose: `public_repository_entry`
State: `current_public_entry`
Machine boundary: Human-readable public entry. Machine truth remains in contracts, schemas, source, CLI/MCP/API behavior, runtime artifacts, owner receipts, artifact locators, and RCA-owned review/export gates.
-->

<p align="center"><strong>An AI workspace for formal visual deliverables, keeping source material, drafts, review, revisions, and exported files on one traceable delivery line.</strong></p>
<p align="center">Slides · Xiaohongshu Notes · Posters</p>

When a task moves from "make a few images" to "produce a visual deliverable I can actually use," the hard part is usually the full workflow, not one page:

- Source material, notes, screenshots, reference images, and old drafts are scattered. How do they become one coherent deliverable?
- After many generated versions, which review comments were addressed, and which version should be rerun?
- Slides, Xiaohongshu notes, and posters need different routes. Can the system choose the right creation path for the deliverable type?
- During longer generation, review, and export runs, can the user still understand what is happening?
- At handoff, can exported files, review records, and source material still match each other?

`RedCube AI` is built around those questions. For knowledge-heavy visual work, it keeps source organization, page generation, review, revision, progress reporting, and export evidence on the same delivery line so a draft can move toward deliverable files.

It does not reduce visual delivery to "generate one image." A usable deliverable often needs several visual directions, layout comparison, missing-material handling, review and repair, and final export checks. RedCube AI keeps those creative decisions and delivery evidence on one line so every revision can explain why it changed and where it landed.

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Experts, PIs, educators, and professional teams turning structured knowledge into formal visual deliverables
    </td>
    <td width="33%" valign="top">
      <strong>What It Organizes</strong><br/>
      Source materials, review comments, reruns, progress updates, and exported files on one traceable delivery line
    </td>
    <td width="33%" valign="top">
      <strong>How To Start</strong><br/>
      Tell it what you want to make, what source material you already have, and what final file you want to deliver
    </td>
  </tr>
</table>

<p align="center">
  <img src="assets/branding/redcube-ai-overview-v2.png" alt="RedCube AI overview" width="100%" />
</p>

## Core Highlights

**Continuous Creation Around The Deliverable**<br/>
It does not stop at a single generated image. It keeps working around a concrete slide deck, note series, or poster, organizing material, generating pages, absorbing review feedback, and preparing final exports.

**Source To Deliverable In One Workspace**<br/>
Lecture notes, project summaries, references, screenshots, old drafts, and review comments stay on one delivery line for inspection and reuse; runtime artifacts live in the task workspace, not in the source checkout.

**Traceable Review And Revision**<br/>
Each review round, rerun, revision target, and export result stays connected, so operators can see why the current version changed.

**Routes Match The Output Type**<br/>
Slides, Xiaohongshu notes, and knowledge posters use different default routes; editable PPTX and HTML routes are explicit selectable routes.

**Progress Stays Visible During Long Jobs**<br/>
During generation, checking, reruns, and export, RCA progress and review surfaces expose the current step, remaining issues, and the next review focus.

**Room For Visual Exploration And Comparison**<br/>
Formal visual delivery often needs multiple directions, repeated-failure diagnosis, variants, and export checks. RedCube AI does not lock creation into one path; candidates, review, repair, and handoff can continue together.

## One-Sentence Quick Start

You can start with prompts like:

- "Turn these lecture notes and references into a polished teaching deck, keep the progress visible, and export the final PPTX/PDF. If I ask for editable slides, use the native PPTX route."
- "Use this source package to draft a Xiaohongshu note series, tell me what is still missing, and keep each review round traceable."
- "Make a poster from this project summary, track the review comments, and export the final delivery files when the content is ready."

## What It Helps With

- Turning notes, outlines, references, screenshots, and draft fragments into formal slide decks, note series, and poster-style deliverables.
- Keeping multi-round review, reruns, and export checks tied to the same workspace.
- Showing human-readable progress while longer-running jobs continue in the background.
- Delivering exported files that stay connected to their source material and review history; editable PPTX is an explicit route when requested.
- Comparing visual directions, finding repeated failure patterns, generating variants, absorbing review, and completing export checks inside the same delivery stage.

## Current Delivery Focus

- `Slides` for teaching decks, academic talks, internal briefings, and formal reports. The current default PPT route is image-first full-slide authoring; HTML and editable native PPTX are explicit selectable routes.
- `Xiaohongshu notes` for knowledge posts, science communication, and serialized publishing. The default route is GPT-Image-2 full-page 3:4 PNG authoring through `author_image_pages`; HTML remains an explicit maintenance route.
- `Knowledge posters` for single-page visual delivery.
- Academic paper and conference poster lanes continue to be evaluated case by case.

## How It Works

- Experts provide the source material, audience expectations, and final judgment.
- The AI operator handles direction exploration, generation, revision, reruns, export, and progress reporting.
- The workspace keeps sessions, review state, rerun history, artifact refs, and export outputs together for inspection.

## Current Boundary

- `RedCube AI` is an independent visual-deliverable Foundry Agent. Its first public identity is visual delivery: source intake, staged visual authorship, review, repair, export, and file handoff.
- The first public surface is the single `redcube-ai` app skill; `Codex`, `OPL`, and other general agents can reach stable capabilities through that skill.
- It can be used as the Presentation Foundry inside One Person Lab, and it can also be called directly by Codex or another agent through stable capability entries.
- RedCube owns material intake, visual generation, review loops, export, and file handoff.
- Content framing, audience fit, and final acceptance stay with experts.
- External publishing and upload steps stay under human supervision.

<details>
  <summary><strong>Technical OPL / executor boundary</strong></summary>

- OPL can host RedCube as an external domain agent, but that hosted path is an internal integration surface, not RedCube's first public identity.
- After task start, OPL/Temporal may own persistent scheduling, wakeup, retry/dead-letter handling, and resume. RCA does not embed a daemon, scheduler, or attempt loop.
- `Codex CLI` is the current first-class executor; Hermes-Agent, Claude Code, and similar executors are explicit opt-in adapters with auditable receipts.
- RedCube keeps the visual-deliverable authority: visual-domain truth, review/export gates, canonical artifacts, artifact handoff, and owner receipts.
- The full entry taxonomy, service-safe domain entry, generated-wrapper boundary, contract refs, canary evidence, and no-readiness rules are maintained in the [Docs Guide](./docs/README.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and [Contracts Overview](./contracts/README.md).

</details>

## How To Read This Repository

1. Potential users should start here, then continue to the [Docs Guide](./docs/README.md).
2. Technical readers and planners should read [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and [Contracts Overview](./contracts/README.md).
3. Developers and maintainers should continue from the [Docs Guide](./docs/README.md) into `docs/active/`, `docs/references/`, and `docs/policies/`.

## Agent And Operator Quick Start

<details>
  <summary><strong>Start here if you are handing this repo to Codex or another agent</strong></summary>

- Cloning this repo does not install the OPL Framework or hosted runtime. If you need hosted execution, prepare the current `one-person-lab` checkout or release bundle first.
- Read the [Docs Guide](./docs/README.md) first, then [Contracts Overview](./contracts/README.md), [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md).
- Treat the public package as `RedCube AI Foundry Agent`: one app skill and one service-safe domain entry, with OPL-generated wrapper/projection refs and visual-domain truth kept inside RCA.
- Direct RedCube use and OPL-hosted use must converge on the same RedCube-owned route, review, artifact, and export surfaces.
- Use the repo-local commands, command targets, and verification matrix maintained in the Docs Guide, contracts, and `scripts/test-registry.ts`; do not reconstruct current execution truth from scattered implementation files.
- Use `docs/active/` for current baton records, `docs/references/` for current support references, and `docs/history/` for absorbed milestones, proof records, tombstones, and provenance.

</details>

## Further Reading

- [Docs Guide](./docs/README.md)
- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts Overview](./contracts/README.md)
