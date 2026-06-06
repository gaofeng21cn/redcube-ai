# RCA TypeScript presence-lock retirement closeout

Owner: `RedCube AI`
Purpose: `typescript_presence_lock_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 `tests/typescript-closeout-audit.test.ts`、`scripts/typescript-closeout-audit-lib.ts`、`contracts/runtime-program/js-residue-line-lock.json`、`contracts/physical_source_morphology_policy.json`、source、tests、CLI/MCP/API behavior、runtime artifacts、owner receipts、typed blockers、artifact locator 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready、production visual-stage long soak complete 或 physical delete authorization 证据。

本文记录 2026-06-07 RedCube TypeScript closeout 审计中旧 presence-lock 的退役。本轮只删除测试内要求一批历史迁移 `.ts` 文件继续物理存在的锁；JS residue、no-resurrection、test/script language policy 和 source morphology 机器 truth 继续由现有 audit lib、contracts 和 focused tests 持有。

## Planned

- 删除 `tests/typescript-closeout-audit.test.ts` 中 `RETIRED_SOURCE_JS_FILES` 常量。
- 删除 `P24 source TypeScript retirement keeps migrated product files present without JS mirrors` 测试片段。
- 保留并验证 JS residue explicit closeout、zero product source JS residue、line lock、new JS package/script fail-closed、test/script language policy 和 JSON audit artifact 测试。
- 更新 process history closeout 与索引，不把 prose 文案接入测试断言。

## Done

- Retired the file-presence lock that pinned historical migrated TypeScript product files as permanent test fixtures.
- Kept the current machine owner for product-source JavaScript retirement:
  - `scripts/typescript-closeout-audit-lib.ts` scans `apps/*/src` and `packages/*/src` for source JS residue.
  - `contracts/runtime-program/js-residue-line-lock.json` keeps product source JavaScript at zero files and zero lines.
  - `tests/typescript-closeout-audit.test.ts` still checks residue inventory, line budget, fail-closed JS resurrection cases, and test/script language policy.
  - `contracts/physical_source_morphology_policy.json` continues to classify active source surfaces and no-resurrection boundaries.
- Updated `docs/history/process/README.md` so this lane is discoverable as process provenance.

## Deferred

- None for this presence-lock retirement lane.

## Skipped

- No product source files were deleted, renamed, moved, or reclassified.
- No `scripts/typescript-closeout-audit-lib.ts` contract logic was changed.
- No prose wording was added to tests as an assertion target.
- No push was performed.

## Verification

Preparation in this isolated worktree:

```bash
rtk npm ci
rtk npm run --silent build
```

The first focused test attempt failed before executing tests because the new worktree had no `node_modules`; the second failed before executing tests because workspace package `dist/` outputs were not built. After the preparation above, the original focused command executed normally.

Commands required for this lane:

```bash
rtk node --experimental-strip-types scripts/run-test-group.ts meta --files tests/typescript-closeout-audit.test.ts --test-reporter=dot
rtk git diff --check
rtk rg -n '^(<<<<<<<|=======|>>>>>>>)' tests/typescript-closeout-audit.test.ts docs/history/process/README.md docs/history/process/2026-06-07-rca-ts-presence-lock-retirement-closeout.md
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result to record after execution:

- Focused TypeScript closeout audit: passed.
- Diff whitespace check: passed.
- Conflict-marker scan: passed.
- OPL Doc doctor: passed.

## Commit-Push State

- Worktree branch: `codex/rca-ts-presence-lock-retirement`.
- Local commit: created after the verification commands above; final commit hash is reported in the handoff because self-referential commit hashes are not embedded in this closeout.
- Main absorption: fast-forward merge after local commit.
- Push: skipped by task instruction.
