# RedCube AI Agent Pack

Owner: RedCube AI
Purpose: canonical repo-source semantic pack for the OPL standard domain-agent compiler.
State: active declarative visual pack.
Machine boundary: `agent/` owns stage semantics, prompt policy refs, skills, quality gates, and knowledge policy. Executable handlers, minimal authority functions, and native helpers remain in `packages/`, `apps/`, runtime contracts, and Python helper modules.

This directory is the canonical Declarative Visual Pack for RCA. OPL generated surfaces consume these refs to build CLI, MCP, Skill, product-entry, status, session, domain_action_adapter, and workbench descriptors. They do not write RedCube visual truth, artifact bodies, review/export verdicts, visual memory bodies, or owner receipts.

Legacy detailed assets under `prompts/ppt_deck/` and `prompts/xiaohongshu/` remain implementation/detail prompt assets. Stage-level `prompt_refs` must point to `agent/prompts/*.md`, which then locates the detailed prompt assets by deliverable family and route.
