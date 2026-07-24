# RCA 理想目标态差距与完善计划

Owner: RedCube AI
Purpose: 维护 RCA 的 single Active Truth：当前结构事实、理想态差距、owner evidence gate 与下一轮可执行入口。
State: active_truth
Machine boundary: 当前状态必须从 repo source/contracts 与 owner readback 派生；本文不持有 package currentness、visual/review/export verdict、owner receipt、release 或 production truth。

## Ideal-State Reference

- Canonical reference：[`docs/references/rca-visual-deliverable-agent-ideal-state.md`](../references/rca-visual-deliverable-agent-ideal-state.md)
- Framework 跨仓迁移 SSOT：
  [`one-person-lab/docs/active/opl-package-platform-composition-migration.md`](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md)
- 目标：RCA 是 executor-neutral 的 `OPL Package(kind=agent)`，持有 Package
  identity/capabilities、business Work Item、typed views、declarative visual pack、
  domain-specific native helpers 与不可下放的
  visual/artifact/review/export/memory/owner authority。Carrier platform 持有实际 bytes
  lifecycle；OPL 只持有跨 carrier 发现、presence/callability、generated interfaces、
  StageRun/Attempt、session/workspace/status/workbench 和 execution receipt envelope。

## Active Owner Discovery

| Truth | Owner | Machine surface |
| --- | --- | --- |
| RCA Package identity/capabilities/task/typed views | RedCube AI | 当前 `contracts/opl_agent_package_manifest.json`；目标 descriptor shape 待兼容迁移 |
| RCA complete Package publication | RedCube AI owner | 目标为 RCA-owned GHCR repository + per-Package `latest-stable`；fresh proof open |
| Package physical install/update/remove | 实际 carrier platform | 目标为 carrier fresh readback + Framework thin adapter；当前 `opl packages ... --json` 为 compatibility surface |
| Executor route | OPL executor adapter；当前首选 Codex CLI | generated/hosted callable readback；中性 route proof open |
| RCA domain/source/visual authority | RedCube AI | `agent/`、RCA contracts、native helpers、authority functions |
| Generated interfaces与 hosted lifecycle | One Person Lab | `contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json` + OPL readback |
| Live visual/review/export/owner acceptance | RedCube AI owner lane | real StageRun artifact refs、quality/export receipts、owner receipts |

## Current State Summary

- canonical Package id 为 `rca`、`kind=agent`、repo/package version 为 `0.2.8`；仓内
  没有第二 Package identity。
- Codex Plugin 是当前 carrier projection，Codex CLI 是当前首选 executor；RCA
  identity、capabilities、task 与 typed views 不以 Codex 私有字段定义。
- `agent/` 是 declarative visual pack source，`contracts/action_catalog.json` 只声明 `invoke_product_entry`、`run_image_ppt_proof`、`run_native_ppt_proof` 三个 OPL-hosted stage actions。
- `contracts/generated_surface_handoff.json` 声明 generated surfaces 归 OPL、repo-local handler targets 为空、结构 cutover 已闭合，并明确 production evidence 未闭合。
- `contracts/functional_privatization_audit.json` 只保留 RCA visual authority decisions 与 Python native helpers；旧 repo-local default/control surfaces 已退役。
- `contracts/live_stage_run_progress_evidence.json` 当前只有 typed blocker `post_standardization_live_stage_evidence_required`，没有 owner、quality/export、long-soak 或 no-regression receipts；它明确不声明 domain ready 或 production ready。
- `contracts/opl_agent_package_manifest.json` 仍含旧 version/lock/payload/currentness/
  lifecycle receipt/rollback/managed dependency graph 字段。它是 dual-read 前的兼容合同，
  不是目标架构已经实现的证明。

## Current-State vs Ideal-State Gaps

| Boundary | Current fact | Gap / next owner evidence | State |
| --- | --- | --- | --- |
| Repo source morphology | declarative pack + native helpers + minimal authority functions；旧 private control plane 路径不存在 | 保持 no-resurrection guard；只需 repo-native regression | structurally closed |
| Package descriptor | 当前 sidecar 混合 identity 与旧 lifecycle 字段 | Framework dual-read 后收缩为 executor-neutral identity/capability/task/view descriptor；旧字段无 active consumer | platform migration open |
| Independent publication | 当前 owner manifest version 可读，但本仓未证明完整 Package owner publisher/current channel | 发布完整 RCA bytes，只推进自己的 GHCR `latest-stable`，取得匿名 exact-digest readback | publication proof open |
| Carrier installed truth | Codex Plugin projection 与旧 `opl packages` 状态存在 | 聚合完整 Package 的 fresh carrier readback；Plugin-only 不得报告 complete installed | platform migration open |
| Executor decoupling | Codex CLI 是当前唯一正式路径 | 一个 Git/local 中性 adapter 证明切换 executor 不重装、不丢 task/view/偏好 | neutral proof open |
| Dependencies | 当前 RCA `capability_dependencies=[]` | 保持 required/optional identity presence + callability；未来 dependency 不得引入版本/ABI/lock/payload/digest/Release Set 门禁 | owner invariant closed |
| Generated/hosted surface handoff | descriptor source 可用、repo-local targets 为空、owner 为 OPL | 由 OPL 对 complete installed/callable Package 与 generated projection 做 fresh readback | owner evidence open |
| Native-helper envelope | RCA 保留 domain helper implementation，generic envelope 归 OPL | 需要真实 hosted invocation 的 exact helper/artifact/receipt lineage | live evidence open |
| Visual/review/export authority | contracts 保留 RCA authority，OPL 不得代签 | 需要 RCA quality/export receipt 与 owner acceptance；provider completion 不能替代 | owner evidence open |
| Recovery与规模 | repo tests 可证明结构和 helper 行为 | 需要 restart/resume/retry、long-soak 与 repeated cross-family no-regression evidence | production evidence open |

## Package Composition Migration

本仓只落实 RCA owner surface，不复制 Framework 的完整迁移状态机：

1. RCA owner descriptor 保留 executor-neutral identity、`kind=agent`、capabilities、
   required/optional identity、entrypoints、business task 和 typed views。
2. 一方完整 Package bytes 进入 RCA 自己的 GHCR repository，owner 只推进 RCA
   `latest-stable`。Exact ref/digest/checksum/SBOM/attestation 仅保护单次发布完整性。
3. Framework dual-read 新 descriptor 与旧 manifest；旧 lock/payload/currentness/
   lifecycle receipt/rollback 只能读取，不能新增 writer 或 consumer。
4. Base 薄 OCI adapter 只下载/校验 bytes 并交给 Package 声明的 carrier/runtime
   adapter；Codex Plugin Manager 是当前 projection adapter。fresh readback 必须区分
   complete installed 与 Plugin-only。
5. 至少一个 Git/local 中性 route 证明公共 identity 和业务状态不绑定 Codex。当前无需
   并行实现第二个正式 executor 产品。
6. retained consumer 清零、完整功能矩阵通过后，Framework/App/Shell 物理删除旧
   resolver、lock、payload、LKG、lifecycle receipt、materialization 与 rollback
   mirrors。

功能不降级门：RCA 可安装、独立静默更新、卸载后不被 maintenance 回装；Home
preference、Work Item、Temporal execution refs 与 typed views 在 carrier/executor
切换后保留；Codex 当前正式路径仍能完整调用 native helpers、StageRun 和全部 RCA
领域能力。任何一项不成立都不得删除旧兼容读路径。

## Test / Evidence Boundary

- `private-platform` guard、source-closure、repo tests、typecheck 与 OPL conformance 只能证明各自结构/实现边界。
- doctor clean、Markdown 完整、contract validation、generated projection 或 provider
  completion 都不能单独关闭 Package published/current、complete installed/callable、
  visual、quality/export、owner、release、domain 或 production readiness。
- Live evidence 后置，不阻塞已能由 repo source/contracts 独立证明的结构治理；一旦涉及 ready claim、artifact mutation、quality/export verdict 或 owner receipt，必须回到对应 owner surface。

## Next-Round Agent Prompt

目标：在不恢复 RCA repo-local 控制面、不中转 visual truth 给 OPL 的前提下，收集 post-standardization 的 fresh OPL-hosted RCA live evidence。

- 写入范围：RCA owner 授权的 live evidence contract、当前状态 owner 文档和 evidence/history foldback；OPL package/runtime 面只能走对应 owner lane。
- 非目标：不新增 RCA installer、Package Manager、CLI/runtime/session/workspace/
  status/workbench、executor adapter、旧入口别名或 fallback；不由
  docs/conformance/tests 签发 Package current、visual、quality/export、owner、
  release、domain 或 production ready claim。
- 当前事实输入：RCA checkout、`contracts/opl_agent_package_manifest.json`、
  `contracts/generated_surface_handoff.json`、
  `contracts/live_stage_run_progress_evidence.json`、complete Package carrier readback、
  executor route readback、真实 StageRun/Attempt/artifact/receipt refs。
- 验证命令：`opl packages status --package-id rca --json`、`opl agents conformance --family-defaults --json`、`opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>`，以及 RCA repo-native source guard。

1. 读取 RCA `AGENTS.md`、本文件、`contracts/opl_agent_package_manifest.json`、
   `contracts/generated_surface_handoff.json` 与
   `contracts/live_stage_run_progress_evidence.json`，区分 owner descriptor、旧
   compatibility fields、carrier installed state、executor route 和领域 evidence。
2. 读取 Framework/实际 carrier 的 fresh RCA installed/callable 状态；迁移期可同时读取
   `opl packages status --package-id rca --json`，但旧 payload/version/lock 只作
   compatibility diagnostic。缺完整 bytes 或 callable entrypoint 时路由给 carrier /
   Framework owner，不在 RCA 新建 installer、alias 或 fallback。
3. 运行 `opl agents conformance --family-defaults --json`，只把结果表述为 structural projection/conformance evidence。
4. 在真实 workspace 运行 `opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>`，保留 StageRun/Attempt、input hashes、artifact refs、review/export refs、typed blocker/human gate 与 owner receipt lineage。
5. 只有 RCA owner surface 实际产生可验证 receipt 时，才更新 live evidence contract 与当前状态；失败、缺凭据、wrong-target/currentness 或 owner gate 必须原样记录 typed blocker，不能改写成 ready。
6. 用 fresh readback 确认没有 repo-local CLI/runtime/session/workspace/status/workbench 复活；将过程记录放入 evidence/history，Active Truth 只保留当前事实、剩余 gap 与下一合法入口。

- 完成门槛：有完整 Package installed/callable carrier readback 和明确 executor route；
  有真实 hosted StageRun artifact lineage 或明确 typed blocker；所有
  visual/review/export/owner/ready claim 都有 RCA owner receipt；没有第二控制面或
  fallback。若声称 RCA 发布 current，还必须有 owner GHCR `latest-stable` 匿名
  exact-digest readback。
- 折回目标：当前事实进入 `docs/status.md` 与相应 contracts；可复查 evidence 进入 evidence owner surface；过程 provenance 进入 `docs/history/`；本文件只保留剩余 gap 和下一合法入口。

## History / Tombstone Foldback

- 旧 private-platform、product-entry、session continuity 与 hosted bridge 的过程 provenance 只从 `docs/history/` 和 Git history 读取。
- 本文件不积累逐轮 SHA、测试计数、worktree 清单或完成百分比；完成的结构事实折回 `docs/status.md` 与 contracts，过程 evidence 进入 history/evidence owner surface。
