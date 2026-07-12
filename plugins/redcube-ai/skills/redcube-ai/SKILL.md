---
name: redcube-ai
description: Operate RedCube AI as the formal RCA visual-deliverable domain app through TypeScript orchestration, Python native helpers, product-entry, recoverable deliverable loops, and same-session continuation contracts.
---

# RedCube AI App Skill

当 Codex 需要把 `RedCube AI` 作为正式 domain app 来操作，而不是把仓库当成临时脚本集合时，使用这个 plugin。canonical 机器名是 `redcube-ai`。

## 这个 plugin 是什么

- `RedCube AI` 面向 Codex 的单一 app skill 薄入口层
- 消费 OPL generated descriptors；MCP/Skill/product/status/session/domain_action_adapter/workbench metadata 的统一 owner 是 `one-person-lab`
- repo-local `redcube` CLI / product-entry API 只是 RCA domain handler target 或 direct domain entry；MCP 是 OPL generated protocol descriptor，不再由 RCA 维护 repo-local production API app

## Agent 语言面

- 默认把本仓实现理解为 `TypeScript orchestration + Python native helpers`。
- 新增 product-entry / domain-handler contract、CLI handler target、runtime-protocol 或 service-safe boundary 默认使用 TypeScript；MCP wrapper/descriptor 归 OPL 生成面。
- Office/PPT/document automation、截图/导出 helper 与修复循环默认使用 repo-owned Python helper，并继续受 RedCube route/gate 约束。
- 仓内已跟踪 JavaScript 已退役；新的 product、test 或 script JavaScript 会被 closeout audit 阻断，不得把新 agent 工作写成 JavaScript。

## 核心入口

自动调用时使用 repo-local launcher：`npm run --prefix <redcube-ai-repo> redcube -- ...`。当前 RCA 只保留 direct domain handler / product-entry target；series identity、status、session、workbench 与 inspect wrappers 归 OPL generated surface。不要使用已退役的 repo-local `status`、`deck inspect` 或用户 PATH 上的裸 `redcube` 判断当前模块可用性。

- `npm run --prefix <redcube-ai-repo> redcube -- domain-handler export --workspace-root <dir> --format json`
- `npm run --prefix <redcube-ai-repo> redcube -- product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`
- `npm run --prefix <redcube-ai-repo> redcube -- domain-handler dispatch --task <task.json> --format json`

`domain-handler export` 暴露 RCA-owned `family_action_catalog` 和 OPL 可消费的 generated-interface handoff；CLI help、Foundry series grammar、MCP descriptors/routes、skill command contracts、product-entry action metadata、status/session/workbench metadata 的 generated descriptor owner 是 `OPL`，RCA 只提供 action/stage metadata、domain handler targets、series-readable direct diagnostic entry 和 visual authority functions。

`opl_generated:product_status` / `opl_generated:product_session` 是 OPL generated wrapper refs，不是 RCA repo-local 默认命令。需要在 RCA worktree 里直接命中当前 active handler target 时，使用 `redcube product invoke` 或 `redcube domain-handler export|dispatch`。

默认先读取 OPL generated descriptor refs 或 `domain-handler export`，再根据已知标识走 direct invoke。OPL-hosted handoff 通过 `invokeOplHostedProductEntry` / domain handler target 进入同一 downstream RedCube product-entry contract，不作为第二个公开 skill。

默认交付运行方式：

- 对于不需要人工中途审阅的新交付，使用一次 `redcube product invoke`，不指定 `route`、不指定 `stop_after_stage`，由 OPL-hosted Codex execution plan 按 `auto_to_terminal` 目标逐次选择 route。RCA route handler 每次只执行 Codex 明确选择的一个 stage，不自行补跑 predecessor、安排 repair 或遍历到 review/export。
- 只有在用户明确要求先审阅计划、批准后继续、定点回修、重跑某个 stage，或 product-entry gate 已给出明确 `rerun_from_stage` 时，才使用 route-level invoke，例如 `--route repair_image_pages`。
- entry-session domain snapshot refs 由 OPL generated session shell 消费；generic session shell、resume/workbench navigation 与默认 product/session wrapper 归 OPL generated surface，不应被当成外层 Codex 逐 stage 手工创作的替代品。

## Domain 执行护栏

- 用户点名 `RCA` / `RedCube AI` 或任务属于 slide deck、视觉交付、讲稿、海报、小红书等 RedCube 覆盖范围时，必须通过 RedCube product-entry / deliverable loop 推进。
- 不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube 的默认创作与审阅链路，除非用户明确要求“探索替代技术路线”或“绕开 RedCube product-entry loop”。
- 直接产出 HTML、截图、PPTX、PDF 或其他文件前，必须先确认当前 overlay 的 stage sequence，并把产物落在同一 `topic_id` / `deliverable_id` / `entry_session_id` 的 deliverable loop 中。
- 使用 repo-local `npm run --prefix <redcube-ai-repo> redcube -- ...` 继续走同一 RCA domain handler / direct domain entry；不得因为全局 `redcube` 缺失或过期而改走通用工具路径，也不得把 repo-local launcher 升级成 generic wrapper/session/workbench owner。

## PPT deck 默认路线

当 overlay / deliverable kind 是 `ppt_deck` 时，默认且受保护的路线是：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`

- `author_image_pages` 是默认视觉实现路线，通过 Responses `image_generation` 生成完整 16:9 PPT 页面 PNG；HTML routes 与 native editable PPTX routes 只能作为显式选择路线，不能替代默认 `author_image_pages -> screenshot_review -> export_pptx`。
- `author_image_pages` 可复用同 key 的 image artifact cache；真实 image generation 只在 cache miss、显式重绘或 blocked-slide repair target 时发生，artifact 不记录 token。
- `screenshot_review` 必须消费可用 PNG 与 prompt/style/image manifest，并执行 16:9、非空、重复、低信息密度、裁切、碎片化、字段泄漏与可选 OCR 检查。普通视觉 QA、manifest/provenance 缺口只记录质量债务和 repair recommendation；没有任何可消费页面、文件损坏不可读或 authority/permission 边界才硬停止。
- 截图质控未通过时，在预算内从明确 stage rerun 或 `repair_image_pages` 回修；`repair_image_pages` 只重绘需要修复的 slide ids，未阻断页复用并记录 preserved hashes。预算耗尽后携带最佳 artifact 进入后续 stage，不得声明 `visual_ready` 或 `export_ready`。
- 用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。
- authoring lane 在同一 deliverable 内锁定；外层失败处理不得自动从 image/native/HTML 切换到另一 lane。只有新的显式 product-entry route 选择可以更新该 lock。
- `redcube image-ppt proof` 是 repo-owned lightweight proof helper，默认 mock、不调用真实图片 API、不注册第二公开 skill；live image generation 必须显式开启，常规回归不得使用完整“肠癌AI”长 PPT。

## PPT 长任务入口规则

- 如果用户原始需求包含“不要一次性生成”“先给我看看”“审阅之后再继续”“先做故事主线/大纲/蓝图”等人工审阅语义，必须在 product-entry delivery request 中显式设置 `stop_after_stage`，默认停在可审阅的 plan stage；该字段只约束 OPL/Codex execution plan 的目标边界，不授权 RCA route handler 自动续跑。
- 用户审阅通过的故事主线、详细大纲或逐页蓝图进入后续阶段时，必须作为批准合同继续沿用；后续 stage 只能扩写和视觉化，不能重新压缩为短 deck。

当用户要求 RCA / RedCube AI 制作较长 PPT、资料较多的 deck、或任何容易超过单轮 prompt 的 visual deliverable 时，不要把完整任务压成一个巨大 prompt 直接生成。默认采用同一 `entry_session_id` 下的可恢复阶段流：

1. `source/material intake`：用 OPL generated descriptor refs 或 `domain-handler export` 读取 workspace、资料包、缺口与交付目标；这里的 status/session shell 归 OPL，不是 RCA repo-local 默认命令或 GUI 前台，随后冻结 source package 和 missing materials。
2. `plan`：在 product-entry session 内生成 storyline、outline、slide blueprint 或执行计划，并把阶段产物写入同一 deliverable loop。
3. `deliverable`：按 plan 继续生成 PPT artifacts；长运行中用 OPL generated session surface 读取 progress / artifact inventory，而不是重新开一轮 prompt-only 任务。
4. `review`：通过 review state、publication projection 与 operator review gate 判断是否需要从明确 stage rerun。

每一阶段都要保留 `entry_session_id`、`topic_id`、`deliverable_id`，并优先通过 OPL generated session surface 恢复、检查进度和拾取 artifact。
这套可恢复阶段流是 RCA product-entry loop 的断点与治理模型；如果没有显式人工审阅或 product-entry 阻塞，外层操作者应让 `product invoke` 一次性跑到终态，而不是逐个调用 `storyline`、`detailed_outline`、`author_image_pages` 等内部 stage。

## 操作约束

- 任何写操作前，先读取当前 workspace 与 product-entry manifest
- 把 `product_entry_manifest`、`domain_entry_contract`、`task_lifecycle` 当作正式 contract surface
- 把 `opl_generated_interface_consumption`、`generated_surface_handoff` 与 `pack_compiler_input` 当作 OPL generated metadata owner 的当前机器合同；repo-local redcube 只按 handler target / direct entry 读取，MCP 只读作 OPL generated protocol descriptor
- 保持 `OPL generated status/session refs -> direct invoke -> session continuation` 同一条 same-session deliverable loop；这里的 status/session 指 OPL generated machine-readable product-entry refs
- 长 PPT 任务必须先拆成 `source/material intake -> plan -> deliverable -> review`，每段使用同一 session 可恢复推进
- 不绕开 domain handler / product-entry contract 直接手改运行状态或 artifact state
- 不把 OPL-hosted handoff 写成新的独立用户 skill；它继续是内部集成 contract

## Progress-first stage policy

- stage retry count 是质量预算，不是 transition gate；默认 4 轮 native shape-plan 也遵守这一规则。
- 只要当前 stage 产生可读取、可被下一 stage 消费的 artifact，就以 `completed` 或 `completed_with_quality_debt` 推进。
- 质量债务可以触发 repair recommendation，但不能生成 execution blocker，也不能让同一 stage 无限循环。
- 质量债务必须阻止 `visual_ready`、`export_ready`、production-ready 等声明。
- 只有零可消费 artifact、artifact 损坏不可读、权限/凭据、显式人工门、authority violation 或 stage identity/currentness mismatch 可以硬停止。
- Codex CLI 是唯一 stage 语义控制面；output schema、normalizer、validator、review helper 与静态 transition table 只能产生 findings，不能拒绝已有 raw/partial artifact。
- Codex 可携带 review findings、失败尝试或负结果 route-back 到任一已声明 stage，重复进入 storyline/blueprint/visual/author/review stage 属于正常进度。

## 首先应读的文件

- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`

## 典型任务

- 读取当前 workspace 的 RedCube domain-handler export / OPL generated product-entry refs
- 检查 domain handler projection、product-entry manifest refs 和 task lifecycle
- 继续同一 entry session 下的 deliverable loop
- 通过结构化命令驱动 visual deliverable 生成与审阅
