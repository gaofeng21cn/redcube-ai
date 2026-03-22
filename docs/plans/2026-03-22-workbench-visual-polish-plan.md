# Workbench Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改后端逻辑的前提下，把 Workbench 首页和主外壳做得更现代、专业、有设计感。

**Architecture:** 仅修改 `apps/redcube-web/public/index.html` 与 `tests/workbench-shell.test.js`，通过 CSS 变量、展示字体、背景层、卡片化指标条和轻量动效完成视觉收口。

**Tech Stack:** HTML, CSS, Node.js test runner, agent-browser

---

### Task 1: 写失败测试

**Files:**
- Modify: `tests/workbench-shell.test.js`

**Step 1: 增加视觉系统断言**

断言包含：

- `--display-font`
- `.shell::before`
- `.app-header::before`
- `metric-pill` 的纵向卡片布局
- `prefers-reduced-motion`

**Step 2: 跑测试确认失败**

Run: `node --test tests/workbench-shell.test.js`

Expected: FAIL

### Task 2: 实现视觉收口

**Files:**
- Modify: `apps/redcube-web/public/index.html`

**Step 1: 新增字体与背景层变量**

**Step 2: 收口 header / tabs / buttons / metrics**

**Step 3: 补页面切换动效与 reduced-motion**

### Task 3: 验证并推送

**Files:**
- Modify: `.git` state only

**Step 1: 跑壳层测试**

Run: `node --test tests/workbench-shell.test.js`

Expected: PASS

**Step 2: 跑全量测试**

Run: `npm test`

Expected: 全绿

**Step 3: 浏览器查看首页**

Run local web server and inspect homepage with browser automation.

**Step 4: 提交并推送**
