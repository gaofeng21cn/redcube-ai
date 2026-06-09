# 历史计划

Owner: `RedCube AI`
Purpose: `historical_plan_index`
State: `history`
Machine boundary: 人读历史计划索引。机器真相继续归 contracts、source、CLI/MCP/API 行为、workspace artifacts、owner receipts 和当前 lifecycle owner docs。

本目录只保留用于追溯、但不再服务当前 active baton 的历史计划。计划中的文件路径、测试名、旧 public docs wording、federated route、source-pack-federation 或 capabilities 口径只按当时设计语境阅读；当前 source / delivery / runtime truth 回到核心五件套、`docs/source/`、`docs/delivery/`、`docs/runtime/`、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts。

2026-06-08 已完成本目录正文压缩：所有非索引计划文件都只保留 historical intent、current SSOT pointer、retired active-looking surfaces 和 no-resurrection boundary。原来的长 checklists、代码片段、测试命令、branch/commit/push 状态、public-doc wording tests、future implementation steps 和 Agent handoff prompts 不再作为当前工作入口。

## 当前计划组读法

本目录按历史计划主题组读取，不再维护逐文件 active-read table。子文件保留原计划正文、旧测试命令、历史 closeout、当时的 owner 假设和迁移 provenance；当前 source、delivery、runtime、production evidence、standard-agent completion 和 docs lifecycle truth 回到上方 owner docs、active gap plan、contracts、source/tests 与 runtime evidence。

| 历史主题 | Provenance refs | 当前读法 |
| --- | --- | --- |
| Deep Research / Source Readiness plan lineage | `2026-04-08-deep-research-source-readiness-pack-phase-1.md`、`2026-04-08-deep-research-auto-first-product-contract.md`、`2026-04-09-source-readiness-deep-research-longrun-target-state.md` | 只保留 source readiness、source augmentation、Deep Research trigger/gate 与 auto-first 产品语义的历史设计来源；当前 source truth 回到 `docs/source/`、workspace canonical artifacts、runtime-family contracts 和 runtime-program contracts。旧 public-doc wording tests、gateway result、Storyline / Plan owner 假设不作为当前 checklist。 |
| Direct delivery / delivery longrun target freeze | `2026-04-09-direct-delivery-longrun-target-state.md` | 只保留 direct-delivery future freeze 与边界排除项；当前 delivery truth 回到 `docs/delivery/`、核心五件套、runtime-program contracts、artifact locator、review/export gates 和 active gap plan。历史 managed web runtime、controller expansion 或 new family 排除项不能反向读成当前 gap 已打开。 |
| Docs lifecycle governance audit | `2026-05-20-doc-lifecycle-governance-audit.md` | 只保留 2026-05-20 文档归位依据；当前 docs coverage、remaining gap、one-document-one-role 与 direct-retirement posture 以 `docs/docs_portfolio_consolidation.md`、`docs/README.md`、active gap plan、process history 和 OPL family ledger 为准。 |
| Creative-stage AI-first / Hermes owner audit | `creative-stage-ai-first-audit-2026-04-13.md` | 只保留 AI-first 创作阶段审计和 upstream Hermes owner wording 的历史 provenance；当前 executor owner、default route、runtime owner、stage pack discipline 和 AI-first gate 回到 `agent/`、核心五件套、active gap plan、contracts 和 current route tests。 |
| Production acceptance / standard OPL Agent closeout | `rca-production-acceptance-readiness-closeout-2026-05-20.md`、`rca-standard-agent-doc-process-history-2026-05.md` | 只解释 2026-05 production acceptance/readiness、source-shape、generated surface、refs-only adapter 与 standard-agent 收敛过程；当前功能/结构差距、生产证据差距、generated/default caller thinning 和 compatibility-free retirement 回到 active gap plan、production acceptance contracts、private inventory、source/tests 和 live read-model。 |

如果子文件里仍有 implementation checklist、TDD snippet、branch/push closeout、test transcript、future prompt 或 "next" board，全部按原计划时点和 provenance 读取；当前可执行 baton 只从 `docs/active/rca-ideal-state-gap-plan.md` 及其 live-truth inputs 派生。

## 退役词与 no-resurrection 规则

- 本目录正文中的 `当前状态`、`下一步`、`Backlog`、`planned`、`done`、`deferred` 等标题只按文件日期和原 tranche 语境读取。
- 本目录不得保存可直接复制的旧实现清单、TDD 代码片段、commit 指令、branch closeout、push 状态、测试命令流水或 Agent handoff prompt。
- `gateway`、`frontdoor`、`federation`、`source-pack-federation`、`capabilities`、`managed web runtime`、`upstream Hermes`、`Hermes owner`、`managed` 和 `domain_action_adapter` 等词只保留为 historical wording、semantic id、proof lane、tombstone 或 refs-only adapter 语境。
- 当前 RCA 默认 runtime owner、visual truth、review/export verdict、artifact authority、memory accept/reject authority、domain ready 和 production ready 不从本目录正文推导。
- 如果某条历史规则仍需要长期生效，先抽取到核心五件套、`docs/source/`、`docs/delivery/`、`docs/runtime/`、`docs/policies/`、active gap plan、machine-readable contract 或 source/test surface；不要继续在本目录追加新的当前状态。

## 维护规则

- 无合同引用且不服务 current support 的旧计划进入本目录或 tombstone。
- 本目录不得成为新的 active plan 落点。
- 新增 source、delivery、runtime 或 product 计划前，先判断是否应进入 `docs/active/`、对应 owner doc、OPL 主仓，或继续作为 history/provenance。
