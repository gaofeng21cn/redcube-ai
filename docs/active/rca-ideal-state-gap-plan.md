# RCA 理想目标态差距与完善计划

Owner: RedCube AI
Purpose: 维护 RCA 的 single Active Truth：当前结构事实、理想态差距、owner evidence gate 与下一轮可执行入口。
State: active_truth
Machine boundary: 当前状态必须从 repo source/contracts 与 owner readback 派生；本文不持有 package currentness、visual/review/export verdict、owner receipt、release 或 production truth。

## Ideal-State Reference

- Canonical reference：[`docs/references/rca-visual-deliverable-agent-ideal-state.md`](../references/rca-visual-deliverable-agent-ideal-state.md)
- 目标：RCA 只持有 declarative visual pack、domain-specific native helpers 与不可下放的 visual/artifact/review/export/memory/owner authority；OPL 持有 generic package lifecycle、generated interfaces、StageRun/Attempt、session/workspace/status/workbench 和 process/currentness/receipt envelope。

## Active Owner Discovery

| Truth | Owner | Machine surface |
| --- | --- | --- |
| RCA domain/source/visual authority | RedCube AI | `agent/`、RCA contracts、native helpers、authority functions |
| Package install/update/uninstall/currentness | OPL `opl_packages` | `contracts/opl_agent_package_manifest.json` + `opl packages ... --json` |
| Generated interfaces与 hosted lifecycle | One Person Lab | `contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json` + OPL readback |
| Live visual/review/export/owner acceptance | RedCube AI owner lane | real StageRun artifact refs、quality/export receipts、owner receipts |

## Current State Summary

- canonical agent/package id 为 `rca`，repo/package version 为 `0.2.7`；仓内没有第二 package identity。
- `agent/` 是 declarative visual pack source，`contracts/action_catalog.json` 只声明 `invoke_product_entry`、`run_image_ppt_proof`、`run_native_ppt_proof` 三个 OPL-hosted stage actions。
- `contracts/generated_surface_handoff.json` 声明 generated surfaces 归 OPL、repo-local handler targets 为空、结构 cutover 已闭合，并明确 production evidence 未闭合。
- `contracts/functional_privatization_audit.json` 只保留 RCA visual authority decisions 与 Python native helpers；旧 repo-local default/control surfaces 已退役。
- `contracts/live_stage_run_progress_evidence.json` 当前只有 typed blocker `post_standardization_live_stage_evidence_required`，没有 owner、quality/export、long-soak 或 no-regression receipts；它明确不声明 domain ready 或 production ready。

## Current-State vs Ideal-State Gaps

| Boundary | Current fact | Gap / next owner evidence | State |
| --- | --- | --- | --- |
| Repo source morphology | declarative pack + native helpers + minimal authority functions；旧 private control plane 路径不存在 | 保持 no-resurrection guard；只需 repo-native regression | structurally closed |
| Generated/hosted surface handoff | descriptor source 可用、repo-local targets 为空、owner 为 OPL | 由 OPL 对 exact installed/current package 与 generated projection 做 fresh readback | owner evidence open |
| Package lifecycle | manifest 声明 `opl_packages` 为唯一 lifecycle owner | 需要 `opl packages status --package-id rca --json` 的 currentness/readback；RCA 不创建本地 installer | owner evidence open |
| Native-helper envelope | RCA 保留 domain helper implementation，generic envelope 归 OPL | 需要真实 hosted invocation 的 exact helper/artifact/receipt lineage | live evidence open |
| Visual/review/export authority | contracts 保留 RCA authority，OPL 不得代签 | 需要 RCA quality/export receipt 与 owner acceptance；provider completion 不能替代 | owner evidence open |
| Recovery与规模 | repo tests 可证明结构和 helper 行为 | 需要 restart/resume/retry、long-soak 与 repeated cross-family no-regression evidence | production evidence open |

## Test / Evidence Boundary

- `private-platform` guard、source-closure、repo tests、typecheck 与 OPL conformance 只能证明各自结构/实现边界。
- doctor clean、Markdown 完整、contract validation、generated projection 或 provider completion 都不能单独关闭 visual、quality/export、owner、release、domain 或 production readiness。
- Live evidence 后置，不阻塞已能由 repo source/contracts 独立证明的结构治理；一旦涉及 ready claim、artifact mutation、quality/export verdict 或 owner receipt，必须回到对应 owner surface。

## Next-Round Agent Prompt

目标：在不恢复 RCA repo-local 控制面、不中转 visual truth 给 OPL 的前提下，收集 post-standardization 的 fresh OPL-hosted RCA live evidence。

- 写入范围：RCA owner 授权的 live evidence contract、当前状态 owner 文档和 evidence/history foldback；OPL package/runtime 面只能走对应 owner lane。
- 非目标：不新增 RCA installer、CLI/runtime/session/workspace/status/workbench、旧入口别名或 fallback；不由 docs/conformance/tests 签发 visual、quality/export、owner、release、domain 或 production ready claim。
- 当前事实输入：exact RCA checkout、`contracts/opl_agent_package_manifest.json`、`contracts/generated_surface_handoff.json`、`contracts/live_stage_run_progress_evidence.json`、OPL package status、真实 StageRun/Attempt/artifact/receipt refs。
- 验证命令：`opl packages status --package-id rca --json`、`opl agents conformance --family-defaults --json`、`opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>`，以及 RCA repo-native source guard。

1. 读取 RCA `AGENTS.md`、本文件、`contracts/opl_agent_package_manifest.json`、`contracts/generated_surface_handoff.json` 与 `contracts/live_stage_run_progress_evidence.json`，冻结 exact repo/package/currentness identity。
2. 运行 `opl packages status --package-id rca --json`；若 installed payload、version 或 source identity 不 current，路由给 `opl_packages` owner，不在 RCA 新建 installer、alias 或 fallback。
3. 运行 `opl agents conformance --family-defaults --json`，只把结果表述为 structural projection/conformance evidence。
4. 在真实 workspace 运行 `opl agents run --domain redcube_ai --action invoke_product_entry --workspace <workspace>`，保留 StageRun/Attempt、input hashes、artifact refs、review/export refs、typed blocker/human gate 与 owner receipt lineage。
5. 只有 RCA owner surface 实际产生可验证 receipt 时，才更新 live evidence contract 与当前状态；失败、缺凭据、wrong-target/currentness 或 owner gate 必须原样记录 typed blocker，不能改写成 ready。
6. 用 fresh readback 确认没有 repo-local CLI/runtime/session/workspace/status/workbench 复活；将过程记录放入 evidence/history，Active Truth 只保留当前事实、剩余 gap 与下一合法入口。

- 完成门槛：有 exact package/currentness readback；有真实 hosted StageRun artifact lineage 或明确 typed blocker；所有 visual/review/export/owner/ready claim 都有 RCA owner receipt；没有第二控制面或 fallback。
- 折回目标：当前事实进入 `docs/status.md` 与相应 contracts；可复查 evidence 进入 evidence owner surface；过程 provenance 进入 `docs/history/`；本文件只保留剩余 gap 和下一合法入口。

## History / Tombstone Foldback

- 旧 private-platform、product-entry、session continuity 与 hosted bridge 的过程 provenance 只从 `docs/history/` 和 Git history 读取。
- 本文件不积累逐轮 SHA、测试计数、worktree 清单或完成百分比；完成的结构事实折回 `docs/status.md` 与 contracts，过程 evidence 进入 history/evidence owner surface。
