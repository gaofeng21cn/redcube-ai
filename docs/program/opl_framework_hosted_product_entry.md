# OPL Framework Hosted Product Entry

状态锚点：`2026-04-12`

生命周期说明：本文由早期 `OPL Gateway` handoff brief 迁移而来，当前口径以 `OPL Framework` 的 Codex-first、stage-led 托管路径为准；它不是 RedCube 对外第一身份，也不授权 OPL 接管 visual-domain truth。

## 一句话结论

`OPL Runtime Manager` 作为 OPL 侧 thin product-managed adapter/projection layer，可以通过 repo-verified hosted integration surface，把 handoff 收到同一个 `RedCube Product Entry` 下游合同上。

## 这一步解决什么

它把上层 handoff 收口成：

`User -> OPL Product Entry -> OPL Runtime Manager -> configured family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

关键不变量是：

- OPL handoff 不再需要分叉成另一套 RedCube 私有入口协议
- direct `RedCube Product Entry` 与 `OPL Runtime Manager` hosted integration 共用同一 downstream `product entry`
- `invokeDomainEntry` 继续是 domain-level service-safe adapter
- `OPL Runtime Manager` 不持有 RedCube visual-domain truth、canonical artifacts、review-state truth、publication projection truth 或 concrete executor

## 合同与调用面

- contract：`contracts/runtime-program/opl-framework-hosted-product-entry.json`
- gateway action：`invokeOplHostedProductEntry`
- framework action ref：`opl_framework:hosted_product_entry`
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
