# RCA 过度设计收薄设计

Owner: `RedCube AI`
Purpose: `overdesign_thinning_design`
State: `active_support`
Machine boundary: 本文只定义本轮结构收薄的目标、写集和验收。运行真相、visual truth、artifact authority、review/export verdict、owner receipt 与删除授权继续归源码、contracts、runtime/readback 和对应 owner surface。

## 目标

在不削弱 RCA visual-domain authority、route behavior、review/export gate、native helper implementation 和 OPL hosted boundary 的前提下，一次性关闭 2026-07-10 ponytail audit 的八项结构候选：

1. 使用 Node 22 `node:fs` 原生 glob/recursive 能力替代手写递归遍历。
2. 用单一 family 表派生 default overlay registry 与 runtime-family registry。
3. 把 source augmentation validator 的 JSON 基础操作复用到 protocol utility。
4. 删除只会 fail-closed 的 `getRun` / `redcube runs get` 退役兼容面。
5. 收薄单消费者 `create*Parts` 工厂，只保留确有测试价值的顶层注入边界。
6. 将 overlay 合同改为 value-first：静态值用 `as const satisfies` 约束，公开类型从 canonical value/shape 派生，运行时只保留 trust-boundary validation。
7. 删除 RCA-owned retired Hermes adapter 的 CLI/config/runtime execution 分支，只保留 OPL executor receipt / hosted requirement refs。
8. 将已无 tail candidate 的 private-platform retirement 自证体系压成紧凑 machine contract 与单一 no-resurrection readback，删除重复 owner/delete-gate body 和 implementation-detail tests。

## 全局约束

- 不删除或迁移 `@redcube/governance`、visual family route implementation、RCA review/export verdict、artifact authority、visual memory authority 或 Python native helper implementation。
- `agent/primary_skill/SKILL.md` 与 plugin carrier mirror 保持既有 carrier projection contract，不作为去重对象。
- 不新增依赖、兼容 alias、facade、fallback、第二真相源或新的通用平台层。
- 行为保持型 refactor 与退役 public surface 变更分开提交；退役面必须同步 CLI/help/types/tests/docs/contracts。
- 每条 lane 必须在自己的 worktree 中提交、验证并形成 evidence-bound absorption packet；根 checkout 只做吸收、总验证、push 和清理。
- 现有 `rca-owner-closure-20260710` worktree 的 dirty 写集由其原 owner 独占，本轮不得并发修改相同文件；相关 lane 等该 commit 吸收后再基于新 `main` 执行。

## 并行 Lane

| Lane | 目标 | 允许写集 | 关键验证 |
| --- | --- | --- | --- |
| `foundation` | stdlib walker、registry、validator utility | `packages/redcube-runtime/src/performance-report.ts`、`packages/redcube-runtime/src/default-registries.ts`、`packages/redcube-runtime-protocol/src/{protocol-utils,source-augmentation-*-validator}.ts`、相关 focused tests | typecheck、runtime protocol/source tests、overlay registry tests |
| `retired-surfaces` | 删除 `getRun` 与 RCA Hermes execution/public configuration | `packages/redcube-domain-entry/src/actions/get-run.ts`、domain entry exports/types、`apps/redcube-cli/**`、`packages/redcube-runtime{,-protocol}/**` 中 Hermes-only 分支、config example、相关 tests/docs/contracts | CLI/package/runtime topology/executor routing focused tests、public surface drift audit、typecheck |
| `overlay-value-first` | 合并 overlay type/value/validator 重复 | `packages/redcube-runtime/src/families/{ppt,xiaohongshu,poster-onepager}/overlay/**`、必要 family type imports、overlay focused tests | overlay registry/profile/hydration tests、family tests、typecheck |
| `parts-flattening` | 删除单消费者 nested Parts factory plumbing | `packages/redcube-runtime/src/families/**`，排除未吸收 owner-closure 写集；相关 focused tests | PPT/XHS/poster route tests、native PPT focused tests、family tests、typecheck |
| `retirement-guard` | 压缩 functional/morphology/readback/test 自证体系 | `contracts/{functional_privatization_audit,physical_source_morphology_policy}.json`、`scripts/check-private-platform-retirement.ts`、对应 projection builders/tests/docs | private-platform/default-caller readback、contract/source morphology tests、typecheck |
| `integration` | shared pin、计划、逐 lane 吸收、总验证、文档和 push | root package pin/lock、`docs/**`、lane commits | `scripts/verify.sh`、`npm run test:full`、contract/readback、fallow、public drift、git/remote readback |

## 风险与顺序

- L2：stdlib walker、registry、validator utility；先行并行。
- L3：`getRun` / Hermes public surface、overlay contract、Parts factory、retirement machine contract；均要求 focused tests 加 repo minimal verification。
- L4：只适用于最终 `main`/remote currentness 与 public retirement claim；必须用 target-ref、remote readback 和 exact public-surface scan，不以 lane tests 替代。
- 本轮不采用新增 TDD 套件。现有 behavior/contract tests 作为 characterization safety net；只在退役行为缺少可观察回归证据时补一条高价值测试。

## 完成门槛

- 八项候选逐项为 `done`，不得用 narrower lane summary 替代完整清单。
- 所有 lane commit 已吸收到 `main`，没有本轮未吸收 commit、dirty worktree 或临时 branch。
- `main` 上 fresh typecheck、smoke、fast、family、full、contracts/readback、fallow 和 public-surface scan 均有结果；任何失败必须修复或明确归属真实外部 blocker，不能包装成完成。
- README/core docs/status/architecture/decisions/active plan 与 machine contracts 同步到最终边界。
- `origin/main` 通过 443 `git ls-remote` / fetch readback 与本地 `main` 一致后，才可声称同步完成。
