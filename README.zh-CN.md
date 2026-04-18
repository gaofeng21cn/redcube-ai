# RedCube AI

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<p align="center"><strong>面向专家的正式视觉交付主线，不再只是一次性草稿生成器</strong></p>
<p align="center">幻灯片 · 小红书笔记 · 海报</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>面向谁</strong><br/>
      需要把结构化知识做成正式视觉交付物的专家、PI 与专业团队
    </td>
    <td width="33%" valign="top">
      <strong>能帮什么</strong><br/>
      受控创作、审阅、重跑、导出与交付收口
    </td>
    <td width="33%" valign="top">
      <strong>公开角色</strong><br/>
      `OPL` 壳下的一级 RCA / RedCube 视觉交付 domain agent
    </td>
  </tr>
</table>

> `RedCube AI` 的目标，是让专家既保留 Agent 带来的执行速度，也不失去对最终交付质量的控制。它帮助你把结构化知识做成可审阅、可重跑、可导出的正式视觉成果。

## 它能帮你做什么

- 生成用于教学、汇报、讲座和正式报告的幻灯片。
- 把结构化知识整理成用于科普传播和系列发布的小红书笔记。
- 在同一条受控主线上产出海报类交付物，而不是每次都重新拼工具链。
- 让审阅节点、重跑状态和导出结果保持可见，不再每次都重建流程。

## 当前交付物主线

| 交付物 | 状态 | 典型场景 |
| --- | --- | --- |
| `幻灯片` | Production-grade baseline | 教学讲义、学术报告、内部简报、正式汇报 |
| `小红书笔记` | Production-grade baseline | 知识传播、科普内容、系列发布 |
| `知识海报` | 可用支线 | 单页知识型视觉交付 |
| 学术论文 / 会议海报 | 仍在硬化 | 还不能作为已完成的公开承诺 |

## 更适合什么场景

- 你已经有源材料，需要把它们收口成正式视觉交付物。
- 你不想继续手工拼 prompts、设计工具、导出步骤和审阅流程。
- 你希望重跑、审阅节点和导出状态都保持可见。
- 你希望 Agent 多做执行，而专家保留最终接受与否的判断权。

## 这个仓库应该怎么读

1. 潜在用户先读当前首页，再继续看 [文档索引](./docs/README.zh-CN.md)。
2. 技术规划、架构判断和方向同步，继续读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[硬约束](./docs/invariants.md)、[关键决策](./docs/decisions.md) 以及 [合同说明](./contracts/README.md)。
3. 开发者和维护者再进入 `docs/program/`、`docs/references/`、`docs/policies/` 与 `docs/history/`。

## 用人话解释它的边界

`OPL` 是整个家族的顶层 GUI 与管理壳。
`RedCube AI` / `RCA` 是这个壳下面的一级视觉交付 domain module / agent。
它的职责，是对视觉交付 truth 和受控交付流程负责。

```text
User / Agent
  -> OPL GUI / management shell
      -> RCA / RedCube domain agent
          -> Codex default interaction and execution
              -> RedCube visual-domain truth
          -> Hermes-Agent backup / long-running gateway
```

更直白地说：

- `OPL` 负责把 RedCube 作为家族内的一个 domain agent 打开和编排。
- `RedCube AI` 负责交付 workflow、审阅逻辑和 visual-domain truth。
- `Codex` 是默认交互宿主、默认执行器和结构化生成路径。
- `Hermes-Agent` 作为显式备用执行模式与长期在线 gateway 保留。

## 当前公开状态

- 公开产品身份是 `OPL` 下的 RedCube 视觉交付 domain agent。
- 已验证正式入口是 `CLI` 与 `MCP`；`controller` 保持为内部控制面。
- 面向 OPL 的 product / frontdesk payload 是给外层壳读取的机器可读集成面。
- 学术论文 / 会议海报路线仍在硬化。

<details>
  <summary><strong>面向技术读者的执行真相说明</strong></summary>

当前协作模型：

- `OPL shell`：顶层 GUI、管理面和 family coordinator。
- `RCA / RedCube`：一级视觉交付 domain module / agent。
- `Codex`：默认交互宿主、具体执行器和结构化生成路径。
- `Hermes-Agent`：显式备用模式，以及 session / run / watch / resume 这类长期在线需求的 gateway。

当前仓内已实现且可验证的公开正式入口是 `CLI` 与 `MCP`；`controller` 保持为内部控制面。
`program_id`：active mainline 的 control-plane 指针。
`run_id`：单次 routed delivery execution 的 per-run 执行句柄。
仓库主线仍按 `Auto-only` 理解。

当前 RedCube domain-agent surface 包括：

- `redcube product preflight`
- `redcube product start`
- `redcube product frontdesk`
- `redcube product invoke`
- `redcube product session`
- `redcube product manifest`

内部 OPL bridge surface：

- `redcube product federate`

这条 bridge surface 应放在 integration reference 与 OPL shell wiring 记录中。首读用户材料保持更简单的模型：`OPL shell -> RedCube domain agent -> Codex default execution`，并把 `Hermes-Agent` 作为备用模式与长期在线工作入口。

当前 `Source Readiness` 的 wording 继续冻结为：

- `Deep Research` 属于 `Source Readiness`
- `source research` 继续作为这一步里明确的 operator-facing command surface
- `source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`
- `source intake + shared source truth` 已作为稳定 `Source Readiness` 能力面进入正式主线
- `planning_ready` 必须成为 `Source Readiness` 内部正式、可机读的放行 gate

当前仍属于同一主线 absorbed provenance 的 tranche 包括：

- family source-truth consumption convergence 已在同一主线上吸收一条 tranche
- operator surface consistency hardening 已在同一主线上吸收一条 tranche
- review / export / gate / audit hardening 已在同一主线上吸收一条 tranche
- publication projection / delivery contract convergence 已在同一主线上吸收一条 tranche
- runtime watch locator integrity hardening 继续作为同一主线上的 absorbed provenance
- workspace / operator quickstart convergence 已在同一主线上吸收一条 tranche

历史 `Hermes` 材料继续作为 absorbed provenance 与 advanced integration reference 保留。
</details>

## 开发验证

GitHub Actions CI 默认只跑 quality lane。

- `npm run test:fast`
- `npm run test:meta`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:full`
- 对较重的 Codex-backed 验证组，Node 侧串行执行会显式使用 `--test-concurrency=1`。
- 如果截图审阅或导出检查需要带 Playwright 的 Python，请把 `REDCUBE_PYTHON_COMMAND` 指向对应解释器。

## 延伸阅读

- [文档索引](./docs/README.zh-CN.md)
- [项目概览](./docs/project.md)
- [当前状态](./docs/status.md)
- [架构](./docs/architecture.md)
- [硬约束](./docs/invariants.md)
- [关键决策](./docs/decisions.md)
- [合同说明](./contracts/README.md)
