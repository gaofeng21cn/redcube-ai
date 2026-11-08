# Native PPT 设计来源参考

本页只保存外部设计经验的出处和 RCA 的吸收理由。RCA 具体输入字段和约束归
`contracts/runtime-program/ppt-native-ai-first-design-pack.json`、
`contracts/runtime-program/ppt-native-python-engine-contract.json` 与
`agent/professional_skills/`；目标验收归 [native spec](../specs/native-ppt-ppt-master-parity.md)。
本页不重复维护字段清单或版本完成状态。

## 来源与取舍

| 来源 | 吸收的设计纪律 | RCA 落点 |
| --- | --- | --- |
| [ppt-master](https://github.com/hugohe3/ppt-master) | spec lock、逐页设计、原生对象、渲染后审阅 | Story Architect、Visual Director、Native PPT Designer；学习版本和逐项采用结论由 `ppt-master-learning-landing.json` 记录 |
| [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) | 显式对象和坐标、保存后 validate/issues/text 读回 | OfficeCLI materializer；不接管 RCA 创作、路线或审阅 |
| [agent-slides](https://agent-slides.com/)、[PPTAgent](https://github.com/icip-cas/PPTAgent)、[pptx-from-layouts](https://github.com/tristan-mcinnis/pptx-from-layouts-skill) | 模板/参考 deck 分析、semantic zones、placeholder capacity、render-grounded reflection | Template Profiler、template layout grammar 与每页 layout binding |
| [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)、[PPTist](https://github.com/pipipi-pikachu/PPTist) | 对象模型、masters、坐标、层级与编辑操作 | typed scene plan、真实 DrawingML/package readback；不引入第二 editor/runtime |
| [Presenton](https://github.com/presenton/presenton)、[dom-to-pptx](https://github.com/atharva9167j/dom-to-pptx) | 显式模板输入、布局与导出 fidelity 分开验证 | 设计输入与物化结果的差异检查；不替换 native authoring owner |
| [Marp](https://github.com/marp-team/marp-cli)、[Slidev](https://sli.dev/guide/exporting.html) | browser render、截图与导出证据 | 区分图像式 PPTX 和真正可编辑对象；Markdown 路线仅按明确请求采用 |

这些链接提供设计来源，不表示本仓依赖、当前安装或已通过对应上游的对照验收。
固定 benchmark 来源与最新学习版本分开保存在各自合同中，不随文档引用自动升级。

## 为什么前置设计

先确定 claim spine、每页任务、视觉层级与模板容量，再选择图表/对象和坐标，可以让
writer 只物化已经明确的设计。没有模板文件时，AI 仍需给出足够明确的 design system
和语义布局；有真实模板时，Template Profiler 负责 master/layout/placeholder 与
capacity，不能把模板只当背景图。

spec lock、deck rhythm、layout grammar 和 per-slide binding 支持跨页一致性与变化。
专业方法按当前页面任务选取，不要求每轮全量扫描所有设计注册项。具体缺失字段、
几何问题和结构线碰撞由 helper 返回准确 findings，AI 修复设计，helper 不自动重排或
替换模板。

## 可编辑性与视觉质量分别验收

原生声明必须有真实 text/shape/chart/table/picture 等对象及 package relationship
证据，不能靠输入标签或整页图片容器证明。真实编辑、重新保存和渲染检查用于发现
对象丢失、链接损坏、文字溢出、字体替换与数据变形。

OfficeCLI 检查和 LibreOffice/Poppler true render 提供机械证据；逐页 screenshots 与
contact sheet 供 AI 检查故事、层级、节奏和重复。PowerPoint 与第三 viewer 的实际
readback 另行支持跨 renderer 结论。数值阈值和固定 schema 回到合同，不在来源参考中
再维护一份。

质量问题进入有界 repair 和显式 quality debt，可读候选继续交付。未通过的 render、
缺失对象或不完整编辑证据关闭相应 ready/fidelity 声明；最终质量与导出接受仍需 RCA
owner 的独立 review/export 证据。Mock、provider completion、Agent Lab 分数和单个
样片不能替代真实验收。
