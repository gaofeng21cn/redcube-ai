# RedCube AI

[![CI](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml)

RedCube AI 是一个面向 Agent 的视觉交付物运行层，用来稳定生产可交付的图文视觉成果。

截至 `2026-04-04`，这个项目已经不再以 GUI / Web Workbench 作为主线产品，而是收敛为：

> `Agent-first, human-auditable` 的 Gateway + Overlay + Runtime 体系。

这套体系面向的是 `Codex`、`OpenClaw` 之类的 Agent，而不是面向人类在图形界面里点按钮操作。

## Agent 合同分层

- 根目录 `AGENTS.md` 仅用于本仓库开发环境中的 Codex/OMX 协作，不是对外服务合同
- 宿主适配层位于 `contracts/dev-hosts/`，用于区分 OMX CLI 与 Codex App / plain Codex 的开发宿主行为
- 对外服务 Agent 的版本化合同位于 `contracts/redcube-runtime-service/AGENTS.md`
- 可选本机私有覆盖层约定为 `.omx/local/AGENTS.local.md`，保持未跟踪
- 本地工具运行态目录 `.omx/` 与 `.codex/` 必须保持未跟踪，不进入版本库

## 项目现在到底是什么

RedCube 不再定义为“小红书自动生成器”，而是定义为：

- 一个面向 Agent 的控制面
- 一个面向视觉交付物的 overlay 体系
- 一个可长时运行、可重跑、可审计的 runtime

当前最重要的判断是：

- `小红书图文笔记` 是一个 overlay
- `PPT deck` 也是一个 overlay
- 二者共享同一套 runtime、artifact store、event log 与 gateway surface
- 二者的差异只应出现在 `overlay contract + gate policy + export bundle`

如果是 `PPT deck`，你之前的讲者工作台逻辑不会被丢掉，而是会被拆进：

- workspace shared assets
- overlay stage contracts
- review loop contracts
- final delivery sync

## 三层结构

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

### Gateway

`Gateway` 是唯一正式入口，负责：

- CLI / MCP 机器接口
- workspace contract 装载
- overlay 选择与路由
- run 状态读取
- artifact 引用返回

### Overlay

`Overlay` 负责定义交付物应当长成什么样，以及什么是合格、什么是不合格。

当前正式方向：

- `xiaohongshu`
- `ppt_deck`

Overlay 必须定义：

- deliverable contract
- stage contract
- gate report contract
- visual/layout constraints
- export contract

例如对 `ppt_deck`，overlay 需要明确：

- `故事主线 -> 详细大纲 -> 逐页设计 -> 视觉导演稿 -> render -> review -> export` 的强制顺序
- 哪些 slide family 必须声明 `grid / track / anchor`
- 哪些证据页必须绑定公开来源 surface
- 哪些优化任务必须绑定 baseline deck

### Runtime

`Runtime` 只负责执行与审计，不负责领域判断。它负责：

- run ledger
- event log
- checkpoint / resume / rerun
- canonical artifact 落盘
- executor adapter 调度

## 质量不是“一次生成”，而是正式治理机制

这次重构里，RedCube 不再采用“每一步尽量出好成果，最终自然得到好成果”的单通路假设。

我们会把下面这些变成正式 contract：

- 审计门控
  - 先审计，再决定是否进入高成本 render / export
- review loop
  - 允许在结构、视觉方向、渲染结果、相对质量上反复修整
- runtime watch
  - 识别 run 当前卡点、待处理 review、可恢复阶段
- baseline 对照
  - 优化已有交付物时，必须把旧版认可稿作为质量基线

这部分思路直接吸收了两类已验证经验：

- 你的 PPT 工作台
  - 中间工件不能跳过
  - 旧版 vs 新版相对质量审阅
  - AI 原生截图质控
  - 复杂版式必须显式声明结构锚点
- MedAutoScience
  - controller-first 机器接口
  - 先审计、后进入高成本阶段
  - runtime watch
  - 结构化 gate 与 decision

## Runtime 复用策略

默认主路径不是“RedCube 自己再包一层外部大语言模型调用”，而是：

1. 优先复用宿主 Agent runtime
2. 把外部 LLM 兼容性保留为次级 executor adapter

这意味着：

- 在 `Codex` 里，RedCube 的 route 执行可以直接委托给 `Codex`
- 在 `OpenClaw` 里，也应优先走宿主 Agent runtime
- `OpenAI` 兼容接口、离线模型或其他外部模型后端仍可保留，但不再是架构主线

## 为什么 PPT 应该直接放在这个项目里

技术上，`PPT` 和 `小红书图文` 并不是两种完全不同的系统：

- 二者都依赖 `视觉导演 + 前端页面/版式表达`
- 二者都需要结构化 planning / storyline / visual / export artifacts
- 二者都需要显式 gate，而不是生成后再启发式修补
- 二者都适合通过 Agent 调 Gateway 来驱动

真正不同的是 overlay 控制层：

- 小红书关注封面、信息密度、平台文案和发布 bundle
- PPT 关注 16:9 比例、分节节奏、演讲逻辑和演示导出 bundle

所以 `PPT` 应该直接进入当前仓库，作为并列 overlay，而不是另起一个项目。

## 当前仓库状态

这次重构目前分为两个层次：

### 已完成基础层

- `packages/redcube-runtime-protocol`
  - 单一 workspace contract
  - run schema 与路径解析
- `packages/redcube-gateway`
  - 新的 gateway foundation
- CLI v2
  - 已改成 Gateway 的薄包装
- `packages/redcube-overlay-xiaohongshu`
  - 已有最小 contract 与 storyline gate foundation

### 正在推进的主线

- `packages/redcube-runtime`
  - host-agent executor adapter 主路径
- `apps/redcube-mcp`
  - 面向 Agent 的正式接口层
- 多 overlay 对齐
  - `xiaohongshu`
  - `ppt_deck`
- legacy Web / Workbench 退场

## 当前推荐入口

在这条新主线下，正式入口优先级如下：

1. `MCP`
2. `CLI`
3. legacy Web / Workbench 仅用于过渡，不再作为未来产品主线

## 快速开始

```bash
npm install
npm test
```

如果你只是想验证当前 foundation：

```bash
node apps/redcube-cli/src/cli.js help
node --test tests/*.test.js
```

建议把真实运行工作区放到仓库外，再通过环境变量指向它：

```bash
export WORKSPACE_ROOT="/absolute/path/to/your/workspace"
export REDCUBE_ROOT_DIR="$WORKSPACE_ROOT"
export REDCUBE_WORKSPACE_ROOT="$WORKSPACE_ROOT"
```

## 当前文档入口

- [视觉交付物 runtime 设计增量](docs/superpowers/specs/2026-04-04-redcube-visual-deliverable-runtime-design.md)
- [多 overlay 对齐实施计划](docs/superpowers/plans/2026-04-04-redcube-multi-overlay-alignment-plan.md)
- [Agent-first Runtime Program Plan](docs/superpowers/plans/2026-04-03-redcube-agent-first-runtime-plan-index.md)
- [更新日志](CHANGELOG.md)
- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)
- [许可证](LICENSE)

## 目录结构

```text
apps/
  redcube-cli/   # CLI gateway client
  redcube-web/   # legacy Web / Workbench entry, not future-facing
packages/
  redcube-gateway/             # Agent-first gateway actions
  redcube-runtime-protocol/    # workspace contract + run schema
  redcube-overlay-xiaohongshu/ # xiaohongshu overlay foundation
  redcube-agent/               # legacy orchestration surface pending retirement
  redcube-llm/                 # external LLM compatibility layer
  redcube-tools/               # file/publish/evaluation tools
tests/                         # Node built-in test suite
```

## 仓库与工作区约束

- 本仓库保存代码、测试、提示词与文档，不保存业务运行数据
- 运行真相应落在独立 workspace 根目录，而不是仓库根目录
- canonical JSON artifact 才是运行真相源
- Markdown / HTML / TXT 仅作为导出视图，不得反向成为运行真相
- 不再接受旧的双真相结构长期存在

## 对外部读者最重要的一句话

如果你要理解 RedCube 的未来方向，不要再把它理解成“一个给人点按钮用的小红书 Web 工具”。

应该把它理解成：

> 一个让 Agent 稳定生产视觉交付物的运行层，小红书和 PPT 只是其中两个 overlay。

默认离线规则生成（无外部依赖）。
如需调用 OpenAI 兼容接口：

```bash
export REDCUBE_LLM_MODE=openai
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.openai.com/v1
export OPENAI_MODEL=gpt-4o-mini
```

如需走 `pi-mono` 官方 `pi-ai` / `pi-agent-core`：

```bash
npm install @mariozechner/pi-ai @mariozechner/pi-agent-core
export REDCUBE_LLM_MODE=pi
export PI_MODEL_PROVIDER=openai
export PI_MODEL_NAME=gpt-4o-mini
```

## 提示词管理（Node 主链路）

新架构下，LLM 提示词已外置为独立文件，默认目录：

```text
prompts/node/
  aligned/
    自动小红书/
      提示词编排与调用顺序.md
      作者档案库.md
      人设自动路由规则.md
      风格指南/
      故事指南/
      策划提示词/
      视觉提示词/
      defaults/templates/
  note_draft.system.md
  note_draft.user.md
  storyline.system.md
  storyline_templates/
    medical_deep.md
    medical_traffic.md
    general_standard.md
```

- 正式版主线默认读取：`prompts/node/aligned/自动小红书/`
- 仓库内这套目录提供公开安全的默认 prompts
- 如果你有私有正式版 prompts，可通过私有配置或 `REDCUBE_PROMPTS_DIR` 指向外部目录
- `note_draft.* / storyline_templates/*.md` 仍保留作兼容入口，但不再是默认正式版来源
- CLI、Web API、Workbench 主线统一只读取这一套 Node 提示词体系，不再切回 Python 或第二套 workflow 提示词

可通过环境变量切换到你自己的提示词目录：

```bash
export REDCUBE_PROMPTS_DIR=/absolute/path/to/your/prompts
```

## 发布公开仓库

当前仓库已经适合直接作为公开仓库发布：

- 业务工作区与运行产物不应留在本仓库
- 私有作者信息、品牌、人设与正式 prompts 应放到仓库外
- 推荐通过 `gh` 创建并推送 GitHub 仓库

最短命令：

```bash
gh repo create gaofeng21cn/redcube-ai --public --source=. --remote=origin --push
```

更完整的发布说明见：

- [公开发布到 GitHub](docs/tutorials/public-github-publish.md)

## 私有人设与跨机迁移

推荐把你的真实作者人设、品牌与正式 prompts 放在用户私有配置目录：

```text
~/.config/redcube/
  runtime.json
  identity.json
  prompts/
    aligned/
      自动小红书/
        作者档案库.md
        人设自动路由规则.md
        defaults/AGENT_PRESET.default.md
        ...
```

首次从外部工作目录迁移：

```bash
node apps/redcube-cli/src/cli.js profile \
  --action bootstrap \
  --source-dir "/absolute/path/to/your-private-prompts/system/自动小红书"
```

导出当前私有层为 bundle：

```bash
node apps/redcube-cli/src/cli.js profile \
  --action export \
  --bundle "~/Downloads/redcube-private-profile.tgz"
```

在另一台机器安装 bundle：

```bash
node apps/redcube-cli/src/cli.js profile \
  --action install \
  --bundle "~/Downloads/redcube-private-profile.tgz"
```

如目标目录已存在私有层，可追加 `--force` 覆盖。

## Workbench 闭环

### 主题 workflow

当前主题级主线为：

```text
sync_inputs -> research -> storyline -> workflow -> truth_sync
```

- `research` 会在以下情况下自动触发：
  - `00_启动任务.md` 中 `允许联网搜集资料：是`
  - 本地材料为空或明显不足
  - brief 明确要求“联网研究 / 自行搜索 / 查最新 / 补充资料”
- 默认研究链：
  - 搜索：Bing RSS
  - 正文抽取：`r.jina.ai`
  - 产物落盘：`research_brief.md / research_report.md / sources.json / clips/*.md`

### 修改后自动局部重跑

- 修改 `单篇策划 / 信息图大纲 / 视觉导演稿`
  - 真相源统一映射到 `projects/<topic>/outputs_pi/<task>/content_plan.md`
  - 改完后回建 `note.json`，再重跑当前笔记后续链路
- 修改 `HTML / 当前页 / 截图`
  - 真相源统一映射到 `projects/<topic>/outputs_pi/<task>/visual.html`
  - 改完后只重跑当前笔记的 HTML 后续链路

## 正式阶段文档

Node 主线现在会在 `projects/<项目>/outputs_pi/<任务>/` 下真实落盘阶段文档，而不是只靠 workbench 镜像回填：

- `01_单篇策划.md`
- `02_信息图大纲.md`
- `02A_视觉导演稿.md`
- `03_HTML生成说明.md`
- `04_发布文案.md`
- `05_视觉质控复核.md`

Workbench truth sync 会优先同步这些真实阶段文档；缺失时才回退到旧派生逻辑。

## 测试

```bash
node --test tests/*.test.js
```

当前测试覆盖：
- TOC 解析与任务过滤
- 全流程运行冒烟
- 发布器输出
- CLI 冒烟
- Web API 无端口单测

## 仓库边界

公开仓库当前只保留 Node 主线所需的功能代码、提示词、测试与最小文档。
历史 Python 运行时、旧文档、本地状态文件与业务数据目录不再随仓库分发。
