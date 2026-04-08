# 运行模型 Policy

这份文档定义 `RedCube AI` 当前稳定的顶层运行边界。

## 项目定位

`RedCube AI` 对外是面向 Agent 的 `Visual Deliverable Gateway`，对内是共享 `Unified Harness Engineering Substrate` 上的视觉交付 `Domain Harness OS`；它不再是面向人类点击操作的 Web / Workbench 产品。

## 稳定原则

- 当前正式入口优先 `MCP`、`CLI`
- `Gateway` 是 `CLI / MCP` 共享的唯一正式控制面
- `controller` 当前不是独立、可验证的仓内正式入口
- `Overlay` 负责领域约束与交付质量协议
- `Harness OS` 只负责执行、记录、重跑与审计
- 正式主线优先复用宿主 Agent runtime
- 外部 LLM 兼容层只能是次级 adapter，不得重新主导系统架构
- 默认本地执行形态是 `Codex-default host-agent runtime`
- 未来可迁移到同一 substrate 上的 managed web runtime，但不改变 RedCube 的 domain 语义

补充执行原则：

- `Agent-first` 不等于 `external_llm-only`
- 在 Codex / OMX 语境里，`Codex-default host-agent runtime` 是当前正式默认执行形态
- code 必须退回 contract、governance、audit、artifact persistence 与 render boundary

## 长线目标与当前 program 必须分开理解

这里必须严格区分：

- 长线目标
- 当前 program
- 历史 tranche / freeze / closeout 证据

长线目标回答的是：

- `RedCube AI` 理想情况下最终要收敛成什么

当前 program 回答的是：

- 当前 repo-tracked mainline 正在覆盖哪一层能力

历史 tranche / freeze / closeout 证据回答的是：

- 现在这条主线是如何被逐步吸收到 `main` 的

因此：

- 长线目标不等于 `Phase 2 minimum baseline`
- 已吸收的 tranche 证据不等于当前产品身份
- 在 `autonomous longrun program mode` 下，某一 tranche 吸收到 `main` 后，后续 hardening 默认仍在同一主线上继续推进
- 只有遇到 frozen-truth conflict、产品级改向判断或 external dependency 时，才应停车

## 统一生命周期原则

正式主线统一按以下宏观生命周期理解：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核与治理采用共享双层 overlay：

- `visual_director_review`
- `screenshot_review`

补充约束：

- `research` 属于 shared source readiness / source augmentation，不应继续被理解成小红书专属 creative stage
- `Story Architecture` 与 `Visual Authorship` 必须以 agent / director 为主要创作责任面
- `screenshot_review` 允许代码主导技术质控，但 `visual_director_review` 不能继续长期退化成纯 heuristic gate
- 当前优先级是先统一生命周期语义与职责边界，再决定是否收敛 route naming

## 当前正式能力面

- `source intake` 已通过 `CLI` / `MCP` 成为 `Source Readiness` 的正式 baseline surface
- canonical quartet 固定为 `source-index.json`、`extracted-materials.json`、`source-audit.json`、`source-brief.json`
- `ppt_deck` 与 `xiaohongshu` 当前在同一 substrate 上消费 `shared_source_truth`
- `review / export / gate / audit hardening` 是当前主线的持续增强方向，不应再被误读成“先停在 minimum baseline，等人工点下一棒”
- 当前 repo-tracked phase 标签仍可保留为 program pointer，但它不等于长线目标本身

## 真相源原则

- 正式运行真相源是 canonical artifact
- Markdown / HTML / TXT 只作为导出视图，不作为反向运行真相
- 不允许长期保留双真相结构

## 退出的旧主线

下面这些已经退出正式 production path：

- Web UI
- Workbench
- 旧的双真相同步链

## 面向未来的约束

- 当前正式 surface 已包括：
  - `ppt_deck`
  - `xiaohongshu`
  - `poster_onepager`（当前只代表 knowledge poster，不代表 academic poster closeout）
- 新交付物类型应通过 overlay 扩展，而不是重新引入独立主线
- 新入口应挂在 Gateway 之上，而不是在外面包一层平行系统
- 新的质量规则应进入 contract / gate / policy，而不是依赖 prompt 补救
- 在 `OPL` 顶层语义里，`RedCube AI` 是视觉交付 domain gateway，不是 `OPL` 顶层 gateway 的替代物
- 不允许把 deterministic code authorship 重新包装成 `pack-first` 或 `typed` 进展
- 不允许把部署形态（host-agent / managed web）改写成本体语义变化
