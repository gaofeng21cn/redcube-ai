# RedCube AI 当前状态

## 默认入口口径

- formal-entry matrix：`CLI`（默认正式入口）、`MCP`（支持协议层）、`controller`（内部控制面）
- repo-verified direct route：`User -> RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- repo-verified federated route：`User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`
- runtime owner split：`Hermes-Agent` 持有 managed runtime，`RedCube AI` 持有 visual-domain truth，`Codex CLI` 继续作为 executor adapter 选中的默认 concrete executor

## 当前执行口径

- product-entry service surface：`invokeProductEntry`、`getProductEntrySession`、`redcube product invoke`、`redcube product session`
- federated OPL handoff surface：`invokeFederatedProductEntry`、`invoke_federated_product_entry`、`redcube product federate`
- shared service-safe domain entry：`invokeDomainEntry`、`invoke_domain_entry`
- direct domain surfaces：`frontdesk / start / preflight / invoke / session / manifest`
- domain durable handles：`program_id`、`topic_id`、`deliverable_id`、`run_id`

## 默认验证入口

- 默认最小验证：`scripts/verify.sh` 或 `npm test`
- fast：`scripts/verify.sh fast` / `npm run test:fast`
- meta：`scripts/verify.sh meta` / `npm run test:meta`
- integration：`scripts/verify.sh integration` / `npm run test:integration`
- e2e：`scripts/verify.sh e2e` / `npm run test:e2e`
- full：`scripts/verify.sh full` / `npm run test:full`
- historical provenance audit：`docs/references/series-doc-governance-checklist.md`

## 历史记录与追溯层

- absorbed milestones 与 phase-2 records：`docs/program/phase-2/`
- Hermes migration/history records：`docs/program/hermes/`
- 历史归档入口：`docs/history/`
- 支持性技术参考：`docs/references/`
- direct-delivery future target reference：`docs/references/direct_delivery_longrun_target_state.md`
- source-readiness future target reference：`docs/references/source_readiness_deep_research_longrun_target_state.md`

## 当前收口重点

- 保持 direct route 与 federated route 共用同一条 service-safe domain entry 下游
- 保持 upstream Hermes runtime owner、repo-verified product-entry surface 与 visual-domain truth 的 docs/contracts/tests 同步
- 保持默认验证轻量，历史 provenance 通过 reference 层独立追溯
