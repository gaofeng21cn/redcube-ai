# RedCube AI 架构

Owner: `RedCube AI`
Purpose: `current_architecture_and_owner_boundary`
State: `current_truth`
Machine boundary: 人读架构说明。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

Progress-first transition 固定为：route handler 先执行 artifact admission，再解释质量 verdict。可消费 artifact 即关闭当前 attempt 并进入下一个 stage；视觉/内容质量的 `block`、`failed` 或 `rerun_required` 规范化为 `completed_with_quality_debt`，保留 repair recommendation 但不保留 execution typed blocker。continuation 只消费有限 repair budget，耗尽后选择最佳 artifact 进入 export。

PPT/XHS authoring lane 通过 hydrated delivery constraint 锁定为 `image_pages`、`html` 或 `native_pptx`。review/export 只读取被锁定 lane 的 artifact；外层故障处理不能自动跨 lane，只有新的显式 product-entry route 可以更新 lock。

对外主语：`RedCube AI` 是由 OPL 安装、注册和运行的 visual-deliverable Foundry Agent，不是独立应用或独立 runtime。RCA 持有视觉领域能力与交付权威；OPL 持有 Framework 安装、Temporal/provider runtime、generated/hosted interfaces 和通用平台能力。

## 主链路

唯一产品主链路是 `User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain handler -> RedCube visual-domain truth surfaces`。repo-local domain handler 和开发命令只是 OPL 可调用的领域入口，不是第二套安装、runtime 或最终用户入口。RCA manifest / lock 不声明 OPL Framework implementation dependency；OPL module workflow 在 checkout 中托管 `opl-framework` 根包解析，因此 Temporal、E2B、OPL CLI 和通用 Framework 依赖只由 OPL 安装一次。

RCA owner 边界不变：OPL 提供 stage descriptor discovery、queue/wakeup、handoff、receipt、approval/retry、trace/projection；RedCube 持有视觉 route truth、review/export gate、canonical artifacts 和 visual-domain quality 判断。
`contracts/foundry_agent_series.json` 现在是 OPL Foundry policy 的 RCA thin consumer，`contracts/domain_descriptor.json` 只保留 domain-specific profile / refs anchor；两者不再复制 OPL Foundry generic `series_design_profile`、workspace topology profile 或 public series spine。RCA 的视觉资料输入、visual stage pack、PPT/PDF/PNG/export bundle 输出和视觉 authority 函数写在 `visual_domain_delta_refs`、`domain_specific_profile`、`agent/`、stage/action refs 与 authority refs 中。OPL generic lifecycle、public series profile、workspace topology、provider runtime 和 App/workbench shell 由 OPL owned/generated/hosted surface 持有；这些 refs 不创建 RCA 私有 lifecycle，也不把 OPL provider completion 升级为 visual ready、exportable、handoffable 或 domain ready。

## 实现与辅助边界

`contracts/pack_compiler_input.json#/implementation_profile` 是实现语言与辅助代码的唯一机器入口。Agent identity 仍来自 `agent/` 的 Declarative Visual Pack 与 contracts JSON；TypeScript/Python 只是可替换的 helper implementation，不是 Agent 类型、标准身份或 generic runtime owner。

| helper | 语言 | 允许职责 | source refs |
| --- | --- | --- | --- |
| visual family helper | TypeScript | visual route、review projection、artifact locator refs | `packages/redcube-runtime/src/families/` |
| Office helper | Python | Office/PPT materialization、render readback、package validation | `python/redcube_ai/native_helpers/` |

`implementation_profile.helpers` 保持 helper optional、语言不等于 Agent identity，并把 Rust 限定在 Framework hot path；OPL 持有生成 surface 与 Framework runtime。`generic_runtime`、`generic_cli`、`generic_workbench` 不能因出现在 RCA checkout 中而被该 profile 合法化，仍由 functional privatization / source-purity 门按 OPL-owned/generated surface、迁移输入或退役门读取。

进入 `invokeDomainEntry` 之后，继续按同一条执行链工作：

`service-safe domain entry -> executor adapter -> concrete executor -> audit / review / publication projection`

当前 route equivalence 的可验证边界由 product-entry manifest 暴露：`status`、`invoke`、`session continuation` 与 internal OPL integration 的共享真相面固定为 `domain_entry_surface`、`session_continuity`、`progress_projection`、`artifact_inventory`、`runtime_loop_closure`、`review_state`、`publication_projection`。这条边界只证明多入口落到同一 deliverable/runtime truth，不创建第二公开 skill，也不创建第二套运行语义；direct/default product-entry 的 runtime owner 是 `configured_family_runtime_provider`，默认 task intent label `run_opl_stage_execution_plan` 返回 `opl_stage_execution_plan`，由 OPL provider 持有 generic executor selection、stage attempt runtime / attempt ledger。这里的 label 不表示 RCA 继续维护 repo-local managed runtime；Codex CLI 是 RCA 唯一物化的 concrete executor，其他 hosted executor 只通过 OPL-owned refs/receipts 接入。
这里的 `status` 是 agent-facing product-entry overview / intake / entry-shell contract；当前 repo-local `redcube product` CLI 只保留 `invoke` direct domain target，product status / session / manifest wrapper 由 OPL generated/default caller 持有。该 status surface 不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。
RCA action surface 已改为标准 OPL `family-action-catalog.v1`：root `contracts/action_catalog.json` 直接声明 RCA action metadata、domain handler targets、supported generated surfaces 与 authority boundary，不再维护旧 RCA 私有 action-target 第二形状。Minimal authority surface ids 回到 `contracts/pack_compiler_input.json` 和 visual pack handoff refs，action catalog 只表达可发现/可投影的 action contract。Active product-entry manifest 内部继续投影同源 action metadata 供 OPL descriptor 生成和 direct help 使用。OPL 侧 descriptor 可以继续使用 `domain_action_adapter` 作为 generated surface id；RCA active/default repo-local callable surface 是 domain handler target，不再维护 repo-local MCP production API app。OPL 只读取 refs 做 discovery/export/parity，不写 RedCube visual-domain truth、stage-run truth、review/publication projection 或 canonical artifacts。
`agent/` 是 repo-source canonical Declarative Visual Pack：`agent/prompts/*.md` 持有六个 family stage 的 canonical prompt policy，`agent/stages/`、`agent/skills/`、`agent/quality_gates/` 与 `agent/knowledge/` 持有 stage、skill-policy、quality gate 和 knowledge 边界。`prompts/ppt_deck/`、`prompts/xiaohongshu/` 与 `prompts/poster_onepager/` 是真实 route prompt assets，由 canonical prompt policy 定位并由 runtime 直接读入 Codex 调用；它们不能替代 `stage_control_plane.prompt_refs`。旧 `prompts/node/**` 没有 active code/test/contract caller，已退役；不要恢复成第三套 prompt surface。`contracts/pack_compiler_input.json` 用 `required_domain_pack_paths` 锁住完整 pack 文件，OPL generated surfaces 只消费这些 refs。

Effective prompt 只拼接当前 route prompt、结构化 context、attached output schema、local inspection refs 与各 professional skill 自己持有的 concise `Runtime Summary`。完整 skill 正文不重复注入，代码也不复制 remit；skill path 与 summary 同源并在调用时 fail closed 校验。旧 `runtime_seed` / `runtime_artifact` JSON parser 与 Markdown 内重复 output shape 已退役。`poster_onepager` 的每个 route artifact 记录真实 repo prompt path 与正文 SHA-256，不存在 embedded fallback。Production native/HTML prompt 不承载 sample-only archetype、固定英寸/字号配方或历史 defect/retry 清单；sample prompt、validator 和当前 validation feedback 分别持有这些边界。

Stage prompt / professional specialist skill / tool-helper 的架构分工固定为：

| 层 | 角色 | 不做什么 |
| --- | --- | --- |
| Stage prompt | Stage operating surface。定义某个 stage 的目标、输入 refs、输出 receipts / refs / typed blockers / repair targets，以及能否进入下一 stage。 | 不沉淀跨 stage 专业方法，不直接物化文件，不声明 visual/export ready。 |
| Professional specialist skill | Repo-local reusable professional method。沉淀 story architecture、visual direction、page authoring、review、visual memory curation、native PPT design、template profiling 等可复用专业做法，供 stage 调用。 | 不成为外部 repo / 外部产品 / 第二公开 skill，不持有 runtime、artifact body、memory body、accept/reject receipt body 或 review/export authority。 |
| Tool/helper | Materialization / validation / export surface。imagegen、screenshot/render、Office/PPT helper、manifest / locator / export helper 负责生成、渲染、校验、打包和返回 evidence refs。 | 不选择叙事、不替代专业判断、不签 visual truth、review verdict、export verdict 或 owner receipt。 |

因此，新增 professional specialist skill 是为了把“可复用专业方法”从单个 stage prompt 和旧 policy ref 中拆出来；旧 `agent/skills/*.md` 继续只是 stage skill policy refs，约束 stage 使用 authoring / helper / memory policy 的边界，不是 standalone Codex professional skill。`agent/skills/visual_memory_policy.md` 只读为 visual memory 的 stage policy ref；`agent/professional_skills/rca-visual-memory-curator/SKILL.md` 才是 memory proposal、RCA accept/reject review 与 writeback lifecycle 的 curator/reviewer 方法层。

当前 RCA 是正例：`agent/skills/*.md` 只保留 policy ref，`agent/prompts/*.md` 负责阶段目标、输入输出和交付边界，并显式路由到 `agent/professional_skills/*/SKILL.md`。`agent/stages/manifest.json` 与 `contracts/pack_compiler_input.json` 是 repo-source discovery contracts，OPL 将其投影为 `opl-generated:family_stage_control_plane`，RCA 不维护第二套 stage/skill registry。

RCA PPT professional skill 包现在把可复用方法压到每个 `SKILL.md` 的最小模板资源：serial pipeline、spec lock、progressive disclosure、style boundary、visual QA 与 editable PPTX grammar 都是 skill-local 方法模板，不是 runtime route、artifact body 或 review/export verdict。当前增强把 `page_visual_proof_packet`、`visual_proof_plan`、`native_ppt_qa_plan`、`visual_proof_requirements` 和 route-back owner hints 留在既有 skill 内，避免再拆出 screenshot / contact-sheet / native QA 小 skill。`contracts/capability_map.json#/feedback_token_index` 与 `contracts/capability_map.json#/dry_run_token_mapping_check` 是反馈 token 到 professional skill refs / patch candidate hint 的单一映射源；`contracts/agent_lab_handoff.json` 只保留 suite entry、fixture/context、external refs 与 dry-run check refs，不承载 per-token mapping 或 patch-target authority。该边界证明 `ppt_visual_density`、`native_pptx_editability` 等反馈 token 只能路由到 professional skill refs 和 patch candidates，不能写 visual truth、runtime state、owner receipt 或 quality/export verdict。
2026-07-07 的 professional skill 收敛结论是保留 `rca-template-profiler`，不并入 `rca-ppt-visual-director` 或 `rca-native-ppt-designer`。原因是 template/reference-deck profiling 是 route-agnostic 的前置 layout intelligence：它产出 semantic zones、placeholder capacity、layout inventory 和 profile rows；visual director 只消费 profile 来锁 visual language / rhythm / density，native designer 只在显式 native PPTX route 中把 profile 绑定到 editable shape plan。合并会把非 native 的模板画像绑到 native route，或把前置 profile 误写成 visual judgment。

Professional method registry 继续留在 declarative pack/contract 层：communication mode、visualization pattern 与 professional style 由 `ppt-native-ai-first-design-pack.json` 持有本地可执行语义，`ppt-master-learning-landing.json` 只记录外部 source id 到本地 owner/consumer 的映射。Stage 和 skill 只消费稳定 registry refs；Python helper 只物化 typed objects；Reviewer 只根据 pixels/package readback 给 candidate verdict。外部 registry coverage 不成为 runtime、template body、visual truth、review/export verdict 或 owner receipt。

OPL family `Foundry Agent OS` target delta 当前由 [RCA Foundry Agent OS 目标差异页](./active/foundry-agent-os-target-delta.md) 维护。架构读法是：`OPL Agent OS + Declarative Visual Pack + Visual Authority Kernel + Visual Capability Registry`。Capability Registry 由 OPL `Atlas + Pack + Stagecraft` 承载 catalog / ABI / use policy；RCA 只声明 visual capability refs、route-specific safe use policy 和 review/export authority guard。默认 reader 必须回到 `current_owner_delta`，OPL generated surface、Vault、Console、Runway、Pack、gallery/handoff shell 或 Capability Registry 均不能签 RCA owner receipt、创建 RCA typed blocker、写 artifact body 或授权 review/export verdict。

`contracts/foundry-agent-os-domain-kernel-manifest.json` 是这条 owner split 的机器合同入口。它把 visual truth、review/export verdict、artifact mutation/export authority、visual memory decision、owner receipt、typed blocker 和 visual-native helper authority 固定为 RCA kernel，把 runtime、generated surfaces、artifact gallery/handoff shell、review/repair transport、native-helper envelope、projection、Vault lineage 和 capability ABI 固定为 OPL upcollect surface；架构与测试均不得从 OPL refs-only surface 推导 visual completion。
`agent/quality_gates/visual_pack_discipline.md` 是 pack-level visual constraints 的 canonical execution gate。它把外部高层实践中可复用的部分折成 RCA 自己的 brand profile precedence、source/material pass transparency、素材/品牌状态、density/sparse-page evidence、route/template contract、render evidence、review/export refs 与 owner refs；`agent/knowledge/markdown_route_policy.md` 只声明 Markdown/Marp 为显式可选 refs-only route，`agent/quality_gates/package_distribution.md` 只声明 source-to-package consistency gate。product-entry manifest、OPL-generated descriptor 和 `contracts/pack_compiler_input.json` 只暴露这些 refs-only discipline surface，execution contract 下沉到 `declarative_visual_pack_input.visual_pack_discipline_contract`。这些 gate 不引入 Kami 审美、模板偏好、运行面或外部 authority，也不能替代 RCA-owned visual director / screenshot review / export verdict。
RCA domain handler 是给 OPL typed family queue / OPL family runtime provider 在线唤醒使用的 refs-only projection 和受控 dispatch target。它只接收 canonical action metadata 中声明的 RCA-owned guarded actions，并返回 workspace runtime refs、owner receipt refs、typed blocker refs、no-regression refs、lifecycle/memory receipt refs 或 forbidden-write blockers；它不写 visual truth、canonical artifact body、memory body、review/export verdict 或 publication gate，也不声明 production visual-stage long soak complete。具体 command、action id、payload shape、forbidden-write policy、retired action tombstone 和 `domain_action_adapter` descriptor refs 回到 family action catalog、product-entry manifest、contracts、source、CLI guards、OPL generated MCP descriptor 和 tests；本文只保留 domain handler target / OPL generated wrapper / RCA authority 的架构分工。
`standard_domain_agent_skeleton` 不再作为 RCA 私有维护的 OPL standard skeleton 读取；manifest 中保留的是 RCA domain authority refs：artifact locator、domain memory locator、owner receipt contract、guarded action target、visual transition spec/evaluator 和 no-forbidden-write proof refs。OPL standard skeleton mapping / runtime shell / workbench shell 归 OPL generated/hosted surface；真实 PNG/PPTX/PDF、receipt 实例和 export bundle 继续落在 workspace/runtime artifact root，并通过 RCA authority refs 暴露。
`stage_control_projection` 由 OPL compiler 从 `agent/stages/manifest.json` 生成 `opl-generated:family_stage_control_plane`。projection 不改变 hydrated `stage_sequence`，不持有 RedCube visual truth、review owner 或 artifact authority；RCA 只提供 stage/action/transition refs 和最小 authority functions。
Stage artifact runtime 的第一真相现在是 OPL Stage Folder Contract，而不是旧 status/read-model 对文件的解释。RCA route handler 只物化 RCA-owned artifact body、evidence 与 owner receipt refs；OPL Framework/StageRun 写入 OPL runtime-state stage attempt folder 及其 manifest、outputs、evidence refs、provider receipts 和 current/latest pointer。具体物理路径、role manifest、receipt 文件、orphan/broken/stale rules 和 conformance fields 回到 Stage Folder contracts、artifact locator contract、source/tests 和 OPL index/read-model。OPL 提供 index、rebuild、status/explain、orphan/broken/stale projection、gallery/handoff shell；RCA 继续签发 owner receipt、typed blocker、visual/review/export verdict 和 artifact authority。裸 output 文件没有 valid manifest/receipt/evidence 时只能读为 orphan，不能完成 stage。
`temporal_stage_run_consumption_policy` 是 RCA 对 OPL Temporal-backed StageRun 的机器读法：RCA 只消费 OPL StageRun、provider attempt 与 attempt ledger refs；Temporal runtime、provider queue、attempt ledger 和 stage attempt writes 归 `one-person-lab/OPL`。Provider completion、generated surface ready、queue empty、attempt ledger written 或 workbench currentness 均不能关闭 RCA domain completion；只有 RCA owner receipt、typed blocker、human gate、route-back、review/export receipt、artifact authority receipt 或 no-regression evidence refs 能关闭 domain side。
`contracts/stage_run_kernel_profile.json` 把这层 StageRun 读法收成 RCA 当前可消费的最小 kernel profile，并指向 `contracts/stage_run_canary_evidence.json` 的 controlled evidence fixture。旧 sidecar/session supervision、runner、session store、status shell 与 workbench wrapper 在 RCA 仓内只能作为 OPL-hosted runtime/projection/generated wrapper 的迁移输入、refs-only adapter、diagnostic 或 provenance，`legacy_runtime_residue_guard` 明确阻止它们复活成默认 runtime owner、session store、status/workbench、artifact gallery 或 review/repair transport owner。visual StageRun canary 固定为 `visual direction candidates -> grounded reflection -> comparative selection -> revision/evolution -> meta-review -> independent quality gate -> owner receipt or typed blocker closeout`；该 fixture 明确是 `controlled_fixture_not_live_domain_progress`。`asset_follow_audit` 与 `controlled_canary_operator_summary` 只让 operator 跟随 stage run、manifest、current pointer、role artifact 与 closeout refs；operator summary、docs、README、render success、provider completion 或 conformance pass 都不能把该 fixture 升级成 live domain progress、visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。工具、渲染和 native helper 只作为 affordance refs 或 evidence refs 支撑 attempt，不定义硬编码 workflow，也不授权 visual verdict。
当前 `stage_control_projection.prompt_refs` 只指向 `agent/prompts/*.md` 的 canonical stage prompt policy；详细 prompt 全文和 family-specific route wording 通过 `legacy_prompt_asset_refs` 与 `agent/prompts` 内的 locator 继续指向 `prompts/ppt_deck/` 和 `prompts/xiaohongshu/`。

这四个 surface 合起来构成当前发布 package：single `redcube-ai` app skill 是用户/Agent 入口，`invokeDomainEntry` 是 service-safe domain entry，RCA `domain-handler export|dispatch` 是 OPL provider 和 family queue 的可读/受控派发目标，OPL-generated `domain_action_adapter` descriptor/projection 是框架侧 wrapper id，`stage_control_projection` 是 OPL Stage Control Plane 的只读 stage descriptor。它们全部指向同一 downstream RCA domain truth；RCA 继续独立持有 visual truth、route owner、review/export verdict 和 artifact authority。

RCA functional closure 的新增生产边界是：`domain_owner_receipt_contract` 统一 domain receipt、typed blocker 与 no-regression evidence return shape；`lifecycle_guarded_apply_proof` 覆盖 cleanup/restore/retention 的 guarded apply 语义；`visual_transition_spec` 声明 RCA-owned transition table、guard contract、oracle fixture 与 owner action；`visual_transition_evaluator` 只按显式 guard refs 返回 next-stage metadata、repair action、owner receipt / no-regression refs 或 typed blocker。旧 `physical_skeleton_follow_through` 与 `review_helper_baseline_follow_through` 不再作为 product-entry manifest surface 维护；repo-source layout 回到 `agent/`、contracts 和 pack compiler refs，review helper 拆分状态回到 source/test/line-budget evidence。这些 surface 仍是 RCA-owned projection，不把 visual truth、review/export verdict、canonical artifact 或 memory body 移给 OPL；generic transition runner、retry/dead-letter、route graph、workbench 和 provider attempt ledger 继续由 OPL 持有。

RCA-owned workspace/runtime apply surfaces 只写入或返回 workspace runtime refs、domain receipt refs、typed blockers、no-regression evidence、memory receipt refs、lifecycle mutation receipts、proof refs 或 external work-order closeout evidence；它们不签发 artifact-producing visual owner receipt，不能声明 visual ready、exportable、handoffable 或 production soak complete。旧 `workspace_receipt_inventory_projection`、operator-evidence readiness、efficiency handoff、substrate export 和 stability projection 已从 active domain-handler输出退役；OPL/App/operator/Agent Lab 只消费当前 exact locator/evidence/receipt refs。真实 OPL Temporal controlled visual-stage long soak 当前仍未完成。

## Workspace / file lifecycle 结构

RCA repo-source 目录按标准 domain agent 职责分层：

- `agent/`：visual declarative pack，包含 stage prompts、stage policies、skill/knowledge refs 与 quality gate refs。
- `contracts/`：机器合同、schema、descriptor、locator/index contract、receipt ref contract 与 restore/retention policy。
- `runtime/authority_functions/`：最小 visual authority function 的 runtime-facing anchor；只暴露 action metadata、owner receipt refs、typed blocker refs、no-regression refs 或 guarded apply refs，不承载 runtime artifact root。
- `packages/`：RCA domain handler、AI-first authority adapter、receipt signer、typed blocker materializer 与 Python/native helper implementation；不能扩展成 generic runner、queue、session store 或 workbench。
- `docs/`：人读治理、当前状态、边界说明和 provenance，不作为机器接口。

真实 workspace/file lifecycle 由 OPL generic lifecycle primitive 与 RCA owner authority 分层完成，机器边界由 `contracts/workspace_lifecycle_policy.json` 声明。OPL 持有通用 locator/index、scheduler/runner/session/workbench shell、retention/restore orchestration、artifact gallery/handoff shell 与 projection；RCA repo source 只持有 refs、policy、schema 和 proof。真实 source workspace、PNG/PPTX/PDF/export bundle、runtime artifact、receipt instance、cache、venv、pycache、pytest cache 和 install sync 副产物必须落在 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`，不能写回开发 checkout。
OPL workspace topology 生成物也按同一边界处理：`workspace.yaml`、`workspace_*.json` 与 `shared/` resource manifests 可以在 repo checkout 被用作 workspace root 时出现，但只能作为 ignored local workspace state，不能 track 成 repo source。RCA 给 OPL pack compiler 的持久 descriptor registration 是 `contracts/opl_domain_manifest_registration.json`；当前 live OPL registry 仍需要由 `opl workspace bind --project redcube --path <redcube-ai-repo>` 派生 `getProductEntryManifest` manifest command。
其中 stage attempt artifact 的可恢复主线落在 OPL runtime-state 的 Stage Folder 物理目录；`artifact_locator_contract` 只描述 locator、manifest、receipt/blocker 和 authority boundary。workspace-local artifact root 继续可作为 native helper / legacy auxiliary output root，但 completion 判断、current stage、latest attempt 和 orphan/broken/stale artifact projection 都从 Stage Folder 重建。

RCA 的 authority 边界不因 refs-only lifecycle 上收而外移：visual truth、review/export verdict、artifact mutation authority、visual memory body accept/reject 和 owner receipt 继续由 RCA owner surface 决定；OPL 只能消费 locator、receipt ref、typed blocker 或 no-regression evidence。

RCA 现在消费 OPL `family_scheduler_replacement` projection：OPL 持有 family scheduler、daemon 和 generic lifecycle owner；RCA 不在仓内实现 generic scheduler/runtime manager。旧 repo-local managed DAG scheduler 已物理删除；当前视觉 stage 顺序只通过 hydrated deliverable contract、RCA stage refs 和 `opl_stage_execution_plan` 暴露为 route-handler refs。

OPL stability/read-model属于 OPL 自有 projection，不再由 RCA `domain-handler export` 构建或镜像。RCA 只返回 owner receipt、typed blocker、no-regression evidence 与 artifact locator refs；这些 refs 不执行 domain action、不写 RCA domain truth，也不授权 visual-ready、quality或export verdict。

旧 operator-evidence readiness、efficiency handoff 与 substrate adapter/export 聚合面已退役。需要这些信息的 OPL/App/operator/Agent Lab caller直接读取 RCA production-acceptance、runtime-program与Agent Lab contracts中的locator/evidence refs，并路由回RCA owner surface；RCA不再通过domain-handler复制projection body。

当前 deliverable facade 只覆盖已存在的 `ppt_deck` 与 `xiaohongshu` surface；默认 truth surface 是 `buildOplStageExecutionPlan` / `opl_stage_execution_plan`，显式 stage rerun 继续使用 `runDeliverableRoute`，审计与投影继续使用 `createDeliverable`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`。旧 repo-local deliverable runner、run store 和 DAG scheduler 已从 active runtime package 物理删除。

当前仓内可执行的 runtime 基线按三层 owner 收口：

- `RedCube AI` 维护 visual-domain truth、本地 canonical artifacts、稳定 capability surface，以及 audit / review / projection surface
- 第一公民 concrete executor 继续由 `Codex CLI` 通过统一 executor-adapter contract 被选择
- OPL hosted integration 只作为 OPL 侧 product-managed adapter/projection layer 管理 family runtime provider、registration/status 索引、doctor/repair/resume 与 native helper catalog
- RCA active source 只物化 `Codex CLI` executor；其他 hosted executor 及其 attempt ledger/receipt 归 OPL，历史 Hermes 只作 provenance/reference；Temporal 是 OPL production online runtime 的必需 provider

## 入口 taxonomy 与 OPL handoff

当前这条主线需要区分三层入口：

- `direct product entry`
  - 第一公开主语是单一 `redcube-ai` app skill；repo-local `CLI` 提供可验证 direct entry，`MCP` 由 OPL generated protocol descriptor 指向 RCA domain handler target；`status` 只作为 skill 下的 machine-readable product-entry overview / intake / entry-shell contract，`session` 负责续跑
- `OPL-hosted handoff`
  - 给 OPL family-level caller 使用的 handoff contract；`OPL` 只承担 family-level session/runtime/projection 与 shared modules/contracts/indexes，且只作为 hosted integration surface
- `OPL-compatible package surface`
  - RedCube Foundry Agent 对 OPL Framework 暴露的 package 形态：app skill、service-safe domain entry、RCA domain handler target、OPL-generated `domain_action_adapter` descriptor/projection、stage control projection 与 standard domain-agent skeleton mapping；该层只负责 compatibility/discovery/handoff，不承担 visual-domain authority
- `future product shell`
  - 给成熟最终用户前台壳预留的未来产品层；不表示 RCA 重新维护 generic managed runtime

当前真实状态里，direct route、OPL-hosted handoff 与 OPL-compatible package surface 已经 repo-verified；剩余完善不再是旧 runtime 结构差距，而是 production visual-stage evidence、真实 owner receipt / memory lifecycle receipt 和少量历史命名/合同卫生。

已经冻结的 direct domain 级链路是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

与 `OPL` 的家族级衔接则必须收敛到同一条下游形态：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

`OPL -> RedCube` 的最小 handoff envelope 至少包括：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层 envelope 之上，`RedCube AI` 再补充：

- `entry_session_contract`
- `delivery_request`
- 以及其中的 `deliverable_family`、`topic_id`、`deliverable_id` 这类 domain payload

## 最终目标形态

当前已经冻结的 ideal target 不是让 `RedCube AI` 自己变成 runtime 平台，而是让它收敛成一个可直接进入、也可被 `OPL` 内部桥接调用的 visual-domain 产品 / 服务节点：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

与之对应的 direct domain 路线则是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

这里的关键约束是：

- direct `RedCube` product entry 和 OPL hosted integration 必须共用同一个 downstream domain-agent entry（service-safe domain entry）contract
- OPL hosted integration 只消费 product-entry registration、hosted invocation、session continuity、runtimeWatch、artifact inventory、review/publication projection，不创建第二套 RedCube truth
- RCA domain handler target 只把这些 RCA-owned surfaces 投影给 OPL provider；OPL-generated `domain_action_adapter` wrapper 是框架侧 descriptor，不是 RCA repo-local active/default wrapper。family runtime provider 是 24h online substrate / wakeup substrate，OPL 是 typed family queue / control plane，RCA 继续持有 visual-domain truth、review/publication projection 与 artifact authority
- today repo-verified 的 public domain-entry service surface 是 `invokeProductEntry` / `getProductEntrySession`
- `invokeOplHostedProductEntry` 继续作为 internal OPL integration contract
- 成熟的最终用户产品入口前台壳仍未落地

## Executor Owner 与 concrete executor

RCA 当前只物化 `Codex CLI host-agent runtime`，并在 `@redcube/runtime-protocol` 中只保留 Codex descriptor / topology。`ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 统一通过 runtime family 调用 Codex structured generation；非 Codex adapter 会在 RCA executor 边界显式拒绝，不静默 fallback。

Generic executor selection、hosted adapter、attempt ledger 与 receipt residency 归 OPL owner surface。RCA 通过 `contracts/pack_compiler_input.json#/source_refs/executor_policy_source_ref` 指向 `opl-generated:family_stage_control_plane#/stages/*/selected_executor`，只消费 opaque refs，不维护本地 executor-routing schema/config、backend registry、Hermes adapter/proof 或第二执行器编排。

`fix_html` 继续保留 targeted repair、dependency recovery、route review 和默认 `screenshot_review` continuation，但只执行一次 Codex route pass；artifact 和 domain-entry response 不再写 `execution_proof`。

`RedCube AI` 继续持有 route family、profile / pack descriptor、domain action catalog、visual deliverable object、review / publication projection、visual truth 与 artifact authority。OPL/Temporal 负责长期托管、状态索引、doctor/repair/resume、generic executor owner 与 attempt ledger，但不写 RCA visual truth、canonical artifact、review/export verdict 或 owner receipt body。

历史 Hermes contracts/docs 只按上游 external runtime provenance 或技术参考读取，不构成 RCA active adapter、proof backend、runtime owner 或 production visual evidence。

## Language Target

RCA 的长线实现语言目标是 `TypeScript + Python`：

- `TypeScript` 继续承担 product entry、CLI handler target、contracts、domain entry package/protocol boundary、runtime-local family runners、typed service boundaries 与测试主干；MCP wrapper/descriptor 归 OPL generated surface。
- `Python` 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，以及可与 MAS/MAG 共享的自动化工具链；当前 repo-tracked helper catalog 是 `contracts/runtime-program/python-native-helper-catalog.json`。
- `ppt_deck` 当前默认 visual route 是 `author_image_pages`：runtime 继续持有叙事、大纲、蓝图和视觉导演稿，页面视觉通过 Codex executor 原生 imagegen 任务生成完整 16:9 PNG，并继续进入 `visual_director_review`、`screenshot_review` 与 `export_pptx`。RCA 不直接读取 Base URL / API key 调 provider；HTML `render_html/fix_html` 与 native editable PPTX `author_pptx_native/repair_pptx_native` 是生产可选、显式选择路线；native PPT 只在用户要求可编辑 / 原生 PPTX / DrawingML 时作为可编辑交付路线启用。
- native editable PPTX 的架构边界固定为 `RCA AI-first design pack -> editable_shape_plan -> officecli writer / validator -> LibreOffice / Poppler true render QA -> RCA visual_director_review -> screenshot_review -> export_pptx`。设计 pack 与 `editable_shape_plan` 由 AI executor 持有创作真相；officecli/Python helper 只物化、校验、渲染、导出 refs 和 fail-closed blocker，不能选择模板、补设计或授权视觉质量。AgentLab 只能读取 suite refs、terminal refs 和 non-regression refs；mock provider / deterministic fixture 只能证明 plumbing 与 fail-closed wiring，不能作为视觉样片或 RCA verdict。真实样片、PPTX/PDF/PNG、shape manifest、review/export receipt 和 probe report 必须落到 workspace / runtime artifact root，例如 `/Users/gaofeng/workspace/projects/redcube-ai/runtime-state/`，不进入 repo-tracked source。
- `xiaohongshu` 当前默认 visual route 也收敛到 `author_image_pages`：runtime 持有 source truth、故事线、单篇策划与视觉导演稿，由 Codex executor 原生 imagegen 任务生成完整 3:4 PNG note pages，随后进入 `visual_director_review`、`screenshot_review`、必要时 `repair_image_pages`，最后由 `publish_copy` 与 `export_bundle` 产出发布文案、PNG 序列和 manifest。`render_html/fix_html` 只作为显式 HTML authoring lane，用于确定性网页稿或历史 HTML 维护。

## Service-Safe Domain Entry

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/domain-entry` `invokeDomainEntry`
- OPL generated MCP descriptor: `invoke_domain_entry`（仅 descriptor-only、non-public internal handler target；不属于 public runtime 或 stage action）

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

## Product Entry Service Surface

当前 repo-verified 的 product-entry service surface 是：

- contract: `contracts/runtime-program/redcube-product-entry-mvp.json`
- hosted integration contract: `contracts/runtime-program/opl-framework-hosted-product-entry.json`（文件名保留历史 provenance）
- managed hardening contract: `contracts/runtime-program/managed-product-entry-hardening.json`
- callable surfaces:
  - `@redcube/domain-entry` `invokeProductEntry`
  - `@redcube/domain-entry` `invokeOplHostedProductEntry`（OPL-hosted integration）
  - `@redcube/domain-entry` `getProductEntrySession`

它们继续把执行下沉到同一个 `invokeDomainEntry`，同时把 session continuity 持久化到用户级 runtime-state，而不是把 product entry 写成 repo-local runtime 自己的新宿主。

OPL generated MCP product-entry descriptor 只承载 RCA `family_action_catalog` / active manifest action metadata 中的 action。`invokeOplHostedProductEntry` 仍是 internal OPL-hosted integration callable surface，供 OPL handoff contract 使用，不作为 `redcube_product_entry` MCP action key 暴露。

## Python Native Helper Surface

当前 Python helper 边界是 `RCA 声明与实现 + OPL 执行 envelope`：

- catalog: `contracts/runtime-program/python-native-helper-catalog.json`
- framework invocation: `opl pack native-helper run --catalog <catalog.json> --helper <helper_id> --request <request.json> --json`
- domain implementation: `python -m redcube_ai.<helper_module>`，只由 OPL 根据 catalog 解析和启动
- proof lane: `contracts/runtime-program/ppt-native-authoring-proof-lane.json`

RCA runtime-family 只提交 `catalog_ref`、`helper_id` 与领域参数，并消费 `opl_pack_native_helper_execution_receipt`。Python 环境选择、`PYTHONPATH`、module spawn、timeout、stdout JSON 校验与通用 execution receipt 均归 OPL；RCA 继续持有 helper body、PPT/image/export mutation、视觉 review/export gate、artifact authority 与 route-specific proof。

退役的 thin wrapper 包括 `packages/redcube-runtime/scripts/ppt_deck_review.py`、`packages/redcube-runtime/scripts/ppt_deck_export.py`、`packages/redcube-runtime/scripts/ppt_deck_native.py` 与 `python/redcube_ai/hermes/agent_loop_bridge.py`。这些路径不得作为 active caller、contract anchor 或 compatibility layer 恢复；no-active-caller proof 与 retired-surface guard 由 native helper catalog tests 和 retired surface guard 维护。

## 文档结构角色

RCA 文档结构按 `docs/docs_portfolio_consolidation.md` 维护。架构读者只需要记住当前六层：

| 层 | 当前职责 |
| --- | --- |
| `README*` / `docs/README.md` | 入口与导航，先说明 RCA visual-deliverable 身份，再说明 OPL-hosted 集成路径。 |
| 核心五件套 | `project`、`status`、`architecture`、`invariants`、`decisions` 持有当前项目角色、架构边界、约束、决策和状态读法。 |
| Machine truth | `contracts/`、schema、source、CLI/MCP/API 行为、workspace/runtime artifacts、owner receipts 与 review/export gates。 |
| Lifecycle owner docs | `docs/product/`、`docs/runtime/`、`docs/delivery/`、`docs/source/`、`docs/policies/` 解释当前工作面和稳定规则。 |
| Active plan | `docs/active/` 只保留当前差距、完成门槛和迁移台账；当前唯一 completion plan 是 `rca-ideal-state-gap-plan.md`。 |
| References / History | `docs/references/` 保留仍支撑当前合同或目标态的参考；`docs/history/` 保存 absorbed tranche、旧路线、tombstone 和 provenance。 |

历史 tranche brief、旧 follow-on board、proof 命令流水和旧 program 材料不再作为当前架构层。机器可读合同继续使用 contract/schema/source/artifact 路径或 `human_doc:*` 语义 ID，不把 Markdown 路径当成稳定 API。
