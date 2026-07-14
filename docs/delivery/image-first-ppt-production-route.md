# RedCube PPT Image-First Production Route

Owner: `RedCube AI`
Purpose: `image_first_ppt_route_support`
State: `active_support`
Machine boundary: 人读 route support。机器真相继续归 declarative pack、OPL-hosted StageRun action、contracts、proof runner config、artifact manifests、review/export receipts 和 canonical artifacts。

## Status

`ppt_deck` 的默认视觉生产路线是 image-first：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`

HTML 与 native editable PPTX 继续保留为显式二线路线。用户明确要求 HTML / CSS / 网页时走 `render_html / fix_html`；用户明确要求可编辑 / 原生 PPTX / DrawingML 时走 `author_pptx_native / repair_pptx_native`。

## Contract

- `author_image_pages` 通过 Codex executor 原生 imagegen / image_generation 任务生成完整 16:9 PNG 页面。
- 具体 image model、Base URL 与凭证由 Codex 执行器和内置 imagegen 能力托管；RCA 不直接读取 provider token，不直接 `fetch /responses`，也不把某个 provider URL 写成长期 route contract。
- artifact-producing 主链路证据必须通过安装后的 OPL-generated `invoke_product_entry` 或 `run_image_ppt_proof` action 进入 hosted StageRun；Agent Lab/OPL Meta Agent 的 refs-only evaluation 或 handoff 不能替代真实 artifact、review/export 与 owner evidence。
- token 不进入 artifact；provenance 只记录 `codex_native_imagegen_skill` task surface、executor run/session id、tool options、image call id、revised prompt、prompt hash、style hash、cache key、cache hit/miss、source image hash、generation cost proxy、image hash 与生成时间。
- 默认风格 profile 位于 `prompts/ppt_deck/image-first-default-style-profile.json`；用户给 `style_reference_dir` 时优先使用用户参考目录，并复制参考图到 deliverable artifact store。
- `author_image_pages` 默认复用相同 slide blueprint / visual direction / prompt / style reference / model options cache key 的 PNG 与 provenance；用户显式重绘或 repair target 才重新调用 image generation。
- `screenshot_review` 对 image-first PNG 执行 16:9、非空、重复 hash、低信息密度、边缘裁切、标题区域裁切、碎片化、字段泄漏与可选 OCR 检查；有任意可读页面时，缺页、manifest 或视觉 QA finding 都记录质量债并继续到下一 stage，只关闭 visual/export-ready 声明。
- `repair_image_pages` 在预算内只重绘需要修复的页面并复用其余 hashes；缺 prior PNG 时回到完整 image authoring route，预算耗尽后携带现有最佳页面继续推进。零可读页面、文件损坏或图片生成失败都物化 failure/no-output diagnostic 并继续；只有 executor unavailable、权限/安全/authority、identity/currentness、不可逆动作或明确 human gate 才硬停。
- `export_pptx` 输出整页图 PPTX/PDF，并明确 `editable=false`，不声称可编辑 shapes。
- `rca_efficiency_handoff_projection` 只把 image-first route 的 `cache_status`、`elapsed_ms`、`render_execution`、`reused_slide_ids`、`cost_summary`、`screenshot_review` gate 和 export result refs 投给 OPL Agent Lab 标准 suite input。该投影服务效率观察和编排比较，不改变 `screenshot_review` / review-export / artifact authority 的质量门，也不声明 visual ready、exportable 或 handoffable。
- 允许的效率优化证据只限 refs-only：source pack reuse、prompt/static-prefix cache、page-local parallel 或 batch sizing telemetry、blocked-page-only repair、export preview cache。`repair_image_pages` 仍只能重绘 blocked slide ids，未阻断页必须通过 reused slide refs / preserved hashes 证明复用；export preview cache 只能作为导出预览命中证据，不能替代最终 `export_pptx` gate。
- `ppt_image_first_quality_nonregression_v1` 把同一套 refs-only handoff 扩展到质量路线层：Agent Lab 可以读取 fact governance、verified asset、audience language、layout legibility、blocked-page-only repair、review/export gate 与 runtime read-model refs 来比较优化候选，但 suite score 不是 RCA visual verdict，不能替代 `visual_director_review`、`screenshot_review` 或 `export_pptx`。
- `author_image_pages` / `repair_image_pages` 的运行产物暴露 `quality_non_regression_read_model`，只记录 contract refs、gate refs、repair scope、full-slide non-editable export policy 和 forbidden authority flags；不写 visual truth、artifact blob、memory body、quality/export verdict 或 owner receipt。

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

标准 Agent 公共路径是 OPL-hosted `run_image_ppt_proof` action。下面的仓内
runner 只用于 developer / CI proof，不是 RCA Agent runtime 或 CLI surface：

```bash
tools/image-ppt-proof/run.sh --output-dir artifacts/image-ppt-proof --mock-image-generation
```

Developer proof 使用 6 页以内 lightweight fixture，不读取完整“肠癌AI”长 PPT，也不调用 Codex executor 或真实图片 API。真实 imagegen 由 OPL-hosted `run_image_ppt_proof` StageRun action 执行；RCA 不维护第二套 executor invocation。CI `image-ppt-proof` job 只验证 developer proof 产物合同，不形成真实图片生成或 domain-ready 证据。

## Lifecycle Note

本文只承担当前 image-first PPT route support，不维护 closeout ledger 或 rollout receipt。旧 planned/done/deferred/skipped/verification 过程以 `contracts/runtime-program/ppt-image-first-production-route.json`、`tools/image-ppt-proof/ci-contract.json`、相关测试和 history/provenance 为准。

当前仍有效的读法：

- `ppt_deck` 默认 image-first full-slide authoring。
- HTML / native editable PPTX 是显式可选 route，不是 fallback chain。
- 真实 production visual-stage long soak、artifact-producing owner receipt 和 final visual ready/exportable/handoffable verdict 仍回到 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md) 与 RCA-owned review/export gates。
