# OPL-hosted RCA runtime 边界

Owner: OPL Framework（runtime）/ RedCube AI（domain authority）
Purpose: 解释一次 RCA action 如何运行而不产生第二控制面。
State: active
Machine boundary: OPL runtime contracts 与 RCA root contracts 共同决定字段；本文只解释 owner split。

## 启动

OPL-generated action 接收请求，确认 complete RCA Package installed/callable、
required capability presence、selected executor route、workspace/source/artifact identity
和 RCA declarative stage refs，然后创建或重放 durable StageRun。普通 Package
dependency 不绑定 version/ABI、lock、payload、digest 或 Release Set。RCA 仓不生成
StageRun id，也不保存 launch registry。

## Attempt

OPL 为 producer、reviewer、repairer、re_reviewer materialize 隔离 Attempt。Codex CLI
是当前首选且唯一产品化的 executor route；RCA pack 提供 executor-neutral prompt、
professional skill、quality gate 和 tool affordance boundary。

## Native helper

需要 PPT/Office/render/review/export mechanics 时，Attempt 通过 OPL native-helper envelope 调用 `python/redcube_ai/native_helpers/`。OPL 管进程和 receipt；RCA helper 只返回受合同约束的 artifact/result refs。

## Route 与 receipt

终局 decisive Attempt 返回 `route_impact.stage_route_decision`；非终局 Attempt 最多返回 `stage_route_recommendation`。OPL controller 校验 evidence 与 authority 后物化 transition 和 formal review receipt；RCA authority 对 visual/review/export/artifact/memory/owner 语义负责。

## 状态与恢复

StageRun、Attempt、session、executor route readiness、retry、resume、dead-letter、
status 与 workbench 由 OPL durable runtime 持有。Package installed truth 来自实际
carrier fresh readback；repo source 和 developer proof 不写这些状态。

## 图像密集Attempt的恢复责任

RCA reviewer在现有StageRun产物中保留已审页、当前图像refs、发现与未完成动作，
以足够清晰的单页证据和已审媒体等价减少重复载荷。base64估算与实际HTTP请求
字节不同，token窗口也不是请求体限额；预算按真实路由决定，不内置某个供应商
的阈值。已证实存在工具结果顺序不兼容时，含图读取逐轮串行；不限制无图查询
或独立页面生产的正常并发。

诊断区分工具完成、结果组装和上游准入。`No tool output found`不能独自证明结果
丢失，413不能解释为PPTX包过大。RCA只保留脱敏call/request关联及最深可证断点，
不伪造输出、修改会话库、创建私有恢复控制面或重放整段图片历史。Framework负责
同一StageRun的Attempt接续与执行状态，Gateway/实际上游负责协议归组和请求体
限额。修复这些运行层不由本次RCA方法更新代替；本地规避不声明远端根修完成。

## Hard boundary

provider completion、queue empty、conformance pass、developer proof、file presence 或 generated surface ready 都不能替代 RCA visual/review/export acceptance。
