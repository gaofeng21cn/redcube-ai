# SECURITY Policy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为公开 GitHub 仓库补一份可执行的安全策略文档，并把 README 文档导航接到这份策略。

**Architecture:** 仅新增根目录 `SECURITY.md` 并更新 README 文档导航，不改任何运行逻辑。安全策略聚焦支持范围、漏洞报告方式和私有信息边界。

**Tech Stack:** Markdown, Git, GitHub, Node.js test runner

---

### Task 1: 新增安全策略文档

**Files:**
- Create: `SECURITY.md`

**Step 1: 写明支持范围**

- 仅 `main` 分支
- 其他历史分支或旧提交不承诺维护

**Step 2: 写明报告方式**

- 优先 GitHub private vulnerability reporting / security advisory
- 若仓库当前未开私密报告，先以最小信息创建 public issue，不公开敏感细节

**Step 3: 写明私有信息边界**

禁止在公开报告中直接贴出：

- API key
- `.env`
- `config/local/`
- `~/.config/redcube/`
- 业务 workspace
- 私有 prompts

### Task 2: 更新 README 入口

**Files:**
- Modify: `README.md`

**Step 1: 在文档导航新增安全策略链接**

新增：

- `SECURITY.md`

### Task 3: 验证并推送

**Files:**
- Modify: `.git` state only

**Step 1: 运行测试**

Run: `node --test tests/*.test.js`

Expected: `62` 个测试全部通过，`fail 0`

**Step 2: 检查敏感串与 git 状态**

Run:

```bash
rg -n "<private-markers>" --hidden --glob '!.git' --glob '!.env' --glob '!.cursor/**' .
git status --short --ignored
```

Expected:

- 无新增敏感内容
- 只有本次文档变更待提交

**Step 3: 提交并推送**

```bash
git add SECURITY.md README.md docs/plans/2026-03-22-security-policy-design.md docs/plans/2026-03-22-security-policy-plan.md
git commit -m "docs: add security policy"
git push
```
