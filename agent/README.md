# RedCube AI Agent Pack

Owner: `RedCube AI`
Purpose: `canonical_repo_source_semantic_pack_for_opl_standard_domain_agent_compiler`
State: `active_declarative_visual_pack`
Machine boundary: `agent/` 持有 stage semantics、prompt policy refs、stage skill policy refs、quality gates 与 knowledge policy。Executable handlers、minimal authority functions 与 native helpers 继续归 `packages/`、`apps/`、runtime contracts 和 Python helper modules。

本目录是 RCA 的 canonical Declarative Visual Pack。OPL generated surfaces 消费这些 refs 来生成 CLI、MCP、Skill、product-entry、status、session、domain_action_adapter 和 workbench descriptors；它们不写 RedCube visual truth、artifact body、review/export verdict、visual memory body 或 owner receipt。

`contracts/foundry_agent_series.json` 是 RCA 对 OPL Foundry policy 的 refs-only consumer：它只 pin OPL canonical series/skeleton contract 与 shared policy release，使用 canonical `rca` agent identity，并把 generated stage control plane 的 target domain 保持为 `redcube_ai`。通用 lifecycle、workspace topology、closeout 和 public-series policy body 全部由 OPL 持有；RCA 只在 `visual_domain_delta_refs`、`contracts/domain_descriptor.json` 与本 pack 中保留 visual-material input、visual-deliverable stage semantics，以及 PPT/PDF/PNG/export handoff 的 domain refs。

product-entry 以 `{ref_kind: "generated_surface", ref: "opl-generated:family_stage_control_plane", source_ref: "agent/stages/manifest.json"}` 指向 OPL 生成的 stage plane，并投影 `ai_route_policy`。该 policy 不执行或校验 semantic route；Codex CLI 是唯一 route owner。`domain-handler export` 只公开 action-handler、domain-authority、evidence、typed-blocker、receipt 与 artifact-locator refs，不复制通用 runtime、workbench、operator 或 readiness projection。

## Stage Prompt / Skill / Tool 分工

- `agent/prompts/*.md` 是 stage operating surface：它说明每个 stage 应该做什么、读取哪些 source / prior stage refs、返回哪些 receipts / refs / typed blockers / repair targets。Stage prompt 不沉淀跨 stage 的专业方法，也不物化文件。
- Professional specialist skill 是 repo-local reusable professional method：PPT story architecture、Xiaohongshu content/series strategy、visual direction、page authoring、review、visual memory curation、native PPT design、template profiling 等方法可以被多个 stage 调用。它不创建新外部 repo、新外部产品或第二套 public skill。
- Tool/helper 是 materialization / validation / export surface：Codex-native imagegen、screenshot/render、Office / PPT helper、manifest / locator / export helper 只负责生成、渲染、校验、导出和返回 evidence refs。工具不是 skill，也不授权 visual truth、review/export verdict 或 owner receipt。
- `agent/skills/*.md` 是旧 stage skill policy refs：它们只约束 stage 如何使用 authoring、native helper 和 visual memory policy；它们不是 standalone Codex professional skills。`agent/skills/visual_memory_policy.md` 只声明 stage behavior policy，visual memory proposal / accept-reject review / writeback lifecycle 的专业方法入口是 `agent/professional_skills/rca-visual-memory-curator/SKILL.md`。

`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 下的旧 detailed assets 仍是 implementation/detail prompt assets。Stage-level `prompt_refs` 必须指向 `agent/prompts/*.md`，再由 stage prompt 按 deliverable family 和 route 定位详细 prompt asset。

`agent/quality_gates/visual_pack_discipline.md` 是 pack-level visual constraints 的 canonical execution gate：design constraint language、brand precedence、source/material pass transparency、density/sparse-page evidence、template/route contract、render acceptance、review/export evidence，以及机械检查只能产生 blocker 或 evidence refs 的规则。`agent/knowledge/markdown_route_policy.md` 和 `agent/quality_gates/package_distribution.md` 保持 Markdown/Marp 与 package distribution 的显式 refs-only policy；它们不能改变默认 visual route，也不能签 RCA visual/export verdict。

`agent/stages/manifest.json` 是 RCA stage graph 的 canonical repo source，列出六个 stage 的 policy、prompt、action、transition 与 authority refs；OPL compiler 将其投影为 `opl-generated:family_stage_control_plane`。RCA 不再维护 root stage-control mirror；这些 refs 只指导 Codex executor 在 stage 内工作，RCA-owned review/export gates、owner receipts、typed blockers 和 artifact authority 仍决定是否推进。
