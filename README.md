# RedCube AI

RedCube AI 是一个可配置的 Node/ESM AI 内容工作流引擎，用于把原始材料或自动 research 结果串成可执行的内容生产流程：系列规划、单篇策划、笔记生成、评估修复与发布。

## 核心能力

- Node 主线统一运行：CLI、Web UI、Workbench 共用一套 Node prompts 与领域工作流
- 自动 research：当原始材料为空、材料明显不足，或任务显式要求联网时，自动多轮搜索、抓取、抽取与落盘
- Workbench 闭环：修改真相源后按当前页或当前阶段自动局部重跑，不再整条链路重算
- 多入口协同：同时提供命令行入口、Web UI API、Workbench 主题工作台
- 私有层隔离：作者人设、品牌、正式 prompts、默认工作区都通过仓库外配置注入

## 架构概览

- `apps/redcube-cli/`
  - 新命令行入口，提供 `create/run/eval/publish/doctor/profile`
- `apps/redcube-web/`
  - Web UI 与 API 服务，覆盖项目主流程和 Workbench 工作台
- `packages/redcube-agent/`
  - 负责 research、workflow、truth sync、workbench 编排
- `packages/redcube-domain/`
  - 负责领域状态机与阶段运行规则
- `packages/redcube-llm/`
  - 负责离线模式与 OpenAI 兼容接口模式
- `packages/redcube-tools/`
  - 负责文件、项目、发布与评估工具
- `packages/redcube-memory/`
  - 负责运行状态持久化

主题级主流程：

`sync_inputs -> research -> storyline -> workflow -> truth_sync`

其中 `workflow` 主链为：

`规划 -> 生成 -> 评估 -> 修复 -> 发布`

## 快速开始

当前仓库不再依赖 git submodule，克隆后可直接安装：

```bash
npm install
```

建议把真实使用工作区放到仓库外，再通过环境变量或私有配置指向它：

```bash
export WORKSPACE_ROOT="/absolute/path/to/your/workspace"
export REDCUBE_ROOT_DIR="$WORKSPACE_ROOT"
export REDCUBE_WORKSPACE_ROOT="$WORKSPACE_ROOT"
```

常用命令：

```bash
# 1) 查看命令
node apps/redcube-cli/src/cli.js help

# 2) 新建项目骨架
node apps/redcube-cli/src/cli.js create --project "archive/我的新主题" --root-dir "$WORKSPACE_ROOT"

# 3) 运行全流程
node apps/redcube-cli/src/cli.js run --project "项目名" --root-dir "$WORKSPACE_ROOT"

# 4) 启动 Web UI
node apps/redcube-web/src/server.js
# 打开 http://127.0.0.1:3100
```

## 文档导航

- [公开发布到 GitHub](docs/tutorials/public-github-publish.md)
- [私有作者信息与 prompts 配置](docs/tutorials/private-profile-setup.md)
- [本次公开仓库收口设计](docs/plans/2026-03-22-public-github-publish-design.md)
- [README 与 GitHub 首页收口实施计划](docs/plans/2026-03-22-readme-github-homepage-plan.md)

## 目录结构

```text
apps/
  redcube-cli/   # 新命令行入口
  redcube-web/   # 新 Web UI 与 API 入口
packages/
  redcube-agent/   # 编排代理层
  redcube-domain/  # 业务状态机与流程
  redcube-tools/   # 文件/项目/发布器/评估工具
  redcube-llm/     # LLM 访问层（默认离线策略，可切 OPENAI）
  redcube-memory/  # 运行状态持久化
tests/             # Node 内置 test 冒烟集
```

## 仓库与工作区

- 本仓库只保留功能代码、提示词、测试与文档，不保留业务数据目录。
- `projects/`、`publish/`、`.redcube_pi/` 都视为运行产物，应落在独立 workspace 根目录，而不是当前仓库。
- 运行时目录、默认工作区、prompts 根目录、作者/品牌/署名都通过配置解析，不再写死在仓库中。
- 配置优先级：显式参数 > 环境变量 > workspace 私有配置 > 用户全局配置 > 仓库公开默认值。
- 私有配置可放在：
  - `config/local/*.json`
  - `~/.config/redcube/*.json`
  - `<workspace>/.redcube/*.json`
- `config/local/` 在公开仓库内默认整体忽略，只保留说明文件和占位文件，用于放本机私有覆盖配置。

## 快速开始

```bash
export WORKSPACE_ROOT="/absolute/path/to/your/workspace"
export REDCUBE_ROOT_DIR="$WORKSPACE_ROOT"
export REDCUBE_WORKSPACE_ROOT="$WORKSPACE_ROOT"

# 1) 查看命令
node apps/redcube-cli/src/cli.js help

# 2) 新建项目骨架
node apps/redcube-cli/src/cli.js create --project "archive/我的新主题" --root-dir "$WORKSPACE_ROOT"

# 3) 运行全流程
node apps/redcube-cli/src/cli.js run --project "项目名" --root-dir "$WORKSPACE_ROOT"

# 4) 独立评估
node apps/redcube-cli/src/cli.js eval --project "项目名" --auto-fix --root-dir "$WORKSPACE_ROOT"

# 5) 生成发布包
node apps/redcube-cli/src/cli.js publish --project "项目名" --root-dir "$WORKSPACE_ROOT"

# 6) 项目健康检查
node apps/redcube-cli/src/cli.js doctor --project "项目名" --root-dir "$WORKSPACE_ROOT"
```

## Web UI

```bash
# 命令行启动
node apps/redcube-web/src/server.js
# 打开 http://127.0.0.1:3100

# 或双击启动
./RedCube AI Web.command
```

### API 接口

- `POST /api/RunWorkflow`
- `GET /api/GetRunStatus?runId=...`
- `GET /api/ListProjects`
- `POST /api/CreateProject`
- `GET /api/StorylinePromptFiles`
- `POST /api/GenerateStoryline`
- `POST /api/GenerateSeriesToc`
- `GET /api/GetTaskArtifacts?project=...&taskFolder=...`
- `POST /api/RetryTaskStep`
- `GET /api/GetWorkbenchOverview`
- `POST /api/CreateWorkbenchTopic`
- `POST /api/RunWorkbenchTopicWorkflow`
- `POST /api/RunWorkbenchInstruction`

## 运行产物

以下路径均相对于外部 workspace 根目录，而不是本仓库根目录：

- 输出目录：`projects/<项目>/outputs_pi/`
- 发布目录：`projects/<项目>/publish_pi/`
- 运行状态：`.redcube_pi/runs/*.json`

Workbench 主题输入与镜像输出：

- 主题输入：`input/<topic>/`
- research 落盘：`input/<topic>/research/`
- Workbench 镜像输出：`output/<topic>/`

## 新项目输入准备

执行 `create` 后，会生成：

```text
projects/<项目>/inputs/
  series_toc.md
  style_guide.md
  storyline_logic.md
  raw_materials/
    README.md
```

你只需要至少准备两项：
- `raw_materials/*.md`：你的原始 markdown 素材（可多文件）

`series_toc.md` 现在不是硬性必需：
- 可以手工写 `series_toc.md`
- 也可以在 UI 点 `GenerateSeriesToc` 自动生成（自动判定系列/单篇，或强制指定）

`storyline_logic.md` 也不是硬性必需：
- 可以手工写
- 也可以在 UI 选择 `Storyline 提示词文件` 后点 `GenerateStoryline` 自动生成

然后执行 `run`。

## LLM 模式

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
