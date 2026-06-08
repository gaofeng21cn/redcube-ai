# Hermes Managed Family Closure Truth

Owner: `RedCube AI`
Purpose: `historical_hermes_managed_family_closure_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档记录的是 repo-local managed migration line 的 closure provenance，不代表当前仓库已经把 runtime owner 交给上游 `Hermes-Agent`。

## 历史 closure 摘要

这一 tranche 当时把 repo-hosted managed control plane 的 family closure 真值补齐到仓内主线。
本文记录的是 repo-local `Hermes` migration layer 作为历史 owner 时的 managed family closure provenance，以及 `runManagedDeliverable / getManagedRun / superviseManagedRun` shared family closure 当时如何被收紧到 repo-tracked surface。

当前 managed/runtime/session owner 边界不从本文读取；请回到 `docs/status.md`、`docs/architecture.md`、`docs/active/rca-ideal-state-gap-plan.md`、runtime-program contracts、source/tests、owner receipts 和 typed blockers。

## 历史范围

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的 Hermes-backed managed closure
- `managed_run`、`progress_projection`、`runtime_supervision`、`escalation_record` 的 shared truth
- managed preflight 的 fail-closed contract：`overlay` 与 `stop_after_stage`
- `xiaohongshu` human-publication managed closure 与 guarded `poster_onepager` direct-delivery managed closure

## 历史验证事实

- managed control plane 现在会在创建 durable managed state 之前，先校验请求 `overlay` 是否与 hydrated deliverable contract 一致
- managed control plane 现在会在进入执行前校验 `stop_after_stage` 是否属于 hydrated `stage_sequence`，不再静默忽略未声明阶段
- `xiaohongshu` 当时可以沿默认 image-first 主线 `research -> storyline -> single_note_plan -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> publish_copy -> export_bundle` 跑通 Hermes-backed managed closure；`render_html/fix_html` 只作为显式 HTML lane 保留
- `poster_onepager` 可以沿 `storyline -> poster_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> export_bundle` 跑通 guarded knowledge-poster managed closure
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 会继续与 managed family closure 的最终 routed run 对齐

## 当时保持不变的 domain truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `artifact schema`、`gate semantics`、`source_readiness_summary`、`gate_summary`、`operator_handoff`、`lifecycle_stage_summary`
- `CLI-first`、`MCP supported`、`controller internal-only`
- 当时仓库主线按 `Auto-only` 理解

## 历史边界

- 这里说的是 repo-hosted managed control plane，不是 managed web runtime 已完成
- 这里不宣称新 family 已 onboarding
- academic `paper_poster / conference_poster` 仍不在当前 tranche
- managed web runtime control plane 或新的 family/runtime semantics 不从本文派生 backlog；若仍有当前价值，必须先由当前 active owner、contracts、source/tests 或 owner receipt / typed blocker 重新承接

## 历史 verification record

- `node --test tests/managed-deliverable-execution.test.ts`
- `node --test tests/hermes-managed-family-closure-truth.test.ts`
- `node --test tests/hermes-stable-family-closure-truth.test.ts`
- `node --test tests/runtime-deliverable-route.test.ts`
- `npm run typecheck`
- `npm run test:full`

这些命令只记录当时 closeout 口径，不是当前默认验证入口或 current readiness proof。
