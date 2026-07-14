# RCA Runtime Operating Model

Owner: OPL Framework / RedCube AI
Purpose: 冻结运行期 owner split。
State: active
Machine boundary: 具体字段由 OPL runtime contract、RCA action/stage/authority contracts 决定。

## OPL owner

OPL 持有 package lifecycle、generated interfaces、StageRun、Attempt、session、workspace/source transport、artifact index transport、review/repair transport、native-helper envelope、transition materialization、receipt ledger 与 workbench projection。

## RCA owner

RCA 持有 visual truth、route semantics、review/export verdict、artifact mutation authorization、visual memory decision、owner receipt语义与 native-helper implementation。

## Executor

Codex CLI 是第一公民 executor。executor process、identity、isolation、retry 与 currentness 由 OPL 控制；RCA pack 不实现 executor adapter。

## Progress 与 hard stop

可消费 artifact 优先进入后续 stage，并携带明确 quality debt。literal zero consumable artifact、authority/safety/currentness violation、不可逆授权缺失或显式 human decision 才能成为 hard stop。developer proof 和 provider completion不能自行关闭 domain gate。

## No private fallback

缺少 OPL runtime 或 package currentness 时应返回 typed blocker，不得退回 repo-local CLI、runtime、session store、直接 helper public command 或兼容 alias。
