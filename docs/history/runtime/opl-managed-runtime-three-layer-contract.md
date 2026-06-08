# OPL 托管运行时三层合同

Owner: `RedCube AI`
Purpose: `historical_opl_managed_runtime_owner_boundary`
State: `historical_provenance`
Machine boundary: 人读历史 owner-boundary brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 runtime owner docs。

生命周期说明：本文是历史 owner-boundary 讨论，已从 `docs/references/` 迁入 `docs/history/`。它只保留三层 owner 语境的 provenance，不再承担 current support reference、runtime target、OPL production substrate 或 RCA active plan 职责。当前 RCA runtime truth 以 `docs/runtime/`、核心五件套、`docs/active/rca-ideal-state-gap-plan.md` 和 runtime-program contracts 为准。

直接打开本文时先按下面的 current read 约束阅读：

- `managed runtime / session / run / watch / resume owner` 是历史三层讨论里的抽象 owner wording；当前实现读作 OPL provider-backed stage runtime / attempt ledger / queue / wakeup / projection owner，不恢复 RCA repo-local managed runtime、session shell、runner 或 workbench。
- `Hermes-hosted`、`Hermes` 和 `hermes_agent` 只保留为 legacy/optional provider、显式 proof lane、executor adapter evaluation、diagnostic 或历史参考；Temporal-backed provider 是 production online runtime 的必需 substrate，`Codex CLI` 仍是默认第一公民 executor。
- RCA 当前只持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt、typed blocker 和必要 native helper implementation；OPL/runtime provider completion 不授权 visual ready、exportable、handoffable、domain ready 或 production ready。
- 本文中的共享框架“下一步”不再作为 active backlog 读取；当前迁移顺序和差距以 active gap plan、runtime owner docs 与 machine-readable contracts 为准。

这份历史文档曾冻结 `OPL` 家族仓在托管运行时上的统一 owner 口径。当前系列口径已经更新为 provider-backed OPL runtime：OPL 是 stage-led、以 Agent executor 为最小执行单位的运行框架，Temporal 是 production online runtime 的必需 substrate，Hermes 只是 legacy/optional provider 或显式 proof lane；RCA 默认最小具体执行单元仍是 `Codex CLI`。

这份历史讨论当时的目标不是完成跨仓共享代码抽取，而是先把跨仓不能再漂移的 owner wording 冻结下来。当前跨仓 shared primitive、runtime substrate、default caller 和 generated surface 口径不从本文派生。

## 历史三层形状

当时统一按三层理解：

- OPL stage-led hosted integration / configured family runtime provider
  - 长期运行与托管能力 owner；Temporal 是 production online runtime 的必需 substrate，Hermes 只保留 legacy/optional provider 或显式 proof lane
- domain supervision
  - 领域治理、质量门控、进度真相、恢复判断 owner
- quest executor
  - 具体干活、产生 artifact 与具体副作用

当时对应到 `RedCube AI`：

- OPL stage-led hosted integration / configured family runtime provider
  - managed runtime / session / run / watch / resume owner；不持有 RCA visual truth
- `RedCube AI`
  - visual governance / audit / review / publication projection owner
- concrete executor
  - 当前 routed visual execution chain
  - 默认 concrete executor 仍是 `Codex CLI host-agent runtime`

## 历史切分原因

如果长期托管 owner 和领域治理 owner 不分开，就会反复出现两类错误：

- 上层不知道 live deliverable run 有没有掉线
- domain repo 抢先跳过 runtime，自己去做本该由 executor 完成的后续动作

三层切开后：

- OPL stage-led hosted integration / configured family runtime provider 只负责长期在线、调度、恢复和托管宿主
- `RedCube AI` 只负责 visual-domain truth、review gate 与 publication projection
- concrete executor 只负责按已放行 route 把活干出来

## 历史 RedCube 落点

- 当时完成的是跨仓 contract / 入口 / 文档同构讨论，不是跨仓共享代码模块抽离完成。
- 当时默认 executor backend 仍按 `codex_cli` 读取。
- `hermes_agent` 在这份历史讨论里只是显式 opt-in full-agent-loop proof lane。

## 历史共享候选

本节只记录当时的共享候选，不再作为 active backlog 读取。当前共享顺序、contract owner、OPL provider 边界和代码上收以 OPL / RCA current owner docs、runtime-program contracts、source/tests、owner receipts 和 typed blockers 为准。

当时第一批共享候选：

- 三层角色命名与 owner truth
- runtime owner / domain owner / executor owner 的 machine-readable envelope
- status / cockpit / progress 上的用户可见术语
- domain supervision 不得越过 runtime 的 fail-closed 规则

当时第二批代码共享候选：

- `Hermes-hosted` job / status manifest shape
- attention queue / recovery contract
- 如果三个仓的 controller 形状已经高度同构，再抽 `opl-runtime-contracts` 一类共享模块

## 历史排除范围

- 不在这一轮直接做跨仓 monorepo
- 不把 `RedCube AI` 的 domain logic 和其他仓硬揉成一个 controller
- 不把“未来共享代码模块”提前写成已完成事实

## No-Resurrection Boundary

- 不把本文恢复为 current runtime support reference、OPL production substrate proof、RCA active plan、implementation checklist 或 shared-code extraction backlog。
- 不把 `managed runtime / session / run / watch / resume owner` 恢复为 RCA repo-local runtime owner、session shell、runner、workbench、compatibility alias、facade 或 wrapper。
- 不把 `Hermes-hosted` / `hermes_agent` 写成默认 runtime owner、production substrate、OPL provider readiness 或 visual readiness proof。
- 任何当前共享模块、provider boundary、default caller 或 physical-delete 工作都必须从当前 core docs、`docs/runtime/`、active gap plan、contracts、source/tests、owner receipts 和 typed blockers 重新证明。
