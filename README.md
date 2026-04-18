# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center"><strong>A governed visual-deliverable line for experts who need formal outputs, not one-off drafts</strong></p>
<p align="center">Slides · Xiaohongshu Notes · Posters</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Experts, PIs, and professional teams turning structured knowledge into formal visual deliverables
    </td>
    <td width="33%" valign="top">
      <strong>What It Helps With</strong><br/>
      Governed creation, review, rerun, export, and delivery of visual outputs
    </td>
    <td width="33%" valign="top">
      <strong>Public Role</strong><br/>
      The first-level RCA / RedCube visual-deliverable domain agent under the `OPL` shell
    </td>
  </tr>
</table>

> `RedCube AI` is built for experts who want agent speed without losing control over delivery quality. It helps turn structured knowledge into formal visual outputs that can be reviewed, rerun, and exported on a governed line.

## What It Helps You Do

- Build formal slide decks for teaching, talks, briefings, and internal reports.
- Turn structured knowledge into Xiaohongshu notes for science communication and serial publishing.
- Produce poster-style deliverables on the same controlled line instead of switching tools and losing context.
- Keep review checkpoints, reruns, and exports visible rather than rebuilding the workflow every time.

## Current Deliverable Lanes

| Deliverable | Status | Typical use |
| --- | --- | --- |
| `Slides` | Production-grade baseline | Teaching decks, academic talks, internal briefings, formal reports |
| `Xiaohongshu notes` | Production-grade baseline | Knowledge posts, science communication, serialized publishing |
| `Knowledge posters` | Usable supporting lane | Single-page visual outputs for knowledge delivery |
| Academic paper / conference posters | Still being hardened | Not yet a finished public promise |

## Best-Fit Use Cases

- You already have source material and need it turned into a formal visual deliverable.
- You want one governed process instead of stitching together prompts, design tools, and export steps by hand.
- You need reruns, review checkpoints, and export state to stay visible.
- You want agents to do more execution while experts keep final approval authority.

## How To Read This Repository

1. Potential users should start here, then continue to the [Docs Guide](./docs/README.md).
2. Technical readers and planners should read [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and [Contracts Overview](./contracts/README.md).
3. Developers and maintainers should continue into `docs/program/`, `docs/references/`, `docs/policies/`, and `docs/history/`.

## Plain-Language Boundary

`OPL` is the top-level GUI and management shell for the family.
`RedCube AI` / `RCA` is the first-level visual-deliverable domain module and agent under that shell.
Its job is to own visual-domain truth and governed delivery.

```text
User / Agent
  -> OPL GUI / management shell
      -> RCA / RedCube domain agent
          -> Codex default interaction and execution
              -> RedCube visual-domain truth
          -> Hermes-Agent backup / long-running gateway
```

In plain language:

- `OPL` coordinates RedCube as one domain agent in the broader family.
- `RedCube AI` owns the deliverable workflow, review logic, and visual-domain truth.
- `Codex` is the default interaction and execution host for local operator work and structured generation.
- `Hermes-Agent` stays available for explicit backup execution and long-running online gateway needs.

## Current Public Status

- The public product identity is the RedCube visual-deliverable domain agent under `OPL`.
- Verified entry surfaces are `CLI` and `MCP`; `controller` remains the internal control plane.
- OPL-facing product/frontdesk payloads are machine-readable integration surfaces for the outer shell.
- Academic paper / conference poster lanes are still being hardened.

<details>
  <summary><strong>Technical Notes And Current Execution Truth</strong></summary>

Current operating model:

- `OPL shell`: top-level GUI, management surface, and family coordinator.
- `RCA / RedCube`: first-level visual-deliverable domain module and agent.
- `Codex`: default interaction host, concrete executor, and structured-generation path.
- `Hermes-Agent`: explicit backup mode and long-running online gateway for session / run / watch / resume needs.

Current repo-verified public entry surfaces are `CLI` and `MCP`; `controller` remains internal.
`program_id` is the active mainline control-plane pointer.
`run_id` is the per-run execution handle for one routed delivery execution.
The repository mainline remains `Auto-only`.

Current RedCube domain-agent surfaces include:

- `redcube product preflight`
- `redcube product start`
- `redcube product frontdesk`
- `redcube product invoke`
- `redcube product session`
- `redcube product manifest`

Internal OPL bridge surface:

- `redcube product federate`

That bridge surface belongs in integration references and OPL shell wiring records. First-read user material should keep the simpler model: `OPL shell -> RedCube domain agent -> Codex default execution`, with `Hermes-Agent` available for backup and long-running online work.

Source Readiness wording remains frozen as:

- `Deep Research` belongs to `Source Readiness`
- `source research` remains the explicit operator-facing command surface inside that stage
- `source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`
- `source intake + shared source truth` is now on the mainline as part of the stable `Source Readiness` capability surface
- `planning_ready` must become the formal machine-readable release gate inside Source Readiness
- planning_ready must become the formal machine-readable release gate inside Source Readiness

Absorbed provenance that still stays on the same mainline:

- family source-truth consumption convergence now has an absorbed tranche on the same mainline
- operator surface consistency hardening now has an absorbed tranche on the same mainline
- review / export / gate / audit hardening now has an absorbed tranche on the same mainline
- publication projection / delivery contract convergence now has an absorbed tranche on the same mainline
- phase-2 runtime watch locator integrity hardening remains absorbed provenance on the same mainline
- workspace / operator quickstart convergence now has an absorbed tranche on the same mainline

Historical `Hermes` materials remain absorbed provenance and advanced integration references.
</details>

## Development Verification

GitHub Actions CI intentionally stays on the quality lane.

- `npm run test:fast`
- `npm run test:meta`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:full`
- Serialized Node verification for the heavier Codex-backed groups uses `--test-concurrency=1`.
- If screenshot review or export checks need a Playwright-capable interpreter, point `REDCUBE_PYTHON_COMMAND` at that Python executable.

## Further Reading

- [Docs Guide](./docs/README.md)
- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts Overview](./contracts/README.md)
