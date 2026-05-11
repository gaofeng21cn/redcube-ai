# Phase 2 PPT Native Authoring Production-Selectable Lane

生命周期说明：本文是已吸收的 selectable proof lane brief，仍服务当前 `ppt_deck` native editable PPTX 可选路线。当前默认 PPT 视觉路线是 image-first；native PPTX 只在用户显式要求可编辑或 DrawingML 路线时启用。

## 定位

这条线现在定义 `ppt_deck` 的 native PPTX authoring / repair 作为生产可选路线。当前默认视觉路线已经是 image-first；native PPTX 只在用户明确要求可编辑、原生 PPTX 或 DrawingML 时启用。

它不改变 RCA 做 PPT 的上游流程：`storyline`、`detailed_outline`、`slide_blueprint`、`visual_direction` 继续作为 RedCube 的结构和视觉导演真相面。

## 边界

当前默认主线为：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`

native PPT production-selectable lane 的目标是在调用方显式选择时，用直接可编辑 PPTX 产物替换当前 image-first 整页图生成和定点重绘两段。历史 HTML 路线仍作为显式二线保留：

- `author_image_pages` 的可编辑替代：`author_pptx_native`
- `repair_image_pages` 的可编辑替代：`repair_pptx_native`
- 历史 HTML 二线：`render_html / fix_html`

`visual_director_review`、`screenshot_review`、`export_pptx` 继续保留为硬闸门。审查依据应从 HTML 截图扩展为“最终 PPTX 渲染截图”，而不是绕过截图级可见结果判断。

## 合同面

机器可读合同：

- `contracts/runtime-program/ppt-native-authoring-proof-lane.json`
- `contracts/runtime-program/ppt-native-python-engine-contract.json`
- `contracts/runtime-program/python-native-helper-catalog.json`

hydrated `ppt_deck` contract 现在暴露：

- `prompt_pack.render_contract.default_visual_route = "author_image_pages"`
- `prompt_pack.render_contract.native_ppt_proof_lane.status = "production_selectable_optional"`
- `prompt_pack.render_contract.native_ppt_proof_lane.default_enabled = false`
- `prompt_pack.render_contract.native_ppt_proof_lane.engine_capabilities.authoring_ir = "redcube_svg_ir"`
- `prompt_pack.render_contract.native_ppt_proof_lane.engine_capabilities.pptx_writer = "redcube_drawingml_writer"`
- `prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.required = true`
- `prompt_pack.render_contract.native_ppt_proof_lane.replaces_routes = ["author_image_pages", "repair_image_pages"]`
- `prompt_pack.render_contract.native_ppt_proof_lane.legacy_html_replaces_routes = ["render_html", "fix_html"]`
- `prompt_pack.render_contract.native_ppt_proof_lane.preserved_gates = ["visual_director_review", "screenshot_review", "export_pptx"]`

product-entry manifest 同步投影同一 selectable lane，但不把它加入默认 protected stage sequence。

当前 runtime proof 已落地并提升为生产可选：

- hydrated contract 通过 `stage_sequence.alternate_stages` 暴露 `author_pptx_native` / `repair_pptx_native`，默认 `stage_sequence.stages` 不变
- `runDeliverableRoute` 可直接执行 `author_pptx_native`，产出 editable `.pptx`、shape manifest、true PPTX render screenshots 与 preview PDF
- `visual_director_review` / `screenshot_review` 会在最新 visual artifact 为 native PPTX 时读取 native preview/shape manifest，而不是要求 HTML
- `export_pptx` 在 native 路线通过审查后复制 editable source PPTX，并在 export bundle 记录 `source_pptx`、`native_ppt_shape_manifest`、`native_ppt_repair_log`、source/final hashes、renderer proof、shape manifest summary、`native_export_bundle_operator_proof_summary_v1` 与 `native_export_operator_artifact_gallery_v1`
- `repair_pptx_native` 消费 `screenshot_review.slide_reviews` 的阻断页反馈，并把 per-slide before/after hash、preserved slide hash、targeted repair reason、repair unit input/output 写入 `native_ppt_repair_evidence_v1`
- native PPT engine contract 固定为 `contracts/runtime-program/ppt-native-python-engine-contract.json`；Python helper 读取该合同并输出，JS runtime 只做 route/gate 编排与合同校验
- native helper catalog 固定为 `contracts/runtime-program/python-native-helper-catalog.json`；该 catalog 只登记 Python-owned helper，不能替代 RedCube product-entry 或 review/export gate
- Python engine 是 RedCube-owned clean-room 实现：生成 `redcube_svg_ir`，执行 strict SVG preflight，再用 RedCube DrawingML writer 产出 editable PPTX
- native route 当前要求 LibreOffice headless -> PDF -> Poppler PNG true render proof；旧桌面应用/AppleScript 证明面已退役，缺少真实渲染截图或出现 synthetic preview 时 fail closed
- visual benchmark 已扩展为 `ppt_native_visual_benchmark_v2`：4 套 fixture（business review、academic lecture、data charts、Chinese long text），每套 6 页，覆盖 layout diversity、shape richness、字段不泄漏、PNG 非空、边距/重叠/density、editable chart/table/metric-grid 与“不把 PNG 打进 PPTX”的回归风险
- product-entry manifest/status/session surface 暴露 `native_ppt_operator_ux`、依赖诊断、proof runner 命令和 native proof artifact inventory；`redcube native-ppt proof` 是受控 helper command，不是第二公开 skill
- repo-owned proof runner 输出 `artifact-index.json`，CI native proof lane 由 `workflow_dispatch`、nightly schedule 和带 `native-ppt-proof` label 的 PR 触发；默认 push/PR quality lane 继续不跑真实 renderer

## 生产可选门槛

native PPT lane 只有同时满足以下条件，才允许作为生产可选路线执行；profile-level 默认化仍需后续单独评估：

- 同一 topic/profile 可在 HTML 主线和 native PPT proof lane 之间做对照，不产生 `topic_id`、`deliverable_id`、`run_id` 语义漂移
- 输出是真正可编辑 PPTX，不是把截图再封装进 PPTX
- `screenshot_review` 读取的是最终 PPTX 渲染截图
- `repair_pptx_native` 能消费 review feedback，并尽量只返修被阻断页面
- `getReviewState` 与 `getPublicationProjection` 继续作为权威读面
- product-entry 与 managed route gate 继续 fail closed

## 当前生产化 V2 closeout

- `planned`：CI/proof infra V2；4-suite visual benchmark；editable chart/table/metric-grid writer；repair/export evidence tightening；product-entry operator UX；docs/contracts closeout；所有 lane 吸收回 `main` 后清理临时 worktree/branch。
- `done`：`native-ppt-proof` CI job 已支持 `workflow_dispatch`、nightly schedule、PR label，并上传 `artifact-index.json`；`tools/native-ppt-proof/run.sh` 使用 V2 `data_charts` suite 生成 editable PPTX/PDF/PNG/shape manifest/proof summary/artifact index；visual benchmark 已扩展为 4 套 24 页并包含 native-vs-HTML quality comparison report；native writer 已支持可编辑 chart/table/metric-grid，shape manifest 记录对应 bounds、fit、overflow 与 coordinate determinism hash；`screenshot_review` 对 chart/table 关键 metrics 缺失 fail closed；`repair_pptx_native` 记录 `native_ppt_repair_evidence_v1`；export bundle 增加 `native_export_operator_artifact_gallery_v1`；product-entry manifest/status/session 暴露 native route 可选条件、依赖诊断、proof runner 命令、blocked reason 与 artifact inventory。
- `deferred`：动画、旁白、模板导入、在线图片搜索/生成、SVG editor，均不进入本轮生产可选验收。
- `skipped`：不启用 PowerPoint / AppleScript / `osascript`；不把 native PPT 设为默认 route；不新增第二公开 skill；不把 screenshots 包进 PPTX。
- `verification`：targeted native runtime/layout/live proof、artifact index/CI workflow tests、Python helper catalog tests、proof runner、`npm run typecheck`、`./scripts/verify.sh fast`、`npm run test:meta`、`npm run test:integration`、`git diff --check`。
- `commit-push state`：A-E lane 已吸收进 `main`；F closeout 应作为最终 commit 推送，随后删除 V2 临时 worktree/branch，并确认 `git worktree list` 只剩 root。

## 非目标

- 不新增第二个公开 skill
- 不新增第二套 product-entry 语义
- 不绕过 source truth、review、runtimeWatch 或 export gate
- 不把 HTML 主线降级为兼容残留
