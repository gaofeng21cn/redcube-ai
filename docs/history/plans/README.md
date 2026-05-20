# 历史计划

Owner: `RedCube AI`
Purpose: `historical_plan_index`
State: `history`
Machine boundary: 人读历史计划索引。机器真相继续归 contracts、source、CLI/MCP/API 行为、workspace artifacts、owner receipts 和当前 lifecycle owner docs。

本目录只保留用于追溯、但不再服务当前 active baton 的历史计划。计划中的文件路径、测试名、旧 public docs wording、federated route、source-pack-federation 或 capabilities 口径只按当时设计语境阅读；当前 source / delivery / runtime truth 回到核心五件套、`docs/source/`、`docs/delivery/`、`docs/runtime/`、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts。

## 当前文件

- `2026-04-08-deep-research-source-readiness-pack-phase-1.md`：历史 Deep Research / Source Readiness Pack Phase 1 计划。它已被后续 source readiness、source augmentation、deep research trigger/gate 与 workspace quickstart hardening 吸收，不再作为当前 implementation checklist。
- `2026-04-08-deep-research-auto-first-product-contract.md`：历史 Deep Research / 5 步 auto-first 产品语义 freeze。当前 source 执行合同回到 `docs/source/source_augmentation_executor_contract.md`。
- `2026-04-09-direct-delivery-longrun-target-state.md`：历史 direct-delivery longrun target freeze。当前 delivery truth 回到 `docs/delivery/`、核心五件套和 contracts。
- `2026-04-09-source-readiness-deep-research-longrun-target-state.md`：历史 source-plane longrun target freeze。当前 source truth 回到 `docs/source/`、核心五件套和 contracts。
- `creative-stage-ai-first-audit-2026-04-13.md`：历史 AI-first 创作阶段审计；其中 upstream Hermes owner wording 只保留为当时 proof/provenance，不再作为当前 executor owner、默认 route 或 active support reference。
- `rca-production-acceptance-readiness-closeout-2026-05-20.md`：production acceptance/readiness closeout provenance，记录 AI-first / executor-first 验收读法、expected merged refs-only evidence result 和 production scaleout remainder。

## 维护规则

- 无合同引用且不服务 current support 的旧计划进入本目录或 tombstone。
- 本目录不得成为新的 active plan 落点。
- 新增 source、delivery、runtime 或 product 计划前，先判断是否应进入 `docs/active/`、对应 owner doc、OPL 主仓，或继续作为 history/provenance。
