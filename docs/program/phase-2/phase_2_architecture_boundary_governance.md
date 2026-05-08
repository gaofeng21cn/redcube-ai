# Phase 2 Architecture Boundary Governance

## 当前状态

本 tranche 是一次 repo 结构治理收口。它不改变 `ppt_deck`、`xiaohongshu`、`poster_onepager` 的生成行为，也不改 formal-entry matrix；它把当前已经写在核心文档里的 owner 边界转成可执行的 meta gate。

Fresh scan 显示当前依赖图没有循环，Sentrux acyclicity 为满分，但结构风险集中在深度、跨模块边和可测试性：`gateway`、`runtime`、`runtime-family`、`overlay`、`pack`、`governance`、`protocol` 已经形成可用层次，却缺少阻断“新文件跨层拿权威面”的通用 gate。

## 外部工程经验对照

- Martin Fowler 的 monolith-first 经验强调，先保持一个结构良好的模块化系统，再决定是否拆成更分布式的运行形态；RCA 当前更需要收紧模块边界，而不是先拆更多 package。
- Team Topologies 的 cognitive-load / team API 经验对应到本仓，就是每一层必须有清楚、可消费、可验证的 API，不能让 operator、manifest、runtime-family 和 pack 都解释同一件事。
- Test Pyramid / Practical Test Pyramid 的经验要求低层、快速、靠近代码的测试挡住结构退化；本 tranche 把架构边界放进 `test:meta`，避免靠人工评审发现跨层依赖和漏执行 case。

## 冻结目的

本 tranche 解决三个具体问题：

1. `package.json` 依赖声明不能再被 workspace hoist 掩盖；源码 import 了 `@redcube/*` package，就必须显式声明。
2. layer ownership 不能只写在文档里；`apps -> gateway -> runtime -> runtime-family / governance / protocol` 的方向必须有 meta gate。
3. nested test cases 不能只存在于目录里；任何 `tests/*-cases/*.test.ts` 都必须被根级 `tests/*.test.ts` 显式挂载，才能进入现有 lane partition。

## Owner Boundary

当前可执行 owner map 固定为：

- `apps`: CLI / MCP protocol adapters，只调用 `gateway` 和必要 config。
- `gateway`: product-entry、service-safe entry 和 operator-facing projection composer；它可以读 overlay/runtime/protocol，但不得直接依赖 concrete runtime-family 或 pack。
- `runtime`: managed execution、session/run store、runtime facade 和 executor selection；它不得依赖 gateway/apps。
- `runtime-family`: family-specific stage execution；它不得依赖 gateway/runtime/apps。
- `overlay`: domain contract/profile/surface boundary；它不得成为 managed runtime owner。
- `pack`: typed shell、pack-id carrier 和 artifact type boundary；它不得重新成为 authoring/runtime owner。
- `governance`: review/publication state owner surface；runtime-family 只应通过明确 context 或 governance API 消费投影。
- `runtime-protocol`: workspace/run/source/native-helper contracts；它保持底层共享 contract，不依赖上层。

## 本次已落地

- 新增 package/layer boundary meta gate：扫描 `apps/*/src` 与 `packages/*/src` 的 `@redcube/*` imports，检查依赖声明和 layer allow matrix。
- 补齐 `@redcube/runtime` 对 `@redcube/overlay-core` 与 `@redcube/overlay-registry` 的显式依赖声明。
- 新增 nested-test registration gate：扫描 `tests/**/*.test.ts`，要求嵌套 case 可从根级测试显式 import 到达。
- 补挂已存在但未执行的 `tests/cli-v2-smoke-cases/cli-summary-output.test.ts`。
- 抽出 Codex runtime topology authority：`runtime-protocol` 持有默认 topology builder，`overlay-core` 不再依赖旧 runtime substrate package，退役 runtime package 只作为历史迁移背景保留。
- 收口 pack provenance 命名：`ppt`、`xiaohongshu`、`poster_onepager` pack type 层只表达 prompt-pack seed / runtime artifact provenance，不再编码 executor owner 字符串；`pack-first-completion` 增加 pack 源码扫描 gate。

## 一劳永逸修复路线

### Lane 1: Boundary Gates

保持本 tranche 的 meta gate 为常驻规则。后续任何新增 package、source file 或 case test 都先过依赖声明、layer allow matrix 和 nested test registration。

### Lane 2: Overlay-Core Runtime Topology Extraction

把 `overlay-core` 中 runtime topology / formal-entry 的具体 runtime 断言移到 runtime-owned projection 或 `runtime-protocol` contract builder。`overlay-core` 保留 governance surface shape、contract hydration 和 overlay boundary，不再 import concrete substrate。

验收：`overlay-core` 不依赖退役 runtime substrate package；Codex default runtime topology 由 `@redcube/runtime-protocol` 单一持有。

### Lane 3: Product Manifest Thin Composer

把 `get-product-entry-manifest.ts` 收敛为薄 composer。runtime inventory、OPL registration、skill catalog、route policy 和 family route truth 各自来自 owner projection builder，gateway 只聚合引用和 operator next action。

验收：manifest 文件不继续增长为第二 runtime truth owner；新增 projection 必须有 owner module 和测试。

### Lane 4: Runtime-Family Review Snapshot Injection

runtime orchestrator 读取 `getReviewState` / rerun policy 后，把 baseline/rerun snapshot 作为 stage context 传入 runtime-family。runtime-family 不直接 import governance state readers，只消费执行上下文。

验收：family package 不再直接 import `@redcube/governance` read APIs；review truth 仍由 `getReviewState` / `getPublicationProjection` 持有。

### Lane 5: Pack Provenance Cleanup

把 executor/provenance 命名从 pack type 层迁到 runtime artifact provenance。pack 只保留 schema、pack-id、artifact type 和非创作边界。

验收：pack package 不表达 executor owner；runtime artifact 明确记录 provenance。当前 pack 源码 gate 禁止 executor-owner 字符串回流到 `packages/redcube-pack-* /src`。

## 验收标准

- `npm run build`
- `npm run test:meta`
- `npm run test:fast`
- Sentrux rescan 后保持 `acyclicity` 不退化，新增改动不引入反向依赖
- plan-closeout 明确列出 `planned`、`done`、`deferred`、`skipped`、`verification`、`commit-push state`

## 当前 Backlog

- `arch-boundary-product-manifest-thin-composer`
- `arch-boundary-runtime-family-review-snapshot-injection`

## 已关闭 Backlog

- `arch-boundary-overlay-core-runtime-topology-extraction`
- `arch-boundary-pack-provenance-cleanup`
