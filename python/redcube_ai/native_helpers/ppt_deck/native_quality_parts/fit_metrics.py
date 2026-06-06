import hashlib
import json

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import *  # noqa: F403
from redcube_ai.native_helpers.ppt_deck.native_quality_text_safety import (
    panel_text_safe_area_failures,
    text_card_internal_padding_failures,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.geometry import (
    clamp,
    rect_overlap_area,
    rect_union_area,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.layout_slots import (
    content_slot_shapes,
    grid_balance_audit,
    slot_fill_audit,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.text_validation import (
    audience_label_readability_failures,
    content_depth_audit,
    operator_language_fragments,
    readable_body_text_shapes,
    short_label_wrap_failures,
    text_capacity_failure,
    title_core_overlap_failures,
    title_safe_zone_failures,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.visual_validation import (
    composition_signature,
    generic_overlap_excluded,
    mechanical_card_panel_count,
    structural_text_collision_failures,
    structural_visual_shapes,
    title_underline_failures,
)


def table_legibility_failures(table_metrics: list[dict]) -> list[dict]:
    failures = []
    for metrics in table_metrics:
        min_font_pt = float(metrics.get('min_font_pt') or 0.0)
        max_blank_ratio = float(metrics.get('max_cell_blank_ratio') or 0.0)
        if min_font_pt < MIN_TABLE_BODY_FONT_PT:
            failures.append({
                'shape_id': metrics.get('shape_id'),
                'reason': 'table_font_below_minimum',
                'value': round(min_font_pt, 2),
                'threshold': MIN_TABLE_BODY_FONT_PT,
            })
        if max_blank_ratio > MAX_TABLE_CELL_BLANK_RATIO:
            failures.append({
                'shape_id': metrics.get('shape_id'),
                'reason': 'table_cell_blank_ratio_too_high',
                'value': round(max_blank_ratio, 4),
                'threshold': MAX_TABLE_CELL_BLANK_RATIO,
            })
        failures.extend(metrics.get('cell_fit_failures') or [])
    return failures


def native_quality_context(native_shapes: list, primary_points: int) -> dict:
    content_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'content']
    decorative_shapes = [
        shape for shape in native_shapes
        if shape.get('quality_role') in {'decorative', 'structural'}
    ]
    typography = native_typography_metrics(native_shapes)
    embedded = embedded_visual_metrics(native_shapes)
    structural_shapes = structural_visual_shapes(native_shapes)
    structural_visual_count = len(structural_shapes)
    audience_slot_count = len(content_slot_shapes(native_shapes))
    card_panel_count = mechanical_card_panel_count(native_shapes)

    context = {
        'native_shapes': native_shapes,
        'primary_points': primary_points,
        'content_shapes': content_shapes,
        'decorative_shapes': decorative_shapes,
        'shape_kinds': {safe_text(shape.get('kind')) for shape in native_shapes if safe_text(shape.get('kind'))},
        'shape_roles': {safe_text(shape.get('role')) for shape in native_shapes if safe_text(shape.get('role'))},
        'page_number_consistency_ok': has_page_number(native_shapes),
        'occupied_ratio': occupied_ratio(content_shapes),
        'edge_clearance': edge_clearance(content_shapes),
        'overlap_pairs': content_overlap_pairs(content_shapes),
        'block_content_failures': [
            failure for failure in (text_capacity_failure(shape) for shape in content_shapes)
            if failure
        ],
        'language_fragments': operator_language_fragments(content_shapes),
        'title_zone_failures': title_safe_zone_failures(content_shapes),
        'title_core_failures': title_core_overlap_failures(content_shapes),
        'structural_text_collisions': structural_text_collision_failures(native_shapes),
        'panel_safe_area_failures': panel_text_safe_area_failures(native_shapes),
        'card_padding_failures': text_card_internal_padding_failures(native_shapes),
        'label_wrap_failures': short_label_wrap_failures(native_shapes),
        'slot_audit': slot_fill_audit(native_shapes, primary_points),
        'label_failures': audience_label_readability_failures(content_shapes),
        'content_depth': content_depth_audit(content_shapes),
        'grid_audit': grid_balance_audit(native_shapes),
        'underline_failures': title_underline_failures(native_shapes),
        'structural_shapes': structural_shapes,
        'structural_visual_count': structural_visual_count,
        'card_panel_count': card_panel_count,
        'audience_slot_count': audience_slot_count,
        'mechanical_card_template_detected': (
            card_panel_count >= 2
            and audience_slot_count >= 2
            and structural_visual_count < 1
        ),
        'composition_signature': composition_signature(native_shapes),
        'coordinate_determinism_hash': coordinate_determinism_hash(native_shapes),
    }
    context.update(typography)
    context.update(embedded)
    context['text_char_count'] = sum(len(safe_text(shape.get('text'))) for shape in content_shapes)
    context['clipped_nodes'] = len(context['block_content_failures'])
    context['title_typography_ok'] = context['typography_hierarchy_ok']
    context['layout_richness_score'] = layout_richness_score(
        native_shapes,
        context['shape_kinds'],
        context['shape_roles'],
        decorative_shapes,
    )
    context['table_failures'] = table_legibility_failures(context['table_metrics'])
    return context


def native_typography_metrics(native_shapes: list[dict]) -> dict:
    title_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    title_font_size = max((float(shape.get('font_size') or 0) for shape in title_shapes), default=0.0)
    body_text_shapes = readable_body_text_shapes(native_shapes)
    body_font_sizes = [float(shape.get('font_size') or 0.0) for shape in body_text_shapes]
    min_body_font_pt = min(body_font_sizes, default=0.0)
    body_text_font_failures = [
        {
            'shape_id': shape.get('shape_id'),
            'role': shape.get('role'),
            'font_size': round(float(shape.get('font_size') or 0.0), 2),
            'threshold': MIN_NATIVE_BODY_FONT_PT,
        }
        for shape in body_text_shapes
        if float(shape.get('font_size') or 0.0) < MIN_NATIVE_BODY_FONT_PT
    ]
    typography_hierarchy_ratio = title_font_size / min_body_font_pt if min_body_font_pt > 0 else 0.0
    return {
        'title_font_size': title_font_size,
        'min_body_font_pt': min_body_font_pt,
        'body_text_readability_ok': bool(body_font_sizes) and not body_text_font_failures,
        'body_text_font_failures': body_text_font_failures,
        'typography_hierarchy_ratio': typography_hierarchy_ratio,
        'typography_hierarchy_ok': (
            bool(title_shapes)
            and title_font_size >= MIN_NATIVE_TITLE_FONT_PT
            and typography_hierarchy_ratio >= MIN_NATIVE_TYPOGRAPHY_HIERARCHY_RATIO
        ),
    }


def has_page_number(native_shapes: list[dict]) -> bool:
    return any(
        shape.get('role') in {'page_number', 'page_no', 'page'} and safe_text(shape.get('text'))
        for shape in native_shapes
    )


def occupied_ratio(content_shapes: list[dict]) -> float:
    occupied_area = rect_union_area([shape['bounds'] for shape in content_shapes])
    return clamp(occupied_area / FRAME_AREA, 0.0, 1.0)


def edge_clearance(content_shapes: list[dict]) -> dict:
    if not content_shapes:
        return {'left': 0.0, 'top': 0.0, 'right': 0.0, 'bottom': 0.0}
    return {
        'left': min(float(shape['bounds']['left']) for shape in content_shapes),
        'top': min(float(shape['bounds']['top']) for shape in content_shapes),
        'right': min(CANVAS_PX[0] - float(shape['bounds']['right']) for shape in content_shapes),
        'bottom': min(CANVAS_PX[1] - float(shape['bounds']['bottom']) for shape in content_shapes),
    }


def content_overlap_pairs(content_shapes: list[dict]) -> list[dict]:
    overlap_shapes = [
        shape for shape in content_shapes
        if shape.get('kind') == 'text_box'
        and safe_text(shape.get('role')) not in SYSTEM_MAP_CONTENT_ROLES
    ]
    overlap_pairs = []
    for left_index, shape_a in enumerate(overlap_shapes):
        for shape_b in overlap_shapes[left_index + 1:]:
            overlap = content_overlap_pair(shape_a, shape_b)
            if overlap:
                overlap_pairs.append(overlap)
    return overlap_pairs


def content_overlap_pair(shape_a: dict, shape_b: dict) -> dict | None:
    if generic_overlap_excluded(shape_a, shape_b):
        return None
    overlap_area = rect_overlap_area(shape_a['bounds'], shape_b['bounds'])
    if overlap_area <= 12.0:
        return None
    return {
        'a': shape_a.get('shape_id'),
        'b': shape_b.get('shape_id'),
        'overlap_area': round(overlap_area, 2),
    }


def embedded_visual_metrics(native_shapes: list[dict]) -> dict:
    chart_shapes = [shape for shape in native_shapes if shape.get('kind') == 'chart']
    table_shapes = [shape for shape in native_shapes if shape.get('kind') == 'table']
    metric_grid_shapes = [shape for shape in native_shapes if shape.get('kind') == 'metric_grid']
    chart_metrics = metrics_for_shapes(chart_shapes)
    table_metrics = metrics_for_shapes(table_shapes)
    metric_grid_metrics = metrics_for_shapes(metric_grid_shapes)
    return {
        'chart_shapes': chart_shapes,
        'table_shapes': table_shapes,
        'metric_grid_shapes': metric_grid_shapes,
        'chart_metrics': chart_metrics,
        'table_metrics': table_metrics,
        'metric_grid_metrics': metric_grid_metrics,
        'numeric_label_overflows': [
            overflow
            for metrics in [*chart_metrics, *metric_grid_metrics]
            for overflow in (metrics.get('numeric_label_overflows') or [])
        ],
        'table_cell_fit_failures': [
            failure
            for metrics in table_metrics
            for failure in (metrics.get('cell_fit_failures') or [])
        ],
        'table_min_font_pt': min(
            (float(metrics.get('min_font_pt') or MIN_TABLE_BODY_FONT_PT) for metrics in table_metrics),
            default=MIN_TABLE_BODY_FONT_PT,
        ),
        'card_blank_ratio': max(
            (float(metrics.get('max_cell_blank_ratio') or 0.0) for metrics in table_metrics),
            default=0.24,
        ),
    }


def metrics_for_shapes(shapes: list[dict]) -> list[dict]:
    metrics_list = []
    for shape in shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        metrics_list.append(metrics)
    return metrics_list


def coordinate_determinism_hash(native_shapes: list[dict]) -> str:
    coordinate_payload = [
        {
            'shape_id': shape.get('shape_id'),
            'kind': shape.get('kind'),
            'role': shape.get('role'),
            'bounds': shape.get('bounds'),
        }
        for shape in native_shapes
    ]
    return hashlib.sha256(
        json.dumps(coordinate_payload, ensure_ascii=False, sort_keys=True).encode('utf-8')
    ).hexdigest()


def layout_richness_score(
    native_shapes: list[dict],
    shape_kinds: set[str],
    shape_roles: set[str],
    decorative_shapes: list[dict],
) -> float:
    return round(clamp(
        (min(len(native_shapes), 20) / 20.0 * 0.34)
        + (min(len(shape_kinds), 4) / 4.0 * 0.22)
        + (min(len(shape_roles), 10) / 10.0 * 0.22)
        + (min(len(decorative_shapes), 7) / 7.0 * 0.22),
        0.0,
        1.0,
    ), 4)
