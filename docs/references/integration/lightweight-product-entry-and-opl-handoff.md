# RedCube AI 轻量产品入口与 OPL 内部 Handoff

Owner: `RedCube AI`
Purpose: `direct_and_opl_hosted_handoff_support`
State: `active_support`
Machine boundary: 人读 integration support。机器真相继续归 runtime-program contracts、product-entry manifest、CLI/MCP/API behavior、source、runtime artifacts 和 owner receipts。

生命周期说明：本文是 supporting reference，用来解释 direct RedCube entry 与 OPL 托管集成路径如何共用同一 downstream domain entry。它不把 OPL / bridge / handoff 写成 RedCube 的对外第一身份；公开入口仍以 `redcube-ai` 应用技能和视觉交付领域智能体身份为准。

## 1. 当前真相

`RedCube AI` 现在已经有可验证的 `operator entry`、`agent entry`，以及一层薄的 `product entry` service surface：

- `operator entry`
  - 面向人类操作同事的命令、调试、审阅和导出控制面
- `agent entry`
  - 面向 `Codex` / Claude Code / OpenClaw 等 host-agent 的 `CLI` / `MCP`
- `product entry`
  - 面向 direct RedCube entry 与 OPL 托管集成路径的 repo-verified service surface

但它仍然没有成熟的最终用户前台壳。
也就是说，当前已经不是“完全没有 product entry”，而是“已经有可调用服务面，但还不是稳定的 end-user product shell”。

## 2. 目标形态

这个仓已经冻结的 direct domain 级产品链路是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

在 `OPL` 家族级入口下，也必须兼容同一条下游形态，但这条路径在这里仅作为 hosted integration / reference surface：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

这也是当前“最终目标形态”冻结件要表达的主线；较早的 Hermes-first program 文档只保留 provenance，当前按 provider-backed / Temporal-target 口径读取。

这意味着：

- `OPL` 只保留 family-level session/runtime/projection 编排与 shared modules/contracts/indexes
- OPL hosted integration 是 thin product-managed adapter/projection layer，不持有 RedCube visual-domain truth 或 concrete executor
- `RedCube AI` 是独立 visual domain agent，提供自己的 lightweight direct entry
- 两者都存在，但作用域不同

## 3. 为什么需要两层入口

如果只有 `OPL` 有入口，而 `RedCube AI` 没有自己的轻量入口：

- 视觉 domain 会更像内部能力层，而不是独立产品
- 顶层会被迫吸收太多视觉交互语义
- 单仓测试、单仓交付、单仓演进都会变重

如果只有 `RedCube AI` 自己长入口，而 `OPL` 不先冻结 handoff 语言：

- 顶层与单仓的入口语义会漂移
- 家族级切 domain 的体验会断裂

所以这里要同时冻结并落地：

- `RedCube Product Entry`
- `OPL -> RedCube` internal handoff envelope

## 4. 共享 handoff envelope

`OPL -> RedCube` 至少共享下面这组最小字段：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层公共 envelope 之上，`RedCube AI` 继续补：

- `entry_session_contract`
- `delivery_request`
- 以及其中的 domain payload

最小 domain payload 至少包括：

- `deliverable_family`
- `topic_id`
- `deliverable_id`

## 5. 当前不应过度宣称的事

- 当前可以把 repo-verified `RedCube Product Entry` service surface 与 `OPL -> RedCube` hosted integration 写成已落地
- 但不能把它们写成成熟的最终用户前台壳或真实线上托管产品入口
- 当前 OPL-hosted route / stage-run 口径已切到 provider-backed / Temporal-target family runtime；`Hermes-Agent` 只作为显式 opt-in executor adapter、hosted/proof backend 或 provenance reference 保留
- 默认 concrete executor 仍是 `Codex CLI`，通过 executor adapter 在 domain 内执行
- 所以这份文档现在冻结的是目标边界、调用合同与 repo-verified service surface，不是过度宣称“前台产品已经做完”

## 6. 支撑边界

本文只解释 direct entry 与 OPL internal handoff 如何共用同一 downstream service-safe domain entry。后续 gap、证据门和完善顺序统一回到 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)；本文不新增 active checklist。

当前必须继续保持的读法是：repo-verified product-entry service surface 已落地，但成熟的最终用户产品入口前台壳仍未落地。
