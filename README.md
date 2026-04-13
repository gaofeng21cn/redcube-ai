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

The runtime story is no longer purely repo-local.
`RedCube AI` now routes `runDeliverableRoute` plus managed execution through local Codex CLI host-agent runtime and keeps the same durable domain surfaces on top.
The executable baseline is therefore:

- local Codex CLI host-agent runtime owns the run surface for route / managed execution
- `RedCube AI` still owns visual-domain truth, audit, review, export, and deliverable state
- protected creative stages now run through `runtime-family + Codex CLI structured generation`; repo-local `pack/compiler` no longer authors PPT / Xiaohongshu / poster content
- a working `codex exec` surface is now the hard precondition, and route / managed execution fail closed when that proof is missing

Historical repo-local `Hermes` naming still exists in absorbed artifacts and compatibility material, but it must not be read as separate proof of runtime ownership.

The repo-tracked preflight that freezes this truth is the Codex CLI exec probe, backed by `@redcube/codex-cli-client` and `REDCUBE_CODEX_COMMAND`.
The callable service-safe adapter shell for future `OPL Gateway` handoff is `redcube_service_safe_domain_entry`, documented in `contracts/runtime-program/service-safe-domain-entry-adapter.json`.
The same live lanes also freeze `REDCUBE_PYTHON_COMMAND` for screenshot review and export helpers; if it is unset, `scripts/run-test-group.mjs` now probes `python3 -c "import sys; import playwright; print(sys.executable)"` and fails closed when no Playwright-enabled Python can be resolved.

Its formal-entry matrix is now fixed as: default formal entry `CLI`, supported protocol layer `MCP`, internal control surface `controller`.
Current repo-verified public entry surfaces are `CLI` and `MCP`; `controller` remains the internal control surface in the current mainline.
The current repository mainline is `Auto-only`; if a future `Human-in-the-loop` product is built, it should reuse the same substrate as a compatible sibling or upper-layer product.
As long as the same substrate contracts and domain boundaries are kept, this line can later move to a managed web runtime without changing the domain identity.

## Entry Modes And Product Boundary

Today, the repo-verified entry surfaces cover `operator entry`, `agent entry`, and one thin service-level `product entry`.
That means:

- `operator entry`: human/operator commands, workspace preparation, debugging, review, and export control
- `agent entry`: `CLI` plus `MCP`, called by `Codex` or another host-agent
- `product entry`: landed as a repo-verified service surface for direct RedCube entry and OPL federation, while the mature user-facing shell is still not landed

A repo-tracked lightweight product-entry shell is now landed through the `redcube product` command family.
Its current repo-verified surfaces are `redcube product frontdesk`, `redcube product invoke`, `redcube product federate`, `redcube product session`, and `redcube product manifest`; the manifest now also carries a family-orchestration companion preview for gate and resume semantics.
The manifest command is the machine-readable discovery surface for the current shell: it freezes the direct frontdesk plus the direct, federated, and session entry surfaces without pretending the mature end-user front desk has landed.

The current domain-facing direct route is:

`User -> RedCube Product Entry -> RedCube Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

Inside the larger `OPL` family, the compatible top-level route converges onto the same downstream shape:

`User -> OPL Product Entry -> OPL Gateway -> Codex CLI host-agent runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

The historical upstream-Hermes target freeze remains in `docs/program/upstream_hermes_agent_final_target_shape.md` and `contracts/runtime-program/upstream-hermes-agent-final-target-shape.json`.
The repo-verified product-entry service surface now includes `invokeProductEntry`, `invokeFederatedProductEntry`, and `getProductEntrySession`, plus their `CLI` / `MCP` wrappers.
The mature end-user `product entry` shell is still not landed; what landed here is the callable service surface and session continuity, not a chat UI or managed web front-end.
Live `integration` / `e2e` / `full` verification now serializes Node test files with `--test-concurrency=1` so the repo does not overdrive the current local Codex exec plus browser-export host and then misreport host saturation as domain drift.
Those same verification lanes now also carry one explicit Python-helper contract: screenshot review and export helpers must execute through `REDCUBE_PYTHON_COMMAND` or an auto-resolved Playwright-enabled Python, rather than assuming some unrelated runtime environment already contains Playwright.

That handoff should carry one shared minimum envelope:

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

On top of that, `RedCube AI` adds visual-deliverable payload such as `deliverable_family`, `topic_id`, and `deliverable_id`.
That shared envelope is now repo-verified through the `redcube product` shell, with `redcube product manifest` as the discovery surface and `redcube product invoke` / `federate` / `session` as the callable entry surfaces.

For the internal architecture note, see [Lightweight Product Entry And OPL Handoff](docs/references/lightweight_product_entry_and_opl_handoff.md).

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

For most expert users, the fastest path is to hand your goal, audience, source material, and constraints to your own agent, then let it run `RedCube AI`.

Typical three-step start:

1. Prepare an isolated workspace and place your source materials in it.
   This can be a brand-new directory; you do not need to handcraft the full tree first because Codex / your agent can initialize the canonical workspace contract there, including `redcube.workspace.json`, `topics/`, `runtime/`, and `publish/`.
2. Tell your agent whether you want `slides`, a `Xiaohongshu note`, or a `poster`, who the audience is, and what the final goal is.
3. Ask your agent to use `RedCube AI` as the visual-deliverable gateway and keep the work reviewable end to end.

If you want a faster handoff, you can give your agent a one-line start instruction.

`Deep Research` belongs to `Source Readiness`. When the input is too thin, the agent keeps Step 1 on the canonical `source intake -> source augment -> source execute-augmentation` line before moving on.
planning_ready must become the formal machine-readable release gate inside Source Readiness.

If you want one formal entry instead of calling each sub-step yourself, start from `source research`.
It is the shared Step 1 orchestration surface: it runs `source intake` first, then decides whether to stop at canonical result staging or continue into augmentation execution.

If your agent is taking the `result_file` / agent-native route, Step 1 can be expanded more explicitly as:

`source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`

This keeps Step 1 on the same product stage while exposing a formal result scaffold and canonical write surface before execution applies the augmentation back into shared source truth.

Scenario 1, you already prepared reference materials:

> Treat this directory as the isolated RedCube workspace for this project. Run `workspace doctor` first, then `source intake` to read and hydrate the materials I provided; then create the required `topic` and `deliverable`, and move the work through the formal review, rerun, and export chain. For a serialized Xiaohongshu project, create one deliverable per note, for example `note-01`, `note-02`.

Scenario 2, you only have a topic and want facts prepared first:

> Treat this directory as the isolated RedCube workspace for this project. For the topic "{{topic}}", enter `Source Readiness` first: if the input is still insufficient, force `source augmentation` / `Deep Research` until Step 1 reaches `planning_ready`; only create the deliverable and continue the formal delivery chain after the canonical source readiness gate passes. For a serialized Xiaohongshu project, model one deliverable per note.

There is an important boundary to state honestly:

- the current formally stable baseline is `source intake + shared source truth`
- `Deep Research` is now a shared `Source Readiness` augmentation capability on the same canonical source substrate consumed by `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager`
- `planning_ready` is the formal machine-readable release gate for Step 1, while `source_audit = pass` records source-audit completion on the same lane
- its current role is to resolve source insufficiency and evidence gaps before `storyline`
- content strategy and narrative choice still start from `storyline`

The recommended mental model is to treat `RedCube AI` as a runtime operating on one isolated workspace.
The most practical working granularity today is:

- `1 workspace = 1 relatively independent content project or series`
- `1 topic = 1 thematic line`
- `1 deliverable = 1 formal output`, such as `one Xiaohongshu note`, `one PPT deck`, or `one poster`

For a serialized Xiaohongshu project, the default mapping should be:

- `1 workspace = 1 series project`
- `1 topic = 1 series theme`
- `1 deliverable = 1 note in the series`, such as `note-01`, `note-02`

The current canonical workspace contract is:

```text
<workspace>/
├── redcube.workspace.json
├── topics/
│   └── <topic-id>/
│       ├── topic.json
│       ├── inputs/
│       ├── canonical/
│       ├── deliverables/
│       │   └── <deliverable-id>/
│       │       ├── deliverable.json
│       │       ├── artifacts/
│       │       ├── contracts/
│       │       ├── reports/
│       │       └── views/
│       └── runs/
├── runtime/
├── publish/
└── overlays/
```

Important boundary:

- `canonical/`, `contracts/`, and `reports/` are formal runtime-owned surfaces and should normally be maintained by `RedCube AI`, not edited by hand
- on a brand-new empty directory, the first `source intake` already initializes the base workspace contract, including `redcube.workspace.json`, `topics/<topic>/inputs/`, and `topics/<topic>/canonical/`
- `deliverable create` then adds `topic.json`, `deliverable.json`, and the deliverable-specific directories

So the recommended startup order for a fresh directory is:

1. `redcube workspace doctor`
2. `redcube source intake` (when the supplied materials are already sufficient)
3. `redcube source research` (when the workspace is thin or only the topic is known)
4. `redcube deliverable create`
5. `redcube deliverable audit`
6. `redcube deliverable run`

You can give your agent an instruction like this:

> Read the materials in this workspace first. Then decide whether the requested deliverable should be a PPT deck, a Xiaohongshu post, or a knowledge poster. If I already specified the deliverable type, follow that choice. Use RedCube AI (`https://github.com/gaofeng21cn/redcube-ai`) as the visual-deliverable gateway and Domain Harness OS. Make the audience, deliverable goal, information structure, review checkpoints, and export requirements explicit. If the direction is unclear, ask clarifying questions before generating a vague draft.

If you want your agent to start directly from a brand-new directory, you can make the instruction more explicit:

> Treat this directory as the isolated RedCube workspace for this project. If `redcube.workspace.json` is missing, treat `workspace doctor` as the diagnostic step and let `source intake` or `source research` write the canonical workspace contract. Model this project as `1 workspace`, `1 topic`, and one or more `deliverables`. Run `workspace doctor` first, then `source intake` to hydrate shared source truth; if the source set is still insufficient, continue through `source augment` and `source execute-augmentation` until Step 1 reaches `planning_ready`. Then create the target deliverable and move it through the formal review, rerun, and export stages. For a serialized Xiaohongshu project, create one deliverable per note, for example `note-01`, `note-02`, instead of mixing the whole series into one deliverable.

## Current Limits

`RedCube AI` is already usable and continuing toward its fuller long-term form.

The main unfinished areas are:

- `stable deliverable manual-test-driven hardening` has completed closeout for `ppt_deck` and `xiaohongshu`, with a tracked stable backlog and no recorded findings
- `source intake + shared source truth` is now on the mainline as part of the stable `Source Readiness` capability surface; `CLI` and `MCP` hydrate canonical shared source truth on the same substrate, and `ppt_deck` / `xiaohongshu` consume it through the shared gateway mainline
- source-readiness deep research trigger + gate convergence now has an absorbed tranche on the same mainline: `Deep Research` is frozen as shared `Source Readiness` augmentation, and `planning_ready` now gates release through canonical `source-readiness-pack.json`, `source-augmentation-request/result/report`, and `source-research-report`
- review / export / gate / audit hardening now has an absorbed tranche on the same mainline: `auditDeliverable` and `runtimeWatch` surface canonical source readiness plus export gate summaries across the stable families
- current behavior convergence keeps `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` aligned on the same deliverable/topic boundary instead of letting audit and projection drift apart
- family source-truth consumption convergence now has an absorbed tranche on the same mainline: `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager` now converge around one hydrated `source_truth_contract` plus one shared `source_truth_consumption` summary while the authoritative fail-closed source gate stays in `auditDeliverable` / `runtimeWatch`
- publication projection / delivery contract convergence now has an absorbed tranche on the same mainline: `delivery_contract` is now hydrated across `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager`, while `publication-state.json` aligns topic-level projection entries to hydrated delivery contracts plus canonical review state
- direct-delivery operator handoff hardening now has an absorbed tranche on the same mainline: `ppt_deck` and guarded `poster_onepager` now expose one machine-readable `operator_handoff` surface while `xiaohongshu` remains explicit human publication
- direct-delivery lifecycle stage convergence now has an absorbed tranche on the same mainline: `ppt_deck` and guarded `poster_onepager` now expose one machine-readable `lifecycle_stage_contract` plus one aligned `lifecycle_stage_summary`, while `Storyline + Plan` remain mapped to `Story Architecture` and `operator_handoff / closeout` remains inside `Delivery`
- workspace / operator quickstart convergence now has an absorbed tranche on the same mainline: brand-new or thin workspaces now converge on one repo-verified route from `workspace doctor` through `source intake / source research`, `deliverable create`, `deliverable audit`, and `deliverable run` without inventing a separate workspace-init product surface
- operator surface consistency hardening now has an absorbed tranche on the same mainline: `workspace doctor` now keeps brand-new workspace bootstrap guidance on `source intake` / `source research`, command-scoped `--help` stays machine-readable and non-executing, and `CLI review watch` / `MCP runtime_watch` now converge on the same `runtimeWatch` locator truth and shared governance summaries
- the current mainline has already absorbed routed deliverable execution, run records, and shared runtime-topology wording onto local Codex CLI host-agent runtime, while historical upstream `Hermes-Agent` materials remain frozen provenance rather than the next active substrate milestone
- current behavior convergence now also keeps `governance_surface.runtime_topology` aligned across create / review / audit / watch / projection on the same deliverable/topic boundary
- phase-2 runtime watch locator integrity hardening remains absorbed provenance on the same mainline: deliverable-scope run records persist `topic_id` / `deliverable_id`, and `runtimeWatch` / `CLI review watch` / `MCP runtime_watch` fail closed when a quartet locator points at a run from another topic or deliverable
- poster support is still incomplete:
  - the current poster lane is a `knowledge poster`
  - academic `paper poster / conference poster` support is still being hardened
- further source-plane hardening beyond trigger + gate convergence remains follow-on work on the same mainline
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
                  -> Codex CLI host-agent runtime (current route / managed run owner)
                      -> Codex-local operator / development host / workspace bridge
                  -> repo-local managed runtime pilot (historical migration artifact / compatibility bridge)
                  -> managed web runtime (future option after real substrate migration)
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
- The current active mainline has already cut route / managed run ownership to local Codex CLI host-agent runtime: phase-2 source-truth / governance / operator-surface work remains absorbed provenance, and the repository keeps `ppt_deck`, `xiaohongshu`, and guarded `poster_onepager` on the same RedCube visual-domain truth without pretending the historical repo-local runtime is still current owner.
- shared `Gateway`, run/watch, review, audit, and artifact persistence surfaces are verifiable through `CLI` and `MCP`.

Current honest limits:

- `controller` has not landed as an independent formal entry in this repository.
- `poster_onepager` is only the current `knowledge poster` surface.
- `paper_poster / conference_poster` remains a follow-on academic-poster contract, not the current active mainline.
- `Codex-default host-agent runtime` is the current product runtime owner for route / managed execution, while `RedCube AI` continues to own the domain boundary.
- route and managed execution now fail closed onto local Codex CLI proof; the active preflight is `probeCodexCli`, and the service-safe domain adapter shell is `redcube_service_safe_domain_entry`.
- the current fresh proof uses `codex exec`; verification hosts must expose that through `REDCUBE_CODEX_COMMAND` or the default `codex` binary.
- current verification also freezes `REDCUBE_PYTHON_COMMAND` when screenshot review / export helpers need a Playwright-enabled Python interpreter.
- managed web runtime remains future work on the same substrate.
- further source-plane expansion remains follow-on work on the same mainline.
- OPL federation remains follow-on work after the current minimum baseline.

## Recommended Entry Priority

1. `CLI`
2. `MCP`

## Installation And Basic Verification

```bash
npm install
npm run test:full
npm run typecheck
```

Local test layers:

- `npm test` / `npm run test:fast`: lightweight developer smoke slice; in clean CI / clone it now needs Python, Noto CJK fonts, and Playwright because the poster runtime smoke path includes governed screenshot review
- `npm run test:meta`: tracked truth, docs, contract, and TypeScript governance checks
- `npm run test:integration`: broader runtime behavior slice on the same Python / fonts / Playwright review stack
- `npm run test:e2e`: render/export end-to-end tests that need Python, fonts, and Playwright
- `npm run test:full`: full tracked baseline for clean-clone verification

GitHub Actions CI intentionally stays on the quality lane (`npm run typecheck`, `npm run test:fast`, `npm run test:meta`) on hosted runners. Live-upstream `integration` / `e2e` / `full` verification remains an explicit lane for prepared hosts that can prove the real Hermes run surface.

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
