# RCA Foundry command-surface field retirement closeout

Owner: `RedCube AI`
Purpose: `docs_lifecycle_and_retired_surface_closeout`
State: `history`
Machine boundary: 人读 closeout ledger。本轮机器真相继续归 CLI source/tests、`contracts/foundry_agent_series.json`、core docs 和 repo-native verification output。

## Snapshot

- RUN_SNAPSHOT_TS: `2026-06-07T17:03:28Z`
- Six-repo frozen inventory:
  - `one-person-lab`: `main` at `7fe97760`, aligned with `origin/main`, dirty root checkout with whitepaper / public docs changes and a foreground Temporal worker bound to `src/family-runtime-temporal-provider.ts`; recorded only.
  - `med-autoscience`: `main` at `e2d5069a`, aligned with `origin/main`, dirty root checkout with controller / owner-route work; recorded only.
  - `med-autogrant`: `main` at `0555647`, aligned with `origin/main`, clean.
  - `redcube-ai`: `main` at `a5d3019c`, aligned with `origin/main`, clean before this lane.
  - `opl-meta-agent`: `main` at `c685dbf`, aligned with `origin/main`, clean.
  - `one-person-lab-app`: `main` at `3fee1ce`, aligned with `origin/main`, clean.
- Open PRs: none observed across the six default repos during frozen inventory.
- Remote heads outside `main`: `med-autogrant/feature/ai-narration-contracts` and `one-person-lab-app/codex/stable-full-dmg-size-warning`; not touched.
- RCA worktree scope: root checkout only; no additional RCA worktree was present.
- Post-snapshot activity: this RCA lane only.

## Candidate gates

| Candidate | Value gate | Safety gate | Decision |
| --- | --- | --- | --- |
| Active `frontdoor` wording in RCA Foundry CLI JSON and current status doc | High value: `frontdoor` is a retired public-entry term and should not remain as active machine field naming. | Source/test caller set was small: CLI Foundry surface and CLI v2 smoke assertion. History/tombstone docs still legitimately retain `frontdoor` as provenance. | Landed. |
| Broader RCA docs portfolio stale-word cleanup | Current owner docs already classify historical terms as tombstone/provenance; stale scan did not show another high-confidence active conflict after this lane. | Broader edits would be wording churn. | Deferred. |
| OPL / MAS dirty checkout lanes | Root checkout dirty or active provider process present in family inventory. | Same-scope owner activity not safe for this lane. | Recorded only; not touched. |

## SSOT lane

- Semantic theme: active Foundry Agent command surface naming and retired public-entry vocabulary.
- SSOT owner:
  - `contracts/foundry_agent_series.json` owns series identity, operations and authority boundary.
  - `docs/invariants.md` owns no-resurrection policy for retired public-entry wording.
  - `docs/docs_portfolio_consolidation.md` owns lifecycle placement for historical `frontdoor` wording.
  - `docs/status.md` owns current human readout and must not present retired wording as active command truth.
- Peer docs / surfaces:
  - `apps/redcube-cli/src/cli-parts/foundry-series.ts`: active CLI JSON field owner.
  - `apps/redcube-cli/src/cli-parts/help.ts`: active command help wording.
  - `tests/cli-v2-smoke-cases/workspace-and-deliverables.test.ts`: active CLI grammar assertion.
  - `docs/status.md`: current status prose.
  - `docs/history/**`, `docs/active/README.md`, `docs/docs_portfolio_consolidation.md`: legitimate tombstone/provenance/no-resurrection contexts.

## Content classification

| Surface | Classification | Action |
| --- | --- | --- |
| `foundry_agent_series.direct_frontdoor` | `stale_or_superseded` active machine field | Renamed to `direct_command_surface`. |
| `foundry_agent_series.canonical_opl_frontdoor` | `stale_or_superseded` active machine field | Renamed to `canonical_opl_command_surface`. |
| `foundry_agent_series.ordinary_frontdoor_spine` | `stale_or_superseded` active machine field | Renamed to `ordinary_command_spine`. |
| `redcube foundry` help summary | `conflicts_with_ssot` current help wording | Reworded to command surface. |
| `docs/status.md` CLI paragraph | `conflicts_with_ssot` current status wording | Reworded to command spine. |
| `docs/history/**` and no-resurrection policy docs | `history_or_provenance` / `covered_by_ssot` | Retained. |

## Changed surfaces

- `apps/redcube-cli/src/cli-parts/foundry-series.ts`
- `apps/redcube-cli/src/cli-parts/help.ts`
- `tests/cli-v2-smoke-cases/workspace-and-deliverables.test.ts`
- `docs/status.md`

## Verification

- `npm run build`: pass.
- `node apps/redcube-cli/dist/cli.js status`: pass; output now exposes `direct_command_surface`, `canonical_opl_command_surface` and `ordinary_command_spine`.
- `node --test --test-name-pattern "CLI exposes OPL Foundry Agent series first-layer grammar" tests/cli-v2-smoke-cases/workspace-and-deliverables.test.ts`: pass.
- Active stale scan for `direct_frontdoor|canonical_opl_frontdoor|ordinary_frontdoor_spine|frontdoor` across active source/test/package and active status/docs paths: only no-resurrection and tombstone/provenance contexts remain.
- Full file run of `tests/cli-v2-smoke-cases/workspace-and-deliverables.test.ts` still has two unrelated `deliverable run` failures returning `missing_opl_stage_attempt` typed blocker. They are outside this lane and reflect current RCA route execution owner boundary requiring OPL-owned stage attempt packets.

## Carry-forward

- Do not restore `frontdoor` as active CLI JSON, help, test or current status field naming.
- Historical `frontdoor` remains valid only in tombstone/provenance/no-resurrection contexts.
- Future RCA route-run smoke cleanup should align the two `deliverable run` cases with the current `missing_opl_stage_attempt` owner boundary or provide a valid OPL stage attempt packet.
