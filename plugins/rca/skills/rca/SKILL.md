---
name: rca
description: Use when Codex should operate RedCube AI through its product-entry gateway, deliverable runtime, and same-session continuation contracts instead of ad-hoc repo scripting.
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

## 操作约束

- 任何写操作前，先读取当前 workspace 与 product-entry manifest
- 把 `product_entry_manifest`、`domain_entry_contract`、`task_lifecycle` 当作正式 contract surface
- 保持 `frontdesk -> direct invoke -> session continuation` 同一条 same-session deliverable loop
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
