# 人类用户快速上手

这份文档写给专家、PIs 和专业内容团队。
它属于仓库跟踪的操作文档层，不属于默认对外双语公开正文面。
如果未来要把它提升到默认公开面，必须同步补齐英文 `.md` 与中文 `.zh-CN.md` 镜像。

如果你想使用 `RedCube AI`，最快的方式不是先学习底层命令，而是先把目标、材料和约束整理清楚，再交给你的 Agent 去推进。

## 先记住统一工作线

对人类用户，`RedCube AI` 应统一按下面这条线理解：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

这里有三条必须明确的口径：

- `Deep Research` 属于 `Source Readiness`，不是独立漂在外面的第 0 步
- 你可以在任意大步骤边界介入，通过 Codex 查看、修改、继续推进
- 真正阻断放行的是循环式 Review Gate，而不是一次性的 review

## 推荐的工作区结构

你可以直接拿一个全新目录当 `workspace`，不需要先手工搭完整棵树。
只要把参考材料放进去，然后让 Codex / Agent 在这个目录下调用 `RedCube AI`，它就应该按 canonical workspace contract 自动把结构水合出来。

稳定结构如下：

```text
<workspace>/
  redcube.workspace.json
  topics/
    <topic-id>/
      inputs/
      canonical/
      deliverables/
      notes/
      runs/
  runtime/
  publish/
  overlays/
```

你真正需要先理解的只有两层：

- 工作区根目录会有 `redcube.workspace.json`
- 每个主题最关键的事实真相面都落在 `topics/<topic-id>/canonical/`

如果你已经准备好了参考材料，建议直接放到 `topics/<topic-id>/inputs/`，或者让 Agent 通过绝对路径作为 `source-files` 读取。

## 你需要先准备什么

建议先准备下面几类材料：

- 这次交付的目标
- 目标受众是谁
- 原始素材，例如讲稿、论文、提纲、笔记、截图、表格或过往版本
- 你明确知道不能丢的关键信息
- 最终交付形态：`PPT` 还是 `小红书图文`

## 什么时候选 PPT，什么时候选小红书图文

更适合 `PPT` 的情况：

- 你要讲课、汇报、答辩或做正式演示
- 你需要清楚的节奏、分页和讲述结构
- 你的交付重点是“讲清楚”

更适合 `小红书图文` 的情况：

- 你要做知识传播或平台发布
- 你需要封面、页面信息密度和发布导向结构
- 你的交付重点是“可传播、可发布、可被快速理解”

## 推荐的工作方式

1. 准备一个独立工作区，把素材放进去。
2. 对你的 Agent 说明交付目标、受众、交付物类型和边界条件。
3. 如果你目前只有主题、关键词或粗略想法，让 Agent 先走 `Source Readiness`：先做 `source intake`，再在需要时生成并执行 `source augmentation` / `Deep Research`。
4. 让 Agent 使用 `RedCube AI` 作为视觉交付运行层推进。
5. 你只在关键节点审核，不手工操作底层运行细节。

对 Step 1，可以把它收口成一条稳定链路理解：

`source intake -> source augment -> source execute-augmentation`

## 你可以直接发给 Agent 的话

### Codex 的一句话启动指令

#### 场景一：你已经准备好了参考材料

> 请把这个目录当作 RedCube AI 的工作区。先读取这里已有的参考材料，必要时在同一工作区下完成 `Source Readiness`，如果 canonical source truth 还不够支撑后续判断，就继续执行 `source augmentation` / `Deep Research`，然后再推进到 Storyline、Plan、Visual 和 Delivery。

#### 场景二：你只有主题、关键词或粗略想法

> 请把这个目录当作 RedCube AI 的工作区，并围绕这个主题先建立 canonical `Source Readiness`。如果输入材料不足，请强制启动 `source augmentation` / `Deep Research` 去补全事实材料，等 Step 1 达到 `planning_ready` 后，再继续推进后续视觉交付步骤。

### 场景一：PPT 演示文稿

> 请先读取我提供的材料，并使用 RedCube AI（`https://github.com/gaofeng21cn/redcube-ai`）把它们组织成正式的 PPT 演示文稿。请先判断目标受众、讲述顺序、每一部分必须讲清的关键信息，再推进到可审阅、可迭代、可导出的正式交付物。如果方向不清楚，请先向我提问，而不是直接生成一版模糊的内容。

### 场景二：小红书图文

> 请先读取我提供的材料，并使用 RedCube AI（`https://github.com/gaofeng21cn/redcube-ai`）把它们组织成适合发布的小红书图文。请先判断受众、核心信息结构、页面节奏和传播重点，再推进到可审阅、可迭代、可导出的正式交付物。如果方向不清楚，请先向我提问，而不是直接生成一版模糊的内容。

## 你应该审核什么

无论是 `PPT` 还是 `小红书图文`，最值得你审核的是：

- 目标受众有没有判断对
- 主线结构是否清楚
- 该保留的专业信息有没有丢
- 表达是否符合你的身份与场景
- 是否已经达到可以正式导出或发布的程度

## 不建议的使用方式

- 不要先从底层命令开始学起
- 不要一上来就让 Agent “随便生成一版”
- 不要把所有希望都押在第一次输出上
- 不要跳过中间审阅，只盯最终导出文件
