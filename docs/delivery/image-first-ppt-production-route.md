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

- `author_image_pages` 优先通过 Codex 系统 `imagegen` skill 与实际注入的 `image_gen.imagegen` / `image_gen__imagegen` tool 生成完整 16:9 PNG 页面；skill 已安装不等于当前 hosted executor 已注入 tool。
- 内置 tool 不依赖 `OPENAI_API_KEY`。若 tool 不存在或在零图片产出前不可用，已选择的 RCA image-first route 通过 `agent/tools/generate-image.mjs` 导入 `opl-framework/domain-task-runtime` 的 `runDomainImageGeneration` 调用 Framework 公共模型入口（ESM 导入不可用时回退到 `opl image generate --json`），由 Framework 管理模型连接、凭证解析与生成/编辑调用，不再向用户确认、解析宿主配置或另起独立图片客户端。RCA 不持有或持久化 provider token。
- artifact-producing 主链路证据必须通过安装后的 OPL-generated `invoke_product_entry` 或 `run_image_ppt_proof` action 进入 hosted StageRun；Agent Lab/OPL Meta Agent 的 refs-only evaluation 或 handoff 不能替代真实 artifact、review/export 与 owner evidence。
- token 不进入 artifact；provenance 只记录实际执行 route（Codex built-in tool 或 config-backed `gpt-image-2` API）、executor run/session id、tool options、image call id、revised prompt、prompt hash、style hash、cache key、cache hit/miss、source image hash、generation cost proxy、image hash 与生成时间。
- 可选笔记马克笔示例 profile 位于 `prompts/ppt_deck/image-first-default-style-profile.json`；用户给 `style_reference_dir` 时优先使用用户参考目录，并复制参考图到 deliverable artifact store。
- `author_image_pages` 默认复用相同 slide blueprint / visual direction / prompt / style reference / model options cache key 的 PNG 与 provenance；用户显式重绘或 repair target 才重新调用 image generation。
- `screenshot_review` 对 image-first PNG 执行 16:9、非空、重复 hash、低信息密度、边缘裁切、标题区域裁切、碎片化、字段泄漏与可选 OCR 检查；有任意可读页面时，缺页、manifest 或视觉 QA finding 都记录质量债并继续到下一 stage，只关闭 visual/export-ready 声明。
- `repair_image_pages` 在预算内只重绘需要修复的页面并复用其余 hashes；缺 prior PNG 时回到完整 image authoring route，预算耗尽后携带现有最佳页面继续推进。零可读页面、文件损坏或图片生成失败都物化 failure/no-output diagnostic 并继续；只有 built-in 与 config-backed API 两条 executor 路线均不可用、权限/安全/authority、identity/currentness、不可逆动作或明确 human gate 才硬停。
- `export_pptx` 输出整页图 PPTX/PDF，并明确 `editable=false`，不声称可编辑 shapes。
- `rca_efficiency_handoff_projection` 只把 image-first route 的 `cache_status`、`elapsed_ms`、`render_execution`、`reused_slide_ids`、`cost_summary`、`screenshot_review` gate 和 export result refs 投给 OPL Agent Lab 标准 suite input。该投影服务效率观察和编排比较，不改变 `screenshot_review` / review-export / artifact authority 的质量门，也不声明 visual ready、exportable 或 handoffable。
- 允许的效率优化证据只限 refs-only：source pack reuse、prompt/static-prefix cache、page-local parallel 或 batch sizing telemetry、blocked-page-only repair、export preview cache。`repair_image_pages` 仍只能重绘 blocked slide ids，未阻断页必须通过 reused slide refs / preserved hashes 证明复用；export preview cache 只能作为导出预览命中证据，不能替代最终 `export_pptx` gate。
- `ppt_image_first_quality_nonregression_v1` 把同一套 refs-only handoff 扩展到质量路线层：Agent Lab 可以读取 fact governance、verified asset、audience language、layout legibility、blocked-page-only repair、review/export gate 与 runtime read-model refs 来比较优化候选，但 suite score 不是 RCA visual verdict，不能替代 `visual_director_review`、`screenshot_review` 或 `export_pptx`。
- `author_image_pages` / `repair_image_pages` 的运行产物暴露 `quality_non_regression_read_model`，只记录 contract refs、gate refs、repair scope、full-slide non-editable export policy 和 forbidden authority flags；不写 visual truth、artifact blob、memory body、quality/export verdict 或 owner receipt。

## Long-Deck Production Contract

完整长 deck 与默认轻量 developer fixture 分别验证。长 deck 触发条件是 `expected_slide_count > proof_runner.max_default_slide_count`，或 operator 显式标记 `long_deck`。

- 每页命名采用 `slideNN-short-name.png`；expected slide count 来自 `slide_blueprint.expected_slide_count` 或 `slide_blueprint.slides.length`。
- 产物面至少包括 prompts、raw PNG、1920x1080 normalized PNG、style refs、fact verification ledger、visual QC ledger、contact sheet、PPTX。
- 完整性 gate 检查 expected count、连续 `slideNN`、全部 16:9 PNG、PPTX 每页包含声明的满版底图及核验资产层、按实际 relationships 核对页序/原始媒体/几何/裁剪/备注（允许媒体去重）、全 deck contact sheet 或 manifest 可供人工浏览。
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

Developer proof 使用 6 页以内 lightweight fixture，也不调用 Codex executor 或真实图片 API。真实 image generation 由 OPL-hosted `run_image_ppt_proof` StageRun action 按双路线合同执行；`agent/tools/generate-image.mjs` 走的 Framework 公共模型入口是同一 hosted Attempt 的受限 fallback，不是 RCA 私有 executor。CI `image-ppt-proof` job 只验证 developer proof 产物合同，不形成真实图片生成或 domain-ready 证据。

## 评测与首轮工作流约束

- **知识与风格分工**：先确立讲课页的物体、关系编码、文字预算与事实白名单，再注入风格配方；可复用方法分别保存在 `agent/knowledge/ppt_source_adaptation.md`、`ppt_style_calibration.md`、`ppt_production_reuse.md` 与 `prompts/ppt_deck/style_profiles.json`，现行用户要求与认可导演稿决定画法与语言。
- **行为评测边界**：标准评测套件消费 `agent/professional_skills/rca-ppt-reviewer/resources/workbench-evaluation.json` 与授权真实图像；初稿尝试必须与回修及正式 repair 分开，采用同输入盲序并保留 RCA 像素审阅引用。占位哈希或结构回放不能证明初稿质量。
- **首轮与真实资产约束**：参考图是可选、按路线决定的输入；真实医学影像等核验资产必须预留位置、声明来源/裁剪并作为可检查层保留，不得用模型生成替代图。局部修订后须复核整套页面的字体/配色漂移并分别报告全部尝试与耗时。
- **整页生成 H3 边界**：若用户要求整页带文字一次生成路径，整批冻结同一共享风格前缀与一致的尺寸/路线参数并全页联审；出现漂移时回到共享前缀或页族规则重生成，不启用隐蔽贴图补丁，且因缺少稳定 seed 须将过程一致性与像素可复现性分开报告。

## 验证边界

本文只解释当前路线。机器字段由 `contracts/runtime-program/ppt-image-first-production-route.json` 与 `tools/image-ppt-proof/ci-contract.json` 持有；过程记录使用 Git 追溯。真实 artifact-producing owner receipt、review/export acceptance 与 long-soak 的验收要求见 [未完成验收](../active/rca-ideal-state-gap-plan.md)。

整页图生产导出与 `ppt_review_evidence` 审阅证据清单见[整页图导出与审阅证据](image-deck-export.md)，developer proof 也调用真实 exporter；mock 只替代图片生成，视觉未审与候选交付分别记录。
