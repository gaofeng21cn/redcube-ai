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

当前真实状态是：前两层存在，第三层还没有成熟落地。

目标中的 domain 级链路应是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes Kernel -> Domain Harness OS`

与 `OPL` 的家族级衔接应是：

`User -> OPL Product Entry -> OPL Gateway -> Hermes Kernel -> Domain Handoff -> RedCube Product Entry / RedCube Gateway`

`OPL -> RedCube` 的最小 handoff envelope 至少包括：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层 envelope 之上，`RedCube AI` 再补充 `deliverable_family`、`topic_id`、`deliverable_id` 这类 domain payload。

当前 repo-tracked service-safe adapter shell 是：

- contract: `contracts/runtime-program/service-safe-domain-entry-adapter.json`
- callable surface: `@redcube/gateway` `invokeDomainEntry`
- MCP tool: `invoke_domain_entry`

这就是当前 mainline 明确冻结的 service-safe domain entry surface。

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
