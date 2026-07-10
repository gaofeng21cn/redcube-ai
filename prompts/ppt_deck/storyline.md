# ppt_deck storyline

从讲者身份、听众画像、讲课目标与事实资产出发，产出故事主线。

## AI-first 主线合同

- `source_materials_full_text` 是完整资料输入，必须通读后再确定故事主线；不得只依据标题、开头片段、`source_fact_summary` 或页数预算做抽象概括。
- 如果任务是待投稿/成文论文同步，故事主线必须围绕每篇论文的研究问题、主要结论和数字证据组织；不得改写成临床应用推广、科室价值宣传或管理行动建议。
- 如果 `source_evidence_extraction_contract` 存在，必须先从 `source_materials_full_text` 全文抽取 `manuscript_evidence_table`：每篇论文一行，包含研究问题、终点、方法/模型、关键数字结果、主要结论和边界；这张表是后续 detailed_outline / slide_blueprint 的结构化证据输入。
- `manuscript_evidence_table.key_numeric_results` 必须写出来自全文的具体数字，例如样本量、事件数/比例、AUROC、Brier、校准、风险梯度、Knosp 分布等；不得只写“模型表现更好”“风险分层清楚”等抽象结论。
- 若上下文提供具名讲者署名，`speaker` 必须保留 exact identity，不得泛化成“同行讲者 / 正式讲者”。
- AI 必须自行产出 speaker / audience / style / core_metaphor / hook / journey / resolution；不要复制 prompt 中的字段占位或默认句式。
- 关键转折必须由事实资产支撑，不做口号堆砌。
- 明确哪些判断必须在后续详细大纲与证据页展开。
- 为核心判断保持稳定 claim identity：在 `journey` 中明确判断如何被引入、由哪类证据证明、最终如何收束；后续 stage 不得静默改写其含义。
- 输入充分时一次完成当前 stage，让 runtime 自动进入下一 stage；只有真实 source/scope/approval 边界改变故事结构时才返回人工决策需求。

## runtime_artifact

下列 JSON 只说明字段形状，不提供默认故事线或可复制文案。

```json
{
  "storyline": {
    "speaker": "<exact speaker identity from context>",
    "audience": "<AI-authored audience judgement>",
    "style": "<AI-authored speaking style>",
    "core_metaphor": "<AI-authored organizing metaphor or central narrative>",
    "hook": [
      "<AI-authored opening hook grounded in the full source context>"
    ],
    "journey": [
      "<AI-authored narrative step>",
      "<AI-authored narrative step>",
      "<AI-authored narrative step>"
    ],
    "resolution": [
      "<AI-authored closeout statement grounded in the full source context>"
    ],
    "manuscript_evidence_table": [
      {
        "manuscript_label": "第一篇",
        "research_question": "<question from source_materials_full_text>",
        "primary_endpoint": "<endpoint from source_materials_full_text>",
        "method_or_model": "<method or model from source_materials_full_text>",
        "key_numeric_results": [
          "<numeric result from source_materials_full_text>",
          "<numeric result from source_materials_full_text>"
        ],
        "main_conclusion": "<source-backed conclusion>",
        "boundary": "<source-backed limitation or wording boundary>"
      }
    ]
  }
}
```
