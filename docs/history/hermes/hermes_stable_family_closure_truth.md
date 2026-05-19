# Hermes Stable Family Closure Truth

Owner: `RedCube AI`
Purpose: `historical_hermes_stable_family_closure_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档记录的是 repo-local stable-family migration closure 的 provenance，不代表当前仓库已经完成上游 `Hermes-Agent` 集成。

## 当前状态

这一 tranche 已在仓内实现并通过验证。
它记录的是当时以 repo-local `Hermes` migration layer 为 owner 的 stable family runtime closure，并把 shared family runtime output 与第二条 human-publication family closure 的真值一起收紧到 repo-tracked surface。当前 repo-verified mainline 里的默认 concrete executor 已按 `Codex CLI host-agent runtime` 理解。

## In scope

- `ppt_deck`、`xiaohongshu`、`poster_onepager` stable family runtime output
- routed artifact 的 quartet envelope parity
- `xiaohongshu` human-publication closure 的 Hermes-backed audit / watch / review / projection 一致性

## 已落地的事实

- stable family runtime package 现在会直接暴露同一份当前 execution_model truth，并由当前 `Codex CLI host-agent runtime` concrete executor 对齐 `deployment_host` 与 `deployment_host_status`
- routed family artifact 在落盘前会统一保留 `topic_id`、`deliverable_id`、`contract` 与 `stage_contract`
- `xiaohongshu` 在 `planning_ready` source readiness 之后，可以沿当前默认 image-first 主线 `research -> storyline -> single_note_plan -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> publish_copy -> export_bundle` 跑通同一条 human-publication closure，并保持当前 `Codex CLI host-agent runtime` concrete executor truth；`render_html/fix_html` 只作为显式 HTML lane 保留
- `xiaohongshu` 继续保持 explicit human publication：`approval_pending -> approved_pending_publish` 语义不被改写成 direct-delivery
- `ppt_deck` 与 guarded `poster_onepager` 继续保持既有 direct-delivery / knowledge-poster truth，不借此扩张到 academic poster

## 仍保持不变的 truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `artifact schema`、`gate semantics`、`source_readiness_summary`、`gate_summary`、`operator_handoff`、`lifecycle_stage_summary`
- `CLI-first`、`MCP supported`、`controller internal-only`
- 当前仓库主线仍按 `Auto-only` 理解

## 停车边界

- 这里不声称 managed web runtime 已完成
- 这里不声称新 family 已 onboarding
- academic `paper_poster / conference_poster` 仍不在当前 tranche
- 如果要继续推进 managed web runtime control plane 或新的 family/runtime semantics，必须先冻结新的 activation package

## Verification

- `node --test tests/runtime-deliverable-route.test.ts`
- `node --test tests/family-parity-governance-surface.test.ts`
- `node --test tests/hermes-runtime-canonical-path.test.ts`
- `node --test tests/hermes-stable-family-closure-truth.test.ts`
- `npm run test:full`
- `npm run typecheck`
