# RCA Visual-Deliverable Agent 理想态

Owner: RedCube AI
Purpose: 描述 RCA 长期目标，不复制当前 machine contracts。
State: support
Machine boundary: 实际能力与状态以 root contracts、OPL compiled interface、owner receipt 与真实 artifact evidence 为准。

## 理想形态

RCA 是可替换、可安装、可托管的 `OPL Package(kind=agent)`，而不是独立 runtime
产品。它持有 executor-neutral identity、capabilities、business Work Item、typed
views 与稳定 entrypoints；以 declarative visual pack 表达阶段、专业判断、quality
gates、tool affordances 与 authority boundary，以 native helpers 提供不可声明化的
视觉 mechanics。

## 领域深度

RCA 应持续提升以下 domain 能力：

- source-to-story communication strategy；
- visual direction、layout grammar、brand/style consistency；
- image-first、HTML 与 editable native PPT 的显式路线选择；
- screenshot/layout/content-fit review；
- exact artifact lineage、export integrity 与 visual memory reuse；
- 独立 reviewer/re_reviewer 的质量判断与 bounded repair。

这些能力进入 `agent/`、quality contracts 和 native helpers；不以新增 scheduler、runner、session store 或 workbench 实现。

## 平台复用

实际 carrier platform 应提供其承载 bytes 的 install/update/remove 与 fresh readback；
OPL 应统一提供跨 carrier discovery、presence/callability、generated interfaces、
durable StageRun、Attempt isolation、workspace/source/artifact transport、review/repair
transport、native-helper envelope 与 App shell。任何用户自定义 visual Agent 也应能
消费同一 substrate，而不复制 RCA 私有平台。

Codex Plugin Manager 是当前首个 carrier adapter，Codex CLI 是当前首选 executor；
RCA Package identity 不绑定两者。一方完整 Package bytes 由 RCA owner 独立发布并只
推进自己的 GHCR `latest-stable`。普通 dependency 只检查 identity presence 与
entrypoint callability；exact ref/digest 只保护单次发布完整性或领域 evidence
lineage。

## Authority

平台复用不能稀释领域 authority：OPL 不写 visual truth、不批准 review/export、不擅自修改 artifact body、不接受/拒绝 visual memory，也不签发 RCA owner receipt。controller 只验证并物化 decisive Attempt 的结果。

## Evidence

目标态完成要同时有：

1. owner GHCR `latest-stable` 与 complete Package carrier readback；
2. executor-neutral route proof 与零 private Package Manager residue；
3. structural conformance 与 native-helper executable tests；
4. exact-byte artifact evidence；
5. formal review/owner receipt；
6. provider restart/resume、long-soak 与 repeated cross-family no-regression。

Package、结构和领域 evidence 相互不能替代；领域 evidence 也不能作为保留私有 runtime
或 Package Manager 的理由。
