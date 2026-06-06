# RCA Python helper script fallback retirement closeout

Owner: `RedCube AI`
Purpose: `python_helper_script_fallback_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文是人读治理 closeout。当前机器真相继续归 `contracts/runtime-program/python-native-helper-catalog.json`、`packages/redcube-runtime-protocol/src/python-native-helper.ts`、`packages/redcube-runtime-protocol/src/types.ts`、PPT runtime family source、focused tests、Python package modules、CLI/MCP/API behavior、runtime artifacts、owner receipts、typed blockers、artifact locator 和 RCA-owned review/export gates；本文不作为 visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete 证据。

本文记录 2026-06-07 RedCube Python native helper script-path fallback 的退役。本轮不恢复任何 `packages/redcube-runtime/scripts/*.py` wrapper、不保留 string helper 兼容入口、不把旧脚本路径留作 active caller。当前 helper invocation 只接受 native helper catalog resolve 后得到的 package-module helper，并统一调用 `python -m <package_module>`。

## Planned

- 退役 `runRedCubePythonHelper` / `resolvePythonHelperInvocation` / `pythonHelperReference` 对 string script path 的兼容输入。
- 将 runtime protocol helper invocation / reference / run result 的 `packageModule` / `package_module` 收窄为必填 string。
- 同步 PPT runtime family types，避免 export bundle 继续表达 nullable package module。
- 把仍依赖 `PYTHON_EXPORT` / `PYTHON_REVIEW` 脚本路径的 PPT tests 改为 catalog-style native helper fixtures。
- 保留 package-module catalog tests 与 focused PPT review/export/cache tests，证明 wrapper script path 没有 active caller 或 contract anchor。

## Done

- `packages/redcube-runtime-protocol/src/python-native-helper.ts` 现在只接受 `RedCubePythonNativeHelper`，并在 helper 未来自 catalog、缺 `packageModule` 或 `pythonRoot` 不存在时 fail closed。
- `packages/redcube-runtime-protocol/src/index.ts` 与 `packages/redcube-runtime-protocol/src/types.ts` 的 public wrapper/type surface 已移除 `RedCubePythonNativeHelper | string` 与 nullable `package_module`。
- `packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/export.ts`、`native-ppt.ts` 和 `packages/redcube-runtime-family-ppt/src/types.ts` 已同步到 catalog helper / non-null package module contract。
- 新增 `tests/helpers/python-native-helper-fixtures.ts`，让 tests 通过 catalog-shaped helper fixture 注入 `ppt_deck_review`、`ppt_deck_export` 和 `ppt_deck_native`。
- `tests/helpers/mock-redcube-python-with-playwright.ts` 作为 package-module mock command 承接 `-m redcube_ai.native_helpers.ppt_deck.*`，并支持 call-count 验证 cache 路径。
- `tests/export-preview-cache.test.ts`、`tests/ppt-image-review-export.test.ts`、`tests/screenshot-cache.test.ts`、`tests/review-stage-concurrency.test.ts` 与 `tests/ppt-render-batch-generation.test.ts` 的 PPT helper dependency 已迁移到 catalog fixture。

## Deferred

- None for this script fallback retirement lane.

## Skipped

- 没有改 Python helper package module 的业务实现。
- 没有恢复、重建或迁移任何旧 wrapper script。
- 没有把 XHS tests 的本地 `runPython` stub 改成 runtime protocol 路径；这些 stub 不经过 `runRedCubePythonHelper`，不构成本轮 script fallback active caller。
- 没有 push。

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai-python-helper-script-fallback-retirement`:

```bash
rtk rg -n "RedCubePythonNativeHelper \\| string|string \\| RedCubePythonNativeHelper|packageModule: string \\| null|package_module: string \\| null|PYTHON_(EXPORT|NATIVE|REVIEW): ('/tmp/|[a-zA-Z]+Script|exportScript|reviewScript)|legacy_wrapper_scripts_allowed.*true" packages tests contracts python -g '*.{ts,json,py}'
rtk npm run typecheck
rtk node --experimental-strip-types --test tests/python-native-helper-catalog.test.ts tests/export-preview-cache.test.ts tests/ppt-image-review-export.test.ts tests/screenshot-cache.test.ts tests/review-stage-concurrency.test.ts tests/ppt-render-batch-generation.test.ts
rtk npm run test:fast
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" packages/redcube-runtime-protocol/src/python-native-helper.ts packages/redcube-runtime-protocol/src/types.ts packages/redcube-runtime-protocol/src/index.ts packages/redcube-runtime-family-ppt/src/types.ts packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/export.ts packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts tests/helpers/python-native-helper-fixtures.ts tests/helpers/mock-redcube-python-with-playwright.ts tests/export-preview-cache.test.ts tests/ppt-image-review-export.test.ts tests/screenshot-cache.test.ts tests/review-stage-concurrency.test.ts tests/ppt-render-batch-generation.test.ts docs/history/process/2026-06-07-rca-python-helper-script-fallback-retirement-closeout.md docs/history/process/README.md
/Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- Legacy helper fallback scan over active machine surfaces: no matches.
- Typecheck: passed.
- Focused catalog/review/export/cache test bundle: passed `38/38`.
- Fast test lane: passed after this closeout update.
- Diff whitespace check: passed.
- Conflict-marker scan: passed.
- OPL Doc doctor: passed.

## Commit-Push State

- Worktree branch: `codex/rca-python-helper-script-fallback-retirement`.
- Local commit: created after the verification commands above; final commit hash is reported in the handoff because self-referential commit hashes are not embedded in this closeout.
- Main absorption: fast-forward merge after local commit.
- Push: skipped by task instruction.
