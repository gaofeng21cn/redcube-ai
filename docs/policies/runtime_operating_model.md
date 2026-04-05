# 运行模型 Policy

这份文档定义 `RedCube AI` 当前稳定的顶层运行边界。

## 项目定位

`RedCube AI` 对外是面向 Agent 的 `Visual Deliverable Gateway`，对内由 `Visual Deliverable Harness OS` 驱动；它不再是面向人类点击操作的 Web / Workbench 产品。

## 稳定原则

- 唯一正式入口是 `MCP` 与 `CLI`
- `Gateway` 是唯一正式控制面
- `Overlay` 负责领域约束与交付质量协议
- `Harness OS` 只负责执行、记录、重跑与审计
- 正式主线优先复用宿主 Agent runtime
- 外部 LLM 兼容层只能是次级 adapter，不得重新主导系统架构

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

- 新交付物类型应通过 overlay 扩展，而不是重新引入独立主线
- 新入口应挂在 Gateway 之上，而不是在外面包一层平行系统
- 新的质量规则应进入 contract / gate / policy，而不是依赖 prompt 补救
- 在 `OPL` 顶层语义里，`RedCube AI` 是视觉交付 domain gateway，不是 `OPL` 顶层 gateway 的替代物
