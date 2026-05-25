# 自动小红书引擎层说明

Owner: `RedCube AI`
Purpose: `xiaohongshu_prompt_engine_index`
State: `active_prompt_asset_support`
Machine boundary: 本文是人读提示词资产索引。机器真相继续归 RCA stage pack、`agent/` prompt policy、contracts、source、workspace artifacts 和 RCA-owned review/export gates；本文不定义 runtime owner、production readiness 或 generated surface ownership。

`system/自动小红书/` 是当前工作台的“引擎层”，不是整个工作台的入口层。

它负责：

1. 提示词
2. 默认配置
3. 默认文档骨架
4. 人设、故事线、视觉生成约束
5. 视觉导演稿与视觉总监复盘约束

它不负责：

1. 工作台总目录说明
2. 主题启动方式
3. 输入/输出/已发表的状态流转说明

这些工作台级说明统一放在：

- `README.md`
- `AGENTS.md`
- `system/素材库/03_装配规则/00_智能体任务快捷入口.md`

## 目录职责

1. 路由与档案
- `作者档案库.md`
- `人设自动路由规则.md`

2. 策划提示词
- `策划提示词/目录策划.md`
- `策划提示词/单篇策划.md`
- `策划提示词/单篇策划质控门禁.md`
- `策划提示词/发布文案.md`
- `策划提示词/发布文案质控门禁.md`

3. 视觉提示词
- `视觉提示词/视觉导演稿生成器.md`
- `视觉提示词/活泼版.md`
- `视觉提示词/专业版.md`
- `视觉提示词/主视觉动作落地词典.md`
- `视觉提示词/视觉总监复盘.md`
- `视觉提示词/智能体同构门禁协议.md`

4. 叙事与候选
- `故事指南/叙事风格与故事线生成器.md`
- `故事指南/候选/SG__*.md`
- `风格指南/*.md`

5. 默认回退
- `defaults/AGENT_PRESET.default.md`
- `defaults/templates/*.md`

## 单一真相源

- 全流程规则与门禁：`AGENTS.md`
- 提示词调用链：`system/自动小红书/提示词编排与调用顺序.md`
- 人设算法：`system/自动小红书/人设自动路由规则.md`

## 执行口径

1. 人设、故事指南、叙事风格属于可选增强：有就用，没有就跳过并留痕
2. `series/single` 可由故事线结果或素材体量判定
3. `single` 分支禁止先生成系列目录再回退
4. HTML 允许复用导出外壳，禁止模板化内容渲染
5. 单篇视觉采用“视觉导演稿 -> render_html -> 视觉总监复盘 -> screenshot_review”链路；页面级问题优先走 `fix_html` 局部修页，只有结构级错误才回整页 `render_html`

## 维护约定

1. 新规则先改 `AGENTS.md`
2. 工作台入口先改 `README.md` 与 `system/素材库/03_装配规则/`
3. 新增提示词只写本文件约束，不重复流程章节
4. 出现冲突时，以 `AGENTS.md` 为准并立即回写修正
