# Phase 2 Workspace / Operator Quickstart Convergence

日期锚点：`2026-04-10`

这份文档记录同一 `redcube-runtime-program` 主线closeout 已完成并吸收到当前 mainline 的 current tranche：

- `workspace operator quickstart convergence`

它证明的是：

- `workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run`
  现在已经收紧为一条 repo-verified operator quickstart surface；
- brand-new / thin workspace 的 canonical bootstrap 行为，已经在当前 hard boundary 内被明确并验证；
- 这仍然是同一条主线上的 hardening，不是新 program，也不是 `controller` / academic poster / managed web runtime 的推进。

它不是：

- `controller` 已成为 repo-verified public formal entry 的声明；
- `paper_poster / conference_poster` academic poster contract 已开启的声明；
- `xiaohongshu` 已被改写成 direct-delivery 的声明；
- `managed web runtime` 或 `OPL federation` 已开始迁移的声明。

## 当前冻结结论

- `workspace doctor` 继续保持**诊断**表面：在 brand-new workspace 上返回 `run_source_intake`，并显式暴露 canonical topics / runs 目录。
- `source intake` 与 `source research` 继续是当前 quickstart 的**bootstrap writer**：由它们写入 `redcube.workspace.json`、`topics/<topic>/topic.json` 与 topic 级 canonical source surfaces。
- `source research` 继续是 Step 1 的 one-shot orchestration surface：它总是先执行 `source intake`，再决定是停在 canonical result staging，还是继续 augmentation execution。
- `deliverable create`、`deliverable audit`、`deliverable run` 现在与上述 bootstrap / readiness / governance 语义形成同一条 repo-verified operator route。
- `planning_ready` 继续保持 `Source Readiness` 的 machine-readable release gate；`auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 继续围绕同一 deliverable/topic 边界收口。
- `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 继续共享同一 source substrate；其中 `xiaohongshu` 仍保持 explicit `human_publication`。

## In scope

### 1. Workspace bootstrap hardening

- brand-new workspace 上，`workspace doctor` 明确返回 `run_source_intake`；
- brand-new / thin workspace 上，`source intake` 与 `source research` 明确写出：
  - `redcube.workspace.json`
  - `topics/<topic>/topic.json`
  - `topics/<topic>/canonical/source-index.json`
  - `topics/<topic>/canonical/extracted-materials.json`
  - `topics/<topic>/canonical/source-audit.json`
  - `topics/<topic>/canonical/source-brief.json`
  - `topics/<topic>/canonical/source-readiness-pack.json`
  - `topics/<topic>/canonical/source-augmentation-request.json`
- `deliverable create` 继续在同一 workspace / topic 下补齐 deliverable 合同与 surface files。

### 2. Operator quickstart surface

- canonical operator route 冻结为：

`workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run`

- `source research` 继续保持 Step 1 的 one-shot formal entry；
- `deliverable audit` 继续 fail-closed 在 `source_readiness_summary` / `gate_summary` 上，而不是伪装成“source_audit = pass 就可放行”；
- `deliverable run` 继续是 hydrated contract 之后的 routed execution surface。

### 3. Docs / help / behavior alignment

- `README*`、`docs/README*`、`docs/product/human_quickstart.md` 与 CLI help 现在对同一 quickstart surface 说的是同一套话；
- 对新目录的推荐口径继续保持：先 `workspace doctor` 做诊断，再由 `source intake` 或 `source research` 执行正式 bootstrap；
- 不引入新的 `workspace init` 产品表面，也不靠 hidden fallback chain 偷写 contract truth。

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
- hidden fallback chains as main behavior
- prompt patch replacing contract hydration

## Minimal verification surface

- truth freeze：
  - `contracts/runtime-program/phase-2-workspace-operator-quickstart-convergence.json`
  - `tests/phase-2-workspace-operator-quickstart-convergence.test.ts`
- quickstart behavior：
  - `tests/workspace-operator-quickstart.test.ts`
  - `tests/source-intake.test.ts`
  - `tests/source-research.test.ts`
- `tests/cli-v2-smoke.test.ts`
- `tests/deliverable-review-loop.test.ts`
- `tests/direct-delivery-operator-handoff.test.ts`
- `tests/phase-2-behavior-convergence.test.ts`

## Closeout evidence

本轮 absorbed 之后，必须诚实留下：

- brand-new / thin workspace 的 canonical bootstrap 行为已被 repo-tracked tests 覆盖；
- `workspace doctor`、`source intake / source research`、`deliverable create / audit / run` 已构成同一条 quickstart surface；
- `planning_ready` gate 与 governance semantics 未漂移；
- `xiaohongshu` 仍保持 `human_publication`，没有被改写成 direct-delivery。

本轮不得宣称：

- `controller` 已打开；
- academic poster contract 已打开；
- new family / overlay 已打开；
- `managed web runtime` 已进入当前 repo truth。

## 停车结论

当前 tranche 的 honest closeout 结论是：

- `WORKSPACE_OPERATOR_QUICKSTART_CLOSED_AND_ABSORBED`

下一棒仍需在同一主线 hard boundary 内重新证明新的 honest freeze；若做不到，就继续保持 `none / not yet frozen`。
