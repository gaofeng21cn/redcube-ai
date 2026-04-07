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
      "{{title}}为什么很多人总抓不住重点",
      "{{title}}先别急着记一堆概念",
      "{{title}}这4步更重要"
    ],
    "slides": [
      {
        "slide_id": "N01",
        "title": "先把问题说人话",
        "layout_family": "cover_note",
        "render_recipe_id": "xhs.hero_note",
        "page_goal": "建立封面钩子",
        "progression_role": "hook",
        "page_core_content": [
          "{{source_claim_1}}",
          "这篇真正要帮你判断的是：{{title}} 里最容易混淆的重点是什么",
          "记忆钩子：{{memory_hook}}"
        ],
        "visual_presentation": {
          "layout_family": "cover_note",
          "main_visual_action": "大标题钩子 + 批注式记忆句",
          "action_primitive": "hero note + highlight ribbon",
          "anchor_tracks": [
            "cover-hook",
            "memory-ribbon",
            "benefit-chip"
          ],
          "anti_template_note": "封面必须是一页抓人，不是普通三卡封面"
        },
        "source_language": "封面不直接甩术语，用读者能立即理解的问题句开场",
        "speaker_notes": "这页先用一句人话把冲突钉住：{{tension}}。再明确读者收益：{{audience_judgement}}。",
        "transition": "先被一句话拉停，再进入为什么很多人会抓错重点"
      },
      {
        "slide_id": "N02",
        "title": "为什么很多人一开始就抓错重点",
        "layout_family": "myth_compare",
        "render_recipe_id": "xhs.split_contrast",
        "page_goal": "先拆误区",
        "progression_role": "tension",
        "page_core_content": [
          "很多人一上来就先背术语、先看碎片经验、先照抄别人的做法",
          "真正该先看的，是这件事的判断顺序有没有被讲清",
          "为什么现在更容易做反：{{why_now}}"
        ],
        "visual_presentation": {
          "layout_family": "myth_compare",
          "main_visual_action": "错误做法 vs 正确顺序双区对撞",
          "action_primitive": "asymmetric compare columns",
          "anchor_tracks": [
            "myth-column",
            "divider",
            "correction-column"
          ],
          "anti_template_note": "不能退化成同构卡片列表"
        },
        "source_language": "用公开经验口径讲代价，不用内部流程黑话",
        "speaker_notes": "先拆错误顺序，再把真正该先看的判断路径讲给读者。",
        "transition": "拆完误区，下一页再给真正该先看的顺序"
      },
      {
        "slide_id": "N03",
        "title": "真正该先看的不是更多信息，而是判断顺序",
        "layout_family": "sequence_stack",
        "render_recipe_id": "xhs.staggered_steps",
        "page_goal": "建立判断顺序",
        "progression_role": "explain",
        "page_core_content": [
          "先把问题翻译成人话，再决定接下来该看哪类信息",
          "先看证据和适用边界，再看执行路径和输出形式",
          "最后才谈收藏、模板和延伸动作"
        ],
        "visual_presentation": {
          "layout_family": "sequence_stack",
          "main_visual_action": "阶梯式顺序卡，让读者看到先后关系",
          "action_primitive": "staggered step stack",
          "anchor_tracks": [
            "step-one",
            "step-two",
            "step-three"
          ],
          "anti_template_note": "顺序页必须有明显推进，不可做平铺列表"
        },
        "source_language": "把顺序写成读者能照着做的步骤语言",
        "speaker_notes": "这页不解释工具参数，只解释先后顺序和停顿点。",
        "transition": "顺序讲明白之后，再把关键判断画成轨道"
      },
      {
        "slide_id": "N04",
        "title": "把关键判断画成一眼能懂的轨道",
        "layout_family": "process_track",
        "render_recipe_id": "xhs.track_rail",
        "page_goal": "解释机制",
        "progression_role": "mechanism_peak",
        "page_core_content": [
          "第1步：先判断这是不是当前最值得先解释的重点",
          "第2步：再判断有哪些公开来源能支撑这条判断",
          "第3步：最后把动作压成一条能照着走的顺序"
        ],
        "visual_presentation": {
          "layout_family": "process_track",
          "main_visual_action": "轨道化机制说明",
          "action_primitive": "process track with nodes",
          "anchor_tracks": [
            "track-start",
            "track-middle",
            "track-end"
          ],
          "anti_template_note": "机制页必须显式轨道，不可只写文字卡片"
        },
        "source_language": "机制页用公开来源支撑，不把来源藏进内部注释",
        "speaker_notes": "机制页要让读者一眼看懂先后顺序，不要退回普通卡片墙。",
        "transition": "机制知道了，下一页再解释为什么来源口径会影响可信度"
      },
      {
        "slide_id": "N05",
        "title": "{{title}} 的公开来源要让读者听得懂",
        "layout_family": "evidence_strip",
        "render_recipe_id": "xhs.evidence_bands",
        "page_goal": "建立可信度",
        "progression_role": "evidence_peak",
        "page_core_content": [
          "把来源写成人能看懂的口径：{{source_label_1}}",
          "证据页不是摆引用，而是告诉读者为什么这句结论可信",
          "{{source_claim_2}}"
        ],
        "visual_presentation": {
          "layout_family": "evidence_strip",
          "main_visual_action": "证据条 + 来源标签 + 结论高亮",
          "action_primitive": "source strip with highlight bands",
          "anchor_tracks": [
            "evidence-strip",
            "source-chip-rail",
            "claim-highlight"
          ],
          "anti_template_note": "证据页必须同时给来源与结论，不可只留脚注"
        },
        "source_language": "把指南/综述/公开资料翻译成读者能理解的口径",
        "speaker_notes": "来源与行动建议必须同屏出现，不能只留下脚注。",
        "transition": "最后把整篇压成可以直接照抄的动作清单"
      },
      {
        "slide_id": "N06",
        "title": "最后给一个能直接照抄的动作清单",
        "layout_family": "action_checklist",
        "render_recipe_id": "xhs.checklist_close",
        "page_goal": "给出行动",
        "progression_role": "memory_close",
        "page_core_content": [
          "先记住这句：{{memory_hook}}",
          "离开这一页后，按“先问题、再来源、后动作”的顺序执行",
          "如果只带走一件事，就是：{{memory_hook}}"
        ],
        "visual_presentation": {
          "layout_family": "action_checklist",
          "main_visual_action": "动作清单压缩收尾",
          "action_primitive": "checklist blocks",
          "anchor_tracks": [
            "check-one",
            "check-two",
            "check-three"
          ],
          "anti_template_note": "收尾页要像收藏清单，不是普通总结卡"
        },
        "source_language": "结尾用动作句收束，不再扩展新概念",
        "speaker_notes": "最后不要再加新概念，只把读者要带走的动作压成收藏清单。",
        "transition": "完"
      }
    ]
  }
}
```
