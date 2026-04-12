# Upstream Hermes-Agent Fast Cutover Board

状态锚点：`2026-04-12`

## 文档目的

这份文档只回答一个问题：

- 在不继续深磨 repo-local runtime 的前提下，`RedCube AI` 如何以**最快且诚实**的方式切到理想形态。

这里的“理想形态”不是：

- 把仓内现有 `Hermes` 命名继续包装成“已经接入上游”
- 先做聊天 UI 或顶层自然语言壳
- 先开新 family、先补 academic poster、先扩 platform 故事

这里的“理想形态”是：

- 上游 `Hermes-Agent` 真正拥有 session / run / watch / memory / scheduling / recovery 这层 runtime substrate
- `RedCube AI` 继续只拥有 visual domain truth：
  - `source truth`
  - `family / profile / pack`
  - `audit / review / export / projection`
  - visual-domain gate semantics

配套冻结件：

- final target brief：`docs/program/upstream_hermes_agent_final_target_shape.md`
- final target contract：`contracts/runtime-program/upstream-hermes-agent-final-target-shape.json`

## 一句话目标

把当前 `repo-local managed runtime baseline + Codex local operator host`，切成：

`real upstream Hermes-Agent runtime substrate + RedCube visual-domain gateway`

并保留当前 `ppt_deck / xiaohongshu / guarded poster_onepager` 的 domain contract 不漂移。

## 成功条件

只有同时满足下面几项，才可把这条线写成完成：

1. 仓库能给出真实的上游 `Hermes-Agent` 依赖与连接证据。
2. `runManagedDeliverable / getManagedRun / superviseManagedRun` 不再由 repo-local runtime 自己主责。
3. `program_id / topic_id / deliverable_id / run_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 继续保持 canonical truth surface。
4. 形成可被未来 `OPL Gateway` 调用的 service-safe domain entry / adapter surface。

## 明确排除范围

本线不做：

- 新 family onboarding
- academic poster 新 contract
- 先做 Web 前端
- 先做自然语言聊天壳
- 先做通用 agent 平台化

## 固定阶段顺序

### F1. 真正的上游 Hermes 连接证据

先把“已连接上游 `Hermes-Agent`”做成可验证事实：

- profile / runtime root / session substrate
- 真实 adapter / client / gateway endpoint
- repo 内不再只停留在命名或 mock wiring

### F2. Runtime substrate owner 切换

在不改写 visual domain contract 的前提下，把 runtime 主责切到上游 `Hermes-Agent`：

- run creation
- run watch
- resume / interrupt
- scheduling / recovery
- session linkage

### F3. Domain entry adapter 收口

形成一个明确的、可被顶层 `OPL Gateway` 调用的 domain entry adapter：

- 继续保留 `CLI` / `MCP`
- 同时补齐 service-safe adapter / entry contract
- 这一步不是聊天 UI，而是把 domain gateway 变成真正可被产品入口调用的服务面

### F4. 端到端验证与 absorb

至少在下面这些路径上做 fresh proof：

- `ppt_deck`
- `xiaohongshu`
- guarded `poster_onepager`

并证明：

- run surface 在上游 `Hermes-Agent`
- domain truth 仍在 RedCube
- public docs / current-program / tests / contracts 一致

## 默认验证

- `scripts/verify.sh meta`
- `scripts/verify.sh integration`
- `scripts/verify.sh e2e`
- 额外补一组真实 `Hermes-Agent` substrate proof

## 长线 Codex 提示词

> 你现在负责 `RedCube AI` 的 `upstream Hermes-Agent fast cutover` 主线。先完整读取并遵守以下文档：`AGENTS.md`、`README.md`、`docs/project.md`、`docs/status.md`、`docs/architecture.md`、`contracts/runtime-program/current-program.json`、`docs/program/upstream_hermes_agent_fast_cutover_board.md`。目标不是继续打磨 repo-local runtime，也不是先做 UI；目标是在不改写 RedCube visual domain boundary 的前提下，以最快速度把 runtime substrate 责任切到真实上游 `Hermes-Agent`，并形成可被未来 `OPL Gateway` 调用的 service-safe domain entry surface。你必须按 board 的顺序自行推进：先冻结真实上游连接证据，再迁移 runtime owner，再收口 domain entry adapter，再做端到端验证。你可以自己写 activation package、tests、contracts、docs，并在每个 honest tranche 完成后直接 absorb 到 `main`、提交、push、继续下一棒；不要因为“已完成一个小 tranche”就停车。只有遇到真实硬 blocker 才允许停下，例如：需要外部安装/凭证/网络服务、需要用户做不可替代决策、或继续前进会造成 truth drift。禁止做的事：把 repo-local `Hermes` 命名包装成已接入上游、先开新 family、先补 academic poster、先做聊天 UI、先讲平台故事。每次推进都必须同步更新 docs / contracts / tests，并用 fresh verification 证明当前说法成立。
