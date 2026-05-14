# Phase 2 Activation Package Freeze

日期锚点：`2026-04-07`

生命周期说明：本文是已吸收的 activation freeze provenance，保留为 contract-linked Phase 2 记录。当前 source intake / shared source truth 可执行真相以 `docs/source/`、canonical workspace artifacts 和 runtime-program contracts 为准。

当前这份文档只冻结一件事：

- 未来 `Phase 2 / source intake + shared source truth` **如何被显式激活**

它不是 `Phase 2` 实现启动令，
也不是 source intake runtime build-out 计划执行本身。

截至当前状态，这份文档已经退居为：

- 已吸收 activation freeze 的历史 provenance

它不再是：

- 当前 operator 的默认主读入口
- 当前主线身份定义文件
- 默认“下一棒必须显式人工晋升”的唯一依据

## 当前状态

- 当前 active mainline：`redcube-runtime-program`
- `P0 review-closeout`：`passed`
- 最新已完成 baton：`stable deliverable manual-test-driven hardening`
- 这份 freeze 已作为 predecessor baton 完成 closeout，并以 `3a7fbd6` 吸收到 `main`
- 它曾冻结 future activation order；当前最小 Phase 2 baseline 已在其基础上进入主线
- 当前仍保持：`controller` 不扩大、poster academic contract 不进入当前主线、OPL-hosted runtime integration 不进入当前主线

## 目标

把 future activation package 冻结为可审计、可复现、可显式晋升的 repo-tracked truth surface，至少包含：

1. 激活条件
2. 对象边界
3. canonical artifact schema
4. gate surface
5. operator flow
6. 最小测试面
7. closeout evidence 要求

## 激活条件

未来只有在以下条件同时成立时，才允许显式打开真正的 `Phase 2 implementation baton`：

1. `stable deliverable manual-test-driven hardening` 已完成并保持 `closeout_completed`
2. `P0 review-closeout = passed`
3. `green baseline credible = true`
4. 当前 formal entry 仍只有 `MCP / CLI`
5. `controller` 仍未被写成正式入口
6. 本文档与 `contracts/runtime-program/phase-2-source-intake-activation-package-freeze.json` 保持一致
7. 由 `Codex App` 再次显式激活一个**单独的** `Phase 2 implementation baton`

## 对象边界

### 当前 baton 内允许冻结的对象

- `source-index.json`
- `extracted-materials.json`
- `source-audit.json`
- `source-brief.json`
- source intake / shared source truth 的 canonical path 约定
- gateway / CLI / MCP 在 future activation 中应暴露的 gate surface
- family 后续消费 shared source truth 的最小边界（`ppt_deck` / `xiaohongshu`）

### 当前 baton 明确不做

- 直接实现 source intake runtime build-out
- 直接实现 shared source truth runtime build-out
- 开始 `Phase 2` 路由实现
- 扩 `controller`
- 新增 family / overlay
- 推进 poster academic contract
- 推进 OPL-hosted runtime integration

## Canonical Artifact Schema

未来 `Phase 2` implementation 只能围绕以下 canonical artifacts 展开，不得另起双真相：

| artifact | canonical path | 最低必需字段 |
| --- | --- | --- |
| `source_index` | `topics/<topic>/canonical/source-index.json` | `sources`, `stage_results` |
| `extracted_materials` | `topics/<topic>/canonical/extracted-materials.json` | `materials` |
| `source_audit` | `topics/<topic>/canonical/source-audit.json` | `status`, `blocking_reasons`, `completed_stages` |
| `source_brief` | `topics/<topic>/canonical/source-brief.json` | `input_mode`, `confidence`, `keywords` |

## Gate Surface

未来正式打开 `Phase 2 implementation` 前，至少要过以下 gate：

1. contract gate：artifact schema 与 canonical path 已冻结
2. operator gate：operator flow 与 stop condition 已冻结
3. truth gate：`README*`、`runtime_architecture`、`current-program`、reports、tests 口径一致
4. promotion gate：`Codex App` 显式晋升 implementation baton

## Operator Flow

1. 先读 `contracts/runtime-program/current-program.json`
2. 再确认上一棒 closeout artifact：
   - `contracts/runtime-program/stable-deliverable-manual-test-driven-hardening.json`
   - `contracts/runtime-program/stable-deliverable-hardening-backlog.json`
3. 再读 activation package contract：
   - `contracts/runtime-program/phase-2-source-intake-activation-package-freeze.json`
4. 跑 freeze verification
5. 只有在未来再次显式晋升时，才允许进入真正的 `Phase 2 implementation`

## 最小测试面

activation package freeze 至少要绑定：

- `tests/runtime-alignment-p0.test.ts`
- `tests/poster-production-hardening-freeze.test.ts`
- `tests/stable-deliverable-manual-test-package.test.ts`
- `tests/phase-2-source-intake-activation-package-freeze.test.ts`
- `tests/source-intake.test.ts`

同时要求：

- `npm run test:full`
- `npm run typecheck`
- `git diff --check`

## Closeout Evidence 要求

本 baton closeout 至少要同步：

- `README.md`
- `README.zh-CN.md`
- `human_doc:runtime_architecture`（人读路径当前为 `docs/runtime/runtime_architecture.md`）
- `contracts/runtime-program/current-program.json`
- `contracts/runtime-program/phase-2-source-intake-activation-package-freeze.json`
- `$CODEX_HOME/projects/redcube-ai/runtime-state/context/CURRENT_PROGRAM.md`
- `$CODEX_HOME/projects/redcube-ai/runtime-state/reports/redcube-runtime-program/LATEST_STATUS.md`
- `$CODEX_HOME/projects/redcube-ai/runtime-state/reports/redcube-runtime-program/OPEN_ISSUES.md`
- `$CODEX_HOME/projects/redcube-ai/runtime-state/reports/redcube-runtime-program/ITERATION_LOG.md`

同时必须明确写出：

- 当前只完成 activation package freeze
- `Phase 2 implementation` 仍未开始
- future implementation 仍需 `Codex App` 显式晋升

## 当前停点

- 结论：activation package freeze 已冻结完成
- 当前不进入：`P1`
- 当前不进入：`Phase 2 / source intake + shared source truth implementation`
- 下一停点：`future explicit promotion decision for a dedicated Phase 2 implementation baton`

这段“停点”现在应被理解为历史 freeze closeout 记录，而不是当前 longrun 主线的默认停车规则。
