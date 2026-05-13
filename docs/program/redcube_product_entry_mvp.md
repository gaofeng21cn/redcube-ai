# RedCube Product Entry MVP

状态锚点：`2026-04-12`

生命周期说明：本文是 current baton brief，解释 RCA direct product-entry service surface。它仍被 runtime-program 当前合同引用，因此保留在 `docs/program/`；当前公开身份仍以 visual-deliverable domain agent、单一 `redcube-ai` app skill、CLI/MCP 和 `invokeProductEntry` 为准。

## 一句话结论

`RedCube AI` 现在补上的，不是聊天 UI，也不是新 runtime。
而是一个 repo-verified 的 direct `product entry` service surface：`invokeProductEntry`。

## 这一步解决什么

它把用户级 direct entry 收口成同一条可调用主线：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

并且保持下面几点不变：

- visual-domain boundary 仍在 `RedCube AI`
- 默认 concrete executor 仍是 `Codex CLI`
- 下游实际执行仍统一走 `invokeDomainEntry`

## 合同与调用面

- contract：`contracts/runtime-program/redcube-product-entry-mvp.json`
- action ref：`invoke_product_entry`
- API surface：`invokeProductEntry`
- CLI：`redcube product invoke`
- MCP：`invoke_product_entry`

## 最小行为

1. 接收 `workspace_locator.workspace_root` 与 `entry_session_contract.entry_session_id`
2. 允许 direct entry 创建或继续同一 deliverable
3. deliverable 缺失时，要求显式提供 `profile_id / title / goal`
4. 成功后返回 `product_entry` surface，而不是直接暴露 repo-local runtime 细节
5. 内部继续下沉到 `invokeDomainEntry`

## 明确不做

- 不把这一步写成成熟 end-user UI 已落地
- 不把 repo-local `Hermes` 包装成 runtime owner
- 不新开 family，不扩 academic poster，不先做聊天壳
