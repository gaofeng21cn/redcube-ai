# xiaohongshu / publish_copy

发布文案是正式 artifact。
要求：
- 标题 3 选 1
- 正文主稿、互动问题、标签、发布时间建议
- 做 platform copy gate：platform_copy_complete / cta_clear
- 文案主表达必须由 host-agent / director-first surface 持有，代码只负责 gate 与 persistence
- 如果 `context.author_branding` 存在，正文语气要与作者档案一致，交付包中的署名字段必须沿用同一套作者信息
- `body` 是最终准备发布到小红书正文区的成稿，只写给读者看的内容，不要输出“标题备选”“推荐标题”“首评”“标签”“发布时间”“作者档案”等制作标签
- `body` 目标长度严格控制在 80-420 个中文字符之间；宁可更短、更利落，也不要把整套图文逐页复述一遍
- `body` 只保留 1 条主判断、2-4 个关键信息点和 1 个轻量收束句；不要写成长文章、不要逐条展开整套方法论
- 不要把 `context.title_options` 原样抄进 `body`，标题候选只用于内部选题参考
- 正文可以自然带出作者语气与品牌署名，但不要把完整署名长串再重复塞进正文结尾；署名字段已有独立持久化位
- 互动问题和首评引导要像真实发布文案，不要写成后台操作说明或提词器

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
