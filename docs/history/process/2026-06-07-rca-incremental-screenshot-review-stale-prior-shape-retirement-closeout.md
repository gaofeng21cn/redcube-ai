# RCA incremental screenshot review stale-prior shape retirement closeout

Owner: `RedCube AI`
Purpose: `incremental_screenshot_review_stale_prior_shape_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文是人读过程 closeout。当前机器真相继续归 `packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/incremental-review-scope.ts`、PPT screenshot-review runtime source、Stage Folder artifacts、focused tests、runtime artifacts、owner receipts 和 typed blockers。

## Retired surface

本轮退役的 surface 是 PPT `screenshot_review` incremental reuse 对旧 prior review body 的隐式兼容：历史 prior `quality_gate` 如果缺少当前 `checks.page_number_consistency_ok`、slide-level `checks.page_number_consistency_ok` 或 `metrics.page_number_audit`，不再通过后续 merge/backfill 进入 incremental page review。

当前行为是：prior `screenshot_review` 必须具备当前 page-number mechanical shape，才允许作为 incremental reuse source。旧 shape prior 被视为 stale prior，下一轮 `screenshot_review` 直接走 full-deck review 并重新物化当前 mechanical fields。

## Source of truth

- `packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/incremental-review-scope.ts`
- `packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stage-screenshot-review.ts`
- `packages/redcube-runtime-protocol/src/stage-folder-contract.ts`
- `tests/ppt-creative-ownership-cases/targeted-rerender-and-export-cases/page-number-source-and-export.test.ts`
- `tests/ppt-creative-ownership-cases/targeted-rerender-and-export-cases/shared.ts`

## Done

- `collectIncrementalScreenshotReviewTargetSlideIds(...)` 新增 current mechanical shape gate；旧 prior review body 缺少 page-number top-level/slide-level check 或 slide-level audit 时返回空 target，阻止 incremental reuse。
- `page-number-source-and-export.test.ts` 把旧 “legacy prior review backfill” 用例改为 “stale prior mechanical shape rejects incremental reuse”，并断言 stale prior 被首次消费时产生 `full_deck_review`。
- 同一测试文件内仍需要手工 seed prior review 的用例改为通过 Stage Folder current artifact 读写，不再读写 workspace flat `artifacts/quality_gate.json` / `artifacts/publish_bundle.json`。
- `rerender-cache-and-escalation.test.ts` 的 manual `director_review` / `quality_gate` fixture 改为写 `visual_director_review` / `screenshot_review` Stage Folder current artifact，不再以 flat `artifacts/*.json` 作为 fixture interface。
- `targeted-rerender-and-export-cases/shared.ts` 的 prepared workspace clone 变为 Stage Folder aware：缓存 route artifact body，clone 后按 clone workspace 的 program id 重新写入 Stage Folder attempt，并重写 artifact body 与 cloned workspace JSON sidecar 中的 prepared workspace 绝对路径。

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-incremental-review-stale-prior-shape`:

```bash
node - <<'NODE'
console.log(await import.meta.resolve('@redcube/runtime-family-ppt'));
console.log(await import.meta.resolve('@redcube/runtime'));
console.log(await import.meta.resolve('@redcube/domain-entry'));
NODE

rtk npm run --silent build
rtk node --experimental-strip-types --test tests/ppt-creative-ownership-cases/targeted-rerender-and-export-cases/page-number-source-and-export.test.ts
rtk node --experimental-strip-types --test tests/ppt-creative-ownership-cases/targeted-rerender-and-export-cases/rerender-cache-and-escalation.test.ts
```

Result:

- Workspace package resolution was verified to point at this worktree's `packages/*/dist`, not the parent checkout under `/Users/gaofeng/workspace/redcube-ai`.
- `npm run --silent build` passed; package runtime exports sync reported `0` updates and `18` preserved TypeScript-built runtime exports.
- Focused Node test file passed `5/5`.
- Adjacent targeted rerender/cache/escalation test shard passed `9/9`.

## Remaining risk

- This lane retires stale prior screenshot-review body reuse for the PPT page-number mechanical shape only. It does not claim a full audit of every incremental reuse surface in other RedCube families.
- The focused tests update the shared prepared-workspace clone helper for `targeted-rerender-and-export-cases`; other shards with local clone helpers may still need the same Stage Folder-aware migration in future lanes.
- Worktrees nested under the main checkout can accidentally resolve `@redcube/*` from the parent checkout's `node_modules`. Before treating worktree verification as authoritative, confirm `import.meta.resolve('@redcube/runtime-family-ppt')`, `@redcube/runtime`, and `@redcube/domain-entry` point inside the active worktree.
