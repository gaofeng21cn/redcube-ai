# RCA Domain Tool Affordances

Owner: `redcube-ai`
Purpose: `domain_tool_affordance_catalog`
State: `advisory_current_contract`
Machine boundary: This file declares available domain tool affordances for RCA stage attempts. It is not a workflow script, executor sequence, review verdict, export verdict, owner receipt, or visual truth source.

## Boundary

RCA stage attempts may use tools to read source context, inspect visual workspaces, render or screenshot artifacts, and produce refs-only evidence. Tool use stays inside the permission, credential, write-scope, side-effect, and forbidden-authority boundaries declared by `contracts/pack_compiler_input.json`, `agent/stages/manifest.json`, and `contracts/cognitive_kernel_adoption.json`; the runtime stage projection is OPL-generated at `opl-generated:family_stage_control_plane`.

Tool affordances are advisory capabilities, not workflow control. They may expose ways to inspect, render, compare, and repair, but they do not prescribe executor order, choose the visual route, score candidates, or replace AI-first communication / visual direction judgment.

## Affordances

- `source_context_and_visual_brief_reading`: Read source readiness, audience constraints, brand cues, and deliverable requirements for grounded visual work.
- `visual_direction_and_candidate_generation_support`: Generate and compare visual direction candidates while preserving artifact lineage.
- `native_ppt_render_screenshot_and_export_helpers`: Render, screenshot, and package deliverables when the stage and owner boundary permit artifact operations.
- `visual_review_repair_and_artifact_lineage_support`: Support review, targeted repair, export checks, and no-regression evidence without converting tool output into RCA verdicts.

## Forbidden Authority

- Tools do not declare visual-ready, review-ready, export-ready, handoff-ready, App release ready, or production ready.
- Tools do not write visual truth, review verdict body, export verdict body, visual memory body, or artifact body without RCA artifact authority.
- Tools do not prescribe executor order, candidate strategy, stage goal, or required parallelism.
- Tools and visual memory refs do not become visual route scorers, winning-layout generators, review-pass gates, export gates, artifact-ready signals, or owner receipts.
