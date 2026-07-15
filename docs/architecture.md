# RedCube AI 架构

Owner: RedCube AI
Purpose: 描述标准 OPL Agent 的调用链、源码边界与 authority 分配。
State: active
Machine boundary: 具体字段以 root contracts、stage manifest、action catalog、native-helper catalog 与 OPL compiled interface 为准。

## 主链路

```text
User / Codex App
  -> installed OPL-generated RCA action
  -> OPL StageRun controller
  -> decisive Codex Attempt
  -> RCA declarative stage pack
  -> optional RCA Python native helper via OPL envelope
  -> artifact / review / blocker / owner refs
  -> OPL controller validates and materializes transition / receipt
```

只有终局 decisive Attempt 返回领域语义 `stage_route_decision`；非终局 Attempt 最多返回 `stage_route_recommendation`。OPL controller 只校验并物化 transition。RCA 仓不保存 current pointer、Attempt ledger、session store 或 runtime queue。

## 四层边界

### 1. Declarative visual pack

`agent/stages/manifest.json` 是 stage graph source，`agent/prompts/`、`agent/skills/`、`agent/professional_skills/`、`agent/quality_gates/`、`agent/knowledge/` 和 `agent/tools/` 提供阶段语义、专业能力与 tool affordance boundary。Manifest 通过 `quality_governance_profile_ref` 和 `meta_review_policy_ref` 接入 OPL 官方质量治理；`review_and_revision` 是独立、primary-only 的 Meta Review StageRun，不递归启动 Stage 内正式 Review。

### 2. OPL generated/hosted surfaces

`contracts/action_catalog.json` 与 stage manifest 是 OPL compiler 输入。OPL 生成并托管 CLI、MCP、Skill、product-entry、OpenAI、AI SDK、status 与 workbench projection；RCA 不实现对应 wrapper。

### 3. RCA authority

RCA 保留 source-readiness、visual-direction、review/export、artifact mutation、visual-memory 与 owner-receipt 领域判断。OPL 可以验证 ref、持久化 receipt 和投影结果，但不能改写 RCA visual truth 或伪造 RCA authority。`contracts/stage_artifact_kernel_adoption.json#/authority_boundary/opl_can_mutate_domain_artifact_body=false` 只禁止 OPL 改写领域 artifact body；RCA 仍是 artifact mutation authorization 与 canonical artifact authority 的唯一 owner。

### 4. Native helpers

`python/redcube_ai/native_helpers/` 只实现确定的 PPT/Office/render/review/export mechanics。`contracts/runtime-program/python-native-helper-catalog.json` 声明 helper；进程选择、超时、环境、JSON envelope 与 lifecycle 归 OPL。

## Artifact 与状态

repo source 不保存真实 PNG/PPTX/PDF、workspace state、receipt instance、session、runtime log 或 package lifecycle state。运行产物进入 OPL workspace/artifact root 或用户级 runtime-state；repo 只保存 schema、policy、locator vocabulary、developer-proof fixture 与 body-free evidence ref。

## Developer proof

`tools/image-ppt-proof/` 与 `tools/native-ppt-proof/` 是 deterministic developer evidence。它们可直接调用 RCA native helper验证实现字节，但不能作为公开 runtime、真实 image-generation path、review verdict 或 ready claim。真实运行必须回到 OPL-hosted action。

## 禁止的第二控制面

下列形态在 active source 中必须为零：repo-local CLI、domain handler dispatcher、generic scheduler/runner、Attempt/session/workspace store、review/repair transport、executor adapter、status/workbench wrapper、package install/update manager，以及对这些能力的 compatibility alias。
