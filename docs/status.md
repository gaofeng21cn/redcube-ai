# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：`Hermes-backed runtime substrate`
- 当前 deployment host：`Codex-default host-agent runtime`（仅 bridge / regression host / development shell）
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`

## 当前基线（repo-verified）

- 当前 active tranche：`Hermes / runtime substrate canonical closure`
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前 program brief 目录：`docs/program/hermes/`

## 长线目标（规划层）

- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在 Hermes substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线已经切到 `Hermes / runtime substrate canonical closure`，Phase 2 tranches 继续作为 absorbed provenance 保留。
2. canonical `ppt_deck` mainline 已在 Hermes-backed runtime 上跑通闭环，shared `runtime_topology` 也已扩到 stable families。
3. 下一轮继续在同一 Hermes substrate 上扩 shared behavior surface；只有在会引入未冻结新语义时才允许停车。
4. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
5. 继续避免 reference-grade 材料和 phase brief 挤占 docs 根目录。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
