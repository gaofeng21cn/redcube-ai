# ppt_deck storyline

从讲者身份、听众画像、讲课目标与事实资产出发，产出故事主线。
要求：
- 先界定 speaker / audience / goal / style
- `source_materials_full_text` 是完整资料输入，必须通读后再确定故事主线；不得只依据标题、开头片段、source_fact_summary 或页数预算做抽象概括
- 如果任务是待投稿/成文论文同步，故事主线必须围绕每篇论文的研究问题、主要结论和数字证据组织；不得改写成临床应用推广、科室价值宣传或管理行动建议
- 若上下文提供具名讲者署名，speaker 必须保留 exact identity，不得泛化成“同行讲者 / 正式讲者”
- 产出 hook / journey / resolution 三段叙事弧
- 关键转折必须由事实资产支撑，不做口号堆砌
- 明确哪些判断必须在后续详细大纲与证据页展开

## runtime_seed
```json
{
  "storyline": {
    "core_metaphor": "把 {{title}} 讲成一条能复述的判断链：{{source_claim_1}}",
    "hook": [
      "为什么现在要讲：{{promise}}"
    ],
    "journey": [
      "先界定主题问题与核心概念",
      "再拆关键机制、判断边界与常见误区",
      "最后把公开证据与课堂动作收束成带走点"
    ],
    "resolution": [
      "听众带走一条围绕 {{title}} 的可复述主线"
    ]
  }
}
```

## runtime_artifact
```json
{
  "storyline": {
    "speaker": "{{speaker}}",
    "audience": "{{audience}}",
    "style": "先界定核心概念，再拆关键机制与判断边界，最后用公开证据收束成课堂动作",
    "core_metaphor": "把 {{title}} 讲成一条能复述的判断链：{{source_claim_1}}",
    "hook": [
      "为什么现在要讲：{{promise}}"
    ],
    "journey": [
      "先界定主题问题与核心概念",
      "再拆关键机制、判断边界与常见误区",
      "最后把公开证据与课堂动作收束成带走点"
    ],
    "resolution": [
      "听众带走一条围绕 {{title}} 的可复述主线"
    ]
  }
}
```
