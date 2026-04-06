# Policies

这里存放 `RedCube AI` 已经稳定、适合长期公开保留的规则性文档。

与 `docs/` 其他说明文档的区别：

- `docs/*.md` 解释“怎么理解、怎么使用”
- `docs/policies/*.md` 规定“什么是正式边界、什么不能退回去”

当前核心 policy：

- [运行模型 Policy](runtime_operating_model.md)
- [交付合同模型 Policy](deliverable_contract_model.md)
- [TypeScript 迁移 Policy](typescript_migration_policy.md)

当前统一口径：

- `Agent-first` 不等于 `external_llm-only`
- `Codex-native host agent` 可以是正式主执行器
- 共享宏观生命周期是：
  - `Source Readiness`
  - `Story Architecture`
  - `Visual Authorship`
  - `Delivery Packaging`
- 审核统一采用：
  - `visual_director_review`
  - `screenshot_review`
