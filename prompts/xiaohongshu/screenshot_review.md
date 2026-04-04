# xiaohongshu / screenshot_review

在导出/发布前做视觉质控复核。
要求：
- 逐页截图
- 检查 overflow / occlusion / visual density / cover density / anti-template
- optimize_existing 时输出 baseline_comparison_passed
- 阻断问题未清零前不得进入 publish_copy / export_bundle
