# xiaohongshu / research

从 shared source truth 生成可供后续消费的 source readiness / fact library artifact。

## AI-first 资料合同

- 只允许使用本任务输入与白名单来源。
- 明确 `series/single` 判定。
- 不输出 storyline judgement。
- 输出 `topic_summary`、`fact_library_summary`、`reference_source_list`、`evidence_gaps`。
- 输出 `forbidden_source_hit_count`。
- `topic_summary` 和 `fact_library_summary` 必须来自完整资料或 source readiness 事实层，不得用 prompt 默认句式替代资料判断。

## runtime_seed

下列 JSON 只说明字段形状，不提供默认 topic summary。

```json
{
  "research": {
    "topic_summary": "<source-backed topic summary>",
    "fact_library_summary": "<source-backed fact library summary>",
    "reference_source_list": [
      "<allowed source label>"
    ],
    "evidence_gaps": [
      "<evidence gap or empty>"
    ],
    "forbidden_source_hit_count": 0
  }
}
```
