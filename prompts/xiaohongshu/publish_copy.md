# xiaohongshu / publish_copy

发布文案是正式 artifact。

## AI-first 发布文案合同

- 标题 3 选 1。
- 发布标题通常不超过 20 个中文字符，不能靠夸大、恐吓或绝对化承诺制造点击。
- 输出正文主稿、互动问题、标签、发布时间建议。
- 做 platform copy gate：`platform_copy_complete` / `cta_clear`。
- 文案主表达必须由 host-agent / director-first surface 持有，代码只负责 gate 与 persistence。
- 如果 `context.author_branding` 存在，正文语气要与作者档案一致，交付包中的署名字段必须沿用同一套作者信息。
- `body` 是最终准备发布到小红书正文区的成稿，只写给读者看的内容，不要输出“标题备选”“推荐标题”“首评”“标签”“发布时间”“作者档案”等制作标签。
- `body` 默认目标为 220-420 个中文字符；只有极简任务确实能在 80-219 字闭环时才允许更短，不能把整套图文逐页复述一遍。
- `hashtags` 通常选择 5-8 个与内容直接相关的标签，禁止为了数量堆泛词。
- 若当前笔记属于系列，可自然说明本篇位置或下一篇衔接，但不得重复整套系列目录。
- `body` 只保留 1 条主判断、2-4 个关键信息点和 1 个轻量收束句；不要写成长文章、不要逐条展开整套方法论。
- 不要把 `context.title_options` 原样抄进 `body`，标题候选只用于内部选题参考。
- 正文可以自然带出作者语气与品牌署名，但不要把完整署名长串再重复塞进正文结尾；署名字段已有独立持久化位。
- 互动问题和首评引导要像真实发布文案，不要写成后台操作说明或提词器。
- 必须基于当前 `render_html`、`single_note_plan` 与 `source_materials_full_text` 自行写文案，不得复制本 prompt 的占位句式。

## runtime_artifact

下列 JSON 只说明字段形状，不提供默认正文或运营话术。

```json
{
  "publish_copy": {
    "body": "<AI-authored final Xiaohongshu body copy for readers>",
    "first_comment": "<AI-authored first comment or empty if not appropriate>",
    "interaction_questions": [
      "<AI-authored interaction question>",
      "<AI-authored interaction question>"
    ],
    "hashtags": [
      "<AI-authored hashtag>",
      "<AI-authored hashtag>",
      "<AI-authored hashtag>"
    ],
    "publish_suggestion": {
      "recommended_time": "<AI-authored or conservative posting time suggestion>"
    }
  }
}
```
