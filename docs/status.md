# RedCube AI 当前状态

Owner: RedCube AI
Purpose: 汇总当前 RCA source shape、机器 owner 与尚未闭合的 evidence gate。
State: active_current_summary
Machine boundary: 结构事实以 root contracts、`agent/`、保留源码和 fresh repo readback 为准；package currentness、真实 StageRun、visual/review/export verdict 与 owner receipt 由各自 owner surface 证明。

## 当前结论

RCA 当前是 `OPL Package(kind=agent)` 形式的标准 visual-deliverable domain pack：
canonical Package id 为 `rca`，repo/package version 为 `0.2.9`。仓内保留
executor-neutral identity/capability declarations、declarative visual pack、RCA
authority contracts、Python native helpers、最小 authority functions 与 developer
verification。

Repo source 与 contracts 已表达私有控制面的结构退役，但 Package 平台组合迁移尚未
闭合：当前 manifest 仍含旧 lock/payload/currentness/lifecycle receipt/rollback 字段，
Framework 已提供受保护的单 Package publisher；RCA annotated owner tag `v0.2.9`
已在远端并精确指向 canonical owner commit，但 Framework projection、immutable GHCR
`rca:0.2.9`、RCA `latest-stable` 晋升与匿名 readback 仍未闭合。完整 carrier readback
与 executor-neutral route 也仍需 fresh proof。本文不把 source version、owner Git tag、
机器合同或测试状态伪装成已发布、current 或已安装。

这也不证明已安装 Package callable、真实 visual StageRun 成功、review/export
accepted、owner accepted、release ready 或 production ready。

## 当前 owner 与 source shape

| Surface | Current owner | Machine source |
| --- | --- | --- |
| Package identity/kind/capabilities | RCA | `contracts/opl_agent_package_manifest.json`；当前 shape 为过渡态 |
| Package bytes publication | RCA owner source + Framework protected single-Package publisher | `v0.2.9` annotated owner tag 已绑定 canonical owner commit；Framework projection、immutable `rca:0.2.9`、`latest-stable` 晋升与 GHCR public readback 仍 open |
| Physical install/update/remove | 实际 carrier platform；Framework 目标为薄 adapter/聚合 | 当前仍由 `opl packages` compatibility surface 暴露旧 lifecycle |
| Executor route readiness | OPL executor adapter；当前首选 Codex CLI | OPL generated/hosted readback；非 Codex中性 proof 未闭合 |
| Business Work Item / typed views | RCA 声明业务语义；OPL/Temporal 只聚合运行 refs | RCA descriptor/runtime contracts；通用投影仍待平台迁移 |
| Domain identity与 routing | RCA | `contracts/domain_descriptor.json`、`contracts/standard_agent_interface.json` |
| Declarative visual pack / stage semantics | RCA | `agent/`、`agent/stages/manifest.json` |
| Hosted actions | RCA 声明 action semantics；OPL 生成并托管 execution surface | `contracts/action_catalog.json`、`contracts/generated_surface_handoff.json` |
| Generated CLI/MCP/skill/status/workbench | OPL | `contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json` |
| Visual truth、review/export verdict、artifact/memory mutation、typed blocker、owner receipt | RCA | `contracts/pack_compiler_input.json`、`contracts/functional_privatization_audit.json`、RCA authority contracts |
| Native helper implementation | RCA；process/currentness/receipt envelope 归 OPL | `python/redcube_ai/native_helpers/`、`contracts/runtime-program/python-native-helper-catalog.json` |
| Repo verification与 deterministic proof | RCA developer surface，不是 runtime 或 live evidence | `scripts/`、`tests/`、`tools/` |

## 已关闭的 repo 结构面

- `contracts/functional_privatization_audit.json` 将当前形态标记为 `standard_domain_pack_and_authority_functions_only`，并把 repo-local default surface 标记为物理不存在。
- `contracts/functional_privatization_audit.json#/private_functional_surface_admission_policy_ref` 采用 Framework canonical private-surface policy；RCA 只在同一合同中声明本领域 physical morphology，并继续禁止第二套 control plane。
- `contracts/generated_surface_handoff.json` 的 repo-local handler target 为空，generated surface owner 为 `one-person-lab`，结构 cutover 为完成状态，同时明确 production evidence 尚未完成。
- 当前 checkout 不含旧 `apps/redcube-cli`、`packages/redcube-domain-entry`、`packages/redcube-runtime*`、`packages/redcube-governance` 或 `packages/redcube-overlay-core`。

这些条目是 source/contracts readback，不是 live、release 或 owner acceptance 证明。

## Package 发布关系

- `package.json` 的 RCA source version 必须与 Python project、`uv.lock`、Codex
  carrier manifest 和 OPL owner manifest 一致；repo test 只检查同一版本，不做依赖
  版本求解。
- Owner tag `v<version>` 必须解析到 Framework projection 选择的 exact RCA commit。
  已存在的 tag 不移动；需要修正 bytes 时提升新版本，不能覆盖同版本内容。
- Framework `publish-package.yml` 归档该 exact owner commit 的完整仓库 bytes，先写
  immutable `one-person-lab-packages/rca:<version>`，验证一致后再推进 RCA 自己的
  `latest-stable`。RCA 不复制 ORAS、CAS、receipt 或 reconciliation 状态机。
- 2026-07-24 fresh readback 中，annotated tag `v0.2.9` 已在 owner Git remote，
  并 peeled 到 canonical owner commit；公开 `rca:latest-stable` 仍为 `0.2.7`，
  immutable `rca:0.2.9` 不存在。完成 Framework projection、protected publisher、
  RCA-only channel 晋升与匿名 exact-digest readback 前不得声称 `0.2.9` 已发布或
  current。

## 未闭合的 Package 迁移

- 将 manifest 收缩为 executor-neutral identity/capability/task/view descriptor，并让旧字段
  只读 dual-read；
- RCA owner 独立发布完整 bytes 并推进自己的 GHCR `latest-stable`，取得匿名 digest
  readback；
- Codex Plugin projection 加完整 Package carrier readback，避免 Plugin-only 虚假
  installed；
- 用至少一个 Git/local 中性 adapter 证明 Package identity 与 executor route 不绑定
  Codex；
- retained consumer 清零后删除旧 resolver、lock、payload、LKG、lifecycle receipt、
  materialization 和 rollback 状态机。

这些条目属于 Framework 跨仓迁移，不授权 RCA 在本仓新建 Package Manager、installer
或 executor runtime。

## 未闭合的领域 evidence gate

`contracts/live_stage_run_progress_evidence.json` 当前记录 owner typed blocker
`post_standardization_live_stage_evidence_required`，并明确 `domain_ready=false`、
`production_ready=false`。当前仍缺：

- fresh RCA complete-Package installed/callable carrier readback；
- 真实 OPL-hosted RCA StageRun 与 artifact lineage；
- RCA review/export/quality receipt 与 owner acceptance；
- provider restart/resume/retry、long-soak 与 repeated cross-family no-regression evidence。

在这些 owner evidence 到位前，不得从 contracts、doctor、conformance、focused tests、source-closure 或 queue clean 推导 visual ready、export ready、release ready、domain ready 或 production ready。

## 验证入口

- Repo structure/source guard：`npm run private-platform:readback`、`npm run test:private-platform:strict`、`scripts/verify.sh`、`npm run typecheck`。
- OPL structural projection：`opl agents conformance --family-defaults --json`。
- Live owner lane：`opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>`。
- Package compatibility readback：当前仍可读取 `opl packages status --package-id rca --json`
  与现有 install/update/uninstall actions，但输出中的 lock/payload/version currentness
  不是目标生态的 installed truth。
- 目标 Package proof：RCA GHCR `latest-stable` exact digest readback、完整 carrier
  installed/callable readback，以及 executor-neutral Git/local route readback。

验证结果必须按各命令实际证明的边界表述；repo 测试和结构 conformance 不能替代公开
Package currentness、完整 carrier state、live artifact、owner receipt 或 production
evidence。
