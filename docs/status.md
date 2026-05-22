# RedCube AI 当前状态

Owner: `RedCube AI`
Purpose: `current_status_and_gap_readout`
State: `current_truth`
Machine boundary: 人读状态面。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

更新时间：`2026-05-22`

## 当前角色

`RedCube AI` 是视觉交付 domain agent，也是 OPL-compatible Foundry Agent package。Direct route 仍是 `redcube-ai` app skill / CLI / MCP / Product Entry / service-safe domain entry；OPL-hosted route 可以发现、托管、唤醒和投影 RCA，但必须回到同一套 RCA-owned visual truth、communication strategy、visual direction、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。

OPL Framework 持有通用 stage attempt、provider-backed runtime、typed queue、wakeup、retry/dead-letter、human gate、receipt ledger、operator projection、workspace/source locator、artifact gallery/handoff shell、review/repair transport、generated wrapper 和 App/workbench shell。RCA 当前口径已收敛为 OPL generated/hosted wrapper/session/workbench/generic shell consumer；RCA 只保留 domain handler target、direct entry、refs-only adapter、minimal visual authority function 和 native helper implementation。旧 repo-local managed runtime 物理实现已删除，active source/package/test surface 不再保留内部 managed runtime fixture。

RCA 的标准 OPL Agent semantic pack 已归位到 `agent/`。`agent/prompts/*.md` 是 stage-level canonical prompt policy；`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 Declarative Visual Pack 的 repo-source 语义。`prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 继续作为 detailed implementation prompt assets，由 `agent/prompts/*.md` 定位；`contracts/stage_control_plane.json` 的 `prompt_refs` 只指向 `agent/prompts/*.md`。

`Codex CLI` 是当前第一公民 executor。`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现，不承诺行为或输出质量与 Codex CLI 等价。

当前 acceptance / readiness 口径是 AI-first / executor-first：OPL 搭建 stage-led runtime、queue、receipt ledger、replay / recovery shell 与 operator projection；Codex/default executor 执行视觉阶段；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。合同只固定边界、安全、receipt、replay 和恢复语义，不能把机械 conformance 或 provider completion 升级成视觉判断。

## 当前运行与文档事实

- Direct route 已落地：`RedCube Product Entry -> service-safe domain entry -> executor adapter -> visual-domain truth surfaces`。
- OPL-hosted route 已有合同和 projection：stage control projection、family action catalog、product sidecar export/dispatch、OPL generic primitive consumption、stability read-model consumption、operator evidence readiness projection、workspace receipt inventory projection 和 private functional audit surface。
- RCA 已有 `ppt_deck` 与 `xiaohongshu` image-first 默认路线；HTML/native PPTX 是显式可选路线。`poster_onepager` 仍保持 guarded knowledge poster 边界。
- `contracts/`、runtime-program contracts、product-entry manifest、CLI/MCP 行为、workspace/runtime receipt、artifact locator、review/export gate 与真实交付物证据是机器真相；`docs/**` 只做解释、导航、治理和 provenance。
- Workspace/file lifecycle 当前按 repo-source 与 live/runtime 写集分层：`agent/`、`contracts/`、`runtime/authority_functions/`、`packages/`、`docs/` 只承载 semantic pack、机器合同、authority-function descriptor/receipt refs、domain handler/native helper 和人读治理；真实 workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物进入 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`，不写回开发 checkout。
- RCA repo source 当前只持有 locator、index、schema、receipt ref、restore/retention policy 和 refs-only lifecycle proof；visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 与 owner receipt 继续由 RCA owner chain 授权。OPL 上收通用 lifecycle primitive、scheduler/runner/session store/workbench shell，RCA 私有 runtime adapter 不能反向定义长期结构。
- 过程性 dated follow-through、closeout tranche 和 proof 命令摘要进入 `docs/history/`；当前目标态与 gap 只读 [RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md) 和 [RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)。

## 当前功能/结构闭合状态

当前功能/结构差距按 active plan 维护：

`functional_structure_gap_count=0`

已闭合为标准 OPL consumer 口径的 8 项：`opl_generated_surface_production_consumption`、`repo_local_wrapper_active_caller_migration`、`focused_hosted_attempt_real_path_cutover`、`artifact_gallery_handoff_shell`、`review_repair_transport`、`opl_app_operator_drilldown`、`workspace_source_lifecycle_receipt_shell`、`legacy_physical_cleanup`。这些闭合表示 RCA 不再声明对应 generic shell/runtime owner，且旧 managed runtime 物理实现已删除；production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable 仍属于证据门。

当前结构闭合依赖 machine surfaces，而不是 docs receipt 流水：

- `agent/` 与 `contracts/stage_control_plane.json` 持有 Declarative Visual Pack、stage prompt policy、runtime event refs、cohort loop refs 和 OPL queue / monitor refs。
- product-entry manifest、family action catalog、product sidecar export/dispatch 和 standard domain-agent skeleton mapping 只向 OPL 暴露 descriptor、domain handler target、refs-only projection、owner receipt shape 与 typed blocker。
- `runtimeWatch` 是 direct review/progress refs-only read model；`runtime_watch` 已从 product sidecar default dispatch 退役。
- `contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**` 是 current-program leaf-level canonical source；`current-program.json` 是 generated read-through snapshot。
- `contracts/production_acceptance/rca-production-acceptance.json` 是 RCA-owned production acceptance surface；它只能记录 owner receipt refs、artifact locator / artifact receipt、review/export gate refs、memory/lifecycle receipt refs、typed blocker refs 和 next verification refs。

当前标准 OPL Agent 结构口径：

- RCA package surface = `agent/` canonical declarative visual pack、family action catalog、stage control projection、service-safe domain entry、domain handler targets、refs-only projections、visual authority functions、Python native helper implementation。
- OPL-owned/generated surface = CLI/MCP/Skill/product-entry/status/session/sidecar/workbench wrapper、generic supervision/session/workbench、provider-backed stage attempt runtime、attempt ledger、retry/dead-letter、artifact gallery/handoff shell、review/repair transport、operator/App shell。
- active RCA source 中不再维护旧 repo-local deliverable runner、run store、DAG scheduler 或 public managed lookup/supervision action。

Physical source morphology 现在按同一标准治理：`agent/` 是 Declarative Visual Pack，`contracts/` 与 runtime-program leaf parts 是机器合同，`packages/` / native helper / product-entry / sidecar / operator evidence 源码只能承担 visual domain handler、minimal authority function、native helper implementation、refs-only adapter、fixture 或 diagnostic。RCA 当前 artifact-heavy 目录不是可复制的新 Agent 通用 scaffold；历史 `managed` 命名只能作为 provenance、semantic-id、retired guard 或 tombstone，不恢复为 active runtime owner 或 compatibility alias。

当前 active source 中仍可见的 `product-entry-session-snapshot-ref-adapter`、direct `runtimeWatch` read model、product sidecar guarded actions、operator evidence/stability projection、native helper envelope、MCP/CLI/product-entry wrapper 和 `@redcube/gateway` package boundary 都不是旧接口兼容承诺。它们只允许作为 refs-only adapter、domain handler target、native helper implementation、fixture、diagnostic 或 package/protocol boundary；generated/default caller parity、domain authority refs preserved、no-regression proof 与 provenance consumer migration 成立后，继续 rename/delete/tombstone，不新增 compatibility alias、facade 或旧 public path。

Product-entry manifest 入口已做一次源码边界收薄：OPL runtime inventory、task lifecycle、automation catalog、skill/operator shell 与 workbench/sidecar projection 组装已进入 `get-product-entry-manifest-parts/shell-projections.ts`，`get-product-entry-manifest.ts` 保持 RCA domain refs 与 manifest assembly。剩余状态仍是 OPL 需继续接管 generic session shell、workbench shell 和 generated sidecar primitive 的默认 caller；这不改变 RCA 持有 visual truth、review/export verdict、artifact mutation authority、owner receipt 和 native helper implementation。

## 当前测试/证据差距

以下是结构闭合后的 production evidence tail，不再计入功能/结构差距：

- 真实 artifact-producing owner receipt。
- visual memory body reuse 和真实 visual pattern memory accepted/rejected receipts。
- 真实 workspace receipt scaleout、跨 workspace retention ledger / inventory 规模化验证；当前 product-entry manifest 的 workspace receipt inventory 已可用显式 `workspace_receipt_scaleout_roots` 聚合多个 workspace 的 body-free receipt refs，并把 `observed_workspace_count` 投给 OPL/App/operator，但仍保持 `workspace_receipt_scaleout_claimed=false` 与 `declares_production_soak_complete=false`。
- Temporal controlled visual-stage long soak 和 provider restart/re-query/retry/dead-letter proof。
- Cross-family repeated no-regression proof。

RCA 当前已有 refs-only evidence accounting 面：operator evidence readiness projection、workspace receipt inventory projection、product sidecar projection、production acceptance surface 和 typed blocker refs 可以让 OPL/App/operator 读取缺口状态。但这些面只关闭 request / workorder accounting，不关闭真实 visual production evidence tail。OPL conformance、readiness clean/observable、OPL hosted/provider completion、replay evidence、cleanup proof、stage evidence receipt 或 domain-dispatch receipt 都不能升级为 RCA visual/export/domain ready。

当前 naming / contract hygiene tail：

- `contracts/runtime-program/managed-product-entry-hardening.json` 是 tombstone-only / semantic-id provenance surface，仍被 current-program、session-continuity 和 provenance tests 消费。
- `product_entry_continuation`、`get_managed_run`、retired managed supervision 与 `product_sidecar_dispatch.runtime_watch` 字符串只作为 retired legacy surface id、tombstone/provenance ref 或 negative dispatch input 存在。
- `session_store_root` / `required_session_store_root` 的 active reader-facing 字段已迁到 `session_continuity_root` / `required_session_continuity_root`；旧 `session store` 词只可留在 forbidden generic-owner role、retired semantic id、tombstone/provenance 或人读解释语境。
- active `formal_entry.internal_surface` 口径已迁为 `domain_entry_protocol_boundary`；`@redcube/gateway` 包名只作为 package/protocol boundary 或 provenance 语境读取，不代表 gateway public identity 或 generic gateway runtime owner。

## 当前物理源码形态差距

- MCP / CLI / product-entry / sidecar / status / session wrapper 仍有 repo-local adapter；目标是 OPL generated/hosted shell default 化，RCA 只保留 service-safe domain entry、domain handler target、receipt、typed blocker 与 visual authority refs。
- `product-entry-session-snapshot-ref-adapter` 只允许是 refs-only snapshot/ref adapter；active manifest / artifact locator / behavior contract 已使用 `session_continuity_root` 命名承认它是 continuity root，不是 generic session store owner；`product_entry_session_snapshot_refs_adapter` 仅保留为当前机器合同 semantic id，目标是 OPL generic session shell 稳定后消除 RCA 持有 session runtime 的误读。
- workspace/run helpers、runtimeWatch、operator evidence、stability projection 和 sidecar guarded actions 只允许输出 refs、receipt、typed blocker、no-regression evidence 或 visual action metadata；OPL generic boundary projection 当前集中在 `product-sidecar-parts/opl-generic-boundaries.ts`，sidecar export projection 当前集中在 `product-sidecar-parts/sidecar-export-projection.ts`。两者都是 refs-only consumer projection / migration input，不是 RCA-owned platform runtime。`WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY`、`RUN_LOCATOR_ENVELOPE_BOUNDARY`、`RUNTIME_WATCH_BOUNDARY` 是审计这些路径的当前 contract anchors，不得扩展成 generic attempt ledger、supervisor、review/repair transport 或 workbench。
- `runtime`、`gateway`、`sidecar`、`managed`、`session` 等历史词继续出现时，必须有 provenance、retired guard、domain adapter 或 refs-only read-model 解释；新增 active caller 不增加 compatibility alias。
- 只保护旧 managed/gateway/runtime/session path 的测试应删除或改写为 current contract、no-resurrection、fail-closed negative input、owner receipt、typed blocker 或 tombstone semantics；不维护旧 public path 兼容。

## 当前保留的 visual authority surfaces

RCA 长期只保留无法声明化的 visual authority surfaces；active machine contract 只使用 `authority_surface_id`。source readiness verdict、communication / visual direction decision、review/export verdict 与 visual memory accept/reject 是 AI-first judgment surface；artifact mutation authorization、owner receipt signer 与 native helper implementation 是 programmatic authority/helper surface，只能依 owner receipt、blocked item、repair target、helper catalog、typed blocker 和 refs 工作。

这些 surfaces 必须遵守 AI-first stage output 边界：故事、视觉方向、页面判断、review verdict 和 repair judgment 由 AI-authored stage artifact 持有；代码只做 validator、materializer、receipt signer、guard 和 refs-only projection。比例、空白、重复、裁切、字段泄漏、导出失败等机械检查只能表达 blocker 与 rerun target，不能替代 visual ready / exportable / handoffable verdict。

## 当前入口与路线

- Public identity：`RedCube AI` Foundry Agent / OPL-compatible visual-deliverable package。
- Direct route：`redcube-ai` app skill、CLI、MCP、`invokeProductEntry`、`getProductEntrySession`、`invokeDomainEntry`。
- OPL-hosted route：OPL discovery 读取 RCA descriptor、family action catalog、stage control projection、memory descriptor 和 sidecar refs，再进入 RCA service-safe domain entry。
- CLI/MCP/session/source/workbench/supervision：默认由 OPL generated/hosted caller 持有通用 wrapper、session shell、source shell、supervision 和 workbench；RCA 侧只暴露 domain handler target、refs-only adapter 或 minimal authority function，旧 repo-local supervision/runtime 只保留在 history/provenance 语境。
- Default visual routes：`ppt_deck` 和 `xiaohongshu` 默认 image-first；native editable PPTX 与 HTML lane 必须显式选择。
- Runtime file boundary：真实 PPT/图片/PDF、receipt 实例、中间产物和导出包属于 workspace / runtime artifact root，不属于开发仓源码目录。

## 当前不能声明

- 不能声明 RCA 已完成 production visual-stage long soak。
- 不能把 OPL provider completion、transition hosted-attempt fixture、no-regression evidence、focused receipt proof、stage evidence receipt 或 domain-dispatch receipt 写成 RCA visual ready、exportable、handoffable 或 artifact-producing owner receipt。
- 不能把 OPL generated/hosted surface consumption 写成 production visual-stage long soak、artifact-producing owner receipt 或 visual ready/exportable/handoffable。
- 不能把 OPL legacy cleanup dry-run / apply / verify ready 写成 production evidence tail 已完成；它只证明 cleanup proof refs 可被 OPL gate / refs-only ledger 消费。
- 不能写成 OPL 持有 RCA visual truth、canonical artifact、review/export verdict、artifact mutation permission 或 visual memory body。
- 不能把 RCA 当前 artifact-heavy 物理目录写成可直接复制的新 Agent 通用 scaffold。
- 不能恢复 gateway/frontdoor/federation/Hermes-first/local-manager/bridge residue 为 active public entry、runtime owner 或 compatibility alias。

## 当前验证口径

- 测试分组唯一机器可读入口是 `scripts/test-registry.ts`；`scripts/run-test-group.ts` 从注册表推导 smoke、fast、meta、integration、full 等执行组，并 fail-closed 拒绝未登记的根级测试文件。
- `scripts/verify.sh` 与 `scripts/run-test-group.ts` 先执行 `scripts/repo-hygiene.sh`；tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json`。
- 旧 gateway/frontdoor/Hermes-default 等污染 guard 只覆盖源码、contracts、plugins、scripts、tests、tools 与 Python helper 等机器 / 源码面；`README*` 与 `docs/**` 是人读 prose，不作为测试断言对象。

## 下一跳

- 目标态：[RedCube AI 理想目标态](./references/rca-visual-deliverable-agent-ideal-state.md)
- 差距与顺序：[RCA 理想目标态差距与完善计划](./active/rca-ideal-state-gap-plan.md)
- 文档治理：[RCA 文档组合治理](./docs_portfolio_consolidation.md)
- 历史归档：[历史索引](./history/README.md)
