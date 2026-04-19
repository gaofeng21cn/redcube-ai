# RedCube AI 当前状态

## 默认入口链路

- 默认用户入口链路：`OPL shell -> RCA / RedCube domain agent -> Codex default execution`
- `RCA / RedCube` 负责 visual-deliverable domain truth：source intake、deliverable creation、review loop、export
- `Codex` 负责默认本地执行与 operator loop
- `Hermes-Agent` 负责显式长期在线 gateway lane（session / run / watch / resume）

## 当前执行口径

- formal-entry matrix：`CLI`（默认正式入口）、`MCP`（协议层）、`controller`（内部控制面）
- direct domain surfaces：`frontdesk / start / preflight / invoke / session / manifest`
- OPL bridge surfaces：`invokeFederatedProductEntry`、`invoke_federated_product_entry`、`redcube product federate`
- domain durable handles：`program_id`、`topic_id`、`deliverable_id`、`run_id`

## 默认验证入口

- 默认最小验证：`scripts/verify.sh` 或 `npm test`
- fast：`scripts/verify.sh fast` / `npm run test:fast`
- meta：`scripts/verify.sh meta` / `npm run test:meta`
- integration：`scripts/verify.sh integration` / `npm run test:integration`
- e2e：`scripts/verify.sh e2e` / `npm run test:e2e`
- historical：`scripts/verify.sh historical` / `npm run test:historical`
- full：`scripts/verify.sh full` / `npm run test:full`

## 历史记录与追溯层

- absorbed milestones 与 phase-2 records：`docs/program/phase-2/`
- Hermes migration/history records：`docs/program/hermes/`
- 历史归档入口：`docs/history/`
- 支持性技术参考：`docs/references/`
- direct-delivery future target reference：`docs/references/direct_delivery_longrun_target_state.md`

## 当前收口重点

- 保持默认入口叙事稳定：`OPL shell -> RCA domain agent -> Codex default execution`
- 保持默认验证轻量，历史 provenance 通过 `historical` lane 独立追溯
- 保持 public docs、contracts、tests 的入口口径一致
