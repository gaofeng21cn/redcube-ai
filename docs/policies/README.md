# Policies

这里存放 `RedCube AI` 已经稳定、适合长期仓库跟踪的规则性文档。

它们默认服务于内部技术同事与 Agent 的稳定操作面，不默认进入首页双语公开正文面。
如果未来某份规则要提升到对外公开面，必须同步补齐英文 `.md` 与中文 `.zh-CN.md` 镜像。

与 `docs/` 其他说明文档的区别：

- `docs/*.md` 解释“怎么理解、怎么使用”
- `docs/policies/*.md` 规定“什么是正式边界、什么不能退回去”

当前核心 policy：

- [运行模型 Policy](runtime_operating_model.md)
- [交付合同模型 Policy](deliverable_contract_model.md)
- [AI-first 质量边界 Policy](ai_first_quality_boundary.md)
- [视觉模式记忆 Policy](visual_pattern_memory_policy.md)
- [TypeScript 迁移 Policy](typescript_migration_policy.md)
- 文档生命周期规则目前集中在 `../docs_portfolio_consolidation.md` 和 `../references/series-doc-governance-checklist.md`：公开入口先写 RCA 视觉交付身份，OPL 只作为托管运行框架路径；合同引用的旧 program brief 原位降级，无合同引用的旧计划进入 history / tombstone。

当前统一口径：

- `Agent-first` 由默认 `Codex` concrete executor 与显式 `hermes_agent` proof lane 共同成立
- 默认 concrete executor 仍是本地 `Codex CLI`；external `Hermes-Agent` 只作为显式 hosted/proof backend 与 OPL Runtime Manager 目标 substrate 出现，不改写默认公开 capability contract；历史 `repo-local managed runtime pilot` 只保留为迁移 provenance
- 共享宏观生命周期是：
  - `Source Readiness`
  - `Story Architecture`
  - `Visual Authorship`
  - `Delivery Packaging`
- 审核统一采用：
  - `visual_director_review`
  - `screenshot_review`
- 视觉叙事、风格、信息密度、route 选择 caveat 和 review failure mode 这类经验先按自然语言 visual pattern memory 管理；image-first/native/HTML route、review/export gate 和 canonical artifact 继续保持结构化权威。
