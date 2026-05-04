# RedCube PPT Image-First Production Route

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

## Closeout Ledger

- planned: lightweight real-style proof、PNG/OCR/crop/density/field-leak visual QA、artifact cache、局部 repair fidelity、operator UX、contracts/docs closeout。
- done: `author_image_pages / repair_image_pages` runtime route、Responses image adapter、prompt/style/image manifest、PNG screenshot review hard-blocks、image artifact cache、blocked-slide-only repair、image-first export bundle、artifact gallery、product-entry/operator UX、`redcube image-ppt proof` helper、default route selection tests、proof runner/CI contract。
- deferred: 完整“肠癌AI”长 PPT 常规回归、animation、narration、template import、online image search、SVG editor。
- skipped: 第二公开 skill、PowerPoint/AppleScript proof、synthetic preview fallback、把 image-first PPTX 伪装成 editable shapes。
- verification: see current rollout final verification and `tools/image-ppt-proof/ci-contract.json`.
- commit-push state: tracked by the final implementation commit for the image-first hardening route.
