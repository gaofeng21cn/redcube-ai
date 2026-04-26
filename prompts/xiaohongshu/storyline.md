# xiaohongshu / storyline

基于 research 结果与 `source_materials_full_text` 生成适合小红书的故事线。

## AI-first 故事线合同

- `audience_judgement` / `tension` / `why_now` / `memory_hook` 属于 storyline judgement，必须由 AI 阅读完整资料后产出。
- 明确 `audience_judgement` / `tension` / `why_now` / `memory_hook` / `narrative_progression`。
- 不允许只给“标题 + 要点”结构骨架。
- 先给认知冲突，再给解释路径，再给收藏理由。
- 不得复制 prompt 占位词或程序传入的 planning signals；planning signals 只帮助理解任务，不替代 AI 判断。

## runtime_artifact

下列 JSON 只说明字段形状，不提供默认故事线。

```json
{
  "storyline": {
    "mode": "<single | series>",
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
    "resolution": "<AI-authored resolution>"
  }
}
```
