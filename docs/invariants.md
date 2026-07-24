# RedCube AI 硬约束

Owner: RedCube AI
Purpose: 冻结标准 Agent 不能破坏的边界。
State: active
Machine boundary: 可执行校验见 root contracts、`scripts/check-private-platform-retirement.ts` 与标准 Agent admission。

1. RCA 是 `OPL Package(kind=agent)`；canonical Package id 固定为 `rca`，
   `redcube-ai` 仅是仓库和 Codex carrier locator。
2. Package identity、capabilities、业务 Work Item / task、typed-view schema/data 和稳定
   entrypoints 归 RCA，且必须保持 executor-neutral。
3. Package、carrier 与 executor 必须分离。Codex Plugin 只是当前 carrier projection，
   Codex CLI 只是当前首选 executor；两者都不得成为 Package identity、完整 installed
   truth 或领域 authority。
4. RCA owner 独立向自己的 GHCR repository 发布完整 Package bytes，只推进 RCA 自己的
   `latest-stable`；共享 Release Set 只能用于 Full/offline/integration-test/QA 快照。
5. required/optional dependency 只检查 identity presence 与 declared entrypoint
   callability；普通组合禁止依赖版本/ABI、lock、payload、digest、Release Set 或跨
   Package 原子闭包。
6. exact ref/digest/checksum 只保护一次发布 bytes 或领域 artifact/evidence lineage，
   不能成为普通 Package 安装、更新或运行 lock。
7. 正式入口只能来自已安装且 callable 的 Package surface；repo-local `redcube` CLI、
   domain-handler 或 runtime wrapper 不得恢复。
8. OPL 持有 StageRun、Attempt、session、queue、retry、resume 与 transition
   materialization；carrier platform 持有实际 bytes 生命周期，Framework 只聚合 fresh
   readback 与薄 action，不维护第二套 Package Manager。RCA 不维护第二状态机。
9. RCA 持有 visual truth、review/export verdict、artifact authority、visual-memory decision
   与 owner-receipt 领域语义；OPL 不得代写。
10. `agent/` 是 declarative visual pack canonical source；generated surface 不反向成为第二
    pack truth。
11. native helper 只实现 domain mechanics，不拥有 executor、StageRun、route、
    execution receipt、ready 或 Package lifecycle authority。
12. helper 只能通过 OPL native-helper envelope 在受约束 Attempt 中调用；developer proof
    不是公开 runtime。
13. decisive Attempt 只返回语义 route recommendation/impact；OPL controller 负责校验和
    物化 transition。
14. review receipt 与 owner receipt 由各自 owner materialize；Attempt 不能伪造
    controller receipt。
15. artifact、review、memory 与 receipt 必须绑定 exact input/artifact identity；provider
    completion 不等于 visual ready。
16. repo 不跟踪 runtime instance、workspace topology、artifact body、cache、venv、
    bytecode、test cache、build output 或 Package installed state。
17. `agent/primary_skill/SKILL.md` 与 Plugin carrier mirror 必须保持字节一致；这是 carrier
    projection，不是双重 Package truth。
18. 当前 manifest 中的旧 lock/payload/currentness/lifecycle receipt/rollback 字段只能作为
    迁移兼容输入，不得成为新增 consumer 或目标架构依据。
19. history 文档只能解释 provenance，不能被 active test、contract 或 runtime 当作
    callable surface。
20. structure/conformance/test pass 不得升级成 Package published/current、domain ready 或
    production ready；各类 fresh evidence 独立验收。
