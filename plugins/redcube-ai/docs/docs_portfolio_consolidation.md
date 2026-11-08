# RCA 文档生命周期

本页是本仓对 OPL 家族文档生命周期规则的唯一应用说明，规则 owner 为
[`one-person-lab`](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/docs-lifecycle-policy.md)；
导航见 [文档入口](./README.md)。文档解释事实，contracts、源码、实际调用者和 owner readback 决定机器行为。

## 一文一责

先确认要解决的读者问题，再决定是否新增文档。定位、组件关系、维护约束、决策理由、当前证据与未完成工作分别属于 project、architecture、invariants、decisions、status 和 active owner。目录索引只负责导航，不重复维护正文或手写 capability 清单。

教程负责带用户到一个可观察结果，reference 负责按主题查询，policy 负责稳定规则，spec 负责目标接口与验收。混合内容按其真实用途归位；同一规则只在一个正文完整定义，其余位置链接该 owner。

## 更新与退役

1. 对照当前 contract、源码、真实 consumer 和适用回执，按段判断当前事实、仍有效约束、未完成差距和失效叙事。
2. 当前事实更新到唯一 owner；未完成工作只保留下一动作、负责人和关闭条件，不追加逐轮执行清单、测试计数、SHA 或聊天式交接 prompt。
3. 完成计划、退休模块/接口/测试说明和重复记录先转移仍有效的约束，然后从当前树删除。历史使用 Git 追溯，不新建 history、tombstone、兼容目录或别名页。
4. 删除或移动时同时修复 Markdown、JSON、脚本和测试入链。必要 provenance 使用不可变 Git revision，不能让活跃机器合同依赖过时操作手册。
5. 根 README 双语保持等价的产品范围和使用边界；CHANGELOG 仅记录有效公开版本变化，未发布事项不能混入已退役 UI 的待办。

## 功能资源

`agent/` 和 `prompts/` 是会被执行器消费的行为资源，不能按普通 prose 去重。
Stage 定义任务，专业 Skill 持有方法，resources 保存按需参考，quality gates 持有批准边界；同一修改需追踪 manifest、action 和实际 consumer。

Plugin 主 Skill 是 canonical source 的物理分发副本，按 capability contract 同步；它不属于文档重复。法律与授权文件保留原职责。

## 验证

链接、路径、JSON/schema、资源存在性和生成副本一致性可自动检查。语义准确性、文档定位和职责由结合证据的审阅判断，不能用关键词、固定标题、字数或 Markdown 快照当真相门禁。

使用 `scripts/verify.sh` 的受影响 lane 和 `git diff --check`。没有真实发布、安装、artifact 或 owner readback，就只报告本次源码/文档验证结果。
