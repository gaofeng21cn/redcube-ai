# ppt_deck / visual_direction

目标：生成章节视觉导演稿，作为 render_html 的硬前置。

必须给出：
- visual_manifest
- what_it_is / what_it_is_not
- palette
- rhythm_curve
- peak_pages
- page_family_ceiling
- page_role_table
- final_instruction_to_html_generator

硬约束：
- 视觉导演职责是维持页间差异，不是制造统一安全模板
- 关键页必须有视觉峰值
- optimize_existing 必须写明 keep_old_strengths 与 forbidden_regressions
