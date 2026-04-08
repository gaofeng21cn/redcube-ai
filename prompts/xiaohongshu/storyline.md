# xiaohongshu / storyline

基于 research 结果生成适合小红书的故事线。
要求：
- `audience judgement / tension / why-now / memory hook` 属于 storyline judgement
- 明确 audience judgement / tension / why-now / memory hook / narrative progression
- 不允许只给“标题 + 要点”结构骨架
- 先给认知冲突，再给解释路径，再给收藏理由

## runtime_artifact
```json
{
  "storyline": {
    "mode": "{{mode}}",
    "audience_judgement": "{{audience_judgement}}",
    "tension": "{{tension}}",
    "why_now": "{{why_now}}",
    "memory_hook": "{{memory_hook}}",
    "hook": "先打破旧认知，再给动作收益",
    "narrative_progression": [
      "先用反直觉钩子把读者拉停",
      "再拆常见误区与代价",
      "再给一条能照着走的判断顺序",
      "最后压缩成收藏理由与下一步动作"
    ],
    "journey": [
      "先拆问题误区",
      "再给关键解释与证据",
      "最后压成可执行动作"
    ],
    "resolution": "让读者愿意收藏并继续看下一页/下一篇"
  }
}
```
