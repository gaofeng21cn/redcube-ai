from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import *  # noqa: F403
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.fit_metrics import (
    native_quality_context,
    table_legibility_failures,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.scoring import (
    quality_checks,
    quality_issues,
)


def evaluate_native_slide_quality(native_shapes: list, primary_points: int) -> dict:
    context = native_quality_context(native_shapes, primary_points)
    checks = quality_checks(context)
    return {
        'checks': checks,
        'issues': quality_issues(checks, context),
        'metrics': quality_metrics(context, checks),
    }


def quality_metrics(context: dict, checks: dict) -> dict:
    slot_audit = context['slot_audit']
    content_depth = context['content_depth']
    grid_audit = context['grid_audit']
    return {
        'title_font_size': round(context['title_font_size'], 2),
        'min_body_font_pt': round(context['min_body_font_pt'], 2),
        'body_text_readability_floor_pt': MIN_NATIVE_BODY_FONT_PT,
        'body_text_readability_ok': context['body_text_readability_ok'],
        'body_text_font_failures': context['body_text_font_failures'],
        'typography_hierarchy_ratio': round(context['typography_hierarchy_ratio'], 4),
        'typography_hierarchy_ok': context['typography_hierarchy_ok'],
        'title_core_overlap_count': len(context['title_core_failures']),
        'title_core_overlap_failures': context['title_core_failures'],
        'text_char_count': context['text_char_count'],
        'block_count': len(context['content_shapes']),
        'decorative_shape_count': len(context['decorative_shapes']),
        'visual_support_shape_count': len(context['decorative_shapes']),
        'audience_content_slot_count': context['audience_slot_count'],
        'shape_count': len(context['native_shapes']),
        'shape_kind_count': len(context['shape_kinds']),
        'role_count': len(context['shape_roles']),
        'layout_richness_score': context['layout_richness_score'],
        'layout_variant': slot_audit['layout_variant'],
        'expected_slot_count': slot_audit['expected_slot_count'],
        'filled_slot_count': slot_audit['filled_slot_count'],
        'slot_fill_ok': slot_audit['slot_fill_ok'],
        'slot_fill_failures': slot_audit['slot_fill_failures'],
        'audience_label_readability_ok': len(context['label_failures']) == 0,
        'audience_label_font_floor_pt': MIN_AUDIENCE_LABEL_FONT_PT,
        'audience_label_readability_failures': context['label_failures'],
        'content_depth_ok': content_depth['content_depth_ok'],
        'content_depth_floor_chars': content_depth['content_depth_floor_chars'],
        'content_depth_failures': content_depth['content_depth_failures'],
        'grid_balance_ok': grid_audit['grid_balance_ok'],
        'grid_balance_ratio': grid_audit['grid_balance_ratio'],
        'grid_balance_failures': grid_audit['grid_balance_failures'],
        'composition_signature': context['composition_signature'],
        'title_underline_absent_ok': len(context['underline_failures']) == 0,
        'title_underline_failures': context['underline_failures'],
        'overlap_pairs': len(context['overlap_pairs']),
        'overlaps': context['overlap_pairs'],
        'structural_text_collision_count': len(context['structural_text_collisions']),
        'structural_text_collisions': context['structural_text_collisions'],
        'clipped_nodes': context['clipped_nodes'],
        'occupied_ratio': round(context['occupied_ratio'], 4),
        'primary_points': context['primary_points'],
        'edge_clearance': {key: round(value, 2) for key, value in context['edge_clearance'].items()},
        'block_content_failures': context['block_content_failures'],
        'bounds': [shape['bounds'] for shape in context['content_shapes']],
        'chart_count': len(context['chart_shapes']),
        'table_count': len(context['table_shapes']),
        'metric_grid_count': len(context['metric_grid_shapes']),
        'chart_metrics': context['chart_metrics'],
        'table_metrics': context['table_metrics'],
        'metric_grid_metrics': context['metric_grid_metrics'],
        'operator_language_fragments': context['language_fragments'],
        'title_safe_zone_failures': context['title_zone_failures'],
        'title_safe_zone_clearance_ok': len(context['title_zone_failures']) == 0,
        'table_min_font_pt': round(context['table_min_font_pt'], 2),
        'table_legibility_failures': context['table_failures'],
        'card_blank_ratio': round(context['card_blank_ratio'], 4),
        'chart_bounds': [shape['bounds'] for shape in context['chart_shapes']],
        'table_bounds': [shape['bounds'] for shape in context['table_shapes']],
        'metric_grid_bounds': [shape['bounds'] for shape in context['metric_grid_shapes']],
        'axis_label_count': axis_label_count(context['chart_metrics']),
        'legend_label_count': legend_label_count(context['chart_metrics']),
        'table_cell_fit_ok': len(context['table_cell_fit_failures']) == 0,
        'table_cell_fit_failures': context['table_cell_fit_failures'],
        'numeric_label_overflow_count': len(context['numeric_label_overflows']),
        'numeric_label_overflows': context['numeric_label_overflows'],
        'coordinate_determinism_hash': context['coordinate_determinism_hash'],
        'structural_visual_count': context['structural_visual_count'],
        'structural_visual_roles': [safe_text(shape.get('role')) for shape in context['structural_shapes']],
        'card_panel_count': context['card_panel_count'],
        'visual_structure_present': checks['visual_structure_present'],
        'non_text_visual_specific_ok': checks['non_text_visual_specific_ok'],
        'mechanical_card_template_detected': context['mechanical_card_template_detected'],
        'mechanical_card_template_absent': checks['mechanical_card_template_absent'],
        'panel_text_safe_area_ok': checks['panel_text_safe_area_ok'],
        'panel_text_safe_area_failures': context['panel_safe_area_failures'],
        'text_card_internal_padding_ok': checks['text_card_internal_padding_ok'],
        'text_card_internal_padding_failures': context['card_padding_failures'],
        'short_label_wrap_ok': checks['short_label_wrap_ok'],
        'short_label_wrap_failures': context['label_wrap_failures'],
    }


def axis_label_count(chart_metrics: list[dict]) -> int:
    return sum(int(metrics.get('axis_label_count') or 0) for metrics in chart_metrics)


def legend_label_count(chart_metrics: list[dict]) -> int:
    return sum(int(metrics.get('legend_label_count') or 0) for metrics in chart_metrics)
