# RedCube PPT Image-First Production Route

Owner: `RedCube AI`
Purpose: `image_first_ppt_route_support`
State: `active_support`
Machine boundary: 人读 route support。机器真相继续归 runtime-family source、contracts、proof runner config、workspace artifacts、artifact manifests、review/export receipts 和 canonical artifacts。

## Status

`ppt_deck` 的默认视觉生产路线是 image-first：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`

HTML 与 native editable PPTX 继续保留为显式二线路线。用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。

## Contract

- `author_image_pages` 通过 Responses `/responses` + `image_generation` 生成完整 16:9 PNG 页面。
- 默认 image model 是 `gpt-image-2`；如果 provider 实际通过 reasoning model 调用 image tool，artifact 记录实际 `request_model` 与 image tool provenance。
- token 不进入 artifact；provenance 只记录 provider、base URL host、endpoint、model、tool options、response id、image call id、revised prompt、prompt hash、style hash、cache key、cache hit/miss、source image hash、generation cost proxy、image hash 与生成时间。
- 默认风格 profile 位于 `prompts/ppt_deck/image-first-default-style-profile.json`；用户给 `style_reference_dir` 时优先使用用户参考目录，并复制参考图到 deliverable artifact store。
- `author_image_pages` 默认复用相同 slide blueprint / visual direction / prompt / style reference / model options cache key 的 PNG 与 provenance；用户显式重绘或 repair target 才重新调用 image generation。
- `screenshot_review` 对 image-first PNG 执行 16:9、非空、重复 hash、低信息密度、边缘裁切、标题区域裁切、碎片化、字段泄漏与可选 OCR sidecar 检查；缺 PNG、缺关键 manifest 或 hard-block 视觉 QA 时 fail-closed。
- `repair_image_pages` 只重绘 `screenshot_review.blocked_slide_ids` 指向的页面，repair prompt 要求保留原页构图、配色和叙事节奏，仅修 blocked reason；未阻断页复用并记录 preserved hashes，缺 prior PNG 时 fail-closed。
- `export_pptx` 输出整页图 PPTX/PDF，并明确 `editable=false`，不声称可编辑 shapes。
- `rca_efficiency_handoff_projection` 只把 image-first route 的 `cache_status`、`elapsed_ms`、`render_execution`、`reused_slide_ids`、`cost_summary`、`screenshot_review` gate 和 export result refs 投给 OPL Agent Lab 标准 suite input。该投影服务效率观察和编排比较，不改变 `screenshot_review` / review-export / artifact authority 的质量门，也不声明 visual ready、exportable 或 handoffable。

## Long-Deck Production Contract

完整长 deck 生产吸收“肠癌AI”65 页 GPT-Image-2 工作台经验，但不把该长样本放进默认回归。长 deck 触发条件是 `expected_slide_count > proof_runner.max_default_slide_count`，或 operator 显式标记 `long_deck`。

- 每页命名采用 `slideNN-short-name.png`；expected slide count 来自 `slide_blueprint.expected_slide_count` 或 `slide_blueprint.slides.length`。
- 产物面至少包括 prompts、raw PNG、1920x1080 normalized PNG、style refs、fact verification ledger、visual QC ledger、contact sheet、PPTX。
- 完整性 gate 检查 expected count、连续 `slideNN`、全部 16:9 PNG、PPTX 每页一张满版图、PPTX media count 与 slide count 一致、全 deck contact sheet 或 manifest 可供人工浏览。
- image-first 与 HTML/native 可以共享 source truth 和 storyline，但允许从 detailed outline / slide blueprint / visual direction 起分叉；image route 不是 HTML skin，HTML 默认不消费 image route PNG。
- 被判错的 PIL/Canvas/HTML 页面修补路线只能作为 rejected provenance 保留；生产 repair 通过 `repair_image_pages` 重绘 blocked pages。后处理只允许确定性叠加真实资产，不承担构图、事实或文本修补。

## Fact And Verified Asset Contract

- 可见事实必须来自 shared source truth 白名单、已批准的 slide blueprint，或 operator 明确提供的 verified asset。
- 无法定位来源的具体事实不得进入图片正文；应改成概括表达，或阻断到 source/blueprint 修复。
- 不让 image model 生成二维码、下载链接、DOI、logo、未经核实医院名、患者人口学属性、论文状态、页码、slide number 或章节角标。
- 真实二维码、下载入口、真实 UI、论文截图、logo 等走 deterministic verified asset overlay manifest；可机器核验的资产必须记录核验结果。

## Proof

本地/CI proof runner：

```bash
tools/image-ppt-proof/run.sh --output-dir artifacts/image-ppt-proof --mock-image-generation
redcube image-ppt proof --output-dir artifacts/image-ppt-proof --mock-image-generation
```

默认 mock 模式使用 6 页以内 lightweight fixture，不读取完整“肠癌AI”长 PPT，也不调用真实 API。live 模式必须显式传：

```bash
tools/image-ppt-proof/run.sh --live-image-generation --output-dir artifacts/image-ppt-proof-live
```

live 模式需要 `REDCUBE_CODEX_RESPONSES_IMAGE_GENERATION_CMD` 或 `OPENAI_API_KEY`。CI `image-ppt-proof` job 只在 `workflow_dispatch`、nightly schedule 或 PR label `image-ppt-proof` 触发；默认质量 lane 不跑真实 image generation。

## Lifecycle Note

本文只承担当前 image-first PPT route support，不维护 closeout ledger 或 rollout receipt。旧 planned/done/deferred/skipped/verification 过程以 `contracts/runtime-program/ppt-image-first-production-route.json`、`tools/image-ppt-proof/ci-contract.json`、相关测试和 history/provenance 为准。

当前仍有效的读法：

- `ppt_deck` 默认 image-first full-slide authoring。
- HTML / native editable PPTX 是显式可选 route，不是 fallback chain。
- 真实 production visual-stage long soak、artifact-producing owner receipt 和 final visual ready/exportable/handoffable verdict 仍回到 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md) 与 RCA-owned review/export gates。
