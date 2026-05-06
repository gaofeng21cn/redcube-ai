# RedCube AI 关键决策

## 2026-05-05

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

- OPL federated route 的目标形态改为 `OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry`。
- `OPL Runtime Manager` 只负责 OPL 侧 profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、native helper catalog 与高频状态索引，不持有 RedCube visual-domain truth、canonical artifacts、review/publication projection truth 或 concrete executor。
- RCA 的实现语言目标固定为 `TypeScript + Python`：TypeScript 管 product/runtime contract、CLI/MCP、gateway 与 typed service boundaries；Python 管 native Office/PPT、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 共享自动化生态。
- 自有 OPL sidecar 当前不启用；只有当外部 `Hermes-Agent` 无法表达 task/wakeup/approval/audit/product isolation contract 时，才从 Runtime Manager 的 adapter/projection 边界进入 promotion 评估。

## 2026-04-23

### 决策：默认公开能力面收口为稳定 capability surface

- `RedCube AI` 对外默认合同优先冻结为 `CLI`、`MCP`、`invokeDomainEntry`、`invokeProductEntry`、本地脚本与 repo-tracked contracts 这一组稳定 callable surface。
- `Codex CLI` 继续作为默认 concrete executor。
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

原因：历史主线与当前基线仍然有验证价值，但一旦新的 runtime substrate 目标已经明确，新增投入就应默认服务目标形态。旧宿主形态只能保留为迁移桥、兼容层或回归对照，而不是继续被当成长线产品方向。

### 决策：`Hermes-Agent` 只指上游外部 runtime substrate

- 后续凡是提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务本体。
- 仓内 `docs/history/hermes/*` 与同名 package 只代表本地迁移工件、pilot substrate 或历史 provenance。

### 决策：repo-local Hermes 迁移材料退入 `docs/history/hermes/`

- 当前还不能把 `docs/history/hermes/*` 写成上游 `Hermes-Agent` 已接管 runtime 的证据。
- 这组文档保留为历史 local-runtime migration artifact，用于追溯为何会走到今天这一步。
- 当前真实主线应回到核心五件套：先完成 truth reset，再推进真实的上游 `Hermes-Agent` pilot。

### 决策：统一 runtime substrate，不强制统一 visual executor

- `Hermes-Agent` 在本仓长线中优先承担 runtime substrate / orchestration owner。
- `RedCube AI` 继续持有 visual deliverable 的 family/profile/pack authority、audit truth 与 executor routing。
- 具体生成步骤允许继续通过 `Executor Adapter` 选择最合适的执行器；只有在拿到显式 proof 后，才允许把某条 route 迁到新的 executor。
- executor backend 的 public contract 只冻结 `codex_cli` 与 `hermes_agent`；旧内部 `host_agent` / `hermes_native_proof` 只作为 adapter 兼容名映射到这两类 backend。
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
- repo-verified direct route 与 internal OPL bridge route 必须共同指向同一个 downstream domain-agent entry（`invokeDomainEntry` service-safe surface）。
- 对外第一公开入口优先收口到单一 `redcube-ai` app skill；`invokeFederatedProductEntry` 只保留为内部 bridge / integration surface。
- `frontdesk` 只作为该 skill 下的 machine-readable product-entry overview / intake / entry-shell contract；legacy `redcube product frontdesk` command key 为兼容保留，不代表 GUI / WebUI / 最终用户前台壳已落地。

### 决策：保持 honest owner split，不改 default executor owner

- `Hermes-Agent` 继续作为 managed runtime owner。
- `RedCube AI` 继续持有 visual-domain truth 与 domain durable surfaces。
- `Codex CLI` 继续是 executor adapter 选中的默认 concrete executor，除非拿到显式 proof，不改默认 owner split。

### 决策：OPL 角色收口到 family-level federation

- `OPL` 在这条主线中只保留 family-level session/runtime/projection 编排与 shared modules/contracts/indexes。
- `RedCube AI` 不被表达为 `OPL` 内部 workflow，而是独立 domain-agent 节点；federated 调用与 direct 调用只是入口差异，不是 domain ownership 差异。
