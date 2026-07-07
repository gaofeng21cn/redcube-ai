# Historical Stable Deliverable Manual Test Brief

Owner: `RedCube AI`
Purpose: `historical_stable_deliverable_manual_test_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 manual-test brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、workspace artifacts、owner receipts、RCA review/export gates 和当前 owner docs。

日期锚点：`2026-04-07`

## Lifecycle

本文只保存 `stable deliverable manual-test-driven hardening` 的历史手测 provenance。它不再是当前 manual QA checklist、CLI recipe、route execution guide、delivery readiness gate、hardening backlog schema owner 或下一轮 Agent prompt。

当前读法回到这些 owner：

| Theme | Current owner |
| --- | --- |
| RCA 当前完成口径、open gaps、下一轮 baton | `docs/active/rca-ideal-state-gap-plan.md` |
| 当前默认入口与运行链路 | `docs/status.md`, `docs/architecture.md`, `contracts/runtime-program/current-program.index.json`, `contracts/runtime-program/current-program-parts/**` |
| 当前 delivery / route / proof 支撑 | `docs/delivery/README.md`, `docs/delivery/image-first-ppt-production-route.md`, route contracts, runtime-family source/tests |
| 当前 production evidence tail | `contracts/production_acceptance/rca-production-acceptance.json`, runtime evidence, owner receipts, typed blockers |
| 历史 machine provenance | `contracts/runtime-program/stable-deliverable-manual-test-driven-hardening.json`, `contracts/runtime-program/stable-deliverable-hardening-backlog.json` |

## Historical Fact

本 brief 冻结时的 baton id 是 `stable_deliverable_manual_test_driven_hardening`。当时的 scope 只覆盖 `ppt_deck` 和 `xiaohongshu` 两个 stable deliverable family；它记录了首轮正式手测结论、手测关注面、发现写回约束，以及不扩到 Phase 2 source intake、controller、新 family、poster academic contract 或 OPL-hosted runtime integration 的边界。

当时记录的历史结果是：

- `ppt_deck` 手测通过。
- `xiaohongshu` 手测通过。
- hardening backlog 读为 `manual_test_completed_no_findings`。
- baton closeout 后被后续 Phase 2 source-intake activation / baseline 记录消费。

这些事实只说明当时的 stable-deliverable hardening 已 close out。它们不能升级为今天的 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete、当前 route quality verdict 或当前 operator 手测通过证明。

## Historical Content Compression

旧正文包含两套完整手工测试输入、历史 CLI 序列、阶段顺序、预期产物、失败采样方式、验收判断和 backlog 字段清单。那些内容已经压缩为历史 provenance，不在本文继续保留为可执行 runbook：

- `ppt_deck` 当前默认路线是 image-first；HTML 和 native editable PPTX 是显式可选路线。当前路线、proof、review/export 与 artifact authority 回到 delivery owner docs、route contracts、runtime-family source/tests、workspace artifacts 和 review/export receipts。
- `xiaohongshu` 当前 route truth、publish/export gate、artifact authority 和 source boundary 回到 runtime-family source/tests、contracts、workspace artifacts 和 RCA-owned review/export gates。
- 手测发现写回不再由本文维护 schema。历史 backlog contract 只保留当时 hardening 记录；当前 evidence / typed blocker / owner receipt 写回以 production acceptance、runtime evidence、owner receipts 和 active gap plan 为准。

## No-Resurrection Rule

不要把本文中的历史手测材料恢复成：

- 当前 CLI 操作指南或 route execution checklist。
- 当前 delivery / source / production evidence gate。
- 当前 backlog schema、test command list、manual QA rubric 或 Agent prompt。
- 证明 visual ready、exportable、handoffable、domain ready、production ready 或 long-soak complete 的证据。
- 允许绕过 current route contracts、Stage Folder artifacts、RCA review/export gates、owner receipts 或 typed blockers 的兼容面。

如果需要重新打开 stable deliverable 手测，应在当前 delivery owner docs、contracts/source/tests、workspace runtime evidence、owner receipt 或 typed blocker surface 中建立新的 owner-delta，并把本文只作为历史 reader context 读取。
