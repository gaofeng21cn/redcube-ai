# OPL Framework Hosted Product Entry

Owner: `RedCube AI`
Purpose: `opl_hosted_product_entry_support`
State: `contract_linked_support`
Machine boundary: 人读 product-entry support。机器真相继续归 `contracts/runtime-program/opl-framework-hosted-product-entry.json`、product-entry manifest、CLI/MCP/API behavior、source、runtime artifacts 和 owner receipts。

状态锚点：`2026-04-12`

生命周期说明：本文是 contract-linked support brief，由早期 `OPL Gateway` handoff brief 迁移而来。唯一任务是解释 OPL Framework 托管路径如何进入同一 RCA service-safe domain entry。它由旧 `docs/program/` active baton 层迁入 reference support，不再承担新的 active plan。当前口径以 `OPL Framework` 的 stage-led、以 Agent executor 为最小执行单位的通用运行框架为准；它不是 RedCube 对外第一身份，也不授权 OPL 接管 visual-domain truth、review/export verdict、canonical artifact 或 domain memory body。

## 一句话结论

OPL stage-led hosted integration 作为 OPL Framework 侧的通用 runtime / queue / wakeup / projection 路径，可以通过 RCA thin sidecar / product-entry surface，把 handoff 收到同一个 `RedCube Product Entry` 下游合同上。

RCA 在这里暴露的是 domain package 薄程序面：descriptor、sidecar、projection、receipt refs、typed blocker 和 domain entry。它不维护第二套 generic scheduler、generic queue、generic runtime manager 或 workbench runtime。

## 这一步解决什么

它把上层 handoff 收口成：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

关键不变量是：

- OPL handoff 不再需要分叉成另一套 RedCube 私有入口协议
- direct `RedCube Product Entry` 与 OPL hosted integration 共用同一 downstream `product entry`
- `invokeDomainEntry` 继续是 domain-level service-safe adapter
- OPL hosted integration 不持有 RedCube visual-domain truth、canonical artifacts、review-state truth、publication projection truth 或 concrete executor

## 合同与调用面

- contract：`contracts/runtime-program/opl-framework-hosted-product-entry.json`
- action ref：`opl_framework:hosted_product_entry`
- API surface：`invokeOplHostedProductEntry`
- sidecar dispatch：`redcube product sidecar dispatch`

## 最小 handoff envelope

- `target_domain_id`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

补充 payload 继续留在 `delivery_request` 与 `entry_session_contract`。

## 明确不做

- 不把 `OPL` 写成 RedCube 内部控制面
- 不让 hosted handoff 反向改写 visual-domain truth
- 不因为 handoff landed 就过度宣称 end-user product shell 已成熟
- 不把 repo-local Hermes wrapper 或旧 Gateway 命名写成 external `Hermes-Agent` substrate proof
- 不恢复 `OPL Gateway`、frontdoor、federation、source-pack-federation 或 product frontdesk 作为 active API / source surface
- 不为退役 handoff alias 保留兼容面；旧命名只允许保存在 provenance、tombstone 或合同引用上下文
