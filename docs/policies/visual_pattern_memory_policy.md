# 视觉模式记忆 Policy

Owner: `RedCube AI`
Purpose: `visual_pattern_memory_policy`
State: `current_policy`
Machine boundary: 人读 visual memory policy。机器真相继续归 `contracts/memory_descriptor.json`、OPL-generated memory descriptor projection、domain-memory locator/receipt refs、StageRun artifacts、prompt packs、review artifacts、export bundles、canonical artifact indexes、owner receipts 和 tests。

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
- 由 OPL、Agent Lab、product shell 或 generated wrapper 持有 visual memory body、accept/reject authority、route choice、review/export verdict、artifact mutation authority 或 owner receipt authority。

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

## 当前机器面

当前标准 memory descriptor 是 `contracts/memory_descriptor.json`，其中 `surface_kind=family_domain_memory_ref`、`version=family-domain-memory-ref.v1`、`memory_ref_id=rca_visual_pattern_memory`、`memory_family=visual_pattern_memory`、`owner=redcube_ai`。

当前 adoption status 是 `descriptor_proof_contract_landed_runtime_writeback_pending`：

- descriptor proof contract 已落地；
- memory body migration、domain-owned runtime apply 与 production-scale writeback 不声明完成；
- memory body migration 仍是 `domain_owned_runtime_apply_required`；
- repo 不跟踪 memory body entries；
- OPL apply 不被允许，也不能写 memory body、artifact blob、review/export verdict 或 owner receipt body。

安装后的 OPL-generated surface 消费 `contracts/memory_descriptor.json`，只投影 memory locator、writeback proposal、receipt contract 与 operator receipt refs。RCA 仓不实现 export command、memory transport、receipt inventory 或 writeback runtime，也不跟踪 live receipt instances；production-scale writeback 只能由 fresh hosted StageRun evidence 与 RCA owner receipt 证明。

这些 descriptor refs 只证明 direct skill 与 OPL-hosted path 共享 locator/receipt contract。它们不证明 memory body 已迁入 OPL，不声明 visual memory lifecycle complete，也不关闭 production visual-stage long soak。

## Stage 使用

Memory 只能小规模进入对应 stage：

- `source_intake`：只取影响视觉范围的 source / audience caveat。
- `communication_strategy`：取 story rhythm、audience framing 与信息层级经验。
- `visual_direction`：取 style、density、composition、route 与 asset-use caveat。
- `review_and_revision`：取 recurring visual failure mode 与 repair expectation。
- `package_and_handoff`：取不覆盖 route gate 的 export-process lesson。

Memory 可以影响 prompt context 和 reviewer attention；它不能接受视觉结果、批准导出、选择 route、写 artifact body 或修改 canonical artifact。

缺少或陈旧 visual pattern memory 默认不阻断 source intake、communication strategy、visual direction exploration 或 candidate generation。它只在两类场景变成 hard blocker：输出试图用 memory ref 声明 review/export/handoff/production readiness，或 memory-derived action 会越过 artifact authority、owner receipt、source boundary、review/export gate。

## AI-first 边界

本 policy 扩展 [AI-first 质量边界 Policy](./ai_first_quality_boundary.md)。

Visual pattern memory 可以辅助 AI author 和 AI reviewer。它不把 story / visual / markup authorship 从 AI artifact 移到 pack、runtime、schema、audit、projection 或 deterministic code，也不允许这些机械面在缺少 AI-authored review evidence 时声明 final visual quality。

## OPL 边界

OPL 可以索引 memory refs、投影 consumed-memory provenance、承载 closeout writeback receipt refs 和 operator-visible locator projection。

OPL 不能：

- 持有 RCA visual pattern memory body；
- 写入 domain truth；
- 选择 RCA visual route；
- accept / reject memory writeback；
- 发出 quality verdict 或 review/export verdict；
- 写 artifact body；
- 授权 artifact authority、visual ready、exportable、handoffable、domain ready 或 production ready。
- 把 visual pattern memory refs 做成 visual route scorer、layout controller、review-pass gate、export gate 或 artifact-ready signal。

Family-level governance 读 `/Users/gaofeng/workspace/one-person-lab/docs/references/operating-governance/family-domain-memory-governance.md`。该路径是人读治理参考，不是 RCA 机器接口。

## 当前证据尾项

仍开放的 evidence tail：

- production-like visual pattern memory accepted/rejected receipt scaleout；
- writeback receipt 与 locator projection 的 runtime writeback scaleout claim；
- retention / restore receipt scaleout；
- OPL-hosted controlled visual-stage long-soak 中的 consumed-memory refs 与 RCA-owned receipt refs 循环；
- cross-family no-regression proof，且不迁移 memory body、artifact body、route truth 或 review/export verdict。

这些证据尾项关闭前，`descriptor_proof_contract_landed_runtime_writeback_pending` 和 refs-only receipt visibility 不能写成 visual memory lifecycle complete、production ready、domain ready、visual ready、exportable 或 handoffable。
