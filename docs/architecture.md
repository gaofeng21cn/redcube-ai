# RedCube AI 架构

对外主语：`RedCube AI` 是独立 visual-deliverable domain agent；`gateway / harness` 仅保留为内部架构边界语言。

## 主链路

当前对外主链路以 direct route 为第一主语，OPL 路线保留为 internal bridge / integration surface：

- direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- internal OPL bridge route：`User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

两条路线在进入 `invokeDomainEntry` 之后，继续按同一条执行链工作：

`service-safe domain entry -> executor adapter -> concrete executor -> audit / review / publication projection`

当前 route equivalence 的可验证边界由 product-entry manifest 暴露：`status`、`invoke`、`session continuation` 与 internal `OPL bridge` 的共享真相面固定为 `domain_entry_surface`、`session_continuity`、`progress_projection`、`artifact_inventory`、`runtime_loop_closure`、`review_state`、`publication_projection`。这条边界只证明多入口落到同一 deliverable/runtime truth，不创建第二公开 skill，也不创建第二套运行语义。
这里的 `status` 是 agent-facing product-entry overview / intake / entry-shell contract；`redcube product status` 是当前 product-status command，不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。

当前 deliverable facade 只覆盖已存在的 `ppt_deck` 与 `xiaohongshu` surface，并继续复用 `createDeliverable`、`runManagedDeliverable`、`runDeliverableRoute`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`。facade 是 contract / docs / test guardrail，不接管或重写核心生成链路。

当前仓内可执行的 runtime 基线按三层 owner 收口：

- `RedCube AI` 维护 visual-domain truth、本地 canonical artifacts、稳定 capability surface，以及 audit / review / projection surface
- 默认 concrete executor 继续由 `Codex CLI` 通过统一 executor-adapter contract 被选择
- `OPL Runtime Manager` 只作为 OPL 侧 product-managed adapter/projection layer 管理 external `Hermes-Agent` substrate、registration/status 索引、doctor/repair/resume 与 native helper catalog
- `Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层作为外部 runtime substrate 出现

## 入口 taxonomy 与 OPL handoff

当前这条主线需要区分三层入口：

- `direct product entry`
  - 第一公开主语是单一 `redcube-ai` app skill；`CLI` / `MCP` 提供可验证协议入口，`status` 只作为 skill 下的 machine-readable product-entry overview / intake / entry-shell contract，`session` 负责续跑
- `internal OPL handoff`
  - 给 `OPL Runtime Manager` 与 family-level caller 使用的 handoff contract；`OPL` 只承担 family-level session/runtime/projection 与 shared modules/contracts/indexes，且只作为 internal bridge / integration surface
- `future managed product shell`
  - 给成熟最终用户前台壳预留的未来产品层

当前真实状态里，前两层已经 repo-verified，第三层仍在继续硬化。

已经冻结的 direct domain 级链路是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

与 `OPL` 的家族级衔接则必须收敛到同一条下游形态：

`User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

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

`User -> OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

与之对应的 direct domain 路线则是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`

这里的关键约束是：

- direct `RedCube` product entry 和 `OPL Runtime Manager` internal bridge 必须共用同一个 downstream domain-agent entry（service-safe domain entry）contract
- `OPL Runtime Manager` 只消费 product-entry registration、federated invocation、session continuity、runtimeWatch、artifact inventory、review/publication projection，不创建第二套 RedCube truth
- today repo-verified 的 public domain-entry service surface 是 `invokeProductEntry` / `getProductEntrySession`
- `invokeFederatedProductEntry` 继续作为 internal OPL bridge contract
- 成熟的最终用户产品入口前台壳仍未落地

## Hermes-Agent、RedCube AI 与 concrete executor 的分工

`Hermes-Agent` 在 `RedCube AI` 当前主线里只作为显式 hosted/proof backend 或技术参考载体；启用时可承担：

- session / run / watch / memory / scheduling
- gateway / messaging / interrupt / resume
- family 级长期在线 runtime substrate

当前默认 concrete executor 仍是 `Codex CLI host-agent runtime`，它负责：

- 默认 agent execution lane
- 受保护创作 stage 的结构化生成执行
- 作为 `codex_cli` adapter 的 concrete runtime

`RedCube AI` 自己继续持有：

- `gateway -> family -> profile -> pack` 这条 domain 主链
- visual deliverable 的对象边界、审计、review / publication projection
- executor routing contract
- `pack` 作为 domain boundary / pack-id 载体的语义真相

当前 executor-adapter contract 也已经冻结成统一口径：

- public executor backend 固定为 `codex_cli` 与 `hermes_agent`
  - active surfaces 不保留退役 adapter alias
  - `hermes_agent` 只表示显式 full-agent-loop proof backend
- `execution_shape` 固定为 `structured_call` 与 `agent_loop`
  - 显式 HTML route 的 `render_html` 默认 `structured_call`
  - 显式 HTML repair route 的 `fix_html` 默认先 `structured_call`，复审仍要求回修时最多升级一次 `hermes_agent + agent_loop`
  - `simple_llm` 与 `openai_compatible_gateway` 不作为 RedCube 一等 backend
- 默认正式 backend 是 `codex_cli`
  - 它对应本机 Codex CLI autonomous runtime
- 备选 proof backend 是 `hermes_agent`
  - 只有 caller 显式传 Hermes proof adapter，或 `fix_html` escalation policy 触发时才会启用
  - 当前已经对齐到 `ppt_deck`、`xiaohongshu`、`poster_onepager` 三个 family
  - 底层不是单轮 chat relay，而是 external Hermes-Agent loop bridge
  - 默认 model / reasoning 继承本机 Hermes 默认配置，不在 repo 内 pin 死

这意味着 RedCube 现在的 family runtime 并不是“写死 Codex-only”，而是：

`gateway -> runtime family contract -> executor adapter -> concrete agent runtime`

其中：

- `runtime family contract` 继续定义 route、artifact、review surface 与 visual-domain truth
- `executor adapter` 只负责把这些 contract 下沉到具体执行器
- 默认主线仍是 Codex CLI；Hermes-Agent loop 先作为 opt-in proof lane 保持可选，不提前替换默认

`ppt_deck` runtime family 的 core 现在也按这个边界组织：`core.ts` 保留 route / lifecycle / visual-domain assembly，execution adapter、creative owner/source stamp、primary surface 和 structured artifact batch/executor helper 进入 `ppt-deck-runtime-family-parts/execution-adapters.ts`。这让 core 不再直接承载 executor/backend 分支，同时保持 public route、payload shape 和 runtime-family contract 不变。

当前还要额外冻结一个边界：

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现在统一走 `runtime-family + Codex CLI structured generation`
- repo-local `pack/compiler` 不再 author story / blueprint / visual direction / final visual artifact 这类创作真值
- `pack` 可以继续存在，但只能作为 typed shell、pack-id carrier 或非创作边界，不能再回退成脚本编译创作路径

因此，“接入 Hermes”不等于“所有视觉生成步骤都改成 Hermes 自己执行”。

更准确的目标是：

- 由 `RedCube AI` 统一稳定 capability surface 与 visual-domain truth
- 由 `Executor Adapter` 在 domain 内按 deliverable route 选择具体执行器；当前正式主线默认是 `Codex CLI`，`Hermes-Agent loop` 则以同 contract 下的 full-agent-loop proof lane 形式并挂
- 由 `OPL Runtime Manager` 统一 federated 长期托管、状态索引、doctor/repair/resume 与 native helper catalog；未来自有 sidecar 只有在外部 `Hermes-Agent` 无法表达 task/wakeup/approval/audit/product isolation contract 时才进入 promotion 评估

## Language Target

RCA 的长线实现语言目标是 `TypeScript + Python`：

- `TypeScript` 继续承担 product entry、CLI/MCP、contracts、gateway、runtime-family shell、typed service boundaries 与测试主干。
- `Python` 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，以及可与 MAS/MAG 共享的自动化工具链；当前 repo-tracked helper catalog 是 `contracts/runtime-program/python-native-helper-catalog.json`。
- `ppt_deck` 当前默认 visual route 是 `author_image_pages`：runtime 继续持有叙事、大纲、蓝图和视觉导演稿，页面视觉通过 Responses `image_generation` 生成完整 16:9 PNG，并继续进入 `visual_director_review`、`screenshot_review` 与 `export_pptx`。HTML `render_html/fix_html` 与 native editable PPTX `author_pptx_native/repair_pptx_native` 是生产可选、显式选择路线；native PPT 只在用户要求可编辑 / 原生 PPTX / DrawingML 时作为可编辑交付路线启用。
- `xiaohongshu` 当前默认 visual route 也收敛到 `author_image_pages`：runtime 持有 source truth、故事线、单篇策划与视觉导演稿，GPT-Image-2 生成完整 3:4 PNG note pages，随后进入 `visual_director_review`、`screenshot_review`、必要时 `repair_image_pages`，最后由 `publish_copy` 与 `export_bundle` 产出发布文案、PNG 序列和 manifest。`render_html/fix_html` 只作为显式 HTML authoring lane，用于确定性网页稿或历史 HTML 维护。

## Service-Safe Domain Entry

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/gateway` `invokeDomainEntry`
- MCP tool: `invoke_domain_entry`

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

## Product Entry Service Surface

当前 repo-verified 的 product-entry service surface 是：

- contract: `contracts/runtime-program/redcube-product-entry-mvp.json`
- internal bridge contract: `contracts/runtime-program/opl-gateway-federated-product-entry.json`
- managed hardening contract: `contracts/runtime-program/managed-product-entry-hardening.json`
- callable surfaces:
  - `@redcube/gateway` `invokeProductEntry`
  - `@redcube/gateway` `invokeFederatedProductEntry`（internal bridge）
  - `@redcube/gateway` `getProductEntrySession`

它们继续把执行下沉到同一个 `invokeDomainEntry`，同时把 session continuity 持久化到用户级 runtime-state，而不是把 product entry 写成 repo-local runtime 自己的新宿主。

## 结构角色

### 1. Public docs

- `README*`
- `docs/README*`

这层负责对外说明项目是什么、当前主线在哪里、如何理解 formal-entry 与 product role。

### 2. Core maintainer docs

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`

这层负责 AI / 维护者快速建立上下文。

### 3. Machine-readable runtime program

- `contracts/runtime-program/current-program.json`
- `contracts/runtime-program/*.json`

这层负责活跃主线指针、absorbed tranche、follow-on board 与 provenance contract。

### 4. Program briefs

- `docs/program/*/*.md`

这层负责与 contracts 对应的人类可读 tranche brief，不是默认公开首页叙事。

### 5. Stable rules and references

- `docs/policies/*`
- `docs/references/*`

这层分别承载稳定规则和非活跃参考材料。

### 6. Lifecycle reading layers

- `docs/product/*`
- `docs/runtime/*`
- `docs/delivery/*`
- `docs/source/*`

这层按 product、runtime、delivery 与 source 生命周期职责承载人类可读说明。机器可读合同继续使用 contract/schema/source/artifact 路径或 `human_doc:*` 语义 ID，不把这些 Markdown 路径当成稳定 API。
