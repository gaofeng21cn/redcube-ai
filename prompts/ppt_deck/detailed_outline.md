# ppt_deck detailed_outline

## 审阅与批准合同

- 如果 product-entry / operator_playbook / source_truth 中出现用户已审阅批准的故事主线、详细大纲或逐页蓝图，必须保留其页数、顺序、标题与叙事层级。
- 不得把已批准的长讲座压缩成短课件、课堂摘要或少页版本。
- 如果用户要求“先给我审阅、审阅后再继续”，本 stage 是人工审阅停靠点，输出必须足够支持后续完整 deck，而不是终稿压缩版。


把故事主线拆成章节与页预算。
要求：
- 每页明确 core_sentence / evidence_points / page_objective
- `source_materials_full_text` 是完整资料输入，必须通读全文后规划页面；不得只消费材料开头、source_fact_summary、ready_sources 或任何截断 excerpt
- 如果任务是待投稿/成文论文同步，每篇论文必须至少有一页听众可见内容直接写出关键数字证据，例如样本量、事件率、AUROC、Brier、校准、风险分层、Knosp 分布等；数字只能来自 source_materials_full_text
- 待投稿/成文论文同步的页面主语是“论文故事、结论、证据、边界”，不得硬扯“科室价值”“应用场景”“管理建议”“服务临床动作”或把论文写成已经可推广使用的工具
- 若存在具名讲者署名，封面页必须把署名落成 audience-facing cover element，而不是写成“封面必须署名”这类元指令
- 听众可见字段只允许承载标题、结论、证据摘要、边界和必要数字；`speaker_notes`、`transition_sentence`、`page_goal`、`page_objective`、`visual_anchor_tracks` 是讲者/作者工作面，不得复制或改写成页面正文
- 如果源材料、题目或管理上下文里存在内部编号、项目编号、source_id、material_id，且用户给出了对外称呼或序号，所有听众可见标题和正文必须使用对外称呼；内部编号只留在 provenance 或 notes，不作为论文标题
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
        "今天的主题不是“概念堆砌”，而是“{{title}} 的核心概念、判断顺序与课堂带走点”",
        "先讲 {{goal}}，再讲关键概念与判断边界，最后讲课堂里的下一步动作"
      ],
      "visual_anchor_tracks": [
        "left-identity-rail",
        "center-title-stage",
        "right-promise-card"
      ],
      "speaker_notes": "开场先立契约：今天不是堆概念，而是把 {{title}} 讲成一条从概念到判断再到动作的课堂主线。",
      "transition_sentence": "既然今天讲的是链路，就先解释为什么这件事现在必须讲清。",
      "render_recipe_id": "ppt.hero_signal"
    },
    {
      "slide_id": "S02",
      "slide_no": 2,
      "chapter_id": "C1",
      "page_type": "stakes_window",
      "layout_family": "multi_zone_compare",
      "title": "为什么 {{title}} 需要先讲清判断顺序",
      "page_goal": "建立问题紧迫性",
      "core_sentence": "如果一开始不先讲清核心概念与判断边界，后面的记忆点只会越讲越乱",
      "page_objective": "把“为什么这个主题值得先讲清”讲透",
      "evidence_points": [
        "{{public_source_1}}",
        "概念、症状与判断顺序没对齐时，听众最容易把重点理解反"
      ],
      "page_core_content": [
        "左侧讲“没先讲清概念和边界”的代价：术语记不住、重点抓不住、动作顺序会做反",
        "右侧讲“讲清之后”的收益：知道先看什么、如何判断、何时该停下来复核"
      ],
      "visual_anchor_tracks": [
        "left-risk-zone",
        "right-value-zone",
        "bottom-bridge"
      ],
      "speaker_notes": "这一页要把压力建起来：不是信息不够，而是如果不先把主题概念和判断边界讲清，后面的每一步都会被带偏。",
      "transition_sentence": "知道为什么这个主题必须先讲清之后，下一页先拆误区。",
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
        "混淆一：只背术语，不先理解概念之间的关系",
        "混淆二：只看结论，不先判断适用边界",
        "混淆三：只记动作，不先理解为什么要这样做"
      ],
      "visual_anchor_tracks": [
        "left-myth-column",
        "right-correction-column",
        "bottom-coach-note"
      ],
      "speaker_notes": "这一页是缓冲页：先让听众承认常见混淆点，再把注意力带到下一页的主题主线。",
      "transition_sentence": "拆完误区，下一页直接把主题主线讲成显式轨道。",
      "render_recipe_id": "ppt.compare_zones"
    },
    {
      "slide_id": "S04",
      "slide_no": 4,
      "chapter_id": "C2",
      "page_type": "mechanism_track",
      "layout_family": "timeline_band",
      "title": "把 {{title}} 讲成一条 4 段式主线",
      "page_goal": "建立结构理解",
      "core_sentence": "只有先把概念、判断、证据与动作分层，听众才能真正跟上这节课",
      "page_objective": "让听众看到整条课堂主线",
      "evidence_points": [
        "核心概念",
        "判断边界",
        "公开证据",
        "课堂动作"
      ],
      "page_core_content": [
        "概念层：先讲定义、作用与最常见的判断对象",
        "判断层：先分清常见情况，再确认哪些边界需要停下来复核",
        "证据层：用公开来源解释为什么这条判断成立",
        "动作层：把课后该做什么压成能直接复述的步骤"
      ],
      "visual_anchor_tracks": [
        "top-title",
        "center-horizontal-track",
        "bottom-source-rail"
      ],
      "speaker_notes": "这页是机制峰值页，要用显式轨道告诉听众：这节课的重点是先抓主线，再记细节。",
      "transition_sentence": "有了主线之后，再看讲授场景里的判断边界。",
      "render_recipe_id": "ppt.timeline_rail"
    },
    {
      "slide_id": "S05",
      "slide_no": 5,
      "chapter_id": "C2",
      "page_type": "decision_gate",
      "layout_family": "judgement_ladder",
      "title": "判断边界：哪些情况要先确认再继续",
      "page_goal": "建立停顿点与推进点",
      "core_sentence": "如果上一个判断点没有讲清，继续往下只会放大误解",
      "page_objective": "让听众看到哪些节点必须先停下来确认",
      "evidence_points": [
        "概念是否分清",
        "边界是否明确",
        "证据是否够用",
        "动作是否对应场景"
      ],
      "page_core_content": [
        "概念没分清：回到定义和常见混淆点",
        "边界不明确：先补充场景与例外情况",
        "证据不够：先补公开来源与课堂可解释口径",
        "动作太散：先压缩成课后能照着做的步骤"
      ],
      "visual_anchor_tracks": [
        "left-questions",
        "right-actions",
        "bottom-transition"
      ],
      "speaker_notes": "把这一页讲成停顿点清单：真正成熟的讲授不是一路往前冲，而是知道在哪里停下来重新确认。",
      "transition_sentence": "知道怎么判断之后，再看一页公开证据如何支撑这些判断点。",
      "render_recipe_id": "ppt.judgement_ladder"
    },
    {
      "slide_id": "S06",
      "slide_no": 6,
      "chapter_id": "C3",
      "page_type": "public_evidence",
      "layout_family": "multi_zone_compare",
      "title": "{{title}} 的证据页要把来源讲成人能听懂的话",
      "page_goal": "建立可信度",
      "core_sentence": "证据页不只是贴引用，而是让听众知道结论站在什么公开来源上",
      "page_objective": "示范证据页不能退回空泛来源占位",
      "evidence_points": [
        "{{public_source_1}}",
        "{{public_source_2}}",
        "{{public_source_3}}"
      ],
      "page_core_content": [
        "用公开指南界定 {{title}} 的共识底线",
        "用综述与正规资料说明关键判断的边界",
        "用来源矩阵把事实、判断、行动三层对齐"
      ],
      "visual_anchor_tracks": [
        "top-claim-band",
        "center-three-zone-evidence",
        "bottom-source-rail"
      ],
      "speaker_notes": "这里要明确示范：证据页绝不能写“内部资料”或“来源索引”。来源必须是听众能理解、能公开查到的正式口径。",
      "transition_sentence": "最后一页把今天的判断压缩成听众带得走的行动清单。",
      "render_recipe_id": "ppt.compare_zones"
    },
    {
      "slide_id": "S07",
      "slide_no": 7,
      "chapter_id": "C3",
      "page_type": "ring_cross",
      "layout_family": "ring_cross",
      "title": "把课堂重点压成四个可执行动作",
      "page_goal": "形成课后可执行框架",
      "core_sentence": "讲者最终要给听众一个下课后还能复用的动作框架",
      "page_objective": "从课堂内容落成课后步骤",
      "evidence_points": [
        "先认概念",
        "再抓判断",
        "再看证据",
        "最后定动作"
      ],
      "page_core_content": [
        "先认概念",
        "再抓判断",
        "再看证据",
        "最后定动作"
      ],
      "visual_anchor_tracks": [
        "center-hub",
        "north-zone",
        "east-zone",
        "south-zone",
        "west-zone"
      ],
      "speaker_notes": "收尾时不要复述所有概念，而是把今天的主线压缩成四个动作，让听众知道下一次遇到类似主题该先做什么。",
      "transition_sentence": "最后用一句总结把主线收束。",
      "render_recipe_id": "ppt.ring_cross"
    },
    {
      "slide_id": "S08",
      "slide_no": 8,
      "chapter_id": "C3",
      "page_type": "closure_peak",
      "layout_family": "summary_peak",
      "title": "最后收束 {{title}} 的三条带走点",
      "page_goal": "回收主线并给出动作清单",
      "core_sentence": "结尾页不是重复目录，而是把整条主线压成可回忆的判断句",
      "page_objective": "留下记忆点与下一步动作",
      "evidence_points": [
        "先讲清核心概念",
        "再连上公开证据",
        "最后压成动作顺序"
      ],
      "page_core_content": [
        "先讲清核心概念",
        "再连上公开证据",
        "最后压成动作顺序"
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
          "render_recipe_id": "ppt.compare_zones",
          "page_core_content": [
            "建议先在高确定性、可复核的单点场景启动试点。",
            "当前不建议全面铺开，因为责任归属、复核机制与资源边界尚未同时闭环。"
          ],
          "visual_anchor_tracks": [
            "left-decision-card",
            "right-boundary-card",
            "bottom-commitment-band"
          ],
          "speaker_notes": "开场先给管理结论：先试点，不扩容。让听众立刻知道今天讨论的是决策条件，不是技术展演。",
          "transition_sentence": "结论先说完，下一页解释为什么这个决策窗口已经到来。"
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
          "render_recipe_id": "ppt.compare_zones",
          "page_core_content": [
            "不决策的代价，是继续把资源投向边界不清的尝试。",
            "过早扩容的代价，是把试点风险直接放大成组织性成本。",
            "现在要做的，是在窗口期内把试点、复核、扩容顺序锁定。"
          ],
          "visual_anchor_tracks": [
            "left-window-zone",
            "right-cost-zone",
            "bottom-action-band"
          ],
          "speaker_notes": "这一页只解释为什么现在必须决策：拖延会错过窗口，盲目扩容会放大成本。",
          "transition_sentence": "既然窗口已经出现，下一页把决策压缩成管理层真正需要看的三条线。"
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
          "render_recipe_id": "ppt.central_axis",
          "page_core_content": [
            "收益线：这件事是否真的改善关键业务结果。",
            "风险线：失败代价、责任归属与监管压力是否可控。",
            "资源线：现有团队、预算与节奏能否支撑试点闭环。"
          ],
          "visual_anchor_tracks": [
            "left-benefit-axis",
            "center-risk-axis",
            "right-resource-axis"
          ],
          "speaker_notes": "把管理判断从技术细节里抽出来：所有讨论只围绕收益、风险、资源三条线。",
          "transition_sentence": "三条线对齐后，下一页直接给出建议动作顺序。"
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
          "render_recipe_id": "ppt.timeline_rail",
          "page_core_content": [
            "先限定场景试点，只验证最关键的一段闭环。",
            "再按固定周期复核，用真实失败样例校准边界。",
            "最后在指标与责任同时达标后，再讨论扩容。"
          ],
          "visual_anchor_tracks": [
            "top-title-band",
            "center-execution-track",
            "bottom-timeline-guard"
          ],
          "speaker_notes": "动作顺序不能颠倒：先试点、再复核、后扩容。任何跳步都会把风险转嫁给组织。",
          "transition_sentence": "动作顺序确定后，下一页说明哪些闸口没过就必须停。"
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
          "render_recipe_id": "ppt.judgement_ladder",
          "page_core_content": [
            "场景不稳定：暂停投入，先把使用边界与责任重新定义。",
            "责任人不明确：暂停推进，先补治理 owner 与签收路径。",
            "复核机制不到位：暂停扩容，先补失败样例与周期性复盘。"
          ],
          "visual_anchor_tracks": [
            "left-stop-questions",
            "right-stop-actions",
            "bottom-governance-rail"
          ],
          "speaker_notes": "把这页讲成管理闸口：有一个关键前提答不清，就不该继续追加资源。",
          "transition_sentence": "闸口清楚后，下一页只保留管理层真正需要的证据。"
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
          "render_recipe_id": "ppt.compare_zones",
          "page_core_content": [
            "价值证据：试点是否真的换来效率、质量或风险下降。",
            "风险证据：失败样例、误判代价与监管约束是否被看见。",
            "动作证据：下一步要谁负责、按什么节奏复核、何时决定扩容。"
          ],
          "visual_anchor_tracks": [
            "top-claim-band",
            "center-evidence-zones",
            "bottom-source-rail"
          ],
          "speaker_notes": "证据页不能退回技术细节堆砌，只回答管理层关心的价值、风险、动作三件事。",
          "transition_sentence": "证据口径讲清后，下一页把责任、节奏和资源绑成一个推进闭环。"
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
          "render_recipe_id": "ppt.ring_cross",
          "page_core_content": [
            "责任人：谁对试点结果与风险签收负责。",
            "评估周期：多久复核一次，何时做去留判断。",
            "资源边界：预算、人手、场景范围不能越线。",
            "回修机制：一旦失败，如何停下、复盘并回到试点。"
          ],
          "visual_anchor_tracks": [
            "center-owner-hub",
            "north-cycle-zone",
            "east-resource-zone",
            "south-repair-zone",
            "west-accountability-zone"
          ],
          "speaker_notes": "这一页把推进闭环说完整：责任、节奏、资源和回修机制要同时在场，组织才不会被动。",
          "transition_sentence": "闭环成立后，最后一页把整场决策压缩成三句能直接复述的话。"
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
          "render_recipe_id": "ppt.summary_peak",
          "page_core_content": [
            "先试点，只在高确定性场景验证最小闭环。",
            "严复核，用真实失败样例决定要不要继续投入。",
            "后扩容，只有指标、责任与资源同时达标才放大。"
          ],
          "visual_anchor_tracks": [
            "summary-left",
            "summary-center",
            "summary-right"
          ],
          "speaker_notes": "结尾不重复过程，只留下三句决策口径，让管理层会后仍能原样复述。",
          "transition_sentence": "完。"
        }
      ]
    }
  }
}
```
