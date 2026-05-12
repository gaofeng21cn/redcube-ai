# RedCube AI 关键决策

## 2026-05-12

### 决策：RCA controlled soak 暂以 typed blocker 收口

- `RedCube AI` 在 product-entry manifest 和 product sidecar projection 中新增 `controlled_soak_no_regression_attempt`。
- 该 surface 当前固定为 `deferred_typed_blocker`，原因是 `opl_temporal_controlled_visual_stage_attempt_apply_contract` 尚未对 RCA domain apply 开放。
- OPL 只能读取 no-regression refs、blocker 和下一跳 contract gap；它不持有 visual truth、review/export verdict、canonical artifact、memory body 或 receipt instance。
- 真实 controlled soak 需要在 OPL apply contract 开放后由 RCA-owned surface 产出 domain receipt。

### 决策：PPT review helper line-budget 采用显式 reviewed baseline

- `python/redcube_ai/native_helpers/ppt_deck/review.py` 当前为 1154 行，属于既有 native screenshot/layout review helper 的集中实现。
- 本轮不改变 review 行为，不把拆分和 controlled soak blocker 混在同一个变更中；`scripts/line-budget.ts` 记录 1154 行 reviewed baseline，并 fail-closed 阻止继续增长。
- 后续结构拆分应在独立 lane 内把 Playwright capture、block geometry audit、markdown report 和 result summary 拆成 focused modules；拆完且文件回到 1000 行以内后删除 baseline。

## 2026-05-10

### 决策：RCA 文档第一身份收口到视觉交付，OPL 降为托管运行框架路径

- `RedCube AI` 的公开首页、docs 入口和核心五件套先表达独立 visual-deliverable domain agent 身份，再表达 OPL 托管路径。
- 公开发布包装固定为 `RedCube AI Foundry Agent / OPL-compatible package built on OPL Framework`：single `redcube-ai` app skill、service-safe domain entry、product sidecar/projection、stage control projection 和 standard domain-agent skeleton mapping 是同一 package 的不同 surface。
- `OPL` 在 RCA 文档中固定解释为 stage-led 的完整智能体运行框架，可作为外部依赖托管 RCA；它不成为 RCA 对外第一身份，也不接管 visual-domain truth、canonical artifacts、review/export gate 或 publication projection。
- `Codex CLI` 是 RCA direct path 和未显式选择 hosted/proof backend 的 OPL-hosted path 的默认最小具体执行单元。
- 旧 `gateway`、`frontdoor`、`federation`、`harness-first`、`OPL-hosted handoff`、Hermes-first 口径只能出现在内部集成、provenance、合同引用、或 tombstone 语境中；仍被 runtime-program 合同引用的 program brief 留在 `docs/program/`，通过 lifecycle note 降级，不因标题旧而先物理迁移。

### 决策：RCA 对齐 OPL Temporal-backed production runtime，Temporal 为 OPL 生产必需 substrate

- `RedCube AI` 的 OPL 长期托管口径更新为 `OPL Runtime Manager / opl family-runtime -> Temporal-backed family runtime provider -> RCA product sidecar export/dispatch -> RedCube service-safe domain entry`。
- Temporal 是 OPL production online runtime 的必需 provider；Hermes-Agent 迁移后作为可选 Agent executor adapter、显式 hosted/proof backend 或 executor proof lane 保留，不再作为目标 24h session/wakeup substrate。
- `redcube product sidecar export|dispatch` 继续是 OPL provider 到 RCA owner surface 的受控桥接。OPL/Temporal/Hermes/local provider 只能 enqueue、dispatch、signal、query、投影 attempt/receipt，不得写 visual truth、review verdict、publication projection truth、canonical artifacts 或 export authority。
- RedCube 继续持有 visual stage pack、prompt/skill、route truth、review/export gate、canonical artifacts 和 visual-domain quality authority。下方 Hermes-oriented OPL Runtime Manager 决策保留为迁移背景，后续新投入按 Temporal-backed production runtime 解释。

### 决策：RCA 消费 OPL 统一 Agent Executor Adapter receipt

- RCA 的 concrete executor 默认仍是 `Codex CLI`；显式非默认 executor 通过 OPL generic Agent Executor Adapter 进入，RCA 只消费 OPL executor receipt / product sidecar receipt refs。
- `Hermes-Agent`、`Claude Code` 等只作为显式 opt-in backend。它们必须可接入、可回执、可审计、fail-closed，但不承诺输出质量、视觉审美、tool semantics、resume 或 artifact 结果与 Codex CLI 等价。
- RCA 保留 visual route truth、review/export gate、canonical artifacts、publication projection truth 和 visual-domain quality authority；generic executor owner 不进入 RCA。
- 当前状态：除真实 production-hosted controlled visual stage soak 外，本边界已落地到 status/runtime architecture/product sidecar/receipt proof 口径；旧 Hermes/Gateway/local-manager active path 已降为 explicit proof/provenance/history。

## 2026-05-05

### 决策：RCA 作为 OPL stage-led framework 上的独立 domain agent

- `RedCube AI` 的 OPL 对齐口径固定为：RCA 是可被 Codex App skill 直接调用、也可由 OPL stage-led family framework 托管的独立 visual-deliverable domain agent。
- `OPL` 只持有 stage descriptor discovery、queue、wakeup、handoff、receipt、approval/retry/dead-letter、trace/projection 和 parity；RCA 持有 visual stage pack、prompt/skill、route truth、review/export gate、canonical artifacts 和 visual-domain quality authority。
- 后续流程优化优先改 RCA stage pack、visual direction prompt、review gate、runtime-family route 和 export proof；不得把视觉路线、审美判断或 artifact authority 搬到 OPL 机械脚本。
- Direct skill path 保持一等入口；经 OPL 托管调用时也必须回到同一套 RedCube-owned `invokeDomainEntry` / product-entry surface。

### 决策：`ppt_deck` 默认视觉路线切到 image-first，HTML/native 保持显式可选

- `ppt_deck` 的默认视觉路线固定为 `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`。
- `author_image_pages` 通过 Responses `image_generation` 生成完整 16:9 PNG 页面；`export_pptx` 将整页图装配成 PPTX/PDF，并明确不承诺 editable shapes。
- 用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。
- 旧的 `render_html` executor wording 只描述显式 HTML route 的执行形态，不再表示 `ppt_deck` 默认视觉路线。

### 决策：RCA 暂不引入 SQLite 作为持久层，保留为可重建索引型 deferred option

- MAS/MDS 的 SQLite program 解决的是 `.ds` 运行态大量小文件、历史游标、retention ledger 与 cold archive restore 问题；RCA 当前主要增长面是 deliverable artifact、manifest、review/export bundle，而不是同等级别的 runtime 小文件生命周期。
- RCA 现阶段继续采用 `file authority + artifact index + Git source control`：canonical artifacts、review state、export bundle、gallery manifest 与 product-entry/session truth 保持文件 authority。
- SQLite 只在未来出现实测触发条件时进入评估：artifact/session 文件数量明显增长、跨 deliverable 查询变慢、operator 需要全局 artifact inventory，或 JSON retention ledger 已难以维护。
- 若未来启用 SQLite，它只能作为可删除、可重建的 sidecar index，存储 session/deliverable/route/artifact/review/export 索引与 hash/provenance；不得存放 PNG/PPTX/PDF blob，不得成为 visual-domain truth、canonical artifact truth 或 review/export judgment owner。

## 2026-04-26

### 决策：RCA 对齐 OPL Runtime Manager 与 TS/Python 目标形态

- 状态：Runtime Manager 薄管理层、TS/Python 目标和 RCA owner split 继续有效；`external Hermes-Agent runtime substrate` 已被 2026-05-10 Temporal-backed production runtime 决策 supersede。
- OPL-hosted route 的目标形态改为 `OPL Product Entry -> OPL Runtime Manager -> Temporal-backed family runtime provider -> RedCube service-safe domain entry`。
- `OPL Runtime Manager` 只负责 OPL 侧 profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、native helper catalog 与高频状态索引，不持有 RedCube visual-domain truth、canonical artifacts、review/publication projection truth 或 concrete executor。
- RCA 的实现语言目标固定为 `TypeScript + Python`：TypeScript 管 product/runtime contract、CLI/MCP、gateway 与 typed service boundaries；Python 管 native Office/PPT、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 共享自动化生态。
- RCA product sidecar adapter 只作为 OPL typed family queue / OPL family runtime provider wakeup 的受控投影与 dispatch 面启用；它不成为 OPL 自有 visual truth sidecar，也不持有 review verdict、publication gate 或 canonical artifact authority。

## 2026-04-23

### 决策：默认公开能力面收口为稳定 capability surface

- `RedCube AI` 对外默认合同优先冻结为 `CLI`、`MCP`、`invokeDomainEntry`、`invokeProductEntry`、本地脚本与 repo-tracked contracts 这一组稳定 callable surface。
- `Codex CLI` 继续作为当前第一公民 concrete executor。
- `Hermes-Agent` 相关路径只保留为显式 hosted/proof backend 或技术参考，不改写默认公开合同。

## 2026-04-11

### 决策：采用核心五件套文档骨架

- `docs/project.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`
- `docs/status.md`

原因：让 AI 和维护者能快速定位项目目标、当前主线、硬约束和关键决策。

### 决策：Phase 2 tranche brief 统一下沉到 `docs/program/phase-2/`

原因：`phase_2_*.md` 继续平铺在 docs 根目录会让入口混乱；它们保留为活跃 program brief，但不再占据根目录层级。

### 决策：`contracts/runtime-program/*.json` 与 `docs/program/phase-2/*.md` 成对维护

原因：一个是机器真相，一个是人类可读 brief，不能再各自漂移。

### 决策：目标 substrate 优先于旧宿主硬化

原因：历史主线与当前基线仍然有验证价值，但一旦新的 runtime substrate 目标已经明确，新增投入就应默认服务目标形态。旧宿主形态只能保留为迁移桥、provenance 或回归对照，而不是继续被当成长线产品方向。

### 决策：`Hermes-Agent` 只指上游外部 runtime substrate

- 后续凡是提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务本体。
- 仓内 `docs/history/hermes/*` 与同名 package 只代表本地迁移工件、pilot substrate 或历史 provenance。

### 决策：repo-local Hermes 迁移材料退入 `docs/history/hermes/`

- 当前还不能把 `docs/history/hermes/*` 写成上游 `Hermes-Agent` 已接管 runtime 的证据。
- 这组文档保留为历史 local-runtime migration artifact，用于追溯为何会走到今天这一步。
- 当前真实主线应回到核心五件套：先完成 truth reset，再推进真实的上游 `Hermes-Agent` pilot。

### 历史决策：统一 runtime substrate，不强制统一 visual executor

- 状态：此段保留为 2026-04-11 Hermes-first 迁移背景；2026-05-10 之后已被 Temporal-backed production runtime 与 stage-led OPL framework 口径 supersede。
- `Hermes-Agent` 在当时迁移设想中优先承担 runtime substrate / orchestration owner；当前只作为可选 Agent executor adapter、显式 hosted/proof backend 或 executor proof lane。
- `RedCube AI` 继续持有 visual deliverable 的 family/profile/pack authority、audit truth 与 executor routing。
- 具体生成步骤允许继续通过 `Executor Adapter` 选择最合适的执行器；只有在拿到显式 proof 后，才允许把某条 route 迁到新的 executor。
- executor backend 的 public contract 只冻结 `codex_cli` 与 `hermes_agent`；旧内部 adapter 名称只映射到这两类 backend，不成为新的 public backend。
- `execution_shape` 单独表达为 `structured_call` 或 `agent_loop`；显式 HTML route 的 `render_html` 默认 `structured_call`，`fix_html` 先结构化回修，复审仍阻断时最多升级一次 `hermes_agent + agent_loop`。
- route-level `structured_call` routing 只作为 opt-in domain config 生效；未配置或未命中时继承 effective default executor，effective default executor 优先取 request、OPL handoff、domain local config，再回到内建 `codex_cli`。
- 本仓不维护 `simple_llm` 或 `openai_compatible_gateway` 作为一等 backend；不同 provider/model 适配交给外部 `Hermes-Agent` runtime 或相应 domain adapter proof。

## 2026-04-13

### 决策：移除 repo-local pack/compiler 创作路径，保留 pack 的 boundary 语义

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 统一改为 `runtime-family + Codex CLI structured generation`。
- repo-local `pack/compiler` 不再 author storyline、blueprint、visual_direction、render_html 这类创作真值。
- `pack` 继续保留为 domain boundary、pack-id carrier 与 typed shell，但不得再回退成脚本填充 / 编译式创作主链。
- legacy `pack-runtime` compiler registry 从 workspace 与依赖图移除，避免测试或后续修改误把旧路径重新接回 active mainline。

## 2026-04-21

### 决策：RCA 对外第一身份收口为独立 visual-deliverable domain agent

- `RedCube AI` 对外主语固定为独立 domain agent，可被 `Codex`、`OPL` 或其他通用 agent 直接调用。
- `gateway / harness` 继续保留为内部架构边界语言，不再作为仓库对外第一身份。
- repo-verified direct route 与 OPL-hosted integration route 必须共同指向同一个 downstream domain-agent entry（`invokeDomainEntry` service-safe surface）。
- 对外第一公开入口优先收口到单一 `redcube-ai` app skill；`invokeOplHostedProductEntry` 只保留为 OPL-hosted integration surface。
- `status` 只作为该 skill 下的 machine-readable product-entry overview / intake / entry-shell contract；`redcube product status` 是当前 product-status command，不代表 GUI / WebUI / 最终用户前台壳已落地。

### 历史决策：保持 honest owner split，不改 default executor owner

- 状态：此段保留为 2026-04-21 owner split 背景；当前 active owner split 以 2026-05-10 provider-backed OPL runtime target 为准。
- `Hermes-Agent` 不再作为默认 managed runtime owner；OPL Runtime Manager 通过 Temporal-backed family runtime provider 承担托管路径，Temporal 是 production required provider，Hermes 只保留为可选 Agent executor adapter 或 proof lane。
- `RedCube AI` 继续持有 visual-domain truth 与 domain durable surfaces。
- `Codex CLI` 继续是 executor adapter 选中的第一公民 concrete executor，除非拿到显式 proof，不改默认 owner split。

### 决策：OPL 角色收口到 family-level runtime hosting

- `OPL` 在这条主线中只保留 family-level session/runtime/projection 编排与 shared modules/contracts/indexes。
- `RedCube AI` 不被表达为 `OPL` 内部 workflow，而是独立 domain-agent 节点；OPL-hosted 调用与 direct 调用只是入口差异，不是 domain ownership 差异。
