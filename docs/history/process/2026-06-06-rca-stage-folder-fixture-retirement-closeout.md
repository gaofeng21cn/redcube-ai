# RCA Stage Folder fixture retirement closeout

Owner: `RedCube AI`
Purpose: `stage_folder_fixture_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 `contracts/stage_control_plane.json`、`contracts/artifact_locator_contract.json#/primary_artifact_truth`、`contracts/stage_artifact_kernel_adoption.json`、`packages/redcube-runtime-protocol/src/stage-folder-contract.ts`、focused tests、runtime artifacts、owner receipts 和 typed blockers。

## Retired surface

本轮退役的 surface 是测试中仍先写 workspace flat `artifacts/*.json`，再调用 `writeStageFolderArtifact` 包装进 Stage Folder 的 seed fixture。该写法保留了旧 artifact-root 心智模型，容易把文件名或 workspace-local flat artifact 当成机器接口。

当前测试夹具改为直接通过 `stageFolderOutputPath(...)` 定位 Stage Folder attempt output，并在同一 attempt 下物化 `outputs/<file>`；随后由 `writeStageFolderArtifact(...)` 写入 `manifest.json`、role refs、owner receipt 或 typed blocker evidence、current/latest pointer。测试断言继续以 role + manifest + receipt / blocker ref 为接口。

## Source of truth

- `contracts/stage_control_plane.json#/stage_output_role_interface`
- `contracts/stage_control_plane.json#/stage_artifact_runtime`
- `contracts/artifact_locator_contract.json#/primary_artifact_truth`
- `packages/redcube-runtime-protocol/src/stage-folder-contract.ts`
- `tests/stage-folder-contract.test.ts`
- `tests/xiaohongshu-deliverable-e2e.test.ts`
- `tests/ppt-image-pages-runtime.test.ts`
- `tests/ppt-image-first-quality-nonregression.test.ts`

## Done

- `tests/stage-folder-contract.test.ts` 的 manual seed cases 改为 Stage Folder output fixture，不再先写 `paths.artifactsDir/*.json`。
- `tests/xiaohongshu-deliverable-e2e.test.ts` 的 blocked screenshot-review seed 改为直接写 Stage Folder attempt output。
- `tests/ppt-image-pages-runtime.test.ts` 与 `tests/ppt-image-first-quality-nonregression.test.ts` 的 author / review seed helper 改为 `stageFolderOutputPath(...)`。
- route execution 自身产出的 artifact 保持不变；真实运行仍由 runtime route handler 写 Stage Folder attempt，本轮只清理测试造数。

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/redcube-stage-folder-fixture-retirement`:

```bash
rtk npm run --silent build
rtk node --test tests/stage-folder-contract.test.ts tests/xiaohongshu-deliverable-e2e.test.ts tests/ppt-image-pages-runtime.test.ts tests/ppt-image-first-quality-nonregression.test.ts
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" tests/stage-folder-contract.test.ts tests/xiaohongshu-deliverable-e2e.test.ts tests/ppt-image-pages-runtime.test.ts tests/ppt-image-first-quality-nonregression.test.ts docs/history/process/2026-06-06-rca-stage-folder-fixture-retirement-closeout.md docs/history/process/README.md
rtk rg -n "artifactsDir|path\\.join\\([^\\n]*['\\\"]artifacts['\\\"]|legacyFile|retired flat" tests/stage-folder-contract.test.ts tests/xiaohongshu-deliverable-e2e.test.ts tests/ppt-image-pages-runtime.test.ts tests/ppt-image-first-quality-nonregression.test.ts
```

Result:

- `npm run --silent build` passed; package runtime exports sync reported `0` updates and `18` preserved TypeScript-built runtime exports.
- Focused Node test bundle passed `29/29`.
- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Retired flat fixture scan found no matches in the four scoped tests.

## Remaining risk

- This lane does not scan every repo test for older flat artifact fixtures; scope is limited to the four source-of-truth tests named for the Stage Folder fixture cleanup.
- Helper refs such as PPTX/PDF/handoff/gallery files may still be materialized as files under a Stage Folder attempt for closeout assertions. They are helper outputs, not stage completion interfaces.
- Real route handler behavior and production artifact authority are unchanged; this closeout does not claim visual ready, exportable, handoffable, domain ready, production ready, or production visual-stage long soak completion.
