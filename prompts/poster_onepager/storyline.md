# poster_onepager / storyline

单页知识海报的故事主线必须先冻结导演判断，再进入 blueprint。

## AI-first 主线合同

- 给出 `headline` / `subheadline` / `audience_judgement` / `why_now` / `proof_promise` / `call_to_action`。
- `headline` 必须能独立成立，不依赖正文补解释。
- 不允许把海报退化成信息堆叠或模板口号。
- 必须基于 `source_materials_full_text` 和任务目标自行判断海报主张、受众、证据承诺与行动句；不得复制本 prompt 的占位结构为成稿。

## runtime_artifact

下列 JSON 只说明字段形状，不提供默认 headline、默认受众或默认行动句。

```json
{
  "storyline": {
    "headline": "<AI-authored poster headline>",
    "subheadline": "<AI-authored poster subheadline>",
    "audience_judgement": "<AI-authored audience judgement>",
    "why_now": "<AI-authored why-now judgement>",
    "proof_promise": "<AI-authored proof promise grounded in source_materials_full_text>",
    "call_to_action": "<AI-authored call to action>"
  }
}
```
