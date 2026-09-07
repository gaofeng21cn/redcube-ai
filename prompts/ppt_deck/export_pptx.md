# ppt_deck / export_pptx

目标：按 package_and_handoff 阶段合同，把当前最佳可读 deck 导出为 PPTX（必要时带 PDF 与讲者备注），区分候选交付与正式批准。

硬约束：
- screenshot_review 未通过时，候选可携带明确质量债继续；无可读产物时物化 no-output diagnostic。正式 visual/export/handoff-ready 声明仍须独立 Review 与 RCA owner receipt，不能由导出动作签发。
- 真实生成 pptx 文件，不得用 metadata 冒充
- 记录所选路线的真实 source refs、source_review、real_conversion_invocation 和 page_count_match；image/native 路线不伪造 source_html。
- native PPTX 必须携带最终 package/object readback、notes/transition/timing evidence refs，并证明声明对象没有退化为 generic rectangles
- visual memory 只条件式透传 screenshot_review 已有的 non-authority proposal candidate，并绑定终态 review/export refs；没有 candidate 直接记录 `skip`，不得新生成 proposal、阻断导出或自签 accept/reject receipt
