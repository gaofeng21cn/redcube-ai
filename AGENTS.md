# RedCube AI 仓库协作规范

## 适用范围

本文件适用于仓库根目录及其所有子目录；若更深层目录存在 `AGENTS.md`，以更近者为准。

## 定位

- `AGENTS.md` 只约束工作方式，不承载项目知识细节。
- 项目知识默认从 `README*`、`docs/README*`、`docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` 读取。
- `RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的 visual-deliverable domain gateway 与 `Domain Harness OS`。
- 当前默认本地执行形态是 `Codex-default host-agent runtime`。
- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
- 关键 durable surface 继续围绕 `program_id`、`topic_id`、`deliverable_id`、`run_id`，以及 `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection` 收口。

## 开发原则

- 第一优先级：保持 `gateway -> family -> profile -> pack -> harness execution` 的正式控制链路。
- 第二优先级：优先 machine-readable contract、显式校验和 hydrated execution，而不是 prompt-only intent。
- 第三优先级：在不改写 domain 语义的前提下，继续维护同一 mainline 的 absorbed tranche、follow-on board 与 provenance。
- 不做降级处理、兜底补丁、启发式修补或“先糊住再说”式实现。

## 文档体系

- `README*` 与 `docs/README*` 是默认公开入口。
- `docs/project.md`：项目概览与产品角色。
- `docs/architecture.md`：核心链路与结构边界。
- `docs/invariants.md`：硬约束与不能破坏的边界。
- `docs/decisions.md`：仍有效的关键决策与取舍。
- `docs/status.md`：当前主线、活跃 tranche、下一步与验证口径。
- `docs/program/phase-2/`：Phase 2 absorbed tranche、prefrozen follow-on board 与 provenance brief。
- `contracts/runtime-program/current-program.json`：当前机器可读主线合同与 active baton 指针。
- `contracts/runtime-program/*.json`：机器可读主线合同。
- `docs/policies/*`：稳定规则。
- `docs/references/*`：定位、背景、审计与非活跃参考。

## 文档规则

- 公开文档保持中英双语；内部操作、规划与审计说明默认中文。
- narrative 规则放根 `AGENTS.md`、`docs/README*` 与核心五件套；machine-readable contract 放 `contracts/runtime-program/*.json`。
- 新文档先判断角色，再决定落点；不要把核心知识、program brief、参考材料和历史记录混在同一层。

## 变更与验证

- 保持 diff 小、可审查、可回退。
- 能删就别加；能复用现有模式就别新起抽象。
- 没有明确必要不要新增依赖。
- 修改 formal-entry、execution handle、runtime mainline、program brief 路径、测试命令或 CI 分层时，必须同步改 README、docs、contracts 与相关测试。
- 默认最小验证入口是 `scripts/verify.sh`。
- 默认 smoke 是 `npm test` / `npm run test:fast`。
- `npm run test:meta`、`npm run test:integration`、`npm run test:e2e` 是显式 lane。
- `npm run test:full` 是 clean-clone 基线。

## 并行开发与工作树

- 大改动、长链路工作、并行多 AI 开发，默认先从最新 `main` 开独立 worktree，再在 worktree 内实现和验证。
- 共享根 checkout 只用于轻量阅读、评审、吸收验证后提交、push 和清理，不应长期承担重型实现。
- 新 lane 开始前先清理陈旧 `.runtime-program/state/sessions/*`、tmux session 与 stale `skill-active` 状态。

## 本地状态

- `.runtime-program/` 与 `.codex/` 都是本地工具状态，必须保持未跟踪。
- `.runtime-program/local/AGENTS.local.md` 只允许作为机器私有 overlay 存在，不进入 repo-tracked 主线。
- `.omx/` 若存在，只能作为未跟踪历史残留，不得再作为当前 workflow 入口。
