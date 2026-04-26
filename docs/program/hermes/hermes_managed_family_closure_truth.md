# Hermes Managed Family Closure Truth

> 历史说明：这份文档记录的是 repo-local managed migration line 的 closure provenance，不代表当前仓库已经把 runtime owner 交给上游 `Hermes-Agent`。

## 当前状态

这一 tranche 已把 repo-hosted managed control plane 的 family closure 真值补齐到仓内主线。
它记录的是当时以 repo-local `Hermes` migration layer 为 owner 的 managed family closure，并把 `runManagedDeliverable / getManagedRun / superviseManagedRun` 的 shared family closure 一起收紧到 repo-tracked surface。

## In scope

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的 Hermes-backed managed closure
- `managed_run`、`progress_projection`、`runtime_supervision`、`escalation_record` 的 shared truth
- managed preflight 的 fail-closed contract：`overlay` 与 `stop_after_stage`
- `xiaohongshu` human-publication managed closure 与 guarded `poster_onepager` direct-delivery managed closure

## 已落地的事实

- managed control plane 现在会在创建 durable managed state 之前，先校验请求 `overlay` 是否与 hydrated deliverable contract 一致
- managed control plane 现在会在进入执行前校验 `stop_after_stage` 是否属于 hydrated `stage_sequence`，不再静默忽略未声明阶段
- `xiaohongshu` 可以沿 `research -> storyline -> single_note_plan -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> publish_copy -> export_bundle` 跑通 Hermes-backed managed closure
- `poster_onepager` 可以沿 `storyline -> poster_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> export_bundle` 跑通 guarded knowledge-poster managed closure
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 会继续与 managed family closure 的最终 routed run 对齐

## 仍保持不变的 truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `artifact schema`、`gate semantics`、`source_readiness_summary`、`gate_summary`、`operator_handoff`、`lifecycle_stage_summary`
- `CLI-first`、`MCP supported`、`controller internal-only`
- 当前仓库主线仍按 `Auto-only` 理解

## 停车边界

- 这里说的是 repo-hosted managed control plane，不是 managed web runtime 已完成
- 这里不宣称新 family 已 onboarding
- academic `paper_poster / conference_poster` 仍不在当前 tranche
- 如果要继续推进 managed web runtime control plane 或新的 family/runtime semantics，必须先冻结新的 activation package

## Verification

- `node --test tests/managed-deliverable-execution.test.ts`
- `node --test tests/hermes-managed-family-closure-truth.test.ts`
- `node --test tests/hermes-stable-family-closure-truth.test.ts`
- `node --test tests/runtime-deliverable-route.test.ts`
- `npm run typecheck`
- `npm run test:full`
