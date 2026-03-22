# CHANGELOG And CI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为公开仓库补充 `CHANGELOG.md` 和 GitHub Actions 基础 CI，并把 README 接到这些入口。

**Architecture:** 只新增文档与工作流文件，不改业务代码。CI 保持单一 Node 22 版本，直接复用现有 `npm test` 入口，降低维护成本。

**Tech Stack:** Markdown, GitHub Actions, Node.js, npm

---

### Task 1: 新增 CHANGELOG

**Files:**
- Create: `CHANGELOG.md`

**Step 1: 写入 changelog 结构**

包含：

- 文档标题
- 简短说明
- `Unreleased`
- `0.1.0 - 2026-03-22`

**Step 2: 归纳公开仓库初始化内容**

记录：

- Node 主线收口
- 私有配置分层
- GitHub 仓库文档补齐
- 安全与贡献文档

### Task 2: 新增基础 CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: 配置触发条件**

- `push`
- `pull_request`

**Step 2: 配置执行步骤**

Run:

```yaml
npm install
npm test
```

### Task 3: 更新 README

**Files:**
- Modify: `README.md`

**Step 1: 增加 CI badge**

使用公开仓库的 workflow badge。

**Step 2: 在文档导航增加 CHANGELOG**

新增：

- `CHANGELOG.md`

### Task 4: 验证并推送

**Files:**
- Modify: `.git` state only

**Step 1: 运行测试**

Run: `npm test`

Expected: `62` 个测试全部通过，`fail 0`

**Step 2: 检查敏感串与 git 状态**

Run:

```bash
rg -n "<private-markers>" --hidden --glob '!.git' --glob '!.env' --glob '!.cursor/**' .
git status --short --ignored
```

Expected:

- 无新增敏感内容
- 只有本次文档和工作流变更待提交

**Step 3: 提交并推送**

```bash
git add CHANGELOG.md .github/workflows/ci.yml README.md docs/plans/2026-03-22-changelog-ci-design.md docs/plans/2026-03-22-changelog-ci-plan.md
git commit -m "docs: add changelog and ci"
git push
```
