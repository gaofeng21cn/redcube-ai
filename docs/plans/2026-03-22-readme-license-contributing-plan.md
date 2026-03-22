# README Flowchart And OSS Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为公开仓库补一张首页流程图，并新增 `LICENSE` 与 `CONTRIBUTING.md`，让 GitHub 首页和仓库根目录更完整。

**Architecture:** 不改业务代码，只调整 README 结构并新增两个根目录文档文件。流程图用 Mermaid，许可证用 MIT，贡献指南聚焦测试、私有层边界和提交流程。

**Tech Stack:** Markdown, Mermaid, Git, GitHub, Node.js test runner

---

### Task 1: 更新 README 首页

**Files:**
- Modify: `README.md`

**Step 1: 在文档导航中补充开源文档入口**

新增：

- `CONTRIBUTING.md`
- `LICENSE`
- 本轮设计/计划文档链接

**Step 2: 补一张 Mermaid 流程图**

放在首页前半段，覆盖：

`Raw Materials -> Auto Research -> Storyline -> Workflow -> Truth Sync -> Publish`

**Step 3: 删除明显重复信息**

优先避免首页出现两段相同“快速开始”入口说明。

### Task 2: 新增仓库根目录开源文件

**Files:**
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`

**Step 1: 写入 MIT LICENSE**

版权主体使用 `RedCube Contributors`。

**Step 2: 写入 CONTRIBUTING.md**

包含：

- 开发前阅读位置
- 本地安装与测试命令
- 提交流程
- 私有配置与业务工作区不得入仓库

### Task 3: 验证并推送

**Files:**
- Modify: `.git` state only

**Step 1: 运行测试**

Run: `node --test tests/*.test.js`

Expected: `62` 个测试全部通过，`fail 0`

**Step 2: 检查敏感信息与 git 状态**

Run:

```bash
rg -n "<private-markers>" --hidden --glob '!.git' --glob '!.env' --glob '!.cursor/**' .
git status --short --ignored
```

Expected:

- 无敏感串命中
- 只有本次文档变更处于待提交状态

**Step 3: 提交并推送**

```bash
git add README.md LICENSE CONTRIBUTING.md docs/plans/2026-03-22-readme-license-contributing-design.md docs/plans/2026-03-22-readme-license-contributing-plan.md
git commit -m "docs: add flowchart license and contributing guide"
git push
```
