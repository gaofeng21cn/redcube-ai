# repair_pptx_native

Use the latest screenshot review feedback to revise the existing PowerPoint-native deck. Target only blocked slides when the review surface identifies them, preserve passed slides, and emit an updated editable `.pptx` plus a repair log that records consumed feedback.

Treat operator-language leakage, title-safe-zone conflicts, table text below 11pt, and sparse oversized table/card containers as hard repair targets. Repair by changing the editable shape plan and native table/text geometry, not by hiding the issue in notes or reducing visible font size.
