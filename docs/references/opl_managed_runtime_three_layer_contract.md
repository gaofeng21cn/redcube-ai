# OPL 托管运行时三层合同

这份参考文档冻结 `OPL` 家族仓在托管运行时上的统一 owner 口径。

生命周期说明：本文保留历史三层 owner 讨论的参考价值。当前系列口径已经更新为 provider-backed OPL runtime：OPL 是 Codex-first、stage-led 的运行框架，Temporal 是 production online runtime 的必需 substrate，Hermes 只是 legacy/optional provider 或显式 proof lane；RCA 默认最小具体执行单元仍是 `Codex CLI`。

目标不是这轮就完成跨仓共享代码抽取，而是先把跨仓不能再漂移的 contract 写死。

## 一句话形状

统一按三层理解：

- `OPL Runtime Manager / configured family runtime provider`
  - 长期运行与托管能力 owner；Temporal 是 production online runtime 的必需 substrate，Hermes 只保留 legacy/optional provider 或显式 proof lane
- domain supervision
  - 领域治理、质量门控、进度真相、恢复判断 owner
- quest executor
  - 具体干活、产生 artifact 与具体副作用

对应到 `RedCube AI`：

- `OPL Runtime Manager / configured family runtime provider`
  - managed runtime / session / run / watch / resume owner；不持有 RCA visual truth
- `RedCube AI`
  - visual governance / audit / review / publication projection owner
- concrete executor
  - 当前 routed visual execution chain
  - 默认 concrete executor 仍是 `Codex CLI host-agent runtime`

## 为什么这样切

如果长期托管 owner 和领域治理 owner 不分开，就会反复出现两类错误：

- 上层不知道 live deliverable run 有没有掉线
- domain repo 抢先跳过 runtime，自己去做本该由 executor 完成的后续动作

三层切开后：

- `OPL Runtime Manager / configured family runtime provider` 只负责长期在线、调度、恢复和托管宿主
- `RedCube AI` 只负责 visual-domain truth、review gate 与 publication projection
- concrete executor 只负责按已放行 route 把活干出来

## RedCube 当前落点

- 这轮已完成的是跨仓 contract / 入口 / 文档同构
- 这轮没有宣称跨仓共享代码模块已经抽离完成
- 默认 executor backend 仍是 `codex_cli`
- `hermes_agent` 继续只是显式 opt-in full-agent-loop proof lane

## 共享框架下一步

当前最适合先共享的是 contract，不是代码包。

第一批共享内容：

- 三层角色命名与 owner truth
- runtime owner / domain owner / executor owner 的 machine-readable envelope
- status / cockpit / progress 上的用户可见术语
- domain supervision 不得越过 runtime 的 fail-closed 规则

第二批再考虑代码共享：

- `Hermes-hosted` job / status manifest shape
- attention queue / recovery contract
- 如果三个仓的 controller 形状已经高度同构，再抽 `opl-runtime-contracts` 一类共享模块

## 当前不做的事

- 不在这一轮直接做跨仓 monorepo
- 不把 `RedCube AI` 的 domain logic 和其他仓硬揉成一个 controller
- 不把“未来共享代码模块”提前写成已完成事实
