<p align="center">
  <img src="assets/branding/redcube-ai-logo.svg" alt="RedCube AI Logo" width="132" />
</p>

# RedCube AI

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<p align="center"><strong>面向正式视觉交付的 skill-first domain agent，用来把资料、审阅和导出文件组织到同一条交付线上</strong></p>
<p align="center">幻灯片 · 小红书笔记 · 海报</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>适用人群</strong><br/>
      需要把结构化知识做成正式视觉交付物的专家、课题负责人、教师与专业团队
    </td>
    <td width="33%" valign="top">
      <strong>适用问题</strong><br/>
      资料、草稿、批注、导出结果分散在多处，希望把交付过程收在同一个工作区里
    </td>
    <td width="33%" valign="top">
      <strong>如何开始</strong><br/>
      直接说明要做什么成品、已有资料是什么、最后希望交付什么文件
    </td>
  </tr>
</table>

> `RedCube AI` 把源材料、生成过程、审阅轮次、进度反馈和导出文件放在同一条交付线上，方便持续推进和审阅；对外第一入口是单一 `redcube-ai` app skill。

## 一句话快速启动

你可以直接这样说：

- “把这份讲义笔记和参考文献整理成一套能直接讲课的幻灯片，过程里的进度要可见，最后给我可编辑文件。”
- “根据这批源材料帮我做一组小红书笔记，告诉我还缺什么素材，并把每一轮审稿意见和修改都留下来。”
- “根据这个项目摘要做一张海报，跟踪修改意见，内容定稿后把最终交付文件导出来。”

## 适合处理的工作

- 把笔记、大纲、参考文献、截图和旧版草稿整理成正式幻灯片、系列笔记和海报类成品。
- 在同一个工作区里持续跟踪多轮审阅、重跑和导出检查。
- 在长时间运行过程中查看人话进度，了解当前步骤和下一轮审阅重点。
- 让可编辑文件、导出结果和源材料保持清晰对应关系。

## 当前交付重点

- `幻灯片`：教学讲义、学术报告、内部简报、正式汇报。
- `小红书笔记`：知识传播、科普内容、系列发布。
- `知识海报`：单页知识型视觉交付。
- 学术论文与会议海报方向继续按具体项目评估和硬化。

## 工作方式

- 专家提供源材料、受众预期和最终判断。
- AI 助手负责生成、修订、重跑、导出和进度反馈。
- 工作区持续保存任务、审阅状态、重跑记录和最终文件，方便检查与回看。

## 当前边界

- `RedCube AI` 是独立的 visual-deliverable domain agent。
- 对外第一入口是单一 `redcube-ai` app skill；`frontdesk` / `invoke` / `session` 继续作为这个 skill 底下的 machine-readable command contracts。其中 `frontdesk` 指面向 agent 的 product-entry overview / intake / entry shell，不代表已经落地 GUI、WebUI 或最终用户前台壳。
- 它对外稳定暴露的 callable surface 是本地 CLI、MCP/product-entry commands、`invokeDomainEntry`、本地脚本与 repo-tracked contract，方便 `Codex` 或 `OPL` skill activation 直接调用。
- 它负责材料接收、成品生成、审阅回路、导出和文件式交付。
- direct route 与内部 OPL bridge 都收敛到同一个下游 RedCube domain-agent entry（`invokeDomainEntry` service-safe surface）。
- `OPL` 只保留 family-level 的 session/runtime/projection 编排与 shared modules/contracts/indexes；它的 federated product-entry 路径只是内部集成面，不是第一公开主语。
- 目标形态中的 `OPL Runtime Manager` 可以在外部 `Hermes-Agent` substrate 之上索引 RedCube product-entry/session/runtime/artifact/review projection，但 RedCube 继续持有 visual-domain truth。
- RedCube 的 public executor backend contract 只认 `codex_cli` 与 `hermes_agent`；`execution_shape` 另行声明为 `structured_call` 或 `agent_loop`。
- 实现语言目标是 `TypeScript + Python`：TypeScript 管 product/runtime contract 与 service boundary，Python 在 RedCube route/gate 下承担 native PPT/Office helper 与文档/PPT 修复循环。
- 内容界定、受众适配和最终采用由专家把关。
- 外部发布、上传和最终对外交付由人工监督完成。

## 这个仓库应该怎么读

1. 潜在用户先读当前首页，再继续看 [文档索引](./docs/README.zh-CN.md)。
2. 技术规划、架构判断和方向同步，继续读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[硬约束](./docs/invariants.md)、[关键决策](./docs/decisions.md) 以及 [合同说明](./contracts/README.md)。
3. 开发者和维护者继续从 [文档索引](./docs/README.zh-CN.md) 进入 `docs/program/`、`docs/references/` 与 `docs/policies/`。

## 给 Agent 和技术操作者的快速入口

<details>
  <summary><strong>如果你准备把这个仓直接交给 Codex 或其他 Agent，先看这里</strong></summary>

- 先读 [文档索引](./docs/README.zh-CN.md)。这里已经说明 direct route、内部 OPL bridge/reference、稳定 capability surface，以及当前技术基线。
- 然后读 [合同说明](./contracts/README.md)，再读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[硬约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)，再决定是否调整入口 wording 或集成表述。
- 当前 repo-verified public entry surfaces 是单一 `redcube-ai` app skill、`CLI` 和 `MCP`，`controller` 继续只是内部控制面；再加上 `invokeDomainEntry`、`invokeProductEntry`、本地脚本与 repo-tracked contract，就构成了稳定可调用面。本地默认 concrete executor 仍是 `Codex CLI`，hosted/proof backend 继续只在显式 opt-in lane 中出现。
- Agent 应把实现面理解为 TypeScript orchestration 加 Python native helpers。仓内已跟踪 JavaScript 已退役；新的产品、测试或脚本 JavaScript 会被 closeout audit 阻断。
- 如果外部 agent 或 OPL 需要直接读取 repo-tracked skill surface，使用单一 `redcube-ai` app skill 即可；`frontdesk` / `invoke` / `session` 继续作为这个 skill 底下的 machine-readable command contracts。legacy `redcube product frontdesk` 命令键继续保留为兼容入口，语义是 product-entry overview / intake shell，不代表成熟 human-facing GUI 或 WebUI；OPL federated bridge 仍然只是内部集成面。
- hosted quality lane 固定先跑一次 `npm run typecheck`，生成 compiled package exports 后再做类型检查，然后直接跑 `node --experimental-strip-types scripts/run-test-group.ts fast`、`family` 和 `meta:ci`；`meta:ci` 是扣除 fast 已覆盖文件后的 meta remainder，避免 hosted CI 重复跑同一批根级测试文件。浏览器 / renderer proof 环境只留在显式 `native-ppt-proof` 和 `image-ppt-proof` jobs，不进入默认 quality lane。family shared pin 检查必须继续通过 `scripts/run-test-group-lib.ts` 保持 clean-clone 可运行。
- 本地 `npm run test:integration`、`npm run test:e2e` 和 `npm run test:full` 继续保留 Codex / Python preflight，但只把明确的 route-heavy 文件串行化；其余文件回到 Node test runner 默认并发。已经本地跑过 fast 后，可用 `npm run test:integration:remaining` 只跑 fast 尚未覆盖的 integration 文件。
- `docs/program/` 用来读已经吸收进主线的阶段里程碑，`docs/references/` 用来读 bridge 和 provenance 材料；Agent 不需要先从零散实现文件里反推当前执行真相。

</details>

## 延伸阅读

- [文档索引](./docs/README.zh-CN.md)
- [项目概览](./docs/project.md)
- [当前状态](./docs/status.md)
- [架构](./docs/architecture.md)
- [硬约束](./docs/invariants.md)
- [关键决策](./docs/decisions.md)
- [合同说明](./contracts/README.md)
