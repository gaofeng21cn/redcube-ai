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
固定 benchmark 来源与最新学习版本分开保存在各自合同中，不随文档引用自动升级；设计工作流与跨层质量验收边界分归 [AI-first 质量边界](../policies/ai_first_quality_boundary.md) 与 [native spec](../specs/native-ppt-ppt-master-parity.md)。
