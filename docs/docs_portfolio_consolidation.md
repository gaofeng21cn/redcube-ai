# Docs Portfolio Consolidation

日期锚点：`2026-05-06`

## 本轮边界

本轮只整理叙述性 `docs/**` 与文档索引，不改源码、测试或 `contracts/runtime-program/*.json`。

## 当前分层

- `docs/README*`：公开 / 默认 docs 入口，指向核心五件套与稳定阅读层。
- 核心五件套：`project.md`、`status.md`、`architecture.md`、`invariants.md`、`decisions.md`，继续承担当前真相入口。
- `docs/program/`：active baton 与 contract-linked program records。仍被 runtime-program 机器合同引用的 brief 保持原位，避免只改 Markdown 导致 current baton 断链。
- `docs/references/`：解释当前运行、目标状态或维护者实践的支持性技术参考。
- `docs/policies/`：长期稳定规则。
- `docs/history/`：repo-tracked 历史 provenance、归档过程记录与不再服务当前 baton 的历史计划；本地 AI / Superpowers 草稿继续保持未跟踪。

## 本轮归档原则

- `docs/program/hermes/**` 属于 repo-local Hermes migration provenance，已迁入 `docs/history/hermes/`。
- `docs/superpowers/**` 仍按本仓约定保持未跟踪；本轮不把本地 AI / Superpowers 过程草稿导入 repo-tracked history。
- `docs/program/phase-2/**` 与 `docs/program/upstream_hermes_agent_*.md` 仍存在 runtime-program 合同引用，因此本轮只用 `docs/program/README.md` 标明 absorbed / baton 性质，不做物理迁移。
- `docs/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md` 是已自标历史状态且无 runtime-program 合同引用的计划工件，归入 `docs/history/plans/`。

## 验证口径

叙述性文档不作为测试断言对象。本轮默认验证为：

- `git diff --check`
- Markdown 链接目标的轻量静态检查
