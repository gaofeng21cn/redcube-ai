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

三个 hosted action 都要求准确的 `project_id`，通过既有 `workspace_index.json#/projects` 解析项目根与执行范围。Framework 以该范围选择项目知识并冻结 StageRun 上下文；请求不接收任意项目路径，缺失或未知身份应在执行前拒绝。

终局 decisive Attempt 返回 `stage_route_decision`；非终局 Attempt 最多返回 `stage_route_recommendation`。独立 Meta Review 不修改上游 artifact，也不递归启动 Stage 内正式 Review。具体 outcome、repair budget 和 route-back 规则由 `contracts/stage_quality_cycle_policy.json` 持有。

## Package、Carrier 与 Executor

RCA owner 持有 Package identity、能力和领域语义。实际 carrier 平台管理其承载的 bytes，并提供安装、更新、移除后的真实读回；Framework 聚合 presence/callability 和公开 action。当前 Codex Plugin 自包含入口 Skill、声明式 pack、contracts、native helpers 和引用文档，由 `scripts/sync_carrier.py` 从 canonical source 投影；具体资源与权威边界见 [carrier 说明](./references/primary-skill-plugin-carrier-boundary.md)。

完整 RCA bytes 的发布遵循 owner Package channel；共享 Release Set 仅用于离线或 QA 快照。普通 required/optional dependency 检查 identity presence 与 entrypoint callability。发布 digest 保护一次 bytes 交付，领域 artifact hash 保护 lineage，二者不构成中央依赖版本求解器。

当前首选 executor 为 Codex CLI；route adapter 属于平台。未来替换 executor 不应改变 RCA identity、能力、任务、偏好或 typed views。Framework 自身实现与迁移状态从其 [文档入口](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/README.md) 和公开 readback 读取，本仓不复制跨仓状态表。

## 数据归属

RCA 持有 visual truth、review/export verdict、artifact mutation authorization、visual memory accept/reject、typed blocker 和 owner receipt。平台可以传递 refs、验证身份、保存 execution receipt 和展示结果，但不能代签领域批准。

产品知识正文由 `agent/knowledge/` 与 v2 catalog 维护；用户、主题和项目知识按稳定身份绑定到各自的唯一正文来源。已有 Obsidian 的用户继续在原库维护个人知识，无库时由普通工作目录承载，两种来源可以在一个任务中组合。归属范围与内容性质、有效期、物理位置分开，具体领域规则见 [视觉记忆政策](./policies/visual_pattern_memory_policy.md)。

Framework 直接从获授权来源选择正文并冻结本次 StageRun 快照，不要求 RCA 工作区再存一套中间全文投影。业务工作区保存交付 artifact、修订提案与回执；平台运行状态保存快照和执行恢复记录。RCA 不建立个人知识数据库或通用来源解析器。项目源稿、图片和最终交付证据保持其业务保留周期，不能作为缓存清理。

源码只跟踪定义、schema、policy、locator 与隔离 developer fixtures。`tools/image-ppt-proof/` 和 `tools/native-ppt-proof/` 可验证 helper bytes，不能成为公开 runtime 或领域完成证据。

## Mini App 工作入口

RCA 的阶段与产物视图消费同一个已登记 workspace 和 work-item 上下文；`runtime_context` adapter 使用 Framework 的当前任务和产物投影，不要求用户寻找状态文件。`contracts/standard_agent_interface.json` 将 Framework 已有 `workspace_index.json#/projects` 映射为视觉任务目录。多个任务时由用户明确选择，缺少上下文时返回选择入口，不按文件名或修改时间猜测当前交付物。显式产物引用仍可用于审阅特定输出。

共享进度、产物与审阅组件的合同由 [Framework MCP Apps](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/mcp-apps/SPEC.md) 持有。RCA 保留视觉产物、修改语义、专业编辑及 review/export verdict；启动和继续制作走已有 hosted StageRun。Mini App 不建立第二份任务状态、产物索引、凭据库或执行循环。
