# RedCube AI 关键决策

Owner: RedCube AI
Purpose: 记录仍有效的架构决策。
State: active
Machine boundary: 本文解释 contracts，不替代 contracts。

## D1 标准 Agent 形态

RCA 是 `OPL Package(kind=agent)`，采用
`executor-neutral Package identity + Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions + Python native helpers`。
已有私有平台实现只作为迁移输入，不保留 compatibility facade。

## D2 Package、carrier 与 executor 分离

RCA 持有 Package identity、capabilities、业务 Work Item / task、typed-view
schema/data 与稳定 entrypoints。实际 carrier 平台持有其承载 bytes 的
install/update/remove 和 fresh readback；OPL Framework 聚合跨 carrier 状态、presence
graph、executor routes 与 generated surfaces。Codex Plugin 只是当前 carrier
projection，不能成为 Package identity 或完整 installed truth。

## D3 领域 authority 不上收

visual truth、route semantics、review/export verdict、artifact mutation、visual memory 与 owner receipt 继续归 RCA。上收 transport 不等于上收领域批准权。

## D4 Codex-first，但不由 RCA 实现 executor runtime

Codex CLI 是当前首选 executor，Codex 路径是当前唯一需要正式维护的产品路径。
executor selection、process lifecycle、session isolation、retry 和 execution receipt
residency 由 OPL 托管；RCA pack 只声明 role、prompt、gate、affordance 与可调用
capability。公共 Package 合同保持 executor-neutral；将来替换 executor 只替换 route
adapter，不触发 RCA 重装或业务状态迁移。

## D5 Python 只保留 native helper

Python 继续承担 PPT/Office/render/review/export mechanics。RCA 不再以 TypeScript package graph 实现 product/runtime orchestration；仓内 TypeScript 只用于验证和 developer proof tooling。

## D6 Proof 与 production path 分离

developer proof 可直接验证 helper 和 artifact bytes，但真实 image generation、
StageRun 与 review/export 必须通过 OPL-hosted path；Package 安装与更新必须通过实际
carrier 的受控入口。proof pass 不能替代 owner acceptance、完整 Package
installed/callable readback 或公开发布 currentness。

## D7 物理删除优先于 tombstone facade

已迁移 caller 的 CLI、runtime、domain-entry、governance、overlay、current-program baton 与聚合测试直接删除。来龙去脉只留在 `docs/history/` 与 Git history。

## D8 RCA owner 独立发布完整 Package

一方完整 RCA Package bytes 发布到 RCA 自己的 GHCR repository，RCA owner 只推进
自己的 `latest-stable`。共享 `one-person-lab-manifest:latest-stable` 只保留
Full/offline/integration-test/QA 快照用途，不参与 RCA 普通 currentness。发布使用的
exact ref、digest、checksum、SBOM 和 attestation 保护该次 bytes 完整性，不进入普通
Package 组合门禁。

## D9 依赖按 presence 与 callability 组合

普通 required/optional dependency 只声明 Package 或 capability identity，并检查
presence 与 declared entrypoint callability。禁止用 SemVer/ABI range、installed lock、
payload、digest、Release Set 或跨 Package 原子闭包限制组合。breaking interface 由
RCA owner 发布新 identity 或保留向后兼容 adapter，不建设中央版本求解器。

## D10 旧 Package lifecycle 合同只作迁移输入

当前 `contracts/opl_agent_package_manifest.json` 中的 version、lock、payload、
currentness、lifecycle receipt、rollback 和 managed dependency graph 字段仍服务旧
consumer。它们在 dual-read 与功能等价证据闭合前保持可读，但不得新增 writer、
consumer 或设计依赖；最终由 carrier fresh readback 和薄 Framework projection 取代。
