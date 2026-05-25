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
