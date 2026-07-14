# RedCube AI 关键决策

Owner: RedCube AI
Purpose: 记录仍有效的架构决策。
State: active
Machine boundary: 本文解释 contracts，不替代 contracts。

## D1 标准 Agent 形态

RCA 采用 `Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions + Python native helpers`。已有私有平台实现只作为迁移输入，不保留 compatibility facade。

## D2 OPL 统一提供通用控制面

package lifecycle、CLI/MCP/product/workbench projection、StageRun、Attempt ledger、session/workspace shell、review/repair transport 与 native-helper envelope 全部上收 OPL。RCA 只消费这些 primitive。

## D3 领域 authority 不上收

visual truth、route semantics、review/export verdict、artifact mutation、visual memory 与 owner receipt 继续归 RCA。上收 transport 不等于上收领域批准权。

## D4 Codex-first，但不由 RCA 实现 executor runtime

Codex CLI 是第一公民 executor。executor selection、process lifecycle、session isolation、retry 和 receipt residency 由 OPL 托管；RCA pack 只声明 role、prompt、gate 与 affordance。

## D5 Python 只保留 native helper

Python 继续承担 PPT/Office/render/review/export mechanics。RCA 不再以 TypeScript package graph 实现 product/runtime orchestration；仓内 TypeScript 只用于验证和 developer proof tooling。

## D6 Proof 与 production path 分离

developer proof 可直接验证 helper 和 artifact bytes，但真实 image generation、StageRun、review/export 与 package lifecycle 必须通过 OPL-hosted path。proof pass 不能替代 owner acceptance。

## D7 物理删除优先于 tombstone facade

已迁移 caller 的 CLI、runtime、domain-entry、governance、overlay、current-program baton 与聚合测试直接删除。来龙去脉只留在 `docs/history/` 与 Git history。
