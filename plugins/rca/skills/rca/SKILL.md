---
name: rca
description: Operate RedCube AI as the formal RCA visual-deliverable domain app through product-entry, recoverable deliverable runtime, and same-session continuation contracts.
---

# RCA App Skill

当 Codex 需要把 `RedCube AI` 作为正式 domain app 来操作，而不是把仓库当成临时脚本集合时，使用这个 plugin。

## 这个 plugin 是什么

- `RedCube AI` 面向 Codex 的单一 app skill 薄入口层
- 建立在现有 CLI、gateway、runtime contract 与 deliverable loop 之上
- 不替代 `redcube` CLI、gateway contract，也不替代 repo 内其他自动化入口

## 核心入口

- `redcube product manifest --workspace-root <dir>`
- `redcube product frontdesk --workspace-root <dir>`
- `redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`
- `redcube product session --entry-session-id <entry-session-id>`

默认先开 frontdesk，再根据已知标识走 direct invoke 或 session continuation；`invokeFederatedProductEntry` 继续只作为内部 contract，不作为第二个公开 skill。

## PPT 长任务入口规则

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
