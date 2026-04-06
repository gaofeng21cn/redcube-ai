# RedCube AI

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

[![CI](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gaofeng21cn/redcube-ai/actions/workflows/ci.yml)

<p align="center"><strong>面向 Agent 的 Visual Deliverable Gateway</strong></p>
<p align="center">PPT 演示文稿 · 小红书图文 · Agent-first · AI-first Intent · Human-auditable</p>

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

> 对外，它是面向 Agent 的 `Visual Deliverable Gateway`；对内，它由一个 `Agent-first, human-auditable` 的 `Visual Deliverable Harness OS` 驱动。typed contract 只是工程护栏，不是产品定位。

这里的 Agent-first 不等于必须走 `external_llm`。在 Codex / OMX 的执行语境里，`Codex-native host agent` 可以是正式主执行器，而代码退回 contract、governance、audit 与 artifact 边界。

## 今天已经被证明的是什么

当前仓库已经不再是松散原型，以下 baseline 已经在 `main` 上被验证：

- `PPT deck` 和 `小红书图文` 都已经是同一条正式 runtime 主线上的 family
- `typecheck`、端到端路由、review / publish governance、全量回归测试都已全绿
- TypeScript baseline、typed contract、typed service boundary、high-churn package boundary 都已经被 machine-readable closeout audit 覆盖

也就是说：现在的 RedCube 已经是一个带 typed 工程护栏的 Agent-first visual-deliverable baseline，而不只是 prompt 试验田。

## 在 OPL 联邦中的位置

如果放在 `One Person Lab (OPL)` 顶层语义里，更准确的定位是：

- `RedCube AI` 是视觉交付 domain 的正式 gateway
- 它下面承载的是视觉交付 harness，而不是一个一次性生成脚本集合
- `ppt_deck` 是当前最直接映射到 `Presentation Ops` 的 family
- `xiaohongshu` 与 `ppt_deck` 共享同一 harness，但在 OPL 顶层不自动等于 `Presentation Ops`

理想链路是：

`User / Agent -> OPL Gateway（可选顶层）-> RedCube Gateway -> RedCube Harness OS`

即使不经过 `OPL` 顶层，`RedCube AI` 也应保留独立可用的 domain gateway 角色，而不是退化成 OPL 的内部实现细节。

## 当前能力范围

RedCube 当前正式支持两条 production-grade baseline family：

| Family | 当前状态 | 典型用途 |
| --- | --- | --- |
| `ppt_deck` | 已验证的 baseline | 课程讲义、报告、答辩、正式 briefing |
| `xiaohongshu` | 已验证的 baseline | 知识图文、科普传播、系列发布 |

这两条 family 共享同一套：

- gateway
- runtime / harness
- governance model
- reference quality OS
- review / rerun / publish control model

真正的差异落在 family / profile / pack contract，而不是隐藏在一次性脚本里。

## 统一生命周期模型

RedCube 现在应收敛到一套共享的宏观生命周期：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核统一按双层 overlay 跟踪：

- `visual_director_review`
- `screenshot_review`

这里有一个关键澄清：

- `research` 不应再被理解成小红书专属 creative stage
- 它属于 shared source readiness / source augmentation
- 只有当 source truth 不足、原始材料不够、或后续 story / visual 判断缺少支撑时，才应触发

family 级 route 粒度仍然可以不同：

- `小红书`
  - `Story Architecture` 当前对应 `storyline + single_note_plan`
  - `Delivery Packaging` 当前对应 `publish_copy + export_bundle`
- `PPT deck`
  - `Story Architecture` 当前对应 `storyline + detailed_outline + slide_blueprint`
  - `Delivery Packaging` 当前对应 `export_pptx`

当前优先级是先统一语义和职责边界，而不是先做大规模 route 改名。

## 当前限制

RedCube 现在已经可用，但还不是终态。

需要诚实写清的限制有：

- 创作主导权仍然是当前最高优先级问题：
  - director-first contract 已存在
  - 但 deterministic compiler 和 JS pack logic 仍然拥有一部分实际表达路径
  - 真正的 AI-first / director-first authoring 还没有完全恢复
  - 双层审核模型也还没有完全收口：
    - `小红书` 已经有 `visual_director_review + screenshot_review`
    - `PPT deck` 还缺显式 `visual_director_review`
- 第三个 family 的 extension proof 还没做完
- 正式的 operations / evaluation OS 还没做完
- OPL federation integration 还没做完

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
- 共享 `Harness OS`
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
3. 让 Agent 使用 `RedCube AI` 作为视觉交付 gateway 推进，并由你审核关键结果。

你可以直接把下面这段话发给 Agent：

> 请先读取我提供的材料，并判断这次交付更适合做成 PPT 演示文稿还是小红书图文。如果我已经明确指定交付物类型，就按该类型执行。然后使用 RedCube AI（`https://github.com/gaofeng21cn/redcube-ai`）作为视觉交付 gateway / harness 框架，把这些材料组织成可审阅、可迭代、可导出的正式交付物。请明确目标受众、交付目标、关键信息结构、阶段顺序、审阅节点和最终导出要求；如果方向不清楚，请先提出澄清问题，而不是直接生成一版含糊的结果。

继续阅读：

- [Docs 索引](docs/README.zh-CN.md)

更细的操作文档继续保留在仓库中，但默认不属于对外双语公开正文面；只有在英文 `.md` 与中文 `.zh-CN.md` 镜像同步补齐后，才会被提升到默认公开面。

## 平台如何工作

从高层看，这个平台的工作方式很简单：

1. 人类定义目标、受众、约束和最终用途
2. Agent 调用 `RedCube AI` 的正式接口，创建并推进交付任务
3. 平台把阶段结果、审阅意见、运行状态和导出物持续落盘
4. 人类在关键节点审核，决定继续、修改、重跑或结束

所以更准确的理解是：它是一个 `Visual Deliverable Gateway + Harness OS`，而不是一个让人类自己点按钮操作的 Web 工具。

当前真实状态还要再补一层理解：

- shared source plane 已经存在
- 两条 family 已共享 runtime、治理与 artifact 面
- 但 creative chain 仍未完全收口：
  - Story Architecture 和 Visual Authorship 里仍有 deterministic JS 越界创作
  - `ppt_deck` 与 `xiaohongshu` 的 route surface 仍未完全语义对齐
  - 当前是“生命周期语义先统一，route naming 后统一”的阶段

## 当前推荐入口

如果你是普通用户，优先通过你的 Agent 来使用它。  
如果你是技术同事或 AI 执行者，正式入口优先级如下：

1. `MCP`
2. `CLI`

## 下一阶段会做什么

下一阶段不应该继续补零散 feature，而是围绕 4 个更高层目标：

1. 先把创作主导权从残余的 deterministic JS 逻辑里夺回来，恢复 AI-first / director-first 主线
2. 再证明 RedCube 真的是可扩展的 visual-deliverable OS
3. 把 runtime quality 推进成正式的 operations / evaluation surface
4. 把 RedCube 正式接入 OPL federation，成为 visual-deliverable domain node

当前下一阶段的 program 顺序是：

- `P19 / Creative Ownership Recovery And Director-First Mainline`
- `P20 / Extension Proof And Third-Family Onboarding`
- `P21 / Operations And Evaluation OS`
- `P22 / OPL Federation Integration`

## 文档约定

- 面向 GitHub 与外部读者的默认双语公开面，统一通过 [`docs/`](docs/README.zh-CN.md) 进入
- `docs/superpowers/` 目录只保留本地 AI / Superpowers 文档，并在 Git 中忽略
- 开发过程中的计划、草案与中间设计，不应继续进入公开仓库文档面

<details>
<summary><strong>给技术同事 / AI 执行者</strong></summary>

## 当前架构

```text
Agent
  -> Gateway
      -> Overlay
          -> Harness OS
              -> Executor Adapter
              -> Artifact Store
              -> Run Store
              -> Event Log
```

如果放回 OPL 顶层语义，可以理解为：

```text
User / Agent
  -> OPL Gateway (optional)
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Harness OS
```

- `Gateway` 是唯一正式入口，负责 workspace contract 装载、overlay 选择、run 状态读取与 artifact 引用返回
- `Overlay` 定义交付物合同、阶段约束、质量门控、review surface 与 export 要求
- `Harness OS` 负责执行、审计、event log、rerun 与 canonical artifact 落盘

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

- [Docs 索引](docs/README.zh-CN.md)

更细的私有配置、运行架构和发布说明继续保留在仓库跟踪的内部中文文档里，不直接作为公开首页的正文导航。

## 公开文档入口

- [Docs 索引](docs/README.zh-CN.md)
- [更新日志](CHANGELOG.md)
- [许可证](LICENSE)

更细的 `docs/*.md`、`docs/policies/*.md` 默认按仓库跟踪的内部中文文档维护。

</details>

## 当前最重要的一句话

不要再把 `RedCube AI` 理解成“一个给人类手工操作的小红书 Web 工具”。

更准确的理解是：

> 一个面向 Agent 的 Visual Deliverable Gateway，由 Visual Deliverable Harness OS 驱动；`PPT` 与 `小红书图文` 是当前两类最重要的正式交付面。
