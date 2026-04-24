# OPL Gateway Internal Product Entry Bridge

状态锚点：`2026-04-12`

## 一句话结论

`OPL Gateway` 现在可以通过一个 repo-verified internal bridge surface，把 handoff 收到同一个 `RedCube Product Entry` 下游合同上。

## 这一步解决什么

它把上层 handoff 收口成：

`User -> OPL Product Entry -> OPL Gateway -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

关键不变量是：

- OPL handoff 不再需要分叉成另一套 RedCube 私有入口协议
- direct `RedCube Product Entry` 与 `OPL Gateway` internal bridge 共用同一 downstream `product entry`
- `invokeDomainEntry` 继续是 domain-level service-safe adapter

## 合同与调用面

- contract：`contracts/runtime-program/opl-gateway-federated-product-entry.json`
- gateway action：`invokeFederatedProductEntry`
- CLI：`redcube product federate`
- MCP：`invoke_federated_product_entry`

## 最小 handoff envelope

- `target_domain_id`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

补充 payload 继续留在 `delivery_request` 与 `entry_session_contract`。

## 明确不做

- 不把 `OPL` 写成 RedCube 内部控制面
- 不让 federation 反向改写 visual-domain truth
- 不因为 handoff landed 就过度宣称 end-user product shell 已成熟
