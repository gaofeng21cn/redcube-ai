# RedCube AI

[![CI](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml)

<p align="center"><strong>面向专家与 PIs 的视觉交付平台</strong></p>
<p align="center">PPT 演示文稿 · 小红书图文 · Agent-first · Human-auditable</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>面向谁</strong><br/>
      希望把知识稳定交付为视觉成果的专家、PIs 与专业团队
    </td>
    <td width="33%" valign="top">
      <strong>控制什么</strong><br/>
      交付质量、审阅节奏、阶段约束，以及从草稿到导出的收口过程
    </td>
    <td width="33%" valign="top">
      <strong>最终产出</strong><br/>
      面向讲授、汇报、传播与发布的高质量视觉交付物
    </td>
  </tr>
</table>

> 对外，它是帮助专家和 PIs 组织与生产视觉交付物的平台；对内，它是一个 `Agent-first, human-auditable` 的 Gateway + Overlay + Runtime 体系。

## 这个平台适合谁

如果你经常遇到下面这些场景，`RedCube AI` 就是为你准备的：

- 你需要把课程内容、学术材料、行业知识或专业观点组织成正式的 `PPT deck`
- 你需要持续产出 `小红书图文` 或其他适合传播的知识型视觉内容
- 你不想只得到一堆临时脚本或一次性 prompt，而是希望把交付过程变成可重复、可审阅、可迭代的正式生产线
- 你希望让 `Codex`、`Claude Code`、`OpenClaw` 等 Agent 承担执行，但关键质量判断仍由人类把关

## 当前稳定支持的交付物

| 交付物 | 当前定位 | 典型场景 |
| --- | --- | --- |
| `PPT deck` | 面向讲授、汇报、答辩与正式演示的视觉交付物 | 课程讲义、学术报告、内部 briefing、答辩材料 |
| `小红书图文` | 面向知识传播与发布导向的视觉交付物 | 科普图文、观点表达、系列内容发布 |

当前 `PPT` 和 `小红书图文` 不是两套彼此割裂的系统，而是共享同一条运行主线：

- 共享 `Gateway`
- 共享 `Runtime`
- 共享 `Run Store / Event Log / Artifact Store`
- 共享可审计的 review 与 rerun 机制

真正的差异，落在各自的交付合同上，而不是藏在临时 prompt 拼接或人工补救里。

## 它控制的不是“一次生成”，而是交付质量

很多内容生成工具更像一次性出稿器。`RedCube AI` 想解决的是另一件事：

- 先明确这次交付物到底要服务谁，而不是先把东西生成出来再补救
- 先把阶段顺序、审阅节点和导出要求写清楚，而不是靠人工默契维持
- 先建立 review loop、baseline 对照和结构化 gate，再进入高成本 render / export
- 先保留可审计的中间状态与运行记录，再谈“结果好不好”

对专家与 PIs 来说，这意味着你看到的不只是一个最终文件，而是一条可追溯、可复查、可重跑的视觉交付过程。

## 最快开始方式

如果你是内容专家、PI 或专业团队负责人，最快的使用方式不是先研究底层命令，而是把目标、受众、材料和约束清楚地交给你的 Agent，再让它带着 `RedCube AI` 推进。

通常只需要三步：

1. 准备一个独立工作区，把你的素材放进去。
2. 告诉 Agent 这次要做的是 `PPT` 还是 `小红书图文`，目标受众是谁，最终要交付什么。
3. 让 Agent 使用 `RedCube AI` 作为视觉交付运行层推进，并由你审核关键结果。

你可以直接把下面这段话发给 Agent：

> 请先读取我提供的材料，并判断这次交付更适合做成 PPT 演示文稿还是小红书图文。如果我已经明确指定交付物类型，就按该类型执行。然后使用 RedCube AI（`https://github.com/gaofeng21cn/redcube-ai`）作为视觉交付运行框架，把这些材料组织成可审阅、可迭代、可导出的正式交付物。请明确目标受众、交付目标、关键信息结构、阶段顺序、审阅节点和最终导出要求；如果方向不清楚，请先提出澄清问题，而不是直接生成一版含糊的结果。

继续阅读：

- [人类用户快速上手](docs/human_quickstart.md)
- [典型交付示例](docs/deliverable_examples.md)
- [运行架构说明](docs/runtime_architecture.md)

## 平台如何工作

从高层看，这个平台的工作方式很简单：

1. 人类定义目标、受众、约束和最终用途
2. Agent 调用 `RedCube AI` 的正式接口，创建并推进交付任务
3. 平台把阶段结果、审阅意见、运行状态和导出物持续落盘
4. 人类在关键节点审核，决定继续、修改、重跑或结束

所以它更像一个“交付运行层”，而不是一个让人类自己点按钮操作的 Web 工具。

## 当前推荐入口

如果你是普通用户，优先通过你的 Agent 来使用它。  
如果你是技术同事或 AI 执行者，正式入口优先级如下：

1. `MCP`
2. `CLI`

## 文档约定

- 面向 GitHub 与外部读者的文档，统一放在 [`docs/`](docs/README.md)
- `docs/superpowers/` 目录只保留本地 AI / Superpowers 文档，并在 Git 中忽略
- 开发过程中的计划、草案与中间设计，不应继续进入公开仓库文档面

<details>
<summary><strong>给技术同事 / AI 执行者</strong></summary>

## 当前架构

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

- `Gateway` 是唯一正式入口，负责 workspace contract 装载、overlay 选择、run 状态读取与 artifact 引用返回
- `Overlay` 定义交付物合同、阶段约束、质量门控、review surface 与 export 要求
- `Runtime` 负责执行、审计、event log、rerun 与 canonical artifact 落盘

当前正式主线已经不再使用 `GUI / Web Workbench`。旧的 Web / Workbench surface 已经退出 production path。

## 当前支持的运行入口

安装与验证：

```bash
npm install
npm test
```

查看 CLI：

```bash
npm run redcube -- help
```

启动 MCP：

```bash
npm run mcp
```

## 一个最小 CLI 例子

```bash
npm run redcube -- deliverable create \
  --workspace-root /ABS/PATH/TO/WORKSPACE \
  --overlay ppt_deck \
  --profile-id lecture_student \
  --topic-id thyroid-basics \
  --deliverable-id lecture-01 \
  --title "甲状腺基础" \
  --goal "向本科生讲清甲状腺基础知识"
```

也可以把旧 `projects/<name>` 单向迁入新 canonical workspace：

```bash
npm run redcube -- import legacy-project \
  --project legacy-project-name \
  --root-dir /ABS/PATH/TO/LEGACY-ROOT \
  --workspace-root /ABS/PATH/TO/WORKSPACE
```

## 仓库结构

```text
apps/
  redcube-cli/   # CLI gateway client
  redcube-mcp/   # MCP gateway server
packages/
  redcube-gateway/             # Gateway actions
  redcube-runtime-protocol/    # workspace contract + run schema
  redcube-runtime/             # run store / event log / executors
  redcube-overlay-ppt/         # ppt_deck contracts
  redcube-overlay-xiaohongshu/ # xiaohongshu contracts
  redcube-overlay-core/        # overlay registry / hydration primitives
tests/                         # Node built-in test suite
```

## 仓库与工作区边界

- 本仓库存放代码、测试、提示词和文档，不存放实际业务运行数据
- 真实运行工作区应位于仓库外部，再通过环境变量或 CLI/MCP 参数指向它
- canonical JSON artifact 是运行真相源
- Markdown / HTML / TXT 只作为导出视图，不作为反向真相

建议把真实运行工作区放到仓库外：

```bash
export WORKSPACE_ROOT="/absolute/path/to/your/workspace"
export REDCUBE_ROOT_DIR="$WORKSPACE_ROOT"
export REDCUBE_WORKSPACE_ROOT="$WORKSPACE_ROOT"
```

## 私有 profile 与 prompts

如果你有私有作者信息、品牌、人设或 prompts，建议放到用户私有配置目录，而不是写回公开仓库：

```text
~/.config/redcube/
  runtime.json
  identity.json
  prompts/
```

相关说明见：

- [人类用户快速上手](docs/human_quickstart.md)
- [典型交付示例](docs/deliverable_examples.md)
- [运行架构说明](docs/runtime_architecture.md)
- [私有作者信息与 prompts 配置](docs/private-profile-setup.md)
- [公开发布到 GitHub](docs/public-github-publish.md)

## 公开文档入口

- [Docs 索引](docs/README.md)
- [人类用户快速上手](docs/human_quickstart.md)
- [典型交付示例](docs/deliverable_examples.md)
- [运行架构说明](docs/runtime_architecture.md)
- [Policies 索引](docs/policies/README.md)
- [运行模型 Policy](docs/policies/runtime_operating_model.md)
- [交付合同模型 Policy](docs/policies/deliverable_contract_model.md)
- [贡献指南](CONTRIBUTING.md)
- [更新日志](CHANGELOG.md)
- [安全策略](SECURITY.md)
- [许可证](LICENSE)

</details>

## 当前最重要的一句话

不要再把 `RedCube AI` 理解成“一个给人类手工操作的小红书 Web 工具”。

更准确的理解是：

> 一个让 Agent 稳定生产视觉交付物的运行层，而 `PPT` 与 `小红书图文` 是当前两类最重要的正式交付面。
