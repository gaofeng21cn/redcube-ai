# Historical Deep Research Source Readiness Pack Phase 1 Plan

Owner: `RedCube AI`
Purpose: `historical_source_readiness_plan_provenance`
State: `historical_provenance`
Machine boundary: 人读历史计划摘要。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、workspace artifacts、owner receipts 和当前 source owner docs。

日期：`2026-04-08`

本文只保留当时 `Source Readiness Pack` 第一阶段计划的 provenance。当前 source readiness / augmentation 执行合同读 `docs/source/source_augmentation_executor_contract.md`、workspace canonical artifacts、runtime-family contracts、runtime-program contracts、source tests 与 owner receipts；当前 RCA gap / baton 读 `docs/active/rca-ideal-state-gap-plan.md`。本文不再是 implementation checklist、Agent prompt、public-doc wording test source 或可运行任务清单。

## 历史意图

当时计划要把第 1 步 `Source Readiness` 升格为正式可消费能力面：

- 在 topic canonical path 下产出 `source-readiness-pack.json`。
- 让 shared source truth 读取 readiness pack。
- 把 `xiaohongshu research` 收紧成 fact-library / readiness artifact。
- 把 audience、why-now、tension、memory hook 等 judgement 移回 `storyline`。
- 把 public quickstart / README 口径改成 `Deep Research` 属于 `Source Readiness` 强化模式。

## 当前 SSOT 指针

| Theme | Current owner |
| --- | --- |
| Source readiness / augmentation contract | `docs/source/source_augmentation_executor_contract.md`, workspace canonical artifacts, runtime-family source/contracts/tests |
| RCA active gap and execution order | `docs/active/rca-ideal-state-gap-plan.md` |
| Public README narrative | root `README.md`, `README.zh-CN.md`, `docs/public/README.md` |
| Delivery / review / export truth | `docs/delivery/`, runtime-family code, Stage Folder contracts, review/export receipts |
| Historical plan provenance | 本文和 `docs/history/plans/README.md` |

## 压缩后的历史计划

| Historical task | What it meant in 2026-04-08 terms | Current read |
| --- | --- | --- |
| Canonical Source Readiness Pack | 在 canonical source quartet 旁增加派生 readiness artifact。 | 当前 readiness artifacts 与路径必须从 source contracts 和 runtime-family code 验证，不能引用旧 snippet。 |
| Xiaohongshu research boundary | 保持 research 作为 source/readiness 输出，不承担 storyline judgement。 | 当前 family route 行为归当前 source/tests 与 route contracts。 |
| Storyline judgement boundary | 把 audience / why-now / tension / hook 移到 storyline。 | 这是有价值的历史边界，但只有当前 tests/source 证明时才是当前事实。 |
| Public docs wording | 将 `Deep Research` 解释为 `Source Readiness` enhancement。 | Narrative docs 是人读面；测试不得固定 README prose。 |
| Execution handoff | 建议 inline/subagent 执行和 commit 顺序。 | 已退役为 runnable guidance。当前工作必须 fresh-read branch/worktree、live files 和 repo-native verification。 |

## 已退役的 active-looking surface

- `docs/human_quickstart.md`、`prompts/xiaohongshu/research.md`、`prompts/xiaohongshu/storyline.md` 和本文中的 package paths 只保留为 historical references。
- `tests/public-docs-surface.test.ts` 和 prose-wording assertions 是已退役的历史 wording-test references。当前 tests 应绑定 machine-readable contracts、schemas、CLI/API behavior、generated artifacts 和 guard semantics，不绑定 README phrasing。
- 旧 code snippets、failing-test recipe、commit commands 和 E2E task sequence 已从历史正文删除；没有 fresh live-source intake 时不得复制进新的 Agent prompt。
- `gateway result`、`federated route`、`source-pack-federation` 和 old public-doc surface language 只保留为 provenance。

## No-Resurrection 规则

Do not use this file to restore old prompt patches, compatibility fields, wording tests, family route rewrites, commit plans, static checklist gates or public docs assertions. If a source-readiness rule still matters, express it through the current source contract, runtime-family source, tests, active gap plan, docs/source owner docs or machine-readable contracts.
