# RedCube AI 硬约束

Owner: RedCube AI
Purpose: 冻结标准 Agent 不能破坏的边界。
State: active
Machine boundary: 可执行校验见 root contracts、`scripts/check-private-platform-retirement.ts` 与标准 Agent admission。

1. canonical agent/package id 固定为 `rca`；`redcube-ai` 仅是 carrier locator。
2. 正式入口只能来自安装后的 OPL-generated surface；repo-local `redcube` CLI、domain-handler 或 runtime wrapper 不得恢复。
3. OPL 持有 StageRun、Attempt、session、queue、retry、resume、transition materialization 与 package lifecycle；RCA 不维护第二状态机。
4. RCA 持有 visual truth、review/export verdict、artifact authority、visual-memory decision 与 owner-receipt 领域语义；OPL 不得代写。
5. `agent/` 是 declarative visual pack canonical source；generated surface 不反向成为第二 pack truth。
6. native helper 只实现 domain mechanics，不拥有 executor、StageRun、route、receipt、ready 或 package authority。
7. helper 只能通过 OPL native-helper envelope 在受约束 Attempt 中调用；developer proof 不是公开 runtime。
8. decisive Attempt 只返回语义 route recommendation/impact；OPL controller 负责校验和物化 transition。
9. review receipt 与 owner receipt 由各自 owner materialize；Attempt 不能伪造 controller receipt。
10. artifact、review、memory 与 receipt 必须绑定 exact input/artifact identity；provider completion 不等于 visual ready。
11. repo 不跟踪 runtime instance、workspace topology、artifact body、cache、venv、bytecode、test cache、build output 或 package install state。
12. `agent/primary_skill/SKILL.md` 与 plugin carrier mirror 必须保持字节一致；这是分发镜像，不是双重 truth。
13. history 文档只能解释 provenance，不能被 active test、contract 或 runtime 当作 callable surface。
14. structure/conformance/test pass 不得升级成 domain ready 或 production ready；真实 evidence 独立验收。
