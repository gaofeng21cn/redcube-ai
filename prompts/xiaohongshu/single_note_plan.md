# xiaohongshu / single_note_plan

单篇策划是正式 stage。
要求：
- 至少 3 个标题备选
- 逐页信息图大纲与页面目标
- 不能把视觉导演稿并入附注

## runtime_seed
```json
{
  "plan": {
    "title_options": [
      "{{title}}为什么很多人总做反",
      "{{title}}先别急着上工具",
      "{{title}}这4步更重要"
    ],
    "slides": [
      {"slide_id":"N01","title":"先把问题说人话","layout_family":"cover_note","page_goal":"建立封面钩子"},
      {"slide_id":"N02","title":"为什么很多人第一步就做反","layout_family":"myth_compare","page_goal":"先拆误区"},
      {"slide_id":"N03","title":"真正该先看的不是工具，而是判断顺序","layout_family":"sequence_stack","page_goal":"建立判断顺序"},
      {"slide_id":"N04","title":"把关键机制画成一眼能懂的轨道","layout_family":"process_track","page_goal":"解释机制"},
      {"slide_id":"N05","title":"公开来源要让读者看得懂","layout_family":"evidence_strip","page_goal":"建立可信度"},
      {"slide_id":"N06","title":"最后给一个能直接照抄的动作清单","layout_family":"action_checklist","page_goal":"给出行动"}
    ]
  }
}
```
