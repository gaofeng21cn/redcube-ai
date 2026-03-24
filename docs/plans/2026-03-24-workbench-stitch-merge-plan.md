# Workbench Stitch 合并 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Stitch 第二个方案的视觉系统与第三个方案的信息架构，落到 RedCube AI Workbench 首页三个主场景里，同时保持现有真实工作流入口不变。

**Architecture:** 仅改动前端静态壳层与首页渲染函数，不动后端 API 和工作流链路。通过 `tests/workbench-shell.test.js` 先锁定首页结构与文案，再分别调整 `apps/redcube-web/public/index.html` 的视觉 token / 布局样式，以及 `apps/redcube-web/public/app.js` 的 onboarding、首轮启动、项目总览渲染逻辑。

**Tech Stack:** HTML, CSS, Vanilla JS, Node.js test runner, agent-browser

---

### Task 1: 写 Stitch 融合后的失败测试

**Files:**
- Modify: `tests/workbench-shell.test.js`

- [ ] **Step 1: 为空工作区首页增加导演台断言**

新增断言，覆盖这些结构和文案：

- `.director-hero-shell`
- `.director-status-strip`
- `.director-action-grid`
- `.director-callout`
- `Editorial Director Console`
- `当前导演任务`
- `允许联网搜集资料`
- `连接工作区`
- `创建任务`
- `查看运行状态`
- 不再出现旧的 `三步启动`

- [ ] **Step 2: 为首轮启动页增加导演台断言**

新增断言，覆盖这些结构和文案：

- `.director-summary-grid`
- `首轮启动`
- `输入准备度`
- `开始首轮生成`
- `查看最近运行`
- `data-action="show-inputs"`
- `data-action="start-topic-workflow"`
- `data-action="select-tab" data-tab="runs"`

- [ ] **Step 3: 为项目总览首页增加导演台断言**

新增断言，覆盖这些结构和文案：

- `.director-summary-grid`
- `.director-summary-card`
- `导演建议`
- `当前方向`
- `局部重跑`
- `最近产物`
- `管理输入材料`
- `查看笔记产物`
- `查看历史运行`

- [ ] **Step 4: 跑壳层测试确认失败**

Run: `node --test tests/workbench-shell.test.js`

Expected: FAIL，原因是三个场景的新 class 名和新文案尚未全部出现在 `index.html` / `app.js`

### Task 2: 实现首页视觉系统与版式融合

**Files:**
- Modify: `apps/redcube-web/public/index.html`

- [ ] **Step 1: 收口全局视觉 token**

调整并补充这些 token：

- 暖白底与 sage accent
- `Newsreader` 风格 display 字体回退链
- 更克制的阴影、圆角、边线透明度
- 更轻的 header 和 page background

- [ ] **Step 2: 新增导演台首页组件样式**

新增并整理这些样式块：

- `.director-hero-shell`
- `.director-hero-grid`
- `.director-status-strip`
- `.director-status-card`
- `.director-action-grid`
- `.director-action-card`
- `.director-callout`
- `.director-summary-grid`
- `.director-summary-card`

- [ ] **Step 3: 调整响应式与动效约束**

确保：

- 桌面端三栏/双栏成立
- 移动端能回落为单栏
- `prefers-reduced-motion` 仍然保留

### Task 3: 改写首页三个场景的渲染结构

**Files:**
- Modify: `apps/redcube-web/public/app.js`
- Reference: `apps/redcube-web/public/app.js:918`
- Reference: `apps/redcube-web/public/app.js:964`
- Reference: `apps/redcube-web/public/app.js:1002`
- Reference: `apps/redcube-web/public/app.js:1073`

- [ ] **Step 1: 改写空工作区 onboarding**

把 `renderWorkbenchOnboarding()` 改为导演台结构：

- Hero 主区
- 状态摘要带
- 行动卡组
- 判断式 callout

保留原有动作入口：

- `data-action="open-create-task"`
- `data-action="choose-workspace-directory"`
- `data-action="refresh-overview"`

- [ ] **Step 2: 改写首轮启动页**

把 `renderFirstRunLaunchpad()` 改为项目启动板：

- 当前主题 hero
- 当前导演任务 / 输入准备度 / 首轮状态
- 三张行动卡

保留原有真实入口：

- `data-action="show-inputs"`
- `data-action="start-topic-workflow"`
- `data-action="select-tab" data-tab="runs"`

- [ ] **Step 3: 先改写项目 Hero**

把 `renderTopicHeroSection()` 改为：

- 项目 hero 左文案右状态
- 当前导演任务
- 当前建议动作

- [ ] **Step 4: 再改写项目总览正文与右侧建议栏**

把 `renderWorkbenchOverviewView()` 改为：

- 首屏状态摘要卡组
- 当前方向与下一步动作提示
- 更明确的 `局部重跑` 文案

保留原有项目操作：

- 返回项目目录
- 管理输入材料
- 查看笔记产物
- 查看运行历史
- 删除项目

- [ ] **Step 5: 只做最小实现，不扩展后端能力**

不新增 API，不改 workflow 状态机，不改数据结构；所有“联网搜集资料”文案只引用现有已落地能力和勾选项，不虚构新链路。

### Task 4: 验证、浏览器验收与收尾

**Files:**
- Verify: `tests/workbench-shell.test.js`
- Verify: `apps/redcube-web/public/index.html`
- Verify: `apps/redcube-web/public/app.js`

- [ ] **Step 1: 跑壳层测试确认通过**

Run: `node --test tests/workbench-shell.test.js`

Expected: PASS

- [ ] **Step 2: 跑全量测试**

Run: `npm test`

Expected: 全绿

- [ ] **Step 3: 启动本地服务做浏览器验收**

Run: `node apps/redcube-web/src/server.js`

Use: `agent-browser`

Check:

- 空工作区首页的导演台首屏
- 首轮启动页的信息层级
- 项目总览首页的 hero / 状态摘要 / 行动区
- 桌面端与移动端布局
- 连接工作区 / 新建任务 / 运行页 / 输入页 / 产物页相关 CTA 仍可点击到达
- `prefers-reduced-motion` 约束仍保留，至少通过壳层测试确认未被回退

- [ ] **Step 4: 检查工作树并准备提交**

Run: `git status --short`

Expected: 只包含本次计划、设计文档和首页相关改动
