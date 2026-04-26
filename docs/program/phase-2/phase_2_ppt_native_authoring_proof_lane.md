# Phase 2 PPT Native Authoring Proof Lane

## 定位

这条探索线只评估 `ppt_deck` 的 native PPTX authoring / repair 能力。

它不改变 RCA 做 PPT 的上游流程：`storyline`、`detailed_outline`、`slide_blueprint`、`visual_direction` 继续作为 RedCube 的结构和视觉导演真相面。

## 边界

当前默认主线保持：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> fix_html -> export_pptx`

native PPT proof lane 的探索目标是用直接可编辑 PPTX 产物替换其中涉及 HTML 代码生成和 HTML 定点返修的两段：

- `render_html` 的候选替代：`author_pptx_native`
- `fix_html` 的候选替代：`repair_pptx_native`

`visual_director_review`、`screenshot_review`、`export_pptx` 继续保留为硬闸门。审查依据应从 HTML 截图扩展为“最终 PPTX 渲染截图”，而不是绕过截图级可见结果判断。

## 合同面

机器可读合同：

- `contracts/runtime-program/ppt-native-authoring-proof-lane.json`

hydrated `ppt_deck` contract 现在暴露：

- `prompt_pack.render_contract.default_visual_route = "render_html"`
- `prompt_pack.render_contract.native_ppt_proof_lane.status = "opt_in_proof_lane"`
- `prompt_pack.render_contract.native_ppt_proof_lane.replaces_routes = ["render_html", "fix_html"]`
- `prompt_pack.render_contract.native_ppt_proof_lane.preserved_gates = ["visual_director_review", "screenshot_review", "export_pptx"]`

product-entry manifest 同步投影同一 proof lane，但不把它加入默认 protected stage sequence。

当前 runtime proof 已落地：

- hydrated contract 通过 `stage_sequence.alternate_stages` 暴露 `author_pptx_native` / `repair_pptx_native`，默认 `stage_sequence.stages` 不变
- `runDeliverableRoute` 可直接执行 `author_pptx_native`，产出 editable `.pptx`、shape manifest、preview screenshots 与 preview PDF
- `visual_director_review` / `screenshot_review` 会在最新 visual artifact 为 native PPTX 时读取 native preview/shape manifest，而不是要求 HTML
- `export_pptx` 在 native 路线通过审查后复制 editable source PPTX，并在 export bundle 记录 `source_pptx`、`native_ppt_shape_manifest`、`native_ppt_repair_log`
- `repair_pptx_native` 消费 `screenshot_review.slide_reviews` 的阻断页反馈，并把 target slide ids 写入 repair log
- native PPT engine contract 固定为 `contracts/runtime-program/ppt-native-python-engine-contract.json`；Python helper 读取该合同并输出，JS runtime 只做 route/gate 编排与合同校验
- native helper catalog 固定为 `contracts/runtime-program/python-native-helper-catalog.json`；该 catalog 只登记 Python-owned helper，不能替代 RedCube product-entry 或 review/export gate

## 晋级门槛

native PPT proof lane 只有同时满足以下条件，才允许进入下一阶段实现或 profile-level 默认化评估：

- 同一 topic/profile 可在 HTML 主线和 native PPT proof lane 之间做对照，不产生 `topic_id`、`deliverable_id`、`run_id` 语义漂移
- 输出是真正可编辑 PPTX，不是把截图再封装进 PPTX
- `screenshot_review` 读取的是最终 PPTX 渲染截图
- `repair_pptx_native` 能消费 review feedback，并尽量只返修被阻断页面
- `getReviewState` 与 `getPublicationProjection` 继续作为权威读面
- product-entry 与 managed route gate 继续 fail closed

## 非目标

- 不新增第二个公开 skill
- 不新增第二套 product-entry 语义
- 不绕过 source truth、review、runtimeWatch 或 export gate
- 不把 HTML 主线降级为兼容残留
