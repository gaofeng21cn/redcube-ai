# xiaohongshu / storyline

基于 research 结果生成适合小红书的故事线。
要求：
- 明确 audience judgement / tension / why-now / memory hook / narrative progression
- 不允许只给“标题 + 要点”结构骨架
- 先给认知冲突，再给解释路径，再给收藏理由

## runtime_seed
```json
{
  "storyline": {
    "audience_judgement": "读者不是想学完整理论，而是想先判断：这件事到底该不该立刻调整做法",
    "tension": "旧习惯看起来省事，但会把判断顺序做反，最后把时间浪费在错误动作上",
    "why_now": "现在工具更多、信息更杂，越需要先把判断顺序讲清，否则越容易被表面答案带偏",
    "memory_hook": "先别急着上工具，先把顺序做对",
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
