from redcube_ai.native_helpers.ppt_deck.native_quality_constants import *  # noqa: F403


ISSUE_RULES = [
    ('visual_density_ok', 'visual_density_out_of_range'),
    ('edge_clearance_ok', 'edge_clearance_out_of_range'),
    ('occlusion_free', 'occlusion_detected'),
    ('block_content_fit_ok', 'block_content_overflow_detected'),
    ('speaker_fit_ok', 'speaker_fit_exceeded'),
    ('title_typography_ok', 'title_typography_missing_or_too_small'),
    ('body_text_readability_ok', 'body_text_below_readability_floor'),
    ('typography_hierarchy_ok', 'typography_hierarchy_too_flat'),
    ('title_core_overlap_ok', 'title_core_overlap_detected'),
    ('page_number_consistency_ok', 'page_number_missing'),
    ('layout_richness_ok', 'layout_richness_below_threshold'),
    ('slot_fill_ok', 'native_slot_fill_failed'),
    ('audience_label_readability_ok', 'audience_label_below_readability_floor'),
    ('content_depth_ok', 'native_content_depth_failed'),
    ('grid_balance_ok', 'native_grid_balance_failed'),
    ('title_underline_absent_ok', 'title_underline_motif_detected'),
    ('external_audience_language_ok', 'operator_language_leak_detected'),
    ('title_safe_zone_clear', 'title_safe_zone_obstructed'),
    ('layout_density_ok', 'layout_density_too_sparse'),
    ('visual_structure_present', 'native_visual_structure_missing'),
    ('non_text_visual_specific_ok', 'native_non_text_visual_too_generic'),
    ('mechanical_card_template_absent', 'native_mechanical_card_template_detected'),
    ('panel_text_safe_area_ok', 'panel_text_safe_area_violation'),
    ('text_card_internal_padding_ok', 'text_card_internal_padding_too_small'),
    ('short_label_wrap_ok', 'short_label_unbalanced_wrap'),
]


def quality_checks(context: dict) -> dict:
    return {
        'overflow_free': context['clipped_nodes'] == 0,
        'occlusion_free': len(context['overlap_pairs']) == 0 and len(context['structural_text_collisions']) == 0,
        'visual_density_ok': (
            MIN_NATIVE_DENSITY <= context['occupied_ratio'] <= MAX_NATIVE_DENSITY
            and context['primary_points'] <= MAX_NATIVE_PRIMARY_POINTS
        ),
        'speaker_fit_ok': context['text_char_count'] <= 950,
        'edge_clearance_ok': min(context['edge_clearance'].values()) >= MIN_NATIVE_EDGE_CLEARANCE,
        'block_content_fit_ok': context['clipped_nodes'] == 0,
        'title_typography_ok': context['title_typography_ok'],
        'body_text_readability_ok': context['body_text_readability_ok'],
        'typography_hierarchy_ok': context['typography_hierarchy_ok'],
        'title_core_overlap_ok': len(context['title_core_failures']) == 0,
        'page_number_consistency_ok': context['page_number_consistency_ok'],
        'layout_richness_ok': context['layout_richness_score'] >= MIN_NATIVE_LAYOUT_RICHNESS,
        'slot_fill_ok': context['slot_audit']['slot_fill_ok'],
        'audience_label_readability_ok': len(context['label_failures']) == 0,
        'content_depth_ok': context['content_depth']['content_depth_ok'],
        'grid_balance_ok': context['grid_audit']['grid_balance_ok'],
        'title_underline_absent_ok': len(context['underline_failures']) == 0,
        'external_audience_language_ok': len(context['language_fragments']) == 0,
        'title_safe_zone_clear': len(context['title_zone_failures']) == 0,
        'table_legibility_ok': len(context['table_failures']) == 0,
        'layout_density_ok': (
            MIN_NATIVE_DENSITY <= context['occupied_ratio'] <= MAX_NATIVE_DENSITY
            and context['card_blank_ratio'] <= MAX_TABLE_CELL_BLANK_RATIO
        ),
        'visual_structure_present': context['structural_visual_count'] >= 1,
        'non_text_visual_specific_ok': context['structural_visual_count'] >= 1,
        'mechanical_card_template_absent': not context['mechanical_card_template_detected'],
        'panel_text_safe_area_ok': len(context['panel_safe_area_failures']) == 0,
        'text_card_internal_padding_ok': len(context['card_padding_failures']) == 0,
        'short_label_wrap_ok': len(context['label_wrap_failures']) == 0,
    }


def quality_issues(checks: dict, context: dict) -> list[str]:
    issues = [
        issue
        for check, issue in ISSUE_RULES
        if not checks[check]
    ]
    if context['structural_text_collisions']:
        issues.append('structural_text_collision_detected')
    if any(failure.get('reason') == 'table_font_below_minimum' for failure in context['table_failures']):
        issues.append('table_font_below_minimum')
    if context['table_failures'] and 'table_font_below_minimum' not in issues:
        issues.append('table_cell_fit_failed')
    return issues
