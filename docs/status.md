# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：repo-verified 基线仍是 `Codex-default host-agent runtime`，目标形态是 `Hermes-backed runtime substrate`
- 当前主线：`Auto-only`
- formal-entry matrix：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`

## 当前基线（repo-verified）

- 当前 absorbed tranche：`Phase 2 / runtime watch locator integrity hardening`
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前 program brief 目录：`docs/program/phase-2/`

## 长线目标（规划层）

- runtime substrate 从当前 `Codex-default host-agent runtime` 迁向 `Hermes-backed runtime substrate`
- 保持 `RedCube Gateway -> family / profile / pack -> Domain Harness OS` 的 domain boundary 不漂移
- 让 `run_id / topic_id / deliverable_id / program_id`、`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 在新 substrate 上继续保持同一真相面

## 当前阶段与下一阶段

1. 当前 repo-verified 主线仍是 `Phase 2`，已吸收到 `runtime watch locator integrity hardening`。
2. 同一主线的 follow-on board 仍保留为 `family parity / autopilot continuity`，但它不等于新的 runtime substrate 已落地。
3. 下一轮应先冻结并实现 `Hermes-backed canonical path`，再把 source readiness、workspace quickstart 与 family parity 压到新 runtime 形态上。
4. 项目级 `.runtime-program/` 已退役；本地 runtime state 统一下沉到 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
5. 继续避免 reference-grade 材料和 phase brief 挤占 docs 根目录。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
