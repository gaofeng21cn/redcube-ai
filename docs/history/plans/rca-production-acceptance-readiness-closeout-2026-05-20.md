# RCA production acceptance/readiness closeout

Owner: `RedCube AI`
Purpose: `production_acceptance_readiness_closeout_provenance`
State: `historical_provenance`
Machine boundary: 人读 closeout。机器真相继续归 `contracts/`、stage evidence refs、runtime artifacts、owner receipts、artifact locator、review/export gate、OPL readiness surface 与真实验证命令输出。

Date: `2026-05-20`

## Closeout 口径

本轮 closeout 固定 RCA acceptance/readiness 的当前读法：AI-first / executor-first。OPL 搭建 stage-led runtime、queue、receipt ledger、replay / recovery shell 和 operator projection；Codex/default executor 执行视觉 stage；RCA 持有 visual truth、review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker。合同只固定边界、安全、receipt、replay 和恢复。

结构 conformance passed 表示标准 OPL Agent 结构口径通过。Readiness clean / observable 表示 launch、replay、runtime evidence、typed blocker 和 owner receipt refs 可观察、可追溯、可被 OPL readiness surface 消费。二者都不授权 visual ready、exportable、handoffable、domain_ready 或 production visual-stage long soak。

## Expected Merged Result

最终合并后的 expected result 是 refs-only evidence 面闭合：

- RCA stage evidence refs 持有 runtime budget refs 与 replay evidence refs。
- RCA production acceptance/readiness 面持有 owner receipt、artifact receipt、review-export acceptance refs 和 next verification command refs。
- OPL readiness consumption 能读取这些 refs，并把 launch / replay / runtime evidence 报告为 clean / observable。
- RCA owner receipt / acceptance refs 仍是 visual/export/domain ready 的边界入口；OPL readiness、provider completion、cleanup proof 和 structural conformance 只提供可观察性证据。

真实长时 visual-stage soak、跨 family repeated no-regression 和更多 workspace scaleout 继续作为 production scaleout evidence；它们不是当前结构 blocker，也不能被当前 closeout 写成已完成。

## Planned

- 将 RCA 文档入口同步到 AI-first / executor-first acceptance/readiness 口径。
- 写清 structural conformance、readiness clean/observable 和 production visual-stage long soak 的差别。
- 为 runtime budget refs、replay evidence refs、RCA owner receipt/acceptance refs 和 OPL readiness consumption 预留最终合并后的准确表述。
- 保留 production scaleout 边界：长时 visual-stage soak、跨 family repeated no-regression、更多 workspace scaleout。

## Done

- `docs/status.md` 增加当前 acceptance/readiness 读法、expected merged result 和禁止升级口径。
- `docs/active/rca-ideal-state-gap-plan.md` 增加 closeout 口径、evidence/readiness 验收边界和 production scaleout remainder。
- `docs/decisions.md` 记录 production acceptance/readiness 的 AI-first / executor-first 决策。
- 本 closeout 文档保存 plan-closeout 与 provenance，不作为机器 truth。

## Deferred

- 真实长时 visual-stage soak。
- 跨 family repeated no-regression。
- 更多 workspace receipt scaleout / retention inventory scaleout。
- 由并行 evidence lanes 落地的具体 runtime budget refs、replay evidence refs 和 OPL readiness 默认消费代码/合同。

## Skipped

- 未修改 `contracts/stage_control_plane.json` 或 stage_control_plane 源码，避免与 runtime/evidence lane 冲突。
- 未修改 OPL 仓。
- 未运行全量测试；本 lane 仅改人读文档，最小验证为 diff integrity。

## Verification

- `git diff --check` 是本 lane 必跑验证。
- 代码、contract 或 evidence refs 由对应 runtime/evidence lane 执行 repo-native focused verification。
- 最终合并前应确认并行 lane 的 runtime budget refs、replay evidence refs、RCA owner receipt/acceptance refs 与 OPL readiness consumption 已在各自机器面落地。

## Commit-Push State

- Worktree branch: `codex/rca-acceptance-docs`
- Commit: branch-local commit carries this lane closeout；具体 hash 以最终回报和 git history 为准。
- Push: 本 lane 未执行 push；若后续需要由合并负责人统一 push / merge。
