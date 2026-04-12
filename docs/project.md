# RedCube AI 项目概览

## 项目是什么

`RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的 visual-deliverable domain gateway 与 `Domain Harness OS`。
当前仓库主线按 `Auto-only` 理解，formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
当前可执行基线已经把 route / managed run surface 切到真实上游 `Hermes-Agent`，同时把 visual-domain truth 继续留在 `RedCube AI`。
当前入口真相是：`CLI / MCP` 已经构成可验证的 `agent entry`，但真正面向最终用户的轻量 `product entry` 还没有落地。

## 项目目标

- 稳定 `gateway -> family -> profile -> pack -> harness execution` 的正式控制链路。
- 用 machine-readable contracts 与显式校验收紧 runtime mainline。
- 把 repo-local runtime 责任逐步交还给真实的上游 `Hermes-Agent` substrate，同时保留 RedCube 的 visual-domain boundary。
- 冻结一个可被 future `OPL` handoff 调用的 service-safe domain entry adapter，而不是先做聊天 UI。
- 补齐可被用户直接进入、也可由 `OPL` handoff 进入的 lightweight domain `product entry`。
- 在不改写 domain 语义的前提下，继续维护 absorbed tranche、follow-on board 与 provenance。

## 非目标

- 不把 `RedCube AI` 写成通用助手或整个 `OPL` 系统。
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
