# RedCube AI 仓库协作规范

这个根目录 `AGENTS.md` 是仓库默认入口规范。直接从仓库根启动的开发会话，先遵循这里；更深的 `AGENTS.md` 只负责更窄子树的补充规则。

## 适用范围

适用于仓库根目录及其子目录；如果更深层目录存在 `AGENTS.md`，则以更近者为准。

## 项目定位

- `RedCube AI` 是共享 `Unified Harness Engineering Substrate` 上的 visual-deliverable domain gateway 与 `Domain Harness OS`，不是通用助手，也不是整个 `OPL` 系统。
- 当前默认本地执行形态是 `Codex-default host-agent runtime`；当前 repo-tracked 产品主线按 `Auto-only` 理解。
- 当前 formal-entry matrix 固定为：`CLI` 为默认正式入口、`MCP` 为支持协议层、`controller` 为内部控制面。
- `Gateway` 是 `CLI / MCP` 共享的唯一正式控制面；`controller` 当前不是可独立验证的仓内公开正式入口。

## 开发优先级

- 任何运行时演进都按这条顺序推进：先 contract shape，再 gateway validation，再 harness execution，最后 family-specific review/export 行为。
- 保持 `gateway -> family -> profile -> pack -> harness execution` 这条正式控制链路，不要把控制逻辑折叠成模糊 prompt 或隐藏分支。
- 优先使用 hydrated contract 与显式校验，不要用 prompt-only intent、隐藏 fallback chain 或静默 profile 推断冒充正式控制面。
- 未来即使迁移到 managed web runtime，也只能迁移宿主形态，不能改写 `RedCube AI` 的 domain 语义。

## 身份与 Durable Surface 边界

- `program_id`、`topic_id`、`deliverable_id`、`run_id` 各自承担不同身份，不能互相替代。
- 当前 canonical audit / watch surface 是 `auditDeliverable` 与 `runtimeWatch`。
- 当前 canonical review / projection surface 是 `getReviewState` 与 `getPublicationProjection`。
- 当前 canonical durable artifacts 继续以 `topics/<topic>/canonical/source-audit.json`、`topics/<topic>/publication-state.json`、`topics/<topic>/deliverables/<deliverable>/contracts/delivery-contract.json`、`topics/<topic>/deliverables/<deliverable>/reports/review-state.json` 为准。

## 工作树纪律

- Heavy 长链路工作必须在基于当前 `main` 创建的独立 worktree 中完成。
- 共享根 checkout 保持在 `main`，只用于轻量读取、评审、吸收到 `main`、push 和清理，不要让它成为长时间占用的 owner checkout。
- 如果需要多条长链路主线，就创建多个 worktree，不要指望 session 级隔离防止 hook 或本地状态互相干扰。
- 新 lane 开始前，确认 owner worktree 干净，且没有陈旧 `.runtime-program/state/sessions/*`、残留 tmux session 和 stale `skill-active` 状态。
- lane 结束后，要么吸收已验证提交回 `main`，要么明确放弃，并清理 worktree、分支和相关本地运行状态。

## 测试面治理

- `npm test` 和 `npm run test:fast` 是默认开发 smoke slice；不要把 `meta`、`integration` 或 `e2e` 悄悄塞回默认路径。
- canonical tracked verification ladder 固定为 `npm run test:meta`、`npm run test:integration`、`npm run test:e2e`、`npm run test:full`。
- `npm run test:full` 是 clean-clone 基线；CI 继续拆分为 `quality`、`integration` 与 `render-e2e`，不要重新折叠成不可见的大黑箱。
- 任何 repo-tracked 文件一旦改测试命令，要同步更新 README、CI 和 command-surface tests。

## 文档与附录

- 根文档负责默认协作规则；`contracts/project-truth/AGENTS.md` 是更细的 runtime/product boundary 附录，不再作为默认前置入口。
- `docs/policies/runtime_operating_model.md` 是当前稳定运行边界的补充真相文档。
- 根目录只保留与项目本身直接相关的正式入口与公开文档；本地 AI 过程文档放在未跟踪的 `docs/superpowers/`。
- 中文内部文档优先完整中文叙述；英文只保留给固定术语、路径、命令、schema 与代码标识符。

## 通用协作约束

- 保持 diff 小、可审查、可回退。
- 能删就别加；能复用现有模式就别新起抽象。
- 没有明确理由不要新增依赖。
- 完成前必须运行与改动相匹配的测试、类型检查和验证命令。
- 最终说明需要交代改了什么，以及仍存在哪些风险或缺口。

## 本地状态

- `.runtime-program/` 与 `.codex/` 是本地工具状态，必须保持未跟踪。
- `.runtime-program/local/AGENTS.local.md` 预留给机器私有 overlay，不进入 repo-tracked 主线。
