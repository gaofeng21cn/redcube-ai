# RedCube AI 硬约束

本页持有维护者必须保留的约束；设计原因见 [关键决策](./decisions.md)，组件归属见 [架构](./architecture.md)。机器边界由 contracts 与实际调用方校验。

## 身份和控制权

- `rca` 是唯一 Package identity；carrier 名和 executor 名不能成为第二身份或完整 installed truth。
- `agent/` 是声明式 pack 源；生成的接口与 Plugin 副本不能反向成为第二权威。
- RCA 不创建通用 runtime、Package Manager、私有 CLI、session/workspace store 或这些旧能力的兼容入口。
- 实际 carrier 执行 bytes 生命周期，Framework 聚合公开 readback；普通依赖只检查 identity presence 和 callability。
- RCA 持有领域 artifact、visual/review/export/memory 判定和 owner receipt；平台、helper、测试与评分不得代签。
- 发布 exact ref/digest 与领域 artifact/evidence hash 分别保护 bytes 和 lineage，不得变成普通 Package 组合锁。

## 执行和质量

- hosted controller 持有 StageRun、Attempt、隔离、恢复和 transition；native helper 只执行领域 mechanics。直接 helper 调用仅用于隔离 developer proof。
- decisive Attempt 返回语义 `stage_route_decision`，其他 Attempt 只能按声明返回 recommendation；controller 校验并物化，不替 RCA 决定领域路线。
- 正式 Review receipt 由 controller 基于独立 Attempt 物化；最终领域 owner receipt 由 RCA authority 消费真实证据后签发。
- 质量债允许最佳可读候选继续推进；没有可读页面时先物化 failure/no-output diagnostic。权限、安全、身份/currentness、executor 不可用、不可逆动作授权和显式人工决定仍须遵守。质量债不能支持 ready 声明。
- artifact、review、export 和 receipt 必须绑定准确输入与产物身份；hash 变化不能自动推翻未受语义变更影响的内容结论。
- 结构验证、provider completion、文件存在或 carrier 安装成功都不能证明 visual、export、domain、release 或 production ready。

## 源码和分发

- 真实 artifact body、workspace、memory body、receipt instance、runtime log、缓存和 installed state 不进入源码仓。
- 主 Skill 与 Plugin carrier mirror 按 capability contract 保持字节一致；改 canonical source 后同步 projection。
- 已完成计划和退役模块、接口、测试的说明从当前文档删除；仍有效约束先归当前 owner，历史用 Git 追溯。
