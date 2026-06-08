# Domain Harness OS 定位与映射

Owner: `RedCube AI`
Purpose: `contract_linked_positioning_reference`
State: `legacy_positioning_support`
Machine boundary: 本文是人读历史定位参考。机器真相继续归 contracts、CLI/MCP 行为、product-entry manifest、runtime workspace、review/export gate、artifact locator 与 owner receipts。

这份文档用于解释 `RedCube AI` 在历史 `Unified Harness Engineering Substrate` 口径中的位置与边界。它已迁入 `docs/history/positioning/`，不属于默认公开入口、support reference 或 active plan；`human_doc:domain_harness_os_positioning` 只保留语义可检索性，不保留旧 reference 路径兼容承诺。

当前公开第一身份是独立 visual-deliverable domain agent 与单一 `redcube-ai` app skill。本文的 `Domain Gateway` / `Domain Harness OS` 词汇只能按历史内部边界层与执行层语言理解，不能读成当前 public identity、generic framework/runtime owner、frontdoor、federation 或 workbench truth。

## 1. 历史统一基座定位

`RedCube AI` 在历史统一基座口径中的角色曾被描述为：

- 对外：独立 visual-deliverable domain agent
- 对内：视觉交付边界层 / 执行层语言
- 上下游关系：可被独立调用，也可作为 `OPL Framework` 的 admitted domain agent 被托管

这里的关键约束是：

- 可被 OPL 这类 stage-led、以 Agent executor 为最小执行单位 运行框架托管
- 通过同一套 RCA-owned `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 控制链运行
- 通过 family-specific contract 区分交付物，不通过平行系统分叉主线

这份历史定位当时把 `RedCube AI` 收敛方向描述为一个 `OPL` 可调用的 visual-domain 产品 / 服务节点，而不是把视觉 domain 重新吸回 family-level federation 本体：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

## 2. 历史统一约束（跨 family）

跨 `ppt_deck`、`xiaohongshu`、`poster_onepager` 的统一约束包括：

1. 生命周期统一到 `Source Readiness -> Story Architecture -> Visual Authorship -> Delivery Packaging`
2. 审核覆盖至少包含 `visual_director_review` 与 `screenshot_review`
3. 运行真相源是 canonical artifact，而不是 prompt 历史
4. 质量规则进入 contract / gate / policy，不依赖 prompt 补救

## 3. 历史 Domain-Specific Contract 边界

本项目的 domain-specific contract 负责定义：

- 交付物类型与目标（family / profile）
- 阶段顺序、门控规则与审计结构（pack / policy）
- 导出形态与交付收口标准

本项目的 domain-specific contract 不负责定义：

- 顶层产品聚合语义（例如把 RedCube 写成 `OPL` 本体）
- 运行载体本身的部署包装（host-agent 或 managed web）

## 4. 当前读取口径

本节是 legacy positioning support，不是 current runtime owner 文档。当前 runtime truth 与后续差距分别读 [运行架构说明](../../runtime/runtime_architecture.md) 和 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)。下面只保留“这些历史词现在应如何读取”的口径：

- OPL stage-led hosted integration（OPL Framework 侧通用 runtime / queue / wakeup / projection 路径，消费 RCA descriptor、domain_action_adapter、receipt refs 和 operator projection）
- configured family runtime provider（Temporal 是 production online runtime 的必需 substrate；external `Hermes-Agent` 只作为 legacy/optional provider 或显式 hosted/proof lane）
- 本地 Codex CLI host-agent runtime（当前默认 concrete executor）
- `Codex` 本地 operator host（当前本地开发与操作宿主）
- repo-local managed runtime pilot（历史本地迁移工件，不是兼容桥或当前 owner）

RCA 只维护 visual-deliverable domain package 薄程序面：descriptor、product domain_action_adapter、service-safe domain entry、projection builder、review/export gate、artifact locator、receipt schema 和 domain transition spec/table。generic scheduler、generic queue、generic attempt ledger、generic workspace/source intake shell、generic artifact gallery、generic memory locator、generic observability 与通用 App/workbench runtime 都归 OPL 或未来产品壳，不在 RCA 内重建。

当前 formal-entry matrix：

- `default_formal_entry`：`CLI`
- `supported_protocol_layer`：`MCP`
- `internal_controller_surface`：`controller`

历史补充说明：

- `CLI` 与 `MCP` 在当前 owner docs 中仍是 repo-verified entry；本文只保留历史定位语境
- `controller` 在这份历史定位中不是 repo-verified independent public entry
- `gateway` 只作为历史包名或内部聚合层词汇读取；公开 action / tool 命名必须使用 product/domain action 体系
- 历史仓库主线按 `Auto-only` 理解；`Human-in-the-loop` 产品如果仍有当前价值，必须由 upper-layer product、OPL App 或 product shell owner docs 重新承接，并只读取 projection/receipt refs，不持有 visual truth、review/export verdict 或 artifact rewrite authority

约束说明：

- `Agent-first` 历史表达现在回到当前 executor/backend split：`Codex CLI` 是第一公民 concrete executor，`hermes_agent` 只是显式 proof / optional backend。
- explicit proof lane 可以使用 `hermes_agent`，但不改变默认 concrete executor 和 OPL production provider 口径。
- Domain contract 决定控制面，prompt 仅作为辅助信息。

## 4.1 被当前 owner docs supersede 的能力边界

- 以下条目只解释历史定位材料如何映射到当前 owner docs；不要把本节当成 active plan 或 runtime owner。
- `source intake` 已作为 `Source Readiness` 的正式 baseline surface 进入主线
- canonical quartet 固定为 `source-index.json`、`extracted-materials.json`、`source-audit.json`、`source-brief.json`
- `ppt_deck` / `xiaohongshu` 在同一 substrate 上通过 hydrated contract 消费 `shared_source_truth`，guarded `poster_onepager` 则共享同一 `source_truth_contract` 与 `source_truth_consumption` summary
- `Phase 2 activation package freeze` 已完成并作为已吸收的前置冻结件保留
- `docs/history/hermes/*` 相关 activation package 已转为历史本地迁移工件；它们不再代表“上游 `Hermes-Agent` 已接管 runtime”
- `review / export / gate / audit` hardening、`family source-truth consumption convergence`、`publication projection / delivery contract convergence`、`direct-delivery operator handoff hardening`、`direct-delivery lifecycle stage convergence`、`source-readiness deep research trigger + gate convergence`、`workspace / operator quickstart convergence` 与 `operator surface consistency hardening` 都已吸收为同一主线 provenance
- 历史 active tranche 曾按 `repo-verified product entry + OPL stage-led hosted integration + managed product-entry hardening` 理解；当前 product-entry、hosted integration、session continuity、mature end-user product shell 和 production evidence tail 的读法回到 active gap plan、product/runtime docs、contracts、source/tests、owner receipts 和 typed blockers。
- authoritative source gate 继续留在 `auditDeliverable / runtimeWatch`；`operator_handoff` 与 `lifecycle_stage_summary` 继续沿同一 canonical governance path 暴露，而更深层 source-plane 扩展仍属于同一主线上的持续增强
- 这里的 phase / baseline 标签只作为当前 program pointer，不等于 `RedCube AI` 的长期 north star

## 5. 历史产品壳与托管形态边界

本文只保留当时对面向人的 product shell、OPL App 面板或托管产品壳的边界判断。若这些主题仍要推进，必须由当前 App / OPL / RCA active owner 和 machine surfaces 重新开题。当时的前提是：

- 保持同一 RCA-owned domain entry、route truth、review/export gate 和 artifact authority
- 只读取 projection、artifact refs、review state、attention item 和 receipt refs
- framework-level 动作回到 OPL provider；domain-level 动作回到 RCA product entry / domain_action_adapter / direct skill

当时约束中不改变的内容：

- `RedCube AI` 仍是独立 visual-deliverable domain agent
- `RedCube AI` 仍不是 `OPL` 本体、generic framework 或 workbench runtime
- visual ready、exportable、handoffable 只能由 RCA-owned gate 给出

## 6. No-Resurrection Boundary

- 保持 `codex_cli` 默认主线与 `hermes_agent` 显式 proof lane 的双层执行结构
- 不把部署形态变化写成本体变化
- 不把 `OPL` 写成 `RedCube` 的替代定义
- 不把 prompt patch 当作 contract hydration 的替代
- 不把 `gateway`、`frontdoor`、`federation`、repo-local Hermes、local runtime 或旧 workbench 写成 active truth
- 不为退役模块、接口、CLI alias、测试入口或文档入口保留兼容面；迁移 active caller 后直接退役
- 不把本文作为 current support reference、runtime owner map、Product Entry backlog、OPL App backlog、implementation checklist、visual readiness proof 或 production readiness proof。
