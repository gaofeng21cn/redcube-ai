# xiaohongshu / publish_copy

发布文案是正式 artifact。
要求：
- 标题 3 选 1
- 正文主稿、互动问题、标签、发布时间建议
- 做 platform copy gate：platform_copy_complete / cta_clear
- 文案主表达必须由 host-agent / director-first surface 持有，代码只负责 gate 与 persistence

## runtime_artifact
```json
{
  "publish_copy": {
    "body": "{{title_choice}}。先别急着收藏更多碎片建议，先把这条判断顺序拿走：先把问题讲成人话，再看公开来源能不能支撑，最后才决定动作怎么落。读完这组图，你至少能把{{title}}里最关键的判断句讲清、做对、再分享。",
    "first_comment": "如果你也在做这类内容，评论区回“清单”，我把整理框架发给你。",
    "interaction_questions": [
      "你现在最容易在哪一步把顺序做反？",
      "你会先整理来源，还是先把判断顺序写下来？"
    ],
    "hashtags": [
      "#甲状腺",
      "#门诊科普",
      "#判断顺序",
      "#知识笔记",
      "#收藏清单"
    ],
    "publish_suggestion": {
      "recommended_time": "19:00-21:00"
    }
  }
}
```
