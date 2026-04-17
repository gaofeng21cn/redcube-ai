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
      The admitted visual-deliverable domain line in the broader `OPL` family
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

`RedCube AI` is not the whole top-level family and it is not just a prompt wrapper around a runtime.
Its job is to own visual-domain truth and governed delivery.

```text
User / Agent
  -> OPL Gateway (optional)
      -> RedCube AI
          -> Runtime Surface
              -> Visual-Domain Truth
```

In plain language:

- `OPL` can sit above this repository, but it does not replace it.
- `RedCube AI` owns the deliverable workflow, review logic, and visual-domain truth.
- The runtime surface is an execution layer, not the same thing as the public product identity.

## What This Repository Is Not

- It is not a claim that a mature managed web frontend has already landed.
- It is not a reason to blur runtime ownership and visual-domain truth into one layer.
- It is not a promise that every poster lane is already publication-grade.

<details>
  <summary><strong>Technical Notes And Current Runtime Truth</strong></summary>

The current truthful mainline is now read as a three-layer contract: `Hermes-Agent` owns long-running managed-runtime hosting, `RedCube AI` owns visual-domain truth, and the default concrete executor remains local `Codex CLI` host-agent runtime.
Current repo-verified public entry surfaces are `CLI` and `MCP`.
`Hermes-Agent` owns the long-running run surface for route / managed execution.
The default concrete executor remains local `Codex CLI` host-agent runtime.
service-safe domain adapter shell is `redcube_service_safe_domain_entry`.
`program_id` is the active mainline control-plane pointer.
`run_id` is the per-run execution handle for one routed delivery execution.

The formal-entry matrix remains `CLI`, `MCP`, and `controller`.
The repository mainline remains `Auto-only`.

Current entry wording remains:

- `operator entry`, `agent entry`
- repo-verified entry surfaces cover `operator entry`, `agent entry`, and one thin service-level `product entry`
- the repo-verified `product entry` service surface already includes `invokeProductEntry`, `invokeFederatedProductEntry`, and `getProductEntrySession`
- `User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- `User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- The mature end-user `product entry` shell is still not landed

The repo-verified lightweight product-entry shell now includes:

- `redcube product preflight`
- `redcube product start`
- `redcube product frontdesk`
- `redcube product invoke`
- `redcube product federate`
- `redcube product session`
- `redcube product manifest`

These surfaces make direct and federated entry more honest and machine-readable, but they do not mean a mature end-user web product has landed.

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

Historical `Hermes` materials remain absorbed provenance and must not be read as current runtime ownership proof.
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
