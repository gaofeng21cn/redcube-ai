# Phase 2 Architecture Boundary Governance

Owner: `RedCube AI`
Purpose: `historical_phase_2_architecture_boundary_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 tranche brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

生命周期说明：本文是已吸收的 Phase 2 hardening tranche brief，保留为 contract-linked provenance。当前 owner truth 以核心五件套、`docs/runtime/`、`docs/policies/` 与 machine-readable runtime-program contracts 为准；本文不重新打开 Phase 2 作为新的公开产品方向。

## 历史 SSOT

本文只保留 Phase 2 architecture-boundary governance 的历史 provenance。当前架构 owner boundary、source-purity tail、line-budget / Sentrux 读法、repo hygiene、package dependency boundary 和 test registration truth 回到 `docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/active/rca-ideal-state-gap-plan.md`、`docs/docs_portfolio_consolidation.md`、`scripts/verify.sh`、`scripts/run-test-group.ts`、`scripts/repo-hygiene.sh`、`scripts/line-budget.ts`、`scripts/run-structural-quality-gate.sh` 和 focused tests。

本 tranche 当时不改变 `ppt_deck`、`xiaohongshu`、`poster_onepager` 的生成行为，也不改变 formal-entry matrix；它只把当时已经写在核心文档里的 owner boundary 转成 meta gate 和 proof lane。

## 外部工程经验对照

当时吸收的可复用经验是：

- 先保持结构良好的模块化系统，再决定是否进一步拆分运行形态。
- 每一层必须有清楚、可消费、可验证的 API，不能让 operator、manifest、runtime-family 和 pack 同时解释同一 truth。
- 低层、快速、靠近代码的测试应挡住结构退化。

这些经验的当前 owner 是核心五件套、active gap plan、repo hygiene / line-budget / structural quality gate 和 service-boundary tests；不在本文继续追加新规则。

## 历史冻结目的

本 tranche 当时解决三个具体问题：

1. `package.json` 依赖声明不能再被 workspace hoist 掩盖；源码 import 了 `@redcube/*` package，就必须显式声明。
2. layer ownership 不能只写在文档里；当时的 `apps -> gateway -> runtime -> runtime-family / governance / protocol` 方向必须有 meta gate。
3. nested test cases 不能只存在于目录里；任何 `tests/*-cases/*.test.ts` 都必须被根级 `tests/*.test.ts` 显式挂载，才能进入现有 lane partition。

## 历史 Owner Boundary

当时可执行 owner map 固定为：

- `apps`: CLI / MCP protocol adapters，只调用 `gateway` 和必要 config。
- `gateway`: product-entry、service-safe entry 和 operator-facing projection composer；它可以读 overlay/runtime/protocol，但不得直接依赖 concrete runtime-family 或 pack。
- `runtime`: managed execution、session/run store、runtime facade 和 executor selection；它不得依赖 gateway/apps。
- `runtime-family`: family-specific stage execution；它不得依赖 gateway/runtime/apps。
- `overlay`: domain contract/profile/surface boundary；它不得成为 managed runtime owner。
- `pack`: typed shell、pack-id carrier 和 artifact type boundary；它不得重新成为 authoring/runtime owner。
- `governance`: review/publication state owner surface；runtime-family 只应通过明确 context 或 governance API 消费投影。
- `runtime-protocol`: workspace/run/source/native-helper contracts；它保持底层共享 contract，不依赖上层。

当前 owner map 已经被后续 OPL-compatible package、service-safe domain entry、domain handler target、OPL-generated descriptor/projection、Stage Folder Contract、standard Declarative Visual Pack 和 generated/default caller thinning 口径覆盖。不要把上面的历史 package names 当成今天的 active architecture taxonomy。

## 本次已落地

- 新增 package/layer boundary meta gate：扫描 `apps/*/src` 与 `packages/*/src` 的 `@redcube/*` imports，检查依赖声明和 layer allow matrix。
- 补齐 `@redcube/runtime` 对 `@redcube/overlay-core` 与 `@redcube/overlay-registry` 的显式依赖声明。
- 新增 nested-test registration gate：扫描 `tests/**/*.test.ts`，要求嵌套 case 可从根级测试显式 import 到达。
- 补挂已存在但未执行的 `tests/cli-v2-smoke-cases/cli-summary-output.test.js`。
- 抽出 Codex runtime topology authority：`runtime-protocol` 持有默认 topology builder，`overlay-core` 不再依赖旧 runtime substrate package，退役 runtime package 只作为历史迁移背景保留。
- 收口 pack provenance 命名：`ppt`、`xiaohongshu`、`poster_onepager` pack type 层只表达 prompt-pack seed / runtime artifact provenance，不再编码 executor owner 字符串；`pack-first-completion` 增加 pack 源码扫描 gate。

## 历史 Follow-Up 压缩

| 历史 follow-up | 当前 owner / read |
| --- | --- |
| Boundary gates | `scripts/run-test-group.ts`、repo hygiene、package dependency boundary tests、nested test registration tests 和 current verification matrix。 |
| Overlay-core runtime topology extraction | 已作为 historical landed item 读取；当前 runtime owner boundary 回到 `docs/architecture.md`、`docs/runtime/`、runtime-program contracts 和 live source/tests。 |
| Product manifest thin composer | 现在归 generated/default caller thinning tail、product-entry manifest source split、active gap plan 和 private implementation migration inventory。 |
| Runtime-family review snapshot injection | 当前 review/export truth 归 RCA-owned review/export gates、runtime-family source、Stage Folder artifacts 和 focused tests。 |
| Pack provenance cleanup | 当前 pack / Declarative Visual Pack truth 归 `agent/`、`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json` 和 pack discipline tests。 |

## Historical Verification

当时验收口径包括 `npm run build`、`npm run test:meta`、`npm run test:fast`、Sentrux rescan 和 plan-closeout 字段。今天的验证入口以 `scripts/verify.sh`、`npm run test:fast`、`npm run test:meta`、focused service-boundary tests、line-budget / structural quality gate 和 active gap plan 的验证口径为准。

## No-Resurrection 读法

禁止把本文恢复成：

- 当前 architecture backlog 或 source-purity deletion authority。
- `gateway` / `runtime` / `managed` 历史 package taxonomy 的 active owner map。
- product manifest、runtime-family、pack、operator projection 或 review/export 的第二 truth owner。
- visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long-soak 证据。

如果历史 follow-up 需要重新推进，必须先从当前 active gap plan、machine contracts、live source/tests、runtime evidence、owner receipt 或 typed blocker 重新开题；不能从本文直接续跑。
