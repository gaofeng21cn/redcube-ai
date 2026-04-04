# RedCube Visual Deliverable Runtime 设计增量

日期：2026-04-04

状态：已按最新方向冻结，覆盖 2026-04-03 设计中“小红书单 overlay + 内置 runtime 主路径”的假设

## 1. 增量结论

`RedCube AI` 的正式定位不应再是“小红书图文工作流工具”，而应是：

> 面向 Agent 的视觉交付物运行层（visual deliverable runtime）。

这意味着：

- `小红书图文笔记` 只是一个 overlay，不再是产品定义本身
- `PPT deck` 与小红书图文在技术底层属于同类对象，应直接纳入同一仓库、同一 runtime、同一 gateway 体系
- runtime 的主路径不再假设“由 RedCube 自己直接调用外部大语言模型”，而应优先复用宿主 Agent runtime
- 对外部 LLM 的兼容性可以保留，但只应作为次级 executor adapter，不能再反过来主导整体架构

## 2. 为什么 PPT 应该直接进入当前项目

`小红书图文` 与 `PPT` 的差别主要体现在：

- 版式比例不同
- 页面密度不同
- 叙事节奏不同
- publish/export 形式不同
- 质量 gate 标准不同

但它们在以下底层事实上一致：

- 都是以 `视觉导演 + 前端页面/版面表达` 生成最终交付物
- 都要求结构化 planning artifact、visual artifact、gate report 与最终 bundle
- 都需要长时稳定执行、可恢复重跑、事件审计与产物落盘
- 都更适合由 Agent 调 Gateway 发起，而不是由人类在 GUI 里点按钮

因此，正确边界不是“平台 A = 小红书，平台 B = PPT”，而是：

- `RedCube` = 视觉交付物运行层
- `overlay/xiaohongshu` = 小红书笔记控制层
- `overlay/ppt_deck` = PPT 演示文稿控制层

## 3. 更新后的三层结构

```text
Agent
  -> Gateway
      -> Overlay
          -> Runtime
              -> Executor Adapter
              -> Artifact Store
              -> Run Store
              -> Event Log
```

### 3.1 Gateway

`Gateway` 仍然是唯一正式入口，但其语义要从“小红书 topic 操作入口”收敛为“视觉交付物控制面”：

- 暴露 CLI 与 MCP
- 装载 workspace contract
- 解析 overlay 类型与目标 deliverable
- 把 route 执行请求下发给 runtime
- 返回结构化状态、artifact 引用与 gate report

### 3.2 Overlay

`Overlay` 负责把“什么是好的交付物”定义清楚。

它必须显式定义：

- deliverable contract
- stage contract
- quality gate contract
- visual/layout constraints
- export contract

当前正式纳入的 overlay 家族应至少包括：

- `xiaohongshu`
- `ppt_deck`

后续可以扩展，但不应让 runtime 或 gateway 再被某个单一平台语义绑死。

### 3.3 Runtime

`Runtime` 的职责修订为：

- run ledger
- event log
- checkpoint / resume / rerun
- canonical artifact 落盘
- route orchestration
- executor adapter 调度

`Runtime` 不负责：

- 判断标题像不像小红书
- 判断一页 PPT 是否足够演讲化
- 任何 overlay 领域 gate

## 4. Runtime 主路径：复用宿主 Agent runtime

截至 2026 年 4 月 4 日，`Codex`、`OpenClaw` 这类 Agent 已经自带成熟的运行时能力，包括：

- 工具调用
- 长上下文
- 文件系统访问
- 命令执行
- 多阶段交互

因此 `RedCube` 不应再把“自带一套外部 LLM 调用内核”当成主路线。

推荐顺序：

1. `host_agent` executor adapter
   - 运行请求直接委托给宿主 Agent runtime
   - `Codex`、`OpenClaw` 等属于这一类
2. `external_llm` executor adapter
   - 仅作为兼容层保留
   - 对接 OpenAI 兼容 API、离线模式或其他外部模型后端

这里的关键不是删掉兼容性，而是把兼容性放到正确边界之后：

- 对上层 `Gateway/Overlay` 来说，只面对统一 executor contract
- 对下层具体实现来说，可以同时支持 `host_agent` 和 `external_llm`
- 但产品叙事、默认路径、测试主线都以 `host_agent` 为第一公民

## 5. 正式对象模型要从 Note 扩大为 Deliverable

之前的设计过度把 `note` 当成唯一产物对象。更新后应采用：

- `topic`
- `deliverable`
- `run`
- `artifact`

其中：

- `topic` 是内容主题或项目级母体
- `deliverable` 是某个具体交付物实例
- `overlay` 决定这个 deliverable 的契约和 gate

第一批 deliverable 示例：

- `xiaohongshu_note`
- `ppt_deck`

## 5.1 `Presentation Ops` 到运行对象的映射

在 `OPL` 顶层语义里，`Presentation Ops` 不是一个 runtime 字段名，而是一类正式任务面。

它在 `RedCube` 里应映射为：

- `topic`
  - 一次课程、一次汇报主题、一次答辩任务
- `deliverable`
  - 某个具体 deck 实例，例如初稿、优化稿、答辩正式稿
- `run`
  - 某次 `storyline -> slide design -> render -> review -> export` 的执行记录
- `artifact`
  - 该次执行过程中产生的主线、逐页设计、视觉导演稿、评审报告与导出包

也就是说：

- `Presentation Ops` 决定任务语义
- `ppt_deck family` 决定视觉交付物类型
- `profile pack` 决定学生课、同行课、领导汇报、答辩稿等不同正式协议
- `Runtime` 负责把这些协议下的执行过程稳定落盘

## 6. Canonical Artifact 应抽象为视觉交付物公共层

公共 artifact 层不应再写成“小红书专属文件名”。建议抽象为：

- `brief.json`
- `storyline.json`
- `visual_plan.json`
- `render_bundle.json`
- `quality_gate.json`
- `publish_bundle.json`

overlay 可以在其内部补充特有字段，例如：

- `xiaohongshu`
  - cover/title strategy
  - hashtags
  - platform copy
- `ppt_deck`
  - slide ratio
  - speaker cues
  - section divider policy
  - export target: `.pptx` / PDF / presenter bundle

## 6.1 从 PPT 工作台吸收的正式生产纪律

你给出的“可迁移讲者工作台模板”里，真正应该产品化的不是某个历史课件，而是那套已经跑通的生产纪律。

`RedCube` 应正式吸收以下机制：

### 共享层与任务层分离

PPT 工作台已经验证：

- 共享层
  - 事实资产
  - 讲者/品牌资产
  - 装配规则
  - 工具链
- 单次任务层
  - 每个讲课任务独立产物链

这可以直接映射到 `RedCube` 的：

- workspace shared assets
- `topic -> deliverable` 执行面

### 中间工件不得跳过

PPT 工作台的顺序约束本质上是：

- 不得跳过 `故事主线`
- 不得跳过 `详细大纲`
- 不得跳过 `逐页设计`
- 不得跳过 `视觉导演稿`
- HTML 完成后必须做 AI 原生截图质控

迁移到 `RedCube` 后，应变成正式 contract：

- overlay 必须声明 `required_artifacts_by_stage`
- runtime 在进入下一阶段前必须验证上游 artifact 存在且 schema 合格
- 缺少上游工件时直接 block，而不是尽量继续

### 已有优质版本必须成为相对质量基线

如果任务类型是“优化已有稿”，旧版认可稿不应只是参考，而应成为正式基线：

- 任务声明为 `optimize_existing`
- 必须绑定 `baseline_deliverable`
- review 阶段必须输出 `relative_quality_report`
- 若新版在密度、节奏、质感或信息组织上退化，应直接阻断导出

### 复杂版式必须显式声明结构锚点

PPT 工作台中关于中轴、判断梯、时间带、多区对照、环状/十字结构页的规则，应抽象为 overlay 级结构约束：

- 某些 page/slide family 必须声明 `grid`、`track`、`anchor`
- overlay gate 需要验证这些结构字段是否存在
- render 阶段不得退化为“通用安全卡片布局”

### 公开证据面必须绑定可交付来源

PPT 工作台中“禁止出现内部占位来源”的规则，应成为正式 publish/export gate：

- 面向公开受众的证据页
- 必须绑定外部可解释来源 surface
- 不能把 `来源索引`、`内部资料`、`本目录参考材料` 这类内部占位来源直接暴露到最终交付

## 7. Workspace Contract 应为多 overlay 做好位置

建议目录更新为：

```text
<workspace>/
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
│       │       ├── reports/
│       │       └── views/
│       └── runs/
├── runtime/
│   ├── runs/
│   ├── events/
│   ├── checkpoints/
│   └── locks/
└── publish/
```

这样：

- 同一个 `topic` 下可以并列存在小红书笔记和 PPT deck
- 二者共用 research/storyline 等上游资产
- 下游 render/export 则由各自 overlay 单独控制

同时建议把共享资产显式前置为 workspace 正式层：

```text
<workspace>/
├── shared/
│   ├── facts/
│   ├── personas/
│   ├── visual_policies/
│   └── references/
└── topics/
```

这对应 PPT 工作台中的“素材库”思想，但这里会使用结构化 contract，而不是任由文档漂移。

## 8. Gateway action 也要去“小红书专名化”

下一阶段主线 action 建议修订为：

- `doctor`
- `show_workspace`
- `list_topics`
- `create_topic`
- `get_topic`
- `create_deliverable`
- `get_deliverable`
- `run_deliverable_route`
- `rerun_from_stage`
- `get_run`
- `list_runs`
- `overlay_status`
- `list_artifacts`
- `export_deliverable`

`run_topic_route` 可以作为过渡动作保留，但不应成为长期总入口。

为了把质量治理也变成正式机器接口，建议补充：

- `audit_deliverable`
- `review_render_output`
- `compare_against_baseline`
- `runtime_watch`

## 9. README 的重写原则

`README` 必须立即改写，避免继续误导外部读者。

新的 README 应明确：

- 这是一个 `Agent-first, human-auditable` 的视觉交付物运行层
- 主入口是 `Gateway + MCP + CLI`，不是 Web UI
- 小红书只是第一个 overlay，不是产品全貌
- `PPT deck` 属于同一 overlay 家族中的正式方向
- runtime 默认复用宿主 Agent runtime
- 外部 LLM 兼容性仍存在，但属于次级 adapter
- Web / Workbench 是 legacy，不再作为未来主线

## 10. 对现有 vertical slice 的直接影响

### 10.1 已完成的 `xiaohongshu overlay foundation` 继续有效

当前 `packages/redcube-overlay-xiaohongshu` 仍然成立，因为它证明了：

- overlay contract 可以独立成包
- gate report 可以结构化

但它不应再被理解为“最终唯一 overlay”。

### 10.2 下一批任务需要改写

原 vertical slice 中“runtime 负责 route 执行”的描述要修订为：

- runtime 负责 run/event/artifact/orchestration
- route 的具体执行通过 executor adapter 委托
- 主执行器是 `host_agent`

同时，应该把 `ppt_deck overlay` 纳入近期计划，而不是留到未来另起项目。

## 11. 从 MedAutoScience 吸收的质量治理形式

`MedAutoScience` 值得迁移的不是医学领域本身，而是它的治理方式。`RedCube` 至少应吸收以下机制：

### 11.1 controller-first 机器接口

不要把审计、review、交付同步继续写成“某个 prompt 顺手做一下”。

应将其稳定化为正式 controller / gateway action，例如：

- `audit_deliverable`
- `runtime_watch`
- `review_render_output`
- `export_deliverable`

### 11.2 先审计、后进入高成本渲染/导出

参考 MedAutoScience 的“先审计、后升级”，`RedCube` 应采用：

- 先做 preflight audit
- 再决定是否进入高成本 render/export route

例如：

- 素材不足，不允许直接进视觉生成
- baseline 未绑定，不允许做“优化已有稿”
- 公开引用面未整理，不允许出最终公开版本

### 11.3 轻量 route 与受管 route 分层

可以借鉴它的 `lightweight / managed` 思想：

- `lightweight`
  - research
  - storyline
  - outline review
  - direction decision
- `managed`
  - visual render
  - screenshot audit
  - export bundle
  - publish/export sync

只有 preflight gate 放行后，才能进入高成本 managed route。

### 11.4 runtime watch

RedCube 也需要自己的 `runtime_watch`：

- 识别当前 run 卡在哪一阶段
- 哪些 artifact 已落盘
- 哪些 gate 未通过
- 是否存在待处理 review loop
- 是否可以 resume / rerun / rollback

### 11.5 delivery sync

最终交付物不应停留在 runtime 临时产物层。

对于 `ppt_deck`，应存在正式 `delivery sync`：

- runtime 产出的 HTML / PPTX / review report
- 同步到 deliverable 的 final surface
- 保留 human-auditable 的浅路径交付面

## 12. review loop 不是附属功能，而是主生产机制

这次重构不应继续沿用“每一步尽量一次产好”的单通路假设，而应显式引入 review loop。

建议至少存在四类 review：

1. `structure_review`
   - 检查故事主线、详细大纲、逐页设计是否自洽
2. `visual_direction_review`
   - 检查页面家族、节奏曲线、破格页比例、视觉隐喻是否跑偏
3. `render_review`
   - AI 原生截图质控，检查拥挤、遮挡、失衡、密度和节奏
4. `relative_quality_review`
   - 与 baseline 对照，防止优化后退化

这些 review 必须输出结构化结果：

- `status`
- `issues`
- `severity`
- `rerun_from_stage`
- `recommended_action`

runtime 根据这些结果决定：

- 继续进入下一阶段
- 在当前阶段修复
- 回滚到上游阶段重做
- 停止导出
