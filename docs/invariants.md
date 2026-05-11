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
- `OPL Runtime Manager` 只允许作为 OPL 侧 thin adapter/projection layer over the configured family runtime provider；Temporal 是目标生产 substrate，`Hermes-Agent` 只保留为迁移期 legacy/optional provider、显式 hosted/proof backend 或 executor proof lane。它不得成为 RedCube visual-domain truth owner、canonical artifact owner、review/publication projection owner、scheduler kernel、session store、memory store、concrete executor 或 private Hermes fork。

## 目标优先级

- 一旦新的 runtime substrate 目标已经明确，新增投入默认服务目标形态，而不是继续深磨已放弃的旧宿主路线。
- 当前默认公开 capability contract 固定为 `CLI / MCP / product-entry/service-safe-domain-entry surface + Codex-default execution`；hosted runtime carrier 只允许作为显式可选 backend/proof lane。
- 历史 `repo-local managed runtime pilot` 也是本地迁移形态，不得被误写成当前 runtime owner；`Hermes-Agent` 相关路径也不得被误写成默认公开合同。
- `TypeScript + Python` 是实现目标，不是绕过 runtime-family 的许可。Python native PPT/Office helper 必须挂在 RedCube product-entry、route/proof lane、review/export gate 与 repo-tracked contract 下。
- 如果当前基线与长线目标并存，必须在 `docs/status.md` 与 `docs/README*` 中显式拆开。
- 当前 OPL stage-led 对齐已经落到 RCA-owned `family_action_catalog`、`stage_control_projection`、`route_equivalence`、product sidecar adapter 与 `opl_runtime_manager_registration`；这些 surface 只供 OPL discovery、queue、wakeup、handoff、receipt、retry/dead-letter 和 operator projection 使用，不授权 OPL 生成 visual route、review verdict、publication projection truth 或 canonical artifact。
- 旧 `external Hermes-Agent runtime substrate` route wording、历史 `OPL Gateway` 文件名、repo-local managed runtime pilot、`status` compatibility command key、`internal OPL bridge` compatibility wording 只能作为 migration provenance、internal integration contract 或 compatibility key 保留；它们不得回到默认 public entry 或 runtime owner。物理删除必须以 direct route / service-safe domain entry / product sidecar / stage descriptor parity 已验证为前提。

## 文档治理

- `AGENTS.md` 只管工作方式，不堆项目事实。
- 核心项目知识优先收敛到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- 公开文档双语；内部规划、审计与维护文档默认中文。

## 本地状态

- 项目级 `.codex/` 与 `.omx/` 已退役，不再作为当前 workflow 入口。
- 项目级 `.runtime-program/` 已退役，不再作为当前 workflow 入口。
- 本地 session、prompt、log、report 或 hook 状态统一迁入用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
