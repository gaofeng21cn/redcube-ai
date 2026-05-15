# Managed Product Entry Hardening

状态锚点：`2026-04-12`

生命周期说明：本文是 contract-linked support / absorbed hardening brief，唯一任务是解释 product-entry session continuity 与用户级 runtime-state 行为。它由旧 `docs/program/` active baton 层迁入 `docs/active/`；runtime-program 当前合同继续通过 `human_doc:program_managed_product_entry_hardening` 指向本文语义。它不定义新的公开 GUI、WebUI、generic managed runtime 或第二产品入口；后续生产证据缺口统一维护在 [RCA 理想目标态差距与完善计划](./rca-ideal-state-gap-plan.md)。

## 一句话结论

`product entry` 现在不再是一次性请求壳；它已经具备用户级 runtime-state session continuity。

这里的 `managed` 只指 product-entry session continuity 和 same-session read surface，不表示 RCA 仓承担 generic framework/runtime。OPL 负责通用 stage attempt、queue、wakeup、retry/dead-letter 和 operator projection；RCA 只返回 workspace/runtime refs、domain receipt、typed blocker、review/export refs 和 artifact locators。

## 这一步解决什么

direct / OPL-hosted 两条入口现在共享一个用户级 session store：

`$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/`

因此同一个 `entry_session_id` 可以稳定回到同一个 deliverable，并读回：

- latest managed progress
- runtime supervision
- review state
- publication projection

## 合同与调用面

- contract：`contracts/runtime-program/managed-product-entry-hardening.json`
- action ref：`get_product_entry_session`
- API surface：`getProductEntrySession`
- CLI：`redcube product session`
- MCP：`get_product_entry_session`

## 最小行为

1. `invokeProductEntry` 与 `invokeOplHostedProductEntry` 都写入同一个 session store
2. `entry_session_id` 绑定同一 deliverable identity
3. continuation surface 必须显式返回 latest handles，而不是靠 prompt 记忆
4. 用户级 runtime-state 继续只落在 `$CODEX_HOME/projects/redcube-ai/runtime-state/`

## 明确不做

- 不伪造跨 deliverable 的 session continuity
- 不把 session store 写回 repo-tracked 目录
- 不用模糊 fallback 掩盖 session drift
- 不把 session continuity 写成旧 workbench、repo-local Hermes runtime 或 managed web runtime 已落地
- 不为退役 session / gateway / frontdoor alias 保留兼容入口
