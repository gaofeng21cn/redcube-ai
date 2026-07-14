# OPL-hosted RCA runtime 边界

Owner: OPL Framework（runtime）/ RedCube AI（domain authority）
Purpose: 解释一次 RCA action 如何运行而不产生第二控制面。
State: active
Machine boundary: OPL runtime contracts 与 RCA root contracts 共同决定字段；本文只解释 owner split。

## 启动

OPL-generated action 接收请求，绑定 installed package closure、workspace/source/artifact identity 和 RCA declarative stage refs，然后创建或重放 durable StageRun。RCA 仓不生成 StageRun id，也不保存 launch registry。

## Attempt

OPL 为 producer、reviewer、repairer、re_reviewer materialize 隔离 Attempt。Codex CLI 是第一公民 executor；RCA pack 提供 prompt、professional skill、quality gate 和 tool affordance boundary。

## Native helper

需要 PPT/Office/render/review/export mechanics 时，Attempt 通过 OPL native-helper envelope 调用 `python/redcube_ai/native_helpers/`。OPL 管进程和 receipt；RCA helper 只返回受合同约束的 artifact/result refs。

## Route 与 receipt

decisive Attempt 返回语义 route recommendation/impact。OPL controller 校验 evidence 与 authority 后物化 transition 和 formal review receipt；RCA authority 对 visual/review/export/artifact/memory/owner 语义负责。

## 状态与恢复

StageRun、Attempt、session、currentness、retry、resume、dead-letter、status 与 workbench 由 OPL durable runtime持有。repo source 和 developer proof 不写这些状态。

## Hard boundary

provider completion、queue empty、conformance pass、developer proof、file presence 或 generated surface ready 都不能替代 RCA visual/review/export acceptance。
