# RedCube AI Agent-First Runtime 重构设计

日期：2026-04-03

状态：已获方向确认，进入实施规划前设计冻结

## 1. 设计结论

`RedCube AI` 应从“面向人类操作的 Workbench 产品”重构为“面向 Agent 的内容生产运行层”。

新的系统采用三层结构：

1. `Gateway` 接口层
2. `Overlay` 中间层
3. `Workflow Runtime` 底层执行层

核心决策如下：

- 以 `Agent-first, human-auditable` 作为顶层运行原则
- 废弃 Web UI / Workbench 作为产品主线，不再继续扩展 [apps/redcube-web](/Users/gaofeng/workspace/RedCube%20AI/apps/redcube-web)
- 废弃当前 `workspaceRoot/input|output` 与 `rootDir/projects` 的双真相结构
- 建立单一 `workspace contract`
- 建立结构化 canonical artifacts，禁止再以面向人类的 Markdown 文档作为运行真相源
- `Overlay` 负责定义“小红书笔记应该长成什么样”以及各阶段 gate，而不是把这些规则散落在 prompt、UI 和后处理里
- `Workflow Runtime` 只负责稳定长时运行、断点恢复、阶段重跑、产物落盘与事件审计

这个方向与 `MedAutoScience` 的相似点在于：

- 唯一正式入口在上层控制面
- 中间层用 overlay / policy / gate 约束下层执行
- 底层 runtime 不负责领域治理，只负责执行
- 对 Agent 提供稳定机器接口，对人类保留审计面

不同点在于：

- `RedCube AI` 是内容生产运行层，不是医学研究治理平台
- 初期只需要一个主 overlay：`xiaohongshu`
- runtime 深度可低于 `MedDeepScientist`，但边界必须同样明确

## 2. 当前系统问题

### 2.1 UI 假设已经过时

当前主线默认用户会：

- 打开 Web UI
- 浏览 Workbench
- 手工创建 topic
- 点击按钮运行 workflow
- 在文件预览区返工与微调

但未来主要使用者是 `Codex`、`OpenClaw` 等 Agent。对这类使用方式，GUI 不是优势，而是多余的中间成本。

### 2.2 控制面与执行面耦合过深

[packages/redcube-agent/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/index.js) 当前同时承担了：

- Web API 背后的公开入口
- Workbench topic 管理
- 文件读写与上传
- 返工执行器
- run ledger
- topic workflow 编排
- 普通 workflow 入口

这使得系统没有清晰的“唯一正式入口”，也没有明确的 runtime 边界。

### 2.3 双真相结构不可持续

当前生产路径同时维护：

- `projects/<project>/...`
- `input/<topic>/...`
- `output/<topic>/...`

并通过这些模块反复同步：

- [packages/redcube-agent/src/workbench-project-sync.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-project-sync.js)
- [packages/redcube-agent/src/workbench-truth-sync.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-truth-sync.js)

这意味着：

- 运行真相并不唯一
- 任何阶段都可能出现漂移
- 架构天然依赖同步补救

该问题必须通过单一 workspace contract 根治，不能再保留双写或双向同步。

### 2.4 面向人的文档被当成运行真相源

当前多个阶段仍把以下文档当成事实来源或再解析来源：

- `content_plan.md`
- `01_单篇策划.md`
- `02_信息图大纲.md`
- `02A_视觉导演稿.md`

这会导致：

- 结构不稳定
- 返工无法精确定位
- 机器接口无法保证字段完备

重构后必须改为：

- JSON canonical artifact 为真相源
- Markdown / HTML / TXT 仅为导出视图

## 3. 目标与非目标

### 3.1 目标

- 提供面向 Agent 的稳定 `Gateway`
- 通过 `Overlay` 显式定义笔记契约、质量门、阶段规则和产物结构
- 保留并强化底层 workflow 的稳定产出能力
- 建立单一 workspace contract
- 建立可恢复、可重跑、可审计的 runtime
- 保留人类审核面，但不再围绕 GUI 设计系统

### 3.2 非目标

- 不继续把 Web UI 打磨成长期产品
- 不保留 Workbench 风格的文件浏览、按钮驱动、局部编辑体验
- 不把系统扩展成通用 Agent 平台
- 不依赖启发式后处理来补救不严谨的上游结构
- 不长期维持旧目录结构与新目录结构双写并存

## 4. 备选方案比较

### 方案 A：在现有系统外包一层 Gateway

做法：

- 保留当前 `redcube-agent + web/workbench + projects/input/output` 结构
- 只新增一个 CLI 或 MCP 薄封装

优点：

- 改动最小
- 上手最快

缺点：

- 底层仍然是 UI-first 架构
- 双真相和同步问题不变
- 后续任何演进都会被旧结构拖累

结论：拒绝。

### 方案 B：围绕现有生成内核做结构性重构

做法：

- 保留可复用的生成、评估、发布能力
- 重建 Gateway / Overlay / Runtime 边界
- 删除 Workbench 主线和双真相结构

优点：

- 能复用已有积累
- 能一次性修正核心边界问题
- 成本可控

缺点：

- 需要一次中等到大型切割
- 测试和目录结构要大改

结论：推荐。

### 方案 C：完全重写

做法：

- 新建全套 runtime、artifact store、overlay 和入口层
- 旧代码仅作参考

优点：

- 理论上最干净

缺点：

- 会丢失大量已验证能力
- 重建成本过高
- 风险不必要

结论：不采用。

## 5. 目标架构

### 5.1 总体分层

```text
Agent
  -> Gateway
      -> Overlay
          -> Workflow Runtime
              -> LLM / Tools / Artifact Store / Run Store
```

### 5.2 Gateway 层职责

`Gateway` 是唯一正式入口，负责：

- 暴露 CLI 与 MCP 两类机器接口
- 装载 workspace contract
- 调用 Overlay 解析 route 与 gate
- 调用 Runtime 执行 stage graph
- 返回结构化状态、报告与 artifact 引用

`Gateway` 不负责：

- 图形界面
- 文件浏览器
- 任意文件级 LLM 改写
- 人类导向的页面组织

建议的 Gateway action surface：

- `doctor`
- `show_workspace`
- `list_topics`
- `create_topic`
- `get_topic`
- `run_topic_route`
- `run_note_route`
- `rerun_from_stage`
- `get_run`
- `list_runs`
- `overlay_status`
- `list_artifacts`
- `publish_bundle`

这些 action 对应的风格应接近 `MedAutoScience` 的 controller-first 入口，而不是当前 Web API 的页面动作集合。

### 5.3 Overlay 层职责

`Overlay` 负责领域治理。对 `RedCube AI` 来说，第一期只有一个正式 overlay：

- `xiaohongshu`

它负责定义：

- topic 输入契约
- note 输出契约
- 各阶段必须生成的结构
- 什么叫“合格笔记”
- 什么叫“阻断项”
- 什么叫“可修复项”
- prompt 绑定与 stage routing
- publish bundle 的导出标准

`Overlay` 的核心原则：

- 规则前置，不做后补
- 结构显式，不做猜测
- gate 机器可读，不只给自然语言总结

### 5.4 Workflow Runtime 层职责

`Workflow Runtime` 只负责执行，不负责内容治理。它应提供：

- stage graph 执行
- run lifecycle
- checkpoint
- resume / retry / rerun-from-stage
- event log
- artifact materialization
- failure isolation

Runtime 不应直接包含：

- 小红书内容判断逻辑
- UI 专属状态
- 人工页面交互语义

## 6. 单一 Workspace Contract

### 6.1 设计要求

新架构只允许一个正式 workspace root。

任何生产运行都只落到这一套目录，不再维护 `projects` 与 `input/output` 两套映射结构。

### 6.2 建议目录

```text
<workspace>/
├── redcube.workspace.json
├── topics/
│   └── <topic-id>/
│       ├── topic.json
│       ├── inputs/
│       ├── canonical/
│       │   ├── research.report.json
│       │   ├── storyline.plan.json
│       │   └── series.plan.json
│       ├── notes/
│       │   └── <note-id>/
│       │       ├── note.json
│       │       ├── artifacts/
│       │       │   ├── planning.json
│       │       │   ├── draft.json
│       │       │   ├── visual.json
│       │       │   ├── visual.html
│       │       │   ├── publish_bundle.json
│       │       │   └── images/
│       │       ├── reports/
│       │       │   ├── planning_gate.json
│       │       │   ├── draft_gate.json
│       │       │   ├── visual_gate.json
│       │       │   └── publish_gate.json
│       │       └── views/
│       │           ├── planning.md
│       │           ├── outline.md
│       │           ├── visual_direction.md
│       │           └── publish_copy.md
│       └── runs/
├── runtime/
│   ├── runs/
│   ├── events/
│   ├── checkpoints/
│   └── locks/
├── overlays/
│   └── xiaohongshu/
│       └── overlay.config.json
└── publish/
```

### 6.3 约束

- `topic.json` 和 `note.json` 是元信息与绑定关系入口
- `canonical/` 与 `artifacts/*.json` 是运行真相
- `views/` 是导出视图，不允许反向成为真相源
- `runtime/` 只记录运行状态，不承载领域规则
- `publish/` 只放导出交付，不回写为运行输入

## 7. Canonical Artifact Contract

### 7.1 原则

所有阶段必须先产出结构化 artifact，再派生面向人类的视图文件。

### 7.2 Note 级关键 artifacts

- `planning.json`
  - 标题候选
  - 主叙事
  - 章节结构
  - 目标受众
  - 风格约束
- `draft.json`
  - 正文段落
  - 关键信息点
  - CTA
  - hashtags
- `visual.json`
  - 页数
  - 每页信息单元
  - 视觉指令
  - 渲染约束
- `publish_bundle.json`
  - 最终标题
  - 发布正文
  - 图片列表
  - 平台元信息

### 7.3 Gate reports

每个关键阶段都必须有显式 gate report：

- `status`: `pass | advisory | block`
- `blockers`: 精确阻断项列表
- `advisories`: 非阻断问题列表
- `metrics`: 可量化检查项
- `next_action`: 明确下一步

不得只返回模糊自然语言结论。

## 8. Overlay Contract：Xiaohongshu

### 8.1 Overlay 需要定义的对象

- `TopicContract`
- `SeriesContract`
- `NoteContract`
- `StageContract`
- `QualityGateContract`
- `PublishContract`

### 8.2 最小阶段模型

第一版建议由 overlay 定义以下正式阶段：

1. `intake`
2. `research`
3. `storyline`
4. `note_planning`
5. `note_drafting`
6. `visual_planning`
7. `visual_render`
8. `quality_gate`
9. `publish_bundle`

其中：

- `Gateway` 负责路由到这些阶段
- `Runtime` 负责执行这些阶段
- `Overlay` 负责定义每一阶段的输入输出契约和 gate

### 8.3 质量定义职责

`xiaohongshu overlay` 必须明确回答这些问题：

- 什么样的标题不合格
- 什么样的结构不适合图文笔记
- 什么样的视觉页结构会导致低质量
- 哪些问题可以在当前阶段修复
- 哪些问题必须回退到上游阶段重跑

该判断必须基于显式规则和结构化检查，不允许依赖“先生成再启发式补救”。

## 9. Gateway Contract

### 9.1 入口形式

第一期正式入口只保留：

- CLI
- MCP

不再把 HTTP Web UI 作为一级产品入口。

### 9.2 MCP 优先级

由于主要消费者是 `Codex`、`OpenClaw` 等 Agent，MCP 应成为第一优先接口。

建议新增：

- `apps/redcube-mcp`

其工具定义应直接对应 Gateway actions，而不是复用 Web 路由命名。

### 9.3 CLI 职责

[apps/redcube-cli/src/cli.js](/Users/gaofeng/workspace/RedCube%20AI/apps/redcube-cli/src/cli.js) 继续保留，但改造为 Gateway 的薄包装。

CLI 应从“命令行版旧系统入口”收敛为“可脚本化的 Gateway client”。

## 10. Runtime Contract

### 10.1 Run Model

每次运行都应有显式 run object：

- `run_id`
- `route`
- `scope`
- `target`
- `overlay`
- `status`
- `started_at`
- `finished_at`
- `current_stage`
- `stage_results`
- `artifact_refs`
- `error`

### 10.2 Event Log

每次运行都应产出 append-only event log，用于：

- 审计
- 恢复
- 回放
- Agent 调试

### 10.3 Retry / Resume 规则

Runtime 支持：

- `retry_same_stage`
- `rerun_from_stage`
- `resume_interrupted_run`

但这些动作都必须走 Gateway，不允许直接手改状态文件。

## 11. 代码重组方案

### 11.1 保留并重挂的模块

这些模块可保留核心能力，但需要重新挂接到新边界下：

- [packages/redcube-domain/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-domain/src/index.js)
- [packages/redcube-tools/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-tools/src/index.js)
- [packages/redcube-llm/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-llm/src/index.js)
- [packages/redcube-memory/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-memory/src/index.js)
- [packages/redcube-config/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-config/src/index.js)

### 11.2 需要拆解的模块

[packages/redcube-agent/src/index.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/index.js) 应拆成：

- `packages/redcube-gateway`
- `packages/redcube-runtime`
- `packages/redcube-runtime-protocol`
- `packages/redcube-overlay-xiaohongshu`

### 11.3 需要退场的模块

以下模块不再是主线能力：

- [apps/redcube-web/src/api.js](/Users/gaofeng/workspace/RedCube%20AI/apps/redcube-web/src/api.js)
- [apps/redcube-web/src/server.js](/Users/gaofeng/workspace/RedCube%20AI/apps/redcube-web/src/server.js)
- [apps/redcube-web/public/app.js](/Users/gaofeng/workspace/RedCube%20AI/apps/redcube-web/public/app.js)
- [packages/redcube-agent/src/workbench-workflow.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-workflow.js)
- [packages/redcube-agent/src/workbench-project-sync.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-project-sync.js)
- [packages/redcube-agent/src/workbench-truth-sync.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-truth-sync.js)
- [packages/redcube-agent/src/workbench-workspace.js](/Users/gaofeng/workspace/RedCube%20AI/packages/redcube-agent/src/workbench-workspace.js)

### 11.4 新包建议

```text
apps/
  redcube-cli/
  redcube-mcp/
packages/
  redcube-gateway/
  redcube-runtime/
  redcube-runtime-protocol/
  redcube-overlay-xiaohongshu/
  redcube-domain/
  redcube-tools/
  redcube-llm/
  redcube-memory/
  redcube-config/
```

## 12. 迁移策略

### 12.1 总原则

迁移必须是“显式 cutover”，不是长期双轨并存。

允许：

- 一次性导入工具
- 迁移验证

不允许：

- 新旧结构长期双写
- 依赖同步脚本维持一致
- 以兜底补救作为常态运行方式

### 12.2 迁移阶段

#### 阶段 0：冻结旧 UI 主线

- 停止给 `apps/redcube-web` 增加新功能
- 仅接受阻断性维护

#### 阶段 1：定义新 contract

- workspace contract
- artifact contract
- run contract
- overlay contract
- Gateway action contract

#### 阶段 2：建立新 Gateway

- 提供 CLI v2
- 提供 MCP server
- 先桥接现有生成核心

#### 阶段 3：建立 xiaohongshu overlay

- 明确阶段输入输出
- 明确 gate
- 明确 publish bundle contract

#### 阶段 4：建立新 Runtime

- run store
- event log
- checkpoint
- rerun / resume

#### 阶段 5：导入旧项目

- 提供一次性 importer，将旧 `projects` 结构导入新 workspace
- importer 只允许 `legacy -> new` 单向导入，不允许 `new -> legacy` 回写
- importer 只负责结构化迁移与校验，不承担长期同步职责
- 导入完成后，新路径成为唯一正式路径

#### 阶段 6：删除旧 Workbench 主线

- 移除 workbench sync
- 移除 Web API
- 移除文件级返工执行器

### 12.3 Cutover Gate

只有同时满足以下条件，才允许正式切到新主线：

- Gateway CLI 与 MCP 已覆盖当前核心生产动作
- `xiaohongshu overlay` 已具备最小可运行 gate 集合
- runtime 已具备 run store、event log、rerun-from-stage
- importer 已能把代表性旧项目稳定迁入新 workspace
- production path 中已不存在 `workbench-project-sync` / `workbench-truth-sync`

在 cutover 完成前，可以保留旧代码用于回归比对；在 cutover 完成后，旧同步链不得继续参与正式运行。

## 13. 测试策略

现有测试主轴需要重排。

### 13.1 应保留并迁移的测试类型

- runtime config tests
- workflow core tests
- artifact generation tests
- publish bundle tests

### 13.2 应新增的测试类型

- workspace contract tests
- overlay contract tests
- Gateway action tests
- MCP tool tests
- run resume / retry tests
- migration importer tests
- gate precision tests

### 13.3 应删除的测试主轴

- Web UI API tests
- Workbench shell tests
- workbench sync tests

## 14. 验收标准

完成重构后，至少满足以下标准：

- Agent 不需要 Web UI 即可完成 topic 创建、运行、状态查询、阶段重跑和发布导出
- 正式生产路径只存在一个 workspace truth source
- 所有核心阶段都有 JSON canonical artifacts
- 所有关键 gate 都输出结构化结果
- runtime 支持中断恢复和从指定阶段重跑
- 旧 Workbench 同步链不再参与 production path

## 15. 实施优先级

建议优先级如下：

1. 写清 contract
2. 切出 Gateway
3. 落 xiaohongshu overlay
4. 落 runtime store 与 event log
5. 做 importer
6. 删 Web / Workbench

## 16. 风险与控制

### 风险 1：旧文档型产物与新结构化产物冲突

控制方式：

- 以 canonical artifact 为唯一真相
- 文档全部改为派生产物

### 风险 2：旧项目迁移成本高

控制方式：

- 提供一次性 importer
- 禁止长期双轨运行

### 风险 3：实现时又回到 UI 思维

控制方式：

- 明确 MCP/CLI 是唯一一级入口
- Web 不再承载主线能力

## 17. 与 MedAutoScience 的借鉴边界

本设计直接借鉴 `MedAutoScience` 的这些理念：

- controller-first
- overlay-governed
- runtime boundary 清晰
- Agent-first, human-auditable
- 唯一正式入口

本设计不照搬的部分：

- 医学研究特有的 workspace/study/quest 分层
- 复杂的 publication / startup boundary 治理体系
- 与 `MedDeepScientist` 绑定的 runtime transport

`RedCube AI` 只借鉴其边界纪律，不复制其领域复杂度。

## 18. 下一步

本设计确认后，下一步不直接开始实现，而是进入 implementation plan，明确：

- 第一批文件切割顺序
- contract 定义顺序
- Gateway v2 与 MCP 的最小里程碑
- xiaohongshu overlay 的最小可运行集合
- 旧结构 cutover 条件
