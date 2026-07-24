# RedCube AI 项目定位

Owner: RedCube AI
Purpose: 定义 RCA 的产品身份、长期职责与 OPL 边界。
State: active
Machine boundary: identity 与可执行入口以 `contracts/opl_agent_package_manifest.json`、`contracts/domain_descriptor.json`、`contracts/action_catalog.json` 和 `agent/stages/manifest.json` 为准。

## 产品身份

RedCube AI 是 `OPL Package(kind=agent)`，canonical Package identity 为 `rca`。
`redcube-ai` 只作为仓库、Codex Plugin 和 Skill carrier 名，不是第二个 Package
identity。

RCA 的 Package identity、capabilities、业务 Work Item / task 语义、typed-view
descriptor/data 和稳定 entrypoint identity 都是 executor-neutral 的 RCA-owned
surface。当前正式用户入口由 OPL-generated interfaces 提供；Codex Plugin Skill 是
rich domain guidance carrier projection，它不创建独立 runtime、Package identity、
Package Manager 或第二套命令系统。

## RCA 持有的真相

- `rca` Package identity、`kind=agent`、capabilities、required/optional identity edge
  与稳定 entrypoint identity；
- RCA 业务 Work Item / task 语义和可选 typed-view schema/data；
- 视觉叙事、版式、品牌、图像、PPT、海报与社交视觉内容的领域语义；
- source-readiness、communication strategy 与 visual direction decision；
- review/export verdict 和 artifact mutation authorization；
- visual memory 的接受、拒绝与领域解释；
- RCA owner receipt、typed blocker 与 no-regression refs 的领域含义；
- Python native-helper 的具体视觉处理实现。

## 组合边界

- RCA owner 向独立 GHCR repository 发布完整 Package bytes，并只推进 RCA 自己的
  `latest-stable`；Release Set 只可作为 Full/offline/integration-test/QA 快照，不能定义
  RCA 的普通更新 currentness。
- Package 声明的实际 carrier/runtime adapter 负责其承载 bytes 的
  install/update/remove 和 fresh readback；Base 薄 OCI adapter 只下载/校验并移交
  bytes。Codex Plugin projection 不能单独证明
  含 native helper/runtime 的完整 RCA Package 已安装。
- OPL Framework 只聚合跨 carrier 的 installed/callable 状态、required/optional
  presence graph、executor route readiness、generated interfaces、Work Item 与 Temporal
  execution refs，以及 typed-view validation/proxy；不拥有第二套 Package
  resolver/lock/payload/LKG/receipt/rollback manager。
- Codex CLI 是当前首选 executor。未来更换 executor 只替换 route adapter，不得重装
  RCA Package，也不得丢失 Package identity、capabilities、用户偏好、Work Item、
  Temporal refs 或 typed views。
- 普通 dependency 只声明 Package/capability identity，并检查 presence 与 entrypoint
  callability；不比较版本/ABI，也不要求 lock、payload、digest、Release Set 或原子闭包。
- Temporal-backed StageRun、Attempt、session identity、resume/retry 和 execution
  history 归 OPL/Temporal；workspace/source transport、artifact index、review/repair
  transport、native-helper envelope 与 App shell 归各通用 owner。它们不得代写 RCA
  domain truth。

发布时的 exact ref、digest、checksum、SBOM 或 attestation 只证明该次发布的完整
Package bytes；RCA artifact/evidence hash 只证明领域 lineage。两者都不是普通组合门禁。

## 源码形态

当前 canonical source 只有四类：

1. `agent/`：declarative visual pack；
2. `contracts/`：机器合同、schema、policy 与 evidence refs；
3. `python/redcube_ai/native_helpers/`：RCA-owned native helper；
4. `runtime/authority_functions/`：最小 authority surface 声明，不含通用 runtime。

`apps/redcube-cli`、`packages/redcube-domain-entry`、`packages/redcube-runtime*`、`packages/redcube-governance` 与 `packages/redcube-overlay-core` 已退役，不能作为兼容层恢复。

## 不属于当前完成声明的内容

本页定义长期 owner boundary，不表示该迁移已经完成。当前
`contracts/opl_agent_package_manifest.json` 和 OPL consumer 仍包含旧
lock/payload/currentness/lifecycle receipt 字段；它们只能作为兼容迁移输入。
独立 GHCR owner publisher、完整 carrier readback、executor-neutral route proof 和旧
Package Manager 删除都需要 fresh terminal evidence。

结构标准化也不等于 production readiness。真实 visual StageRun、真实图片生成、真实
review/export acceptance、owner acceptance、跨运行 no-regression 与 provider
long-soak 仍按证据合同单独验收。
