# 故事指南候选命名规范

Owner: `RedCube AI`
Purpose: `xiaohongshu_story_guide_candidate_naming`
State: `active_prompt_asset_support`
Machine boundary: 本文是人读候选提示词命名说明。机器真相继续归 RCA stage pack、prompt policy、source、workspace artifacts 和 RCA-owned review/export gates；本文不作为脚本路由、runtime readiness 或 production evidence。

本目录下的候选文件由大语言模型自动扫描命中，不使用脚本路由。

## 文件名格式

`SG__<领域关键词>__<触发关键词或默认>__<策略名>.md`

- 示例：
- `SG__医学_健康_生命科学__默认__深度优先蓝图.md`
- `SG__航空航天__轨道_发射_推进__流量模型.md`

## 命中原则（由大模型执行）

1. 先看领域关键词是否与当前主题/人设匹配
2. 触发关键词为“默认”时，仅要命中领域即可；否则再核对触发关键词
3. 未命中则跳过
4. 多候选命中时，优先用户指定，其次匹配度更高者

## 约束

1. 候选文件内容应聚焦“故事/蓝图约束”，不写HTML实现细节
2. 若候选约束与故事线生成器冲突，以命中候选为准
