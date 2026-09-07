# RedCube AI 架构

本页持有组件归属与数据流；产品范围见 [项目定位](./project.md)，约束见 [硬约束](./invariants.md)，实现和验收状态见 [当前状态](./status.md)。

## 源码组件

| 组件 | RCA 持有 | 消费方 |
| --- | --- | --- |
| `agent/` | 阶段语义、prompt、专业 Skill、质量规则与知识引用 | OPL compiler 和 hosted executor |
| `contracts/` | identity、action、schema、authority、helper descriptor 与证据引用 | Framework 公开合同及领域实现 |
| `python/redcube_ai/native_helpers/` | PPT/Office/render/review/export 确定性 mechanics | OPL native-helper envelope；隔离 developer proof |
| `runtime/authority_functions/` | 最小领域 authority 声明 | RCA owner chain |
| `scripts/`、`tests/`、`tools/` | 开发验证与 proof | 开发者和 CI |

`runtime/authority_functions/` 目前是声明目录，不实现通用 runtime。RCA 不包含 repo-local CLI、domain-handler dispatcher、scheduler、Attempt/session/workspace store 或 Package Manager。

## 调用链

```text
完整 Package / carrier / executor 可调用性读回
  -> OPL-generated action
  -> hosted StageRun / isolated Attempt
  -> RCA stage pack + 专业方法
  -> 需要时调用 RCA native helper
  -> artifact / review / blocker / owner refs
  -> OPL controller 校验并物化 transition 与 execution receipt
```

`contracts/action_catalog.json` 声明动作及 hosted binding，`agent/stages/manifest.json` 声明阶段图，`contracts/generated_surface_handoff.json` 声明 generated surface owner 与领域写入边界。具体运行顺序见 [运行边界](./runtime/runtime_architecture.md)。

终局 decisive Attempt 返回 `stage_route_decision`；非终局 Attempt 最多返回 `stage_route_recommendation`。独立 Meta Review 不修改上游 artifact，也不递归启动 Stage 内正式 Review。具体 outcome、repair budget 和 route-back 规则由 `contracts/stage_quality_cycle_policy.json` 持有。

## Package、Carrier 与 Executor

RCA owner 持有 Package identity、能力和领域语义。实际 carrier 平台管理其承载的 bytes，并提供安装、更新、移除后的真实读回；Framework 聚合 presence/callability 和公开 action。当前配置的 Codex Plugin 只承载入口 Skill，full-copy 原因见 [carrier 说明](./references/primary-skill-plugin-carrier-boundary.md)。

完整 RCA bytes 的发布遵循 owner Package channel；共享 Release Set 仅用于离线或 QA 快照。普通 required/optional dependency 检查 identity presence 与 entrypoint callability。发布 digest 保护一次 bytes 交付，领域 artifact hash 保护 lineage，二者不构成中央依赖版本求解器。

当前首选 executor 为 Codex CLI；route adapter 属于平台。未来替换 executor 不应改变 RCA identity、能力、任务、偏好或 typed views。Framework 自身实现与迁移状态从其 [文档入口](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/README.md) 和公开 readback 读取，本仓不复制跨仓状态表。

## 数据归属

RCA 持有 visual truth、review/export verdict、artifact mutation authorization、visual memory accept/reject、typed blocker 和 owner receipt。平台可以传递 refs、验证身份、保存 execution receipt 和展示结果，但不能代签领域批准。

运行 artifact、workspace、session、receipt instance、memory body 与日志保存在外部 workspace/runtime roots。源码只跟踪定义、schema、policy、locator 与隔离 developer fixtures。`tools/image-ppt-proof/` 和 `tools/native-ppt-proof/` 可验证 helper bytes，不能成为公开 runtime 或领域完成证据。
