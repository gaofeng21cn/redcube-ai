# Hermes Runtime Substrate Activation Package

Owner: `RedCube AI`
Purpose: `historical_hermes_runtime_activation_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档保留的是 repo-local migration activation package 的 absorbed provenance，不代表当前仓库已经接入上游 `Hermes-Agent`。

## 历史 activation 摘要

这份 activation package 当时已完成冻结并在仓内落地。
它记录的是 repo-local Hermes migration line 如何把 `Codex-default host-agent runtime` 降为过渡期 deployment host / regression bridge / development shell。
当前 production online runtime substrate、default executor 和 generated/default caller 口径不从本文读取。

## 当时边界

- `RedCube Gateway`：继续作为 visual-deliverable domain gateway，对外保持 `CLI-first`、`MCP` supported、`controller` internal-only。
- `RedCube Domain Harness OS`：继续负责 domain-level orchestration、artifact durability、governance surface 与 family route contract。
- repo-local `Hermes` migration layer：当时负责 routed run session、executor identity、runtime topology、managed adapter failover 与 run/event durability 的本地迁移实现。
- `family / profile / pack`：继续只表达 deliverable ontology、route contract、review/export semantics，不上浮成 substrate owner。

## 当时 promotion invariants

- `program_id` / `topic_id` / `deliverable_id` / `run_id` 边界不漂移。
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection` 继续围绕同一 canonical truth 收口。
- 当时主线按 `Auto-only` 理解。
- `xiaohongshu` 不被改写成 direct-delivery。

## 历史排除范围

- 不扩 `controller`
- 不宣称 managed web runtime 已完成
- 不新增 family
- 不推进 academic poster

## 历史 verification record

当时 verification 覆盖 runtime deliverable route、family parity governance surface、managed deliverable execution、Hermes runtime canonical path、typecheck 和 full-suite 口径。具体命令与当时测试文件名只按提交历史 / runtime-program provenance 读取，不在本文继续保留为可执行清单。

当前默认验证入口、current readiness proof、runtime owner 和 production evidence tail 回到 `scripts/verify.sh`、`scripts/run-test-group.ts`、active gap plan、runtime-program contracts、source/tests、owner receipts 和 typed blockers。
