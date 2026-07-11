# xiaohongshu / storyline

基于 research 结果与 `source_materials_full_text` 生成适合小红书的故事线。

## AI-first 故事线合同

- `mode_decision` 必须由 AI 通读完整资料后判断 `single` 或 `series`；标题、目录名和程序传入的 `series_candidate` 只作为信号，不能替代判断。
- `audience_judgement` / `tension` / `why_now` / `memory_hook` 属于 storyline judgement，必须由 AI 阅读完整资料后产出。
- 明确 `audience_judgement` / `tension` / `why_now` / `memory_hook` / `narrative_progression`。
- 不允许只给“标题 + 要点”结构骨架。
- 先给认知冲突，再给解释路径，再给收藏理由。
- 不得复制 prompt 占位词或程序传入的 planning signals；planning signals 只帮助理解任务，不替代 AI 判断。
- `series` 模式必须同时生成可执行的 `series_architecture`：至少两个章节、至少两份互不重复的 note brief，以及逐篇 evidence anchors、预计页数、衔接和 no-repeat scope。详细交接形状见 `prompts/xiaohongshu/series_plan.md`。
- `single` 模式将 `series_architecture.status` 设为 `not_applicable`，不得为了显得完整而虚构系列。
- 医疗/健康内容必须保留事实锚点、不确定性与行动边界；涉及药物时禁止规划成宣传式单药专题，优先使用对比、品类、机制或决策语境。

## runtime_artifact

下列 JSON 只说明字段形状，不提供默认故事线。

```json
{
  "storyline": {
    "mode": "<single | series>",
    "mode_decision": {
      "result": "<single | series>",
      "rationale": [
        "<source volume judgement>",
        "<topic span judgement>",
        "<reader task complexity judgement>"
      ],
      "thematic_units": ["<AI-authored source-grounded thematic unit>"]
    },
    "audience_judgement": "<AI-authored audience judgement>",
    "tension": "<AI-authored central tension>",
    "why_now": "<AI-authored why-now judgement>",
    "memory_hook": "<AI-authored memory hook>",
    "hook": "<AI-authored opening hook>",
    "narrative_progression": [
      "<AI-authored progression step>",
      "<AI-authored progression step>",
      "<AI-authored progression step>"
    ],
    "journey": [
      "<AI-authored journey step>",
      "<AI-authored journey step>",
      "<AI-authored journey step>"
    ],
    "resolution": "<AI-authored resolution>",
    "series_architecture": {
      "status": "<required | not_applicable>",
      "series_thesis": "<AI-authored series thesis or single-note closure>",
      "recommended_note_range": "<AI-authored range and rationale>",
      "chapters": [],
      "note_briefs": [],
      "publication_arc": []
    }
  }
}
```
