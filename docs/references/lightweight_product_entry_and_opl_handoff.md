# RedCube AI 轻量产品入口与 OPL Handoff

## 1. 当前真相

`RedCube AI` 现在已经有可验证的 `operator entry` 和 `agent entry`：

- `operator entry`
  - 面向人类操作同事的命令、调试、审阅和导出控制面
- `agent entry`
  - 面向 `Codex` / Claude Code / OpenClaw 等 host-agent 的 `CLI` / `MCP`

但它还没有成熟的用户级 `product entry`。
也就是说，当前用户最顺的路径仍然是“通过自己的 agent 调 `RedCube AI`”，而不是直接进入一个稳定产品前台。

## 2. 目标形态

这个仓理想中的 domain 级产品链路应是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes Kernel -> Domain Harness OS`

在 `OPL` 家族级入口下，则应兼容：

`User -> OPL Product Entry -> OPL Gateway -> Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway`

这意味着：

- `OPL` 是 family-level 总入口
- `RedCube AI` 是 visual domain 自己的 lightweight direct entry
- 两者都存在，但作用域不同

## 3. 为什么需要两层入口

如果只有 `OPL` 有入口，而 `RedCube AI` 没有自己的轻量入口：

- 视觉 domain 会更像内部能力层，而不是独立产品
- 顶层会被迫吸收太多视觉交互语义
- 单仓测试、单仓交付、单仓演进都会变重

如果只有 `RedCube AI` 自己长入口，而 `OPL` 不先冻结 handoff 语言：

- 顶层与单仓的入口语义会漂移
- 家族级切 domain 的体验会断裂

所以这里要同时冻结：

- `RedCube Product Entry`
- `OPL -> RedCube` handoff envelope

## 4. 共享 handoff envelope

`OPL -> RedCube` 至少共享下面这组最小字段：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层公共 envelope 之上，`RedCube AI` 继续补 domain payload：

- `deliverable_family`
- `topic_id`
- `deliverable_id`

## 5. 当前不应过度宣称的事

- 当前还不能把 `RedCube Product Entry` 写成已成熟落地
- 当前也不能把 `OPL -> RedCube` handoff 写成真实线上运行中的用户入口
- 当前 runtime substrate 仍未真实切到上游 `Hermes-Agent`
- 所以这份文档冻结的是目标边界与调用合同，不是已完成的产品形态

## 6. 下一步落地方向

1. 保持 `CLI / MCP / controller` 的 formal-entry 语义稳定，不让产品入口叙事反向污染当前可验证入口。
2. 先补 `RedCube Product Entry` 的 contract shell，让 direct entry 与 OPL handoff 进入同一条命令/服务合同。
3. 在真实上游 `Hermes-Agent` substrate 证据成立后，再把 runtime session、resume、watch、route 接到真实 product entry 壳上。
