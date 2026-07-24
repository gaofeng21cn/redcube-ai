# RedCube AI 文档

Owner: RedCube AI
Purpose: RCA 当前人读文档入口。
State: active
Machine boundary: 机器真相只来自 `agent/`、`contracts/`、`python/redcube_ai/native_helpers/`、OPL compiled interfaces、运行回执与 RCA authority refs；本文不是运行时接口。

## 当前模型

RedCube AI 是 `OPL Package(kind=agent)` 形式的标准 visual-deliverable Agent：

`executor-neutral identity + Declarative Visual Pack + OPL generated/hosted surfaces + RCA authority decisions + Python native helpers`

RCA 不再维护 repo-local CLI、domain-entry、scheduler、runner、Attempt ledger、session
store、workspace/source shell、review/repair transport、status/workbench wrapper 或
Package Manager。实际 carrier 负责 bytes 生命周期，OPL Framework 只提供跨 carrier
发现、presence/callability、运行状态聚合与 generated surfaces。

RCA 继续持有：

- `rca` Package identity、capabilities、业务 task / Work Item、typed views 与稳定
  entrypoints；
- visual truth、communication/visual-direction decision 与 route semantics；
- review/export verdict、artifact mutation authorization 与 visual memory accept/reject；
- owner receipt / typed blocker 的领域语义；
- PPT、Office、截图、render、review、export 等 native-helper 实现。

Codex Plugin 是当前首个 carrier projection，Codex CLI 是当前首选 executor；二者都
不是 RCA Package identity。RCA owner 的发布边界是自己的 GHCR repository 和自己的
`latest-stable`。普通 dependency 只检查 identity presence 与 callability，不做
版本/ABI/lock/payload/digest/Release Set 求解。

Framework 跨仓迁移 SSOT：
[OPL Package 平台组合迁移计划](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md)。
本仓只记录 RCA owner 边界、当前兼容差距和领域验收，不复制整套平台计划。

## 阅读顺序

1. [项目定位](./project.md)
2. [架构](./architecture.md)
3. [硬约束](./invariants.md)
4. [关键决策](./decisions.md)
5. [当前状态](./status.md)
6. [差距与验收](./active/rca-ideal-state-gap-plan.md)

## 文档分层

| 目录 | 职责 |
| --- | --- |
| `docs/active/` | 尚未关闭的功能、结构与证据差距 |
| `docs/product/` | 用户/operator 如何通过 OPL-generated RCA surface 使用 Agent |
| `docs/runtime/` | OPL-hosted StageRun 与 RCA authority/native-helper 边界 |
| `docs/delivery/` | 视觉交付、PPT 路线、proof 与 export 说明 |
| `docs/source/` | OPL workspace/source intake 与 RCA source-readiness 语义边界 |
| `docs/policies/` | 稳定领域规则 |
| `docs/specs/` | 当前技术规格 |
| `docs/references/` | 支撑性设计参考 |
| `docs/history/` | 已退役控制面和完成计划的 provenance；不得作为 active caller |

## 证据边界

contract、focused test、source-closure 或 interface admission 只能证明结构和机器边界；它们不自动证明 visual ready、exportable、handoffable、domain ready 或 production ready。真实 StageRun、真实 artifact、review/export acceptance、owner receipt 和 long-soak 继续作为后置证据。

当前 `contracts/opl_agent_package_manifest.json` 仍含旧 lifecycle 字段，是迁移兼容
合同。文档归位、repo tests 或 schema pass 都不能证明独立 GHCR publisher、完整
carrier installed truth、executor-neutral route 或旧 Package Manager 删除已经完成。
