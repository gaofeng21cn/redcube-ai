# Delivery 文档

Owner: `RedCube AI`
Purpose: `delivery_docs_index`
State: `active_support`
Machine boundary: 人读 delivery 索引。机器真相继续归 declarative pack、OPL-hosted StageRun artifacts、contract JSON、native-helper receipts、review/export receipts 和 canonical artifacts。

`docs/delivery/` 保存人读 deliverable lifecycle 材料：family examples、route descriptions、proof environments 和 export expectations。历史 manual validation briefs、route evolution probes、dated sample roots、probe commands 和 run/proof transcripts 进入 `../history/**`。

本层说明 visual deliverables 如何成形与检查。可执行 delivery contract 继续归 declarative pack、OPL-hosted StageRun、contract JSON 和 generated artifact manifests。

Delivery support docs 和示例只提供 route / proof / export 读法。最终 visual ready、exportable、handoffable、artifact authority 与 review/export verdict 仍必须来自 RCA-owned review/export gates、workspace artifacts、artifact manifests、review/export receipts 和 owner receipts。

交付前的可执行读法必须同时具备 material / brand status、brand precedence refs、source/material pass refs、density/sparse-page evidence、route/template contract、rendered evidence、review/export refs 和 owner refs。Markdown/Marp 只在显式请求时作为 refs-only route material，package distribution 只检查 source-to-package consistency。机械 QA、schema check、render probe、screenshot helper、Markdown/Marp completion 或 package install success 只能产出 evidence refs、typed blocker refs、repair target refs 或 export input refs；不能产出 visual ready、exportable、handoffable 或 artifact authority verdict。

## 当前角色

Delivery docs 解释当前 deliverable families、default routes、proof environments 和 examples。描述旧 rendering paths 的 route notes 必须标明 explicit optional route、route-level repair/recovery 或 historical support，避免被读成当前默认 route 或 hidden fallback chain。一次性 probe / dated evidence 只在 history/process 保留，不能占用当前 delivery owner。

当前 delivery 材料：

- [Deliverable examples](./deliverable_examples.md)
- [Image-first PPT production route](./image-first-ppt-production-route.md)
- [HTML PPT route quality](./html-ppt-route-quality.md)
- [Native PPT proof environment](./native-ppt-proof-environment.md)：解释 native editable PPTX 的 AI-first design pack、`editable_shape_plan`、officecli writer / validator、true render QA、AgentLab refs-only 和 mock-not-sample 边界。
历史 stable deliverable 手工测试简报已进入 [history/phase-2](../history/phase-2/stable_deliverable_manual_test_brief.md)，real-route evolution probe 已进入 [history/process](../history/process/real-route-evolution-probe.md)，不再作为当前 delivery 材料或 active command 读取。当前 refs-only evaluation fixture 归 `contracts/stage_run_canary_evidence.json` 与 `contracts/agent_lab_handoff.json`；它不声明 production readiness。

Runtime contracts 应使用 `human_doc:*` semantic pointers 作为读者上下文，不把本目录布局当稳定机器接口。
