# ppt_deck / export_pptx

目标：按 package_and_handoff 阶段合同，把当前最佳可读 deck 导出为 PPTX（必要时带 PDF 与讲者备注），区分候选交付与正式批准。

硬约束：
- screenshot_review 未通过时，候选可携带明确质量债继续；无可读产物时物化 no-output diagnostic。正式 visual/export/handoff-ready 声明仍须独立 Review 与 RCA owner receipt，不能由导出动作签发。
- 真实生成 pptx 文件，不得用 metadata 冒充
- 记录所选路线的真实 source refs、source_review、real_conversion_invocation 和 page_count_match；image/native 路线不伪造 source_html。
- native PPTX 必须携带最终 package/object readback、notes/transition/timing evidence refs，并证明声明对象没有退化为 generic rectangles
- 按RCA reviewer的最终文件方法，分别核对当前渲染、审阅引用、候选包和每个约定交付副本；检查实际页序、媒体、备注、隐藏幻灯片与适用平台的文件可见性。二维码证据绑定最终使用图，不以原二维码可扫替代。
- 源码或网页更新不证明PPTX已经同步；候选须先完成适用Review与owner授权才替换认可产物。包完整性、第三方导入、媒体等价和原生PowerPoint播放分别报告，未实测的层面保持未验证。
- visual memory 只条件式透传 screenshot_review 已有的 non-authority proposal candidate，并绑定终态 review/export refs；没有 candidate 直接记录 `skip`，不得新生成 proposal、阻断导出或自签 accept/reject receipt
