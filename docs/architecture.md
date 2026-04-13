# RedCube AI 架构

## 主链路

`RedCube AI` 的正式主链路是：

`gateway -> family -> profile -> pack -> harness execution -> audit / review / publication projection`

当前仓内可执行的 runtime 基线已经把 route / managed execution 的 run surface 切到真实的上游 `Hermes-Agent` API server。
`RedCube AI` 继续只维护 visual-domain truth、本地 canonical artifacts，以及 audit / review / projection surface。

## 入口 taxonomy 与 OPL handoff

当前这条主线需要区分三层入口：

- `operator entry`
  - 给人类操作同事使用的命令、调试、审阅和导出入口
- `agent entry`
  - 给 `Codex`、Claude Code、OpenClaw 这类 host-agent 使用的 `CLI` / `MCP`
- `product entry`
  - 给最终用户直接进入的产品入口

当前真实状态是：前两层已经存在，第三层已落地为 repo-verified service surface，但成熟的最终用户前台壳仍未落地。

已经冻结的 direct domain 级链路是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

与 `OPL` 的家族级衔接则必须收敛到同一条下游形态：

`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

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

当前已经冻结的 ideal target 不是让 `RedCube AI` 自己变成 runtime 平台，而是让它收敛成一个 `OPL` 可调用的 visual-domain 产品 / 服务节点：

`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

与之对应的 direct domain 路线则是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

这里的关键约束是：

- direct `RedCube Product Entry` 和 `OPL Gateway` handoff 必须共用同一个 downstream service-safe domain entry contract
- today repo-verified 的 product-entry service surface 是 `invokeProductEntry` / `invokeFederatedProductEntry` / `getProductEntrySession`
- 成熟的最终用户产品入口前台壳仍未落地

## Hermes runtime substrate 与 visual executor 的分工

上游 `Hermes runtime substrate` 在 `RedCube AI` 当前主线里的职责是：

- session / run / watch / memory / scheduling
- gateway / messaging / interrupt / resume
- family 级长期在线 runtime substrate

`RedCube AI` 自己继续持有：

- `gateway -> family -> profile -> pack` 这条 domain 主链
- visual deliverable 的对象边界、审计、review / publication projection
- executor routing contract
- `pack` 作为 domain boundary / pack-id 载体的语义真相

当前还要额外冻结一个边界：

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 现在统一走 `runtime-family + upstream Hermes structured generation`
- repo-local `pack/compiler` 不再 author story / blueprint / visual direction / final HTML 这类创作真值
- `pack` 可以继续存在，但只能作为 typed shell、pack-id carrier 或非创作边界，不能再回退成脚本编译创作路径

因此，“接入 Hermes”不等于“所有视觉生成步骤都改成 Hermes 自己执行”。

更准确的目标是：

- 由上游 `Hermes-Agent` 统一 runtime substrate / orchestration
- 由 `RedCube AI` 统一 visual-domain truth
- 由 `Executor Adapter` 在 domain 内按 deliverable route 选择具体执行器，例如 repo-local pipeline、受控 host-agent、渲染 toolchain 或未来的 Hermes-native route

## Service-Safe Domain Entry

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/gateway` `invokeDomainEntry`
- MCP tool: `invoke_domain_entry`

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

## Product Entry Service Surface

当前 repo-verified 的 product-entry service surface 是：

- contract: `contracts/runtime-program/redcube-product-entry-mvp.json`
- federated contract: `contracts/runtime-program/opl-gateway-federated-product-entry.json`
- managed hardening contract: `contracts/runtime-program/managed-product-entry-hardening.json`
- callable surfaces:
  - `@redcube/gateway` `invokeProductEntry`
  - `@redcube/gateway` `invokeFederatedProductEntry`
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
