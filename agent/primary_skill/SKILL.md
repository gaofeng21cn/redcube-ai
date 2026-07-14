---
name: redcube-ai
description: Operate RedCube AI as the formal RCA visual-deliverable domain app through OPL-generated interfaces, hosted StageRun, a declarative visual pack, Python native helpers, and RCA-owned authority decisions.
---

# RedCube AI App Skill

当 Codex 需要把 `RedCube AI` 作为正式 domain app 来操作，而不是把仓库当成临时脚本集合时，使用这个 plugin。canonical OPL agent/package id 是 `rca`；`redcube-ai` 只是 repo、Codex plugin 与 skill carrier 名，不是第二个 package identity 或 alias。

## 这个 plugin 是什么

- `RedCube AI` 面向 Codex 的唯一 rich domain skill
- RCA 提供 declarative visual pack、专业 prompts / gates、native helper 描述和最小 authority decisions
- CLI、MCP、Skill、product entry、status、session、workbench、StageRun 与 Attempt lifecycle 全由 OPL generated / hosted surface 提供

## Agent 语言面

- 默认把本仓实现理解为 `Declarative Visual Pack + Python native helpers + minimal authority functions`。
- 新增通用 runtime、CLI/MCP wrapper、session/workspace/source shell、executor adapter、review/repair transport 或 lifecycle store 一律进入 OPL，不在 RCA 新建私有实现。
- Office/PPT/document automation、截图与导出 helper 使用 repo-owned Python helper，并继续受 RCA stage、quality gate 与 artifact authority 约束；helper 不拥有 executor、StageRun、verdict 或 ready authority。
- 仓内 product/runtime JavaScript 已退役；验证脚本和测试不得重新实现 executor、StageRun、session、workspace、review/repair 或 lifecycle 控制面。

## 核心入口

自动调用时只使用已安装 RCA Package 的 OPL-generated interface。不得调用 repo-local `redcube`、`@redcube/domain-entry`、`@redcube/runtime` 或任何历史 product-entry / domain-handler wrapper。

- `invoke_product_entry`：从 declarative stage manifest 启动完整 RCA hosted StageRun
- `run_image_ppt_proof`：从 `artifact_creation` 启动 image-first proof StageRun
- `run_native_ppt_proof`：从 `artifact_creation` 启动 editable native PPT proof StageRun

OPL 从 `contracts/action_catalog.json` 与 `agent/stages/manifest.json` 生成 CLI、MCP、Skill、product-entry、OpenAI、AI SDK、status 和 workbench surfaces。RCA 不维护第二套命令、dispatch、session 或运行状态真相。

默认交付运行方式：

- 对于不需要人工中途审阅的新交付，调用一次 OPL-generated `invoke_product_entry`，由 hosted StageRun controller 按 declarative stage graph 启动、恢复和物化 transition。
- 用户要求先审阅计划、批准后继续、定点回修或重跑某个 stage 时，把意图和已有 artifact / review refs 交给同一 OPL StageRun；decisive Codex Attempt 给出语义 route recommendation，controller 负责实际 transition。
- StageRun、Attempt、session、resume、status 与 workbench refs 由 OPL 持久化；RCA 只返回 visual artifact、review/export、memory、typed blocker 与 owner receipt refs。

## Domain 执行护栏

- 用户点名 `RCA` / `RedCube AI` 或任务属于 slide deck、视觉交付、讲稿、海报、小红书等 RCA 覆盖范围时，必须通过 OPL-generated RCA action 与 hosted StageRun 推进。
- 不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或 checkout 内直接编辑来绕过 RCA stage、quality gate、artifact authority 与 review/export decision，除非用户明确要求探索替代技术路线。
- 直接产出 HTML、截图、PPTX、PDF 或其他文件前，必须确认当前 declarative stage、输入 artifact refs、invocation identity 与 authority scope；产物必须回到同一 StageRun 的 exact artifact lineage。
- RCA native helper 只能由当前 Codex Attempt 按 descriptor 调用；不得成为 repo-local executor、runtime、session、workspace 或 lifecycle owner。

## PPT deck 默认路线

当 overlay / deliverable kind 是 `ppt_deck` 时，默认且受保护的路线是：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`

- `author_image_pages` 是默认视觉实现路线，通过 Responses `image_generation` 生成完整 16:9 PPT 页面 PNG；HTML routes 与 native editable PPTX routes 只能作为显式选择路线，不能替代默认 `author_image_pages -> screenshot_review -> export_pptx`。
- `author_image_pages` 可复用同 key 的 image artifact cache；真实 image generation 只在 cache miss、显式重绘或 blocked-slide repair target 时发生，artifact 不记录 token。
- `screenshot_review` 优先消费可用 PNG 与 prompt/style/image manifest，并执行 16:9、非空、重复、低信息密度、裁切、碎片化、字段泄漏与可选 OCR 检查。普通视觉 QA、manifest/provenance 缺口只记录质量债务和 repair recommendation；没有可消费页面、文件损坏不可读或输入缺失时物化 no-output/failure diagnostic 并继续，只有 executor unavailable、authority/safety/permission、wrong-target identity/currentness、不可逆动作或显式 human decision 才硬停止。
- 截图质控未通过时，在预算内从明确 stage rerun 或 `repair_image_pages` 回修；`repair_image_pages` 只重绘需要修复的 slide ids，未阻断页复用并记录 preserved hashes。预算耗尽后携带最佳 artifact 进入后续 stage，不得声明 `visual_ready` 或 `export_ready`。
- 用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。
- authoring lane 在同一 deliverable 内锁定；外层失败处理不得自动从 image/native/HTML 切换到另一 lane。只有新的显式 OPL-hosted action invocation 可以更新该 lock。
- `tools/image-ppt-proof/**` 只保留 deterministic developer proof，不调用 Codex executor 或真实图片 API；真实 image generation 由 OPL-hosted `run_image_ppt_proof` StageRun action 执行。

## PPT 长任务入口规则

- 如果用户原始需求包含“不要一次性生成”“先给我看看”“审阅之后再继续”“先做故事主线/大纲/蓝图”等人工审阅语义，必须在 OPL-hosted action input 中保留该 human-review intent，由 controller 在可审阅 artifact 后物化 human gate；RCA 不自行暂停或续跑。
- 用户审阅通过的故事主线、详细大纲或逐页蓝图进入后续阶段时，必须作为批准合同继续沿用；后续 stage 只能扩写和视觉化，不能重新压缩为短 deck。

当用户要求 RCA / RedCube AI 制作较长 PPT、资料较多的 deck、或任何容易超过单轮 prompt 的 visual deliverable 时，不要把完整任务压成一个巨大 prompt 直接生成。默认采用同一 parent StageRun invocation 下的可恢复阶段流：

1. `source/material intake`：从 OPL StageRun input artifact refs 读取资料包、缺口与交付目标，随后冻结 source package 和 missing materials。
2. `plan`：在 communication / visual-direction stages 生成 storyline、outline、slide blueprint 或执行计划，并提交 exact artifact refs。
3. `deliverable`：按 plan 继续生成 PPT artifacts；长运行中用 OPL generated session surface 读取 progress / artifact inventory，而不是重新开一轮 prompt-only 任务。
4. `review`：通过 review state、publication projection 与 operator review gate 判断是否需要从明确 stage rerun。

每一阶段都要保留 OPL StageRun / Attempt lineage、input artifact hashes 与 RCA artifact refs，并通过 OPL generated status/workbench surface 恢复和拾取产物。没有显式 human gate 或 typed hard stop 时，外层操作者应让 hosted controller 按 decisive Attempt 的 route recommendation 推进，不手工模拟 stage lifecycle。

## 操作约束

- 任何写操作前，先读取 OPL-provided StageRun identity、exact input refs、RCA declarative stage contract 与 authority scope
- 把 `contracts/action_catalog.json`、`agent/stages/manifest.json`、`contracts/stage_quality_cycle_policy.json` 与 OPL compiled interface 当作正式机器面
- 保持 `OPL generated action -> hosted StageRun -> RCA artifact/decision refs -> controller materialization` 单一链路
- 长 PPT 任务必须按 declarative stages 推进并保留同一 invocation lineage
- 不直接手改 StageRun、Attempt、session、workspace、route transition 或 artifact index state
- 不把 repo-local helper、developer proof 或历史 handler 恢复成第二个公开 skill / CLI / runtime

## Progress-first stage policy

- stage retry count 是质量预算，不是 transition gate；默认 4 轮 native shape-plan 也遵守这一规则。
- 只要当前 stage 产生可读取、可被下一 stage 消费的 artifact，就以 `completed` 或 `completed_with_quality_debt` 推进。
- 质量债务可以触发 repair recommendation，但不能生成 execution blocker，也不能让同一 stage 无限循环。
- 质量债务必须阻止 `visual_ready`、`export_ready`、production-ready 等声明。
- 零产出、artifact 损坏不可读或缺少上游输入时，必须物化 `no_output_diagnostic` / failure diagnostic 并以质量债推进；只有 executor 不可用、权限/凭据或安全边界、显式人工门、不可逆动作授权、authority violation 或 stage identity/currentness mismatch 可以硬停止。
- decisive Codex Attempt 是唯一 stage 语义决策面；output schema、normalizer、validator、review helper 与静态 transition table 只能产生 findings，不能拒绝已有 raw/partial artifact。OPL StageRun controller 只校验并物化该 Attempt 的 route decision。
- Codex 可携带 review findings、失败尝试或负结果 route-back 到任一已声明 stage，重复进入 storyline/blueprint/visual/author/review stage 属于正常进度。

## 首先应读的文件

- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`

## 典型任务

- 读取 OPL-generated RCA action、StageRun 与 artifact refs
- 按 declarative stage contract 继续同一 invocation lineage
- 调用 RCA native helper 完成受约束的视觉 artifact materialization
- 返回 review/export、memory、typed blocker 与 owner receipt refs
