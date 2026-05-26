# Runtime 文档

Owner: `RedCube AI`
Purpose: `runtime_docs_index`
State: `active_support`
Machine boundary: 人读 runtime 索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和 runtime projections。

`docs/runtime/` 保存人读 runtime lifecycle 材料：topology、executor/backend 边界、service-safe domain entry、runtime watch、review/projection 对齐和 substrate owner 说明。

本层只解释 runtime 职责。机器可读合同仍在 `contracts/runtime-program/`；runtime/projection 真相继续归源码、schema、contracts、workspace artifacts 和 owner receipts。

## 当前角色

Runtime docs 解释当前 executor/backend split、service-safe entry、watch/projection 语义和 hosted integration 边界。每份材料都应先说明它是 current runtime guidance、target-state reference 还是 historical provider/proof context。

RCA runtime docs 只描述 domain-agent runtime boundary：service-safe domain entry、domain_action_adapter projection、guarded dispatch、review/export refs、artifact locators、owner receipts 和 executor adapter expectations。Generic stage runtime、queue、wakeup、retry/dead-letter、operator projection、memory locator shell 和 App/workbench runtime 归 OPL Framework 或 product shell，不在 RCA docs 中成为第二平台。

当前材料：

- [Runtime architecture](./runtime_architecture.md)

最小 `/goal` 自动化 smoke 由 `contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json` 承载，可用 OPL `agent-lab run --suite ... --json` 直接验证 RCA 从单一 goal 进入 OPL-hosted `auto_to_terminal` product-entry workflow。配套 focused test 还用 mock image provider 跑 `xiaohongshu` route chain 到 `export_bundle`，检查 PNG、publish bundle、caption、publication-state 和 reports 已落盘。它是 runtime handoff / recovery / artifact plumbing observation。

真实图片生成证明单独由 Codex executor native imagegen task 提供：live mode 不读取 `OPENAI_API_KEY`、Base URL、Codex provider token 或 `REDCUBE_IMAGE_GENERATION_TOKEN`，而是让 Codex executor 自己调用原生 imagegen / image_generation 能力并把 PNG 落到 RCA artifact path。mock artifact smoke 与 Codex-native live image sample 合起来证明“可自动推进 + 可真实生成图片 + 可导出文件链路”，但仍不声明 visual ready、exportable、handoffable 或 production soak。

`ppt_deck` 的三技术路线 AgentLab 面是 runtime refs/read-model observation，不是第二执行入口：image-first 默认线读取 `ppt-image-first-quality-nonregression` refs，HTML 显式线读取 `ppt-html-route-quality-nonregression` refs，native editable PPTX 显式线读取 `ppt-native-pptx-quality-nonregression` refs。`rca-ppt-three-route-agent-lab-suite` 的 focused test 还用 mock provider 让 RCA runtime 分别跑 image-first、HTML、native PPTX 三条 route chain 到 `export_pptx`，检查 PNG/HTML/native PPTX、review screenshots、最终 PPTX/PDF 与 artifact gallery 已落盘。三条线都保持 RCA product-entry、route policy、visual director review、screenshot review 与 export gate 为正式链路；HTML/native 只能由 operator 显式选择，不能作为 silent fallback 或默认路线替换。

本层区分三类证据：`refs-only` 只表示 AgentLab 可读取合同、runtime read-model、gate refs 与 forbidden-authority flags；`mock` 只表示轻量 fixture / mock provider / helper plumbing 可跑通文件链路；真实样片必须显式触发 Codex-native imagegen、live integrated sample 或 native PPT proof lane，并且只证明样例可物化，不声明 visual ready、exportable、handoffable 或 production soak。

Runtime docs 可以被 contracts 通过稳定 `human_doc:*` semantic IDs 引用，但 Markdown path 不是机器 API。
