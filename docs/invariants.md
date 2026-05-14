# RedCube AI 硬约束

## Formal-entry

- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
- 不得把 `controller` 误写成公开产品入口。
- `Codex CLI` 作为 executor adapter 选中的默认 concrete executor 不得被隐式改写。
- 在 OPL 托管路径中，除非调用方显式选择 hosted/proof backend，`Codex CLI` 仍是 RCA 的最小具体执行单元。

## Mainline truth

- `contracts/runtime-program/current-program.json` 是当前 active mainline pointer。
- `contracts/runtime-program/*.json` 是 tranche / board / provenance 的机器可读真相面。
- `docs/program/*/*.md` 是对应的人类可读 brief，必须与 contracts 和 tests 同步。
- `Hermes-Agent` 一词只允许指上游外部 runtime 项目 / 服务；仓内自写 package、pilot、shim 或 scaffold 不得写成“已接入 Hermes-Agent”。
- 对外主语固定为“独立 visual-deliverable domain agent”；`gateway / harness` 只作为内部架构边界语言。
- repo-verified direct route 与 OPL-hosted route 必须共用同一个 downstream domain-agent entry（service-safe domain entry）。
- `OPL` 在 RCA 主线中是可外部依赖的 stage-led、以 Agent executor 为最小执行单位的智能体运行框架；它只保留 family-level session/runtime/projection 与 shared modules/contracts/indexes，不成为 RCA 第一公开身份。
- `OPL Runtime Manager` 只允许作为 OPL 侧 thin adapter/projection layer over the Temporal-backed family runtime provider；Temporal 是 OPL production online runtime 的必需 substrate，`Hermes-Agent` 只保留为迁移期 legacy/optional provider、显式 hosted/proof backend 或 executor proof lane，local provider 只用于 dev/CI/offline diagnostics。它不得成为 RedCube visual-domain truth owner、canonical artifact owner、review/publication projection owner、scheduler kernel、session store、memory store、concrete executor 或 private Hermes fork。

## 目标优先级

- 一旦新的 runtime substrate 目标已经明确，新增投入默认服务目标形态，而不是继续深磨已放弃的旧宿主路线。
- 当前默认公开 capability contract 固定为 `CLI / MCP / product-entry/service-safe-domain-entry surface + Codex-default execution`；hosted runtime carrier 只允许作为显式可选 backend/proof lane。
- 历史 `repo-local managed runtime pilot` 也是本地迁移形态，不得被误写成当前 runtime owner；`Hermes-Agent` 相关路径也不得被误写成默认公开合同。
- `TypeScript + Python` 是实现目标，不是绕过 runtime-family 的许可。Python native PPT/Office helper 必须挂在 RedCube product-entry、route/proof lane、review/export gate 与 repo-tracked contract 下。
- 如果当前基线与长线目标并存，必须在 `docs/status.md` 与 `docs/README*` 中显式拆开。
- 当前 OPL stage-led 对齐已经落到 RCA-owned `family_action_catalog`、`stage_control_projection`、`route_equivalence`、product sidecar adapter 与 `opl_runtime_manager_registration`；这些 surface 只供 OPL discovery、queue、wakeup、handoff、receipt、retry/dead-letter 和 operator projection 使用，不授权 OPL 生成 visual route、review verdict、publication projection truth 或 canonical artifact。
- 旧 `external Hermes-Agent runtime substrate` route wording、历史 `OPL Gateway` 文件名、repo-local managed runtime pilot、`status` command key 与旧 bridge wording 只能作为 migration provenance、internal integration contract 或 tombstone 语境保留；它们不得回到默认 public entry 或 runtime owner。active surface 必须以 direct route / service-safe domain entry / product sidecar / stage descriptor / OPL-hosted handoff parity 为准。
- 已退役的 active 接口不保留兼容别名：`REDCUBE_WORKBENCH_ROOT`、standalone upstream Hermes probe script、`GatewayActionMap` / `getCliGatewayActions`、`callGatewayTool` / `listGatewayTools` / `GatewayTool*`、`source_workbench*`、frontdoor/federation/product frontdesk/source-pack-federation 等旧入口不得重新进入源码、测试、contracts 或 package surface。仍被合同引用的旧文档只能作为 provenance 原位保留。

## 文档治理

- `AGENTS.md` 只管工作方式，不堆项目事实。
- 核心项目知识优先收敛到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- 公开文档双语；内部规划、审计与维护文档默认中文。
- `README*` 与 `docs/README*` 必须先写 RCA 的视觉交付身份，再写 OPL 托管 / 内部集成路径。
- 含有旧 gateway、bridge、harness、Hermes-first 或 OPL-first 口径的文档，若仍被 `human_doc:*` 或 runtime-program 合同引用，留在原生命周期层并补充 lifecycle/provenance 说明；无合同引用且不服务当前 baton 的旧计划进入 `docs/history/` 或 tombstone 语境。
- 开发计划 closeout 必须显式列出 `planned`、`done`、`deferred`、`skipped`、`verification`、`commit-push state`；`deferred` 必须可追溯到合同引用、真实 blocker 或明确 history/tombstone 落点。

## 本地状态

- 项目级 `.codex/` 与 `.omx/` 已退役，不再作为当前 workflow 入口。
- 项目级 `.runtime-program/` 已退役，不再作为当前 workflow 入口。
- 本地 session、prompt、log、report 或 hook 状态统一迁入用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
