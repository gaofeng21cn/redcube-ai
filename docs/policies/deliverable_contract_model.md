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
