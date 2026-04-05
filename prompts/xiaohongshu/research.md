# xiaohongshu / research

从输入素材整理事实资产、公开来源口径与模式判定。
要求：
- 只允许使用本任务输入与白名单来源
- 明确 `series/single` 判定
- 输出 reference_source_list 与 forbidden_source_hit_count

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
