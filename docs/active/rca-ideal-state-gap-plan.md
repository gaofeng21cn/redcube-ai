# RCA 理想目标态差距与完善计划

Owner: RedCube AI
Purpose: 把标准 Agent 目标拆成可验收条目，并区分结构差距与证据差距。
State: active_closeout
Machine boundary: 百分比必须由 final exact SHA 的 executable evidence 支撑。

## 目标态

RCA 只保留 declarative visual pack、RCA authority semantics 与 native-helper implementation；所有通用安装、generated surfaces、runtime、session、workspace、review/repair transport 和 App shell 由 OPL 提供。

## 功能与结构条目

| 条目 | 目标 | 候选状态 | 验收 |
| --- | --- | --- | --- |
| 私有源码退役 | 旧 CLI/domain-entry/runtime/governance/overlay 物理为零 | implemented, final readback pending | private-platform strict + fresh `rg` |
| Generated/hosted cutover | action/stage/interface 无 repo-local command/handler target | implemented, final admission pending | OPL interfaces + conformance |
| Package lifecycle | RCA manifest 只声明 sidecar；install/update/rollback 归 OPL Connect | implemented, final admission pending | manifest validation + package currentness readback |
| Native-helper envelope | RCA 保留 helper body，OPL 持有 catalog resolution/process/receipt envelope | implemented, final tests pending | catalog tests + developer proof |
| Authority boundary | visual/review/export/artifact/memory/owner semantics 不迁给 OPL | implemented, final tests pending | authority contracts + focused tests |
| Test/CI cutover | 不再构建或调用私有 runtime；CI 使用最新 OPL admission | implemented, final run pending | smoke/fast/full/typecheck/CI contract |
| Docs/contract foldback | active docs 与 machine index 不再维护第二真相 | implemented, final residue scan pending | docs readback + retired-token scan |

## 测试与证据条目

| 条目 | 类型 | 当前边界 |
| --- | --- | --- |
| source-closure/interfaces/conformance/default-callers/residue | structural admission | 必须在 final bytes 上 fresh 运行 |
| native-helper unit/quality/proof tests | executable implementation evidence | 能证明 helper 行为，不证明 production readiness |
| real visual StageRun + owner acceptance | live evidence | 后置，尚不能由结构迁移替代 |
| provider restart/resume/retry/dead-letter | production substrate evidence | OPL owner lane 后置验证 |
| repeated cross-family no-regression | scale evidence | 后置验证 |

## Closeout 纪律

只有 exact final SHA 上所有 structural admission 通过后，功能/结构条目才可标记 `done 100%`。Live evidence 未完成时，必须明确写成 evidence gap，而不是把结构条目降级或把测试写成 ready claim。
