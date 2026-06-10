# RCA Foundry Agent OS 目标差异页

Owner: `RedCube AI`
Purpose: `foundry_agent_os_target_delta`
State: `active_support`
Machine boundary: 本文是人读 target delta。机器真相继续归 RCA contracts/source/tests、product-entry manifest、runtime artifacts、owner receipts、typed blockers、artifact locator、review/export gates，以及 OPL family `foundry_agent_os_standard` 合同。

## 读法

本文只回答 RCA 在 OPL family `Foundry Agent OS` 目标形态下“哪些上收到 OPL，哪些保留为 RCA authority kernel”。当前完成口径、证据门和执行顺序仍回到 [RCA 理想目标态差距与完善计划](./rca-ideal-state-gap-plan.md)；per-surface active caller 和物理退役门回到 [RCA 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)。

机器落点是 `contracts/foundry-agent-os-domain-kernel-manifest.json`。该 manifest 固定 retained Visual Authority Kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根、domain signer surfaces 和 false-authority flags；本文只做人读解释，不作为第二机器真相。

目标形态固定为：

```text
OPL Agent OS
  + Declarative Visual Pack
  + Visual Authority Kernel
  + Visual Capability Registry
```

这不是恢复 RCA 私有 managed runtime。它把通用运行、artifact gallery / handoff shell、review/repair transport、native-helper envelope、generated surface 和状态投影收回 OPL family 层，同时把 visual truth、review/export verdict 和 artifact authority 留在 RCA kernel。

## 上收到 OPL

| 上收域 | OPL owner | RCA 侧保留 |
| --- | --- | --- |
| StageRun / provider attempt / queue / retry | Runway / Stagecraft | visual stage descriptors、route truth refs、RCA owner receipt / typed blocker return shape |
| artifact gallery / handoff shell / Stage Folder index | Vault / Console / Runway | artifact locator contract、role manifest requirements、artifact mutation authority refs |
| review/repair transport | Stagecraft / Runway / Console | visual review/export verdict、repair target decision、blocked item semantics |
| generated CLI-MCP-App-status-workbench surfaces | Pack / Connect / Console | `agent/` Declarative Visual Pack、service-safe domain entry、domain handler target |
| workspace/source intake shell | Atlas / Runway | source readiness verdict、communication strategy、visual direction decision |
| native-helper envelope / helper catalog | Atlas / Pack / Runway | visual-native helper authority、helper output refs、fail-closed blocker semantics |
| evidence lineage / owner-chain refs | Vault / Atlas | visual memory accept/reject、owner receipt signer、no-regression evidence semantics |
| capability catalog / ABI / use policy | Atlas / Pack / Stagecraft | visual capability declaration、route-specific safe use policy、review/export authority guard |

OPL 只能持有 refs、descriptor、generated surface、routing shell、ledger、gallery projection 和 operator projection。OPL / Vault / Console / Runway / Pack / Capability Registry 都不能写 visual truth、artifact body、memory body、review/export verdict body、RCA owner receipt body 或 artifact mutation authority。

## 保留为 RCA Authority Kernel

RCA 必须保留：

- source readiness、communication strategy、visual direction、route truth 和 deliverable family semantics；
- AI-first story / visual plan / layout / brand / material judgment；
- screenshot review、visual director review、repair target selection、review/export verdict；
- artifact mutation/export authority、artifact locator ownership、owner receipt signer；
- visual memory body accept/reject、writeback decision 和 memory receipt；
- typed blocker、no-forbidden-write guard、no-regression evidence semantics；
- native PPT / image / export helpers 中无法声明化的视觉物化 guard 与 fail-closed blocker。

这些 surface 不能被 provider completion、render success、Stage Folder file presence、gallery projection、mock route proof、generated surface parity 或 AgentLab suite pass 替代。

## 默认读根

RCA 的 OPL-hosted / App-facing 默认读根必须是 `current_owner_delta`：

```text
current owner -> current visual delta -> accepted answer shape -> hard gate / typed blocker
```

默认 operator view 不应从 raw artifact inventory、runtimeWatch、gallery file count、stage replay worklist 或 provider completion 推导视觉完成。只有当前 owner delta 明确要求某个 route-required ref，且缺失会影响 source/material evidence、owner-route identity、forbidden write、irreversible artifact mutation、review/export hard gate 或 human review gate 时，才升级为 RCA-owned typed blocker。其他 capability / evidence 缺口进入 advisory 或 audit，不阻断视觉交付主线。

## 实施门

RCA 后续落地按下面的 gate 收口：

| Gate | 关闭条件 |
| --- | --- |
| Pack compile parity | OPL generated surfaces 能从 `agent/`、stage control、action catalog、artifact locator 和 RCA contracts 生成同一 command / descriptor / status shape。 |
| Default caller parity | direct route 与 OPL-hosted route 都回到同一 RCA owner receipt / typed blocker / no-regression return shape。 |
| No forbidden authority | OPL generated surface、Vault、Console、Runway、Capability Registry、gallery/handoff shell 不能写 visual truth、artifact body、memory body、review/export verdict 或 owner receipt body。 |
| Physical thinning | product/session/domain handler/runtimeWatch/operator projection/route-run adapter 的 active caller 迁出后直接退役或 tombstone，不保留 compatibility shell。 |
| Production evidence | real artifact-producing owner receipts、review/export receipts、visual memory receipts、Temporal visual-stage long-soak、production-like repeated no-regression、human review receipt 和 no-active-legacy-caller scan 形成真实证据。 |

## 禁止声明

- 不把 `Foundry Agent OS` target delta 写成 visual ready、exportable、handoffable、domain ready、production visual-stage long-soak complete 或 production ready。
- 不把 generated surface parity、gallery projection、Stage Folder file presence、mock artifact proof、AgentLab suite pass、provider completion 或 refs-only accounting 写成 RCA owner verdict。
- 不把 capability registry 写成 visual authority，也不把 optional capability ref 缺失写成默认 blocker。
- 不把 `current_owner_delta` projection 写成 owner answer；owner answer 必须来自 RCA authority kernel。
