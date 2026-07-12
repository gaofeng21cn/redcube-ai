# RedCube AI 关键决策

Owner: `RedCube AI`
Purpose: `active_decision_log`
State: `current_policy`
Machine boundary: 人读决策日志。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。本文不保存 dated proof、branch/worktree closeout、receipt id、run/probe id 或逐项实现流水；这些只作为 history/process provenance 或 git history 读取。

## 当前读法

本文只保留仍有效的 durable decisions。按日期追加的实现链、证明链、closeout 过程和字段级合同细节已经折回：

- 当前状态和 evidence boundary：`docs/status.md`。
- 当前完成口径、功能/结构差距、测试/证据差距和下一轮 baton：`docs/active/rca-ideal-state-gap-plan.md`。
- OPL family Foundry Agent OS target delta：`contracts/foundry-agent-os-domain-kernel-manifest.json`，人读支撑为 `docs/active/foundry-agent-os-target-delta.md`。
- per-surface private implementation / physical source morphology：`docs/active/opl-private-implementation-migration-inventory.md`、`contracts/private_functional_surface_policy.json`、`contracts/physical_source_morphology_policy.json`。
- StageRun、Stage Folder、production acceptance、owner-chain evidence、live progress 和 artifact kernel 细节：对应 `contracts/**`、runtime evidence、owner receipts、typed blockers、source/tests。
- 历史 provenance：`docs/history/process/README.md`、`docs/history/**` 和 git history。

## Durable Decisions

### RCA 的第一身份是 visual-deliverable domain agent

RCA 的公开身份是独立 visual-deliverable domain agent / OPL-compatible Foundry Agent package。Direct skill path 和 OPL-hosted path 只是入口差异；二者都必须回到同一套 RCA-owned service-safe domain entry、visual route、review/export gate、artifact authority、owner receipt 和 typed blocker。

OPL 是 stage-led family runtime、generated/default caller、projection、operator/App shell 和 provider-backed orchestration owner。OPL 不持有 RCA visual truth、canonical artifacts、review/export verdict、visual memory body、artifact mutation authority 或 RCA owner receipt body。

### OPL/Temporal 是任务启动后的默认 hosted runtime owner

任务启动后，持久在线调度、唤醒、restart/resume/re-query、retry/dead-letter、StageRun、provider attempt、attempt ledger、lease 和 receipt residency 归 OPL/Temporal。RCA 不实现 repo-owned generic daemon、scheduler、attempt loop、attempt ledger、generic session/workbench shell 或 App/runtime owner。

`Codex CLI` 是 RCA 当前唯一物化的 concrete stage executor。其他 executor 的选择、托管与 attempt ledger 归 OPL owner surface；RCA 只消费 `stage_control_plane` 中的 opaque executor refs，不维护本地 adapter、routing config、fallback 或 proof backend。

### Action 与 stage 合同只保留一份正文

`contracts/action_catalog.json` 是 action 的唯一正文，`agent/stages/manifest.json` 是 RCA stage graph 的唯一 repo source；OPL standard compiler 从该 manifest 生成 `opl-generated:family_stage_control_plane`。RCA product-entry manifest、domain-handler export 与 stage plan 只返回 source/projection refs，不复制 route、professional-skill、runtime 或 workorder body；OPL 解析器必须在绑定的 RCA repo 内 fail-closed 地加载这些精确路径。

RCA Agent Lab suite、efficiency handoff 与 production acceptance workorder 的 machine owner 是 repo-tracked acceptance contract，并通过 `contracts/agent_lab_handoff.json` 或精确 contract JSON Pointer交给 OPL Foundry 消费；它们不投影回 `domain-handler export`。只有 product-entry manifest 实际持有的领域 authority 使用 `opl_generated:product_entry_manifest#/...`，其中 handler export 的嵌套 authority 必须显式落到 `#/domain_authority_refs/...` 并可对真实 manifest 解引用。

### RCA authority kernel 保留 visual judgment 和 artifact authority

RCA 保留 source readiness、communication / visual direction、route truth、layout/review/export verdict、artifact mutation/export authority、visual memory accept/reject、owner receipt、typed blocker、route-back、human gate 和 native helper implementation。

OPL/Vault/Console/Runway/Pack/gallery/handoff shell、Capability Registry、generated surfaces、State Index Kernel、scheduler、workbench、artifact gallery/handoff shell 和 review/repair transport 只能消费 RCA refs、展示 provenance、承载 receipt refs 或投影 operator read model；不能签 RCA owner receipt、创建 RCA typed blocker、写 artifact body、写 visual truth 或授权 review/export verdict。

### Foundry Agent OS target delta 由 machine contract 持有

RCA 采用 `OPL Agent OS + Declarative Visual Pack + Visual Authority Kernel + Visual Capability Registry` 目标形态。机器 SSOT 是 `contracts/foundry-agent-os-domain-kernel-manifest.json`；人读解释在 `docs/active/foundry-agent-os-target-delta.md`。

默认读根是 `current_owner_delta`。Capability Registry 只能是 catalog / ABI / use-policy，不是 visual authority。该目标形态不声明 visual ready、exportable、handoffable、production visual-stage long-soak complete、production-ready 或 physical delete authority。

### StageRun / Stage Folder completion 只能消费显式 RCA owner refs

RCA 只消费 OPL StageRun、provider attempt、attempt ledger、lease 与 receipt refs。RCA owner-chain completion 只能由 RCA-owned `owner_receipt_ref`、`typed_blocker_ref`、`human_gate_ref`、`route_back_ref`、`review_export_receipt_ref`、`artifact_authority_receipt_ref` 或 `no_regression_evidence_ref` 关闭。

OPL Stage Folder writer 是物理合同 writer，不是 RCA owner receipt signer。`canonical/current`、质量、导出与 ready 声明必须有对应 output roles、valid role manifest、RCA owner receipt refs 和 receipt file；真正的 hard stop 必须有 RCA typed blocker refs 和 evidence file。任何可读 output 即使缺 manifest/receipt 也能作为 Codex progress input 继续到任一 declared stage，但不能替代 RCA owner answer 或升级质量/导出/ready 声明。Provider completion、generated surface ready、queue empty、attempt ledger written、controlled canary、mock-safe canary、conformance pass 或 read-model current 同样不能升级这些声明。

### Visual memory 和 tool affordances 是 advisory prompt context

Visual pattern memory、tool affordances、examples、route precedents 和 screenshot evidence refs 是 AI author / reviewer 的输入信号，不是 visual route scorer、winning-layout generator、review-pass gate、export gate 或 artifact-ready signal。

缺少 visual memory 默认不阻断 source intake、communication strategy、visual direction exploration 或 candidate generation。只有输出试图声明 review/export/handoff/production readiness，或越过 artifact authority、owner receipt、source boundary、review/export gate 时，才 fail closed。

### PPT external learning 只落 declarative registry，parity 只出 candidate

Pinned `ppt-master` 的 communication mode、style 和 visualization pattern 只允许映射到 RCA 已有 declarative design pack、professional skill/resource 和 reviewer contract。RCA 不导入其 runtime、Claude-specific protocol、template/icon/SVG body，也不新建第二 PPT skill、runtime 或 authority surface。

Typed native object fidelity、edit/save/package readback、true render 与 blind parity evaluator 可以作为 non-live implementation evidence。完整 parity 结论仍必须由真实 same-source 双跑、至少 5 名独立盲评、exact private binding、完整 edit evidence、PowerPoint/LibreOffice/Keynote 或 Google Slides 跨 viewer 人工读回和 RCA fresh owner review共同形成；harness 不能签 owner receipt。

### Product-entry、domain handler 和 generated descriptor 由 canonical metadata 派生

RCA domain handler guarded actions、forbidden writes、manifest generated descriptor refs、family action catalog、CLI help 和 MCP product-entry routes 从 RCA-owned canonical action/status metadata 派生。OPL 侧 generated descriptor id 可以继续是 `domain_action_adapter`；RCA repo-local active/default command 是 `domain-handler export|dispatch`。

Product-entry manifest、session snapshot、runtimeWatch、operator evidence/stability projection 和 substrate adapter export 都只能是 refs-only projection / service-safe domain adapter。`runtimeWatch` 特别限定为 visual review/artifact/blocker/owner evidence refs projection，不接受 generic run input，不展开 status/attempt/telemetry/lifecycle/resumable body；这些通用面由 OPL Console / Runway / Ledger 持有。上述 projection 不能恢复为 RCA-owned generic product/session/workbench/domain_action_adapter wrapper owner，也不能写 visual truth、artifact body、memory body、review/export verdict 或 production-ready claim。

### Private surface retirement 直接删除或 tombstone，不保留兼容面

旧 repo-local managed runtime / DAG runner / run store、generic scheduler、gateway/frontdoor/federation、local-manager、flat aliases、facades、fallbacks、compatibility-only tests、old public path 和 legacy wrapper 在 active caller 迁出后直接删除或 tombstone。需要来龙去脉时只保留 history/provenance，不新增兼容别名、re-export facade、shim 或只保护旧 path 的测试。

仍有 active caller 的 repo-local product/session/domain_action_adapter/runtimeWatch/operator projection/executor route-run record adapter 只能按 private inventory 和 source morphology policy 读取为 retained tail、refs-only adapter、domain handler target、native helper implementation 或 migration input；物理删除还需要 replacement owner、no-active-caller、RCA owner receipt / typed blocker roundtrip、no-forbidden-write proof 和 tombstone/provenance pointer。

对应 guard 的机器正文归 `contracts/physical_source_morphology_policy.json` 与 `contracts/functional_privatization_audit.json`。TS builder / readback 只能读合同、做 schema/scan/false-claim 检查和 compact summary；不得重新复制逐字段文案、typed-blocker 字符串或 retired/default-caller 实现细节作为第二真相源。

### External work order closeout 只返回 no-regression 或 typed blocker refs

`emit_external_work_order_owner_closeout` 这类 RCA-owned guarded action 只接受 OPL execution receipt、absorbed head、target verification refs、patch absorption / cleanup refs、Agent Lab re-evaluation ref 与 no-forbidden-write refs。输出只允许 RCA-owned `no_regression_evidence` 或 `typed_blocker`。

它不写 visual truth、artifact body/blob、memory body、quality verdict、export verdict 或 artifact-producing owner receipt；证据不足或 payload 带 body/verdict 字段时 fail closed，让 OPL 记录 RCA domain-owned blocker，而不是由 OPL/OMA 代写 owner receipt。

### Evidence / readiness 是后置 owner lane，不反向定义功能结构 gap

RCA 的 live / production evidence tail 包括真实 Temporal controlled visual-stage long-soak、真实 visual-stage owner receipt / typed blocker / human gate / route-back、review/export acceptance、真实 memory/lifecycle receipt instances、cross-family repeated no-regression 和 App/operator sustained consumption。

这些证据只能在对应 evidence contracts、runtime evidence、owner receipts、typed blockers 或 active gap plan 中读取。Docs、contract completeness、stage replay projection、provider completion、suite pass、controlled fixture、mock-safe canary、refs-only ledger、read-model clean 或 OPL ledger verification 不能写成 visual ready、exportable、handoffable、domain ready、production ready、human approval 或 production visual-stage long-soak complete。

### Progress/currentness 按 deliverable delta 与 platform repair 分账

RCA product-entry session projection 必须区分 `deliverable_progress_delta`、`platform_repair_delta`、operator typed blocker resolution 和 OPL provider ledger closeout binding。Continuation 生成新 session plan 前必须消费 latest closeout；缺 closeout binding 时返回 RCA typed blocker。

Route-local repeated block 进入 OPL stall lineage；连续无 deliverable delta 时升级到 mechanism repair、human gate 或 stop-loss candidate。Platform/cache/interface repair 不得算作视觉交付推进。

### Default visual route 是 image-first，HTML/native PPTX 是显式可选路线

Retry 是质量预算，不是 stage blocker。RCA 只要获得可消费 artifact 就推进；candidate、native shape-plan、视觉 review 与 repair 的轮数只决定可用于提高质量的预算。预算耗尽选择最佳 artifact 并记录 `completed_with_quality_debt`。质量债务阻止 ready claim，但不阻止下一 stage。只有零 artifact、损坏、权限/凭据、显式人工门、authority 或 identity/currentness 边界可以硬停止。

Authoring route 在 deliverable 内有显式 lane lock。image/native/HTML 之间不能由自动 recovery 切换；新的显式 product-entry route 是唯一合法的换 lane 入口。

`ppt_deck` 默认路线是 `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`。`author_image_pages` 通过 executor 的 image generation 能力生成完整 16:9 PNG 页面；`export_pptx` 装配整页图并不承诺 editable shapes。

用户明确要求 HTML/CSS/网页时走 `render_html / fix_html`；用户明确要求可编辑、原生 PPTX 或 DrawingML 时走 `author_pptx_native / repair_pptx_native`。Native helper 继续受 RCA route、visual director review、screenshot review 和 export gate 约束，不能绕过 product-entry/runtime-family mainline。

### RCA 6-stage 主链不因其他 agent 的问题反向拆分

RCA 当前 6 个 top-level stage 已接近“一个 stage 一个主要开放判断”：`source_intake` 冻结 source truth 与缺口，`communication_strategy` 决定叙事 / 大纲 / 页面角色，`visual_direction` 决定视觉语言 / 节奏 / 密度，`artifact_creation` 在已选 route 内生成候选 artifact，`review_and_revision` 判断渲染结果并给出 repair target，`package_and_handoff` 只在 review gate 后导出、打包和交接。

六阶段顺序只由 `agent/stages/manifest.json` 持有；action catalog 只声明 action 经过这条顺序中的哪一段，OPL control plane 与 generated interfaces 均从两份 canonical input 编译并做双向 parity。`invoke_product_entry` 保留完整六阶段 ordered route；proof 与 domain mutation action 只声明实际执行的 stage；read-only action 不声明 route。`invoke_domain_entry` 仅作为 descriptor-only、non-public 的 internal domain-handler target 存在，不进入任何 stage allow-list，也不以 exemption 绕过 public product-entry route。

Product entry 同时收到 `route` 与 `stop_after_stage` 时，两者必须位于同一 hydrated ordered path，且 stop 不得早于 route。`stop_after_stage` 只约束 OPL-hosted Codex execution plan；RCA 的 `run_deliverable_route` 每次只执行一个显式 route，不按 hydrated 顺序、错误文本或 review verdict 自动补跑 predecessor、repair 或后续 stage。

OMA、OBF 或其他 family agent 暴露的 stage 粒度问题不能反向驱动 RCA 把主链拆碎。RCA 的 `artifact_creation` 与 `review_and_revision` 内部确实存在 image-first、HTML、native PPTX 等 route 差异，但这些差异应留在 route-local detailed prompt locator、repo-local professional specialist skill、quality gate 和 typed repair target 内处理；只有出现新的 RCA-owned durable owner boundary，且需要同步修改 `agent/stages/manifest.json`、stage/prompt refs 和 generated projection contract tests 时，才评估 top-level stage 拆分。

### SQLite 只作为未来 OPL-owned sidecar index 选项

RCA 当前 file authority、artifact index 和 Git source control 足以承载 canonical artifacts、review state、export bundle、gallery manifest 与 product-entry/session truth。SQLite 只有在实测 artifact/session 文件数量、跨 deliverable 查询或 operator 全局 artifact inventory 压力明确时才进入评估。

若未来启用 SQLite，也只能作为 OPL-owned State Index Kernel / SQLite sidecar index：可删除、可重建，只索引 locator、hash、manifest/receipt ref 与 provenance，不存 PNG/PPTX/PDF body，不成为 visual-domain truth、canonical artifact truth、review/export judgment、owner receipt body 或 visual memory body owner。

### Codex plugin scaffold/source locator 归一到 plugin 目录

RCA Developer Mode 的 canonical Codex plugin scaffold/source locator 统一在 `plugins/redcube-ai/` 下维护，plugin manifest name 与 skill frontmatter name 都使用 repo slug `redcube-ai`。根层 `.codex-plugin/plugin.json`、repo-local installer、`plugins/rca/` legacy alias path 和第二套 skill/icon/marketplace truth 均不得恢复。

## 历史压缩

2026-04 到 2026-06 的 dated decision entries 已压缩为上方 durable decisions。旧 OPL hosted integration、Hermes、Phase 2、pack/compiler、managed runtime、domain_action_adapter、Stage Folder、production acceptance、external work order、native helper 和 product-entry source channel 的实现过程只作为 provenance 读取。

本节不授权恢复 `gateway`、retired public entry、federation、old workbench、repo-local managed runtime、旧 Hermes 优先 runtime owner、兼容别名、facade、fallback、只保护旧 public path 的测试，或任何 physical delete。
