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
      `OPL` 家族中当前已 admitted 的视觉交付 domain 主线
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

`RedCube AI` 不是整个顶层家族，也不是对某个 runtime 的薄包装。
它的职责，是对视觉交付 truth 和受控交付流程负责。

```text
User / Agent
  -> OPL Gateway（可选）
      -> RedCube AI
          -> Runtime Surface
              -> Visual-Domain Truth
```

更直白地说：

- `OPL` 可以在这个仓之上，但不会取代它。
- `RedCube AI` 负责交付 workflow、审阅逻辑和 visual-domain truth。
- runtime surface 是执行层，不等于公开产品身份本身。

## 这个仓库不是什么

- 它不是“成熟 managed web 前台已经落地”的宣传口径。
- 它不是把 runtime ownership 和 visual-domain truth 混成一层的理由。
- 它不是“所有海报能力都已经达到发表级别”的承诺。

<details>
  <summary><strong>面向技术读者的运行时真相说明</strong></summary>

当前最诚实的主线，已经按三层 contract 理解：`Hermes-Agent` 持有长期托管与 managed-runtime owner，`RedCube AI` 持有 visual-domain truth，而默认 concrete executor 仍是本地 `Codex CLI` host-agent runtime。
当前仓内已实现且可验证的公开正式入口是 `CLI` 与 `MCP`。
route / managed execution 的长期 run surface 由 `Hermes-Agent` 主责。
默认 concrete executor 仍是本地 `Codex CLI` host-agent runtime。
service-safe domain adapter shell 是 `redcube_service_safe_domain_entry`。
`program_id`：active mainline 的 control-plane 指针。
`run_id`：单次 routed delivery execution 的 per-run 执行句柄。

当前 formal-entry matrix 仍是 `CLI`、`MCP` 和 `controller`。
仓库主线仍按 `Auto-only` 理解。

当前入口 wording 继续保持：

- `operator entry`、`agent entry`
- repo-verified entry surfaces cover `operator entry`, `agent entry`, and one thin service-level `product entry`
- repo-verified 的 `product entry` service surface 已经包括 `invokeProductEntry`、`invokeFederatedProductEntry`、`getProductEntrySession`
- `User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- `User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`
- 成熟的最终用户 `product entry` 前台壳并未落地

当前 repo-verified 的 lightweight product-entry shell 已包括：

- `redcube product preflight`
- `redcube product start`
- `redcube product frontdesk`
- `redcube product invoke`
- `redcube product federate`
- `redcube product session`
- `redcube product manifest`

这些表面已经让 direct / federated entry 更诚实、更机器可读，但并不等于成熟 end-user web 产品已经落地。

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

历史 `Hermes` 材料继续只是 absorbed provenance，不能被读成当前 runtime ownership 证明。
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
