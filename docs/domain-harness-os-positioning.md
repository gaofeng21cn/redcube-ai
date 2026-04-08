# Domain Harness OS 定位与映射

这份文档用于统一 `RedCube AI` 在 `Unified Harness Engineering Substrate` 中的位置与边界。
它是仓库跟踪的内部技术口径文档，不属于默认对外双语公开正文面。

## 1. 项目在统一基座中的位置

`RedCube AI` 在统一基座中的角色是：

- 对外：视觉交付 `Domain Gateway`
- 对内：视觉交付 `Domain Harness OS`
- 上下游关系：可被独立调用，也可挂接在更高层系统（如 `OPL`）之下

这里的关键约束是：

- 共享同一 `Unified Harness Engineering Substrate`
- 通过同一套 `gateway -> family -> profile -> pack -> harness execution` 控制链运行
- 通过 family-specific contract 区分交付物，不通过平行系统分叉主线

## 2. 统一约束（跨 family）

跨 `ppt_deck`、`xiaohongshu`、`poster_onepager` 的统一约束包括：

1. 生命周期统一到 `Source Readiness -> Story Architecture -> Visual Authorship -> Delivery Packaging`
2. 审核覆盖至少包含 `visual_director_review` 与 `screenshot_review`
3. 运行真相源是 canonical artifact，而不是 prompt 历史
4. 质量规则进入 contract / gate / policy，不依赖 prompt 补救

## 3. Domain-Specific Contract 边界

本项目的 domain-specific contract 负责定义：

- 交付物类型与目标（family / profile）
- 阶段顺序、门控规则与审计结构（pack / policy）
- 导出形态与交付收口标准

本项目的 domain-specific contract 不负责定义：

- 顶层产品聚合语义（例如把 RedCube 写成 `OPL` 本体）
- 运行载体本身的部署包装（host-agent 或 managed web）

## 4. 当前默认 runtime 形态

当前默认本地执行形态：

- `Codex-default host-agent runtime`

当前正式入口优先级：

1. `MCP`
2. `CLI`

补充说明：

- `controller` 目前不是 repo-verified independent entry
- `Gateway` 是 `CLI / MCP` 背后的共享正式控制面

约束说明：

- `Agent-first` 不等于 `external_llm-only`
- `external_llm` 仅作为兼容层能力，不是并列主线
- Domain contract 决定控制面，prompt 仅作为辅助信息

## 4.1 当前主线能力边界

- `source intake` 已作为 `Source Readiness` 的正式 baseline surface 进入主线
- canonical quartet 固定为 `source-index.json`、`extracted-materials.json`、`source-audit.json`、`source-brief.json`
- `ppt_deck` / `xiaohongshu` 在同一 substrate 上通过 hydrated contract 消费 `shared_source_truth`，guarded `poster_onepager` 则共享同一 `source_truth_contract` 与 `source_truth_consumption` summary
- `Phase 2 activation package freeze` 已完成并作为已吸收的前置冻结件保留
- `review / export / gate / audit` hardening 已吸收为前置 provenance；authoritative source gate 继续留在 `auditDeliverable / runtimeWatch`，更深层 publication projection / delivery contract convergence 仍属于同一主线上的持续增强
- 这里的 phase / baseline 标签只作为当前 program pointer，不等于 `RedCube AI` 的长期 north star

## 5. 未来托管 runtime 形态

未来可以迁移到同一 substrate 上的 managed web runtime，前提是：

- 保持同一 contract shape
- 保持同一 gateway 控制链
- 保持同一 audit / artifact 真相源

迁移后不改变的内容：

- `RedCube AI` 仍是视觉交付 domain gateway + Domain Harness OS
- `RedCube AI` 仍不是 `OPL` 本体

## 6. 避免的错误表述

- 不把 `external_llm` 提升为并列主线
- 不把部署形态变化写成本体变化
- 不把 `OPL` 写成 `RedCube` 的替代定义
- 不把 prompt patch 当作 contract hydration 的替代
