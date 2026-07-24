# RCA Runtime Operating Model

Owner: OPL Framework / RedCube AI
Purpose: 冻结运行期 owner split。
State: active
Machine boundary: 具体字段由 OPL runtime contract、RCA action/stage/authority contracts 决定。

## Package / carrier owner

RCA 持有 executor-neutral Package identity、capabilities、business Work Item / typed-view
语义与稳定 entrypoints。实际 carrier platform 持有其承载 bytes 的
install/update/remove 和 fresh readback；Codex Plugin 只是当前 carrier projection。
Framework 只聚合 complete Package installed/callable、required/optional presence graph
与薄 action，不维护第二套 resolver、lock、payload、receipt 或 rollback manager。

## OPL runtime owner

OPL 持有 generated interfaces、StageRun、Attempt、session、workspace/source transport、
artifact index transport、review/repair transport、native-helper envelope、transition
materialization、execution receipt ledger 与 workbench projection。

## RCA owner

RCA 持有 visual truth、route semantics、review/export verdict、artifact mutation authorization、visual memory decision、owner receipt语义与 native-helper implementation。

## Executor

Codex CLI 是当前首选且唯一产品化的 executor route。executor process、identity、
isolation、retry 与 route readiness 由 OPL 控制；RCA pack 不实现 executor adapter。
公共 Package surface 保持 executor-neutral，切换 route 不得重装 RCA 或丢失 task、
Temporal refs 与 typed views。

## Progress 与 hard stop

可消费 artifact 优先进入后续 stage，并携带明确 quality debt。literal zero consumable artifact、authority/safety/currentness violation、不可逆授权缺失或显式 human decision 才能成为 hard stop。developer proof 和 provider completion不能自行关闭 domain gate。

## No private fallback

缺少 OPL runtime、complete Package bytes、required capability presence 或 callable
executor route 时应返回相应 diagnostic / typed blocker，不得退回 repo-local CLI、
runtime、session store、直接 helper public command 或兼容 alias。普通 dependency 不因
版本/ABI、lock、payload、digest 或 Release Set 不匹配而阻断。

当前 manifest 中的旧 lifecycle 字段只作迁移兼容输入；本 policy 不声明 carrier
迁移已经完成。
