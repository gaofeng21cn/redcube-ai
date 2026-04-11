# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：`Hermes-backed runtime substrate`
- 当前 deployment host：`Codex-default host-agent runtime`（仅 bridge / regression host / development shell）
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`

## 当前基线（repo-verified）

- 当前 active tranche：`Hermes / stable family closure truth`
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前 program brief 目录：`docs/program/hermes/`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在 Hermes substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 `Hermes / stable family closure truth`，Phase 2 tranches 与 `Hermes / runtime substrate canonical closure` 继续作为 absorbed provenance 保留。
2. canonical `ppt_deck` mainline 仍是 Hermes-backed canonical deliverable；`xiaohongshu` human-publication mainline 已在同一 substrate 上形成 repo-tracked 第二条 family closure。
3. stable family runtime output 现在会直接暴露同一份 Hermes execution truth，routed artifact 也会保留 `topic_id / deliverable_id / contract / stage_contract`。
4. 再往前推进若涉及 managed web runtime control plane、新 family onboarding 或 academic poster 语义，就需要新的 activation package；在那之前可以诚实停车。
5. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
6. 继续避免 reference-grade 材料和 phase brief 挤占 docs 根目录。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
- 当前 CI 分层口径：`quality` lane 在跑 `test:fast` 前也必须先 provision Python 3.12、`fonts-noto-cjk` 与 Playwright Chromium，因为 fast lane 已覆盖 poster governed screenshot review
