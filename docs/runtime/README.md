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

Runtime evidence 由 `contracts/production_acceptance/**`、focused tests、workspace artifacts、owner receipts 和 active gap plan 持有。本索引只保留读法，不逐条保存 suite 命令、mock proof、live sample root 或 artifact refs。

本层区分三类证据：

| Evidence class | Runtime readout | Boundary |
| --- | --- | --- |
| `refs_only` | AgentLab / OPL / read-model 可以读取合同、gate refs、forbidden-authority flags 和 route metadata。 | 只证明可发现、可投影或可交接；不声明 visual ready、exportable、handoffable 或 production soak。 |
| `mock` | mock provider、mock Codex helper 或 deterministic fixture 可以跑通 route plumbing 和文件链路。 | 只证明 helper / contract / export wiring；不能展示成视觉样片或 route quality verdict。 |
| `live_sample` | Codex-native imagegen、live integrated sample 或 native PPT proof lane 可以物化样例 artifact。 | 只证明样例可生成、review 或 export；production evidence tail 仍回到 active gap plan、production acceptance contracts 和 RCA-owned review/export gates。 |

Runtime docs 可以被 contracts 通过稳定 `human_doc:*` semantic IDs 引用，但 Markdown path 不是机器 API。
