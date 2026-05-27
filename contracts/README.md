# 合同目录说明

Owner: `RedCube AI`
Purpose: `machine_contract_index`
State: `active_support`
Machine boundary: 本文是人读合同索引。机器真相继续归本目录下的 JSON contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和验证命令输出；本文不作为机器接口。

这个目录只保留 machine-readable contract surface。

- narrative 协作规则看仓库根 `AGENTS.md`
- 默认人类/AI 入口看 `README*` 与 `docs/README*`，其中 `RedCube AI Foundry Agent`、direct route 与单一 `redcube-ai` app skill 是第一公开主语
- 稳定运行边界看 `docs/policies/runtime_operating_model.md`

当前保留的 repo-tracked machine-readable mainline truth：

- `domain_descriptor.json`、`pack_compiler_input.json`、`generated_surface_handoff.json`、`action_catalog.json`、`stage_control_plane.json`、`memory_descriptor.json`、`artifact_locator_contract.json`、`owner_receipt_contract.json`、`functional_privatization_audit.json`、`private_functional_surface_policy.json`：OPL standard domain-agent pack compiler / generated interfaces 的 root contract 输入。它们由 RCA-owned canonical action/stage metadata、locator/receipt policy 与 functional privatization audit 投影生成；OPL 只据此生成 CLI/MCP/Skill/product-entry/tool descriptors，包括 `domain_action_adapter` descriptor。RCA 本地 CLI、MCP/product-entry commands、`invokeDomainEntry`、`domain-handler export|dispatch` 和 local scripts 继续作为 action target / authority function；OPL 不持有 RCA visual truth、review/export verdict、artifact authority、visual memory body、owner receipt 或 domain handler。
- `agent_lab_handoff.json`、`production_acceptance/rca-goal-workflow-agent-lab-suite.json` 与 `production_acceptance/rca-ppt-three-route-agent-lab-suite.json`：最小 `/goal` 与 PPT 三技术路线 AgentLab / OMA handoff surface。`agent_lab_handoff.json` 让 OMA `agent:evidence` / `improve:external-suite` 读取 RCA 标准 target-agent handoff；两个 production acceptance suite 是 OPL `agent-lab run --suite ... --json` 可直接消费的顶层 external suite。它们都只投递 refs、receipt shape、typed blocker、artifact sample refs 和 no-forbidden-write proof，不携带 visual truth、artifact body、memory body、review/export verdict 或 owner receipt body。
- `production_acceptance/rca-workspace-receipt-scaleout-evidence-20260528.json`：RCA workspace receipt scaleout 的 repo-tracked evidence snapshot，记录 2026-05-28 6 个 runtime-state workspace / 36 条 body-free receipt refs 的可复验读数、source export provenance 和 authority boundary。它只冻结 refs、计数与 forbidden-write flags；本机 runtime export 路径只作为 provenance，不是 portable contract input，不声明 visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。
- `runtime-program/ppt-image-first-quality-nonregression.json`、`runtime-program/ppt-html-route-quality-nonregression.json`、`runtime-program/ppt-native-pptx-quality-nonregression.json`：`ppt_deck` 三技术路线 AgentLab 质量输入合同。三者都是 standard suite input / refs-only / read-only surface，只允许 OPL AgentLab 存储和比较 route policy、runtime read-model、quality gate 与 forbidden-authority refs；AgentLab score 不是 RCA visual verdict，也不能声明 visual ready、exportable、handoffable、production soak complete，不能写 artifact body、memory body、owner receipt body 或切换默认 route。
- `runtime-program/current-program.index.json` 与 `runtime-program/current-program-parts/**`：当前 active mainline pointer 的 leaf-level canonical source。`current-program.json` 保留为既有 consumer 的 generated read-through snapshot，必须与 index 中每个 leaf ref 在 JSON pointer 层完全一致；大对象和数组由 `scripts/sync-current-program-leaf-index.ts` 递归拆分，避免把巨型 section 文件变成第二 truth owner。维护时运行 `npm run contracts:current-program:sync` 生成 index/parts，运行 `npm run contracts:current-program:check` 校验已跟踪 leaf refs 与聚合快照一致。
- `runtime-program/current-program.json`：当前 active mainline pointer 的聚合快照，包含 OPL stage-led hosted integration / provider-backed family runtime 边界与 `TypeScript + Python` 实现目标；它是 read-through snapshot，不是 canonical edit surface。新增或修改 current-program 内容时必须同步生成 indexed leaf source，并通过 `contracts:current-program:check` 与 `runtime-program-provenance` 测试证明一致性。
- `runtime-program/current-program.json#/product_release_metadata`：`RedCube AI Foundry Agent` 的产品层发布 metadata，声明它是 built on `OPL Framework` 的 OPL-compatible package，并把 single app skill、service-safe domain entry、RCA domain handler target、OPL-generated `domain_action_adapter` descriptor/projection 与 stage control projection 归入同一发布形态；该 metadata 不持有 visual truth、review/export verdict 或 artifact authority
- `runtime-program/current-program.json#/product_release_metadata/opl_substrate_adapter_export` 与 `runtime-program/opl-family-contract-adoption.json#/opl_substrate_adapter_export`：RCA domain-owned OPL substrate adapter/export 合同；只导出 opaque/index-only workspace/source/artifact/memory refs 与 lifecycle/operator projection refs，不导出 visual truth、layout/review/export verdict、deliverable artifact body、visual memory body 或 owner receipt authority
- `runtime-program/upstream-hermes-agent-final-target-shape.json`：独立 RCA domain-agent 在显式 hosted runtime carrier 语境下的目标形态冻结件（direct route 与 OPL-hosted handoff 共用同一下游 domain entry）
- `runtime-program/redcube-product-entry-mvp.json`：当前 direct product-entry service surface 冻结件
- `runtime-program/opl-framework-hosted-product-entry.json`：当前 OPL-hosted stage runtime handoff / integration 冻结件
- `runtime-program/product-entry-session-continuity.json`：当前 product-entry session continuity 冻结件
- `runtime-program/managed-product-entry-hardening.json`：旧 `managed` contract tombstone；只保留 provenance / semantic-id，不提供 callable alias 或 compatibility wrapper
- `product_status` 等 product-entry command keys 只作为单一 `redcube-ai` app skill 下的 machine-readable overview / intake / entry-shell contract 保留；它们不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。
- `runtime-program/rca-executor-routing-config.schema.json`：RCA executor routing 的 opt-in 配置 schema；只表达 `codex_cli` / `hermes_agent` 与 `structured_call` / `agent_loop`，不保存 provider secret
- `runtime-program/rca-one-shot-production-hardening-closeout.json`：2026-05-20 一步到位落地计划的 closeout 机器面，显式记录 `planned`、`done`、`deferred`、`skipped`、`verification` 与 `commit_push_state`。它只声明 A/B/C/D 的结构、executor policy、evidence refs 与 wrapper classification 已落地；production visual-stage long soak、真实 memory lifecycle scaleout 与 cross-family repeated no-regression 仍保留为 RCA-owned typed blocker/backlog，不升级为 visual ready、exportable 或 handoffable。
- `runtime-program/ppt-image-first-production-route.json`：`ppt_deck` 当前默认 image-first visual route 冻结件；`author_image_pages / repair_image_pages` 通过 Codex executor 原生 imagegen 任务生成整页 16:9 PNG，并继续走 review/export gate；默认 lightweight proof 不调用真实 imagegen 且不把完整“肠癌AI”长 PPT 纳入常规回归
- `runtime-program/ppt-html-route-quality-nonregression.json`：`ppt_deck` HTML authoring / fix route 的质量非回归合同；`render_html / fix_html` 保持 production-selectable optional，必须显式选择，且不得绕过 RCA review/export gates 或把 HTML lane 写回默认路线
- `runtime-program/ppt-native-authoring-proof-lane.json`：`ppt_deck` native PPT authoring / repair 生产可选、默认关闭路线冻结件；用户明确要求可编辑 / 原生 PPTX / DrawingML 时替代当前 image-first author/repair stages，但仍必须经 RCA product-entry 与 review/export gate
- `runtime-program/ppt-native-python-engine-contract.json`：RedCube-owned clean-room SVG IR / DrawingML writer / true render proof engine 合同
- Python native helper contract 必须挂在 RedCube route/selectable lane、review/export gate 与 repo-tracked contract 下；不得作为绕过 visual-domain truth 的通用 Office/PPT 脚本入口。
- `runtime-program/ppt-mainline-quality-closeout.json`：`ppt_deck` 历史 HTML 默认路线视觉质量债核查 closeout，记录历史 OPL-series 问题已由后续 review / repair hardening 覆盖；当前默认路线已由 `ppt-image-first-production-route.json` 接管
- `runtime-program/upstream-hermes-agent-live-verification-closeout.json`：当前 F4 live closeout 证明件
- `runtime-program/upstream-hermes-agent-live-verification-blocker.json`：历史 F4 live blocker 冻结件
- `runtime-program/*.json`：absorbed tranche、prefrozen follow-on board 与 provenance contract

这里不再保留 narrative 的 `project-truth/AGENTS.md` 层。
