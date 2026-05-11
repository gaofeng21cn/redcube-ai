# RedCube Deep Research / 5 步 Auto-First 产品契约设计

日期：2026-04-08

状态：absorbed product-semantics support

生命周期说明：本文冻结的是 `Source Readiness -> Storyline -> Plan -> Visual -> Delivery` 的产品语义与 deep research 边界。当前可执行真相以 `docs/source/source_augmentation_executor_contract.md`、workspace canonical artifacts、runtime-family contracts 与 runtime-program contracts 为准；本文作为 absorbed product-semantics support 读取。

## 1. 设计结论

`RedCube AI` 对外应统一采用一套面向用户的 `5 步` 产品流程：

1. `Source Readiness`
2. `Storyline`
3. `Plan`
4. `Visual`
5. `Delivery`

同时冻结以下三条核心原则：

- `Deep Research` 不是独立第 0 步，而是 `Source Readiness` 的强化模式
- 系统运行模型是 `Auto-first, human-interruptible-at-any-boundary, loop-gated-before-delivery`
- `Review` 不是一次性步骤，也不是第 6 步，而是 `Visual -> Delivery` 之间的循环式放行门

这套口径用于统一 `xiaohongshu` 与 `ppt_deck` 的用户侧理解，不要求内部 stage sequence 完全同构。

## 2. 为什么要这样定义

当前仓库已经有共享宏观生命周期，但用户直觉里的“Research”与系统内现有 `research` route 存在明显偏差：

- 用户理解的 `Research` 更接近 Gemini / ChatGPT 式 `Deep Research`
- 当前 `xiaohongshu research` 更接近 source truth 之上的任务化整理 brief
- `audience / why now / tension / memory hook` 等内容本质上属于 `Storyline`，不应继续混入 `Research`

因此，正确做法不是继续扩大现有 `research` 的含义，而是：

- 把 `Deep Research` 提升为第 1 步 `Source Readiness` 的强化能力
- 把 `Storyline` 与 `Plan` 在用户侧显式拆开
- 保持内部 runtime 继续使用共享宏观生命周期与 review overlay

## 3. 正式产品流程

### 3.1 Step 1: Source Readiness

目标：

- 接收用户已有材料
- 判断材料是否足以支撑后续内容生成
- 在材料不足时自动补齐为可用事实库

第 1 步内部包含两种运行模式：

1. `Intake`
   - 用户材料已较完整
   - 系统执行 intake / extract / normalize / audit
   - 产出 canonical source truth
2. `Deep Research`
   - 用户只有关键词、主题、想法，或材料明显稀薄
   - 系统主动扩充公开材料并整理为可信事实库
   - 再进入统一的 source readiness 输出面

### 3.2 Step 2: Storyline

目标：

- 明确“讲什么”
- 明确“讲给谁”
- 明确“为什么现在讲”
- 明确“用什么张力开场”
- 明确“用什么记忆点带入后续叙事”

`Storyline` 的职责是把事实库转成叙事主线，而不是继续补事实。

### 3.3 Step 3: Plan

目标：

- 把叙事主线展开为可执行的篇/页结构
- 明确各单元承载的信息、顺序、节奏与收束方式

`Plan` 与 `Storyline` 必须在用户侧显式拆开，因为：

- `Storyline` 解决的是叙事判断
- `Plan` 解决的是结构拆解

这是两种不同的认知动作，也是两种不同的人工检查需求。

### 3.4 Step 4: Visual

目标：

- 把结构转成具体视觉表达
- 明确页面节奏、图文关系、版式风格、视觉峰值与信息密度

这里仍然是生产阶段，不是放行阶段。

### 3.5 Step 5: Delivery

目标：

- 生成最终交付物
- 完成交付包装、导出、发布包与后续 handoff

`Delivery` 是“把已经通过 gate 的产物交出去”，不负责替代 review。

## 4. 人类如何介入

人类通过 `Codex` 与 `RedCube AI` 协作，因此人工介入不应被绑定到某一个固定位置。

正式定义应为：

- 人类可以在任意大步骤边界介入
- 可以查看、修改、确认或要求继续推进
- 任意步骤都可以成为人工 checkpoint

但这些 checkpoint 默认都不是主线阻断门。

因此：

- `Storyline -> Plan` 是高价值 checkpoint，但不是唯一 checkpoint
- `Plan -> Visual`、`Visual -> Delivery`、甚至 `Source Readiness -> Storyline` 之间也都允许人工介入
- 默认主线仍必须支持端到端自动推进

## 5. 自动运行模型

正式运行模型应定义为：

> 系统默认全自动推进；人工可在任意阶段边界中断、检查、改写并恢复；若无人介入，系统必须可以从 `Source` 自动跑到 `Delivery`。

这意味着：

- 不能把 `Storyline` 设计成默认必须人工放行
- 不能把 `Plan` 设计成默认必须人工确认
- 不能把“建议人工看一下”偷渡成“没有人看就不准继续”

人工协作是增强能力，不是默认主线依赖。

## 6. Review Gate 的正式定义

`Review` 的正式身份是：

- `Visual -> Delivery` 之间的循环式放行门
- 不是一次性 review
- 不是 `Visual` 内部的一个普通子步骤
- 也不是单独第 6 个产品步骤

### 6.1 Review Loop

标准逻辑：

1. 进入 review
2. 如果通过，允许进入后续交付阶段
3. 如果不通过，写入 `pending_reviews`
4. 同时给出 `rerun_from_stage`
5. 从指定阶段回退重跑
6. 再次进入 review
7. 直到 `pending_reviews` 清空，才允许正式放行

### 6.2 Review 的两层

`Review Gate` 由两层构成：

1. `visual_director_review`
   - 判断导演意图是否落地
   - 判断是否反模板化
   - 判断是否有节奏、峰值与记忆点
2. `screenshot_review`
   - 判断 overflow / occlusion / density / speaker-time fit
   - 判断技术质量是否达到可放行状态

这两层都属于 gate，而不是普通产出步骤。

## 7. Deep Research 的正式边界

`Deep Research` 的定义应当收紧为：

> 当用户原始材料不足以支撑后续叙事与视觉判断时，系统主动或半主动补充公开材料，并把结果整理成可信、可追溯、可供后续消费的事实库。

它不负责：

- 直接替代 `Storyline`
- 直接输出最终内容蓝图
- 伪装成完整的创意策略引擎

对 `xiaohongshu` / `ppt_deck` 这类场景，`Deep Research` 的重点不是重型 `Idea` 对撞，而是把第 1 步的原始素材补全做好。

## 8. Step 1 的触发规则

### 8.1 强制触发 Deep Research

满足任一条件时，应强制启动：

- 输入只有关键词
- 输入只有主题 / 方向 / 粗略想法
- 输入材料数量明显不足
- 当前 source truth 无法支持叙事判断
- 当前 source truth 无法支持视觉判断

### 8.2 建议触发 Deep Research

满足任一条件时，应默认建议，但允许用户跳过：

- 已有少量参考材料，但覆盖不完整
- 材料来源质量参差不齐
- 已有材料缺少近期公开证据
- 已有材料无法支撑“为什么现在讲”这一层事实背景

### 8.3 可直接跳过 Deep Research

仅在以下情况下可默认不触发：

- 用户已提供较完整资料包
- canonical source truth 已足以支撑 storyline / visual judgement
- 任务重点是重组表达而非补事实

## 9. Source Readiness Pack 输出标准

第 1 步必须对后续步骤输出统一的 `Source Readiness Pack`。该输出应至少包含：

- 主题级事实摘要
- 主题分组后的关键事实条目
- 每条事实对应的来源引用
- 来源质量与时效性说明
- 禁用或不采纳来源说明
- 关键不确定项 / 待核查项
- 当前 source sufficiency judgement
- 可供 `Storyline` 直接消费的事实库摘要

这份输出必须被视为：

- `Storyline` 的唯一正式事实入口
- `Plan`、`Visual`、`Delivery` 的上游可信来源基础

## 10. Family 映射

### 10.1 小红书

- `Source Readiness`：`source intake + research`
- `Storyline`：`storyline`
- `Plan`：`single_note_plan`
- `Visual`：`visual_direction + author_image_pages`（默认 image-first）；显式 HTML 路线仍可使用 `render_html`
- `Delivery`：`publish_copy + export_bundle`

### 10.2 PPT

- `Source Readiness`：`source intake + shared source truth augmentation`
- `Storyline`：`storyline`
- `Plan`：`detailed_outline + slide_blueprint`
- `Visual`：`visual_direction + author_image_pages`（默认 image-first）；显式 HTML 路线仍可使用 `render_html`
- `Delivery`：`export_pptx`

因此：

- 两个 family 应对外共用同一套 `5 步` 话术
- 但内部 route 颗粒度可以不同
- 不要求 `ppt_deck` 必须长出一个与 `xiaohongshu` 同名的 `research` route

## 11. 推荐落地顺序

### 11.1 第一阶段：冻结口径

先收紧文档与 quickstart：

- README
- `docs/product/human_quickstart.md`
- family quickstart 话术
- Codex 调用口径

目标：

- 不再把现有 `research` 误写成完整 `Deep Research`
- 不再把 `Storyline` 语义混进 `Research`
- 不再把 review 写成一次性步骤

### 11.2 第二阶段：先做 shared Step 1

优先实现统一的第 1 步能力：

- Deep Research 触发规则
- Source Readiness Pack 输出
- family 共享消费方式

目标：

- 第 1 步先独立成为正式能力面
- 不先做重型 `Idea` 系统

### 11.3 第三阶段：先落在 xiaohongshu

优先把 `xiaohongshu` 作为样板 family 做通：

- 从低输入自动进入 Deep Research
- 自动得到 source readiness pack
- 后续阶段端到端跑通
- 支持任意边界的人类中断与恢复

### 11.4 第四阶段：对齐 ppt_deck

在不破坏现有 `ppt_deck` route 的前提下：

- 复用同一第 1 步 contract
- 对外共用同一 5 步话术
- 保持 direct-delivery 与 human-publication 的 family 差异

## 12. 成功标准

当以下条件同时成立时，可认为这次升级完成：

- 用户只有主题或关键词时，系统也能自动进入第 1 步补料
- 第 1 步输出可直接支持 `Storyline`
- 人类可在任意步骤边界通过 Codex 介入
- 无人介入时，主线可自动从 `Source` 跑到 `Delivery`
- `Review Gate` 以循环方式阻断与放行
- `xiaohongshu` 与 `ppt_deck` 对外已统一成同一套 `5 步` 解释

## 13. 非目标

本设计当前不追求：

- 把 `Deep Research` 直接扩成 `MedDeepScientist Scout + Idea` 的完整等价物
- 在第 1 步中引入重型候选博弈式创意系统
- 为了统一口径而强迫不同 family 采用完全同名的 route 结构
- 把人工 checkpoint 偷换成默认阻断 gate

## 14. 本设计对实现的约束

后续实现必须遵守：

- 先做 shared Step 1 contract，再做 family 适配
- 先保证 auto-first，再提供 human interruptibility
- review 必须保持 loop gate 语义，不得退化成一次性检查
- 文档、CLI、MCP、runtime、governance 的口径必须一致
