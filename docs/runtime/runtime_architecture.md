# 运行架构说明

生命周期说明：本文是当前 runtime topology 的人读说明，服务 `human_doc:runtime_architecture` 语义引用。它不承载 active baton closeout、Phase 2 provenance、Hermes 迁移证明或 gateway / harness 历史叙事；这些材料分别归入 `docs/active/`、`docs/references/` 与 `docs/history/`。

## 文档边界

| 字段 | 说明 |
| --- | --- |
| owner | RCA runtime / product-entry docs |
| purpose | 解释 direct route、OPL-hosted route、executor/backend、watch/projection 的当前边界 |
| state | current runtime explanation |
| machine boundary | 可执行真相在 runtime-program contracts、CLI/MCP surfaces、product-entry / domain-entry / runtime-family source、workspace/runtime artifacts；本文只是读者上下文 |

旧 `Gateway`、`Domain Harness OS`、Hermes-first、managed web runtime、local runtime 或 repo-local managed pilot 词汇只按内部边界、proof lane、迁移 provenance 或 tombstone 读取，不能读成当前公开身份、默认 runtime owner、generic framework/runtime owner 或 visual truth owner。旧 repo-local deliverable runner、run store 和 DAG runtime 已从 active source/package/test surface 物理删除；当前 active runtime 只保留 OPL stage-plan refs、RCA route handlers、visual authority surfaces 和 native helper implementation。

## 当前拓扑

RedCube direct route 是当前第一公开读法：

```text
User / Agent
  -> RedCube Product Entry / CLI / MCP
      -> RedCube service-safe domain entry
          -> executor adapter
              -> concrete executor
                  -> RedCube visual-domain truth surfaces
```

OPL-hosted route 是内部托管集成读法：

```text
User / Agent
  -> OPL Product Entry
      -> OPL stage-led family runtime provider
          -> RedCube service-safe domain entry
              -> executor adapter
                  -> concrete executor
                      -> RedCube visual-domain truth surfaces
```

两条路线在进入 RedCube service-safe domain entry 后必须收敛到同一套 route、review、artifact、publication projection 与 export authority。OPL 可以托管、唤醒、排队、投影和接收 receipt；RCA 继续持有 visual-domain truth、review/export verdict、canonical artifacts 与 domain memory content。

## Executor / Backend

当前默认 concrete executor 是 `Codex CLI host-agent runtime`，对应 runtime-program surface 里的 `codex_cli`。它是 direct path 和未显式选择 hosted/proof backend 的 OPL-hosted path 的最小执行单元。

`hermes_agent` 只表示显式 hosted/proof backend、可选 executor adapter 或历史 proof lane。它不能作为默认 runtime owner、OPL provider、production online substrate 或 legacy fallback 读取，也不能把旧 Hermes-first board 重新提升为当前公开主线。
`claude_code` 等未来 executor 也按 OPL generic Agent Executor Adapter / receipt 边界显式接入；RCA 只消费 receipt/projection refs，不实现 generic executor owner，也不承诺非默认 executor 的视觉质量、工具语义或 resume 行为与 `Codex CLI` 等价。2026-05-12 当前状态是 adapter/receipt/fail-closed 边界已落地，剩余验收是 provider-hosted controlled visual stage soak、真实 receipt instance、workspace/runtime memory writeback 和 no-forbidden-write proof。

OPL provider-backed 路径的 production online runtime 必需 substrate 是 Temporal。RCA 侧只暴露 product sidecar projection / guarded dispatch 和 service-safe domain entry；provider 负责在线唤醒、signal/query、retry/dead-letter 与 attempt 投影，不写 RedCube visual truth、review verdict、publication projection truth、canonical artifacts 或 export authority。

因此本文的 `runtime` 只指 RCA domain-agent runtime boundary，不表示 RCA 仓维护 generic scheduler、generic queue、generic attempt ledger、generic state-machine runner、generic memory locator、generic observability 或通用 App/workbench runtime。

RCA 长线实现语言面保持 `TypeScript + Python`：

- TypeScript 持有 product entry、CLI/MCP、contracts、domain-entry/runtime-family shell 与 typed service boundaries。
- Python 持有 native Office/PPT helper、截图/导出 helper 与文档/PPT 修复循环。
- Python helper 必须挂在 RedCube route/proof lane、review/export gate 与 repo-tracked contract 下，不能绕过 product-entry 或 runtime-family。

## Durable Surface

当前 durable identity 固定为：

| handle | 用途 |
| --- | --- |
| `program_id` | active mainline pointer、program truth 与 absorbed provenance routing |
| `topic_id` | topic 聚合根，承载 source audit 与 publication projection |
| `deliverable_id` | topic 内交付物身份，承载 delivery contract、review state 与 export readiness |
| `run_id` | 单次执行句柄，承载 telemetry、rerun linkage、runtime watch 与 event log |

当前 canonical callable surfaces 固定为：

| surface | 当前职责 |
| --- | --- |
| `invokeProductEntry` / `getProductEntrySession` | direct product entry 与 same-session continuation |
| `invokeOplHostedProductEntry` | OPL-hosted integration，仍回到同一 downstream RedCube entry |
| `invokeDomainEntry` / `invoke_domain_entry` | service-safe domain entry |
| `auditDeliverable` | gate judgement，并回指 canonical review state、publication projection 与 hydrated delivery contract |
| `runtimeWatch` | run / progress / escalation read model，必须和 review/publication projection 对齐 |
| `getReviewState` | review truth read surface |
| `getPublicationProjection` | publication / handoff projection read surface |

## Watch / Projection

`runtimeWatch` 是读模型和治理投影，不是第二套 runtime truth。它必须围绕同一组 `workspaceRoot`、`topic_id`、`deliverable_id`、`run_id` 与 artifact refs 读取状态，并与 `getReviewState`、`getPublicationProjection`、`auditDeliverable` 对齐。

OPL 侧可通过 product sidecar 读取和派发受控动作：

- `product sidecar export` 暴露 product-entry registration、session continuity、artifact inventory、runtime health、review/publication projection refs。
- `product sidecar dispatch` 只允许 `runtime_watch`、`emit_no_regression_evidence`、`emit_domain_owner_receipt`、`apply_visual_memory_writeback`、`apply_visual_workspace_lifecycle`、`evaluate_visual_transition`、`emit_workspace_receipt_proof`、`notification_receipt` 这类 guarded actions。
- `supervise_managed_run` 与 `product_entry_continuation` 已从 default generic sidecar dispatch 物理删除/收薄；`get_managed_run` / `supervise_managed_run` 已从 public CLI/MCP/gateway surface 退役。generic supervision / continuation 归 OPL runner/session shell。RCA 保留 direct product-entry/session API 和内部 visual authority surfaces；旧 repo-local supervision/runtime 不再作为 active fixture 保留，只在 history/provenance 语境追溯。
- `emit_no_regression_evidence` 只生成 RCA-owned runtime evidence ref，落在 workspace `.redcube/runtime/evidence/no-regression/`；它证明 descriptor/runtime refs、physical skeleton anchor、legacy active-path retirement 和 no-forbidden-write 边界未回退，不写 visual artifact blob，也不声明 provider-hosted visual long soak 完成。

Sidecar 不写 visual truth、canonical artifacts、review verdict 或 publication gate。任何需要生成、修复、审阅或导出视觉交付物的动作都必须回到 RCA-owned route 与 gate。

当前 runtime apply surface 包括：

- `emit_domain_owner_receipt`：写 RCA-owned domain receipt、typed blocker 或 no-regression evidence ref，用于真实 artifact-producing attempt 的 owner closeout。
- `apply_visual_memory_writeback`：写 RCA-owned memory proposal / accepted-rejected receipt refs，并由 RCA 持有 visual lesson body、accept/reject authority 和 route caveat 判断。
- `apply_visual_workspace_lifecycle`：写 RCA-owned cleanup / restore / retention mutation receipt 或 typed blocker，用于真实 visual workspace 生命周期操作。

这些 surface 只写 workspace/runtime refs，不写 repo source tree，不把 RCA visual truth、review/export verdict、memory body、canonical artifacts 或 artifact mutation authority 移给 OPL。OPL hosted integration 和 Temporal provider 只能调度、唤醒、投影并保存 locator/projection/receipt refs；真实 OPL Temporal controlled visual-stage long soak 仍是 pending runtime proof。

## Family Lifecycle

当前 family 共享同一宏观生命周期：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核与治理叠加在 family route 上：

- `visual_director_review` 负责导演层审片。
- `screenshot_review` 负责技术质控。

当前默认 visual routes：

- `ppt_deck` 默认走 image-first `author_image_pages -> screenshot_review -> repair_image_pages -> export_pptx`。
- `xiaohongshu` 默认走 image-first `author_image_pages -> screenshot_review -> repair_image_pages -> publish_copy -> export_bundle`。
- HTML 与 native editable PPTX 都是显式可选路线，不是默认视觉路线。

## OPL-hosted Boundary

OPL 是 stage-led、以 Agent executor 为最小执行单位的运行框架，可以把 RCA 作为 admitted domain agent 托管。它的边界是：

- 读取 RCA-owned descriptor、manifest、stage/action catalog、sidecar projection 与 receipt refs。
- 管理 family-level queue、wakeup、handoff、approval/retry/dead-letter、trace/projection。
- 通过 configured family runtime provider 调度 attempt。

OPL 的边界之外是：

- 不生成 RedCube visual route。
- 不持有 review/export verdict。
- 不持有 canonical artifacts。
- 不写 publication projection truth。
- 不接管 RCA domain memory content。

Codex App direct skill 调用与 OPL-hosted 调用必须在 `invokeDomainEntry` / product-entry command contract 后收敛；OPL stage metadata 只能作为 descriptor/projection，不能成为第二 route truth、第二 review owner 或第二 artifact authority。

## Provenance 去向

本文只保留当前 runtime 拓扑。下列内容不再放在这里展开：

- Phase 2 hardening closeout：`docs/history/phase-2/`
- upstream Hermes proof / blocker / closeout：`docs/history/hermes/upstream_hermes_agent_*.md`
- repo-local Hermes migration history：`docs/history/hermes/`
- gateway / harness / bridge / Hermes-first 退役读法：`docs/history/tombstones/retired-route-narratives-2026-05-11.md`
- OPL handoff 与 family contract 支撑材料：`docs/references/`

长期稳定规则继续看：

- [运行模型 Policy](../policies/runtime_operating_model.md)
- [交付合同模型 Policy](../policies/deliverable_contract_model.md)
