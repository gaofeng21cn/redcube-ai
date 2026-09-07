# RedCube AI 关键决策

本页只解释当前架构取舍；执行规则见 [硬约束](./invariants.md)，组件和调用路径见 [架构](./architecture.md)。

## 声明式专业包与平台执行分开

视觉领域需要稳定的专业方法和批准权，通用队列、恢复、session、workspace 与安装状态已有平台 owner。RCA 因而保留 declarative visual pack、authority contracts 和 Python native helpers，避免两个控制面同时决定同一运行。

## Package 身份独立于分发和执行

Codex Plugin 适合分发入口 Skill，但不能表示完整 Package bytes；Codex CLI 是当前产品路径，也不应定义领域 identity。把 Package、carrier、executor 分开，才能在平台替换时保留能力、偏好、任务和领域数据。真实安装状态由实际 carrier 读回，不能由源码版本推断。

## AI 负责创作，Helper 负责物化

叙事、版式、图表语义和视觉验收需要结合内容判断。Python / OfficeCLI 负责确定性对象、几何、文件、渲染和导出证据，不能靠模板或分数取得设计与审阅权。具体规则归 [AI-first 质量边界](./policies/ai_first_quality_boundary.md)。

## Proof 与生产验收分开

隔离 fixture 可稳定验证 helper 与封装行为，却不能证明真实图片生成、独立审阅或 owner 接受。两类证据分别保存，避免通过测试或单套样片把未闭合的生产验收改写为完成。

## 按 Owner 独立发布

完整 Package bytes 由 RCA owner channel 发布；共享离线快照不能约束普通 RCA 更新。发布完整性与领域 lineage 仍需 exact evidence，但它们不要求跨 Package 版本、ABI 或原子 release cohort 求解。

## 删除已经替代的实现与叙事

旧 caller 完成替换后，保留空 facade、tombstone 或历史操作手册会继续制造入口歧义。当前代码和 owner 文档承担有效规则，Git 保存决策发生时的版本，不新增兼容页。
