# RedCube AI 当前状态

## 默认入口口径

- 对外定位：`RedCube AI` 是独立 visual-deliverable domain agent，第一公开主语是单一 `redcube-ai` app skill 与 direct 调用入口；`OPL` 通过 internal bridge / integration surface 进入
- formal-entry matrix：`CLI`（默认正式入口）、`MCP`（支持协议层）、`controller`（内部控制面）
- repo-verified direct route：`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- internal OPL bridge route：`User -> OPL Product Entry -> OPL Gateway -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces`
- 默认公开能力面：`RedCube AI` 持有稳定 capability surface 与 visual-domain truth，`redcube-ai` app skill / `Codex CLI` 继续作为主要可见 surface 与默认 concrete executor；`Hermes-Agent` 只在显式 hosted/proof backend 或技术参考层出现
- OPL boundary：`OPL` 只保留 family-level session/runtime/projection 与 shared modules/contracts/indexes，不接管 RedCube domain truth

## 当前执行口径

- product-entry service surface：`invokeProductEntry`、`getProductEntrySession`、`redcube product invoke`、`redcube product session`
- internal OPL bridge surface：`invokeFederatedProductEntry`、`invoke_federated_product_entry`、`redcube product federate`
- shared service-safe domain entry：`invokeDomainEntry`、`invoke_domain_entry`
- direct domain surfaces：`frontdesk / start / preflight / invoke / session / manifest`
- 稳定可调用面：`redcube-ai` app skill、`CLI`、`MCP`、`invokeDomainEntry`、`invokeProductEntry`、本地脚本，以及这些 surface 对应的 repo-tracked contracts
- `skill_catalog` 现在对外收口为单一 `redcube-ai` app skill；`frontdesk`、`invoke`、`session` 继续作为这个 skill 底下的 machine-readable command contracts
- domain durable handles：`program_id`、`topic_id`、`deliverable_id`、`run_id`

## 当前验证口径

- hosted quality lane：`npm run typecheck -> npm run test:fast -> npm run test:family -> npm run test:meta`
- family shared pin 审计统一经由 `scripts/run-test-group-lib.mjs`，必须在 clean-clone 环境下可运行
- 本地 `npm run test:integration` / `npm run test:e2e` / `npm run test:full` 继续保留 Codex / Python preflight，但只把明确的 route-heavy 文件串行化；其余文件回到 Node test runner 默认并发

## 历史记录与追溯层

- absorbed milestones 与 phase-2 records：`docs/program/phase-2/`
- Hermes migration/history records：`docs/program/hermes/`
- 历史归档入口：`docs/history/`
- 支持性技术参考：`docs/references/`
- direct-delivery future target reference：`docs/references/direct_delivery_longrun_target_state.md`
- source-readiness future target reference：`docs/references/source_readiness_deep_research_longrun_target_state.md`
- 维护者验证与文档治理：`docs/references/series-doc-governance-checklist.md`

## 当前收口重点

- 保持 direct route 与 internal OPL bridge route 共用同一条 downstream domain-agent entry（service-safe domain entry）下游
- 保持 upstream Hermes runtime owner、repo-verified product-entry surface 与 visual-domain truth 的 docs/contracts/tests 同步
- 保持维护者验证与历史 provenance 停留在 reference / policy 层
