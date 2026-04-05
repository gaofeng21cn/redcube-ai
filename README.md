# RedCube AI

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

## Agent Contract Layering

<!-- AGENT-CONTRACT-BASELINE:START -->
- Root `AGENTS.md` is for development-session coordination in this repository and is not the project truth contract by itself.
- Project truth contract: `contracts/project-truth/AGENTS.md`.
- OMX project-scope orchestration layer: `.codex/AGENTS.md` (for OMX / CODEX_HOME sessions only).
- Optional machine-private overlay: `.omx/local/AGENTS.local.md` (must stay untracked).
- Local runtime state directories `.omx/` and `.codex/` must remain untracked.
<!-- AGENT-CONTRACT-BASELINE:END -->

[![CI](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml)

<p align="center"><strong>Agent-first Visual Deliverable Gateway</strong></p>
<p align="center">PPT Decks · Xiaohongshu Posts · Human-auditable</p>

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

> Externally, RedCube AI is a `Visual Deliverable Gateway`; internally, it runs on an `Agent-first, human-auditable Visual Deliverable Harness OS`.

## Position In The OPL Federation

Under the top-level `One Person Lab (OPL)` semantics:

- `RedCube AI` is the formal gateway for the visual-deliverable domain.
- It is a harness-based runtime surface, not a one-shot script bundle.
- `ppt_deck` is the family currently mapping most directly to `Presentation Ops`.
- `xiaohongshu` shares the same harness but is not automatically equal to `Presentation Ops`.

Target path:

`User / Agent -> OPL Gateway (optional) -> RedCube Gateway -> RedCube Harness OS`

## Fast Start

For most users, the fastest path is to provide your target, audience, source material, and constraints to your agent, then let it run RedCube AI as the gateway.

Typical three-step start:

1. Prepare an isolated workspace and place your source materials in it.
2. Specify deliverable type (`PPT` or `Xiaohongshu`), audience, and final objective.
3. Ask your agent to execute via RedCube AI and review key checkpoints with you.

Continue reading:

- [Human quickstart](docs/human_quickstart.md)
- [Deliverable examples](docs/deliverable_examples.md)
- [Runtime architecture](docs/runtime_architecture.md)

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

## Recommended Entry Priority

1. `MCP`
2. `CLI`

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

- Public docs for GitHub readers live in [`docs/`](docs/README.md).
- `docs/superpowers/` is local AI/Superpowers documentation and should stay ignored.
- Development drafts and transient planning artifacts should not be published as public documentation.
