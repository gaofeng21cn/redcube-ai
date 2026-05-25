# RedCube AI 当前状态

Owner: `RedCube AI`
Purpose: `current_status_and_gap_readout`
State: `current_truth`
Machine boundary: 人读状态面。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

更新时间：`2026-05-25`

## 当前角色

`RedCube AI` 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 当前口径已收敛为 OPL generated/hosted wrapper/session/workbench/generic shell consumer；RCA 只保留 domain handler target、direct entry、refs-only adapter、minimal visual authority function 和 native helper implementation。旧 repo-local managed runtime 物理实现已删除，active source/package/test surface 不再保留内部 managed runtime fixture。

RCA 的标准 OPL Agent semantic pack 已归位到 `agent/`。`agent/prompts/*.md` 是 stage-level canonical prompt policy；`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 Declarative Visual Pack 的 repo-source 语义。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 继续作为 detailed implementation prompt assets，由 `agent/prompts/*.md` 定位；`contracts/stage_control_plane.json` 的 `prompt_refs` 只指向 `agent/prompts/*.md`。

`Codex CLI` 是当前第一公民 executor。`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现，不承诺行为或输出质量与 Codex CLI 等价。

当前 acceptance / readiness 口径是 AI-first / executor-first：OPL 搭建 stage-led runtime、queue、receipt ledger、replay / recovery shell 与 operator projection；Codex/default executor 执行视觉阶段；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。合同只固定边界、安全、receipt、replay 和恢复语义，不能把机械 conformance 或 provider completion 升级成视觉判断。

## 当前运行与文档事实

- Direct route 已落地：`RedCube Product Entry -> service-safe domain entry -> executor adapter -> visual-domain truth surfaces`。
- OPL-hosted route 已有合同和 projection：stage control projection、family action catalog、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor refs、OPL generic primitive consumption、stability read-model consumption、operator evidence readiness projection、workspace receipt inventory projection 和 private functional audit surface。
- RCA 已有 `ppt_deck` 与 `xiaohongshu` image-first 默认路线；HTML/native PPTX 是显式可选路线。`poster_onepager` 仍保持 guarded knowledge poster 边界。
- `contracts/`、runtime-program contracts、product-entry manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 与真实交付物证据是机器真相；`docs/**` 只做解释、导航、治理和 provenance。
- Workspace/file lifecycle 当前按 repo-source 与 live/runtime 写集分层：`agent/`、`contracts/`、`runtime/authority_functions/`、`packages/`、`docs/` 只承载 semantic pack、机器合同、authority-function descriptor/receipt refs、domain handler/native helper 和人读治理；真实 workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物进入 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`，不写回开发 checkout。
- RCA repo source 当前只持有 locator、index、schema、receipt ref、restore/retention policy 和 refs-only lifecycle proof；visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 与 owner receipt 继续由 RCA owner chain 授权。OPL 上收通用 lifecycle primitive、scheduler/runner/session store/workbench shell，RCA 私有 runtime adapter 不能反向定义长期结构。
- 过程性 dated follow-through、closeout tranche 和 proof 命令摘要进入 `docs/history/`；当前目标态与 gap 只读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md) 和 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。

## 当前功能/结构闭合状态

当前功能/结构差距按 active plan 维护。历史 read-model 中的 `functional_structure_gap_count=0` 只说明旧 repo-local managed runtime / generic owner 问题已经分类并删除了核心实现，不表示 strict source-purity 已物理完成：

`functional_structure_gap_count=0` = legacy managed runtime owner closed, strict wrapper/source-purity cutover still pending

已闭合为标准 OPL consumer 口径的 8 项：`opl_generated_surface_production_consumption`、`repo_local_wrapper_active_caller_migration`、`focused_hosted_attempt_real_path_cutover`、`artifact_gallery_handoff_shell`、`review_repair_transport`、`opl_app_operator_drilldown`、`workspace_source_lifecycle_receipt_shell`、`legacy_physical_cleanup`。这些闭合表示 RCA 不再声明对应 generic shell/runtime owner，且旧 managed runtime 物理实现已删除；它不表示 active CLI/MCP/product-entry/session/domain_action_adapter/runtimeWatch/operator projection/neutral route-run record adapter 已是最终标准智能体源码。Strict purity 的完成口径是 OPL generated/default caller 接管后删除或收薄 repo-local generic wrapper，只保留 visual handler、authority function、native helper 和 machine-readable contracts。Production visual-stage long soak、visual ready、exportable 或 handoffable 仍属于证据门。Artifact-producing owner receipt 槽位已由 `contracts/production_acceptance/rca-production-acceptance.json` 里的 body-free RCA-owned receipt refs 关闭，但该 closure 不能升级成 visual/export/production ready。

当前结构闭合依赖 machine surfaces，而不是 docs receipt 流水：

- `agent/` 与 `contracts/stage_control_plane.json` 持有 Declarative Visual Pack、stage prompt policy、runtime event refs、cohort loop refs 和 OPL queue / monitor refs。
- product-entry manifest、family action catalog、RCA `domain-handler export|dispatch` target、OPL-generated `domain_action_adapter` descriptor refs 和 standard domain-agent skeleton mapping 只向 OPL 暴露 descriptor、domain handler target、refs-only projection、owner receipt shape 与 typed blocker。
- `runtimeWatch` 是 direct review/progress refs-only read model；`runtime_watch` 已从 generated `domain_action_adapter` default dispatch 退役。
- `contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**` 是 current-program leaf-level canonical source；`current-program.json` 是 generated read-through snapshot。
- `contracts/production_acceptance/rca-production-acceptance.json` 是 RCA-owned production acceptance surface；它只能记录 owner receipt refs、artifact locator / artifact receipt、review/export gate refs、memory/lifecycle receipt refs、typed blocker refs 和 next verification refs。

当前标准 OPL Agent 结构目标口径：

- RCA package surface = `agent/` canonical declarative visual pack、family action catalog、stage control projection、service-safe domain entry、domain handler targets、visual authority functions、Python native helper implementation，以及必要 body-free receipt / typed blocker refs。
- OPL-owned/generated surface = CLI/MCP/Skill/product-entry/status/session/domain_action_adapter/workbench wrapper、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell；RCA active/default target 命名为 `domain-handler export|dispatch`。
- active RCA source 中不再维护旧 repo-local deliverable runner、run store、DAG scheduler 或 public managed lookup/supervision action。

Physical source morphology 现在按同一标准治理：`agent/` 是 Declarative Visual Pack，`contracts/` 与 runtime-program leaf parts 是机器合同，`packages/` / native helper / product-entry / domain_action_adapter / operator evidence 源码只能承担 visual domain handler、minimal authority function、native helper implementation、refs-only adapter、fixture、diagnostic 或 package/protocol boundary。RCA 当前 artifact-heavy 目录不是可复制的新 Agent 通用 scaffold；历史 `managed`、`runtime`、`gateway`、`session`、`domain_action_adapter` 命名只能按 `contracts/physical_source_morphology_policy.json` 中的 `legacy_name_allowance` 明确声明为 machine contract ref、package/protocol boundary、service-safe domain entry、semantic id、provenance/tombstone、negative guard、refs-only read model、domain handler target、visual authority/native helper path 或 locator protocol boundary，且必须同时禁用兼容别名、public identity 和 generic owner。

当前 active source 中仍可见的 `product-entry-continuity-ref-adapter`、direct `runtimeWatch` read model、domain handler guarded actions、operator evidence/stability projection、native helper envelope、MCP/CLI/product-entry wrapper 和 `@redcube/domain-entry` package boundary 都不是旧接口兼容承诺。它们只允许作为 refs-only adapter、domain handler target、native helper implementation、fixture、diagnostic 或 package/protocol boundary；`contracts/physical_source_morphology_policy.json` 已把 CLI direct adapter 分类为 `redcube_cli_domain_entry_adapter`，并要求 `runtime`、`gateway`、`session`、`domain_action_adapter` 词只在 service-safe domain entry、domain handler target、refs-only read model、OPL-generated descriptor 或 package/protocol boundary 语境中出现。generated/default caller parity、domain authority refs preserved、no-regression proof 与 provenance consumer migration 成立后，继续 rename/delete/tombstone，不新增兼容别名、facade 或旧 public path。

Product-entry manifest、operator evidence 和 shell catalog 当前只作为 domain refs assembly、refs-only projection 和 OPL generated/default caller thinning tail 读取。RCA source shape 的 legacy owner 分类已 landed；strict purity 剩余状态是 OPL 继续默认化 generic session shell、workbench shell、generated `domain_action_adapter` descriptor primitive、Agent Executor Adapter 与 attempt ledger 的 caller，并在 cutover 后删除 repo-local wrapper / compatibility path。RCA active/default repo-local target 是 `domain-handler export|dispatch`，不能把 repo-local adapter 写成长期标准组成。

Executor runtime protocol 当前是 RCA route-level executor policy、receipt refs 与 neutral refs-only route-run record materialization 的迁移输入，不是新的长期 generic run store。旧 `startHermesRun` / `completeHermesRun` / event API 已收薄为 route-run 命名；Hermes-Agent 只保留为显式 opt-in executor/proof backend。`codex_executor_adapter` 已在 functional privatization audit 中显式声明 `semantic_equivalence_status=cleared_by_boundary`，并给出 route-policy boundary proof、typed blocker ref 与 no-forbidden-write/no-regression ref；这只关闭 OPL drilldown 对 RCA executor adapter 的语义等价 review 歧义。OPL attempt shell parity、Agent Executor Adapter default caller、runtime record/event log、stale attempt audit read model 和 physical delete 仍是 bridge-exit / physical morphology 尾项，不是 production visual evidence。OPL 仍需把 Agent Executor Adapter、attempt ledger、runtime record/event log 和 stale attempt audit read model 默认化后才能继续退役该 adapter。

## 当前测试/证据差距

以下是结构闭合后的 production evidence tail，不再计入功能/结构差距：

- Artifact-producing owner receipt refs 已由 RCA production acceptance surface 关闭为 body-free `domain_receipt` / artifact / review-export refs；它不声明 visual ready、exportable、handoffable 或 production soak complete。
- visual memory body reuse refs 已落地；仍需真实 visual pattern memory accepted/rejected receipts、writeback receipt 和 lifecycle scaleout。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证；当前 product-entry manifest/status、domain-handler export、product session surface 与 CLI read surfaces 已可用显式 `workspace_receipt_scaleout_roots` / `--workspace-receipt-scaleout-root` 聚合多个 workspace 的 body-free receipt refs，并把 `observed_workspace_count` 投给 OPL/App/operator，但仍保持 `workspace_receipt_scaleout_claimed=false` 与 `declares_production_soak_complete=false`。
- Temporal controlled visual-stage long soak 和 provider restart/re-query/retry/dead-letter proof。
- Cross-family repeated no-regression proof。

RCA 当前已有 refs-only evidence accounting 面：operator evidence readiness projection、workspace receipt inventory projection、domain handler projection、production acceptance surface、typed blocker refs 和 `production_evidence_tail_workorder` 可以让 OPL/App/operator 读取缺口状态与下一步执行顺序。Production acceptance 已关闭 artifact-producing owner receipt 槽位，并在 `production_evidence_scaleout_refs` 中显式输出 OPL owner-payload group 可消费的 `domain_owner_receipt_refs`、`owner_chain_refs`、`no_regression_evidence_refs`、`typed_blocker_refs`、success / typed-blocker payload path、required return shapes 和 legacy alias；`production_evidence_tail_workorder` 只把 owner-chain apply、memory/lifecycle receipt scaleout、Temporal controlled visual-stage long-soak 和 cross-family repeated no-regression 串成 body-free typed-blocker work items。这只表示 refs-only payload shape 和 work order 可被 OPL 读取，不声明 visual ready、exportable、handoffable、domain ready 或 production soak complete。剩余 memory/lifecycle scaleout、Temporal long-soak 与 cross-family repeated no-regression 仍保持 open evidence tail。OPL conformance、readiness clean/observable、OPL hosted/provider completion、replay evidence、cleanup proof、stage evidence receipt、domain-dispatch receipt 或 workorder item completion 都不能升级为 RCA visual/export/domain ready。

OPL expected receipt / monitor freshness handoff 的 forbidden payload policy 已与 RCA production acceptance 对齐：`visual truth body`、review/export verdict body、artifact blob/body、memory body、generic runtime state 和 retired managed runtime alias negative-guard field 都只能作为阻断项读取。`contracts/physical_source_morphology_policy.json` 现在用 `retired_compatibility_payload_field_policy` 约束旧 `managed_runtime_compatibility_alias` 字段只能出现在 forbidden payload / forbidden receipt negative-guard 字段和 policy 自身声明位置；它不是 active public alias、public action key、domain_action_adapter template、success payload field、production readiness claim 或 runtime owner。

当前 naming / contract hygiene tail：

- `contracts/runtime-program/managed-product-entry-hardening.json` 是 tombstone-only / semantic-id provenance surface，仍被 current-program、session-continuity 和 provenance tests 消费。
- `product_entry_continuation`、`get_managed_run`、retired managed supervision 与 `domain_action_adapter_dispatch.runtime_watch` 字符串只作为 retired legacy surface id、tombstone/provenance ref 或 negative dispatch input 存在。
- `contracts/physical_source_morphology_policy.json` 现在用 `retired_legacy_surface_id_pointer_policy` 约束 retired legacy surface id 只能出现在聚合合同与 current-program leaf snapshot 的 `physical_deletion_guard.retired_legacy_surface_ids` 或 `retired_no_resurrection_guards.retired_legacy_surface_id` 位置；这些位置只表达 tombstone/provenance，不是 active callable path、retired-alias resurrection 或 production readiness claim。
- `managed_runtime_compatibility_alias` 现在有独立 `retired_compatibility_payload_field_policy` 与 focused guard 扫描 `contracts/**/*.json`；允许位置仅限 `forbidden_payload_fields`、`forbidden_receipt_fields` 和 policy 声明，不能回到 active payload template 或 success payload。
- `session_store_root` / `required_session_store_root` 的 active reader-facing 字段已迁到 `session_continuity_root` / `required_session_continuity_root`；旧 `session store` 词只可留在 forbidden generic-owner role、retired semantic id、tombstone/provenance 或人读解释语境。
- active `formal_entry.internal_surface` 口径已迁为 `domain_entry_protocol_boundary`；`@redcube/domain-entry` 包名只作为 machine-guarded package/protocol boundary 或 provenance 语境读取，不代表 gateway public identity 或 generic gateway runtime owner。
- active runtime topology 协议字段已迁为 `domain_entry_protocol_role=visual_deliverable_domain_entry_protocol_boundary`；旧 `gateway_role` / `visual_deliverable_domain_gateway` 不再作为 active protocol 字段或值保留。
- active product-entry manifest 的 `formal_entry.retired_internal_surface_ids` 已从裸 `gateway` 降为 `retired_gateway_protocol_boundary_public_entry`；这是 tombstone semantic id，不是 public entry、callable alias 或 compatibility surface。
- active MCP server initialization identity 已收口为 `redcube-ai`；这只清理 reader-facing `gateway` 命名泄漏，不改变 `@redcube/domain-entry` package/protocol boundary，也不由 MCP identity 本身声明新的 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- active product-entry status / manifest / CLI help 的 operator-facing OPL-hosted handoff 口径已收敛为 `framework-side handoff contract`；`bridge contract` 只允许继续作为 contracts/provenance/history 中的 bridge-exit 语境，不作为当前入口说明。

## 当前物理源码形态收口与尾项

- MCP / CLI / product-entry / domain_action_adapter / status / session wrapper 的 repo-local surface 只按 service-safe domain entry、domain handler target、operator help projection、refs-only adapter 或 migration input 分类，不是 generated CLI wrapper owner、generic workbench owner、generic session runtime owner 或 generic gateway runtime owner。OPL generated/hosted shell 是 default caller 目标；RCA 只保留 service-safe domain entry、domain handler target、receipt、typed blocker 与 visual authority refs。Default caller parity 成立后，repo-local wrapper / facade / alias / compatibility path 直接删除或只留 history/provenance。
- `product-entry-continuity-ref-adapter` 只允许是 refs-only snapshot/ref adapter；active manifest / artifact locator / behavior contract 已使用 `session_continuity_root` 命名承认它是 continuity root，不是 generic session store owner；`product_entry_continuity_refs_adapter` 仅保留为当前机器合同 semantic id，剩余动作是随着 OPL generic session shell 默认化继续收薄 RCA refs adapter。
- workspace/run helpers、runtimeWatch、operator evidence、stability projection 和 domain handler guarded actions 只允许输出 refs、receipt、typed blocker、no-regression evidence 或 visual action metadata；OPL generic boundary projection 当前集中在 `domain-action-adapter-parts/opl-generic-boundaries.ts`，domain handler export projection 当前集中在 `domain-action-adapter-parts/domain_action_adapter-export-projection.ts` 作为内部 migration/provenance implementation refs，operator evidence accounting 当前集中在 `get-product-entry-manifest-parts/operator-evidence-refs.ts` 与 `operator-evidence-readiness.ts`。这些都是 refs-only consumer projection / migration input，不是 RCA-owned platform runtime。`WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY`、`RUN_LOCATOR_ENVELOPE_BOUNDARY`、`RUNTIME_WATCH_BOUNDARY` 是审计这些路径的当前 contract anchors，不得扩展成 generic attempt ledger、supervisor、review/repair transport 或 workbench。
- Large-surface scan 结论记录在 `privatized_functional_module_audit.fresh_large_private_surface_scan`：tracked TS/JS/Python 源码没有超过 `1500` 行，且没有低风险的大型 generic private control plane 可自然代码拆分。候选文件的保留理由、OPL 应接管的 generic shell 和迁移门以 machine-readable inventory 为准；status 不保存 scan 明细。
- `runtime`、`gateway`、`domain_action_adapter`、`managed`、`session` 等历史词继续出现时，必须有 `legacy_name_allowance` 机器解释，且只能落在 provenance、retired guard、domain adapter、refs-only read-model、package/protocol boundary、machine contract ref、semantic id、visual authority/native helper path 或 locator protocol boundary；新增 active caller 不增加兼容别名。
- 只保护旧 managed/gateway/runtime/session path 的测试应删除或改写为 current contract、no-resurrection、fail-closed negative input、owner receipt、typed blocker 或 tombstone semantics；不维护旧 public path 兼容。

## 当前保留的 visual authority surfaces

RCA 长期只保留无法声明化的 visual authority surfaces；active machine contract 只使用 `authority_surface_id`。source readiness verdict、communication / visual direction decision、review/export verdict 与 visual memory accept/reject 是 AI-first judgment surface；artifact mutation authorization、owner receipt signer 与 native helper implementation 是 programmatic authority/helper surface，只能依 owner receipt、blocked item、repair target、helper catalog、typed blocker 和 refs 工作。

这些 surfaces 必须遵守 AI-first stage output 边界：故事、视觉方向、页面判断、review verdict 和 repair judgment 由 AI-authored stage artifact 持有；代码只做 validator、materializer、receipt signer、guard 和 refs-only projection。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前入口与路线

- Public identity：`RedCube AI` Foundry Agent / OPL-compatible visual-deliverable package。
- Direct route：`redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`getProductEntrySession`、`invokeDomainEntry`。
- OPL-hosted route：OPL discovery 读取 RCA descriptor、family action catalog、stage control projection、memory descriptor 和 domain_action_adapter refs，再进入 RCA service-safe domain entry。
- CLI/MCP/session/source/workbench/supervision：默认由 OPL generated/hosted caller 持有通用 wrapper、session shell、source shell、supervision 和 workbench；RCA 侧只暴露 domain handler target、refs-only adapter 或 minimal authority function，旧 repo-local supervision/runtime 只保留在 history/provenance 语境。
- Default visual routes：`ppt_deck` 和 `xiaohongshu` 默认 image-first；native editable PPTX 与 HTML lane 必须显式选择。
- Runtime file boundary：真实 PPT/图片/PDF、receipt 实例、中间产物和导出包属于 workspace / runtime artifact root，不属于开发仓源码目录。

## 当前不能声明

- 不能声明 RCA 已完成 production visual-stage long soak。
- 不能把 OPL provider completion、transition hosted-attempt fixture、no-regression evidence、focused receipt proof、stage evidence receipt 或 domain-dispatch receipt 写成 RCA visual ready、exportable、handoffable 或 production soak complete；artifact-producing owner receipt 只能按 RCA production acceptance surface 中的 body-free receipt refs 读取。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、visual ready、exportable、handoffable 或新的 artifact-producing owner receipt。
- 不能把 OPL legacy cleanup dry-run / apply / verify ready 写成 production evidence tail 已完成；它只证明 cleanup proof refs 可被 OPL gate / refs-only ledger 消费。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway、retired public entry、federation、旧 Hermes 优先口径、local-manager 或 bridge residue 为 active public entry、runtime owner 或兼容别名。

## 当前验证口径

- 测试分组唯一机器可读入口是 `scripts/test-registry.ts`；`scripts/run-test-group.ts` 从注册表推导 smoke、fast、meta、integration、full 等执行组，并 fail-closed 拒绝未登记的根级测试文件。
- `scripts/verify.sh` 与 `scripts/run-test-group.ts` 先执行 `scripts/repo-hygiene.sh`；tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json`。
- 旧 gateway、retired public entry、Hermes-default 等污染 guard 只覆盖源码、contracts、plugins、scripts、tests、tools 与 Python helper 等机器 / 源码面；`README*` 与 `docs/**` 是人读 prose，不作为测试断言对象。

## 下一跳

- 目标态：[RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md)
- 差距与顺序：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)
- 文档治理：[RCA 文档组合治理](./docs_portfolio_consolidation.md)
- 历史归档：[历史索引](./history/README.md)
