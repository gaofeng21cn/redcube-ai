# ppt_deck detailed_outline

把故事主线拆成章节与页预算。
要求：
- 每页明确 core_sentence / evidence_points / page_objective
- 不得直接跳到 HTML
- 必须为后续逐页设计保留讲授推进关系与证据落点

## runtime_seed
```json
{
  "chapter_structure": [
    {
      "chapter_id": "C1",
      "title": "问题重构",
      "slide_range": "01-03"
    },
    {
      "chapter_id": "C2",
      "title": "结构与节奏",
      "slide_range": "04-06"
    },
    {
      "chapter_id": "C3",
      "title": "实践收束",
      "slide_range": "07-08"
    }
  ],
  "slides": [
    {
      "slide_id": "S01",
      "slide_no": 1,
      "chapter_id": "C1",
      "page_type": "cover_signal",
      "layout_family": "cover_signal",
      "title": "{{title}}",
      "page_goal": "建立讲课契约",
      "core_sentence": "{{title}} 的重点不是堆概念，而是建立一条可复述的判断链",
      "page_objective": "让听众先知道今天要解决什么，再知道如何判断",
      "evidence_points": [
        "{{goal}}",
        "先问题定义，后证据分层，再执行与复核"
      ],
      "page_core_content": [
        "今天的主题不是‘工具大全’，而是‘如何把 AI 放回正确的科研链条’",
        "先讲为什么现在必须讲，再讲怎么判断，最后讲怎样执行与回修"
      ],
      "visual_anchor_tracks": [
        "left-identity-rail",
        "center-title-stage",
        "right-promise-card"
      ],
      "speaker_notes": "开场先立契约：今天不是堆工具，而是把 AI 放回问题定义、证据约束与执行复核这条成熟链路。",
      "transition_sentence": "既然今天讲的是链路，就先解释为什么这件事现在必须讲清。",
      "render_recipe_id": "ppt.hero_signal"
    },
    {
      "slide_id": "S02",
      "slide_no": 2,
      "chapter_id": "C1",
      "page_type": "stakes_window",
      "layout_family": "multi_zone_compare",
      "title": "旧工作流为什么会在这里失效",
      "page_goal": "建立问题紧迫性",
      "core_sentence": "如果不先拆清任务边界，AI 只会放大错误期待",
      "page_objective": "把‘现在不讲清会发生什么’讲透",
      "evidence_points": [
        "{{public_source_1}}",
        "任务定义错误会直接污染后续数据、方法和解释"
      ],
      "page_core_content": [
        "左侧讲‘现在不讲清’的代价：任务被工具化、证据被模糊化、输出被神化",
        "右侧讲‘讲清之后’的收益：知道哪些环节该问人、该问数据、该问模型"
      ],
      "visual_anchor_tracks": [
        "left-risk-zone",
        "right-value-zone",
        "bottom-bridge"
      ],
      "speaker_notes": "这一页要把压力建起来：不是 AI 很厉害，而是如果不先定义任务边界，后面的每一步都会被带偏。",
      "transition_sentence": "知道为什么现在必须讲清之后，下一页先拆误区。",
      "render_recipe_id": "ppt.compare_zones"
    },
    {
      "slide_id": "S03",
      "slide_no": 3,
      "chapter_id": "C1",
      "page_type": "myth_fact_split",
      "layout_family": "multi_zone_compare",
      "title": "先拆三个最容易误判的认知",
      "page_goal": "先清误区，再进入方法",
      "core_sentence": "先把误区拆掉，后面的流程页才讲得进去",
      "page_objective": "让听众把‘会不会用’和‘什么时候该用’分开",
      "evidence_points": [
        "把‘能生成’与‘能负责’分开",
        "把‘结果好看’与‘证据可靠’分开"
      ],
      "page_core_content": [
        "误区一：只要模型新，任务就会更好",
        "误区二：只要结果像答案，就可以直接使用",
        "误区三：只要图表漂亮，就说明流程成熟"
      ],
      "visual_anchor_tracks": [
        "left-myth-column",
        "right-correction-column",
        "bottom-coach-note"
      ],
      "speaker_notes": "这一页是缓冲页：先让听众承认常见误区，再把注意力带到下一页的机制轨道。",
      "transition_sentence": "拆完误区，下一页直接把科研任务拆成显式轨道。",
      "render_recipe_id": "ppt.compare_zones"
    },
    {
      "slide_id": "S04",
      "slide_no": 4,
      "chapter_id": "C2",
      "page_type": "mechanism_track",
      "layout_family": "timeline_band",
      "title": "把科研任务拆成一条 4 段式机制轨道",
      "page_goal": "建立结构理解",
      "core_sentence": "只有先把输入、判断、执行、复核分层，AI 才能被正确放置",
      "page_objective": "让听众看到整条执行链",
      "evidence_points": [
        "输入质量",
        "判断约束",
        "执行链路",
        "复核与回退"
      ],
      "page_core_content": [
        "输入层：问题、样本、标签、场景边界",
        "判断层：先问问题是否可验证，再问证据是否够",
        "执行层：只让模型承担已被约束的局部任务",
        "复核层：结果必须回到真实场景与失败样例"
      ],
      "visual_anchor_tracks": [
        "top-title",
        "center-horizontal-track",
        "bottom-source-rail"
      ],
      "speaker_notes": "这页是机制峰值页，要用显式轨道告诉听众：AI 只能嵌进链条，不能替代整条链。",
      "transition_sentence": "有了轨道之后，再看讲授型场景里的判断梯。",
      "render_recipe_id": "ppt.timeline_rail"
    },
    {
      "slide_id": "S05",
      "slide_no": 5,
      "chapter_id": "C2",
      "page_type": "decision_gate",
      "layout_family": "judgement_ladder",
      "title": "判断梯：哪些环节适合 AI，哪些必须人工签收",
      "page_goal": "建立停顿点与推进点",
      "core_sentence": "如果上一个台阶回答不清，继续往下只会放大偏差",
      "page_objective": "让听众看到哪些节点必须停下来",
      "evidence_points": [
        "问题是否可验证",
        "数据是否支撑",
        "方法是否最小充分",
        "结果是否回到场景"
      ],
      "page_core_content": [
        "问题不清：回到研究问题重写",
        "数据不稳：先补样本与标注协议",
        "方法过重：退回最小可验证方案",
        "验证不足：先补外部复核与失败样例"
      ],
      "visual_anchor_tracks": [
        "left-questions",
        "right-actions",
        "bottom-transition"
      ],
      "speaker_notes": "把这一页讲成停顿点清单：真正成熟的 AI 流程不是一路往前冲，而是知道在哪里停、问、回退。",
      "transition_sentence": "知道怎么判断之后，再看一页公开证据如何支撑这些停顿点。",
      "render_recipe_id": "ppt.judgement_ladder"
    },
    {
      "slide_id": "S06",
      "slide_no": 6,
      "chapter_id": "C3",
      "page_type": "public_evidence",
      "layout_family": "multi_zone_compare",
      "title": "证据页必须把来源口径讲给听众听懂",
      "page_goal": "建立可信度",
      "core_sentence": "证据页不只是贴引用，而是让听众知道结论站在什么公开来源上",
      "page_objective": "示范证据页不能退回内部占位来源",
      "evidence_points": [
        "{{public_source_1}}",
        "{{public_source_2}}",
        "{{public_source_3}}"
      ],
      "page_core_content": [
        "用公开指南界定主题的共识底线",
        "用综述与原则文件说明 AI 进入流程的边界",
        "用来源矩阵把事实、判断、行动三层对齐"
      ],
      "visual_anchor_tracks": [
        "top-claim-band",
        "center-three-zone-evidence",
        "bottom-source-rail"
      ],
      "speaker_notes": "这里要明确示范：证据页绝不能写‘内部资料’或‘来源索引’。来源必须是听众能理解、能公开查到的正式口径。",
      "transition_sentence": "最后一页把今天的判断压缩成学生带得走的行动清单。",
      "render_recipe_id": "ppt.compare_zones"
    },
    {
      "slide_id": "S07",
      "slide_no": 7,
      "chapter_id": "C3",
      "page_type": "ring_cross",
      "layout_family": "ring_cross",
      "title": "把方法落成课堂上的四格动作",
      "page_goal": "形成课后可执行框架",
      "core_sentence": "讲者最终要给听众一个下课后还能复用的动作框架",
      "page_objective": "从课堂内容落成实践步骤",
      "evidence_points": [
        "定义问题",
        "绑定证据",
        "组织执行",
        "复盘回修"
      ],
      "page_core_content": [
        "定义问题",
        "绑定证据",
        "组织执行",
        "复盘回修"
      ],
      "visual_anchor_tracks": [
        "center-hub",
        "north-zone",
        "east-zone",
        "south-zone",
        "west-zone"
      ],
      "speaker_notes": "收尾时不要复述所有概念，而是把今天的判断压缩成四个动作，让听众知道下一次遇到 AI 课题该先做什么。",
      "transition_sentence": "最后用一句总结把主线收束。",
      "render_recipe_id": "ppt.ring_cross"
    },
    {
      "slide_id": "S08",
      "slide_no": 8,
      "chapter_id": "C3",
      "page_type": "closure_peak",
      "layout_family": "summary_peak",
      "title": "最后只收束三件必须带走的事",
      "page_goal": "回收主线并给出动作清单",
      "core_sentence": "结尾页不是重复目录，而是把整条主线压成可回忆的判断句",
      "page_objective": "留下记忆点与下一步动作",
      "evidence_points": [
        "先把任务定义清楚",
        "再把证据界面搭出来",
        "最后再让 AI 进入执行链"
      ],
      "page_core_content": [
        "先把任务定义清楚",
        "再把证据界面搭出来",
        "最后再让 AI 进入执行链"
      ],
      "visual_anchor_tracks": [
        "summary-left",
        "summary-center",
        "summary-right"
      ],
      "speaker_notes": "结尾用三件必须带走的事收束整场讲授。",
      "transition_sentence": "完。",
      "render_recipe_id": "ppt.summary_peak"
    }
  ],
  "profile_variants": {
    "executive_briefing": {
      "slides": [
        {
          "slide_id": "S01",
          "slide_no": 1,
          "chapter_id": "C1",
          "page_type": "cover_peak",
          "layout_family": "multi_zone_compare",
          "title": "{{title}}",
          "page_goal": "先给决策结论",
          "core_sentence": "先试点，再决定是否扩容。",
          "page_objective": "开场直接说清建议与范围",
          "evidence_points": [
            "建议先做小规模试点",
            "当前不建议全面铺开"
          ],
          "public_sources": [
            "{{public_source_1}}"
          ],
          "render_recipe_id": "ppt.compare_zones"
        },
        {
          "slide_id": "S02",
          "slide_no": 2,
          "chapter_id": "C1",
          "page_type": "stakes_window",
          "layout_family": "multi_zone_compare",
          "title": "为什么现在要决定",
          "page_goal": "说明决策窗口",
          "core_sentence": "问题不在工具多，而在资源是否投到正确场景。",
          "page_objective": "把不决策的代价说清",
          "evidence_points": [
            "试点窗口有限",
            "错误扩容成本高"
          ],
          "public_sources": [
            "{{public_source_1}}",
            "{{public_source_2}}"
          ],
          "render_recipe_id": "ppt.compare_zones"
        },
        {
          "slide_id": "S03",
          "slide_no": 3,
          "chapter_id": "C1",
          "page_type": "central_axis",
          "layout_family": "central_axis",
          "title": "本次决策只看三条线",
          "page_goal": "压缩判断维度",
          "core_sentence": "收益、风险、资源三条线必须同屏判断。",
          "page_objective": "避免管理层被技术细节淹没",
          "evidence_points": [
            "收益线",
            "风险线",
            "资源线"
          ],
          "public_sources": [
            "{{public_source_1}}"
          ],
          "render_recipe_id": "ppt.central_axis"
        },
        {
          "slide_id": "S04",
          "slide_no": 4,
          "chapter_id": "C2",
          "page_type": "timeline_band",
          "layout_family": "timeline_band",
          "title": "建议动作分三步走",
          "page_goal": "给出决策动作",
          "core_sentence": "先试点、再复核、后扩容，动作不能倒序。",
          "page_objective": "让下一步动作可执行",
          "evidence_points": [
            "限定场景试点",
            "按周期复核",
            "达标后扩容"
          ],
          "public_sources": [
            "{{public_source_1}}",
            "{{public_source_2}}"
          ],
          "render_recipe_id": "ppt.timeline_rail"
        },
        {
          "slide_id": "S05",
          "slide_no": 5,
          "chapter_id": "C2",
          "page_type": "decision_gate",
          "layout_family": "judgement_ladder",
          "title": "什么时候该停，什么时候该推",
          "page_goal": "明确决策闸口",
          "core_sentence": "有一个关键前提答不清，就不该继续投入。",
          "page_objective": "把推进条件和停止条件讲清",
          "evidence_points": [
            "场景是否稳定",
            "责任人是否明确",
            "复核机制是否到位"
          ],
          "public_sources": [
            "{{public_source_2}}"
          ],
          "render_recipe_id": "ppt.judgement_ladder"
        },
        {
          "slide_id": "S06",
          "slide_no": 6,
          "chapter_id": "C2",
          "page_type": "evidence_surface",
          "layout_family": "multi_zone_compare",
          "title": "证据只保留管理层需要的部分",
          "page_goal": "给出决策证据",
          "core_sentence": "证据页只回答：值不值得、风险大不大、下一步怎么走。",
          "page_objective": "避免技术细节挤占决策注意力",
          "evidence_points": [
            "价值证据",
            "风险证据",
            "动作证据"
          ],
          "public_sources": [
            "{{public_source_1}}",
            "{{public_source_2}}",
            "{{public_source_3}}"
          ],
          "render_recipe_id": "ppt.compare_zones"
        },
        {
          "slide_id": "S07",
          "slide_no": 7,
          "chapter_id": "C3",
          "page_type": "ring_cross",
          "layout_family": "ring_cross",
          "title": "把责任、节奏、资源绑成闭环",
          "page_goal": "形成推进闭环",
          "core_sentence": "责任人、评估周期、资源边界缺一不可。",
          "page_objective": "让管理动作落到具体 owner",
          "evidence_points": [
            "责任人",
            "评估周期",
            "资源边界"
          ],
          "public_sources": [
            "{{public_source_2}}"
          ],
          "render_recipe_id": "ppt.ring_cross"
        },
        {
          "slide_id": "S08",
          "slide_no": 8,
          "chapter_id": "C3",
          "page_type": "closure_peak",
          "layout_family": "summary_peak",
          "title": "最后只收三句决策话",
          "page_goal": "回收决策主线",
          "core_sentence": "先试点、严复核、达标后扩容。",
          "page_objective": "留下一句能直接复述的决策口径",
          "evidence_points": [
            "先试点",
            "严复核",
            "后扩容"
          ],
          "public_sources": [
            "{{public_source_1}}"
          ],
          "render_recipe_id": "ppt.summary_peak"
        }
      ]
    }
  }
}
```
