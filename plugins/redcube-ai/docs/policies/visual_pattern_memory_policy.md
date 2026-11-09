# 视觉模式记忆 Policy

Owner: `RedCube AI`
Purpose: `visual_pattern_memory_policy`
State: `current_policy`
Machine boundary: 人读 visual memory policy。机器真相继续归 `contracts/durable_knowledge_catalog.json`、OPL 统一 catalog / recall receipt、知识正文来源、StageRun artifacts、prompt packs、review artifacts、export bundles、canonical artifact indexes、owner receipts 和 tests。

这份 policy 固定 RCA visual pattern memory 的长期边界：视觉经验可以作为小规模、可追溯的自然语言记忆进入 AI author / reviewer 上下文，但不能变成布局配方引擎、隐藏模板、review/export verdict 或 artifact authority。

默认读法是 advisory-by-default：visual pattern memory 是 AI-readable Markdown / prose-first prompt context。它可以帮助 Codex 注意风格、密度、故事节奏、反复失败模式和修复预期；它不是 visual route scorer、layout controller、export gate、review-pass gate、artifact authority 或 production-readiness gate。

## 记忆形态

正确形态：

- prose-first visual pattern card；
- deliverable family、stage、audience、style、provenance 等最小标签；
- stage-scoped small retrieval；
- 从真实 `visual_director_review`、`screenshot_review`、export closeout 或 owner receipt 中提取可复用经验；
- writeback proposal、accepted/rejected receipt 和 locator projection 与 memory body 分离；
- canonical artifact、route truth、review/export verdict 和 owner receipt authority 继续留在 RCA owner surface。

禁止形态：

- universal layout recipe engine；
- visual route scorer 或 winning-layout generator；
- 代替 AI author artifact 生成正文、页面、视觉方向或 layout 的 hidden template；
- 仅靠 memory score、mechanical scorecard 或 projection 通过 visual acceptance；
- 把全部风格规则和历史失败全局塞回 prompt；
- 由 OPL、Agent Lab、product shell 或 generated wrapper 取得视觉经验的语义 ownership、accept/reject authority、route choice、review/export verdict、artifact mutation authority 或 owner receipt authority。

## 适合写入的内容

适合的 visual pattern memory：

- PPT / xiaohongshu / poster 对特定受众反复有效的 story rhythm；
- 信息密度、页面节奏、手机可读性、contact-sheet review 或系列一致性经验；
- 帮助 Codex 判断 tone、palette、typography、composition 或 route caveat 的风格说明；
- `visual_director_review` / `screenshot_review` 中反复出现的失败模式与 repair expectation；
- 何时优先 image-first、HTML 或 native PPT route 的经验性 caveat。

不适合写入 memory body 的内容：

- 当前 deliverable 的生成正文、slide/page content 或 canonical artifact body；
- 属于 `visual_director_review` 或 `screenshot_review` 的 review verdict；
- exportable、handoffable、publication projection 或 production readiness truth；
- PNG / PPTX / PDF / export bundle 的 canonical artifact state；
- 应归 route code、prompt pack、review gate 或 owner receipt 的确定性逻辑。

## 合同与状态

产品条目的身份、归属范围、内容性质和审阅期限见 `contracts/durable_knowledge_catalog.json`。用户与项目知识通过 Framework 来源绑定解析；通用理念以 [Framework 知识来源与记忆政策](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/knowledge-source-and-memory-policy.md) 为唯一说明，机器模型以[知识生命周期合同](https://github.com/gaofeng21cn/one-person-lab/blob/main/contracts/opl-framework/durable-knowledge-lifecycle-contract.json) 为准。当前实现状态见 [状态](../status.md)，真实交付中的接受与持续复用证据见 [未完成验收](../active/rca-ideal-state-gap-plan.md)。本 policy 负责视觉知识的领域判断。

## Stage 使用

Memory 只能小规模进入对应 stage：

- `source_intake`：只取影响视觉范围的 source / audience caveat。
- `communication_strategy`：取 story rhythm、audience framing 与信息层级经验。
- `visual_direction`：取 style、density、composition、route 与 asset-use caveat。
- `review_and_revision`：取 recurring visual failure mode 与 repair expectation。
- `package_and_handoff`：仅透传已有的非权威 proposal 并绑定 terminal export refs，不调用 Curator 或签 accept/reject。

Screenshot-review summary 可以产生一个可复用 proposal 或 `skip`；接受/拒绝是 export 后独立的 RCA memory-owner 动作，需真实 review、terminal export 与 provenance refs。

Memory 可以影响 prompt context 和 reviewer attention；它不能接受视觉结果、批准导出、选择 route、写 artifact body 或修改 canonical artifact。

缺少或陈旧 visual pattern memory 默认不阻断 source intake、communication strategy、visual direction exploration 或 candidate generation。它只在两类场景变成 hard blocker：输出试图用 memory ref 声明 review/export/handoff/production readiness，或 memory-derived action 会越过 artifact authority、owner receipt、source boundary、review/export gate。

## AI-first 边界

本 policy 扩展 [AI-first 质量边界 Policy](./ai_first_quality_boundary.md)。

Visual pattern memory 可以辅助 AI author 和 AI reviewer。它不把 story / visual / markup authorship 从 AI artifact 移到 pack、runtime、schema、audit、projection 或 deterministic code，也不允许这些机械面在缺少 AI-authored review evidence 时声明 final visual quality。

## OPL 边界

OPL 可以索引 memory refs、投影 consumed-memory provenance、承载 closeout writeback receipt refs 和 operator-visible locator projection。

OPL 不能：

- 决定 RCA visual pattern memory 正文的语义正确性；
- 写入 domain truth；
- 选择 RCA visual route；
- accept / reject memory writeback；
- 发出 quality verdict 或 review/export verdict；
- 写 artifact body；
- 授权 artifact authority、visual ready、exportable、handoffable、domain ready 或 production ready。
- 把 visual pattern memory refs 做成 visual route scorer、layout controller、review-pass gate、export gate 或 artifact-ready signal。

## 知识归属、正文来源与召回

| 归属范围 | RCA 中的例子 | 正文主源 |
|---|---|---|
| `product` | 通用视觉方法、证据与导出规则 | 产品 `agent/knowledge/`，按版本分发 |
| `owner` | 用户或团队的协作偏好、公开分享政策 | 已有个人/团队资料库；无库时使用工作区 Markdown |
| `topic` | 长期临床科普的表达经验、系列视觉偏好 | 用户维护的主题资料或工作目录中的主题正文 |
| `project` | 一个讲课课件的受众、风格选择与决策 | 该项目已选定的知识正文位置 |

归属范围与 `mechanism`、`policy`、`state`、`decision` 内容性质分开。当前交付状态和历史决策可以属于同一个项目，但不能共用永久有效的假设；观察时间、审阅期限和取代关系独立维护。

每个知识对象只有一个可编辑正文。已有 Obsidian 时按授权绑定现有笔记；没有个人库时直接绑定普通工作目录。来源可混合使用，不要求改造用户目录或先生成中间全文副本。讲稿、图片、PPTX、review artifacts 与不可再生的交付证据仍由项目保管，不随运行缓存清理。

Framework 在 StageRun 起点按权限、范围、任务和有效性解析所需原文，并为各质量角色固定同一份精确快照；公开状态只含引用、digest 和消费回执。快照留在平台运行状态中，工作区保存来源引用、提案和回执。知识身份不随路径改变；正文移动应更新来源定位，不能凭同名文件自动重绑定。

用户直接编辑主源后，受影响版本与派生摘要需要复核；已有维护授权可以承载常规复核。已撤销、过期或与当前源冲突的内容不以旧快照冒充当前事实。缺少可选视觉示例不阻断制作；若缺少任务必需的受众约束、允许公开的范围或来源许可，则暂停依赖这些信息的动作。真实发布或导出前重新核对其行动所需授权和关键约束。

RCA 判断经验是否成立、值得复用、接受在哪个范围，并持有接受回执。Framework 提供通用来源解析、版本核验和可恢复写入机制；接受后写回唯一原文，不建立 RCA 专用写回服务。并发编辑保留冲突版本，不能以最后写入覆盖。单项目经验只有在脱敏、补齐来源并重新审阅后才扩大用途；当前视觉结果、导出 verdict 和 owner receipt 仍由各自领域事实源证明。
