# 人类用户快速上手

这份文档写给专家、PIs 和专业内容团队。
它属于仓库跟踪的操作文档层，不属于默认公开入口。
如果未来要把它提升到默认公开面，先更新 `docs/public/` / `docs/product/` 的 owner 文档与核心五件套；不恢复 docs 层双语镜像。

如果你想使用 `RedCube AI`，最快的方式不是先学习底层命令，而是先把目标、材料和约束整理清楚，再交给你的 Agent 去推进。

## 先记住统一工作线

对人类用户，`RedCube AI` 应统一按下面这条线理解：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

这里有三条必须明确的口径：

- `Deep Research` 属于 `Source Readiness`，不是独立漂在外面的第 0 步
- 你可以在任意大步骤边界介入，通过 Codex 查看、修改、继续推进
- 真正阻断放行的是循环式 Review Gate，而不是一次性的 review

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
3. 如果你目前只有主题、关键词或粗略想法，让 Agent 先走 `Source Readiness`：先做 `source intake`，再在需要时生成并执行 `source augmentation` / `Deep Research`，直到 Step 1 到达 `planning_ready`。
4. 让 Agent 使用 `RedCube AI` 作为视觉交付运行层推进。
5. 你只在关键节点审核，不手工操作底层运行细节。

对 Step 1，可以把它收口成一条稳定链路理解：

`source intake -> source augment -> source execute-augmentation`

如果你不想手动拆开 Step 1，也可以直接把它理解成一个共享正式入口：

`source research`

它会先执行 `source intake`，然后按当前 route 决定是否继续进入 `source augment`、`source prepare-augmentation-result`、`source write-augmentation-result` 与 `source execute-augmentation`。

如果你走的是 Agent-native `result_file` route，可以把 `source augment` 和 `source execute-augmentation` 之间再展开成：

`source prepare-augmentation-result -> source write-augmentation-result`

也就是：

`source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`

这不改变 Step 1 的产品定位，它仍然属于同一个 `Source Readiness` 阶段；只是现在对 Codex / Agent 来说，已经有正式的 result scaffold 与 canonical write surface，不需要自己猜目录和 contract。

## 一句话快速开始指令

如果你只是想快速把任务交给 Codex 或其他 Agent，可以直接复制下面两条口径。

### 场景一：我已经准备好了参考材料

> 请把这个目录当作本次项目的独立 RedCube workspace。先执行 `workspace doctor`，再执行 `source intake` 读取并水合我提供的材料；如果 canonical source truth 还不够支撑后续判断，就继续执行 `source augment` 和 `source execute-augmentation`。然后根据任务目标创建 `topic` 与 `deliverable`，并按正式链路推进 review、rerun 与 export。若是小红书系列，请把每篇笔记建成独立 deliverable，例如 `note-01`、`note-02`。

### 场景二：我只有主题，让你先把事实材料准备好

> 请把这个目录当作本次项目的独立 RedCube workspace。围绕主题“{{主题}}”先进入 `Source Readiness`：如果现有材料不足，就强制启动 `source augmentation` / `Deep Research` 去补全事实材料，并把 Step 1 推到 `planning_ready`，不要直接进入成稿；待 canonical source readiness gate 放行后，再创建 deliverable 并推进正式交付链路。若是小红书系列，请按一篇笔记一个 deliverable 建模。

## 推荐的 workspace 组织方式

更适合当前 `RedCube AI` 的方式，不是把它当成“仓库里的一个脚本目录”，而是把它当成“面向一个独立 workspace 的运行时”。

推荐默认按下面的粒度理解：

- `1 个 workspace = 1 个相对独立的内容项目或系列`
- `1 个 topic = 1 个主题`
- `1 个 deliverable = 1 个正式交付物`

如果你做的是一批小红书系列笔记，最稳妥的组织方式是：

- `1 个 workspace = 这整个系列项目`
- `1 个 topic = 这组笔记的主题主线`
- `1 个 deliverable = 其中 1 篇笔记`

也就是说，系列中的第 1、2、3 篇，建议分别建成 `note-01`、`note-02`、`note-03` 这样的独立 deliverable，而不是把整组系列混在一个 deliverable 里。

## 推荐的目录结构

你可以直接拿一个全新目录当 `workspace`，不需要先手工搭完整棵树。
只要把参考材料放进去，然后让 Codex / Agent 在这个目录下调用 `RedCube AI`，它就应该按 canonical workspace contract 自动把结构水合出来。

当前实现对应的 canonical workspace contract 可以理解为：

```text
<workspace>/
├── .git/
├── .gitignore
├── redcube.workspace.json
├── topics/
│   └── <topic-id>/
│       ├── topic.json
│       ├── inputs/
│       ├── canonical/
│       ├── deliverables/
│       │   └── <deliverable-id>/
│       │       ├── deliverable.json
│       │       ├── artifacts/
│       │       ├── contracts/
│       │       ├── reports/
│       │       └── views/
│       ├── notes/
│       └── runs/
├── runtime/
├── publish/
└── overlays/
```

你真正需要先理解的只有两层：

- 工作区根目录会有 `redcube.workspace.json`
- 工作区根目录会有轻量 Git 边界，`runtime/` 会被根级 `.gitignore` 排除
- 每个主题最关键的事实真相面都落在 `topics/<topic-id>/canonical/`

建议这样理解这些目录：

- `inputs/`：原始材料输入面
- `canonical/`：shared source truth 等 topic 级正式真相面
- `deliverables/<deliverable-id>/artifacts/`：具体交付物的阶段产物
- `deliverables/<deliverable-id>/contracts/`：该交付物的 hydrated contract
- `deliverables/<deliverable-id>/reports/`：审阅、gate、状态等报告
- `deliverables/<deliverable-id>/views/`：给人类查看的视图层
- `runtime/`：运行记录
- `publish/`：最终导出面

这里最重要的约束是：

- `canonical/`、`contracts/`、`reports/` 不建议手工维护，应由 `RedCube AI` 自动落盘
- 你可以把材料先放进 workspace，也可以让 Agent 在 `source intake` 时把外部材料复制进 canonical 输入面
- 人类最好只维护原始素材和高层意图，不要把 runtime 真相层当普通笔记目录来改
- 外层 Git 用于让 Codex / Agent 快速识别 workspace truth；运行态继续留在 `runtime/`，不进入外层 Git 跟踪范围

如果你已经准备好了参考材料，建议直接放到 `topics/<topic-id>/inputs/`，或者让 Agent 通过绝对路径作为 `source-files` 读取。

## 新目录如何开始

当前仍没有单独的 `workspace init` 命令。`workspace doctor` 只负责诊断当前 workspace contract 是否存在；当目录是全新或很薄的 workspace 时，应由 `source intake` 或 `source research` 正式补齐 canonical bootstrap。第一次执行这些 Source Readiness surface 时，`RedCube AI` 已经会自动补齐基础结构：

- `redcube.workspace.json`
- `.git/` 与根级 `.gitignore`
- `topics/<topic-id>/inputs/`
- `topics/<topic-id>/canonical/`
- `topics/<topic-id>/topic.json`

在此基础上，执行 `deliverable create` 会继续补：

- `deliverables/<deliverable-id>/deliverable.json`
- 该 deliverable 对应的 `artifacts/`、`contracts/`、`reports/`、`views/`

如果 workspace 里后续要做小红书图文，bootstrap 现在还会补一套 workspace 级作者模板：

- `.redcube/runtime.json`
- `.redcube/identity.json`
- `.redcube/prompts/aligned/自动小红书/作者档案库.md`
- `.redcube/README.md`

这套模板默认是通用 `RedCube AI` 作者占位。当前项目真正的作者署名、品牌副标与叙事风格，直接在这里改。

因此，推荐把新项目的标准调用顺序固定为：

1. `redcube workspace doctor`
2. `redcube source intake`（材料已足够时）
3. `redcube source research`（材料薄或只有主题时）
4. `redcube deliverable create`
5. `redcube deliverable audit`
6. `redcube deliverable run`

## Research 当前状态

当前仓库里与“Research”相关的真实能力，应该拆成两层理解：

1. `source intake`
   - 这是正式 `Source Readiness` 入口
   - 负责 `intake -> extract -> normalize -> audit`
   - 会把输入材料水合成 canonical `shared_source_truth`
2. `source research` / `Deep Research`
   - 这是 shared source substrate 上的正式 augmentation orchestration surface
   - 它围绕 canonical `source-readiness-pack.json`、`source-augmentation-request.json`、`source-augmentation-result.json`、`source-augmentation-report.json` 与 `source-research-report.json` 收口
   - 它的职责是补齐 facts、sources、evidence 与 readiness，把 Step 1 推到 `planning_ready`

这里要特别避免误解：

- 现在的 `research` 不能被表述成“已经等价于 MedDeepScientist 的 Scout + Idea”
- 更准确的对应是：
  - `source intake` 更像事实 intake / normalize / audit
  - `source research` / `Deep Research` 更像 shared source readiness augmentation，用来解决 source insufficiency，而不是替代 `Storyline`
  - `storyline` 才开始进入内容策略与讲述主线阶段
- 当前它也不是完整自动上网调研系统；如果只有主题、没有材料，它应该先补齐公开来源、关键事实与 blocking evidence gaps，而不是直接跳成稿

## 一个更适合 Codex 的调用口径

如果你希望后续只告诉 Codex“在这个目录里调用 RedCube AI 开始工作”，建议把要求说成下面这种形式：

> 请把这个目录当作本次项目的独立 RedCube workspace。若缺少 `redcube.workspace.json`，先把 `workspace doctor` 当作诊断步骤，再由 `source intake` 或 `source research` 正式补齐 canonical workspace contract。把本次项目理解为 `1 个 workspace`、`1 个 topic` 与若干 `deliverable`。请先执行 `workspace doctor`，再执行 `source intake` 水合 shared source truth；若源材料不足，则继续执行 `source augment` 与 `source execute-augmentation`，把 Step 1 推到 `planning_ready`。随后为本次目标创建 deliverable，并按正式阶段推进 review、rerun 与 export。若是小红书系列，请把每篇笔记建成独立 deliverable，例如 `note-01`、`note-02`。

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
