# xiaohongshu / single_note_plan

单篇策划是正式 stage。
要求：
- 至少 3 个标题备选
- 每页必须给到 page_goal / page_core_content / visual_presentation / source_language / progression_role / transition
- 不能把视觉导演稿并入附注
- 不能只给粗粒度 outline

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
      {
        "slide_id":"N01",
        "title":"先把问题说人话",
        "layout_family":"cover_note",
        "page_goal":"建立封面钩子",
        "progression_role":"hook",
        "source_language":"封面不直接甩术语，用读者能立即理解的问题句开场",
        "transition":"先被一句话拉停，再进入为什么很多人会做反"
      },
      {
        "slide_id":"N02",
        "title":"为什么很多人第一步就做反",
        "layout_family":"myth_compare",
        "page_goal":"先拆误区",
        "progression_role":"tension",
        "source_language":"用公开经验口径讲代价，不用内部流程黑话",
        "transition":"拆完误区，下一页再给真正该先看的顺序"
      },
      {
        "slide_id":"N03",
        "title":"真正该先看的不是工具，而是判断顺序",
        "layout_family":"sequence_stack",
        "page_goal":"建立判断顺序",
        "progression_role":"explain",
        "source_language":"把顺序写成读者能照着做的步骤语言",
        "transition":"顺序讲明白之后，再把关键机制画成轨道"
      },
      {
        "slide_id":"N04",
        "title":"把关键机制画成一眼能懂的轨道",
        "layout_family":"process_track",
        "page_goal":"解释机制",
        "progression_role":"mechanism_peak",
        "source_language":"机制页用公开来源支撑，不把来源藏进内部注释",
        "transition":"机制知道了，下一页再解释为什么来源口径会影响可信度"
      },
      {
        "slide_id":"N05",
        "title":"公开来源要让读者看得懂",
        "layout_family":"evidence_strip",
        "page_goal":"建立可信度",
        "progression_role":"evidence_peak",
        "source_language":"把指南/综述/公开资料翻译成读者能理解的口径",
        "transition":"最后把整篇压成可以直接照抄的动作清单"
      },
      {
        "slide_id":"N06",
        "title":"最后给一个能直接照抄的动作清单",
        "layout_family":"action_checklist",
        "page_goal":"给出行动",
        "progression_role":"memory_close",
        "source_language":"结尾用动作句收束，不再扩展新概念",
        "transition":"完"
      }
    ]
  }
}
```
