# Historical Stable Deliverable Manual Test Brief

> 历史手工测试简报，冻结于 `2026-04-07`。它保留当时的 `stable deliverable` hardening 手测方案。当前默认入口、运行链路与验证口径以 `docs/status.md`、`docs/architecture.md`、`docs/README.md` 和 `contracts/runtime-program/current-program.json` 为准。

当前 baton 名称：`stable deliverable manual-test-driven hardening`

## 历史状态

- baton id：`stable_deliverable_manual_test_driven_hardening`
- 当前状态：`closeout_completed`
- 当前 review：`passed`
- 激活状态：这条下一棒已由 `Codex App` 显式激活
- 前置条件：`P0 review-closeout` 已通过，且 durable closeout 已 durably committed
- 2026-04-07 首轮正式手工测试结果：`ppt_deck = pass`、`xiaohongshu = pass`、hardening backlog = `manual_test_completed_no_findings`
- 范围只限：`ppt_deck`、`xiaohongshu`
- 明确不做：不打开 `Phase 2 / source intake + shared source truth`、不扩 `controller`、不新增 family / overlay、不推进 poster academic contract、不扩大 OPL federation

## 基线预检

先证明当前基线仍然是 tracked-only / clean-clone 可复现：

1. `git diff --check`
2. `npm run test:full`
3. `npm run typecheck`
4. `node --test tests/runtime-alignment-p0.test.js tests/poster-production-hardening-freeze.test.js tests/p21-operations-and-evaluation-os.test.js`
5. 在 clean-clone / tracked-only 条件下，至少重放第 4 步

若第 4 或第 5 步失败，本轮不进入 manual test，先回到 P0 closeout truth surface 修复。

## 手工测试对象 A：`ppt_deck`

### 输入

- `overlay`：`ppt_deck`
- `profile_id`：`lecture_student`
- `topic_id`：`manual-ppt-thyroid-basics`
- `deliverable_id`：`lecture-01`
- `title`：`Thyroid Basics`
- `goal`：`Explain thyroid fundamentals to undergraduate students`
- 最小材料包：
  - 课程提纲：定义、功能、常见检查、诊疗边界
  - 讲义笔记：`TSH / T3 / T4`、甲减 / 甲亢症状、就诊路径
  - 必保留边界：不能替代临床诊断；示例仅用于教学
- 参考面：`docs/deliverable_examples.md#示例一：给学生讲课的-PPT`

### 建议 CLI 序列

```bash
npm run redcube -- deliverable create \
  --workspace-root /ABS/PATH/TO/WORKSPACE \
  --overlay ppt_deck \
  --profile-id lecture_student \
  --topic-id manual-ppt-thyroid-basics \
  --deliverable-id lecture-01 \
  --title "Thyroid Basics" \
  --goal "Explain thyroid fundamentals to undergraduate students"
```

随后依次运行：

- `storyline`
- `detailed_outline`
- `slide_blueprint`
- `visual_direction`
- `render_html`
- `visual_director_review`
- `screenshot_review`
- `export_pptx`

### 预期产物

- hydrated deliverable contract
- storyline / detailed outline / slide blueprint / visual direction artifacts
- rendered html artifact
- visual director review report
- screenshot review report
- ppt export bundle，或显式 hard block

### 失败采样方式

- 缺失任何阶段 artifact：记为 `artifact gap`
- 章节节奏、页间叙事、讲授边界漂移：记为 `structure drift`
- `visual_director_review` 指出峰值页、层级、记忆点失真：记为 `visual direction miss`
- `screenshot_review` 暴露远视可读性、密度、对齐问题：记为 `screenshot regression`
- `export_pptx` 既未产出真实交付，也未显式 hard block：记为 `export contract failure`

### 通过标准

- 全部 route 顺序可执行，且 review surfaces 可回读
- `render_html` 与 `screenshot_review` 不出现阻断性失败
- 导出阶段产出真实 bundle，或给出显式 hard block
- 最终 deck 保持讲授节奏、结构层级与 visual direction 一致

### 不通过标准

- 缺失关键 artifact / review 报告 / 导出结果
- review surfaces 明确给出阻断结论
- 通过结论只能依赖 machine-local ignored state 才成立

## 手工测试对象 B：`xiaohongshu`

### 输入

- `overlay`：`xiaohongshu`
- `profile_id`：`standard_note`
- `topic_id`：`manual-xhs-thyroid-clinic`
- `deliverable_id`：`note-01`
- `title`：`甲状腺门诊小红书科普`
- `goal`：`为门诊患者生成可发布的科普图文`
- 最小材料包：
  - 门诊常见问题列表：症状、检查、何时复诊
  - 专业边界说明：不能替代医生面诊；避免夸大疗效
  - 平台风格要求：首页钩子、分屏节奏、结尾行动建议
- 参考面：`docs/deliverable_examples.md#示例二：知识传播型小红书图文`

### 建议 CLI 序列

```bash
npm run redcube -- deliverable create \
  --workspace-root /ABS/PATH/TO/WORKSPACE \
  --overlay xiaohongshu \
  --profile-id standard_note \
  --topic-id manual-xhs-thyroid-clinic \
  --deliverable-id note-01 \
  --title "甲状腺门诊小红书科普" \
  --goal "为门诊患者生成可发布的科普图文"
```

随后依次运行：

- `research`
- `storyline`
- `single_note_plan`
- `visual_direction`
- `render_html`
- `visual_director_review`
- `screenshot_review`
- `publish_copy`
- `export_bundle`

### 预期产物

- research / storyline / single note plan / visual direction artifacts
- rendered html artifact
- visual director review report
- screenshot review report
- publish copy artifact
- html / caption / png export bundle，或显式 hard block

### 失败采样方式

- `research` / `storyline` 无法保持专业边界：记为 `content boundary miss`
- `visual_director_review` 指出首页钩子、节奏、记忆点失真：记为 `visual hook miss`
- `screenshot_review` 暴露密度、排版、scan path 问题：记为 `screenshot regression`
- `publish_copy` 未给出可发布文案或质量 gate 失败：记为 `publish surface failure`
- `export_bundle` 未产出 html / caption / png 或 `delivery_state` 不明确：记为 `export contract failure`

### 通过标准

- 全部 route 顺序可执行，且 review surfaces 可回读
- 发布文案、视觉审阅与截图审阅结论相互一致
- 导出阶段产出 html / caption / png bundle，或给出显式 hard block
- 最终图文既保留专业边界，也保持可读与传播节奏

### 不通过标准

- 缺失关键 artifact / review 报告 / publish copy / export bundle
- review surfaces 明确给出阻断结论
- 通过结论只能依赖 machine-local ignored state 才成立

## 发现问题后的回写规则

所有手工测试暴露的问题，都必须先进入：

- `contracts/runtime-program/stable-deliverable-hardening-backlog.json`

每条 backlog 至少写明：

- `id`
- `overlay`
- `surface`
- `symptom`
- `severity`
- `evidence`
- `repro_steps`
- `next_action`

禁止把这些发现直接外扩到：

- `Phase 2 / source intake + shared source truth`
- `controller` 扩展
- 新 family / overlay
- poster academic contract
- OPL federation
