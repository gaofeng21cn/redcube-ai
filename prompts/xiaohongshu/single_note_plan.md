# xiaohongshu / single_note_plan

单篇策划是正式 stage。

## AI-first 策划合同

- 至少 3 个标题备选。
- 每页必须给到 `page_goal` / `page_core_content` / `visual_presentation` / `source_language` / `progression_role` / `transition`。
- 不能把视觉导演稿并入附注。
- 不能只给粗粒度 outline。
- 如果 `context.author_branding` 存在，封面或结尾必须预留 audience-facing 署名位；署名显示与副标要像内容品牌，而不是后台备注。
- 每页都要提前规划视觉锚点与版心分布；小红书优先使用 Font Awesome Free，emoji 只做补充。
- 每页从策划阶段就要规划相邻读者可见文字块、主卡、底部收束条之间的安全间距；副标题贴主卡、收藏条压正文、卡片互相贴住都属于版心失败。
- 封面与结尾页都要有清楚的 audience-facing 视觉抓手；禁止把孤立单字贴纸、内部标签或无语义装饰当成锚点。
- 标题和核心短句按自然语义组织；能单行成立的短句不要为了造型主动拆行。
- 医学/健康/科普信息页默认采用“中密度 + 手机可读”：1 句核心判断、3 个短主信息模块、1 条边界提示；复杂机制页最多 4 个主模块。
- 主信息模块优先 8-14 个汉字，最多约 18 个汉字；不要把 5-6 条长句塞进小卡片，也不要降级成只有标题和关键词标签。
- 除封面、章节过渡和极简收束页外，每页下半区必须承载实质信息模块，不能只放图标、花草、装饰贴纸或留白。
- 相邻页面至少变换主视觉动作和信息模块位置；系列或 8 页以上图文必须提前规划机制图、清单、流程、行动卡等不同布局原型。
- `source_materials_full_text` 是完整资料输入，必须由 AI 阅读后决定页数、页面顺序、标题和内容；不得照抄本 prompt 的字段占位或历史默认页。

## runtime_seed

下列 JSON 只说明字段形状，不提供默认 6 页结构、固定标题或固定动作清单。

```json
{
  "plan": {
    "title_options": [
      "<AI-authored title option grounded in source_materials_full_text>",
      "<AI-authored title option grounded in source_materials_full_text>",
      "<AI-authored title option grounded in source_materials_full_text>"
    ],
    "slides": [
      {
        "slide_id": "<stable slide id, e.g. N01>",
        "title": "<AI-authored audience-facing page title>",
        "layout_family": "<cover_note | myth_compare | sequence_stack | process_track | evidence_strip | action_checklist>",
        "render_recipe_id": "xhs.<allowed_recipe_id>",
        "page_goal": "<private authoring goal>",
        "progression_role": "<hook | tension | explain | mechanism_peak | evidence_peak | memory_close>",
        "page_core_content": [
          "<AI-authored core judgement from source_materials_full_text>",
          "<AI-authored short main module from source_materials_full_text>",
          "<AI-authored short main module from source_materials_full_text>",
          "<AI-authored short main module from source_materials_full_text>",
          "<AI-authored boundary note when medical/action risk exists>"
        ],
        "visual_presentation": {
          "layout_family": "<layout family>",
          "main_visual_action": "<AI-authored visual action>",
          "action_primitive": "<AI-authored primitive>",
          "lower_half_module": "<substantive lower-half module or explicit reason when cover/transition page>",
          "density_target": "<medium_density_mobile_readable | cover_hook | memory_close>",
          "anchor_tracks": [
            "<visual anchor>",
            "<visual anchor>",
            "<visual anchor>"
          ],
          "anti_template_note": "<specific anti-template instruction for this page>"
        },
        "source_language": "<audience-readable source wording discipline>",
        "speaker_notes": "<private speaker note, never visible card text>",
        "transition": "<private transition>"
      }
    ]
  }
}
```
