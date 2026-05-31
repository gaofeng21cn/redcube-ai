# RedCube AI Agent Pack

Owner: RedCube AI
Purpose: canonical repo-source semantic pack for the OPL standard domain-agent compiler.
State: active declarative visual pack.
Machine boundary: `agent/` owns stage semantics, prompt policy refs, skills, quality gates, and knowledge policy. Executable handlers, minimal authority functions, and native helpers remain in `packages/`, `apps/`, runtime contracts, and Python helper modules.

This directory is the canonical Declarative Visual Pack for RCA. OPL generated surfaces consume these refs to build CLI, MCP, Skill, product-entry, status, session, domain_action_adapter, and workbench descriptors. They do not write RedCube visual truth, artifact bodies, review/export verdicts, visual memory bodies, or owner receipts.

`contracts/foundry_agent_series.json` and `contracts/domain_descriptor.json` expose the canonical `series_design_profile`: RCA uses the same OPL Agent lifecycle, generic slots, stage sections, closeout shape, and authority invariants as MAS, MAG, and OMA. This pack records the visual-material input profile, visual-deliverable stage semantics, and PPT/PDF/PNG/export handoff output profile through `domain_specific_profile` and RCA-owned contracts.

Legacy detailed assets under `prompts/ppt_deck/` and `prompts/xiaohongshu/` remain implementation/detail prompt assets. Stage-level `prompt_refs` must point to `agent/prompts/*.md`, which then locates the detailed prompt assets by deliverable family and route.
