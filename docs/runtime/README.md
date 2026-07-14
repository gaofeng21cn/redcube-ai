# Runtime

Owner: OPL Framework 与 RedCube AI
Purpose: 索引 OPL-hosted runtime 与 RCA domain boundary。
State: active
Machine boundary: StageRun/Attempt/session/receipt runtime contract 归 OPL；RCA 只声明 domain pack、authority 和 helper refs。

- [Runtime architecture](./runtime_architecture.md)

RCA 仓没有 repo-local runtime。Temporal-backed provider、StageRun、Attempt ledger、session isolation、resume/retry、route materialization、native-helper process envelope 与 status/workbench projection均归 OPL。
