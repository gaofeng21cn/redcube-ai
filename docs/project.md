# RedCube AI 项目概览

## 项目是什么

`RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的独立 visual-deliverable domain agent。
当前仓库主线按 `Auto-only` 理解，formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
当前可执行基线已经按三层 owner 收口：`Hermes-Agent` 持有长期运行与托管能力，`RedCube AI` 继续持有 visual-domain truth，而默认 concrete executor 仍是本地 `Codex CLI` host-agent runtime。
当前入口真相是：`CLI / MCP` 已经构成可验证的 `agent entry`，同时 repo-verified 的轻量 `product entry` service surface 也已落地；但真正面向最终用户的成熟前台壳仍未落地。
当前统一协作模型是：`Hermes-Agent` 负责 route / managed runtime 的长期托管与 hosting，`RedCube AI` 自己继续负责 domain authority、review / publication projection 与 visual-domain truth；具体 deliverable 的执行器保持可插拔，但受保护创作 stage 必须回到 AI-first 主线。
`gateway / harness` 在本仓继续作为内部架构边界语言，不作为仓库对外第一身份。
当前已冻结的最终目标形态是：

`User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

与之对应的 direct domain 路线则是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

这说明 `RedCube AI` 的理想型是一个可被 `OPL` 调用、也可被用户直接进入的 visual-domain 产品 / 服务节点，而不是把仓库继续磨成 repo-local runtime，或把自己写成整个 `OPL`。

## 项目目标

- 稳定独立 domain-agent 的 formal-entry、service-safe entry 与执行链路，并保持内部 `gateway -> family -> profile -> pack -> harness execution` 边界可维护。
- 用 machine-readable contracts 与显式校验收紧 runtime mainline。
- 把长期 route / managed runtime owner 稳定收口到 `Hermes-Agent`，同时保留 RedCube 的 visual-domain boundary，并让默认 `Codex CLI` concrete executor 继续通过同一 executor-adapter contract 工作。
- 冻结一个可被 `OPL` handoff 调用的 service-safe domain entry adapter，而不是先做聊天 UI。
- 落地可 direct 调用、也可由 `OPL` federated handoff 调用的 lightweight domain `product entry` service surface，并把 session continuity 收到用户级 runtime-state。
- 在不改写 domain 语义的前提下，继续维护 absorbed tranche、follow-on board 与 provenance。

## 非目标

- 不把 `RedCube AI` 写成通用助手或整个 `OPL` 系统。
- 不把 `RedCube AI` 写成 `OPL` 内部 workflow。
- 不把 ontology 语义和宿主包装混写。
- 不用隐藏 fallback chain、prompt patch 或静默 profile 推断替代显式 contract。

## 默认入口

建议阅读顺序：

1. `README.md`
2. `docs/README.md`
3. `docs/status.md`
4. `docs/project.md`
5. `docs/architecture.md`
6. `docs/invariants.md`
7. `contracts/runtime-program/current-program.json`
