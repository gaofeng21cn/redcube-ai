# 参考文档

Owner: `RedCube AI`
Purpose: `support_reference_index`
State: `active_support`
Machine boundary: 人读参考索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

`docs/references/` 保存仍能解释当前 RedCube 运行、目标态思考或维护者实践的支撑性技术材料。纯历史 owner 讨论、旧路线 proof、absorbed plan、dated follow-through 和不再服务 current support 的材料进入 `../history/` 或 tombstone。

仍服务当前计划的 brief 放在 `../active/`，只解释已落地合同面的 support brief 放在本目录对应子目录，稳定规则放在 `../policies/`，不再代表当前事实的 provenance 放在 `../history/`。
每份长期 reference 必须说明 owner、purpose、state 和 machine boundary；缺少这四项时，先补 lifecycle metadata，或按内容生命周期迁入 `../history/`。
参考文档可以讨论 OPL hosted integration、contract support、provenance 或 tombstone 语境；旧 gateway、harness、bridge、federation、Hermes-first、local runtime 等词只按内部集成历史、合同引用或退役读法阅读。默认公开身份仍是 visual-deliverable domain agent：`RedCube AI`。参考文档不得重新打开旧 workbench、frontdoor、federation、Hermes-first、local runtime 或 gateway-first active truth。
如果某份参考仍被 `human_doc:*` 命名引用，保持语义 ID 稳定即可；物理路径按生命周期分层，不把旧路径当作兼容接口。

当前分组：

- 维护者巡检支撑：`governance/series-doc-governance-checklist.md`，只服务 RCA 视角的 OPL family / series 跨仓 docs intake / 对齐检查，不定义 family membership 或 repo count；RCA 文档生命周期治理规则读 `../docs_portfolio_consolidation.md`
- Product-entry support：`product-entry/`，解释 direct entry、OPL-hosted entry 和 session continuity 已落地合同面
- operator / integration 支撑参考：`integration/opl-family-contract-adoption.md`、`domain_memory_descriptor_locator.md`
- Skill / plugin carrier 边界：`primary-skill-plugin-carrier-boundary.md`，解释 `agent/primary_skill/SKILL.md` 作为标准 OPL / Rich App primary skill source，与 `plugins/redcube-ai/skills/redcube-ai/SKILL.md` 作为 Codex plugin carrier mirror / 安装发现面的区别。
- 面向当前目标态的 north-star：`rca-visual-deliverable-agent-ideal-state.md`
- 历史结构收薄设计：`rca-overdesign-thinning-design.md`，只记录 2026-07-10 八项过度设计候选的历史边界与验收语境；2026-07-11 当前 17 项完成度读 `../active/rca-ideal-state-gap-plan.md` 与 current-program completion audit。
- native editable PPTX 支撑参考：`native-ppt-open-source-design-discipline.md`，只吸收开源路线的 spec lock、显式坐标、截图 QA 与导出验证纪律，不改变 RCA product-entry / review / export owner。
- 已归档的 future target freeze：`../history/plans/2026-04-09-direct-delivery-longrun-target-state.md`、`../history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md`
- 历史 AI-first 审计 provenance 已迁入 `../history/plans/creative-stage-ai-first-audit-2026-04-13.md`；当前 AI-first 质量边界读 `../policies/ai_first_quality_boundary.md`。

## 当前处置口径

| 参考文档 | 生命周期状态 | 读者口径 |
| --- | --- | --- |
| `product-entry/redcube_product_entry_mvp.md` | contract-linked support | 解释 direct product-entry service surface 的已落地合同和调用面，不承担 active plan。 |
| `product-entry/product_entry_session_continuity.md` | contract-linked support | 解释 product-entry session continuity 与用户级 runtime-state，不定义 GUI/WebUI 或 generic runtime。 |
| `product-entry/opl_framework_hosted_product_entry.md` | contract-linked support | 解释 OPL Framework 托管路径如何进入同一 RCA domain entry，不交出 visual truth。 |
| `integration/opl-family-contract-adoption.md` | support reference | 说明 RCA 如何把 attempt、quality、incident、operator 数据投影给 OPL，同时不交出 visual truth；不承担 active baton。 |
| `domain_memory_descriptor_locator.md` | active contract-linked reference | RCA 持有 visual pattern memory descriptor、locator 和 receipt；OPL 只消费 refs。 |
| `primary-skill-plugin-carrier-boundary.md` | active support reference | 说明 repo-local primary skill source 与 Codex plugin carrier mirror 的职责区别；两者都不持有 visual truth，也不是两套业务能力。 |
| `rca-visual-deliverable-agent-ideal-state.md` | north-star 参考 | 说明 RCA 作为 visual-deliverable Foundry Agent 的目标态；当前 truth 留在核心文档、contracts、product-entry manifest、workspace artifacts 和 RCA-owned gates。当前差距和完善计划读 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md)。 |
| `native-ppt-open-source-design-discipline.md` | active support reference | 调研 `ppt-master`、OfficeCLI / `officecli-pptx`、PptxGenJS、Presenton、Marp、Slidev、PPTist 的 native/editable PPT 设计纪律；作为 RCA AI-first native PPTX prompt、shape-plan contract 与 QA gate 的参考，不定义机器接口。 |
| `../history/phase-2/ppt_mainline_quality_closeout.md` | 已解决的历史质量 closeout | HTML quality debt closeout；当前 PPT 默认路线是 image-first；该文件不再作为 current reference 读取。 |
| `../history/plans/2026-04-09-direct-delivery-longrun-target-state.md` | 已归档 future target freeze | 只保留 2026-04-09 direct-delivery longrun target provenance；当前 delivery truth 回到 delivery/runtime owner docs 与 contracts。 |
| `../history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md` | 已归档 future target freeze | 只保留 2026-04-09 source-plane longrun target provenance；当前 source truth 回到 source owner docs 与 contracts。 |

已迁入 history：

- `integration/lightweight-product-entry-and-opl-handoff.md` 已退役：它只重复 direct product entry、OPL-hosted product entry、session continuity 和 family contract adoption 的当前读法。当前 direct / hosted entry truth 读 `product-entry/` 三个 support brief、`integration/opl-family-contract-adoption.md`、核心五件套与 runtime-program contracts；过程压缩读 `../history/process/README.md`。
- `../history/positioning/domain-harness-os-positioning.md`：合同语义 ID 仍可检索的历史定位参考；只读作 legacy internal boundary vocabulary，公开身份仍是 RCA visual delivery，generic framework/runtime 归 OPL。
- `../history/runtime/opl-managed-runtime-three-layer-contract.md`：历史三层 owner 讨论；当前 runtime owner 与 production substrate 口径回到核心五件套、`docs/runtime/`、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts。
- `../history/tombstones/retired-managed-product-entry-contract-2026-05-20.md`：旧 `managed_product_entry_hardening` 语义 ID 的 tombstone；active support 入口已迁到 `product-entry/product_entry_session_continuity.md`。
- `../history/phase-2/ppt_mainline_quality_closeout.md`：历史 HTML 默认路线质量债 closeout；当前 PPT 默认路线是 image-first。
- `../history/plans/creative-stage-ai-first-audit-2026-04-13.md`：历史 AI-first audit；其中 upstream Hermes owner wording 不再作为当前 executor owner 或默认 route 口径读取。
- `../history/plans/2026-04-08-deep-research-auto-first-product-contract.md`：历史 Deep Research / 5 步 auto-first 产品语义；当前 source 执行合同回到 `../source/source_augmentation_executor_contract.md`。
