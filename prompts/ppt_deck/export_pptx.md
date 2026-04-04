# ppt_deck / export_pptx

目标：在 screenshot_review 通过后，把 deck 真实导出为 PPTX（必要时带 PDF 与讲者备注）。

硬约束：
- 没有通过的 screenshot_review 不得继续
- 真实生成 pptx 文件，不得用 metadata 冒充
- 必须记录 source_html / source_review / real_conversion_invocation / page_count_match
