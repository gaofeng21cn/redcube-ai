# Policies

Owner: `RedCube AI`
Purpose: `policy_index`
State: `active_support`
Machine boundary: 人读 policy 索引。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和 current owner docs。

这里存放 `RedCube AI` 已经稳定、适合长期仓库跟踪的规则性文档。

它们默认服务于内部技术同事与 Agent 的稳定操作面，不默认进入公开入口。
如果未来某份规则要提升到对外公开面，先更新 `docs/public/` / `docs/product/` 的 owner 文档与核心五件套；不恢复 docs 层双语镜像。

与 `docs/` 其他说明文档的区别：

- `docs/*.md` 解释“怎么理解、怎么使用”
- `docs/policies/*.md` 规定“什么是正式边界、什么不能退回去”

当前核心 policy：

- [运行模型 Policy](runtime_operating_model.md)
- [交付合同模型 Policy](deliverable_contract_model.md)
- [AI-first 质量边界 Policy](ai_first_quality_boundary.md)
- [视觉模式记忆 Policy](visual_pattern_memory_policy.md)
- [TypeScript 迁移 Policy](typescript_migration_policy.md)
- 文档生命周期规则集中在 `../docs_portfolio_consolidation.md`；`../references/governance/series-doc-governance-checklist.md` 只作为 OPL series 跨仓巡检支撑清单。公开入口先写 RCA 视觉交付身份，OPL 只作为托管运行框架路径；合同引用的旧 program brief 原位降级，无合同引用的旧计划进入 history / tombstone。

当前统一口径：

- `Agent-first` 由 RCA 物化的默认 `Codex CLI` concrete executor 与 OPL-hosted executor owner boundary 共同成立
- 默认 concrete executor 仍是本地 `Codex CLI`；非 Codex executor 的 hosted selection、attempt ledger 与 receipt 归 OPL，RCA 不保留本地 adapter/proof lane；历史 `repo-local managed runtime pilot` 只保留为迁移 provenance
- 共享宏观生命周期是：
  - `Source Readiness`
  - `Story Architecture`
  - `Visual Authorship`
  - `Delivery Packaging`
- 审核统一采用：
  - `visual_director_review`
  - `screenshot_review`
- 视觉叙事、风格、信息密度、route 选择 caveat 和 review failure mode 这类经验先按自然语言 visual pattern memory 管理；image-first/native/HTML route、review/export gate 和 canonical artifact 继续保持结构化权威。
