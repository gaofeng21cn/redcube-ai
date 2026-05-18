# 参考文档

Owner: `RedCube AI`
Purpose: `support_reference_index`
State: `active_support`
Machine boundary: 人读参考索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

`docs/references/` 保存仍能解释当前 RedCube 运行、目标态思考或维护者实践的支撑性技术材料。纯历史 owner 讨论、旧路线 proof、absorbed plan 和不再服务 current support 的材料进入 `../history/` 或 tombstone。

仍服务当前计划的 brief 放在 `../active/`，只解释已落地合同面的 support brief 放在本目录对应子目录，稳定规则放在 `../policies/`，不再代表当前事实的 provenance 放在 `../history/`。
参考文档可以讨论 OPL、gateway、harness、bridge、federation 或 hosted runtime 语境；这些词只按内部集成、target-state 或历史 provenance 阅读。默认公开身份仍是 visual-deliverable domain agent：`RedCube AI`。参考文档不得重新打开旧 workbench、frontdoor、federation、Hermes-first、local runtime 或 gateway-first active truth。
如果某份参考仍被 `human_doc:*` 命名引用，保持语义 ID 稳定即可；物理路径按生命周期分层，不把旧路径当作兼容接口。

当前分组：

- 维护者与系列治理：`series-doc-governance-checklist.md`
- Product-entry support：`product-entry/`，解释 direct entry、OPL-hosted entry 和 session continuity 已落地合同面
- operator / integration 支撑参考：`rca_executor_routing_config.md`、`opl_family_contract_adoption.md`、`lightweight_product_entry_and_opl_handoff.md`、`domain_memory_descriptor_locator.md`
- 面向未来的目标态：`direct_delivery_longrun_target_state.md`、`source_readiness_deep_research_longrun_target_state.md`、`rca-visual-deliverable-agent-ideal-state.md`
- 对当前解释仍有帮助的审计 provenance：`creative-stage-ai-first-audit-2026-04-13.md`

## 当前处置口径

| 参考文档 | 生命周期状态 | 读者口径 |
| --- | --- | --- |
| `product-entry/redcube_product_entry_mvp.md` | contract-linked support | 解释 direct product-entry service surface 的已落地合同和调用面，不承担 active plan。 |
| `product-entry/managed_product_entry_hardening.md` | contract-linked support | 解释 product-entry session continuity 与用户级 runtime-state，不定义 GUI/WebUI 或 generic runtime。 |
| `product-entry/opl_framework_hosted_product_entry.md` | contract-linked support | 解释 OPL Framework 托管路径如何进入同一 RCA domain entry，不交出 visual truth。 |
| `lightweight_product_entry_and_opl_handoff.md` | 支撑性集成参考 | 说明 RCA direct entry 与 OPL-hosted handoff 如何收敛到同一下游 domain entry。 |
| `opl_family_contract_adoption.md` | active support reference | 说明 RCA 如何把 attempt、quality、incident、operator 数据投影给 OPL，同时不交出 visual truth。 |
| `rca_executor_routing_config.md` | active operator reference | 说明 opt-in executor routing；内置默认仍是 `codex_cli`。 |
| `domain_memory_descriptor_locator.md` | active contract-linked reference | RCA 持有 visual pattern memory descriptor、locator 和 receipt；OPL 只消费 refs。 |
| `direct_delivery_longrun_target_state.md` | 面向未来的参考 | 只作为目标态思考；当前 runtime truth 留在 runtime/source/delivery owner docs 和 contracts。 |
| `source_readiness_deep_research_longrun_target_state.md` | 面向未来的参考 | 只作为 source plane 目标态思考。 |
| `rca-visual-deliverable-agent-ideal-state.md` | north-star 参考 | 说明 RCA 作为 visual-deliverable Foundry Agent 的目标态；当前 truth 留在核心文档、contracts、product-entry manifest、workspace artifacts 和 RCA-owned gates。当前差距和完善计划读 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md)。 |
| `creative-stage-ai-first-audit-2026-04-13.md` | 带当前 caution 的审计 provenance | 可用于理解 AI-first closure；旧 `render_html` 默认口径必须按当前 image-first default 重新阅读。 |
| `../history/phase-2/ppt_mainline_quality_closeout.md` | 已解决的历史质量 closeout | HTML quality debt closeout；当前 PPT 默认路线是 image-first；该文件不再作为 current reference 读取。 |

已迁入 history：

- `../history/positioning/domain-harness-os-positioning.md`：合同语义 ID 仍可检索的历史定位参考；只读作 legacy internal boundary vocabulary，公开身份仍是 RCA visual delivery，generic framework/runtime 归 OPL。
- `../history/opl_managed_runtime_three_layer_contract.md`：历史三层 owner 讨论；当前 runtime owner 与 production substrate 口径回到核心五件套、`docs/runtime/`、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts。
- `../history/phase-2/ppt_mainline_quality_closeout.md`：历史 HTML 默认路线质量债 closeout；当前 PPT 默认路线是 image-first。
