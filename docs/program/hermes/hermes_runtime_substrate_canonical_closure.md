# Hermes Runtime Substrate Canonical Closure

## 当前状态

这一 tranche 已在仓内实现并通过验证。
它不是纯文档 freeze，而是把 `ppt_deck` canonical deliverable mainline 真正跑到 Hermes-backed runtime 上，并把 shared behavior surface 一并对齐。

## Canonical family

- 先行 family：`ppt_deck`
- canonical 闭环：`Source Readiness -> Story Architecture -> Visual Authorship -> Delivery Packaging`
- 终点 route：`export_pptx`

## 已落地的事实

- routed deliverable execution 默认使用 `Hermes` substrate
- run record / event log / managed lane 统一暴露 Hermes runtime identity
- `governance_surface.runtime_topology` 在 create / review / audit / watch / projection 上一致
- `xiaohongshu` 与 `poster_onepager` 也已共享同一 Hermes runtime topology，但 family ontology 保持原样

## 仍保持不变的 truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `source_readiness_summary` / `gate_summary` / `operator_handoff` / `lifecycle_stage_summary`
- `xiaohongshu` 的 explicit human publication 语义

## 真实边界

- 这里不声称 managed web runtime 已完成
- 这里不声称所有 future family 已齐平
- academic `paper_poster / conference_poster` 仍未进入当前 tranche

## Verification

- `node --test tests/runtime-deliverable-route.test.js`
- `node --test tests/family-parity-governance-surface.test.js`
- `node --test tests/managed-deliverable-execution.test.js`
- `node --test tests/hermes-runtime-canonical-path.test.js`
- `npm run test:full`
- `npm run typecheck`
