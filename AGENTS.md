# RedCube AI 仓库协作规范

## 适用范围

本文件适用于仓库根目录及其所有子目录；若更深层目录存在 `AGENTS.md`，以更近者为准。

## 项目定位

- `RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的 visual-deliverable domain gateway 与 `Domain Harness OS`。
- 当前默认本地执行形态是 `Codex-default host-agent runtime`；当前 repo-tracked 主线按 `Auto-only` 理解。
- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。

## 非目标

- 不把 `RedCube AI` 写成通用助手，也不把它写成整个 `OPL` 系统。
- 不把 ontology 语义和宿主包装混写。
- 不用隐藏 fallback chain、prompt patch 或静默 profile 推断代替显式 contract。

## 开发优先级

- 第一优先级：保持 `gateway -> family -> profile -> pack -> harness execution` 的正式控制链路。
- 第二优先级：优先 machine-readable contract、显式校验和 hydrated execution，而不是 prompt-only intent。
- 第三优先级：在不改写 domain 语义的前提下，继续维护同一 mainline 的 absorbed tranche、follow-on board 与 provenance。

## 主要入口与真相面

- 默认人类/AI 入口：`README.md`、`README.zh-CN.md`、`docs/README.md`、`docs/README.zh-CN.md`
- 稳定规则入口：`docs/policies/runtime_operating_model.md`
- 机器可读主线合同：`contracts/runtime-program/current-program.json` 及同目录 tranche/provenance JSON
- 关键身份与 durable surface：`program_id`、`topic_id`、`deliverable_id`、`run_id`；`auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`

## 文档规则

- `README*` 与 `docs/README*` 是默认公开入口。
- 公开文档保持中英双语；内部操作、规划与审计说明默认中文。
- narrative 规则放根 `AGENTS.md`、`docs/README*` 和 `docs/policies/*`；machine-readable contract 放 `contracts/runtime-program/*.json`。
- 不再保留 narrative 的 `contracts/project-truth/AGENTS.md` 层。

## 变更与验证

- 保持 diff 小、可审查、可回退。
- 能删就别加；能复用现有模式就别新起抽象。
- 没有明确必要不要新增依赖。
- 修改 formal-entry、execution handle、runtime mainline、测试命令或 CI 分层时，必须同步改 README、docs、contracts 与相关测试。
- 默认 smoke 是 `npm test` / `npm run test:fast`；`npm run test:meta`、`npm run test:integration`、`npm run test:e2e` 是显式 lane；`npm run test:full` 是 clean-clone 基线。

## 并行开发与工作树

- 大改动、长链路工作、并行多 AI 开发，默认先从当前 `main` 开独立 worktree，再在 worktree 内实现和验证。
- 共享根 checkout 只用于轻量阅读、评审、吸收验证后提交、push 和清理，不应长期承担重型实现。
- 新 lane 开始前先清理陈旧 `.runtime-program/state/sessions/*`、tmux session 与 stale `skill-active` 状态。

## 本地状态

- `.runtime-program/` 与 `.codex/` 都是本地工具状态，必须保持未跟踪。
- `.runtime-program/local/AGENTS.local.md` 只允许作为机器私有 overlay 存在，不进入 repo-tracked 主线。
