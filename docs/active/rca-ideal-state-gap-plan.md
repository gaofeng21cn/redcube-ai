# RCA 未完成验收

本页只持有尚未关闭工作的 owner、下一动作和验收条件。源码事实见 [状态](../status.md)，目标见 [目标态参考](../references/rca-visual-deliverable-agent-ideal-state.md)。完成项更新所属文档和机器证据后从本页移除，过程由 Git 或外部 evidence owner 保管。

| 工作 | Owner 与下一动作 | 关闭证据 |
| --- | --- | --- |
| 完整 Package 与 hosted callability | Carrier / Framework owner 读取 RCA 完整 bytes、入口和 executor route；RCA 核对 descriptor 与 native helper refs | 完整 installed/callable carrier readback 与真实 hosted invocation；Plugin-only 不足 |
| 独立发布 currentness | RCA publication owner 核对 immutable revision 与 RCA 自己的 channel | `latest-stable` 对应 exact revision 与匿名 digest readback；不以 source version 或 tag 替代 |
| Package 组合与 executor 解耦 | Framework/App/Shell owner 按各自真实 consumer 处理迁移；RCA 仅修改自身 descriptor | consumer 切换与无活跃调用证明；切换 route 后 identity、能力、偏好、Work Item、Temporal refs 和 typed views 保留 |
| 真实视觉交付 | RCA owner 在真实 workspace 调用 `invoke_product_entry`，记录准确 source/artifact lineage | StageRun/Attempt、可读 artifact、独立 Review、RCA quality/export 与 owner receipt |
| 真实 memory lifecycle | RCA memory owner 消费 review-grounded proposal，执行 accept/reject 与受控 writeback | body 留在领域存储的 receipt、locator projection、retention/restore 和 scaleout evidence |
| 恢复与规模 | Hosted runtime owner 与 RCA 联合执行 restart/resume/retry、long-soak 和跨域回归 | provider recovery、受控 visual-stage soak、重复 no-regression refs；每个领域独立签验收 |
| Native PPT 非劣效 | RCA owner 按 [native spec](../specs/native-ppt-ppt-master-parity.md) 运行固定来源的对照、真实编辑和跨 viewer 阅读 | 同源双跑、独立盲评、exact package/source identity、跨 viewer evidence 与 RCA parity receipt |

## 领域验收入口

先读取当前安装的 OPL interface 和完整 Package / executor 状态，再在 owner 授权的 workspace 执行：

```bash
opl agents conformance --family-defaults --json
opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>
```

conformance 只证明结构投影。实际 StageRun 保留 input identity、artifact refs、
review/export、human gate、typed blocker 与 owner receipt；只有对应 owner 已产生可验证证据时才更新 `contracts/live_stage_run_progress_evidence.json`。

缺 carrier、权限、凭据、准确目标或 owner evidence 时记录真实 blocker。RCA 不为推进验收建立私有 installer/runtime，不以测试、文档、provider completion 或单个样片签发 ready。
