# xiaohongshu / visual_director_review

视觉总监复盘是正式审阅 stage。
要求：
- 判断导演意图是否落地
- 判断是否仍像统一安全模板页
- 判断是否有记忆点 / 首眼抓取点
- 判断视觉锚点是否语义明确、风格一致；若出现孤立单字贴纸、疑似内部标签或无语义装饰，必须视为弱页或阻断
- 判断底部署名与副标是否像内容品牌露出，而不是后台备注
- 给出 weak_pages / homogeneous_layout_risk / rewrite_action
- 通过后才能进入 screenshot_review
- 该 stage 的判断主语必须是 host-agent / director-first，不允许 heuristic code 冒充导演审片

## runtime_seed
```json
{
  "visual_director_review": {
    "director_intent_landed": true,
    "anti_template_ok": true,
    "memory_hook_present": true,
    "homogeneous_layout_risk": 0.18,
    "weak_pages": [],
    "rewrite_action": "none",
    "review_summary": "导演意图、记忆点与反模板化要求已在当前图文里成立，可以进入 screenshot_review。"
  }
}
```
