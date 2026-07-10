# RedCube Product Entry MVP

Owner: `RedCube AI`
Purpose: `direct_product_entry_support`
State: `contract_linked_support`
Machine boundary: 人读 product-entry support。机器真相继续归 `contracts/runtime-program/redcube-product-entry-mvp.json`、product-entry manifest、CLI/MCP/API behavior、source、runtime artifacts 和 owner receipts。

状态锚点：`2026-04-12`
当前治理复核：`2026-05-26`

生命周期说明：本文是 contract-linked support brief，唯一任务是解释 RCA direct product-entry service surface 的已落地合同和调用面。它由旧 `docs/program/` active baton 层迁入 reference support；runtime-program 当前合同继续通过 `human_doc:program_redcube_product_entry_mvp` 指向本文语义。后续完善顺序、OPL 上收边界和生产证据缺口统一维护在 [RCA 理想目标态差距与完善计划](../../active/rca-ideal-state-gap-plan.md)。当前公开身份仍以 visual-deliverable domain agent、单一 `redcube-ai` app skill、CLI/MCP 和 `invokeProductEntry` 为准。

## 一句话结论

`RedCube AI` 当前保留的是 repo-verified 的 direct `product entry` service surface：`invokeProductEntry`。

这不是聊天 UI、旧 workbench、retired public entry、federation、repo-local Hermes proof、新的 generic runtime，或 RCA-owned generated wrapper shell。本文不再承接新的 active plan；新增 action 必须进入 `family_action_catalog`、CLI/MCP/product manifest 同源命名体系，并继续回到 RCA-owned domain entry。

当前 CLI 读法是：repo-local `redcube product` 只保留 `invoke` direct domain target；`status` / `session` / `manifest` / `domain_action_adapter` 这类 generated/default product wrapper 归 OPL generated/hosted shell。RCA 本仓保留 `invokeProductEntry` 作为 direct service surface、保留 `domain-handler export|dispatch` 作为 OPL-generated descriptor 的 RCA target，不把 repo-local product wrapper 写成长期 owner。

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
- RCA domain handler target：`redcube domain-handler export|dispatch`
- OPL generated/default wrapper target：product status / session / manifest / workbench / `domain_action_adapter` descriptor and shell

## 最小行为

1. 接收 `workspace_locator.workspace_root` 与 `entry_session_contract.entry_session_id`
2. direct entry 可创建 deliverable；继续同一 deliverable 时必须由 OPL session envelope 重新提供 identity 与 currentness refs
3. deliverable 缺失时，要求显式提供 `profile_id / title / goal`
4. 成功后返回 `product_entry` 与 `session_handoff_refs`，不写 RCA-local session store
5. 内部继续下沉到 `invokeDomainEntry`

## 明确不做

- 不把这一步写成成熟 end-user UI 已落地
- 不把 repo-local product status/session/manifest/domain_action_adapter wrapper 写成 RCA 长期 owner
- 不把 repo-local `Hermes` 包装成 runtime owner
- 不新开 family，不扩 academic poster，不先做聊天壳
- 不恢复 retired public entry、`federation`、`product frontdesk`、`GatewayActionMap` 或 gateway-tool 兼容别名
- 不把退役接口改写成 compatibility layer；无 active caller 后直接删除或归入 history / tombstone
