# Workbench Onboarding Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 Workbench 的空工作区与首轮启动体验改成明确的三步引导，并补上新主题首轮生成前的项目启动板。

**Architecture:** 仅修改 `apps/redcube-web/public/index.html`、`apps/redcube-web/public/app.js` 与 `tests/workbench-shell.test.js`。通过新增前端渲染 helper 和复用现有 modal / workflow 动作实现，不改后端 API。

**Tech Stack:** Vanilla JS, HTML, CSS, Node.js test runner, agent-browser

---

### Task 1: 写失败测试

**Files:**
- Modify: `tests/workbench-shell.test.js`

**Step 1: 增加空状态 onboarding 断言**

断言内容包含：

- `三步启动`
- `连接工作区`
- `创建任务骨架`
- `自动首轮生成`
- `data-action="open-create-task"`
- `data-action="toggle-workspace-editor"`

**Step 2: 运行单测确认失败**

Run: `node --test tests/workbench-shell.test.js`

Expected: FAIL，提示新文案或新动作缺失

### Task 2: 实现前端渲染与样式

**Files:**
- Modify: `apps/redcube-web/public/index.html`
- Modify: `apps/redcube-web/public/app.js`

**Step 1: 新增 onboarding 区块样式**

包含：

- 主容器
- 三步卡片
- 强主动作按钮区
- 移动端降栏布局

**Step 2: 新增空工作区渲染 helper**

在 Workbench / Projects 空状态时输出统一 onboarding。

**Step 3: 新增首轮启动板**

在项目总览中，当主题还没有产物时显示更强的启动建议区块。

**Step 4: 新增动作处理**

支持：

- `open-create-task`
- `toggle-workspace-editor`

### Task 3: 验证绿灯

**Files:**
- Modify: `.git` state only

**Step 1: 跑工作台相关测试**

Run: `node --test tests/workbench-shell.test.js`

Expected: PASS

**Step 2: 跑全量测试**

Run: `npm test`

Expected: `62` 个测试全部通过，`fail 0`

**Step 3: 用浏览器检查真实页面**

Run:

```bash
node apps/redcube-web/src/server.js
agent-browser open http://127.0.0.1:3100
agent-browser wait --load networkidle
agent-browser get text body
```

Expected:

- 首页出现新的引导文案
- 空工作区不再只剩一条单句提示

**Step 4: 提交并推送**

```bash
git add apps/redcube-web/public/index.html apps/redcube-web/public/app.js tests/workbench-shell.test.js docs/plans/2026-03-22-workbench-onboarding-design.md docs/plans/2026-03-22-workbench-onboarding-plan.md
git commit -m "feat: improve workbench onboarding flow"
git push
```
