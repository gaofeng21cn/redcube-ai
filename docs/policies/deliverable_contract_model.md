# 交付合同模型 Policy

这份文档定义 `RedCube AI` 当前稳定的交付合同模型。

## 正式控制模型

每个交付任务都应按下面三层解析：

1. `overlay family`
2. `profile pack`
3. `deliverable contract`

## 各层职责

### Overlay Family

定义一类视觉交付物的共同执行面。

当前正式 family：

- `ppt_deck`
- `xiaohongshu`
- `poster_onepager`

补充定位：

- `ppt_deck` 与 `xiaohongshu` 是当前 production-grade baseline family
- `poster_onepager` 当前是已完成 extension proof 的 `knowledge poster` family
- `paper_poster / conference_poster` academic poster contract 尚未正式存在，不能偷换成当前 `poster_onepager`

### Profile Pack

定义同一 family 内部、面向不同任务场景的正式质量协议。

它至少应控制：

- audience
- review rubric
- gate policy
- layout / density constraints
- export shape

### Deliverable Contract

是单次任务在运行时最终解析出的正式执行协议。

它必须是：

- 明确的
- 可落盘的
- 可审计的
- 可被 runtime 直接消费的

它还必须能被映射到共享生命周期：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核与治理采用共享双层 overlay：

- `visual_director_review`
- `screenshot_review`

补充约束：

- `research` 不应作为小红书专属 creative stage 固化在长期语义里
- `single_note_plan` 与 `detailed_outline + slide_blueprint` 可以在 route 粒度上不同，但在宏观上都属于 `Story Architecture`
- `visual_direction + author_image_pages` 是 `xiaohongshu` 与 `ppt_deck` 当前默认 `Visual Authorship`；`render_html/fix_html` 只作为显式 HTML lane 继续属于同一宏观阶段
- `publish_copy + export_bundle` 与 `export_pptx` 在宏观上都属于 `Delivery Packaging`

## 稳定对象模型

正式运行对象采用：

- `topic`
- `deliverable`
- `run`
- `artifact`

不再把 `note` 视为唯一中心对象。

## 不能退回去的做法

- 不能把 profile 差异藏回 prompt 拼接
- 不能把质量标准拖到导出前靠人工补救
- 不能让 family 直接承担所有细分场景语义
- 不能让 runtime 直接内嵌 overlay 领域判断
- 不能让 deterministic JS 重新主导 story / visual 主要创作
- 不能让 `research` 长期变成小红书专属 creative 路由语义
- 不能让 PPT 永久缺失显式 `visual_director_review`
