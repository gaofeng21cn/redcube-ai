# RCA 文档组合治理

Status: `active_docs_governance`
Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口。RCA 机器真相继续归 `contracts/runtime-program/current-program.json`、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

## 当前结论

`docs/**` 是 RCA 的中文内部开发与维护参考，不再维护 docs 层双语镜像。稳定路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。历史文件可以保留旧双语或旧路径描述作为 provenance，但 active/reference 索引必须指向当前无后缀路径。历史目录 README 也按中文 canonical 维护；不要保留指向自身的旧 English 镜像链接。

RCA 采用 OPL-family canonical docs taxonomy：

`active/public/product/runtime/delivery/source/policies/specs/references/history`

这个目录集合按长期职责保留，不按当前文件数量决定。RCA 当前 `active/product/runtime/delivery/source/policies/references/history` 都已有真实承载；`public/specs` 可以保持薄索引，但必须写清职责和新增正文准入规则。

## 与 OPL 的分层

OPL 系列项目全局主参考是 OPL 仓的 `docs/active/opl-family-development-reference.md`。它持有全局 framework 目标、跨仓差距顺序、shared primitive 上收、App/workbench 目标和同名 docs taxonomy；机器或跨仓定位应使用 semantic id、contract/source ref 或 repo owner 口径，不把本机绝对路径当稳定接口。

RCA 文档只维护 visual-deliverable domain agent 的目标、差距、visual truth、review/export verdict、artifact authority、direct product-entry path、OPL-hosted domain_handler/projection/receipt 边界，以及 RCA-to-OPL 上收候选。MAS、MAG、MDS 或 OPL-owned App/workbench 的并行 backlog 不写入 RCA active docs。

## 目录职责

| 目录 | 长期职责 | 当前 RCA 承载 |
| --- | --- | --- |
| `docs/` root | docs 入口、核心五件套、docs governance | `README.md`、核心五件套、本文件。 |
| `docs/active/` | 当前执行、当前计划、当前差距、active baton、当前完成门槛 | 当前只承接 `rca-ideal-state-gap-plan.md` 这类仍在推进的完成计划。 |
| `docs/public/` | public narrative index | 当前较薄；除非未来有真正公开材料，否则保持薄索引。 |
| `docs/product/` | quickstart、profile、public publish、product/operator handoff | 真实承载。 |
| `docs/runtime/` | runtime topology、executor/backend、service-safe entry、watch/projection | 真实承载但较薄，核心是 runtime architecture。 |
| `docs/delivery/` | deliverable family、route、proof、export、manual validation | 真实承载。 |
| `docs/source/` | source readiness、augmentation、deep research trigger/gate | 真实承载。 |
| `docs/policies/` | AI-first、visual memory、runtime operating model、deliverable contract model 等稳定规则 | 真实承载。 |
| `docs/specs/` | 当前仍有效的技术规格索引 | 当前较薄；不扩成杂物层。 |
| `docs/references/` | target state、OPL handoff、memory locator、product-entry support、治理 checklist、support references | 真实承载；不承担 active owner。 |
| `docs/history/` | Hermes proof/provenance、absorbed tranche、历史定位、历史计划、tombstone | 真实承载。 |

## 非 canonical 目录

旧 `docs/program/` active baton 目录已物理退役。当前计划和差距进入 `docs/active/`；已吸收 product-entry support brief 进入 `docs/references/product-entry/`；已吸收 Phase 2 tranche 进入 `docs/history/phase-2/`；upstream Hermes proof/provenance 进入 `docs/history/hermes/`；历史定位材料进入 `docs/history/positioning/`。`human_doc:program_*` 与 `human_doc:domain_harness_os_positioning` 继续作为语义化读者上下文 ID，不暗示物理目录名。

`capabilities` 不作为 RCA docs active 目录复活。Capability truth 优先归 contracts、runtime manifest、CLI/MCP surface、delivery/source/runtime owner docs 或 domain action catalog。

当前 docs 生命周期复核结论：

- `docs/public/` 和 `docs/specs/` 继续保持薄索引职责，不承接旧 program、capabilities 或 reference 正文。
- `docs/references/opl-managed-runtime-three-layer-contract.md` 已迁入 `docs/history/runtime/opl-managed-runtime-three-layer-contract.md`，因为它只保留历史 owner-boundary 讨论，不再承担 current support reference。
- `docs/references/product-entry/` 承接已落地的 `redcube_product_entry_mvp`、`product_entry_session_continuity` 与 `opl_framework_hosted_product_entry` support brief；它们解释 contract surface，不承担 active plan。旧 `managed_product_entry_hardening` 只保留在 history tombstone。
- `docs/references/integration/lightweight-product-entry-and-opl-handoff.md`、`docs/references/domain_memory_descriptor_locator.md`、`docs/references/integration/opl-family-contract-adoption.md`、`docs/references/rca_executor_routing_config.md` 仍是 support reference；它们解释 direct / hosted 边界、memory locator、family contract adoption 和 opt-in executor routing，不承担 active plan。
- `docs/references/direct_delivery_longrun_target_state.md`、`docs/references/source_readiness_deep_research_longrun_target_state.md` 与 `docs/source/deep_research_auto_first_product_contract.md` 已归入 `docs/history/plans/`，分别保存 2026-04-09 direct-delivery future freeze、2026-04-09 source-plane future freeze 和 2026-04-08 Deep Research / auto-first 产品语义 provenance。当前 delivery/source truth 回到 owner docs、active gap plan 和 machine-readable contracts。
- `docs/references/positioning/domain-harness-os-positioning.md` 已迁入 `docs/history/positioning/domain-harness-os-positioning.md`；该语义 ID 只作为 historical positioning / internal boundary vocabulary 保留。
- 旧 `docs/references/creative-stage-ai-first-audit-2026-04-13.md` 已迁入 `docs/history/plans/creative-stage-ai-first-audit-2026-04-13.md`；其中 upstream Hermes 创作 owner 表述只按 2026-04-13 历史 audit 读取，当前 executor / owner truth 回到核心五件套、AI-first policy、ideal-state reference 和 active gap plan。
- `docs/history/phase-2/`、`docs/history/hermes/`、`docs/history/plans/` 和 `docs/history/tombstones/` 只保留 provenance / tombstone；其中的旧 Gateway、Hermes-first、frontdoor、federation、source-pack-federation、old workbench 或 Phase 2 词汇不得回流 active/current。
- 没有恢复 `docs/capabilities/`；新增 capability-like 内容应先进入 contracts、manifest、domain action catalog 或对应 owner doc。

## 内容级整合规则

1. 当前 visual truth、route truth、review/export verdict、artifact authority 合入核心五件套、runtime/delivery/source owner docs 或 machine surfaces。
2. 当前 baton 和 active plan 留在 `docs/active/`；已完成且只解释合同面的 support brief 进入 `docs/references/`。
2.1. dated follow-through、tranche closeout、命令证据流水和阶段性校准过程进入 `docs/history/plans/` 或其他 history/provenance 层；active/reference 主文档只保留当前定位、边界、差距、证据缺口和下一步顺序。
3. Product/operator/profile/release 支撑进入 `docs/product/`。
4. Runtime topology、service-safe entry、watch/projection 进入 `docs/runtime/`。
5. Deliverable route/proof/export/manual validation 进入 `docs/delivery/`。
6. Source readiness、augmentation、deep research trigger/gate 进入 `docs/source/`。
7. AI-first、visual memory、runtime model、deliverable contract model 等稳定规则进入 `docs/policies/`。
8. 目标态、OPL handoff、governance checklist 和支持性技术参考进入 `docs/references/`，不得写成 current truth。
9. Hermes-first、gateway/harness/bridge/federation 旧叙事进入 `docs/history/` 或 tombstone。

## Direct Retirement

当旧模块、旧接口、旧 CLI alias、旧 wrapper、旧 facade、旧测试入口或旧文档入口已被当前 owner surface 替代时，默认直接退役。迁移 active caller 后删除旧面；需要来龙去脉时只保留 history/tombstone/provenance，不新增 compatibility shim、别名、re-export facade 或 compatibility-only 聚合测试。

## 长清单与历史词治理

RCA 当前只允许一个 active completion plan：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。其他长清单按职责拆分：

- product-entry support brief 只解释已落地 contract surface、direct/hosted 边界或 session-continuity provenance；不得继续追加 active follow-up board。
- source/delivery future target freeze 与 dated product-semantics long list 只保存在 history/provenance；当前 active/reference 层不再保留这类长清单正文。
- Phase 2、Hermes proof、creative-stage audit、gateway/frontdoor/federation/source-pack-federation、old workbench 或 managed runtime 记录只进入 history/provenance/tombstone。
- `managed`、`session`、`gateway`、`domain_action_adapter`、`runtime` 等历史词如果仍出现在 active docs，必须同时说明它是 semantic-id、refs-only adapter、domain handler target、retired guard 或 provenance，不得表达 RCA-owned generic runtime。
- 长表只保留当前 owner、当前状态、证据门和下一步；dated proof、命令输出、旧分支名和 absorbed tranche 进入 `docs/history/**`。
- 若历史文档中的规则仍 current，先抽取到核心五件套、active gap plan、policy/runtime/delivery/source owner、contract 或 source surface；不在历史文件中继续追加新状态。

## Coverage Ledger

### 2026-05-28 reference memory / product-entry support tranche

本轮覆盖 RCA uncovered reference bodies 中与 memory locator、product-entry support、series governance checklist 和 executor routing 相关的 current-read 口径。目标是确认 reference 层只解释已落地 contract / support surface，不把旧 `managed`、`gateway`、`session`、`domain_action_adapter`、repo-local `product manifest/status/session` wrapper 或 Hermes proof lane 写成当前 RCA generic runtime owner、active backlog、generated/default wrapper owner、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak evidence。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/status.md`, `docs/architecture.md`, `docs/decisions.md`, and this governance ledger.
- Reviewed reference docs: `docs/references/README.md`, `docs/references/domain_memory_descriptor_locator.md`, `docs/references/governance/series-doc-governance-checklist.md`, `docs/references/product-entry/README.md`, `docs/references/product-entry/redcube_product_entry_mvp.md`, `docs/references/product-entry/product_entry_session_continuity.md`, `docs/references/product-entry/opl_framework_hosted_product_entry.md`, and `docs/references/rca_executor_routing_config.md`.
- Machine / live read-model refs: `contracts/functional_privatization_audit.json`, `contracts/physical_source_morphology_policy.json`, `contracts/runtime-program/current-program.json`, `contracts/runtime-program/current-program.index.json`, `contracts/pack_compiler_input.json`, `contracts/generated_surface_handoff.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `redcube domain-handler export --json`, and focused tests under `tests/product-entry-cases/*memory*`, `tests/product-entry-cases/*domain_action_adapter*`, and `tests/opl-family-contract-adoption*.test.ts`.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- Product-entry support bodies already carry lifecycle metadata and correctly read as contract-linked support, not active plan. Their old `managed_product_entry_hardening`, `OPL Gateway`, `domain_action_adapter`, `session`, `status`, and wrapper wording is bounded as direct service surface, OPL generated/default wrapper target, refs-only adapter, tombstone/provenance, or no-resurrection context.
- Live RCA CLI confirms repo-local `redcube product manifest/status/session/domain_action_adapter` is no longer a callable product wrapper: it returns a usage error stating those generated/default wrappers are owned by OPL and RCA `redcube product` retains `invoke` only. Current machine read-model for this tranche is `redcube domain-handler export --json`.
- `docs/references/domain_memory_descriptor_locator.md` was stale at the current-read line: it still collapsed all runtime receipt work into `runtime_writeback_pending`. It now distinguishes the still-pending descriptor / memory-body migration claim from the current refs-only evidence: `controlled_memory_apply_proof/runtime_receipt_instances` and `workspace_receipt_inventory_projection` can show accepted/rejected visual memory receipt refs and lifecycle receipt refs, but these body-free refs do not declare production soak complete, visual ready, exportable, handoffable, domain ready, or artifact authority.
- The executor routing reference remains valid as opt-in operator support: `hermes_agent` stays explicit proof / optional route backend, while default concrete executor remains `codex_cli` through OPL/provider-selected policy. No edit was needed there.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full read of the eight reference docs listed above; stale-term scan across active/reference/product/runtime/delivery/source/policy/spec/public docs; machine/read-model refs listed above. | `docs/references/domain_memory_descriptor_locator.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The governed reference docs retain their support roles. This tranche corrected stale current-read wording rather than retiring a path.

Unreviewed docs:

- RCA `docs/references/README.md`, `docs/references/governance/series-doc-governance-checklist.md`, `docs/references/product-entry/*.md`, `docs/references/rca_executor_routing_config.md`, and `docs/references/domain_memory_descriptor_locator.md` are now covered for current owner, lifecycle role, stale wrapper vocabulary, and no-resurrection boundaries.
- RCA remaining uncovered reference/support bodies still include `docs/references/integration/*.md`, `docs/references/product-entry` already covered at support-role level but not exhaustively compared against every package source line, and non-reference public/product/runtime/delivery/source/policy/spec docs outside prior covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger; App body governance remains delayed while release/GUI lanes are unsafe.

Remaining stale / retire candidates:

- Any future reference text that treats repo-local `product manifest/status/session/domain_action_adapter` wrappers, old `managed` product-entry hardening, `OPL Gateway`, `runtime_watch` dispatch, `product_entry_continuation`, Hermes proof lane, or `session` wording as current RCA-owned generic wrapper, active public CLI/MCP surface, retained legacy synonym surface, production readiness, visual readiness, export authority, artifact authority or long-soak completion is stale pollution.
- `visual_pattern_memory_writeback.status=descriptor_proof_contract_landed_runtime_writeback_pending` must not be rewritten as full memory lifecycle completion. The correct current read is descriptor/proof landed plus runtime receipt refs visible, with production-scale evidence still in the active plan.

Next tranche write scope:

- RCA remaining integration reference bodies (`docs/references/integration/*.md`) and selected public/product/runtime/delivery/source/policy/spec owner docs, after confirming current role and no-resurrection boundaries from live contracts/tests/read-models.
- Or MAS product/status/workbench and progress/domain-ref projection shell reconciliation outside already-covered blocks.
- Keep App docs delayed until active release/GUI lanes are safe to govern.

### 2026-05-26 history plans/runtime/tombstone no-resurrection tranche

本轮覆盖 RCA `docs/history/plans/`、`docs/history/positioning/`、`docs/history/runtime/` 与 `docs/history/tombstones/` 的 history/provenance 入口读法。目标是把剩余非 Hermes、非 Phase 2 的历史计划、历史定位、历史 managed-runtime owner-boundary 和 tombstone 继续锁在 provenance / no-resurrection 语境，避免旧 `managed`、`gateway`、`frontdoor`、`federation`、`upstream Hermes`、`current/next/backlog` 或 `domain_action_adapter` wording 回流成当前 runtime owner、active backlog、generated/default caller、visual readiness、artifact authority 或 production readiness。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/history/README.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, and this governance ledger.
- Reviewed history docs: `docs/history/plans/README.md`, all 8 `docs/history/plans/*.md` bodies by lifecycle header / heading / stale-term risk map, `docs/history/positioning/README.md`, `docs/history/positioning/domain-harness-os-positioning.md`, `docs/history/runtime/opl-managed-runtime-three-layer-contract.md`, `docs/history/tombstones/README.md`, and both `docs/history/tombstones/*.md` bodies.
- Machine refs: `contracts/runtime-program/current-program.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/functional_privatization_audit.json`, and `contracts/runtime-program/current-program-parts/current_state/active_baton/scope/privatized_functional_module_audit/retired_no_resurrection_guards.json`.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- `docs/history/plans/README.md` was the main lifecycle gap: it listed historical files but did not give the same per-file current-read table used by newer Hermes / Phase 2 indexes. It now maps every historical plan to its current read and states that `当前状态`、`下一步`、`Backlog`、`planned`、`done` and `deferred` headings are date-bound historical wording.
- `docs/history/positioning/README.md` now states the current read for `Domain Harness OS` / `Domain Gateway` positioning: RCA public identity remains the visual-deliverable domain agent, and OPL-hosted path consumes descriptor/domain-action/receipt/operator/source/artifact refs without owning visual truth, review/export verdict, artifact body, memory body or owner receipt body.
- `docs/history/runtime/opl-managed-runtime-three-layer-contract.md` now has a first-screen current-read guard: `managed runtime / session / run / watch / resume owner` is historical owner-boundary wording; current truth is OPL provider-backed stage runtime / attempt ledger / queue / wakeup / projection, with Temporal as required production online substrate and Codex CLI as first-class executor.
- `docs/history/tombstones/README.md` now carries an explicit no-resurrection boundary for `gateway` / `harness`, `managed`, and `Hermes` / `Hermes-Agent`, matching runtime-program retired no-resurrection guards.
- No history body in this tranche was promoted to current support. If a historical body still contains a rule that should remain current, it must be extracted to core docs, source/delivery/runtime/policy owner docs, active gap plan, machine-readable contracts or source/test surface before use.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full read of `docs/history/plans/README.md`, `docs/history/positioning/README.md`, `docs/history/runtime/opl-managed-runtime-three-layer-contract.md`, `docs/history/tombstones/README.md` and tombstone bodies; lifecycle-header / heading / stale-term risk-map pass across all `docs/history/plans/*.md` bodies and `docs/history/positioning/domain-harness-os-positioning.md`; live contract refs listed above. | `docs/history/plans/README.md`; `docs/history/positioning/README.md`; `docs/history/runtime/opl-managed-runtime-three-layer-contract.md`; `docs/history/tombstones/README.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The governed docs remain history/provenance/tombstone surfaces; the correction was missing directory/current-read and no-resurrection guidance, not a doc-path retirement.

Unreviewed docs:

- RCA `docs/history/plans/`, `docs/history/positioning/`, `docs/history/runtime/` and `docs/history/tombstones/` are now covered at index/no-resurrection level. Large historical plan bodies remain provenance bodies; they were risk-mapped for lifecycle header, headings and stale terms, but not rewritten paragraph by paragraph in this tranche.
- RCA uncovered reference bodies remain open, especially `docs/references/README.md`, `docs/references/domain_memory_descriptor_locator.md`, `docs/references/governance/series-doc-governance-checklist.md`, `docs/references/product-entry/*.md`, and `docs/references/rca_executor_routing_config.md`.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger; OMA README/docs coverage remains covered by the earlier OMA tranche.

Remaining stale / retire candidates:

- Future RCA prose that treats historical plans, historical positioning, managed runtime three-layer wording, tombstone ids, old `gateway` / `harness` / `frontdoor` / `federation` / `managed` / `Hermes` / `domain_action_adapter` wording or historical checklist headings as current default runtime owner, active backlog, generated/default caller, public identity, visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak evidence is stale pollution.
- Any current rule still embedded only in a historical plan body should be extracted to the correct owner doc or machine surface before being relied on.

Next tranche write scope:

- RCA uncovered reference bodies with old managed/gateway/runtime/session/domain_action_adapter vocabulary, after confirming current role and no-resurrection boundaries from live contracts/tests.
- Or MAS product/status/workbench and progress/domain-ref projection shell reconciliation outside already-covered blocks.
- Keep App docs delayed until active release/GUI lanes are safe to govern.

### 2026-05-26 Phase 2 history/provenance index tranche

本轮覆盖 RCA `docs/history/phase-2/` history/provenance 文档，重点核对 absorbed Phase 2 tranche、continuation board、proof lane、manual-test brief、HTML/native route closeout 与当前 RCA owner boundary 的读法。目标是把 Phase 2 历史材料继续锁在 provenance / proof 语境，并明确唯一当前真相回到核心五件套、active gap plan、runtime/delivery/source/policy owner docs 和 machine-readable contracts。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed history docs: `docs/history/README.md`, `docs/history/phase-2/README.md`, and all 17 `docs/history/phase-2/*.md` bodies.
- Machine refs: `contracts/runtime-program/current-program.json`, Phase 2 runtime-program contracts, `ppt-image-first-production-route.json`, `ppt-native-authoring-proof-lane.json`, current-program leaf refs for source intake, publication projection, native PPT operator UX, `runtimeWatch`, retired `domain_action_adapter` tombstones, physical morphology and default-caller deletion evidence.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- Phase 2 body docs already carry `Owner` / `Purpose` / `State` / `Machine boundary` or first-screen lifecycle notes. Several bodies intentionally preserve old `当前状态`、`Backlog`、`下一步`、`停车结论` or closeout language, but the lifecycle notes bind those terms to historical tranche context.
- The directory index had the same weakness as Hermes before the prior tranche: it had lifecycle rules, but still used an English-first title and a bare file list. It is now a Chinese canonical history index with current truth owner refs, a per-brief role/read table, and explicit stale wording/no-resurrection rules.
- The only Phase 2 brief with current support semantics is `phase_2_ppt_native_authoring_proof_lane.md`: it still supports the optional native editable PPTX route. It does not change the default image-first PPT route and does not bypass source truth, review, `runtimeWatch` or export gates.
- Phase 2 history does not authorize controller expansion, academic poster activation, managed web runtime, OPL-first runtime owner, generated/default caller ownership, visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak completion.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of `docs/history/phase-2/README.md` and all 17 `docs/history/phase-2/*.md` bodies; role read of `docs/history/README.md`; live contract/core-doc refs listed above. | `docs/history/phase-2/README.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. Phase 2 history bodies remain provenance/proof records. No body-level rewrite was needed because each body already carries lifecycle metadata; the index now provides per-brief current read and no-resurrection guidance.

Unreviewed docs:

- RCA `docs/history/phase-2/` bodies are now covered for current owner, historical role, current optional-route support and no-resurrection boundaries.
- RCA remaining reference bodies and non-Hermes/non-Phase-2 history bodies remain open outside already-covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any future RCA prose that treats Phase 2 history, continuation boards, old manual-test brief, old HTML lane closeout, old `gateway` / `harness` / `managed` wording, or old OPL-hosted runtime language as current default runtime owner, active backlog, generated/default caller, public identity, visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak evidence is stale pollution.
- Any current rule still embedded only in a Phase 2 history body should be extracted to core docs, active gap plan, runtime/delivery/source/policy owner docs, machine-readable contracts or source/test surface before being relied on.

Next tranche write scope:

- Remaining RCA `docs/history/plans/`, `docs/history/positioning/`, `docs/history/runtime/`, `docs/history/tombstones/` and uncovered reference bodies with old managed/gateway/runtime/session/domain_action_adapter vocabulary.
- Or MAS product/status/workbench and progress/domain-ref projection shell reconciliation outside already-covered blocks.
- Keep App docs delayed until active release/GUI lanes are safe to govern.

### 2026-05-26 Hermes history/provenance no-resurrection tranche

本轮覆盖 RCA `docs/history/hermes/` history/provenance 文档，重点核对 repo-local Hermes migration line、upstream `Hermes-Agent` proof lane、service-safe domain entry proof、historical blocker / closeout 与当前 OPL-hosted provider boundary 的读法。目标是把 history body 继续锁在 provenance / proof 语境，防止旧 `Hermes-backed`、`managed runtime`、`current/next/cutover` wording 回流成当前 default runtime owner、public entry、generated/default caller、production readiness 或 RCA-owned generic runtime shell。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed history docs: `docs/history/README.md`, `docs/history/hermes/README.md`, and all 11 `docs/history/hermes/*.md` provenance bodies.
- Machine refs: `contracts/runtime-program/current-program.json` and runtime-program leaf refs around provider-backed OPL hosting, default `Codex CLI` route policy, `domain-handler export|dispatch`, retired `domain_action_adapter` dispatch tombstones, functional privatization and default-caller deletion evidence.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- All 11 Hermes history bodies already carry `Owner` / `Purpose` / `State` / `Machine boundary` and a history/provenance note. Several bodies intentionally preserve old `当前状态`、`下一步`、`cutover` or `current target` language, but their first-screen lifecycle notes already bind those words to the original tranche date or proof lane.
- The lifecycle drift was at the directory index: `docs/history/hermes/README.md` remained English-first and too thin to tell readers how to read each proof brief. It is now a Chinese canonical history index with current truth owner refs, a per-brief role table and explicit no-resurrection boundary.
- Current RCA default remains direct RedCube entry plus OPL-hosted provider integration and `Codex CLI` as first-class concrete executor. `Hermes-Agent` remains explicit optional / proof backend, executor adapter evaluation, diagnostic or historical reference only.
- The Hermes history directory does not authorize visual ready, exportable, handoffable, domain ready, production ready, generic session/workbench/runtime ownership, generated/default caller ownership, or Hermes-first public identity.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of `docs/history/hermes/README.md` and all 11 `docs/history/hermes/*.md` bodies; role read of `docs/history/README.md`; live contract/core-doc refs listed above. | `docs/history/hermes/README.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. Hermes history bodies remain provenance/proof records. No body-level rewrite was needed because each body already carries lifecycle metadata; the index now provides the missing directory-level canonical read.

Unreviewed docs:

- RCA `docs/history/hermes/` bodies are now covered for current owner, historical role and no-resurrection boundaries.
- RCA remaining reference bodies and non-Hermes history/provenance bodies remain open outside already-covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any future RCA prose that treats Hermes history proof lane, repo-local `Hermes`, upstream `Hermes-Agent`, `managed runtime`, `runManagedDeliverable / getManagedRun / superviseManagedRun`, historical cutover board or historical closeout as current default runtime owner, public identity, generated/default caller, generic session/workbench/runtime shell, domain ready, production ready, visual ready, exportable or handoffable is stale pollution.
- Any current rule still embedded only in a Hermes history body should be extracted to core docs, active gap plan, runtime/delivery/source/policy owner docs, machine-readable contracts or source/test surface before being relied on.

Next tranche write scope:

- Remaining RCA references and non-Hermes history bodies with old managed/gateway/runtime/session/domain_action_adapter vocabulary, after confirming current role and no-resurrection boundaries from live contracts/tests.
- Or MAS product/status/workbench and progress/domain-ref projection shell reconciliation outside already-covered blocks.
- Keep App docs delayed until active release/GUI lanes are safe to govern.

### 2026-05-26 policy support visual-memory boundary tranche

本轮覆盖 RCA policy support 文档，重点核对 AI-first quality、deliverable contract、runtime operating model、TypeScript migration 与 visual pattern memory 边界。目标是把 policy support 读回 live contracts/tests/source：RCA policy 可以规定长期人读规则，但不能把 OPL / Agent Lab / generated shell / product projection / mechanical scorecard 写成 visual truth、route choice、review/export verdict、artifact authority、visual memory body 或 production readiness owner。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/status.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, and this governance ledger.
- Reviewed policy docs: `docs/policies/README.md`, `docs/policies/ai_first_quality_boundary.md`, `docs/policies/deliverable_contract_model.md`, `docs/policies/runtime_operating_model.md`, `docs/policies/typescript_migration_policy.md`, `docs/policies/visual_pattern_memory_policy.md`.
- Machine/source refs: `contracts/memory_descriptor.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/functional_privatization_audit.json`, `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, `contracts/runtime-program/js-residue-line-lock.json`, `contracts/runtime-program/typescript-package-build-contract.json`, and AI-first review helper source surfaced by CodeGraph.
- Test refs: `tests/ai-first-authoring-boundary.test.ts`, `tests/screenshot-review-ai-first.test.ts`, `tests/ppt-creative-ownership.test.ts`, `tests/xiaohongshu-creative-ownership.test.ts`, `tests/poster-creative-ownership.test.ts`, `tests/review-platform.test.ts`, `tests/product-entry-cases/domain-memory-ref-adapter.test.ts`, `tests/rca-production-acceptance.test.ts`, `tests/typescript-closeout-audit.test.ts`, `tests/typescript-baseline.test.ts`, `tests/typescript-package-surfaces.test.ts`, `tests/typescript-service-boundaries.test.ts`.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- AI-first quality policy matches live tests and contracts: story / visual / markup authorship and final review judgment must come from AI author / reviewer artifacts; code, schema, scorecard, projection and layout metrics only provide evidence, blockers and refs.
- Runtime and deliverable contract policies already preserve current owner split: direct / hosted paths return to RCA-owned service-safe domain entry, route truth and review/export gates; OPL / provider completion cannot authorize visual ready, exportable, handoffable, domain ready or production ready.
- TypeScript policy matches current JS residue lock: repo-tracked JS remains retired with zero product-source JS budget, while Python native helper surfaces stay allowed for Office/PPT/document automation.
- Visual memory policy had the only lifecycle drift: it was still an English dated Now/Next/Defer process note. It is now a Chinese current policy with explicit owner/purpose/state/machine boundary, `descriptor_proof_contract_landed_runtime_writeback_pending` readout, OPL locator-only boundary, and open evidence tail.
- `contracts/memory_descriptor.json` and `tests/product-entry-cases/domain-memory-ref-adapter.test.ts` prove OPL consumes locator / receipt refs only; OPL cannot write memory body, choose visual route, accept/reject writeback, issue review/export verdict or mutate artifacts.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of all six `docs/policies/*.md`; live contract/test/source refs listed above. | `docs/policies/visual_pattern_memory_policy.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. Policy support docs remain active support/current policy; stale process framing in visual memory policy was rewritten in place.

Unreviewed docs:

- RCA policy support docs are now covered for AI-first, route/review/export authority, visual memory locator/writeback boundary, TypeScript migration and production-readiness wording.
- RCA remaining reference bodies and history/provenance bodies remain open outside already-covered chunks.
- OPL, MAS, MAG and App repo-wide coverage remains open outside already-recorded chunks; OMA README/docs coverage remains covered by the earlier OMA tranche.

Remaining stale / retire candidates:

- Future policy/support wording that lets OPL, Agent Lab, product shell, generated wrapper, memory descriptor, mechanical scorecard or projection authorize RCA visual ready, exportable, handoffable, domain ready, production ready, route choice, artifact mutation or review/export verdict is stale pollution.
- Future visual memory wording that writes memory body, current deliverable content, review verdict, export truth, artifact state or hidden layout recipe into memory is stale pollution.
- Future TypeScript policy wording that reopens repo-tracked JS implementation/test/script surfaces without explicit contract and audit support is stale pollution.

Next tranche write scope:

- Remaining RCA references/history bodies with old managed/gateway/runtime/session/domain_action_adapter vocabulary, after confirming current role and no-resurrection boundaries from live contracts/tests.
- Or MAS product/status/workbench and progress/domain-ref projection shell reconciliation outside already-covered blocks.
- Keep App docs delayed until active release/GUI lanes are safe to govern.

### 2026-05-26 delivery/source support authority-boundary tranche

本轮覆盖 RCA delivery/source support 文档中容易被读成 readiness proof 或 authority transfer 的边界语句。目标是把 `source augmentation`、delivery examples、route/proof/export support 读回 live source/contracts/tests：source augmentation 只更新 canonical source truth 与 source readiness report；delivery docs/examples 只提供 family / route / proof / export 读者上下文；最终 visual ready、exportable、handoffable、artifact authority 和 review/export verdict 仍来自 RCA-owned review/export gates、workspace artifacts、artifact manifests、review/export receipts 与 owner receipts。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/README.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, and this governance ledger.
- Reviewed support docs: `docs/source/README.md`, `docs/source/source_augmentation_executor_contract.md`, `docs/delivery/README.md`, `docs/delivery/deliverable_examples.md`, `docs/delivery/html-ppt-route-quality.md`, `docs/delivery/image-first-ppt-production-route.md`, `docs/delivery/native-ppt-proof-environment.md`, `docs/delivery/real-route-evolution-probe.md`.
- Machine/source refs: `packages/redcube-runtime/src/source-augmentation-request.ts`, `packages/redcube-runtime/src/source-augmentation-result.ts`, `packages/redcube-runtime/src/source-augmentation-execution.ts`, `packages/redcube-runtime/src/source-augmentation-executor.ts`, `packages/redcube-runtime/src/source-research.ts`, `apps/redcube-cli/src/cli-parts/dispatch.ts`, `packages/redcube-domain-entry/src/actions/run-deliverable-route.ts`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/runtime-program/ppt-html-route-quality-nonregression.json`, and `contracts/runtime-program/ppt-image-first-production-route.json`.
- Test refs: `tests/source-research.test.ts`, `tests/source-intake.test.ts`, `tests/source-intake-cases/augmentation-execution.test.ts`, `tests/real-route-evolution-probe.test.ts`, `tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts`, `tests/ppt-html-route-quality-nonregression.test.ts`, `tests/render-html-guardrails.test.ts`, `tests/ppt-deliverable-e2e.test.ts`, and `tests/xiaohongshu-deliverable-e2e.test.ts`.
- Doctor evidence: OPL Doc Governance doctor preflight reported no RCA structural findings for the worktree before edit; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- `source intake -> source augment -> source execute-augmentation` and `source research` are current source readiness surfaces. `external_command` and `result_file` adapters are strict contract consumers; invalid request/result, unsupported adapter, missing result file or unconfigured executor return explicit blocked reports instead of silent success.
- Valid source augmentation writes `source-index.json`, `extracted-materials.json`, `source-brief.json`, `source-audit.json`, `source-readiness-pack.json`, and `source-augmentation-report.json`. Its `planning_ready` means source truth can support downstream Storyline / Plan consumption; it is not visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak complete.
- Delivery route docs remain active support: image-first is default for `ppt_deck`; HTML and native PPTX are explicit optional routes; proof runners and examples explain route behavior but do not replace `visual_director_review`, `screenshot_review`, `export_pptx`, review/export receipts or owner receipts.
- OPL / generated shell and Agent Lab can consume refs-only source, route, quality, cache and suite input refs; they cannot write artifact body, visual truth, review/export verdict, visual memory body, owner receipt body, or authorize artifact authority / review-export readiness.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of `docs/source/README.md`, `docs/source/source_augmentation_executor_contract.md`, `docs/delivery/README.md`, `docs/delivery/deliverable_examples.md`, `docs/delivery/html-ppt-route-quality.md`, `docs/delivery/image-first-ppt-production-route.md`, `docs/delivery/native-ppt-proof-environment.md`, `docs/delivery/real-route-evolution-probe.md`; live source/contract/test refs listed above. | `docs/source/README.md`; `docs/source/source_augmentation_executor_contract.md`; `docs/delivery/README.md`; `docs/delivery/deliverable_examples.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The delivery/source docs remain active support references; stale authority ambiguity was corrected in place.

Unreviewed docs:

- RCA delivery/source support docs listed above are now covered for source readiness, route/proof/example and review/export authority wording.
- RCA policy support, remaining reference bodies and history/provenance bodies remain open outside previously covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any wording that treats source augmentation `planning_ready`, delivery examples, proof runner success, route cache, Agent Lab suite score or OPL refs-only projection as RCA visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak complete is stale pollution.
- Any wording that lets source augmentation, OPL generated shell, Agent Lab or proof examples write artifact body, visual truth, review/export verdict, visual memory body, owner receipt body or artifact authority is stale pollution.
- Any support wording that turns HTML/native optional routes into hidden fallback chains or weakens image-first default route / review-export gates is stale pollution.

Next tranche write scope:

- RCA policy support docs that mention visual memory, AI-first route authority, review/export memory or deliverable contract model.
- Or remaining RCA references/history bodies with old managed/gateway/runtime/session/domain_action_adapter vocabulary, after confirming current role and no-resurrection boundaries from live contracts/tests.

### 2026-05-26 runtimeWatch / integration support current-caller tranche

本轮覆盖 RCA runtimeWatch、runtime architecture 与 OPL integration support 文档中涉及 generated/default caller thinning、`domain_action_adapter`、Temporal provider、lifecycle adapter 和 runtime read-model 的当前边界。目标是把 support reference 读回 live source/contracts/tests：`runtimeWatch` 是 direct review/progress refs-only read model；`runtime_watch` 已从 generated `domain_action_adapter` dispatch 退役；OPL/Temporal 持有 provider-backed scheduling / wakeup / retry-dead-letter / query projection，但不持有 RCA visual truth、review/export verdict、canonical artifacts、visual memory body 或 owner receipt authority。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/README.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed support docs: `docs/runtime/README.md`, `docs/runtime/runtime_architecture.md`, `docs/references/integration/lightweight-product-entry-and-opl-handoff.md`, `docs/references/integration/opl-family-contract-adoption.md`.
- Machine/source refs: `packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts`, `packages/redcube-domain-entry/src/index.ts`, `packages/redcube-domain-entry/src/actions/domain-handler.ts`, `packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/domain_action_adapter-export-projection.ts`, `packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/temporal-autonomy-readiness.ts`, `apps/redcube-cli/src/cli-parts/dispatch.ts`, `apps/redcube-cli/src/cli-parts/help.ts`, `contracts/runtime-program/current-program.json`, `contracts/runtime-program/current-program-parts/current_state/active_baton/scope/privatized_functional_module_audit/retired_no_resurrection_guards.json`, and `contracts/production_acceptance/rca-production-acceptance.json`.
- Test refs: `tests/product-entry-cases/runtime-and-domain_action_adapter-surfaces.test.ts`, `tests/product-entry-cases/temporal-autonomy-readiness.test.ts`, `tests/family-parity-governance-surface.test.ts`, `tests/product-domain-action-api-cases/definitions-and-delegation.test.ts`, and `tests/rca-retired-surface-guard.test.ts`.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`; this remained a risk-map input, not semantic proof.

Fresh semantic result:

- `runtimeWatch` remains RCA direct API / review-progress read model with `RUNTIME_WATCH_BOUNDARY` classification `refs_only_read_model`; it exports run, artifact, review, typed blocker, operator evidence and telemetry refs, and explicitly does not own generic supervisor, runner, attempt ledger, session runtime, workbench, visual truth, artifact blob, memory body or production-soak claim.
- `domain-handler export|dispatch` is the current RCA target consumed by OPL-generated descriptor/shells. `redcube product` keeps only `invoke`; `product status/session/manifest/domain_action_adapter` repo-local CLI defaults remain retired as generated/default wrapper responsibilities.
- `runtime_watch` remains forbidden as MCP / generated `domain_action_adapter` default dispatch. OPL runtime queries target status/workbench runtime read-model; RCA keeps direct `runtimeWatch` for review/progress refs.
- `temporal_autonomy_readiness` allows OPL/Temporal hosted autonomy and long-time scheduling, while `production_visual_stage_long_soak_complete=false`; provider completion is not visual ready, exportable, handoffable or production-soak complete.
- `opl_family_lifecycle_adapter` wording now says refs-only lifecycle adoption projection instead of RCA-owned generic lifecycle adapter.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of `docs/runtime/README.md`, `docs/runtime/runtime_architecture.md`, `docs/references/integration/lightweight-product-entry-and-opl-handoff.md`, `docs/references/integration/opl-family-contract-adoption.md`; live source/contract/test refs listed above. | `docs/references/integration/lightweight-product-entry-and-opl-handoff.md`; `docs/references/integration/opl-family-contract-adoption.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The integration support docs remain active support references; stale lifecycle/runtime ownership wording was corrected in place.

Unreviewed docs:

- RCA runtimeWatch/runtime architecture and these two integration support docs are now covered for current-caller / generated-wrapper / Temporal provider authority wording.
- RCA delivery/source support, policy support, remaining reference bodies and history/provenance bodies remain open outside previously covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any support wording that treats `runtime_watch` as generated `domain_action_adapter` dispatch, public MCP default wrapper, or RCA repo-local generic supervision/session/workbench caller is stale pollution.
- Any wording that treats OPL provider completion, structural conformance, refs-only projection or `temporal_autonomy_readiness` as RCA visual ready, exportable, handoffable, production ready or production visual-stage long-soak complete is stale pollution.
- Any lifecycle-adapter wording that makes RCA owner of generic runner, attempt ledger, queue, workbench, session shell or lifecycle runtime is stale pollution.

Next tranche write scope:

- RCA delivery/source support docs that mention route-run records, artifact lifecycle, source truth, review/repair transport, native-helper envelope or retired route vocabulary.
- Or an OPL family ledger tranche for another repo with clean ownership and stale support-doc wording.

### 2026-05-26 active-doc retired-alias wording tranche

本轮覆盖 RCA active plan 与 status 中的 retired alias / no-resurrection wording。目标是清理 OPL Doc Governance doctor 对 active docs 报出的 retired-alias legacy vocabulary warning，同时保留 RCA machine contracts 与 tests 对旧 payload field、retired legacy surface id 和 public alias 复活的 fail-closed guard。

Live truth inputs:

- Core docs and governance: `AGENTS.md`, `TASTE.md`, `docs/docs_portfolio_consolidation.md`, `docs/status.md`, `docs/active/rca-ideal-state-gap-plan.md`.
- Machine contracts: `contracts/physical_source_morphology_policy.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/runtime-program/current-program.json`, and current-program leaf parts that carry retired surface guard refs.
- Tests / guard evidence: `tests/rca-retired-surface-guard.test.ts` and `tests/rca-production-acceptance.test.ts`.
- Doctor evidence: OPL Doc Governance doctor reported two active-path warnings before the edit and `finding_count=0` after the edit.

Fresh semantic result:

- Root cause: active docs used the literal retired vocabulary string as current prose while the live machine contracts correctly classify it as forbidden / negative-guard / tombstone policy. The issue was active-doc wording pollution, not a contract or test failure.
- `contracts/physical_source_morphology_policy.json` still owns the machine-readable policy for retired legacy surface ids and retired compatibility payload fields.
- `tests/rca-retired-surface-guard.test.ts` and `tests/rca-production-acceptance.test.ts` still guard that retired fields stay in negative-guard / forbidden-payload positions and do not become active payload template, success payload, public action key, readiness claim or runtime owner.
- Active docs now use `retired-alias no-resurrection`, `retired-alias resurrection`, or `active public alias` wording where the prose is about current governance, avoiding a doctor false-positive while preserving the no-resurrection meaning.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | `docs/active/rca-ideal-state-gap-plan.md` completion truth, functional/structural gaps, production evidence tail, structure hygiene tail, next prompt; `docs/status.md` current evidence/accounting and naming hygiene tail; live contract/test evidence listed above. | `docs/active/rca-ideal-state-gap-plan.md`; `docs/status.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The active plan and status remain current owner docs; this tranche only removed stale active wording.

Unreviewed docs:

- RCA full repo-wide paragraph coverage remains open outside the touched active plan/status sections and prior covered docs. Product/runtime/delivery/source/policies/references/history bodies still require tranche-by-tranche semantic coverage.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any future active doc wording that reintroduces retired alias terminology as an active public path, active caller, active payload template, success payload, readiness claim, runtime owner, wrapper, facade or compatibility promise is stale pollution.
- Machine contract and test names may still contain `compatibility_alias` where they identify forbidden fields or guard payloads; those are machine truth, not prose pollution.
- RCA still has production evidence tails for memory/lifecycle receipt scaleout, Temporal controlled visual-stage long soak and cross-family repeated no-regression; this wording tranche does not close those gates.

Next tranche write scope:

- RCA product/runtime/delivery/source support docs that mention generated/default caller thinning, domain handler, product-entry/session, runtimeWatch or retired route vocabulary; or an OPL family ledger tranche for another repo with clean ownership.

### 2026-05-26 product-entry support current-caller tranche

本轮覆盖 RCA product-entry support reference 三件套，把 2026-04-12 合同冻结说明读回当前 live CLI/source/tests/contract truth。目标是避免 support brief 继续把 repo-local product status/session/manifest/domain_action_adapter wrapper 写成 RCA 长期 owner，同时保留 direct `invokeProductEntry`、direct `getProductEntrySession` API 与 RCA `domain-handler export|dispatch` target 的当前事实。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/README.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed support docs: `docs/references/product-entry/redcube_product_entry_mvp.md`, `docs/references/product-entry/product_entry_session_continuity.md`, `docs/references/product-entry/opl_framework_hosted_product_entry.md`.
- Machine/source refs: `contracts/runtime-program/redcube-product-entry-mvp.json`, `contracts/runtime-program/product-entry-session-continuity.json`, `contracts/runtime-program/opl-framework-hosted-product-entry.json`, `contracts/runtime-program/current-program.json`, `contracts/physical_source_morphology_policy.json`, `apps/redcube-cli/src/cli-parts/dispatch.ts`, `apps/redcube-cli/src/cli-parts/help.ts`, and `packages/redcube-domain-entry/src/index.ts`.
- Test refs: `tests/product-entry-cases/direct-and-oplHosted-entry.test.ts`, `tests/product-domain-action-api-cases/product-and-operator-surfaces.test.ts`, `tests/product-domain-action-api-cases/definitions-and-delegation.test.ts`, `tests/product-entry-cases/runtime-and-domain_action_adapter-surfaces.test.ts`, and `tests/rca-retired-surface-guard.test.ts`.
- CodeGraph context for product-entry live source found `invokeProductEntry`, `ProductEntryRequest`, and `ProductEntryResponse` under `packages/redcube-domain-entry` / product-entry types.

Fresh semantic result:

- Repo-local `redcube product` currently only keeps `invoke` as the direct domain target; CLI rejects product `status` / `session` / `manifest` / `domain_action_adapter` as generated/default wrapper responsibilities owned by OPL.
- RCA `domain-handler export|dispatch` is the current RCA target for OPL-generated `domain_action_adapter` descriptor / shell consumption. Support docs now name `domain_action_adapter` as OPL-generated descriptor/shell, not an RCA-owned generic wrapper.
- `getProductEntrySession` remains a direct API and OPL generated session-shell continuation target, but the support brief now describes it as a refs-only entry-session domain snapshot adapter rather than a repo-local generic session shell.
- OPL-hosted product entry support now points to `redcube domain-handler export|dispatch` for RCA projection/dispatch target and avoids the obsolete `redcube product domain_action_adapter dispatch` CLI wording.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full paragraph read of the three product-entry support briefs; role/index read of `docs/references/product-entry/README.md`; live source/contract/test refs listed above. | `docs/references/product-entry/redcube_product_entry_mvp.md`; `docs/references/product-entry/product_entry_session_continuity.md`; `docs/references/product-entry/opl_framework_hosted_product_entry.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The product-entry support briefs remain contract-linked support references; stale CLI/caller wording was corrected in place.

Unreviewed docs:

- RCA product-entry support reference bodies are now covered for current-caller / generated-wrapper ownership.
- RCA runtimeWatch/runtime architecture, integration support, delivery/source support and history/reference bodies remain open outside previously covered chunks.
- OPL, MAS, MAG, OMA and App coverage remains open per the OPL family ledger.

Remaining stale / retire candidates:

- Any future support doc wording that treats `redcube product status/session/manifest/domain_action_adapter` as current repo-local CLI surfaces or RCA-owned wrapper owners is stale pollution.
- Any wording that treats OPL-generated `domain_action_adapter` descriptor as RCA-owned generic runtime/workbench/session shell is stale pollution.
- Any session-continuity wording that implies artifact body, visual truth, memory body, review/export verdict or generic session runtime ownership has moved into RCA product-entry continuity is stale pollution.

Next tranche write scope:

- RCA runtimeWatch / runtime architecture support and integration docs that mention OPL generated/default caller thinning, `domain_action_adapter`, operator projection, `runtimeWatch`, or retired route vocabulary.
- Or RCA delivery/source support docs that mention route-run records, artifact lifecycle, source truth, review/repair transport, native-helper envelope or retired route vocabulary.

### 2026-05-26 references support family-scope and memory-locator tranche

本轮覆盖 RCA references 中仍开放的 support bodies，重点是 `docs/references/README.md`、domain memory locator、series governance checklist、executor routing 和 product-entry / integration reference 的当前读法。目标是把 support references 继续锁在 contract-linked support / operator reference / family governance support 角色，避免早期“四仓”治理范围、英文旧 lifecycle header、memory writeback proof、Hermes profile、`domain_action_adapter` 或 OPL handoff wording 回流成当前 active plan、runtime owner、memory body owner、generated wrapper owner、visual ready 或 production ready。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `docs/status.md`, `docs/project.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed references: `docs/references/README.md`, `docs/references/domain_memory_descriptor_locator.md`, `docs/references/governance/series-doc-governance-checklist.md`, `docs/references/rca_executor_routing_config.md`, `docs/references/product-entry/README.md`, all three `docs/references/product-entry/*.md`, and both `docs/references/integration/*.md`.
- Machine refs: `contracts/runtime-program/current-program.json`, `contracts/functional_privatization_audit.json`, `contracts/production_acceptance/rca-production-acceptance.json`, and current-program `domain_memory_descriptor_locator` / controlled memory apply proof refs.
- OPL support truth: OPL status/product docs for the current `OPL Framework -> One Person Lab App -> Foundry Agents` layering and six-repo governance scope.
- Doctor evidence: OPL Doc Governance doctor preflight reported `finding_count=0`, active truth `pass`; this stayed a risk-map input, not semantic proof.

Fresh semantic result:

- `docs/references/domain_memory_descriptor_locator.md` had the only lifecycle metadata drift in the reference root set: it still used an English title / prose purpose shape. It now has Chinese canonical title, `Purpose` / `State` values aligned with support-reference taxonomy, a human-readable machine boundary, and a lifecycle note for `descriptor_proof_contract_landed_runtime_writeback_pending`.
- The memory locator support now explicitly states that OPL may consume locator / provenance / receipt refs but cannot store memory content, choose RCA route, accept/reject memory writeback, issue review/export verdicts, write owner receipt bodies or mutate canonical artifacts.
- `docs/references/governance/series-doc-governance-checklist.md` still described the series governance set as the older four repos. It now states the current six-repo OPL family scope: `one-person-lab`, `one-person-lab-app`, `med-autoscience`, `med-autogrant`, `redcube-ai`, and `opl-meta-agent`, and maps OPL Framework / App / MAS / MAG / RCA / OMA roles without promoting App or OPL to domain truth owner.
- Product-entry and integration support references already matched the current generated/default caller boundary from prior tranches; this pass rechecked them against live contracts and left them unchanged.
- Executor routing remains an opt-in operator reference: default remains `codex_cli`; `hermes_agent` remains explicit non-default proof/backend vocabulary and cannot be written as RCA or OPL default runtime owner.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full read of the reference docs listed above; live contract/core-doc/OPL layering refs listed above. | `docs/references/domain_memory_descriptor_locator.md`; `docs/references/governance/series-doc-governance-checklist.md`; this coverage ledger. |

Archived / tombstoned / deleted docs:

- none. The governed files remain active support references; the correction was lifecycle metadata and series-scope currentness, not a document-path retirement.

Unreviewed docs:

- RCA root/product-entry/integration/executor-routing/memory-locator/governance reference bodies listed above are now covered for current owner, support role and no-resurrection boundaries.
- RCA remaining uncovered bodies are mainly `docs/references/rca-visual-deliverable-agent-ideal-state.md` long north-star body and any future docs created after this tranche. History bodies remain covered according to the Hermes, Phase 2, and history plans/runtime/tombstone tranches above.
- OPL, MAS, MAG and App repo-wide coverage remains open outside already-recorded chunks; OMA README/docs coverage remains covered by the earlier OMA tranche.

Remaining stale / retire candidates:

- Any future reference wording that treats old four-repo governance scope as current, omits One Person Lab App / OPL Meta Agent from OPL family governance, or moves domain truth / owner receipt / artifact authority into OPL/App is stale pollution.
- Any future memory reference wording that lets OPL store memory body, accept/reject writeback, choose RCA route, issue review/export verdict, write owner receipt body, mutate artifacts, or claim runtime writeback complete from descriptor proof alone is stale pollution.
- Any future executor-routing reference wording that treats `hermes_agent`, route-specific Hermes profile, or fallback-with-proof as default executor equivalence, hidden fallback chain, domain ready, production ready, visual ready or export readiness is stale pollution.

Next tranche write scope:

- RCA north-star reference body if future changes reopen it, or switch to OPL / MAS / App uncovered docs. Keep App docs delayed until active release / GUI lanes are safe or explicitly handed to this governance goal.

### 2026-05-26 north-star reference coverage tranche

本轮覆盖 RCA north-star reference 主体 `docs/references/rca-visual-deliverable-agent-ideal-state.md`。目标是确认该文档只承担长期目标态与 owner boundary 参考职责，不承担当前闭合状态、执行顺序、production evidence tail、generated/default caller cutover 或 readiness 证明；当前 truth 继续回到核心五件套、active gap plan 与 machine-readable contracts。

Live truth inputs:

- Core / active docs: `AGENTS.md`, `TASTE.md`, `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/rca-ideal-state-gap-plan.md`, and this governance ledger.
- Reviewed reference: full paragraph read of `docs/references/rca-visual-deliverable-agent-ideal-state.md`.
- Machine refs: `contracts/functional_privatization_audit.json`, `contracts/physical_source_morphology_policy.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/stage_control_plane.json`, and `package.json`.
- Doctor evidence: OPL Doc Governance doctor preflight for RCA reported `finding_count=0`, active truth `pass`; this remained a risk-map input, not semantic proof.

Fresh semantic result:

- The north-star reference already separates target-state boundary from current progress: current completion status, `functional_structure_gap_count`, evidence gaps and execution order are delegated to `docs/active/rca-ideal-state-gap-plan.md`.
- The document matches live contracts on the key owner split: RCA owns visual truth, route truth, review/export verdict, artifact authority, visual memory accept/reject, owner receipt and native helper implementation; OPL owns/generated-hosts generic runtime, queue, wakeup, attempt ledger, workbench, wrapper and refs-only projection surfaces.
- The document correctly treats structural conformance, provider completion, OPL-generated descriptor readiness, transition proof and no-regression refs as non-readiness evidence. It does not claim visual ready, exportable, handoffable, domain ready, production ready or production visual-stage long-soak completion.
- The only direct-route wording that still names ideal `redcube product status / manifest / invoke / session` is explicitly in the ideal target section and is constrained by the same document's current-read note that current repo-local generic wrappers remain OPL generated/default-caller thinning tails. No current CLI surface correction was needed in the north-star body.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Full read of `docs/references/rca-visual-deliverable-agent-ideal-state.md`; support read of core docs, active truth owner, machine contracts and package verification surface listed above. | this coverage ledger only |

Archived / tombstoned / deleted docs:

- none. The north-star reference remains active support with a unique reference role; no body text required rewrite in this tranche.

Unreviewed docs:

- RCA previously covered product-entry / integration / memory / executor / governance references plus history, policy, delivery/source, runtime and active/status chunks remain as recorded above.
- With this tranche, the previously named uncovered RCA reference body `docs/references/rca-visual-deliverable-agent-ideal-state.md` is covered for current owner, support role, target-state boundary and no-readiness-upgrade wording.
- Any RCA docs created or modified after this tranche still require future coverage. OPL, MAS and App repo-wide coverage remains governed by the OPL family ledger.

Remaining stale / retire candidates:

- Future north-star wording that treats target-state examples, ideal direct product commands, OPL descriptor readiness, structural conformance, provider completion, generated/default-caller consumption or proof refs as current CLI availability, visual ready, exportable, handoffable, domain ready, production ready, production visual-stage long-soak evidence, artifact authority transfer or OPL ownership of RCA visual truth is stale pollution.
- Future target-state text that reintroduces RCA-owned generic scheduler, queue, attempt ledger, session/workbench shell, artifact gallery/handoff shell, review/repair transport, workspace/source shell, observability shell, native-helper generic envelope or generated wrapper owner must be rejected unless live contracts/source/tests reopen a narrow authority function with owner receipt and no-forbidden-write proof.

Next tranche write scope:

- Switch to MAS remaining repo-wide coverage or App docs after active release / GUI lanes are safe or explicitly assigned.
- RCA can move toward final inventory reconcile only after confirming no newly created/modified README/docs files remain outside the previously recorded chunks.

### 2026-05-26 final inventory reconcile tranche

本轮对 RCA tracked `README*` 与 `docs/**/*.md` 做 final inventory reconcile。目标是把前序 focused tranches 中的分组覆盖记录转成当前 inventory 的 closeout statement：每个当前 tracked `README*`、`docs/**/*.md`、以及 repo-local support README 已落入 current truth、active plan、support reference、policy/spec、history/provenance、tombstone 或 prompt/support asset 角色。本轮不新增 readiness 结论，不关闭 OPL series 全局 `/goal`，也不把 RCA docs coverage 写成 RCA visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak complete。

Fresh live truth inputs:

- RCA `AGENTS.md`, `TASTE.md`, root `README.md`, `README.zh-CN.md`, `docs/README.md`, core five, `docs/active/rca-ideal-state-gap-plan.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, and this governance ledger.
- Inventory scripts over tracked repo-root `README*`, `docs/**/*.md`, and all tracked README files under repo support roots.
- Support README spot checks: `agent/README.md`, `contracts/README.md`, `runtime/README.md`, `config/local/README.md`, and xiaohongshu prompt asset README files under `prompts/node/aligned/自动小红书/**/README.md`.
- Doctor evidence: OPL Doc Governance doctor reported `finding_count=0`, active truth `pass`; this remained a shape/risk input, not semantic proof.

Fresh semantic result:

- RCA current root/docs inventory is `91` tracked paths for repo-root `README*` plus `docs/**/*.md`.
- RCA current all-README/docs inventory is `97` tracked paths when adding repo-local support README files outside `docs/`.
- Prior focused tranches already covered the current semantic groups: active/status, product-entry references, runtime/integration support, delivery/source support, policy support, references including north-star, Hermes history, Phase 2 history, and plans/runtime/tombstone history.
- This reconcile additionally confirms root bilingual README entries, active/product/public/specs indexes, `agent/README.md`, `contracts/README.md`, `runtime/README.md`, `config/local/README.md`, and xiaohongshu prompt asset README files have durable single roles. The prompt README files are prompt asset support, not active runtime truth, production evidence or generated wrapper owners.
- The remaining apparent gaps from exact path-string matching were caused by grouped coverage wording such as `all docs/history/hermes/*.md bodies`, `all 17 docs/history/phase-2/*.md bodies`, `docs/references/product-entry/*.md`, and support README roots. They are now folded into this explicit inventory reconcile.

| repo | reviewed docs/sections | edited docs |
| --- | --- | --- |
| `redcube-ai` | Final reconcile over 91 tracked repo-root `README*` / `docs/**/*.md` paths and 97 tracked all-README/docs paths including repo-local support README files; support read of core docs, active truth owner, target-state reference, support README roots and doctor output listed above. | this coverage ledger only |

Archived / tombstoned / deleted docs:

- none. This tranche is an inventory/accounting reconcile; prior tranches already routed current truth, support reference, policy/spec and history/tombstone material.

Unreviewed docs:

- `redcube-ai`: none by current tracked repo-root `README*` + `docs/**/*.md` inventory reconcile. Future new README/docs files, or substantive edits after this tranche, must be covered by a new ledger entry.
- OPL series global coverage remains open for MAS repo-wide coverage and App docs coverage according to the OPL family ledger. This RCA closeout does not close the global `/goal`.

Remaining stale / retire candidates:

- RCA: no current inventory path remains uncovered by role. Remaining RCA risk is future new-doc drift, stale wording introduced after this reconcile, or live source/contract/read-model changes that make an already-covered section stale.
- Historical `managed`, `gateway`, `runtime`, `session`, `domain_action_adapter`, Hermes-first, bridge/frontdoor/federation and old route wording remain allowed only in history/provenance/tombstone, semantic-id, negative guard, package/protocol boundary, refs-only adapter, domain handler target or explicit support-reference contexts. They must not return to current docs as public identity, generic runtime owner, generated/default caller owner, visual ready, exportable, handoffable, domain ready or production ready evidence.
- Prompt asset README files under `prompts/node/aligned/自动小红书/**` remain implementation/detail prompt support; if future text turns them into runtime owner, generated wrapper owner, hidden fallback chain, review/export verdict owner or production evidence owner, that is stale pollution.

Next tranche write scope:

- Switch to MAS repo-wide coverage from its remaining uncovered docs if the active owner-route dirty lanes are safe or explicitly assigned.
- Keep App docs delayed until release / GUI lanes are safe or explicitly assigned.

### 2026-05-27 exact path ledger reconcile tranche

本轮覆盖 RCA final inventory reconcile 之后留下的 47 个 exact-path ledger gap。目标是把 grouped coverage 和当前 `README*` / `docs/**/*.md` exact inventory 对齐，避免把“路径没有逐字出现在本地 ledger”误读成未审文档。本轮不新增 readiness 结论，不关闭 OPL series 全局 `/goal`，也不把 RCA docs coverage 写成 RCA visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak complete。

Fresh live truth inputs:

- RCA `AGENTS.md`, `TASTE.md`, root `README.md`, `docs/README.md`, core five, `docs/active/rca-ideal-state-gap-plan.md`, `docs/references/rca-visual-deliverable-agent-ideal-state.md`, `contracts/runtime-program/current-program.json`, `contracts/production_acceptance/rca-production-acceptance.json`, `contracts/functional_privatization_audit.json`, and this governance ledger.
- Current inventory script over repo-root `README*` plus all `docs/**/*.md`, compared against this coverage ledger.
- First-screen / role read of the 47 exact paths missing from the ledger before this tranche:
  - `docs/active/README.md`
  - `docs/active/opl-private-implementation-migration-inventory.md`
  - `docs/decisions.md`
  - `docs/history/hermes/hermes_managed_family_closure_truth.md`
  - `docs/history/hermes/hermes_runtime_capability_extraction_map.md`
  - `docs/history/hermes/hermes_runtime_substrate_activation_package.md`
  - `docs/history/hermes/hermes_runtime_substrate_canonical_closure.md`
  - `docs/history/hermes/hermes_stable_family_closure_truth.md`
  - `docs/history/hermes/upstream_hermes_agent_activation_package.md`
  - `docs/history/hermes/upstream_hermes_agent_fast_cutover_board.md`
  - `docs/history/hermes/upstream_hermes_agent_final_target_shape.md`
  - `docs/history/hermes/upstream_hermes_agent_live_verification_blocker.md`
  - `docs/history/hermes/upstream_hermes_agent_live_verification_closeout.md`
  - `docs/history/hermes/upstream_hermes_agent_service_safe_domain_entry.md`
  - `docs/history/phase-2/phase_2_architecture_boundary_governance.md`
  - `docs/history/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md`
  - `docs/history/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md`
  - `docs/history/phase-2/phase_2_family_parity_autopilot_continuation_board.md`
  - `docs/history/phase-2/phase_2_family_parity_governance_surface_convergence.md`
  - `docs/history/phase-2/phase_2_family_source_truth_consumption_convergence.md`
  - `docs/history/phase-2/phase_2_operator_surface_consistency_hardening.md`
  - `docs/history/phase-2/phase_2_ppt_native_authoring_proof_lane.md`
  - `docs/history/phase-2/phase_2_publication_projection_delivery_contract_convergence.md`
  - `docs/history/phase-2/phase_2_review_export_gate_audit_hardening.md`
  - `docs/history/phase-2/phase_2_runtime_watch_locator_integrity_hardening.md`
  - `docs/history/phase-2/phase_2_source_intake_activation_package_freeze.md`
  - `docs/history/phase-2/phase_2_source_intake_shared_source_truth_baseline.md`
  - `docs/history/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md`
  - `docs/history/phase-2/phase_2_workspace_operator_quickstart_convergence.md`
  - `docs/history/phase-2/ppt_mainline_quality_closeout.md`
  - `docs/history/phase-2/stable_deliverable_manual_test_brief.md`
  - `docs/history/plans/2026-04-08-deep-research-auto-first-product-contract.md`
  - `docs/history/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md`
  - `docs/history/plans/2026-04-09-direct-delivery-longrun-target-state.md`
  - `docs/history/plans/2026-04-09-source-readiness-deep-research-longrun-target-state.md`
  - `docs/history/plans/2026-05-20-doc-lifecycle-governance-audit.md`
  - `docs/history/plans/rca-production-acceptance-readiness-closeout-2026-05-20.md`
  - `docs/history/plans/rca-standard-agent-doc-process-history-2026-05.md`
  - `docs/history/tombstones/retired-managed-product-entry-contract-2026-05-20.md`
  - `docs/history/tombstones/retired-route-narratives-2026-05-11.md`
  - `docs/invariants.md`
  - `docs/product/README.md`
  - `docs/product/human_quickstart.md`
  - `docs/product/private-profile-setup.md`
  - `docs/product/public-github-publish.md`
  - `docs/public/README.md`
  - `docs/specs/README.md`

Fresh semantic result:

- All 47 exact paths already have a durable role through first-screen `Owner` / `Purpose` / `State` / `Machine boundary`, directory index current-read rules, or prior focused tranches. The local gap was exact-path accounting, not stale current-truth prose.
- `docs/active/README.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/decisions.md`, and `docs/invariants.md` remain current support / active inventory / stable policy surfaces. They point machine truth back to contracts, source, CLI/MCP/API behavior, runtime artifacts, owner receipts, artifact locator and RCA-owned review/export gates.
- `docs/product/**`, `docs/public/README.md`, and `docs/specs/README.md` remain active support indexes or guides. They do not define machine-readable runtime truth, mature GUI/WebUI readiness, OPL ownership of visual truth, or production readiness.
- `docs/history/hermes/**`, `docs/history/phase-2/**`, `docs/history/plans/**`, and `docs/history/tombstones/**` remain history / provenance / tombstone surfaces. Their directory indexes and first-screen metadata bind old `managed`, `gateway`, `runtime`, `session`, `domain_action_adapter`, Hermes-first, Phase 2 and closeout wording to dated historical or no-resurrection contexts.
- No RCA prose body required rewrite. This tranche records the 47 exact paths directly, closing the local accounting ambiguity without changing current machine truth.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Edited docs this tranche |
| --- | --- | --- |
| `redcube-ai` | First-screen / role read of the 47 exact paths listed above, with supporting current-boundary read of core docs, active truth plan, ideal-state reference and machine contracts. | this coverage ledger only |

Archived / tombstoned / deleted docs:

- none. The reviewed paths already have legitimate long-term roles as active support, active inventory, current policy, product/public/spec index, history provenance or tombstone.

Unreviewed docs:

- `redcube-ai`: exact-string inventory now has no uncovered repo-root `README*` / `docs/**/*.md` path in the current 91-file scope once this entry is counted. RCA remains part of the larger OPL series goal, and global closure still depends on all six repos.
- Future new RCA README/docs files, or substantive edits after this tranche, must be covered by a new ledger entry.

Remaining stale / retire candidates:

- RCA docs coverage is now exact-path reconciled; remaining RCA work is implementation/evidence/source-purity tail: production evidence scaleout, generated/default-caller thinning, naming/contract hygiene, compatibility-free retirement, and future source/contract/test drift.
- Any future prose that promotes historical Hermes / Phase 2 / managed / gateway / runtime / session / domain_action_adapter wording, product support guides, public/spec indexes, structural conformance, provider completion, OPL projection or zero open worklist into current visual ready, exportable, handoffable, domain ready, production ready, generic runtime owner or OPL-owned RCA visual truth is stale pollution.

Next tranche write scope:

- Switch to App docs only when release / GUI lanes are safe or explicitly handed to this governance goal.
- If App remains unsafe, continue with any newly reopened MAS / OPL / MAG / RCA exact inventory tail caused by later edits; otherwise keep the global `/goal` active and do not mark complete until all six repos' current inventories and ledgers are clean.
