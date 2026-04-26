---
name: rca
description: Operate RedCube AI as the formal RCA visual-deliverable domain app through TypeScript orchestration, Python native helpers, product-entry, recoverable deliverable runtime, and same-session continuation contracts.
---

# RCA App Skill

当 Codex 需要把 `RedCube AI` 作为正式 domain app 来操作，而不是把仓库当成临时脚本集合时，使用这个 plugin。

## 这个 plugin 是什么

- `RedCube AI` 面向 Codex 的单一 app skill 薄入口层
- 建立在现有 CLI、gateway、runtime contract 与 deliverable loop 之上
- 不替代 `redcube` CLI、gateway contract，也不替代 repo 内其他自动化入口；这些入口只能作为 RedCube runtime 的受控 surface，不能成为绕开 runtime 的替代执行路径

## Agent 语言面

- 默认把本仓实现理解为 `TypeScript orchestration + Python native helpers`。
- 新增 orchestration、contract、CLI/MCP、gateway 或 runtime service boundary 默认使用 TypeScript。
- Office/PPT/document automation、截图/导出 helper 与修复循环默认使用 repo-owned Python helper，并继续受 RedCube route/gate 约束。
- 仓内 JavaScript 只代表 migration policy 登记过的 legacy allowlisted residue；不得因为看见 `.js` 文件就把新 agent 工作默认写成 JavaScript。

## 核心入口

- `redcube product manifest --workspace-root <dir>`
- `redcube product frontdesk --workspace-root <dir>`
- `redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`
- `redcube product session --entry-session-id <entry-session-id>`

默认先开 frontdesk，再根据已知标识走 direct invoke 或 session continuation；`invokeFederatedProductEntry` 继续只作为内部 contract，不作为第二个公开 skill。

## Domain runtime 护栏

- 用户点名 `RCA` / `RedCube AI` 或任务属于 slide deck、视觉交付、讲稿、海报、小红书等 RedCube 覆盖范围时，必须通过 RedCube product-entry / deliverable runtime 推进。
- 不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube 的默认创作与审阅链路，除非用户明确要求“探索替代技术路线”或“绕开 RedCube runtime”。
- 直接产出 HTML、截图、PPTX、PDF 或其他文件前，必须先确认当前 overlay 的 stage sequence，并把产物落在同一 `topic_id` / `deliverable_id` / `entry_session_id` 的 deliverable loop 中。
- 如果本机没有全局 `redcube` 命令，应使用 repo-local `npm run redcube -- ...` 或等价安装入口继续走同一 product-entry contract；不得因此改走通用工具路径。

## PPT deck 默认路线

当 overlay / deliverable kind 是 `ppt_deck` 时，默认且受保护的路线是：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> export_pptx`

- `render_html` 是默认视觉实现路线；原生 PowerPoint 对象、artifact-tool editable deck 或 `python-pptx` 只能作为显式探索路线，不能替代默认 `render_html -> screenshot_review -> export_pptx`。
- 截图质控未通过时，必须从明确 stage rerun 或 `fix_html` 回修，不能跳过 review gate 直接交付。

## PPT 长任务入口规则

- 如果用户原始需求包含“不要一次性生成”“先给我看看”“审阅之后再继续”“先做故事主线/大纲/蓝图”等人工审阅语义，必须在 product-entry delivery request 中显式设置 `stop_after_stage`，默认停在可审阅的 plan stage；不得省略 stop policy 直接 auto-to-terminal。
- 用户审阅通过的故事主线、详细大纲或逐页蓝图进入后续阶段时，必须作为批准合同继续沿用；后续 stage 只能扩写和视觉化，不能重新压缩为短 deck。

当用户要求 RCA / RedCube AI 制作较长 PPT、资料较多的 deck、或任何容易超过单轮 prompt 的 visual deliverable 时，不要把完整任务压成一个巨大 prompt 直接生成。默认采用同一 `entry_session_id` 下的可恢复阶段流：

1. `source/material intake`：用 frontdesk / manifest 读取 workspace、资料包、缺口与交付目标，冻结 source package 和 missing materials。
2. `plan`：在 product-entry session 内生成 storyline、outline、slide blueprint 或执行计划，并把阶段产物写入同一 deliverable loop。
3. `deliverable`：按 plan 继续生成 PPT artifacts；长运行中用 session surface 读取 progress / artifact inventory，而不是重新开一轮 prompt-only 任务。
4. `review`：通过 review state、publication projection 与 operator review gate 判断是否需要从明确 stage rerun。

每一阶段都要保留 `entry_session_id`、`topic_id`、`deliverable_id`，并优先用 `redcube product session --entry-session-id <entry-session-id>` 恢复、检查进度和拾取 artifact。

## 操作约束

- 任何写操作前，先读取当前 workspace 与 product-entry manifest
- 把 `product_entry_manifest`、`domain_entry_contract`、`task_lifecycle` 当作正式 contract surface
- 保持 `frontdesk -> direct invoke -> session continuation` 同一条 same-session deliverable loop
- 长 PPT 任务必须先拆成 `source/material intake -> plan -> deliverable -> review`，每段使用同一 session 可恢复推进
- 不绕开 gateway contract 直接手改 runtime state
- 不把 internal OPL bridge 写成新的独立用户 skill；它继续是内部 contract

## 首先应读的文件

- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`

## 典型任务

- 打开当前 workspace 的 RedCube frontdesk
- 检查 product-entry manifest 和 task lifecycle
- 继续同一 entry session 下的 deliverable loop
- 通过结构化命令驱动 visual deliverable 生成与审阅
