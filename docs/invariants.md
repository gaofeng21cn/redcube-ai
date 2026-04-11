# RedCube AI 硬约束

## Formal-entry

- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
- 不得把 `controller` 误写成公开产品入口。

## Mainline truth

- `contracts/runtime-program/current-program.json` 是当前 active mainline pointer。
- `contracts/runtime-program/*.json` 是 tranche / board / provenance 的机器可读真相面。
- `docs/program/*/*.md` 是对应的人类可读 brief，必须与 contracts 和 tests 同步。

## 文档治理

- `AGENTS.md` 只管工作方式，不堆项目事实。
- 核心项目知识优先收敛到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- 公开文档双语；内部规划、审计与维护文档默认中文。

## 本地状态

- `.runtime-program/`、`.codex/`、`.omx/` 必须保持未跟踪。
- `.omx/` 若存在，只能作为历史残留，不得再作为当前 workflow 入口。
