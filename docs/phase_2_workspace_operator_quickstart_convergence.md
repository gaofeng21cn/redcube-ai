# Phase 2 Workspace / Operator Quickstart Convergence

日期锚点：`2026-04-09`

这份文档冻结 `RedCube AI` 当前最适合由 `OMX` 新开的 same-mainline tranche。

它不是：

- 当前 `contracts/runtime-program/current-program.json` 的自动改写；
- `controller` 已成为 formal entry 的声明；
- `paper_poster / conference_poster` 已开启的声明；
- `managed web runtime` 已开始迁移的声明。

## 为什么下一棒是这一条

当前已吸收到 `main` 的最硬事实是：

- `Source Readiness` 已完成 shared source truth baseline 与 `Deep Research` trigger/gate convergence；
- `review / export / gate / audit`、`family source-truth consumption`、`publication projection / delivery contract`、`direct-delivery operator handoff` 与 `lifecycle stage` 的前序 tranche 已吸收为 provenance；
- `current-program.json` 当前仍诚实写着：`next_tranche_candidate = null`。

这意味着：

- 当前不能直接把 `RedCube AI` 说成已经进入 `family parity / full autopilot`；
- 但也不该一直停留在“已经完成 source-plane hardening”这一个叙事上；
- 下一条最诚实、最贴近用户入口、又仍处于同一主线 hard boundary 内的线，是把
  `workspace bootstrap + operator quickstart + one-shot canonical entry path`
  收成 repo-verified behavior。

## 当前建议 tranche

建议新线命名为：

- `Phase 2 / workspace operator quickstart convergence`

它服务的是你之前定义的第二优先级：

- `One-shot Workspace / Operator Quickstart`

但这里要注意：

- 这仍然属于当前 `redcube-runtime-program` 的 same-mainline hardening；
- 不是切到新 program；
- 也不是已经进入第三阶段的 `Family Parity / Full Autopilot`。

## 目标

把下面这条当前已经在文档里存在、但还需要更强 repo-verified 行为支撑的入口链路，收紧成可信的 operator quickstart surface：

`workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run`

具体目标是：

1. 让一个 brand-new 或 thin workspace 的 canonical bootstrap 行为更清楚、更稳定；
2. 让 `human_quickstart.md`、workspace contract、`Source Readiness` gate、deliverable governance surface 与运行面测试更一致；
3. 让用户的“一句话交给 Agent 开工”路径，更少依赖隐式 repo 记忆，更多依赖 repo-verified contract。

## In Scope

### 1. Workspace bootstrap hardening

- 收紧空目录或薄工作区进入 `redcube.workspace.json`、`topics/<topic>/canonical/`、`deliverable` 基础结构的 canonical 行为；
- 明确 brand-new workspace 与 existing workspace 的最小 doctor / intake / create 路径。

### 2. Operator quickstart surface

- 收紧 `docs/human_quickstart.md` 中当前推荐调用顺序与实际 surface 的一致性；
- 让 `workspace doctor`、`source intake`、`source research`、`deliverable create`、`deliverable audit`、`deliverable run` 的说明与 repo 当前行为对齐；
- 把“一句话启动”口径压到更少歧义的 canonical operator route。

### 3. Governance alignment

- 保持 `planning_ready` 仍是 `Source Readiness` 的 machine-readable gate；
- 保持 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 的 deliverable/topic 边界一致；
- 保持 `ppt_deck`、`xiaohongshu`、guarded `poster_onepager` 共享 source substrate，但 ontology 不漂移。

## Hard Boundaries

这条线不得越过：

- `controller expansion`
- 把 `controller` 写成 repo-verified public formal entry
- `paper_poster / conference_poster` academic poster contract advancement
- new family / overlay expansion
- `xiaohongshu` 改写成 direct-delivery
- `Deep Research` 改写成 `MedDeepScientist Scout + Idea`
- `managed web runtime migration`
- `OPL federation` 扩面

## Required Truth Sources

开线前至少先读：

- `AGENTS.md`
- `contracts/project-truth/AGENTS.md`
- `contracts/runtime-program/current-program.json`
- `docs/policies/runtime_operating_model.md`
- `docs/human_quickstart.md`
- `docs/source_readiness_deep_research_longrun_target_state.md`
- `docs/direct_delivery_longrun_target_state.md`
- 本文 `docs/phase_2_workspace_operator_quickstart_convergence.md`
- `.omx/context/CURRENT_PROGRAM.md`
- `.omx/reports/redcube-runtime-program/LATEST_STATUS.md`
- `.omx/reports/redcube-runtime-program/OPEN_ISSUES.md`
- `.omx/reports/redcube-runtime-program/ITERATION_LOG.md`

## Required Verification

每轮 closeout 至少重跑：

- `git diff --check`
- `npm run typecheck`
- `node --test tests/phase-2-source-readiness-deep-research-trigger-gate-convergence.test.js tests/source-readiness-deep-research-gate.test.js tests/source-intake.test.js tests/source-research.test.js tests/deliverable-review-loop.test.js tests/direct-delivery-operator-handoff.test.js tests/direct-delivery-lifecycle-stage-summary.test.js tests/phase-2-behavior-convergence.test.js`
- `npm test`

如果这一棒新增了 workspace bootstrap / quickstart 行为验证，还必须把相应回归加入 repo-tracked tests。

## Honest Stop Conditions

出现任一情况就应停车：

1. 当前 quickstart / workspace route 已无新的 honest delta；
2. 下一步需要进入新 family、academic poster、`controller` formal entry、或 managed web runtime；
3. 下一步需要把 `xiaohongshu` ontology 改写成 direct-delivery；
4. 下一步只能靠 prompt patch，而不是 contract / test / surface 对齐来推进。

## 推荐的停车结论

这条线的理想停车结论是：

- `WORKSPACE_OPERATOR_QUICKSTART_CLOSED_AND_ABSORBED`
  或
- `NO_NEW_QUICKSTART_DELTA_HONEST_STOP`
