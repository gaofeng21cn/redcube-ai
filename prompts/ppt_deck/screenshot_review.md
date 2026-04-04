# ppt_deck / screenshot_review

目标：基于 render_html 产物逐页截图并完成 AI 原生截图质控的结构化落盘。

至少输出：
- overflow_free
- occlusion_free
- visual_density_ok
- speaker_fit_ok
- slide_reviews

硬约束：
- 这是 export 前硬闸门，不是软建议
- 必须保存逐页截图与 review 记录
- optimize_existing 必须做 baseline relative review，输出 baseline_comparison_passed
