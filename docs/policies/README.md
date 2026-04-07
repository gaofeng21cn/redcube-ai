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
- [TypeScript 迁移 Policy](typescript_migration_policy.md)

当前统一口径：

- `Agent-first` 不等于 `external_llm-only`
- `Codex-default host-agent runtime` 是当前正式默认执行形态
- 共享宏观生命周期是：
  - `Source Readiness`
  - `Story Architecture`
  - `Visual Authorship`
  - `Delivery Packaging`
- 审核统一采用：
  - `visual_director_review`
  - `screenshot_review`
