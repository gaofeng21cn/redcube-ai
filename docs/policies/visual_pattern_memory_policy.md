# 视觉模式记忆 Policy

Owner: `RedCube AI`
Purpose: `visual_pattern_memory_policy`
State: `current_policy`
Machine boundary: 人读 visual memory policy。机器真相继续归 `contracts/durable_knowledge_catalog.json`、OPL 统一 catalog / recall receipt、知识正文来源、StageRun artifacts、prompt packs、review artifacts、export bundles、canonical artifact indexes、owner receipts 和 tests。

这份 policy 固定 RCA visual pattern memory 的长期边界：视觉经验可以作为小规模、可追溯的自然语言记忆进入 AI author / reviewer 上下文，但不能变成布局配方引擎、隐藏模板、review/export verdict 或 artifact authority。

默认读法是 advisory-by-default：visual pattern memory 是 AI-readable Markdown / prose-first prompt context。它可以帮助 Codex 注意风格、密度、故事节奏、反复失败模式和修复预期；它不是 visual route scorer、layout controller、export gate、review-pass gate、artifact authority 或 production-readiness gate。

## 记忆形态

正确形态：

- prose-first visual pattern card；
- deliverable family、stage、audience、style、provenance 等最小标签；
- stage-scoped small retrieval；
- 从真实 `visual_director_review`、`screenshot_review`、export closeout 或 owner receipt 中提取可复用经验；
- writeback proposal、accepted/rejected receipt 和 locator projection 与 memory body 分离；
- canonical artifact、route truth、review/export verdict 和 owner receipt authority 继续留在 RCA owner surface。

禁止形态：

- universal layout recipe engine；
- visual route scorer 或 winning-layout generator；
- 代替 AI author artifact 生成正文、页面、视觉方向或 layout 的 hidden template；
- 仅靠 memory score、mechanical scorecard 或 projection 通过 visual acceptance；
- 把全部风格规则和历史失败全局塞回 prompt；
- 由 OPL、Agent Lab、product shell 或 generated wrapper 取得视觉经验的语义 ownership、accept/reject authority、route choice、review/export verdict、artifact mutation authority 或 owner receipt authority。

## 适合写入的内容

适合的 visual pattern memory：

- PPT / xiaohongshu / poster 对特定受众反复有效的 story rhythm；
- 信息密度、页面节奏、手机可读性、contact-sheet review 或系列一致性经验；
- 帮助 Codex 判断 tone、palette、typography、composition 或 route caveat 的风格说明；
- `visual_director_review` / `screenshot_review` 中反复出现的失败模式与 repair expectation；
- 何时优先 image-first、HTML 或 native PPT route 的经验性 caveat。

不适合写入 memory body 的内容：

- 当前 deliverable 的生成正文、slide/page content 或 canonical artifact body；
- 属于 `visual_director_review` 或 `screenshot_review` 的 review verdict；
- exportable、handoffable、publication projection 或 production readiness truth；
- PNG / PPTX / PDF / export bundle 的 canonical artifact state；
- 应归 route code、prompt pack、review gate 或 owner receipt 的确定性逻辑。

## 合同与状态

条目身份、状态、适用范围和审阅期限见 `contracts/durable_knowledge_catalog.json`。旧 descriptor、seed 与私有 locator 已退役。当前实现状态见 [状态](../status.md)，live writeback 与 scaleout 验收见 [未完成验收](../active/rca-ideal-state-gap-plan.md)。本 policy 不另存当前证据清单。

## Stage 使用

Memory 只能小规模进入对应 stage：

- `source_intake`：只取影响视觉范围的 source / audience caveat。
- `communication_strategy`：取 story rhythm、audience framing 与信息层级经验。
- `visual_direction`：取 style、density、composition、route 与 asset-use caveat。
- `review_and_revision`：取 recurring visual failure mode 与 repair expectation。
- `package_and_handoff`：仅透传已有的非权威 proposal 并绑定 terminal export refs，不调用 Curator 或签 accept/reject。

Screenshot-review summary 可以产生一个可复用 proposal 或 `skip`；接受/拒绝是 export 后独立的 RCA memory-owner 动作，需真实 review、terminal export 与 provenance refs。

Memory 可以影响 prompt context 和 reviewer attention；它不能接受视觉结果、批准导出、选择 route、写 artifact body 或修改 canonical artifact。

缺少或陈旧 visual pattern memory 默认不阻断 source intake、communication strategy、visual direction exploration 或 candidate generation。它只在两类场景变成 hard blocker：输出试图用 memory ref 声明 review/export/handoff/production readiness，或 memory-derived action 会越过 artifact authority、owner receipt、source boundary、review/export gate。

## AI-first 边界

本 policy 扩展 [AI-first 质量边界 Policy](./ai_first_quality_boundary.md)。

Visual pattern memory 可以辅助 AI author 和 AI reviewer。它不把 story / visual / markup authorship 从 AI artifact 移到 pack、runtime、schema、audit、projection 或 deterministic code，也不允许这些机械面在缺少 AI-authored review evidence 时声明 final visual quality。

## OPL 边界

OPL 可以索引 memory refs、投影 consumed-memory provenance、承载 closeout writeback receipt refs 和 operator-visible locator projection。

OPL 不能：

- 决定 RCA visual pattern memory 正文的语义正确性；
- 写入 domain truth；
- 选择 RCA visual route；
- accept / reject memory writeback；
- 发出 quality verdict 或 review/export verdict；
- 写 artifact body；
- 授权 artifact authority、visual ready、exportable、handoffable、domain ready 或 production ready。
- 把 visual pattern memory refs 做成 visual route scorer、layout controller、review-pass gate、export gate 或 artifact-ready signal。

## 四层落位与召回

通用视觉方法正文在 agent/knowledge/，随 Agent 包版本管理。团队偏好和跨项目经验进入 workspace shared/memory/；项目受众、风格取舍和决策进入授权项目 memory/；本次交付状态进入项目 state/。后三者各自使用 opl_durable_knowledge_catalog.json。正文是 Markdown，目录只管 metadata。

OPL 在 StageRun 起点按范围、Stage、有效期选择知识，并为各质量角色固定同一份受控正文快照；公开状态只含引用、digest 和消费回执。路径、状态与过期校验归 OPL，RCA 决定经验是否成立、是否接受候选。单项目经验不会自动升级为通用规则。跨项目推广需脱敏、补齐来源和重新审阅；当前交付的事实和质量 verdict 仍留各自事实源。
