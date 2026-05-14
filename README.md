<p align="center">
  <img src="assets/branding/redcube-ai-logo.png" alt="RedCube AI logo" width="132" />
</p>

# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center"><strong>A Foundry Agent for visual deliverables, released as an OPL-compatible package built on the OPL Framework</strong></p>
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

<p align="center">
  <img src="assets/branding/redcube-ai-overview.png" alt="RedCube AI overview" width="100%" />
</p>

> `RedCube AI` is the RedCube Foundry Agent: it keeps source material, generation, review, reruns, progress reporting, and exported files on the same delivery line for formal visual work. Its release shape is one `redcube-ai` app skill plus service-safe domain entry, sidecar/projection, and stage-control projection surfaces.

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

## Current Delivery Focus

- `Slides` for teaching decks, academic talks, internal briefings, and formal reports. The current default PPT route is image-first full-slide authoring; HTML and editable native PPTX are explicit selectable routes.
- `Xiaohongshu notes` for knowledge posts, science communication, and serialized publishing. The default route is GPT-Image-2 full-page 3:4 PNG authoring through `author_image_pages`; HTML remains an explicit maintenance route.
- `Knowledge posters` for single-page visual delivery.
- Academic paper and conference poster lanes continue to be evaluated case by case.

## How It Works

- Experts provide the source material, audience expectations, and final judgment.
- The AI operator handles generation, revision, reruns, export, and progress reporting.
- The workspace keeps sessions, review state, rerun history, and final files together for inspection.

## Current Boundary

- `RedCube AI` is an independent visual-deliverable Foundry Agent. Its first public identity is visual delivery: source intake, staged visual authorship, review, repair, export, and file handoff.
- Public release form: `RedCube AI Foundry Agent`, an OPL-compatible package built on the OPL Framework. The package shape is the single `redcube-ai` app skill, the service-safe domain entry (`invokeDomainEntry`), product sidecar/projection surfaces, and the read-only stage control projection.
- The first public surface is the single `redcube-ai` app skill; `status` / `invoke` / `session` stay as machine-readable command contracts underneath that skill. In that contract, `status` means the agent-facing product-entry overview / intake / entry shell, not a landed GUI, WebUI, or end-user front office.
- Its stable callable surface is the local CLI, MCP/product-entry commands, `invokeDomainEntry`, local scripts, and repo-tracked contracts.
- RedCube's public executor backend contract is `codex_cli` or `hermes_agent`; `execution_shape` is declared separately as `structured_call` or `agent_loop`.
- The implementation target is `TypeScript + Python`: TypeScript for product/runtime contracts and service boundaries, Python via the repo-owned `redcube_ai` helper package for native PPT/Office helpers and document/PPT repair loops under RedCube routes and gates.
- Content framing, audience fit, and final acceptance stay with experts.
- External publishing and upload steps stay under human supervision.

<details>
  <summary><strong>Technical OPL / executor boundary</strong></summary>

- OPL is the stage-led agent runtime framework that can host RedCube as an external domain agent. Its path is an internal integration / hosted-runtime path, not RedCube's first public identity.
- When OPL hosts RedCube, an Agent executor is the minimum concrete execution unit. `Codex CLI` is the current first-class executor unless an explicit hosted/proof backend is selected.
- Hermes-Agent and similar executors are opt-in adapters. RedCube only promises connection, lifecycle, receipts, and auditability for those adapters; it does not assume behavior or output quality matches Codex CLI.
- Both direct and OPL-hosted paths converge on the same downstream RedCube domain-agent entry (`invokeDomainEntry` service-safe surface).
- RedCube owns the visual-deliverable stage pack, prompts, skills, review gates, visual-domain truth, canonical artifacts, and export authority. OPL may provide queue, wakeup, handoff, receipts, retry/dead-letter handling, and projection support, but it does not become the visual-domain brain or artifact owner.

</details>

## How To Read This Repository

1. Potential users should start here, then continue to the [Docs Guide](./docs/README.md).
2. Technical readers and planners should read [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and [Contracts Overview](./contracts/README.md).
3. Developers and maintainers should continue from the [Docs Guide](./docs/README.md) into `docs/active/`, `docs/references/`, and `docs/policies/`.

## Agent And Operator Quick Start

<details>
  <summary><strong>Start here if you are handing this repo to Codex or another agent</strong></summary>

- Read the [Docs Guide](./docs/README.md) first. It explains the direct RedCube route, the OPL-hosted integration path, the stable capability surface, and the current technical baseline.
- Then read [Contracts Overview](./contracts/README.md) plus [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md) before changing entry wording or integration language.
- Treat the public package as `RedCube AI Foundry Agent`: an OPL-compatible package built on the OPL Framework that publishes one app skill, one service-safe domain entry, product sidecar/projection refs, and stage-control projection metadata while keeping domain truth inside RCA.
- The current repo-verified public entry surfaces are the single `redcube-ai` app skill, `CLI`, and `MCP`; `controller` remains the internal control plane. Together with `invokeDomainEntry`, `invokeProductEntry`, local scripts, and repo-tracked contracts, they form the stable callable surface. `Codex CLI` is still the default local concrete executor; hosted/proof backends remain explicit opt-in lanes.
- RedCube can be invoked directly through its Codex app skill or through OPL as an external domain agent. Both routes must converge on the same RedCube-owned route, review, artifact, and export surfaces.
- Treat the implementation surface as TypeScript orchestration plus Python native helpers. Repo-tracked JavaScript is retired; new product, test, or script JavaScript is blocked by the closeout audit.
- When an external agent or OPL wants the repo-tracked skill surface directly, use the single `redcube-ai` app skill and launch CLI-backed commands through `npm run --prefix <redcube-ai-repo> redcube -- ...`; `status` / `invoke` / `session` remain machine-readable command contracts underneath that one skill. `redcube product status` is the current product-status command for the product-entry overview / intake shell; it does not imply a mature human-facing GUI or WebUI. The OPL-hosted path stays an internal integration surface.
- Test lane truth lives in `scripts/test-registry.ts` and the current verification matrix is maintained in [Status](./docs/status.md). `smoke` is the minimal local entry, `fast` is the core regression lane, hosted CI is equivalent to `npm run test:ci`, and `historical` runs only when explicitly requested.
- Use `docs/active/` for current baton records, `docs/history/phase-2/` for absorbed mainline milestones, and `docs/references/` for bridge or provenance material, instead of reconstructing execution truth from scattered implementation files.

</details>

## Further Reading

- [Docs Guide](./docs/README.md)
- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts Overview](./contracts/README.md)
