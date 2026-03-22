# README And GitHub Homepage Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 RedCube AI 公开仓库首页整理成更像正式开源项目的形态，并同步补齐 GitHub 仓库 description 与 topics。

**Architecture:** 保持现有代码与文档结构不变，只重写 README 首屏的信息组织方式，并通过 GitHub CLI 更新仓库元信息。验证重点放在文本内容、敏感信息边界和远端状态上。

**Tech Stack:** Markdown, Git, GitHub CLI, Node.js test runner

---

### Task 1: 写入首页收口文案

**Files:**
- Create: `docs/plans/2026-03-22-readme-github-homepage-plan.md`
- Modify: `README.md`

**Step 1: 明确首屏结构**

将 README 顶部重组为以下顺序：

- 项目一句话定位
- 核心能力
- 架构与运行方式
- 快速开始
- 文档导航

**Step 2: 重写 README 首屏**

要求：

- 保留“Node 主线、CLI、Web、Workbench、自动 research、局部重跑、私有层配置”这些关键信息
- 删除偏内部迁移口吻，改成公开仓库口吻
- 保持中文说明，命令示例继续可直接复制执行

**Step 3: 检查首屏是否泄露私有信息**

检查是否重新引入旧目录、旧项目名、旧人设、真实业务路径。

### Task 2: 更新 GitHub 仓库元信息

**Files:**
- Modify: GitHub repository metadata for `gaofeng21cn/redcube-ai`

**Step 1: 设置 description**

用一句英文描述仓库定位，覆盖：

- configurable
- Node/ESM
- AI content workflow
- CLI / Web UI / Workbench

**Step 2: 设置 topics**

添加一组面向公开仓库的英文 topics，避免过泛也避免误导。

建议 topics：

- `ai`
- `llm`
- `nodejs`
- `esm`
- `cli`
- `web-ui`
- `workflow`
- `prompt-engineering`
- `content-automation`

### Task 3: 验证并推送

**Files:**
- Modify: `.git` state only

**Step 1: 运行测试**

Run: `node --test tests/*.test.js`

Expected: `62` 个测试全部通过，`fail 0`

**Step 2: 检查差异与远端状态**

Run:

```bash
git diff -- README.md
git status --short --ignored
gh repo view gaofeng21cn/redcube-ai --json description,repositoryTopics,url
```

Expected:

- README 首屏变化符合预期
- 只有本次文档改动处于待提交状态
- GitHub 仓库 description/topics 已更新

**Step 3: 提交并推送**

```bash
git add README.md docs/plans/2026-03-22-readme-github-homepage-plan.md
git commit -m "docs: refresh readme homepage and repo metadata"
git push
```
