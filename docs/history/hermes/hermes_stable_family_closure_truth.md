# Hermes Stable Family Closure Truth

Owner: `RedCube AI`
Purpose: `historical_hermes_stable_family_closure_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档记录的是 repo-local stable-family migration closure 的 provenance，不代表当前仓库已经完成上游 `Hermes-Agent` 集成。

## 历史 stable-family closure 摘要

这一 tranche 当时已在仓内实现并通过验证。
它记录的是 repo-local `Hermes` migration layer 作为历史 owner 时的 stable family runtime closure，并把 shared family runtime output 与第二条 human-publication family closure 的真值一起收紧到 repo-tracked surface。当时 repo-verified mainline 里的 concrete executor 按 `Codex CLI host-agent runtime` 理解。

当前 concrete executor、runtime owner、generated/default caller 和 compatibility-free retirement 口径不从本文读取。

## 历史范围

- `ppt_deck`、`xiaohongshu`、`poster_onepager` stable family runtime output
- routed artifact 的 quartet envelope parity
- `xiaohongshu` human-publication closure 的 Hermes-backed audit / watch / review / projection 一致性

## 历史验证事实

- stable family runtime package 当时会直接暴露同一份 execution_model truth，并由当时 `Codex CLI host-agent runtime` concrete executor 对齐 `deployment_host` 与 `deployment_host_status`
- routed family artifact 在落盘前会统一保留 `topic_id`、`deliverable_id`、`contract` 与 `stage_contract`
- `xiaohongshu` 在 `planning_ready` source readiness 之后，当时可以沿默认 image-first 主线 `research -> storyline -> single_note_plan -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> publish_copy -> export_bundle` 跑通同一条 human-publication closure，并保持当时 `Codex CLI host-agent runtime` concrete executor truth；`render_html/fix_html` 只作为显式 HTML lane 保留
- `xiaohongshu` 继续保持 explicit human publication：`approval_pending -> approved_pending_publish` 语义不被改写成 direct-delivery
- `ppt_deck` 与 guarded `poster_onepager` 继续保持既有 direct-delivery / knowledge-poster truth，不借此扩张到 academic poster

## 当时保持不变的 domain truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `artifact schema`、`gate semantics`、`source_readiness_summary`、`gate_summary`、`operator_handoff`、`lifecycle_stage_summary`
- `CLI-first`、`MCP supported`、`controller internal-only`
- 当时仓库主线按 `Auto-only` 理解

## 历史边界

- 这里不声称 managed web runtime 已完成
- 这里不声称新 family 已 onboarding
- academic `paper_poster / conference_poster` 仍不在当前 tranche
- managed web runtime control plane 或新的 family/runtime semantics 不从本文派生 backlog；若仍有当前价值，必须先由当前 active owner、contracts、source/tests 或 owner receipt / typed blocker 重新承接

## 历史 verification record

- `node --test tests/runtime-deliverable-route.test.ts`
- `node --test tests/family-parity-governance-surface.test.ts`
- `node --test tests/hermes-runtime-canonical-path.test.ts`
- `node --test tests/hermes-stable-family-closure-truth.test.ts`
- `npm run test:full`
- `npm run typecheck`

这些命令只记录当时 stable-family closeout 口径，不是当前默认验证入口或 current readiness proof。
