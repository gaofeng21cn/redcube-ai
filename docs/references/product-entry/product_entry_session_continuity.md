# Product Entry Session Continuity

Owner: `RedCube AI`
Purpose: `product_entry_session_continuity_support`
State: `contract_linked_support`
Machine boundary: 人读 product-entry support。机器真相继续归 `contracts/runtime-program/product-entry-session-continuity.json`、product-entry manifest、CLI/MCP/API behavior、source、runtime artifacts 和 owner receipts。

状态锚点：`2026-04-12`

生命周期说明：本文解释 product-entry session continuity 与用户级 runtime-state 行为。旧 `managed_product_entry_hardening` 语义 ID 和 `managed-product-entry-hardening.json` 文件只作为 tombstone/provenance 保留，不作为 callable contract、alias、facade 或 compatibility wrapper。

## 一句话结论

`product entry` 具备用户级 runtime-state session continuity；该能力不表示 RCA 仓承担 generic framework/runtime。

## 这一步解决什么

direct / OPL-hosted 两条入口共享一个用户级 session-continuity root：

`$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/`

同一个 `entry_session_id` 可以稳定回到同一个 deliverable，并读回：

- latest OPL stage-plan / route-run checkpoint
- runtime projection
- review state
- publication projection

## 合同与调用面

- contract：`contracts/runtime-program/product-entry-session-continuity.json`
- action ref：`get_product_entry_session`
- API surface：`getProductEntrySession`
- CLI：`redcube product session`
- MCP：`get_product_entry_session`

## 最小行为

1. `invokeProductEntry` 与 `invokeOplHostedProductEntry` 都写入同一个 session-continuity root
2. `entry_session_id` 绑定同一 deliverable identity
3. continuation surface 必须显式返回 latest handles
4. 用户级 runtime-state 继续只落在 `$CODEX_HOME/projects/redcube-ai/runtime-state/`

## 明确不做

- 不伪造跨 deliverable 的 session continuity
- 不把 session continuity state 写回 repo-tracked 目录
- 不用 fallback 掩盖 session drift
- 不把 session continuity 写成旧 workbench、repo-local Hermes runtime 或 managed web runtime 已落地
- 不为退役 session / gateway / frontdoor alias 保留兼容入口
