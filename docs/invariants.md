# RedCube AI 硬约束

## Formal-entry

- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
- 不得把 `controller` 误写成公开产品入口。
- `Codex CLI` 作为 executor adapter 选中的默认 concrete executor 不得被隐式改写。

## Mainline truth

- `contracts/runtime-program/current-program.json` 是当前 active mainline pointer。
- `contracts/runtime-program/*.json` 是 tranche / board / provenance 的机器可读真相面。
- `docs/program/*/*.md` 是对应的人类可读 brief，必须与 contracts 和 tests 同步。
- `Hermes-Agent` 一词只允许指上游外部 runtime 项目 / 服务；仓内自写 package、pilot、shim 或 scaffold 不得写成“已接入 Hermes-Agent”。
- 对外主语固定为“独立 visual-deliverable domain agent”；`gateway / harness` 只作为内部架构边界语言。
- repo-verified direct route 与 OPL federated route 必须共用同一个 downstream domain-agent entry（service-safe domain entry）。
- `OPL` 在 RCA 主线中只保留 family-level session/runtime/projection 与 shared modules/contracts/indexes。

## 目标优先级

- 一旦新的 runtime substrate 目标已经明确，新增投入默认服务目标形态，而不是继续深磨已放弃的旧宿主路线。
- 当前可运行的 `Codex-default host-agent runtime` 是 repo-verified baseline，但它只能作为迁移桥、兼容层或回归基线存在，不应再被误写为长期产品终态。
- 历史 `repo-local managed runtime pilot` 也是本地迁移形态，不得被误写成当前 runtime owner；当前 route / managed run owner 已是上游 `Hermes-Agent`。
- 如果当前基线与长线目标并存，必须在 `docs/status.md` 与 `docs/README*` 中显式拆开。

## 文档治理

- `AGENTS.md` 只管工作方式，不堆项目事实。
- 核心项目知识优先收敛到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- 公开文档双语；内部规划、审计与维护文档默认中文。

## 本地状态

- 项目级 `.codex/` 与 `.omx/` 已退役，不再作为当前 workflow 入口。
- 项目级 `.runtime-program/` 已退役，不再作为当前 workflow 入口。
- 本地 session、prompt、log、report 或 hook 状态统一迁入用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
