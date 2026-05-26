# Tombstones

Owner: `RedCube AI`
Purpose: `retired_wording_index`
State: `history`
Machine boundary: 人读 tombstone 索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和当前 owner docs。

本目录保留已退役词汇与路线叙事的可检索 tombstone，并把读者指回当前公开身份。

当旧 RedCube 文档或计划在历史路线叙事中使用 gateway-first、frontdoor、federation-first、harness-first、OPL-first、OPL bridge 或 Hermes-first 等词汇时，使用 tombstone 记录其退役读法。

每份 tombstone 应写清：

- 已退役词汇
- 当前 owner surface
- 是否仍有 `human_doc:*` 合同链接指向 active/history 读者上下文
- 当前 truth 的读者入口

当前 truth：

- RedCube AI 的第一身份是 visual-deliverable domain agent。
- OPL 是 stage-led runtime framework，以 Agent executor 为最小执行单位，并提供 hosted integration path。
- 未显式选择 hosted/proof backend 时，Codex CLI 是默认最小具体执行单元。
- 仍被合同引用的旧 brief 语义通过 `human_doc:*` 保持可达；current baton brief 位于 `docs/active/`，历史 proof/provenance 位于 `docs/history/`。

当前 tombstone：

- `retired-route-narratives-2026-05-11.md`：gateway-first、frontdoor-first、federation-first、harness-first、OPL-first、OPL bridge、Hermes-first 与 open-ended Phase 2 public-direction wording。
- `retired-managed-product-entry-contract-2026-05-20.md`：legacy managed product-entry contract naming；active contract 是 product-entry session continuity。

No-resurrection boundary:

- tombstone 只保留可检索性和迁移解释，不允许旧词恢复为 active caller、public action key、default runtime owner、generated/default caller、domain_action_adapter template、compatibility alias、facade、wrapper 或 compatibility-only test。
- `gateway` / `harness` 在当前代码或文档里只能是内部边界层、包名、历史执行层或 tombstone 词；公开身份与用户入口使用 RedCube AI visual-deliverable domain agent / product-domain action 体系。
- `managed` 在当前 RCA 中只允许作为 session-continuity provenance、semantic id、tombstone、refs-only adapter 或历史 owner-boundary wording；不得恢复为 repo-local generic runtime shell。
- `Hermes` / `Hermes-Agent` 只允许作为上游外部 runtime 项目、显式 hosted/proof backend、非默认 executor adapter、diagnostic 或历史 proof lane；不得写成默认 runtime owner 或 OPL production substrate。
