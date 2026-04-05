# 运行架构说明

这份文档写给需要理解 `RedCube AI` 技术边界的读者，但它仍然保持公开可读，而不是内部设计稿。

## 一句话理解

`RedCube AI` 不是 GUI 工具集合，而是一个面向 Agent 的 `Visual Deliverable Gateway`，并由内部的 `Visual Deliverable Harness OS` 驱动。

当前最重要的两类交付物是：

- `PPT deck`
- `小红书图文`

## 顶层链路

独立使用时：

```text
Agent
  -> RedCube Gateway
      -> Overlay / Family / Profile / Pack
          -> RedCube Harness OS
```

放在 `OPL` 顶层语义里时：

```text
User / Agent
  -> OPL Gateway
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Harness OS
```

## 各层职责

### RedCube Gateway

唯一正式入口，负责：

- 对外暴露 `CLI` 与 `MCP`
- 装载 workspace contract
- 路由到正确的 family / profile / pack
- 返回结构化状态与 artifact 引用

### Overlay / Family / Profile / Pack

负责定义交付物质量协议，而不是只定义 prompt 风格。

它们决定：

- 交付物类型
- 阶段顺序
- 审计门控
- review surface
- 导出要求

### RedCube Harness OS

负责执行、记录与审计，不负责顶层产品语义。

它负责：

- run store
- event log
- rerun / resume
- canonical artifact 落盘

## 为什么 PPT 和小红书放在同一套系统里

它们在目标场景上不同，但在运行形态上高度一致：

- 都需要结构化阶段
- 都需要审阅节点
- 都需要视觉与质量约束
- 都适合由 Agent 发起，而不是由人类手工点击界面

因此它们共享同一 harness，只在 family / profile / pack contract 上分化。

## OPL 语义边界

如果放回 `OPL` 顶层：

- `ppt_deck` 是当前最直接映射到 `Presentation Ops` 的 family
- `xiaohongshu` 共享同一 harness，但不自动等同于 `Presentation Ops`
- `RedCube AI` 仍然必须保留独立 domain gateway 角色，而不是退化成 OPL 的内部模块

## 更稳定的规则在哪里

如果你要读长期稳定的正式规则，请继续看：

- [运行模型 Policy](../policies/runtime_operating_model.md)
- [交付合同模型 Policy](../policies/deliverable_contract_model.md)

如果你只想快速开始，而不关心技术层次，请回到：

- [人类用户快速上手](human_quickstart.md)
