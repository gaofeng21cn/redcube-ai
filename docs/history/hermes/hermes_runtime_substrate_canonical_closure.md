# Hermes Runtime Substrate Canonical Closure

Owner: `RedCube AI`
Purpose: `historical_hermes_runtime_closure_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 brief。当前机器真相继续归 contracts、source、CLI/MCP/API behavior、runtime artifacts、owner receipts 和当前 owner docs。

> 历史说明：这份文档记录 repo-local Hermes-backed closure 的当时事实，不代表当前仓库已经接入上游 `Hermes-Agent`，也不代表 Hermes 是当前默认 runtime substrate。当前状态以 `docs/status.md`、`docs/architecture.md` 和 `contracts/runtime-program/current-program.json` 为准。

## 历史 canonical closure 摘要

这一 tranche 当时已在仓内实现并通过验证。
它不是纯文档 freeze，而是记录 `ppt_deck` canonical deliverable mainline 当时如何跑到 repo-local Hermes-backed runtime 上，并把 shared behavior surface 一并对齐。

当前 runtime owner、executor backend、generated/default caller 和 physical source morphology 不从本文读取；请回到 core docs、active plan、runtime-program contracts、source/tests、owner receipts 和 typed blockers。

## Canonical family

- 先行 family：`ppt_deck`
- canonical 闭环：`Source Readiness -> Story Architecture -> Visual Authorship -> Delivery Packaging`
- 终点 route：`export_pptx`

## 历史验证事实

- 当时 routed deliverable execution 默认使用 `Hermes` substrate
- run record / event log / managed lane 统一暴露 Hermes runtime identity
- `governance_surface.runtime_topology` 在 create / review / audit / watch / projection 上一致
- `xiaohongshu` 与 `poster_onepager` 也已共享同一 Hermes runtime topology，但 family ontology 保持原样

## 当时保持不变的 domain truth

- `program_id` / `topic_id` / `deliverable_id` / `run_id`
- `auditDeliverable` / `runtimeWatch` / `getReviewState` / `getPublicationProjection`
- `source_readiness_summary` / `gate_summary` / `operator_handoff` / `lifecycle_stage_summary`
- `xiaohongshu` 的 explicit human publication 语义

## 历史边界

- 这里不声称 managed web runtime 已完成
- 这里不声称所有 future family 已齐平
- academic `paper_poster / conference_poster` 仍未进入当前 tranche

## 历史 verification record

当时 verification 覆盖 runtime deliverable route、family parity governance surface、managed deliverable execution、Hermes runtime canonical path、typecheck 和 full-suite 口径。具体命令与当时测试文件名只按提交历史 / runtime-program provenance 读取，不在本文继续保留为可执行清单。

当前默认验证入口、current readiness proof、runtime owner 和 production evidence tail 回到 `scripts/verify.sh`、`scripts/run-test-group.ts`、active gap plan、runtime-program contracts、source/tests、owner receipts 和 typed blockers。
