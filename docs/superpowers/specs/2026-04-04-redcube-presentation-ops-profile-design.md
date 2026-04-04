# RedCube Presentation Ops Profile 设计冻结稿

日期：2026-04-04

状态：冻结，用于约束 `ppt_deck` 与其他视觉交付物 overlay 的后续扩展方式

## 1. 设计结论

`RedCube AI` 不应被定义为：

- 整个 `OPL`
- 整个 `Presentation Ops`
- 单一的 PPT 生成器

它应被定义为：

> `OPL` 体系下、面向视觉交付物的 agent-first runtime。

在这一定义里：

- `Presentation Ops` 是 `OPL` 的任务面
- `RedCube AI` 是其中一个实现面
- `ppt_deck` 是当前最直接承接 `Presentation Ops` 的 overlay family
- `xiaohongshu` 继续保留在 `RedCube` 中，但在 `OPL` 顶层语义里不应等同于 `Presentation Ops`

## 2. 为什么只有 `ppt_deck overlay` 还不够

如果系统只知道“这是一个 `ppt_deck`”，那它仍然无法回答这些关键问题：

- 这是给学生讲课，还是给小同行讲课
- 这是给领导汇报，还是正式答辩
- 这一类 deck 的失败方式是什么
- 哪些 gate 必须在导出前通过
- 哪些 slide family 可以出现，哪些不应该出现

同样是 `16:9` 幻灯片，下面几类对象的质量标准完全不同：

- `lecture_student`
- `lecture_peer`
- `executive_briefing`
- `defense_deck`

如果只保留一个 `ppt_deck overlay`，后续实现就很容易退化成：

- 在 prompt 里临时补风格说明
- 在 review 阶段靠主观补救
- 在导出前做启发式修修补补

这不符合当前项目的正式方向。正确做法是把差异前移为显式 contract。

## 3. 正式控制模型：`overlay family -> profile pack -> deliverable contract`

### 3.1 Overlay Family

`overlay family` 定义一类视觉交付物的共同执行面。

它负责：

- 统一 deliverable 类型
- 统一 stage 主链路
- 统一基础 artifact 集合
- 统一 render / review / export 能力边界

第一批 family：

- `ppt_deck`
- `xiaohongshu`

这里要区分两个层次：

- `overlay id`
  - 运行时路由主键，例如当前代码里的 `ppt_deck`、`xiaohongshu`
- `deliverable kind`
  - 交付物语义类型，例如当前 `xiaohongshu` overlay 产出的 `xiaohongshu_note`

也就是说，family 负责的是“这是哪一类视觉交付物”，而不是“这一类对象的所有细分风格都混在一个大 prompt 里”。

### 3.2 Profile Pack

`profile pack` 定义同一 family 内部、面向不同任务场景的正式质量约束。

它负责：

- audience 与 communication mode
- review rubric
- gate policy
- slide/page family allowlist
- evidence density 与引用要求
- baseline 绑定方式
- export bundle 结构

`profile pack` 不是“人设文案”，而是正式生产协议。

它不应该只决定措辞风格，而应该决定：

- 什么样的结构可以过关
- 什么样的视觉密度会被打回
- 什么样的证据展示是必须的
- 什么样的导出物才算交付完成

### 3.3 Deliverable Contract

`deliverable contract` 是某次具体交付物在运行时最终解析出的执行协议。

它由三部分合成：

1. family 基础合同
2. profile pack 覆盖层
3. 单次任务实例参数

最终它必须解析成确定、可落盘、可审计的 surface：

- `stage-sequence`
- `review-surface`
- `layout-rules`
- `baseline-policy`
- `source-policy`
- `export-bundle`

这意味着 `Gateway` 和 `Runtime` 真正执行的不是“一个模糊的 PPT 请求”，而是“一个已经解析完成的 deliverable contract”。

## 4. `ppt_deck` 首批正式 profile pack

### 4.1 `lecture_student`

目标：

- 教会学生
- 降低理解门槛
- 让知识节奏稳定推进

核心 gate：

- 术语首次出现必须可解释
- 关键信息密度不能连续过载
- 图和结论必须服务于讲解顺序
- section 节奏要支持教学推进，而不是只堆事实

典型失败：

- 直接把论文图和摘要拼上去
- 每页信息过满
- 没有铺垫就跳到复杂结论

### 4.2 `lecture_peer`

目标：

- 向小同行解释问题、方法、证据与边界
- 让同行快速定位 novelty 与可信度

核心 gate：

- 问题定义与贡献必须早出现
- 证据页必须明确数据与方法边界
- 允许更高信息密度，但必须保持逻辑压缩
- 不能用大量教学式铺垫稀释专业主线

典型失败：

- 讲得太“科普”，没有同行价值
- 关键方法和限制条件写得过轻
- 结果页没有清楚说明证据成立条件

### 4.3 `executive_briefing`

目标：

- 让领导快速理解结论、影响和决策含义

核心 gate：

- 结论前置
- 决策含义必须明确
- 页数与层级必须显著压缩
- 不允许把学术证明过程整页搬进主 deck

典型失败：

- 用研究型叙事拖慢决策节奏
- 背景太长，结论太晚
- 页面过密，不能被快速扫描

### 4.4 `defense_deck`

目标：

- 服务正式答辩
- 支撑主张、方法、证据与质询应对

核心 gate：

- claim-evidence 对应关系必须完整
- 研究贡献、创新点与边界必须可追踪
- 预设问答与备份页必须纳入正式 bundle
- appendix / backup slides 不是附属物，而是答辩协议的一部分

典型失败：

- 主张链断裂
- 证据支撑不足
- 没有针对潜在质疑的备份页

## 5. `ppt_deck` 的 profile pack 应如何落盘

推荐把 profile pack 做成显式目录，而不是散落在 prompt 说明里：

```text
overlays/
  ppt_deck/
    family/
      stage-sequence.json
      review-surface.json
      layout-rules.json
      baseline-policy.json
      source-policy.json
      export-bundle.json
    profiles/
      lecture_student/
        manifest.json
        review-surface.override.json
        layout-rules.override.json
        source-policy.override.json
        export-bundle.override.json
      lecture_peer/
      executive_briefing/
      defense_deck/
```

其中：

- family 提供公共协议
- profile 只做显式 override
- 运行时必须把解析结果落为单次 deliverable 的 hydrated contract

不允许把关键差异藏在不可审计的 prompt 拼接里。

## 6. Gateway / Runtime 需要如何适配

### 6.1 Gateway 输入面

面向 Agent 的 `create_deliverable` / `run_route` 请求，应正式接受：

- `overlay`
- `profile_id`
- `goal`
- `baseline_deliverable_id`
- `audience`
- `delivery_mode`

其中 `overlay + profile_id` 决定主合同解析路径。

### 6.2 Gateway 解析职责

`Gateway` 在 runtime 执行前，必须完成这些动作：

- 验证 `overlay` 是否存在
- 验证 `profile_id` 是否属于该 family
- 装载 family 基础合同
- 装载 profile override
- 合成 hydrated deliverable contract
- 把 contract 引用写入 deliverable metadata

### 6.3 Runtime 职责边界

`Runtime` 继续保持中立，不负责判断“什么是好的学生课件”。

它负责：

- 执行解析后的 stage
- 落盘 artifact 与 gate report
- 记录 review loop
- 跟踪 checkpoint、resume 与 rerun

它不负责：

- 临时理解 profile 意图
- 用 prompt 猜测审核标准
- 事后修补 contract 中原本没定义的质量要求

## 7. `xiaohongshu` 在这套模型里的位置

`xiaohongshu` 应继续作为 `RedCube` 的正式 family 保留。

原因是它与 `ppt_deck` 共享：

- 视觉导演主链
- 页面/版面表达
- render / review / export runtime
- artifact store 与 event log

但在 `OPL` 顶层任务语义上，应谨慎区分：

- `ppt_deck`
  - 当前最直接承接 `Presentation Ops`
- `xiaohongshu`
  - 当前共享 runtime，但更接近未来的 `Communication Ops / Outreach Ops`

也就是说：

- `RedCube` 可以同时承载这两类 family
- `OPL` 不应把它们强行归并成同一个任务面

## 8. 对后续实现的直接约束

从这份设计冻结稿开始，后续实现应遵守：

1. 不再把 `ppt_deck` 视为单一风格对象
2. 不再把 profile 差异只写进 prompt 文案
3. 所有高价值 gate 必须进入显式 contract
4. `Gateway` 必须具备 family/profile 合同解析能力
5. `Runtime` 只执行 contract，不代替 overlay 做领域判断
6. `RedCube` 与 `OPL / Presentation Ops` 的关系必须在公开文档里保持一致

## 9. 当前一句话总结

最稳的设计表述是：

> `RedCube AI` 是视觉交付物的 agent-first runtime；`ppt_deck` 是其当前最直接承接 `Presentation Ops` 的 overlay family；同一 family 内部再由 `profile pack` 决定学生课、同行课、领导汇报、答辩稿等不同正式质量协议。
