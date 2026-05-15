# Domain Harness OS 定位与映射

Owner: `RedCube AI`
Purpose: `contract_linked_positioning_reference`
State: `legacy_positioning_support`
Machine boundary: 本文是人读历史定位参考。机器真相继续归 contracts、CLI/MCP 行为、product-entry manifest、runtime workspace、review/export gate、artifact locator 与 owner receipts。

这份文档用于解释 `RedCube AI` 在历史 `Unified Harness Engineering Substrate` 口径中的位置与边界。它不属于默认公开入口，也不承担 active plan。

当前公开第一身份是独立 visual-deliverable domain agent 与单一 `redcube-ai` app skill。本文的 `Domain Gateway` / `Domain Harness OS` 词汇只能按历史内部边界层与执行层语言理解，不能读成当前 public identity、generic framework/runtime owner、frontdoor、federation 或 workbench truth。

## 1. 项目在统一基座中的位置

`RedCube AI` 在历史统一基座口径中的角色曾被描述为：

- 对外：独立 visual-deliverable domain agent
- 对内：视觉交付边界层 / 执行层语言
- 上下游关系：可被独立调用，也可作为 `OPL Framework` 的 admitted domain agent 被托管

这里的关键约束是：

- 可被 OPL 这类 stage-led、以 Agent executor 为最小执行单位 运行框架托管
- 通过同一套 RCA-owned `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 控制链运行
- 通过 family-specific contract 区分交付物，不通过平行系统分叉主线

理想型上，`RedCube AI` 应收敛成一个 `OPL` 可调用的 visual-domain 产品 / 服务节点，而不是把视觉 domain 重新吸回 family-level federation 本体：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

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

## 4. 当前读取口径

本节是 legacy positioning support，不是 current runtime owner 文档。当前 runtime truth 与后续差距分别读 [运行架构说明](../../runtime/runtime_architecture.md) 和 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)。下面只保留“这些历史词现在应如何读取”的口径：

- OPL stage-led hosted integration（OPL Framework 侧通用 runtime / queue / wakeup / projection 路径，消费 RCA descriptor、sidecar、receipt refs 和 operator projection）
- configured family runtime provider（Temporal 是 production online runtime 的必需 substrate；external `Hermes-Agent` 只作为 legacy/optional provider 或显式 hosted/proof lane）
- 本地 Codex CLI host-agent runtime（当前默认 concrete executor）
- `Codex` 本地 operator host（当前本地开发与操作宿主）
- repo-local managed runtime pilot（历史本地迁移工件，不是兼容桥或当前 owner）

RCA 只维护 visual-deliverable domain package 薄程序面：descriptor、product sidecar、service-safe domain entry、projection builder、review/export gate、artifact locator、receipt schema 和 domain transition spec/table。generic scheduler、generic queue、generic attempt ledger、generic workspace/source intake shell、generic artifact gallery、generic memory locator、generic observability 与通用 App/workbench runtime 都归 OPL 或未来产品壳，不在 RCA 内重建。

当前 formal-entry matrix：

- `default_formal_entry`：`CLI`
- `supported_protocol_layer`：`MCP`
- `internal_controller_surface`：`controller`

补充说明：

- `CLI` 与 `MCP` 当前都已 repo-verified，但 `CLI` 是默认 formal entry
- `controller` 目前不是 repo-verified independent public entry
- `gateway` 只作为历史包名或内部聚合层词汇读取；公开 action / tool 命名必须使用 product/domain action 体系
- 当前仓库主线按 `Auto-only` 理解；未来 `Human-in-the-loop` 产品应作为 upper-layer product、OPL App 或 product shell 读取 projection/receipt refs，不持有 visual truth、review/export verdict 或 artifact rewrite authority

约束说明：

- `Agent-first` 由默认 `Codex CLI host-agent runtime` 与显式 `hermes_agent` proof lane 共同成立
- explicit proof lane 可以使用 `hermes_agent`，但不改变默认 concrete executor 和 OPL production provider 口径
- Domain contract 决定控制面，prompt 仅作为辅助信息

## 4.1 被当前 owner docs supersede 的能力边界

- 以下条目只解释历史定位材料如何映射到当前 owner docs；不要把本节当成 active plan 或 runtime owner。
- `source intake` 已作为 `Source Readiness` 的正式 baseline surface 进入主线
- canonical quartet 固定为 `source-index.json`、`extracted-materials.json`、`source-audit.json`、`source-brief.json`
- `ppt_deck` / `xiaohongshu` 在同一 substrate 上通过 hydrated contract 消费 `shared_source_truth`，guarded `poster_onepager` 则共享同一 `source_truth_contract` 与 `source_truth_consumption` summary
- `Phase 2 activation package freeze` 已完成并作为已吸收的前置冻结件保留
- `docs/history/hermes/*` 相关 activation package 已转为历史本地迁移工件；它们不再代表“上游 `Hermes-Agent` 已接管 runtime”
- `review / export / gate / audit` hardening、`family source-truth consumption convergence`、`publication projection / delivery contract convergence`、`direct-delivery operator handoff hardening`、`direct-delivery lifecycle stage convergence`、`source-readiness deep research trigger + gate convergence`、`workspace / operator quickstart convergence` 与 `operator surface consistency hardening` 都已吸收为同一主线 provenance
- 当前 active tranche 应按 `repo-verified product entry + OPL stage-led hosted integration + managed product-entry hardening` 理解：OPL 托管路径通过 thin product-managed adapter/projection layer 挂到 configured family runtime provider，默认 concrete executor 仍是本地 Codex CLI host-agent runtime；product-entry service surface 与 session continuity 已 landed，而 mature end-user product shell 仍未落地；stable family runtime output、`xiaohongshu` human-publication closure 与 guarded `poster_onepager` 仍在同一 RedCube visual-domain truth 上收口
- authoritative source gate 继续留在 `auditDeliverable / runtimeWatch`；`operator_handoff` 与 `lifecycle_stage_summary` 继续沿同一 canonical governance path 暴露，而更深层 source-plane 扩展仍属于同一主线上的持续增强
- 这里的 phase / baseline 标签只作为当前 program pointer，不等于 `RedCube AI` 的长期 north star

## 5. 未来产品壳与托管形态

未来若出现面向人的 product shell、OPL App 面板或托管产品壳，前提是：

- 保持同一 RCA-owned domain entry、route truth、review/export gate 和 artifact authority
- 只读取 projection、artifact refs、review state、attention item 和 receipt refs
- framework-level 动作回到 OPL provider；domain-level 动作回到 RCA product entry / sidecar / direct skill

迁移后不改变的内容：

- `RedCube AI` 仍是独立 visual-deliverable domain agent
- `RedCube AI` 仍不是 `OPL` 本体、generic framework 或 workbench runtime
- visual ready、exportable、handoffable 只能由 RCA-owned gate 给出

## 6. 避免的错误表述

- 保持 `codex_cli` 默认主线与 `hermes_agent` 显式 proof lane 的双层执行结构
- 不把部署形态变化写成本体变化
- 不把 `OPL` 写成 `RedCube` 的替代定义
- 不把 prompt patch 当作 contract hydration 的替代
- 不把 `gateway`、`frontdoor`、`federation`、repo-local Hermes、local runtime 或旧 workbench 写成 active truth
- 不为退役模块、接口、CLI alias、测试入口或文档入口保留兼容面；迁移 active caller 后直接退役
