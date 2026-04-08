# xiaohongshu / research

从 shared source truth 生成可供后续消费的 source readiness / fact library artifact。
要求：
- 只允许使用本任务输入与白名单来源
- 明确 `series/single` 判定
- 不输出 storyline judgement
- 输出 `topic_summary`、`fact_library_summary`、`reference_source_list`、`evidence_gaps`
- 输出 `forbidden_source_hit_count`

## runtime_seed
```json
{
  "research": {
    "topic_summary": "{{title}} 面向患者做可信、可发布的小红书图文",
    "reference_source_list": [
      "公开临床指南 / 系统综述 / 正式流程资料",
      "同行评议论文 / 真实世界研究",
      "用户当次指定素材"
    ],
    "forbidden_source_hit_count": 0
  }
}
```
