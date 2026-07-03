# OPL Standard Agent Principles Projection

Owner: `one-person-lab`
Purpose: repo-local projection of the OPL standard-agent AI-first principle pack.
State: `active_projection`
Machine boundary: this file defines the principle ids consumed by `contracts/standard-agent-principles-adoption.json`. Canonical OPL policy remains in `human_doc:one-person-lab/docs/invariants.md#OPL 内部 8 项原则`, `human_doc:one-person-lab/docs/project.md`, and `contracts/opl-framework/standard-domain-agent-skeleton-contract.json`.

This projection does not create a second truth source. OPL owns the shared principle vocabulary; RCA owns visual truth, layout/review/export verdicts, artifact authority, visual memory accept/reject decisions, and owner receipts.

| Principle id | Principle | Domain adoption meaning |
| --- | --- | --- |
| `opl.truth-owner` | 真相归主 | Domain truth, quality/export verdicts, artifact authority, memory body, owner receipts, and typed blockers stay with the domain owner. |
| `opl.big-rocks-first` | 抓大放小 | Hard gates protect authority, safety, permission, human decision, irreversible writes, and receipt boundaries; diagnostics stay advisory unless they break those boundaries. |
| `opl.goal-before-path` | 目标先于路径 | Progress is measured by owner answers, artifact deltas, route-back refs, typed blockers, or human gates, not by runtime status alone. |
| `opl.ai-first-contract-light` | AI-first / contract-light | Selected AI executors perform open-ended expert work; contracts hold refs, permissions, expected receipts, and fail-closed boundaries. |
| `opl.stage-delivery` | 阶段交付 | Stage packs launch bounded work with inputs, outputs, owner, authority, quality gate, receipt, and handoff shape. |
| `opl.single-source-thin-entry` | 单源派生，薄入口 | CLI, Skill, App, MCP, docs, and reports derive from canonical source and contract refs instead of hand-written parallel entry logic. |
| `opl.converge-retire-history` | 结构收敛，历史退役 | Replaced wrappers, aliases, facades, and stale plans move to provenance or tombstone instead of remaining active routes. |
| `opl.risk-matched-evidence` | 证据匹配风险 | Evidence strength follows risk; structural conformance cannot claim domain ready, artifact ready, production ready, or owner acceptance. |

For RCA, these ids are adopted through the visual specialization in `agent/principles/redcube-ai-principles.md` and the mapping contract in `contracts/standard-agent-principles-adoption.json`.
