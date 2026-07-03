# RedCube AI Agent Pack

Owner: `RedCube AI`
Purpose: `canonical_repo_source_semantic_pack_for_opl_standard_domain_agent_compiler`
State: `active_declarative_visual_pack`
Machine boundary: `agent/` 持有 stage semantics、prompt policy refs、stage skill policy refs、quality gates 与 knowledge policy。Executable handlers、minimal authority functions 与 native helpers 继续归 `packages/`、`apps/`、runtime contracts 和 Python helper modules。

本目录是 RCA 的 canonical Declarative Visual Pack。OPL generated surfaces 消费这些 refs 来生成 CLI、MCP、Skill、product-entry、status、session、domain_action_adapter 和 workbench descriptors；它们不写 RedCube visual truth、artifact body、review/export verdict、visual memory body 或 owner receipt。

`contracts/foundry_agent_series.json` 和 `contracts/domain_descriptor.json` 暴露 canonical `series_design_profile`：RCA 与 MAS、MAG、OMA 共用 OPL Agent lifecycle、generic slots、stage sections、closeout shape 和 authority invariants。本 pack 通过 `domain_specific_profile` 与 RCA-owned contracts 记录 visual-material input profile、visual-deliverable stage semantics，以及 PPT/PDF/PNG/export handoff output profile。

## Stage Prompt / Skill / Tool 分工

- `agent/prompts/*.md` 是 stage operating surface：它说明每个 stage 应该做什么、读取哪些 source / prior stage refs、返回哪些 receipts / refs / typed blockers / repair targets。Stage prompt 不沉淀跨 stage 的专业方法，也不物化文件。
- Professional specialist skill 是 repo-local reusable professional method：story architecture、visual direction、page authoring、review、native PPT design、template profiling 等方法可以被多个 stage 调用。它不创建新外部 repo、新外部产品或第二套 public skill。
- Tool/helper 是 materialization / validation / export surface：Codex-native imagegen、screenshot/render、Office / PPT helper、manifest / locator / export helper 只负责生成、渲染、校验、导出和返回 evidence refs。工具不是 skill，也不授权 visual truth、review/export verdict 或 owner receipt。
- `agent/skills/*.md` 是旧 stage skill policy refs：它们只约束 stage 如何使用 authoring、native helper 和 visual memory policy；它们不是 standalone Codex professional skills。

`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 下的旧 detailed assets 仍是 implementation/detail prompt assets。Stage-level `prompt_refs` 必须指向 `agent/prompts/*.md`，再由 stage prompt 按 deliverable family 和 route 定位详细 prompt asset。

`agent/quality_gates/visual_pack_discipline.md` 是 pack-level visual constraints 的 canonical execution gate：design constraint language、brand precedence、source/material pass transparency、density/sparse-page evidence、template/route contract、render acceptance、review/export evidence，以及机械检查只能产生 blocker 或 evidence refs 的规则。`agent/knowledge/markdown_route_policy.md` 和 `agent/quality_gates/package_distribution.md` 保持 Markdown/Marp 与 package distribution 的显式 refs-only policy；它们不能改变默认 visual route，也不能签 RCA visual/export verdict。

`contracts/stage_control_plane.json` 是这个 pack 的 machine-readable Cognitive Kernel binding。每个 visual stage 声明 prompt、stage skill policy、tool affordance、knowledge、strategy、candidate-pool、independent-gate、quality-gate 和 handoff refs。这些 refs 只指导 Codex executor 在 stage 内工作；RCA-owned review/export gates、owner receipts、typed blockers 和 artifact authority 仍决定是否推进。
