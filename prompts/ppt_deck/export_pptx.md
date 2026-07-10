# ppt_deck / export_pptx

目标：在 screenshot_review 通过后，把 deck 真实导出为 PPTX（必要时带 PDF 与讲者备注）。

硬约束：
- 没有通过的 screenshot_review 不得继续
- 真实生成 pptx 文件，不得用 metadata 冒充
- 必须记录 source_html / source_review / real_conversion_invocation / page_count_match
- native PPTX 必须携带最终 package/object readback、notes/transition/timing evidence refs，并证明声明对象没有退化为 generic rectangles
- visual memory 仅在已有 review/export evidence 时生成 proposal ref；缺少可复用 memory 不得阻断已通过 review 的导出，也不得由本 route 自签 accept/reject receipt
