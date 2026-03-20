# 03_HTML生成说明

## 输入来源
- 单篇策划文件：{{路径}}
- 信息图大纲文件：{{路径}}
- 视觉导演稿文件：{{路径；无则填none}}
- 原始材料：{{路径列表}}
- 参考来源清单：{{reference_source_list}}
- 禁止来源命中数：{{forbidden_source_hit_count}}

## 上游输入完整性门禁（阶段3A，强制）
- outline_gate_pass：{{true/false}}
- total_pages：{{页数}}
- layout_plan_row_count：{{行数}}
- page_block_count：{{页块数}}
- required_field_coverage：{{0-1}}
- avg_keypoints_per_page：{{数值}}
- unique_layout_prototype_count：{{数值}}
- max_consecutive_same_layout：{{数值}}
- short_page_count：{{数值}}
- bottom_half_module_defined_rate：{{0-1}}
- critical_pages：{{如P2-P7}}
- critical_page_bottom_module_defined_rate：{{0-1}}
- critical_page_top_heavy_predicted_count：{{数值}}
- action_primitive_defined_rate：{{0-1}}
- high_risk_action_page_count：{{数值}}
- failed_rules：{{若无填none}}
- rewrite_action：{{若无填none}}

## 生成配置
- 风格模式：{{专业版/活泼版}}
- 目标页数：{{页数}}
- HTML文件名：{{文件名}}
- 生成模式：{{大语言模型逐页直写HTML}}
- 视觉导演摘要：{{如：强手账感 + 专业信息骨架 / 批注式专题笔记}}
- visual_world_card：{{主题隐喻+情绪曲线+视觉母题}}
- layout_plan页级总表：{{每页原型ID+主视觉动作+镜头焦点+结构禁复用约束}}
- 页面差异清单：{{逐页差异摘要}}
- 外壳/内容分层：{{通过/不通过}}
- expected_export_page_count：{{预期导出页数}}

## 硬约束检查
- 3:4画幅无溢出：{{通过/不通过}}
- 无外部图片：{{通过/不通过}}
- 无左右分栏对比：{{通过/不通过}}
- 封面完整署名：{{通过/不通过}}
- 结尾完整署名：{{通过/不通过}}
- 流程术语渗出（正文）：{{0次/不通过}}
- 模板字符串安全检查：
  - js_template_literal_used：{{true/false}}
  - raw_backtick_in_content_count：{{数值}}
  - handling_rule：{{使用<code>元素 / 不适用}}

## 质量门禁检查（无CLI）
- 最小结构门禁：
  - unique_layout_count：{{数值}}
  - max_consecutive_same_layout：{{数值}}
  - card_stack_ratio：{{数值}}
  - 阈值判定：{{通过/不通过}}
- 反模板诊断信号（生成期）：
  - max_empty_zone_ratio：{{数值}}
  - header_list_footer_repeat_count：{{数值}}
  - hero_anchor_coverage_ratio：{{数值}}
  - 处理结论：{{无需重写/已重写第X页}}
- 主视觉动作落地门禁（强制）：
  - action_realization_rate：{{数值}}
  - semantic_action_match_fail_count：{{数值}}
  - diagram_primitive_page_count：{{数值}}
  - plain_card_fallback_page_count：{{数值}}
  - 阈值判定：{{通过/不通过}}
- 版面均衡门禁（强制）：
  - bottom_half_content_ratio：{{数值}}
  - top_bottom_balance_delta：{{数值}}
  - top_heavy_page_count：{{数值}}
  - top_heavy_pages：{{页码列表}}
  - 阈值判定：{{通过/不通过}}
- 关键机制页零容忍门禁（强制）：
  - critical_pages：{{如P2-P7}}
  - critical_top_heavy_page_count：{{数值}}
  - critical_bottom_module_coverage：{{百分比}}
  - critical_balance_table：{{P2: top/mid/bottom + 下半区模块；...}}
  - 阈值判定：{{通过/不通过}}
- 视觉质感评分（1-5）：
  - narrative_cohesion_score：{{分数}}
  - visual_consistency_score：{{分数}}
  - rhythm_variety_score：{{分数}}
  - anti_template_score：{{分数}}
  - 平均分：{{分数}}
  - 阈值判定：{{通过/不通过}}
- Demo对齐（如有）：
  - demo_style_anchor_hit_count：{{数值或不适用}}
  - demo_style_anchor_notes：{{要点或不适用}}
- 每页骨架签名表：{{P1: ..., P2: ...}}
- 每页动作落地映射：{{P1: 动作->原语, P2: 动作->原语 ...}}
- 多模态质控复核文件：{{`05_视觉质控复核.md` 路径}}
- 导出一致性检查：
  - expected_export_page_count：{{页数}}
  - actual_export_page_count：{{页数}}
  - page_count_match：{{true/false}}
  - png_directory_clean：{{true/false}}
  - stale_png_handling：{{无 / 已清理 / 已排除旧页并记录}}
- 返工根因判断：
  - root_cause_category：{{如：模板字符串断裂 / 旧PNG污染 / 排版问题 / 样式资源问题 / 无}}
  - root_cause_notes：{{摘要}}

## 视觉总监复盘（强制）
- 是否仍像“安全产品页/卡片页”：{{是/否}}
- 手账感是否真正承载信息：{{是/否}}
- 是否存在“装饰很多但信息不稳”的页面：{{页码或无}}
- 导演意图落地最好的页面：{{页码列表}}
- 导演意图落地最弱的页面：{{页码列表}}
- 复盘后重写动作：{{无 / 重写P? / 只重排视觉层}}

## 截图后 AI 质控返工记录（强制）
- 复核主体：{{AI 多模态逐页复核}}
- 复核轮次：{{R1/R2/...}}
- R1 阻断问题：{{页码 + 问题；无则填none}}
- R1 建议优化：{{页码 + 摘要；无则填none}}
- R1 页数一致性：{{通过/不通过}}
- R1 目录洁净结果：{{通过/不通过}}
- HTML 返工页码：{{页码；无则填none}}
- 返工摘要：{{仅改视觉层/调整字号/重排底部模块/移动批注等}}
- 重导结果：{{已重导X页PNG / 无需重导}}
- 最终阻断问题清零：{{true/false}}
- 与 `05_视觉质控复核.md` 一致性：{{已对齐/待补}}

## 说明
{{必要补充}}
