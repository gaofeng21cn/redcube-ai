# poster_onepager / storyline

单页知识海报的故事主线必须先冻结导演判断，再进入 blueprint。
要求：
- 给出 headline / subheadline / audience_judgement / why_now / proof_promise / call_to_action
- headline 必须能独立成立，不依赖正文补解释
- 不允许把海报退化成信息堆叠或模板口号

## runtime_artifact
```json
{
  "storyline": {
    "headline": "{{title}}：先抓住最值钱的判断句",
    "subheadline": "给门诊患者一张能看完、带走、转给家人的单页海报",
    "audience_judgement": "先看什么、为什么现在要看、看完后该怎么做",
    "why_now": "信息很多，但真正能帮读者马上做对判断的内容太少",
    "proof_promise": "每一块内容都要能对应公开来源或明确行动理由",
    "call_to_action": "看完这一页后，先按海报给出的顺序执行，再去扩展阅读"
  }
}
```
