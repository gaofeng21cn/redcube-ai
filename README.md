<p align="center">
  <img src="assets/branding/redcube-ai-logo.svg" alt="RedCube AI logo" width="132" />
</p>

# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center"><strong>A skill-first visual-deliverable domain agent for turning source material, review cycles, and exported files into one managed delivery line</strong></p>
<p align="center">Slides · Xiaohongshu Notes · Posters</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Experts, PIs, educators, and professional teams turning structured knowledge into formal visual deliverables
    </td>
    <td width="33%" valign="top">
      <strong>What It Organizes</strong><br/>
      Source materials, review comments, reruns, progress updates, and exported files inside one workspace
    </td>
    <td width="33%" valign="top">
      <strong>How To Start</strong><br/>
      Tell it what you want to make, what source material you already have, and what final file you want to deliver
    </td>
  </tr>
</table>

> `RedCube AI` keeps source material, generation, review, reruns, progress reporting, and exported files on the same delivery line for formal visual work, with the single `redcube-ai` app skill as the first public surface.

## One-Sentence Quick Start

You can start with prompts like:

- "Turn these lecture notes and references into a polished teaching deck, keep the progress visible, and leave me editable files."
- "Use this source package to draft a Xiaohongshu note series, tell me what is still missing, and keep each review round traceable."
- "Make a poster from this project summary, track the review comments, and export the final delivery files when the content is ready."

## What It Helps With

- Turning notes, outlines, references, screenshots, and draft fragments into formal slide decks, note series, and poster-style deliverables.
- Keeping multi-round review, reruns, and export checks tied to the same workspace.
- Showing human-readable progress while longer-running jobs continue in the background.
- Delivering editable files that stay connected to their source material and review history.

## Current Delivery Focus

- `Slides` for teaching decks, academic talks, internal briefings, and formal reports.
- `Xiaohongshu notes` for knowledge posts, science communication, and serialized publishing.
- `Knowledge posters` for single-page visual delivery.
- Academic paper and conference poster lanes continue to be evaluated case by case.

## How It Works

- Experts provide the source material, audience expectations, and final judgment.
- The AI operator handles generation, revision, reruns, export, and progress reporting.
- The workspace keeps sessions, review state, rerun history, and final files together for inspection.

## Current Boundary

- `RedCube AI` is an independent visual-deliverable domain agent.
- The first public surface is the single `redcube-ai` app skill; `frontdesk` / `invoke` / `session` stay as machine-readable command contracts underneath that skill.
- Its stable callable surface is the local CLI, MCP/product-entry commands, `invokeDomainEntry`, local scripts, and repo-tracked contracts.
- It covers source intake, deliverable creation, review loops, export, and file-oriented delivery.
- The direct route and the internal OPL bridge both converge on the same downstream RedCube domain-agent entry (`invokeDomainEntry` service-safe surface).
- `OPL` stays at family-level session/runtime/projection orchestration plus shared modules/contracts/indexes, and its federated product-entry path is an internal integration surface rather than the first public story.
- Content framing, audience fit, and final acceptance stay with experts.
- External publishing and upload steps stay under human supervision.

## How To Read This Repository

1. Potential users should start here, then continue to the [Docs Guide](./docs/README.md).
2. Technical readers and planners should read [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and [Contracts Overview](./contracts/README.md).
3. Developers and maintainers should continue from the [Docs Guide](./docs/README.md) into `docs/program/`, `docs/references/`, `docs/policies/`, and `docs/history/`.

## Agent And Operator Quick Start

<details>
  <summary><strong>Start here if you are handing this repo to Codex or another agent</strong></summary>

- Read the [Docs Guide](./docs/README.md) first. It explains the direct route, the internal OPL bridge/reference surface, the stable capability surface, and the current technical baseline.
- Then read [Contracts Overview](./contracts/README.md) plus [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md) before changing entry wording or integration language.
- The current repo-verified public entry surfaces are the single `redcube-ai` app skill, `CLI`, and `MCP`; `controller` remains the internal control plane. Together with `invokeDomainEntry`, `invokeProductEntry`, local scripts, and repo-tracked contracts, they form the stable callable surface. `Codex CLI` is still the default local concrete executor; hosted/proof backends remain explicit opt-in lanes.
- When an external agent or OPL wants the repo-tracked skill surface directly, use the single `redcube-ai` app skill; `frontdesk` / `invoke` / `session` remain machine-readable command contracts underneath that one skill. The OPL federated bridge stays an internal integration surface.
- The hosted quality lane runs `npm run typecheck`, `npm run test:fast`, `npm run test:family`, and `npm run test:meta`; family shared pin checks must stay clean-clone safe through `scripts/run-test-group-lib.mjs`.
- Local `npm run test:integration`, `npm run test:e2e`, and `npm run test:full` still keep the Codex/Python preflight, but only explicit route-heavy files stay serialized; the remaining files use the Node test runner's default concurrency.
- Use `docs/program/` for absorbed mainline milestones and `docs/references/` for bridge or provenance material, instead of reconstructing execution truth from scattered implementation files.

</details>

## Further Reading

- [Docs Guide](./docs/README.md)
- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts Overview](./contracts/README.md)
