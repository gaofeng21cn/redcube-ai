# Hermes Runtime Substrate Activation Package

> 历史说明：这份文档保留的是 repo-local migration activation package 的 absorbed provenance，不代表当前仓库已经接入上游 `Hermes-Agent`。

## 当前状态

这份 activation package 已完成冻结并在仓内落地。
它不再把 `Codex-default host-agent runtime` 视为长期产品 runtime，而是明确把它降为过渡期 deployment host / regression bridge / development shell。

## 新边界

- `RedCube Gateway`：继续作为 visual-deliverable domain gateway，对外保持 `CLI-first`、`MCP` supported、`controller` internal-only。
- `RedCube Domain Harness OS`：继续负责 domain-level orchestration、artifact durability、governance surface 与 family route contract。
- repo-local `Hermes` migration layer：当时负责 routed run session、executor identity、runtime topology、managed adapter failover 与 run/event durability 的本地迁移实现。
- `family / profile / pack`：继续只表达 deliverable ontology、route contract、review/export semantics，不上浮成 substrate owner。

## Promotion invariants

- `program_id` / `topic_id` / `deliverable_id` / `run_id` 边界不漂移。
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection` 继续围绕同一 canonical truth 收口。
- 当前主线继续按 `Auto-only` 理解。
- `xiaohongshu` 不被改写成 direct-delivery。

## Excluded scope

- 不扩 `controller`
- 不宣称 managed web runtime 已完成
- 不新增 family
- 不推进 academic poster

## Required verification

- `node --test tests/runtime-deliverable-route.test.js`
- `node --test tests/family-parity-governance-surface.test.js`
- `node --test tests/managed-deliverable-execution.test.js`
- `node --test tests/hermes-runtime-canonical-path.test.js`
- `npm run test:full`
- `npm run typecheck`
