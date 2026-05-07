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
- executor backend public contract 只认 `codex_cli` 与 `hermes_agent`；`execution_shape` 单独表达 `structured_call` / `agent_loop`。`ppt_deck` 与 `xiaohongshu` 的默认视觉路线现在都是 `author_image_pages`，通过 Responses `image_generation` / GPT-Image-2 生成整页 PNG；HTML `render_html/fix_html`、以及 PPT 的 native editable PPTX `author_pptx_native/repair_pptx_native` 只在用户显式选择对应路线时启用。
- `ppt_deck` runtime-family core 已把 execution adapter / creative source / structured artifact executor helper 收口到 `ppt-deck-runtime-family-parts/execution-adapters.ts`；`core.ts` 继续持有 route lifecycle、artifact assembly 和 visual-domain contract，不再混入 backend adapter 分支。
- executor routing 配置为 opt-in：`config/examples/executor-routing.example.json` 仅作示例，真实本机配置放 `$CODEX_HOME/projects/redcube-ai/runtime-state/config/executor-routing.json`、`config/local/executor-routing.json` 或 `REDCUBE_EXECUTOR_ROUTING_CONFIG`。RCA 只保存 Hermes profile id，不保存 provider/base URL/API key/model list。
- `ppt_deck` image-first route 已成为默认 visual route：`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`。`author_image_pages` 记录 provider/base URL host、`/responses`、request model、`gpt-image-2` 默认模型、image call id、prompt/style hashes、cache hit/miss、source image hash 与 PNG hashes；token 不进入 artifact。`screenshot_review` 对 PNG 执行 16:9、非空、重复 hash、低信息密度、边缘/标题裁切、碎片化、字段泄漏与可选 OCR sidecar 检查，缺 PNG/manifest 时 fail-closed 并进入 `repair_image_pages`。`repair_image_pages` 只重绘 blocked slide ids，未阻断页复用并记录 preserved hashes；`export_pptx` 将整页 PNG 装配成 PPTX/PDF，并明确 `editable=false`。
- `xiaohongshu` image-first route 已成为默认 visual route：`research -> storyline -> single_note_plan -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> publish_copy -> export_bundle`。`author_image_pages` 输出 1086×1448 的 3:4 整页 PNG、逐页 prompt manifest、style manifest 与 generation metadata；`screenshot_review` 直接消费 PNG/page manifest；`repair_image_pages` 只重绘 blocked note pages 并记录 preserved hashes；HTML `render_html/fix_html` 只保留为显式 HTML lane。
- `ppt_deck` native PPT authoring / repair 继续作为生产可选、默认关闭的可编辑路线：`author_pptx_native` 通过 RedCube clean-room SVG IR 与 DrawingML writer 生成可编辑 PPTX、shape manifest 和 true PPTX render proof，`repair_pptx_native` 消费 `screenshot_review` feedback 并记录 repair log。
- native PPT selectable lane 已登记在 `contracts/runtime-program/python-native-helper-catalog.json`；Python helper 现在由 repo-owned `redcube_ai` package 承载，既有脚本只保留兼容入口；Python helper 不能绕过 `visual_director_review`、`screenshot_review` 与 `export_pptx` gate，也不能替代 RedCube product-entry/runtime-family route
- image-first proof runner 已落地：`tools/image-ppt-proof/run.sh --output-dir artifacts/image-ppt-proof --mock-image-generation` 与 `redcube image-ppt proof --output-dir artifacts/image-ppt-proof --mock-image-generation` 默认使用 6 页以内 lightweight fixture，不读取完整“肠癌AI”长 PPT，不调用真实图片 API，并输出 PNG、PPTX、PDF、prompt/image/style manifest、review capture、export bundle、artifact gallery、final manifest 与 `artifact-index.json`。live 模式必须显式开启，并要求 `REDCUBE_CODEX_RESPONSES_IMAGE_GENERATION_CMD` 或 `OPENAI_API_KEY`。CI 的 `image-ppt-proof` 可选 lane 只在 manual、nightly 或 PR label 触发，默认 fast/meta 不调用真实 image generation。
- native PPT 生产硬化已补齐真实 product-entry smoke、可复现 proof runner、手动 CI true-proof lane、视觉 benchmark 与 export operator proof summary：`tests/product-entry-native-ppt-live-proof.test.ts` 走 source readiness、create deliverable、`author_pptx_native`、review gates 与 export；`tools/native-ppt-proof/run.sh` 在 LibreOffice headless -> PDF -> Poppler PNG 环境生成 editable PPTX、PDF、PNG、shape manifest 与 proof summary；默认 fast/meta 仍不触发真实 renderer
- RCA runtime 持久层当前继续采用文件 authority 与可重建 artifact/session index；SQLite sidecar 作为 deferred option 保留，只有在实测 artifact/session 小文件增长、跨 deliverable 查询压力或 retention ledger 维护成本达到阈值后再评估，不作为当前 visual-domain truth 或 canonical artifact authority。
- domain durable handles：`program_id`、`topic_id`、`deliverable_id`、`run_id`

## 当前验证口径

- 测试分组唯一机器可读入口是 `scripts/test-registry.ts`；每个根级测试必须登记 `file`、`lane`、`size`、`layer`、`state`、`ci_default`、`coverage_id`，`scripts/run-test-group.ts` 从注册表推导 `smoke`、`fast`、`meta:ci`、`integration:remaining`、`full:remaining` 等执行组，并继续 fail-closed 拒绝未登记的根级测试文件
- `smoke` 是最小开发入口：`npm run test:smoke` 只覆盖少量核心入口与结构守门；`fast` 是核心回归快线，不再等同于 smoke；`ci` / `npm run test:ci` 等价于 hosted quality lane
- hosted quality lane：`npm run typecheck -> run-test-group fast -> run-test-group family -> run-test-group meta:ci`，其中 `meta:ci` 只跑 fast 未覆盖的 meta remainder，避免默认 CI 重复执行同一批根级测试文件；Playwright Chromium / renderer proof 环境只留在显式 `native-ppt-proof` 与 `image-ppt-proof` jobs，默认 quality lane 不再安装浏览器
- family shared pin 审计统一经由 `scripts/run-test-group-lib.ts`，必须在 clean-clone 环境下可运行
- 本地 `npm run test:integration` / `npm run test:e2e` / `npm run test:full` / `npm run test:full:remaining` 继续保留 Codex / Python preflight，但只把明确的 route-heavy 文件串行化；其余文件回到 Node test runner 默认并发；本地已跑 fast 后可用 `npm run test:integration:remaining` 跳过 fast 已覆盖的 integration 文件；本地已跑 fast + family + meta:ci + integration:remaining 后可用 `npm run test:full:remaining` 跳过已覆盖的 meta/integration 文件，只跑动态推导出的 full 余量
- `historical` 只承载历史 provenance / absorbed milestone 回归，默认 `full` 不再隐式包含 historical；需要历史回归时显式运行 `npm run test:historical` 或 `./scripts/verify.sh full-with-historical`
- `scripts/verify.sh` 与 `scripts/run-test-group.ts` 现在都会先执行 `scripts/repo-hygiene.sh`；tracked 主线不得包含 `dist/`、`build/`、`out/`、`__pycache__`、`*.egg-info`、`.DS_Store`、项目级 `.codex/`、`.omx/`、`.runtime-program/`、`runtime-state/` 或 `.agent-contract-baseline.json`，并且 `.agents/` 只允许 `.agents/plugins/marketplace.json` 作为当前插件入口 source。

## 历史记录与追溯层

- product lifecycle：`docs/product/`
- runtime lifecycle：`docs/runtime/`
- delivery lifecycle：`docs/delivery/`
- source lifecycle：`docs/source/`
- 稳定 rules：`docs/policies/`
- absorbed milestones 与 phase-2 records：`docs/program/phase-2/`
- repo-local Hermes migration/history records：`docs/history/hermes/`
- AI / Superpowers process drafts：保持未跟踪，不进入 repo-tracked docs history
- 支持性技术参考：`docs/references/`
- direct-delivery future target reference：`docs/references/direct_delivery_longrun_target_state.md`
- source-readiness future target reference：`docs/references/source_readiness_deep_research_longrun_target_state.md`
- 维护者验证与文档治理：`docs/references/series-doc-governance-checklist.md`

## 当前收口重点

- 保持 direct route 与 internal OPL bridge route 共用同一条 downstream domain-agent entry（service-safe domain entry）下游
- 保持 `OPL Runtime Manager`、external `Hermes-Agent` substrate、repo-verified product-entry surface 与 visual-domain truth 的 docs/contracts/tests 同步
- 保持 AI-first 质量边界：story / visual / markup authorship 与最终视觉 reviewer 判断由 AI-authored artifact 持有；pack、schema、gate、audit、scorecard 与 projection 只表达结构、证据、机械状态和 rerun hints
- 保持 image-first 为 `ppt_deck` 与 `xiaohongshu` 默认视觉路线；HTML 与 native editable PPTX 都保持生产可选、显式选择，并继续经过对应的 `visual_director_review`、`screenshot_review` 与 export gate
- 保持维护者验证与历史 provenance 停留在 reference / policy 层
