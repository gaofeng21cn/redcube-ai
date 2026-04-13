# 创作阶段 AI-First 审计（2026-04-13）

## 目的

这份审计只回答一件事：

- `PPT / 小红书 / poster` 的正式创作主链里，哪些 stage 必须由 AI / Agent 直接创作。
- 现在哪些已经收口到 `upstream Hermes structured generation`。
- 哪些环节不是创作，而是审查 / 打包。
- 仓内还残留哪些 legacy seed / template / compiler 代码，但已经不在正式主链上。

## 结论先行

- `ppt_deck`：`storyline / detailed_outline / slide_blueprint / visual_direction / render_html / visual_director_review` 已切到 AI-first。
- `xiaohongshu`：`storyline / single_note_plan / visual_direction / render_html / visual_director_review / publish_copy` 已切到 AI-first。
- `poster_onepager`：`storyline / poster_blueprint / visual_direction / render_html / visual_director_review` 已切到 AI-first。
- legacy `pack-runtime` compiler registry 与各 family 的 repo-local `pack/compiler` 创作实现已从 active mainline 清理掉。
- `screenshot_review` 仍然是 governed review，不是创作阶段。
- `export_pptx / export_bundle` 仍然是 delivery packaging，不是创作阶段。

## 创作步骤总表

### ppt_deck

| route | 生命周期 | 当前 owner | 说明 |
| --- | --- | --- | --- |
| `storyline` | `story_architecture` | upstream Hermes | 讲课主线、核心隐喻、叙事推进 |
| `detailed_outline` | `story_architecture` | upstream Hermes | 章节与逐页大纲 |
| `slide_blueprint` | `story_architecture` | upstream Hermes | 逐页内容骨架、讲述动作、recipe 决策输入 |
| `visual_direction` | `visual_authorship` | upstream Hermes | 视觉导演稿、节奏峰值、反模板约束 |
| `render_html` | `visual_authorship` | upstream Hermes | AI 直接写最终 slide HTML |
| `visual_director_review` | `review_overlay` | upstream Hermes | AI 直接做导演复盘判断 |
| `screenshot_review` | `review_overlay` | governed review | Python/截图质控，属于审查，不属于创作 |
| `export_pptx` | `delivery_packaging` | packaging | 导出交付物 |

### xiaohongshu

| route | 生命周期 | 当前 owner | 说明 |
| --- | --- | --- | --- |
| `research` | `source_readiness` | source-readiness logic | 事实层准备，不属于正文创作 |
| `storyline` | `story_architecture` | upstream Hermes | 读者冲突、hook、journey |
| `single_note_plan` | `story_architecture` | upstream Hermes | 卡片顺序、逐页文案骨架 |
| `visual_direction` | `visual_authorship` | upstream Hermes | 视觉导演稿 |
| `render_html` | `visual_authorship` | upstream Hermes | AI 直接写卡片 HTML |
| `visual_director_review` | `review_overlay` | upstream Hermes | AI 导演复盘 |
| `screenshot_review` | `review_overlay` | governed review | 截图/几何审查 |
| `publish_copy` | `delivery_packaging` | upstream Hermes | 发布正文、首评、标签 |
| `export_bundle` | `delivery_packaging` | packaging | 打包导出 |

### poster_onepager

| route | 生命周期 | 当前 owner | 说明 |
| --- | --- | --- | --- |
| `storyline` | `story_architecture` | upstream Hermes | headline / subheadline / proof promise |
| `poster_blueprint` | `story_architecture` | upstream Hermes | panel 结构、锚点、recipe 输入 |
| `visual_direction` | `visual_authorship` | upstream Hermes | 单页视觉导演稿 |
| `render_html` | `visual_authorship` | upstream Hermes | AI 直接写最终 poster HTML |
| `visual_director_review` | `review_overlay` | upstream Hermes | AI 导演复盘 |
| `screenshot_review` | `review_overlay` | governed review | 截图/布局审查 |
| `export_bundle` | `delivery_packaging` | packaging | 打包导出 |

## 本轮系统性修复

### 1. PPT 主链

- 修复了 `render_html` 落盘时缺失 `creativeSourceStamp` / `resolvePromptPackAsset` 的运行时断点。
- `render_html` 与 `visual_director_review` 的 ownership stamp 统一改成 `upstream_run_json_output`。

### 2. Poster 主链

- `storyline / poster_blueprint / visual_direction / render_html / visual_director_review` 全部改成 `generateStructuredArtifactViaUpstreamHermes(...)`。
- 运行时不再通过 `runtime_artifact` / `runtime_seed` / pack compiler 来 author 海报内容。
- `render_html` 改成 AI 直接输出完整单页 HTML，再由 shell 负责承载与持久化。

### 3. 回归测试

- 新增 `tests/poster-creative-ownership.test.js`。
- 扩展 `tests/helpers/mock-hermes-agent-upstream.js`，让 poster 的 story / blueprint / visual / render / director review 都能走 mock upstream。
- 现有 `ppt` 与 `xiaohongshu` creative ownership 测试已一起复测通过。
- `pack/compiler` legacy 真值相关的测试、审计与文档断言已同步改成 “pack 只保留 boundary / pack-id，不再承担创作”。

## 仍然存在的非 AI-first 部分

这些不是“创作降级”，而是目前故意保留的非创作环节：

- `screenshot_review`
  - 仍是 Python / 截图 / 几何与布局审查。
  - 它负责验收，不负责生成 audience-facing 内容。
- `export_pptx / export_bundle`
  - 仍是 delivery packaging。
  - 它负责把已审过的内容导出，不负责创作。

## legacy 残留状态

这轮清理之后：

- `packages/redcube-pack-runtime/` 已从 workspace 与依赖图移除。
- `packages/redcube-pack-ppt` / `packages/redcube-pack-xiaohongshu` / `packages/redcube-pack-poster-onepager` 只保留 typed shell / pack-id 边界，不再暴露 creative builder 或 render compiler。
- “不得重新接回 pack authoring”的静态守卫已经补到相关测试与审计里。

## 环境与配置问题

本轮也再次确认了一个独立问题：

- 只要创作 stage 改成 upstream Hermes，就必须稳定提供 upstream 执行环境。
- 当前测试侧还没有统一把 `mock upstream / base url / model` 作为默认 harness 前置条件。

这和用户反馈的“环境依赖暴露太多、使用门槛太高”是同一个问题面。

后续应统一收口：

- 默认执行器
- 默认模型
- 默认 reasoning effort
- 测试时的 mock upstream 启动与注入

## 本轮验证

已执行：

- `node --test tests/ppt-creative-ownership.test.js tests/xiaohongshu-creative-ownership.test.js tests/poster-creative-ownership.test.js`
- `node --test tests/ppt-hermes-generation.test.js`

结果：

- 全部通过。
