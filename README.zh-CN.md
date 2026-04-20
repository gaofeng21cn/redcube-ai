# RedCube AI

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<p align="center"><strong>面向正式视觉交付的工作台，用来把资料、审阅和导出文件组织到同一条交付线上</strong></p>
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

> `RedCube AI` 把源材料、生成过程、审阅轮次、进度反馈和导出文件放在同一条交付线上，方便持续推进和审阅。

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

- `RedCube AI` 是更大 `OPL` 工作区里的视觉交付工作线。
- 它负责材料接收、成品生成、审阅回路、导出和文件式交付。
- 内容界定、受众适配和最终采用由专家把关。
- 外部发布、上传和最终对外交付由人工监督完成。

## 这个仓库应该怎么读

1. 潜在用户先读当前首页，再继续看 [文档索引](./docs/README.zh-CN.md)。
2. 技术规划、架构判断和方向同步，继续读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[硬约束](./docs/invariants.md)、[关键决策](./docs/decisions.md) 以及 [合同说明](./contracts/README.md)。
3. 开发者和维护者继续从 [文档索引](./docs/README.zh-CN.md) 进入 `docs/program/`、`docs/references/`、`docs/policies/` 与 `docs/history/`。

## 给 Agent 和技术操作者的快速入口

<details>
  <summary><strong>如果你准备把这个仓直接交给 Codex 或其他 Agent，先看这里</strong></summary>

- 先读 [文档索引](./docs/README.zh-CN.md)。这里已经说明 direct route、OPL federated route，以及当前技术基线。
- 然后读 [合同说明](./contracts/README.md)，再读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[硬约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)，再决定是否调整入口 wording 或集成表述。
- 当前 repo-verified public entry surfaces 是 `CLI` 和 `MCP`，`controller` 继续只是内部控制面；本地默认 concrete executor 仍是 `Codex CLI`。
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
