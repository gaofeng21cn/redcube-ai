---
name: rca
description: Operate RedCube AI as the formal RCA visual-deliverable domain app through TypeScript orchestration, Python native helpers, product-entry, recoverable deliverable loops, and same-session continuation contracts.
---

# RCA App Skill

当 Codex 需要把 `RedCube AI` 作为正式 domain app 来操作，而不是把仓库当成临时脚本集合时，使用这个 plugin。

## 这个 plugin 是什么

- `RedCube AI` 面向 Codex 的单一 app skill 薄入口层
- 消费 OPL generated descriptors；CLI/MCP/Skill/product/status/session/domain_action_adapter/workbench metadata 的统一 owner 是 `one-person-lab`
- repo-local `redcube` CLI / `redcube-mcp` / product-entry API 只是 RCA domain handler target 或 direct domain entry，不是 generated surface owner、generic runner、generic session shell 或通用 workbench owner

## Agent 语言面

- 默认把本仓实现理解为 `TypeScript orchestration + Python native helpers`。
- 新增 product-entry / domain-handler contract、CLI/MCP、runtime-protocol 或 service-safe boundary 默认使用 TypeScript。
- Office/PPT/document automation、截图/导出 helper 与修复循环默认使用 repo-owned Python helper，并继续受 RedCube route/gate 约束。
- 仓内已跟踪 JavaScript 已退役；新的 product、test 或 script JavaScript 会被 closeout audit 阻断，不得把新 agent 工作写成 JavaScript。

## 核心入口

自动调用时使用 repo-local launcher：`npm run --prefix <redcube-ai-repo> redcube -- ...`。这个 launcher 只用于命中 RCA domain handler / direct domain entry；不要把它写成 CLI/MCP/Skill/product/status/session/workbench metadata owner，也不要用 shell PATH lookup 或用户 PATH 上的裸 `redcube` 判断当前模块可用性。

- `npm run --prefix <redcube-ai-repo> redcube -- product manifest --workspace-root <dir>`
- `npm run --prefix <redcube-ai-repo> redcube -- product status --workspace-root <dir>`
- `npm run --prefix <redcube-ai-repo> redcube -- product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`
- `npm run --prefix <redcube-ai-repo> redcube -- product session --entry-session-id <entry-session-id>`

`product manifest` 暴露 RCA-owned `family_action_catalog` 和 OPL 可消费的 generated-interface handoff；CLI help、MCP descriptors/routes、skill command contracts、product-entry action metadata、status/session/workbench metadata 的 generated descriptor owner 是 `OPL`，RCA 只提供 action/stage metadata、domain handler targets、direct diagnostic entry 和 visual authority functions。

`redcube product status` 是当前 product overview 命令；语义是读取 agent-facing product-entry overview / intake / entry-shell contract，不表示 GUI、WebUI 或最终用户前台壳。

默认先读取 status/manifest，再根据已知标识走 direct invoke 或 session continuation；OPL-hosted handoff 通过 `invokeOplHostedProductEntry` / product domain_action_adapter 进入同一 downstream RedCube product-entry contract，不作为第二个公开 skill。

默认交付运行方式：

- 对于不需要人工中途审阅的新交付，使用一次 `redcube product invoke`，不指定 `route`、不指定 `stop_after_stage`，让 RCA service-safe product-entry loop 按 `auto_to_terminal` 自主推进到 review/export gate。
- 只有在用户明确要求先审阅计划、批准后继续、定点回修、重跑某个 stage，或 product-entry gate 已给出明确 `rerun_from_stage` 时，才使用 route-level invoke，例如 `--route repair_image_pages`。
- `redcube product session` 是 entry-session domain snapshot refs adapter；generic session shell、resume/workbench navigation 与默认 product/session wrapper 归 OPL generated surface，不应被当成外层 Codex 逐 stage 手工创作的替代品。

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
- `screenshot_review` 必须消费 PNG 与 prompt/style/image manifest，并执行 16:9、非空、重复、低信息密度、裁切、碎片化、字段泄漏与可选 OCR domain_action_adapter 检查；缺关键 artifact 或 hard-block 视觉 QA 时 fail-closed。
- 截图质控未通过时，必须从明确 stage rerun 或 `repair_image_pages` 回修；`repair_image_pages` 只重绘 blocked slide ids，未阻断页复用并记录 preserved hashes，不能跳过 review gate 直接交付。
- 用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。
- `redcube image-ppt proof` 是 repo-owned lightweight proof helper，默认 mock、不调用真实图片 API、不注册第二公开 skill；live image generation 必须显式开启，常规回归不得使用完整“肠癌AI”长 PPT。

## PPT 长任务入口规则

- 如果用户原始需求包含“不要一次性生成”“先给我看看”“审阅之后再继续”“先做故事主线/大纲/蓝图”等人工审阅语义，必须在 product-entry delivery request 中显式设置 `stop_after_stage`，默认停在可审阅的 plan stage；不得省略 stop policy 直接 auto-to-terminal。
- 用户审阅通过的故事主线、详细大纲或逐页蓝图进入后续阶段时，必须作为批准合同继续沿用；后续 stage 只能扩写和视觉化，不能重新压缩为短 deck。

当用户要求 RCA / RedCube AI 制作较长 PPT、资料较多的 deck、或任何容易超过单轮 prompt 的 visual deliverable 时，不要把完整任务压成一个巨大 prompt 直接生成。默认采用同一 `entry_session_id` 下的可恢复阶段流：

1. `source/material intake`：用 status / manifest 读取 workspace、资料包、缺口与交付目标；这里的 status 是 product-entry overview / intake shell，不是 GUI 前台，随后冻结 source package 和 missing materials。
2. `plan`：在 product-entry session 内生成 storyline、outline、slide blueprint 或执行计划，并把阶段产物写入同一 deliverable loop。
3. `deliverable`：按 plan 继续生成 PPT artifacts；长运行中用 session surface 读取 progress / artifact inventory，而不是重新开一轮 prompt-only 任务。
4. `review`：通过 review state、publication projection 与 operator review gate 判断是否需要从明确 stage rerun。

每一阶段都要保留 `entry_session_id`、`topic_id`、`deliverable_id`，并优先用 `redcube product session --entry-session-id <entry-session-id>` 恢复、检查进度和拾取 artifact。
这套可恢复阶段流是 RCA product-entry loop 的断点与治理模型；如果没有显式人工审阅或 product-entry 阻塞，外层操作者应让 `product invoke` 一次性跑到终态，而不是逐个调用 `storyline`、`detailed_outline`、`author_image_pages` 等内部 stage。

## 操作约束

- 任何写操作前，先读取当前 workspace 与 product-entry manifest
- 把 `product_entry_manifest`、`domain_entry_contract`、`task_lifecycle` 当作正式 contract surface
- 把 `opl_generated_interface_consumption`、`generated_surface_handoff` 与 `pack_compiler_input` 当作 OPL generated metadata owner 的当前机器合同；repo-local redcube/redcube-mcp 只按 handler target / direct entry 读取
- 保持 `status -> direct invoke -> session continuation` 同一条 same-session deliverable loop；这里的 `status` 指 machine-readable product-entry overview / intake shell
- 长 PPT 任务必须先拆成 `source/material intake -> plan -> deliverable -> review`，每段使用同一 session 可恢复推进
- 不绕开 domain handler / product-entry contract 直接手改运行状态或 artifact state
- 不把 OPL-hosted handoff 写成新的独立用户 skill；它继续是内部集成 contract

## 首先应读的文件

- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`

## 典型任务

- 读取当前 workspace 的 RedCube product-entry status overview / intake shell
- 检查 product-entry manifest 和 task lifecycle
- 继续同一 entry session 下的 deliverable loop
- 通过结构化命令驱动 visual deliverable 生成与审阅
