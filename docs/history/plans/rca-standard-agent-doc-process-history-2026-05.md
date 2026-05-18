# RCA standard agent 文档过程归档

Owner: `RedCube AI`
Purpose: `process_history`
State: `historical_provenance`
Machine boundary: 本文是人读过程归档。机器真相继续归 `contracts/`、源码、CLI/MCP 行为、product-entry manifest、runtime workspace、artifact locator、receipt、review/export gate 与真实交付物证据。

## 归档口径

本文件保存 2026-05 RCA standard OPL Agent 对齐过程中的 dated follow-through 摘要。当前定位、当前边界、当前功能/结构差距、测试/证据差距和完善顺序回到 `docs/active/rca-ideal-state-gap-plan.md`；north-star 目标态回到 `docs/references/rca-visual-deliverable-agent-ideal-state.md`。

## 2026-05 过程摘要

- RCA 将 scheduler / generic primitive 关系收成 OPL consumer projection：OPL 持有 family scheduler、daemon、generic lifecycle、typed queue、attempt ledger、generic runner、workbench shell、memory transport、artifact lifecycle、review/repair transport、generic transition runner、restart/dead-letter/repair/human gate 状态链和 native-helper generic envelope；RCA 只消费 projection 并保留 visual authority pack。
- RCA 增加 stability read-model consumer surface，将 conflict envelope、control-loop summary、usage/resource pressure、observability export 和 external stability policy 写成 refs-only projection；该 surface 不生成 RCA visual ready、quality verdict、exportable、artifact blob 或 memory body。
- RCA 增加 operator evidence readiness projection，用于聚合 no-regression / owner receipt proof、domain owner receipt contract、controlled memory runtime receipt refs、lifecycle guarded apply proof、controlled soak blocker、workspace receipt inventory 和 OPL generic primitive consumer coverage，向 OPL/App/operator 展示剩余证据缺口。
- RCA 增加 workspace receipt inventory projection，从 workspace runtime receipt root 读取 domain owner、accepted/rejected memory 和 cleanup/restore/retention lifecycle receipt refs；它只是 workspace-scoped refs-only read model，不写 receipt instance、memory body、artifact blob 或 review/export verdict。
- RCA 增加 visual transition evaluator 和 `evaluate_visual_transition` guarded action，只消费 RCA-owned `visual_transition_spec` 和显式 guard refs，返回 next-stage metadata、owner action、receipt refs 或 typed blocker；OPL 继续持有 generic transition runner、retry/dead-letter、route graph/workbench 和 provider attempt ledger。
- RCA 扩展 private functional audit，将 managed DAG scheduler、attempt/state-machine runner、managed-run JSON store、product-entry session store、workspace/source intake、memory/writeback receipt transport、artifact export lifecycle、review/repair transport、native helper envelope、operator projection shell、generic CLI/MCP wrappers、Codex executor adapter 和 observability/stability read model 分类为 OPL hosted surface、OPL generated surface、refs-only adapter、declarative pack 或 minimal authority function。该分类不是功能/结构完成。
- RCA 将 `attempt_state_machine_runner`、`managed_run_json_store`、`product_entry_session_store`、`artifact_export_lifecycle` 读作 OPL consumption 或 refs-only adapter，并明确只保留 visual transition refs、managed-run locator / visual summary refs、entry-session domain snapshot refs、artifact locator / export verdict / lifecycle receipt refs、canonical artifact authority、artifact mutation permission、typed blocker 与 owner receipt authority。
- RCA 将 generated descriptor scope 收成 `cli`、`mcp`、`skill`、`product_entry`、`product_status`、`product_session`、`sidecar`、`workbench`，并将 `functional_harness_cases` 作为 OPL generated test surface；repo-local wrappers 只作为 domain handler target、direct domain entry 或 refs-only adapter。
- RCA 从 default sidecar dispatch/action 面删除或收薄 `supervise_managed_run` 与 `product_entry_continuation`，把 generic supervision / continuation 归 OPL runner/session shell。
- RCA 增加 OPL substrate adapter export，只导出 opaque/index-only workspace/source/artifact/memory refs 与 lifecycle/operator projection refs；不导出 visual truth、layout/review/export verdict、deliverable artifact body、visual memory body 或 owner receipt authority。
- RCA 增加 OPL Agent Lab longline migration guard，用于确认 framework-level longline orchestration、hosted-attempt reconciliation projection 和 no-forbidden-write cross-domain regression 由 OPL Agent Lab 承接；RCA 保留 visual quality scorer、render/export owner receipt fixture 和 artifact authority checks。

## 归档后的当前口径

当前功能/结构差距计数保持 `functional_structure_gap_count=8`：OPL generated surface production consumption、repo-local wrapper active caller migration、focused hosted attempt 接通、artifact gallery/handoff、review/repair transport、App/operator drilldown、workspace/source/lifecycle shell、legacy physical cleanup。

当前测试/证据差距是：真实 artifact-producing receipt、memory body reuse、workspace receipt scaleout、Temporal long soak、cross-family repeated proof。
