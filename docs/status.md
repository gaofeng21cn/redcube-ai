# RedCube AI 当前状态

## 默认入口口径

- 对外定位：`RedCube AI` 是独立 visual-deliverable domain agent，第一公开主语是单一 `redcube-ai` app skill 与 direct 调用入口；`OPL` 通过 internal bridge / integration surface 进入
- formal-entry matrix：`CLI`（默认正式入口）、`MCP`（支持协议层）、`controller`（内部控制面）
- repo-verified direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- internal OPL bridge route：`User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- 默认公开能力面：`RedCube AI` 持有稳定 capability surface 与 visual-domain truth，`redcube-ai` app skill / `Codex CLI` 继续作为主要可见 surface 与默认 concrete executor；`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现
- OPL boundary：`OPL` 只保留 family-level session/runtime/projection 与 shared modules/contracts/indexes，不接管 RedCube domain truth
- OPL Runtime Manager：目标形态中的 OPL 侧薄运行管理/投影层，负责 federated route 的 external `Hermes-Agent` profile/provisioning、registration/status 索引、doctor/repair/resume、native helper catalog 与高频状态索引；它不持有 RedCube visual truth、canonical artifacts、review/publication projection 或 concrete executor
- 语言目标：RCA 长线实现收敛到 `TypeScript + Python`；TypeScript 继续承担 product/runtime contract、CLI/MCP、gateway 与 typed service boundaries，Python 承担 native Office/PPT、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 共享自动化生态
- Agent-facing 语言面：新实现默认走 TypeScript orchestration 或 Python native helper；仓内已跟踪 JavaScript 已退役，新的产品、测试或脚本 JavaScript 会被 closeout audit 阻断

## 当前执行口径

- product-entry service surface：`invokeProductEntry`、`getProductEntrySession`、`redcube product invoke`、`redcube product session`
- internal OPL bridge surface：`invokeFederatedProductEntry`、`invoke_federated_product_entry`、`redcube product federate`
- shared service-safe domain entry：`invokeDomainEntry`、`invoke_domain_entry`
- direct domain surfaces：`frontdesk / start / preflight / invoke / session / manifest`；其中 `frontdesk` 是单一 `redcube-ai` app skill 之下的 agent-facing product-entry overview / intake / entry-shell contract，保留 `redcube product frontdesk` 作为 legacy command key / compat command，不代表 GUI、WebUI 或最终用户前台壳
- 稳定可调用面：`redcube-ai` app skill、`CLI`、`MCP`、`invokeDomainEntry`、`invokeProductEntry`、本地脚本，以及这些 surface 对应的 repo-tracked contracts
- `skill_catalog` 现在对外收口为单一 `redcube-ai` app skill；`frontdesk`、`invoke`、`session` 继续作为这个 skill 底下的 machine-readable command contracts，其中 `frontdesk` 只承载 product-entry overview / intake / entry-shell 语义，并在同一 skill descriptor 的 `domain_projection.runtime_continuity` 输出可直接消费的 same-session runtime continuity envelope
- 同一 `domain_projection` 现已暴露 `opl_runtime_manager_registration` v1：OPL Runtime Manager 可索引 RCA 的 product-entry registration、internal OPL bridge、session continuity、artifact inventory、runtime health 与 review/publication projection refs，但不拥有 RedCube visual truth 或 canonical artifacts
- `RCA` 已声明 `OPL` family contract adoption：`contracts/runtime-program/opl-family-contract-adoption.json` 与 `docs/references/opl_family_contract_adoption.md` 把 runtime attempt、visual quality projection、incident learning 与 product operator projection 映射回 RCA-owned surfaces；`OPL` 只消费投影，不持有 RedCube visual truth、canonical artifacts 或 review/export judgment。
- `route_equivalence` 已作为 manifest 合同面冻结：`frontdesk`、`invoke`、`session` 与 internal `OPL bridge` 都只指向同一 downstream `domain_entry`、同一 session continuity / progress / artifact / review / publication truth，不新增第二公开 skill 或第二运行语义
- `deliverable_facade` 已覆盖当前 `ppt_deck` 与 `xiaohongshu` surface：facade 只声明现有 `createDeliverable`、`runManagedDeliverable`、`runDeliverableRoute`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`，不改核心生成逻辑
- direct route 只用于显式 stage rerun、定点回修或 runtime gate 指定的局部恢复；默认新交付继续走 `run_managed_deliverable` / `auto_to_terminal`。`run_deliverable_route` 现在会把本轮 `delivery_request.user_intent` 写入 route authoring context，并纳入 route cache key，避免定点回修指令被旧 artifact 复用吞掉。
- executor backend public contract 只认 `codex_cli` 与 `hermes_agent`；`execution_shape` 单独表达 `structured_call` / `agent_loop`。`render_html` 默认结构化调用；`fix_html` 默认结构化回修并复审到 `screenshot_review`，若复审仍要求 `fix_html`，最多升级一次 `hermes_agent + agent_loop` 并记录 execution proof。
- executor routing 配置为 opt-in：`config/examples/executor-routing.example.json` 仅作示例，真实本机配置放 `$CODEX_HOME/projects/redcube-ai/runtime-state/config/executor-routing.json`、`config/local/executor-routing.json` 或 `REDCUBE_EXECUTOR_ROUTING_CONFIG`。RCA 只保存 Hermes profile id，不保存 provider/base URL/API key/model list。
- `ppt_deck` native PPT authoring / repair 已作为生产可选、默认关闭路线落到可运行 executor：`author_pptx_native` 通过 RedCube clean-room SVG IR 与 DrawingML writer 生成可编辑 PPTX、shape manifest 和 true PPTX render proof，`repair_pptx_native` 消费 `screenshot_review` feedback 并记录 repair log；默认 visual route 仍是 `render_html`
- native PPT selectable lane 已登记在 `contracts/runtime-program/python-native-helper-catalog.json`；Python helper 现在由 repo-owned `redcube_ai` package 承载，既有脚本只保留兼容入口；Python helper 不能绕过 `visual_director_review`、`screenshot_review` 与 `export_pptx` gate，也不能替代 RedCube product-entry/runtime-family route
- native PPT 生产硬化已补齐真实 product-entry smoke、可复现 proof runner、手动 CI true-proof lane、视觉 benchmark 与 export operator proof summary：`tests/product-entry-native-ppt-live-proof.test.ts` 走 source readiness、create deliverable、`author_pptx_native`、review gates 与 export；`tools/native-ppt-proof/run.sh` 在 LibreOffice headless -> PDF -> Poppler PNG 环境生成 editable PPTX、PDF、PNG、shape manifest 与 proof summary；默认 fast/meta 仍不触发真实 renderer
- domain durable handles：`program_id`、`topic_id`、`deliverable_id`、`run_id`

## 当前验证口径

- hosted quality lane：`npm run typecheck -> npm run test:fast -> npm run test:family -> npm run test:meta`
- family shared pin 审计统一经由 `scripts/run-test-group-lib.ts`，必须在 clean-clone 环境下可运行
- 本地 `npm run test:integration` / `npm run test:e2e` / `npm run test:full` 继续保留 Codex / Python preflight，但只把明确的 route-heavy 文件串行化；其余文件回到 Node test runner 默认并发

## 历史记录与追溯层

- absorbed milestones 与 phase-2 records：`docs/program/phase-2/`
- Hermes migration/history records：`docs/program/hermes/`
- 支持性技术参考：`docs/references/`
- direct-delivery future target reference：`docs/references/direct_delivery_longrun_target_state.md`
- source-readiness future target reference：`docs/references/source_readiness_deep_research_longrun_target_state.md`
- 维护者验证与文档治理：`docs/references/series-doc-governance-checklist.md`

## 当前收口重点

- 保持 direct route 与 internal OPL bridge route 共用同一条 downstream domain-agent entry（service-safe domain entry）下游
- 保持 `OPL Runtime Manager`、external `Hermes-Agent` substrate、repo-verified product-entry surface 与 visual-domain truth 的 docs/contracts/tests 同步
- 保持 AI-first 质量边界：story / visual / markup authorship 与最终视觉 reviewer 判断由 AI-authored artifact 持有；pack、schema、gate、audit、scorecard 与 projection 只表达结构、证据、机械状态和 rerun hints
- 保持 native PPT lane 生产可选、默认关闭；HTML 主线与 native PPT 路线都继续经过 `visual_director_review`、`screenshot_review` 与 `export_pptx`
- 保持维护者验证与历史 provenance 停留在 reference / policy 层
