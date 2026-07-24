# RedCube AI 架构

Owner: RedCube AI
Purpose: 描述 RCA Package、carrier、executor、运行时与领域 authority 的边界。
State: active
Machine boundary: 具体字段以 root contracts、stage manifest、action catalog、native-helper catalog 与 OPL compiled interface 为准。

## 顶层模型

```text
OPL Base        ~= R
OPL App         ~= RStudio / replaceable GUI and deployment carrier
OPL Package     ~= R Package
RCA             = OPL Package(kind=agent)
```

RCA 是 executor-neutral 的完整 Package，不是 Codex Plugin 的别名。当前产品实现优先
复用 Codex Plugin Manager 和 Codex CLI，但 OPL-owned identity、capabilities、
business Work Item、Temporal refs 与 typed views 不绑定 Codex 私有字段。

## 主链路

```text
User / Codex App
  -> installed/callable RCA Package readback
  -> selected executor route (currently Codex CLI)
  -> OPL-generated RCA action
  -> OPL StageRun controller
  -> decisive executor Attempt
  -> RCA declarative stage pack
  -> optional RCA Python native helper via OPL envelope
  -> artifact / review / blocker / owner refs
  -> OPL controller validates and materializes transition / execution receipt
```

只有终局 decisive Attempt 返回领域语义 `stage_route_decision`；非终局 Attempt 最多返回 `stage_route_recommendation`。OPL controller 只校验并物化 transition。RCA 仓不保存 current pointer、Attempt ledger、session store 或 runtime queue。

## Package / Carrier / Executor

| Layer | Owner boundary |
| --- | --- |
| Package identity | RCA 持有 `id=rca`、`kind=agent`、capabilities、required/optional identity edges、业务 task、typed views 与稳定 entrypoints。 |
| Package publication | RCA owner 向自己的 GHCR repository 发布完整 Package bytes，只推进自己的 `latest-stable`。Exact ref/digest 只用于该次发布完整性。 |
| Carrier | Package 声明的 carrier/runtime adapter 承载并维护实际 bytes；Base 薄 OCI adapter 只下载/校验并移交 bytes，Codex Plugin Manager 只管理其 projection。完整 installed truth 来自所有实际 carrier 的 fresh readback。 |
| Executor | Codex CLI 是当前首选 route；未来 executor adapter 只改变 callability/readiness，不改变 Package identity、installed state 或业务数据。 |
| Framework composition | OPL 聚合 installed/callable、presence graph、executor route、Work Item/Temporal refs 与 typed views，不重建 resolver、lock、payload、LKG、lifecycle receipt、materializer 或 rollback manager。 |

普通 `required` / `optional` dependency 只检查 identity presence 与 declared entrypoint
callability。RCA 当前没有必需 Package dependency；未来增加 dependency 也不引入
SemVer/ABI、exact lock/payload/digest、Release Set cohort 或跨 Package 原子更新门禁。
缺 required capability 只局部使 RCA 对应 route unavailable，不阻塞 Base、App 或无关
Package。

`one-person-lab-manifest:latest-stable` 不定义 RCA 普通 currentness，只可承载
Full/offline/integration-test/QA 快照。Standard 与 Full 安装同一 App Official Profile；
Full 只增加离线 seed，不形成第二份 RCA Package truth。

## 五层源码与运行边界

### 1. Declarative visual pack

`agent/stages/manifest.json` 是 stage graph source，`agent/prompts/`、`agent/skills/`、`agent/professional_skills/`、`agent/quality_gates/`、`agent/knowledge/` 和 `agent/tools/` 提供阶段语义、专业能力与 tool affordance boundary。Manifest 通过 `quality_governance_profile_ref` 和 `meta_review_policy_ref` 接入 OPL 官方质量治理；`review_and_revision` 是独立、primary-only 的 Meta Review StageRun，不递归启动 Stage 内正式 Review。

### 2. OPL generated/hosted surfaces

`contracts/action_catalog.json` 与 stage manifest 是 OPL compiler 输入。OPL 生成并托管 CLI、MCP、Skill、product-entry、OpenAI、AI SDK、status 与 workbench projection；RCA 不实现对应 wrapper。

### 3. RCA business surfaces

RCA 声明 Agent Work Item / task inventory、业务状态与可选 typed-view schema/data。
Framework 只代理和关联 Temporal execution refs；App 只通过受控 renderer 渲染
`view_kind`，不能把 RCA 私有字段复制成 App 或 Framework schema。

### 4. RCA authority

RCA 保留 source-readiness、visual-direction、review/export、artifact mutation、visual-memory 与 owner-receipt 领域判断。OPL 可以验证 ref、持久化 receipt 和投影结果，但不能改写 RCA visual truth 或伪造 RCA authority。`contracts/stage_artifact_kernel_adoption.json#/authority_boundary/opl_can_mutate_domain_artifact_body=false` 只禁止 OPL 改写领域 artifact body；RCA 仍是 artifact mutation authorization 与 canonical artifact authority 的唯一 owner。

### 5. Native helpers

`python/redcube_ai/native_helpers/` 只实现确定的 PPT/Office/render/review/export mechanics。`contracts/runtime-program/python-native-helper-catalog.json` 声明 helper；进程选择、超时、环境、JSON envelope 与 lifecycle 归 OPL。

## Artifact 与状态

repo source 不保存真实 PNG/PPTX/PDF、workspace state、receipt instance、session、runtime log 或 package lifecycle state。运行产物进入 OPL workspace/artifact root 或用户级 runtime-state；repo 只保存 schema、policy、locator vocabulary、developer-proof fixture 与 body-free evidence ref。

Package 发布 checksum/digest 与 RCA artifact/evidence hash 都必须保留，但用途严格分离：
前者证明单次发布 bytes，后者证明领域 artifact lineage。它们都不能成为普通
Package-to-Package 组合或 executor 启动 lock。

## Developer proof

`tools/image-ppt-proof/` 与 `tools/native-ppt-proof/` 是 deterministic developer evidence。它们可直接调用 RCA native helper验证实现字节，但不能作为公开 runtime、真实 image-generation path、review verdict 或 ready claim。真实运行必须回到 OPL-hosted action。

## 禁止的第二控制面

下列形态在 active source 中必须为零：repo-local CLI、domain handler dispatcher、generic scheduler/runner、Attempt/session/workspace store、review/repair transport、executor adapter、status/workbench wrapper、package install/update manager，以及对这些能力的 compatibility alias。

当前机器合同仍处于过渡态：`contracts/opl_agent_package_manifest.json` 尚含
version/lock/payload/currentness/lifecycle receipt/rollback 等旧字段。它们可由 dual-read
兼容层读取，但不得驱动新增设计或被本文解释为目标架构已完成。
