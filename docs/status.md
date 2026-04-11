# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：`Hermes-backed runtime substrate`
- 当前 deployment host：`Codex-default host-agent runtime`（仅 bridge / regression host / development shell）
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`

## 当前基线（repo-verified）

- 当前 active tranche：`Hermes / managed family closure truth`
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前 program brief 目录：`docs/program/hermes/`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在 Hermes substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 `Hermes / managed family closure truth`，`Hermes / stable family closure truth`、Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续作为 absorbed provenance 保留。
2. canonical `ppt_deck` mainline 仍是 Hermes-backed canonical deliverable；`xiaohongshu` human-publication mainline 与 guarded `poster_onepager` knowledge-poster mainline 现在也都在同一 substrate 上形成 repo-tracked managed closure。
3. repo-hosted managed control plane 现在会把 `runManagedDeliverable / getManagedRun / superviseManagedRun` 收紧到 shared Hermes truth，并在创建 durable managed state 之前先 fail-closed 校验 `overlay` 与 `stop_after_stage`。
4. managed family closure 这里仍只指 repo-hosted managed control plane；再往前推进若涉及 managed web runtime control plane、新 family onboarding 或 academic poster 语义，就需要新的 activation package；在那之前可以诚实停车。
5. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
6. 继续避免 reference-grade 材料和 phase brief 挤占 docs 根目录。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- 当前 CI 分层口径：`quality` lane 在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
