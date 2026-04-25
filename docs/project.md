# RedCube AI 项目概览

## 项目是什么

`RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的独立 visual-deliverable domain agent。
对外第一主语是单一 `redcube-ai` app skill 与 direct product entry；当前仓库主线按 `Auto-only` 理解，formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
当前可执行基线已经按三层边界收口：对外默认稳定 capability surface 是 `redcube-ai app skill / CLI / MCP / invokeDomainEntry / invokeProductEntry / 本地脚本 / repo-tracked contracts`，默认 concrete executor 仍是本地 `Codex CLI`；`Hermes-Agent` 相关路径只保留为显式 hosted/proof backend 或技术参考。
当前入口真相是：`redcube-ai` app skill、`CLI / MCP` 已经构成可验证的 `agent entry`，同时 repo-verified 的轻量 `product entry` service surface 也已落地；但真正面向最终用户的成熟前台壳仍未落地。
当前统一协作模型是：`RedCube AI` 自己继续负责 domain authority、review / publication projection 与 visual-domain truth；具体 deliverable 的执行器保持可插拔，但默认 lane 仍是 `Codex CLI`，而 hosted/proof backend 只作为显式附加层挂在同一套 contract 之下。
`gateway / harness` 在本仓继续作为内部架构边界语言，不作为仓库对外第一身份。
当前已冻结的 direct target shape 是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

`OPL` 的 internal bridge / integration reference surface 对应：

`User -> OPL Product Entry -> OPL Gateway -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

这说明 `RedCube AI` 的理想型是一个可被用户直接进入、也可被 `OPL` 通过内部桥接调用的 visual-domain 产品 / 服务节点，而不是把仓库继续磨成 repo-local runtime，或把自己写成整个 `OPL`。

## 项目目标

- 稳定独立 domain-agent 的 formal-entry、service-safe entry 与执行链路，并保持内部 `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 边界可维护。
- 用 machine-readable contracts 与显式校验收紧 runtime mainline。
- 保持稳定 capability surface、默认 `Codex CLI` concrete executor 与 visual-domain boundary 一起对齐；hosted runtime carrier 只作为显式可选 backend，不改写默认公开合同。
- 冻结一个可被 `OPL` handoff 调用的 service-safe domain entry adapter，而不是先做聊天 UI。
- 落地可 direct 调用、也可由 `OPL` 通过 internal bridge 调用的 lightweight domain `product entry` service surface，并把 session continuity 收到用户级 runtime-state。
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
