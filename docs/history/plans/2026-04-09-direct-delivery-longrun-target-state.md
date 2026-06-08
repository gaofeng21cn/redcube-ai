# Direct-Delivery Longrun Target State

Owner: `RedCube AI`
Purpose: `archived_direct_delivery_future_target_reference`
State: `history_provenance`
Machine boundary: 人读历史 target-state freeze。机器真相继续归 current contracts、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、delivery owner docs 和 RCA-owned review/export gates。

日期：`2026-04-09`

本文只保留 direct-delivery longrun target freeze 的 provenance，不再承担当前 delivery target、active plan 或 implementation checklist。当前 RCA 目标态读 `docs/references/rca-visual-deliverable-agent-ideal-state.md`，当前差距与顺序读 `docs/active/rca-ideal-state-gap-plan.md`，当前 delivery route / proof / export truth 读 `docs/delivery/`、runtime-program contracts、source/tests、review/export receipts 与 owner receipts。

## 历史目标

当时的 future-facing direct-delivery 目标是把 direct-delivery family 按这条线定义完整：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

其中：

- `Storyline + Plan` 映射到当时 policy 的 `Story Architecture`。
- `Visual` 映射到 `Visual Authorship`。
- `Delivery` 映射到 `Delivery Packaging`。
- `operator_handoff / closeout` 属于 `Delivery`，不是第六步。

Scope 当时限定为 `ppt_deck` 与 guarded `poster_onepager`；`xiaohongshu` 仍是 explicit human publication 对照面。`controller expansion`、new family / overlay expansion、managed web runtime migration、OPL-hosted integration、hidden fallback chain 与 prompt-patch-as-contract 都不在本文授权范围内。

## 压缩后的 Stage Map

| Stage | Historical output shape | Current read |
| --- | --- | --- |
| Source Readiness | topic-level canonical source truth 与 `planning_ready` gate | 从 `docs/source/`、source contracts、workspace artifacts 和 runtime-family source/tests 验证。 |
| Storyline | deliverable-level storyline / narrative arc / audience promise | 从当前 route artifacts、source/tests 和 visual-pack contracts 验证。 |
| Plan | family-specific outline / slide or poster blueprint | 从 runtime-family artifacts 和 delivery contracts 验证。 |
| Visual | visual direction、render material、review-state evidence | 从 RCA-owned visual authority、artifact manifests 和 review receipts 验证。 |
| Delivery | export artifact、handoff、closeout-ready delivery governance | 从 `docs/delivery/`、export receipts、artifact locator contracts 和 owner receipts 验证。 |

## 历史 Closeout 边界

历史 ideal closeout 要求 source truth、storyline、plan、visual 和 delivery 都有 durable evidence，并且 review/export gates 对齐，operator handoff 通过同一 governance path 暴露。它明确禁止把 export artifact 存在直接读成 closeout success。

这条规则只作为 provenance 保留；当前 closeout/readiness claim 仍需要当前 review/export receipts、artifact authority、owner receipts 和 active production acceptance surfaces。

## 已退役的 active-looking surface

- Detailed per-stage input/output/durable-surface lists were compressed because they read like a current implementation spec.
- `managed web runtime migration`, `controller expansion`, `OPL-hosted integration`, academic poster activation and hidden fallback language remain historical exclusions, not open current gaps.
- `auditDeliverable`, `runtimeWatch`, `getReviewState` and `getPublicationProjection` references must be verified from current source/contracts before being used as active interfaces.

## No-Resurrection 规则

Do not use this file to reopen old delivery workflows, route aliases, controller/product shell work, hidden fallback chains, prompt-patch implementation, academic poster expansion or current readiness claims. Current delivery work must start from `docs/delivery/`, contracts, source/tests, runtime artifacts, review/export receipts and the active gap plan.
