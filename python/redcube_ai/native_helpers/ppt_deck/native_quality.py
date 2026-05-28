import hashlib
import json
import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text


from redcube_ai.native_helpers.ppt_deck.native_quality_constants import *  # noqa: F403


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def rect_overlap_area(rect_a: dict, rect_b: dict) -> float:
    overlap_w = max(0.0, min(rect_a['right'], rect_b['right']) - max(rect_a['left'], rect_b['left']))
    overlap_h = max(0.0, min(rect_a['bottom'], rect_b['bottom']) - max(rect_a['top'], rect_b['top']))
    return overlap_w * overlap_h


def rect_union_area(rects: list[dict]) -> float:
    if not rects:
        return 0.0
    x_edges = sorted({
        float(rect[key])
        for rect in rects
        for key in ('left', 'right')
    })
    y_edges = sorted({
        float(rect[key])
        for rect in rects
        for key in ('top', 'bottom')
    })
    area = 0.0
    for x_index, left in enumerate(x_edges[:-1]):
        right = x_edges[x_index + 1]
        if right <= left:
            continue
        for y_index, top in enumerate(y_edges[:-1]):
            bottom = y_edges[y_index + 1]
            if bottom <= top:
                continue
            center_x = (left + right) / 2.0
            center_y = (top + bottom) / 2.0
            if any(
                float(rect['left']) <= center_x <= float(rect['right'])
                and float(rect['top']) <= center_y <= float(rect['bottom'])
                for rect in rects
            ):
                area += (right - left) * (bottom - top)
    return area


def weighted_text_width_px(text: str, font_size: float) -> float:
    width = 0.0
    for char in safe_text(text):
        codepoint = ord(char)
        if char.isspace():
            width += font_size * 0.32
        elif codepoint > 127:
            width += font_size * 0.95
        elif char.isupper():
            width += font_size * 0.68
        elif char in {'-', '/', ':'}:
            width += font_size * 0.38
        else:
            width += font_size * 0.56
    return width


def text_capacity_failure(shape: dict) -> dict | None:
    if shape.get('kind') in {'chart', 'table', 'metric_grid'}:
        return None
    text = safe_text(shape.get('text'))
    if not text:
        return None
    rect = shape.get('bounds') or {}
    width = float(rect.get('width') or 0)
    height = float(rect.get('height') or 0)
    font_size = float(shape.get('font_size') or 14)
    estimated_lines = max(1, math.ceil(weighted_text_width_px(text, font_size) / max(width - 12.0, 1.0)))
    max_lines = max(1, int(height / max(font_size * 1.16, 1)))
    if estimated_lines <= max_lines:
        return None
    return {
        'shape_id': shape.get('shape_id'),
        'overflow_reason': 'native_text_capacity_exceeded',
        'text_char_count': len(text),
        'estimated_lines': estimated_lines,
        'max_lines': max_lines,
    }


def normalized_text_char_count(text: str) -> int:
    return sum(1 for char in safe_text(text) if not char.isspace() and char not in {'，', '。', '、', ',', '.', ':', '：', ';', '；'})


def text_shape_estimated_lines(shape: dict) -> int:
    rect = shape.get('bounds') or {}
    width = float(rect.get('width') or 0.0)
    font_size = float(shape.get('font_size') or 14.0)
    text = safe_text(shape.get('text'))
    if not text:
        return 0
    return max(1, math.ceil(weighted_text_width_px(text, font_size) / max(width - (2 * MIN_NATIVE_TEXT_PANEL_INSET_PX), 1.0)))


def panel_text_safe_area_failures(native_shapes: list[dict]) -> list[dict]:
    panels = [
        shape for shape in native_shapes
        if safe_text(shape.get('role')) in {'content_panel', 'input_panel', 'source_panel'}
        and shape.get('kind') in {'rect', 'rounded_rect'}
    ]
    text_shapes = [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and shape.get('kind') == 'text_box'
        and safe_text(shape.get('text'))
    ]
    failures = []
    for panel in panels:
        panel_rect = panel.get('bounds') or {}
        safe_left = float(panel_rect.get('left') or 0.0) + MIN_NATIVE_TEXT_PANEL_INSET_PX
        safe_top = float(panel_rect.get('top') or 0.0) + MIN_NATIVE_TEXT_PANEL_INSET_PX
        safe_right = float(panel_rect.get('right') or 0.0) - MIN_NATIVE_TEXT_PANEL_INSET_PX
        safe_bottom = float(panel_rect.get('bottom') or 0.0) - MIN_NATIVE_TEXT_PANEL_INSET_PX
        for text_shape in text_shapes:
            text_rect = text_shape.get('bounds') or {}
            center_x = float(text_rect.get('left') or 0.0) + (float(text_rect.get('width') or 0.0) / 2.0)
            center_y = float(text_rect.get('top') or 0.0) + (float(text_rect.get('height') or 0.0) / 2.0)
            if not (
                float(panel_rect.get('left') or 0.0) <= center_x <= float(panel_rect.get('right') or 0.0)
                and float(panel_rect.get('top') or 0.0) <= center_y <= float(panel_rect.get('bottom') or 0.0)
            ):
                continue
            text_right = float(text_rect.get('right') or 0.0)
            text_bottom = float(text_rect.get('bottom') or 0.0)
            if (
                float(text_rect.get('left') or 0.0) >= safe_left
                and float(text_rect.get('top') or 0.0) >= safe_top
                and text_right <= safe_right
                and text_bottom <= safe_bottom
            ):
                continue
            failures.append({
                'shape_id': text_shape.get('shape_id'),
                'panel_shape_id': panel.get('shape_id'),
                'role': text_shape.get('role'),
                'required_inset_px': MIN_NATIVE_TEXT_PANEL_INSET_PX,
            })
    return failures


def short_label_wrap_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        role = safe_text(shape.get('role'))
        if role not in {'route_label', 'gate_card'}:
            continue
        text = safe_text(shape.get('text'))
        if not text:
            continue
        if normalized_text_char_count(text) > 22:
            continue
        estimated_lines = text_shape_estimated_lines(shape)
        if estimated_lines <= 1:
            continue
        rect = shape.get('bounds') or {}
        failures.append({
            'shape_id': shape.get('shape_id'),
            'role': role,
            'estimated_lines': estimated_lines,
            'width': round(float(rect.get('width') or 0.0), 2),
            'reason': 'native_short_label_unbalanced_wrap',
        })
    return failures


def operator_language_fragments(native_shapes: list[dict]) -> list[str]:
    visible_text = '\n'.join(
        safe_text(shape.get('text'))
        for shape in native_shapes
        if shape.get('quality_role') == 'content'
    )
    return sorted({fragment for fragment in OPERATOR_LANGUAGE_FRAGMENTS if fragment in visible_text})


def title_safe_zone_shape(shape: dict) -> bool:
    if shape.get('quality_role') != 'content':
        return False
    if shape.get('role') in {'title', 'core_sentence'}:
        return False
    if safe_text(shape.get('text')):
        return True
    return shape.get('kind') in {'chart', 'table', 'metric_grid'}


def title_safe_zone_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        if not title_safe_zone_shape(shape):
            continue
        rect = shape.get('bounds') or {}
        top = float(rect.get('top') or 0.0)
        if top < TITLE_SAFE_ZONE_BOTTOM:
            failures.append({
                'shape_id': shape.get('shape_id'),
                'role': shape.get('role'),
                'top': round(top, 2),
                'safe_zone_bottom': TITLE_SAFE_ZONE_BOTTOM,
            })
    return failures


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


def readable_body_text_shapes(native_shapes: list[dict]) -> list[dict]:
    excluded_roles = {
        'title',
        'core_sentence',
        'subtitle',
        *AUXILIARY_TEXT_ROLES,
        'page_number',
        'point_index',
        'metric_label',
        'layout_rail',
        'accent_rule',
        'accent_dot',
        'accent_chip',
        'connector',
    }
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and shape.get('kind') == 'text_box'
        and safe_text(shape.get('text'))
        and safe_text(shape.get('role')) not in excluded_roles
        and safe_text(shape.get('role')) not in SYSTEM_MAP_CONTENT_ROLES
    ]


def text_shape_bottom(shape: dict) -> float:
    rect = shape.get('bounds') or {}
    top = float(rect.get('top') or 0.0)
    width = float(rect.get('width') or 0.0)
    height = float(rect.get('height') or 0.0)
    font_size = float(shape.get('font_size') or 14.0)
    text = safe_text(shape.get('text'))
    estimated_lines = max(1, math.ceil(weighted_text_width_px(text, font_size) / max(width - 12.0, 1.0)))
    estimated_height = estimated_lines * font_size * 1.16
    return top + min(height, estimated_height)


def title_core_overlap_failures(native_shapes: list[dict]) -> list[dict]:
    title_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    core_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'core_sentence' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    failures = []
    for title_shape in title_shapes:
        title_bottom = text_shape_bottom(title_shape)
        title_rect = title_shape.get('bounds') or {}
        title_left = float(title_rect.get('left') or 0.0)
        title_right = float(title_rect.get('right') or 0.0)
        for core_shape in core_shapes:
            core_rect = core_shape.get('bounds') or {}
            core_top = float(core_rect.get('top') or 0.0)
            core_left = float(core_rect.get('left') or 0.0)
            core_right = float(core_rect.get('right') or 0.0)
            horizontal_overlap = min(title_right, core_right) - max(title_left, core_left)
            if horizontal_overlap <= 0:
                continue
            gap = core_top - title_bottom
            if gap < MIN_NATIVE_TITLE_CORE_GAP_PX:
                failures.append({
                    'title_shape_id': title_shape.get('shape_id'),
                    'core_shape_id': core_shape.get('shape_id'),
                    'gap_px': round(gap, 2),
                    'threshold_px': MIN_NATIVE_TITLE_CORE_GAP_PX,
                })
    return failures


def shapes_with_role(native_shapes: list[dict], role: str) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content' and safe_text(shape.get('role')) == role
    ]


def shapes_with_any_role(native_shapes: list[dict], roles: set[str]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if safe_text(shape.get('role')) in roles
    ]


def content_shapes_with_any_role(native_shapes: list[dict], roles: set[str]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content' and safe_text(shape.get('role')) in roles
    ]


def has_role_hint(native_shapes: list[dict], hint: str) -> bool:
    return any(hint in safe_text(shape.get('role')).lower() for shape in native_shapes)


def is_system_map_layout(native_shapes: list[dict]) -> bool:
    roles = {safe_text(shape.get('role')) for shape in native_shapes}
    has_system_panel = bool(roles.intersection(SYSTEM_MAP_PANEL_ROLES))
    has_structural_span = sum(1 for hint in SYSTEM_MAP_STRUCTURAL_HINTS if has_role_hint(native_shapes, hint)) >= 3
    has_content_variety = len(roles.intersection(SYSTEM_MAP_CONTENT_ROLES)) >= 3
    return has_system_panel and has_structural_span and has_content_variety


def content_slot_shapes(native_shapes: list[dict]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and safe_text(shape.get('text'))
        and safe_text(shape.get('role')) not in CONTENT_DEPTH_EXCLUDED_ROLES
    ]


def layout_variant(native_shapes: list[dict]) -> str:
    roles = {safe_text(shape.get('role')) for shape in native_shapes}
    if is_system_map_layout(native_shapes):
        return 'system_map'
    zone_count = len(shapes_with_role(native_shapes, 'compare_panel'))
    content_panel_count = len(shapes_with_role(native_shapes, 'content_panel'))
    timeline_count = len(shapes_with_role(native_shapes, 'timeline_panel'))
    gate_count = len(shapes_with_role(native_shapes, 'judgement_step'))
    axis_count = len(shapes_with_role(native_shapes, 'axis_panel'))
    signal_count = len(shapes_with_role(native_shapes, 'signal_panel'))
    takeaway_count = len(shapes_with_role(native_shapes, 'takeaway_panel'))
    if zone_count == 2:
        return 'compare_two_column'
    if zone_count == 3:
        return 'compare_three_column'
    if zone_count == 4:
        return 'compare_four_zone'
    content_panel_variant = {
        1: 'content_single_panel', 2: 'content_two_panel', 3: 'content_three_panel',
    }.get(content_panel_count, 'content_four_panel' if content_panel_count >= 4 else '')
    if content_panel_variant:
        return content_panel_variant
    if 'structured_note_panel' in roles:
        return 'structured_compare'
    if timeline_count:
        return 'timeline_band'
    if gate_count <= 2 and gate_count > 0:
        return 'judgement_two_gate'
    if gate_count > 2:
        return 'judgement_ladder'
    if axis_count:
        return 'ring_cross'
    if signal_count:
        return 'cover_signal'
    if takeaway_count:
        return 'summary_peak'
    return 'unknown'


def expected_slot_roles(native_shapes: list[dict]) -> list[str]:
    variant = layout_variant(native_shapes)
    if variant.startswith('compare_'):
        return ['compare_panel', 'point_text']
    if variant.startswith('content_'):
        return ['content_panel']
    if variant == 'structured_compare':
        return ['structured_note_panel', 'point_text']
    if variant == 'timeline_band':
        return ['timeline_panel', 'point_text']
    if variant.startswith('judgement_'):
        return ['judgement_step', 'point_text']
    if variant == 'ring_cross':
        return ['axis_panel', 'point_text']
    if variant == 'cover_signal':
        return ['signal_panel', 'point_text']
    if variant == 'summary_peak':
        return ['takeaway_panel']
    if variant == 'system_map':
        return ['system_map_panel', 'system_map_text']
    return []


def system_map_slot_fill_audit(native_shapes: list[dict]) -> dict:
    panel_count = len(shapes_with_any_role(native_shapes, SYSTEM_MAP_PANEL_ROLES))
    text_count = len(content_shapes_with_any_role(native_shapes, SYSTEM_MAP_CONTENT_ROLES))
    filled_slots = min(panel_count, text_count)
    failures = []
    if panel_count < 3:
        failures.append({
            'reason': 'system_map_panel_count_too_low',
            'expected_minimum': 3,
            'actual': panel_count,
        })
    if text_count < 3:
        failures.append({
            'reason': 'system_map_text_count_too_low',
            'expected_minimum': 3,
            'actual': text_count,
        })
    return {
        'layout_variant': 'system_map',
        'expected_slot_count': 3,
        'filled_slot_count': min(filled_slots, 3),
        'slot_fill_ok': len(failures) == 0,
        'slot_fill_failures': failures,
    }


def slot_fill_audit(native_shapes: list[dict], primary_points: int) -> dict:
    variant = layout_variant(native_shapes)
    if variant == 'system_map':
        return system_map_slot_fill_audit(native_shapes)
    roles = expected_slot_roles(native_shapes)
    if not roles:
        return {
            'layout_variant': variant,
            'expected_slot_count': max(1, min(primary_points, MAX_NATIVE_PRIMARY_POINTS)),
            'filled_slot_count': 0,
            'slot_fill_ok': False,
            'slot_fill_failures': [{'reason': 'unknown_layout_variant'}],
        }
    panel_role = roles[0]
    panel_count = len(shapes_with_role(native_shapes, panel_role))
    text_role = roles[1] if len(roles) > 1 else ''
    if text_role:
        text_count = len([
            shape for shape in shapes_with_role(native_shapes, text_role)
            if safe_text(shape.get('text'))
        ])
    elif panel_role == 'content_panel':
        text_count = max(
            len([
                shape for shape in shapes_with_role(native_shapes, panel_role)
                if safe_text(shape.get('text'))
            ]),
            len([
                shape for shape in content_slot_shapes(native_shapes)
                if safe_text(shape.get('text'))
            ]),
        )
    else:
        text_count = panel_count
    if variant == 'summary_peak':
        expected_slots = max(1, min(max(primary_points - 1, 1), 3))
    elif variant.startswith('content_'):
        expected_slots = min(max(1, primary_points), max(panel_count, 1))
    elif variant == 'structured_compare':
        expected_slots = min(max(1, primary_points), max(panel_count, 1))
    else:
        expected_slots = max(1, min(primary_points, 4))
    filled_slots = min(panel_count, text_count)
    failures = []
    if panel_count != expected_slots:
        failures.append({
            'reason': 'panel_count_mismatch',
            'role': panel_role,
            'expected': expected_slots,
            'actual': panel_count,
        })
    if text_count < expected_slots:
        failures.append({
            'reason': 'text_slot_count_mismatch',
            'role': text_role,
            'expected': expected_slots,
            'actual': text_count,
        })
    return {
        'layout_variant': variant,
        'expected_slot_count': expected_slots,
        'filled_slot_count': filled_slots,
        'slot_fill_ok': len(failures) == 0,
        'slot_fill_failures': failures,
    }


def audience_label_readability_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in shapes_with_role(native_shapes, 'point_index'):
        font_size = float(shape.get('font_size') or 0.0)
        if font_size < MIN_AUDIENCE_LABEL_FONT_PT:
            failures.append({
                'shape_id': shape.get('shape_id'),
                'font_size': round(font_size, 2),
                'threshold': MIN_AUDIENCE_LABEL_FONT_PT,
            })
    return failures


def normalized_content_char_count(text: str) -> int:
    return sum(1 for char in safe_text(text) if not char.isspace() and char not in {'，', '。', '、', ',', '.', ':', '：', ';', '；'})


def content_depth_audit(native_shapes: list[dict]) -> dict:
    point_text_shapes = content_slot_shapes(native_shapes)
    failures = []
    for shape in point_text_shapes:
        char_count = normalized_content_char_count(shape.get('text'))
        if char_count < MIN_POINT_TEXT_CONTENT_CHARS:
            failures.append({
                'shape_id': shape.get('shape_id'),
                'role': shape.get('role'),
                'text_char_count': char_count,
                'threshold': MIN_POINT_TEXT_CONTENT_CHARS,
            })
    return {
        'content_depth_ok': len(failures) == 0,
        'content_depth_floor_chars': MIN_POINT_TEXT_CONTENT_CHARS,
        'content_depth_failures': failures,
    }


def grid_balance_audit(native_shapes: list[dict]) -> dict:
    variant = layout_variant(native_shapes)
    if variant == 'system_map':
        route_lane_count = len(shapes_with_any_role(native_shapes, SYSTEM_MAP_ROUTE_ROLES))
        gate_card_count = len(shapes_with_any_role(native_shapes, {'gate_card', 'gate_ladder_panel', 'gate_stack_panel'}))
        evidence_band_count = len(shapes_with_any_role(native_shapes, {'evidence_band', 'evidence_panel', 'takeaway_band'}))
        input_panel_count = len(shapes_with_any_role(native_shapes, {'input_panel', 'source_panel', 'content_panel'}))
        failures = []
        if route_lane_count < 2:
            failures.append({
                'reason': 'system_map_route_lanes_too_low',
                'expected_minimum': 2,
                'actual': route_lane_count,
            })
        if gate_card_count < 1:
            failures.append({
                'reason': 'system_map_gate_area_missing',
                'expected_minimum': 1,
                'actual': gate_card_count,
            })
        if evidence_band_count < 1:
            failures.append({
                'reason': 'system_map_evidence_band_missing',
                'expected_minimum': 1,
                'actual': evidence_band_count,
            })
        if input_panel_count < 1:
            failures.append({
                'reason': 'system_map_input_panel_missing',
                'expected_minimum': 1,
                'actual': input_panel_count,
            })
        return {
            'grid_balance_ratio': 1.0,
            'grid_balance_ok': len(failures) == 0,
            'grid_balance_failures': failures,
        }
    else:
        slot_roles = expected_slot_roles(native_shapes)
        panel_role = slot_roles[0] if slot_roles else ''
        panels = shapes_with_role(native_shapes, panel_role) if panel_role else []
    if len(panels) <= 1:
        return {
            'grid_balance_ratio': 1.0,
            'grid_balance_ok': True,
            'grid_balance_failures': [],
        }
    areas = []
    for panel in panels:
        rect = panel.get('bounds') or {}
        areas.append(float(rect.get('width') or 0.0) * float(rect.get('height') or 0.0))
    smallest = min((area for area in areas if area > 0), default=0.0)
    largest = max(areas, default=0.0)
    ratio = largest / smallest if smallest > 0 else float('inf')
    failures = []
    if ratio < MIN_GRID_BALANCE_RATIO or ratio > MAX_GRID_BALANCE_RATIO:
        failures.append({
            'reason': 'panel_area_ratio_out_of_range',
            'layout_variant': variant,
            'ratio': round(ratio, 4) if math.isfinite(ratio) else None,
            'min': MIN_GRID_BALANCE_RATIO,
            'max': MAX_GRID_BALANCE_RATIO,
        })
    return {
        'grid_balance_ratio': round(ratio, 4) if math.isfinite(ratio) else None,
        'grid_balance_ok': len(failures) == 0,
        'grid_balance_failures': failures,
    }


def generic_overlap_excluded(shape_a: dict, shape_b: dict) -> bool:
    roles = frozenset({
        safe_text(shape_a.get('role')),
        safe_text(shape_b.get('role')),
    })
    return roles in GENERIC_OVERLAP_EXCLUDED_ROLE_PAIRS


def structural_text_collision_failures(native_shapes: list[dict]) -> list[dict]:
    text_shapes = [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and shape.get('kind') == 'text_box'
        and safe_text(shape.get('role')) in STRUCTURAL_TEXT_COLLISION_ROLES
        and safe_text(shape.get('text'))
    ]
    structural_shapes = [
        shape for shape in structural_visual_shapes(native_shapes)
        if shape.get('kind') in {'line', 'connector'}
    ]
    failures = []
    for text_shape in text_shapes:
        text_rect = text_shape.get('bounds') or {}
        visible_text_rect = {
            **text_rect,
            'bottom': text_shape_bottom(text_shape),
        }
        for structural_shape in structural_shapes:
            structural_rect = structural_shape.get('bounds') or {}
            overlap_area = rect_overlap_area(visible_text_rect, structural_rect)
            if overlap_area <= MIN_STRUCTURAL_TEXT_COLLISION_AREA_PX2:
                continue
            failures.append({
                'text_shape_id': text_shape.get('shape_id'),
                'structural_shape_id': structural_shape.get('shape_id'),
                'text_role': text_shape.get('role'),
                'structural_role': structural_shape.get('role'),
                'overlap_area': round(overlap_area, 2),
                'required_gap_px': MIN_STRUCTURAL_TEXT_CLEARANCE_PX,
            })
    return failures


def bucket_px(value: float) -> int:
    return int(round(float(value or 0.0) / COMPOSITION_BUCKET_PX))


def composition_signature(native_shapes: list[dict]) -> str:
    signature_shapes = []
    signature_roles = {
        'title',
        'core_sentence',
        'compare_panel',
        'signal_panel',
        'timeline_panel',
        'judgement_step',
        'axis_panel',
        'takeaway_panel',
        'structured_note_panel',
        'chart',
        'table',
        'metric_grid',
    }
    for shape in native_shapes:
        role = safe_text(shape.get('role'))
        if role not in signature_roles:
            continue
        rect = shape.get('bounds') or {}
        signature_shapes.append({
            'role': role,
            'kind': safe_text(shape.get('kind')),
            'x': bucket_px(float(rect.get('left') or 0.0)),
            'y': bucket_px(float(rect.get('top') or 0.0)),
            'w': bucket_px(float(rect.get('width') or 0.0)),
            'h': bucket_px(float(rect.get('height') or 0.0)),
        })
    signature_shapes.sort(key=lambda item: (item['role'], item['y'], item['x'], item['w'], item['h']))
    payload = json.dumps(signature_shapes, ensure_ascii=False, sort_keys=True)
    digest = hashlib.sha256(payload.encode('utf-8')).hexdigest()[:12]
    role_summary = '-'.join(
        f'{role}:{sum(1 for item in signature_shapes if item["role"] == role)}'
        for role in sorted({item['role'] for item in signature_shapes})
    )
    return f'native-composition:{digest}:{role_summary or "empty"}'


def title_underline_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        role = safe_text(shape.get('role'))
        kind = safe_text(shape.get('kind'))
        rect = shape.get('bounds') or {}
        width = float(rect.get('width') or 0.0)
        height = float(rect.get('height') or 0.0)
        top = float(rect.get('top') or 0.0)
        if role != 'accent_rule' and not (
            kind == 'line'
            and width >= CANVAS_PX[0] * 0.45
            and height <= 4.0
            and TITLE_SAFE_ZONE_BOTTOM <= top <= TITLE_SAFE_ZONE_BOTTOM + 120.0
        ):
            continue
        failures.append({
            'shape_id': shape.get('shape_id'),
            'role': role,
            'kind': kind,
            'top': round(top, 2),
            'width': round(width, 2),
            'reason': 'title_underline_motif_forbidden',
        })
    return failures


def structural_visual_shapes(native_shapes: list[dict]) -> list[dict]:
    results = []
    for shape in native_shapes:
        role = safe_text(shape.get('role')).lower()
        kind = safe_text(shape.get('kind')).lower()
        if kind in {'chart', 'table', 'metric_grid'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval'} and role not in {'accent_dot', 'page_number', 'page_no'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval', 'rect', 'rounded_rect'} and any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            results.append(shape)
    return results


def mechanical_card_panel_count(native_shapes: list[dict]) -> int:
    count = 0
    for shape in native_shapes:
        role = safe_text(shape.get('role')).lower()
        if role in MECHANICAL_CARD_PANEL_ROLES:
            count += 1
        elif role.endswith('_panel') and not any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            count += 1
    return count


def evaluate_native_slide_quality(native_shapes: list, primary_points: int) -> dict:
    content_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'content']
    decorative_shapes = [
        shape for shape in native_shapes
        if shape.get('quality_role') in {'decorative', 'structural'}
    ]
    overlap_shapes = [
        shape for shape in content_shapes
        if shape.get('kind') == 'text_box'
        and safe_text(shape.get('role')) not in SYSTEM_MAP_CONTENT_ROLES
    ]
    shape_kinds = {safe_text(shape.get('kind')) for shape in native_shapes if safe_text(shape.get('kind'))}
    shape_roles = {safe_text(shape.get('role')) for shape in native_shapes if safe_text(shape.get('role'))}
    title_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    title_font_size = max((float(shape.get('font_size') or 0) for shape in title_shapes), default=0.0)
    body_text_shapes = readable_body_text_shapes(native_shapes)
    body_font_sizes = [float(shape.get('font_size') or 0.0) for shape in body_text_shapes]
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
    min_body_font_pt = min(body_font_sizes, default=0.0)
    body_text_readability_ok = bool(body_font_sizes) and not body_text_font_failures
    typography_hierarchy_ratio = title_font_size / min_body_font_pt if min_body_font_pt > 0 else 0.0
    typography_hierarchy_ok = (
        bool(title_shapes)
        and title_font_size >= MIN_NATIVE_TITLE_FONT_PT
        and typography_hierarchy_ratio >= MIN_NATIVE_TYPOGRAPHY_HIERARCHY_RATIO
    )
    page_number_shapes = [
        shape for shape in native_shapes
        if shape.get('role') in {'page_number', 'page_no', 'page'} and safe_text(shape.get('text'))
    ]
    occupied_area = rect_union_area([shape['bounds'] for shape in content_shapes])
    occupied_ratio = clamp(occupied_area / FRAME_AREA, 0.0, 1.0)
    if content_shapes:
        edge_clearance = {
            'left': min(float(shape['bounds']['left']) for shape in content_shapes),
            'top': min(float(shape['bounds']['top']) for shape in content_shapes),
            'right': min(CANVAS_PX[0] - float(shape['bounds']['right']) for shape in content_shapes),
            'bottom': min(CANVAS_PX[1] - float(shape['bounds']['bottom']) for shape in content_shapes),
        }
    else:
        edge_clearance = {'left': 0.0, 'top': 0.0, 'right': 0.0, 'bottom': 0.0}
    overlap_pairs = []
    for left_index, shape_a in enumerate(overlap_shapes):
        for shape_b in overlap_shapes[left_index + 1:]:
            if generic_overlap_excluded(shape_a, shape_b):
                continue
            overlap_area = rect_overlap_area(shape_a['bounds'], shape_b['bounds'])
            if overlap_area > 12.0:
                overlap_pairs.append({
                    'a': shape_a.get('shape_id'),
                    'b': shape_b.get('shape_id'),
                    'overlap_area': round(overlap_area, 2),
                })
    block_content_failures = [
        failure for failure in (text_capacity_failure(shape) for shape in content_shapes)
        if failure
    ]
    chart_shapes = [shape for shape in native_shapes if shape.get('kind') == 'chart']
    table_shapes = [shape for shape in native_shapes if shape.get('kind') == 'table']
    metric_grid_shapes = [shape for shape in native_shapes if shape.get('kind') == 'metric_grid']
    chart_metrics = []
    table_metrics = []
    metric_grid_metrics = []
    numeric_label_overflows = []
    table_cell_fit_failures = []
    for shape in chart_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        chart_metrics.append(metrics)
        numeric_label_overflows.extend(metrics.get('numeric_label_overflows') or [])
    for shape in table_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        table_metrics.append(metrics)
        table_cell_fit_failures.extend(metrics.get('cell_fit_failures') or [])
    for shape in metric_grid_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        metric_grid_metrics.append(metrics)
        numeric_label_overflows.extend(metrics.get('numeric_label_overflows') or [])
    language_fragments = operator_language_fragments(content_shapes)
    title_zone_failures = title_safe_zone_failures(content_shapes)
    title_core_failures = title_core_overlap_failures(content_shapes)
    structural_text_collisions = structural_text_collision_failures(native_shapes)
    panel_safe_area_failures = panel_text_safe_area_failures(native_shapes)
    label_wrap_failures = short_label_wrap_failures(native_shapes)
    slot_audit = slot_fill_audit(native_shapes, primary_points)
    label_failures = audience_label_readability_failures(content_shapes)
    content_depth = content_depth_audit(content_shapes)
    grid_audit = grid_balance_audit(native_shapes)
    table_failures = table_legibility_failures(table_metrics)
    underline_failures = title_underline_failures(native_shapes)
    structural_shapes = structural_visual_shapes(native_shapes)
    structural_visual_count = len(structural_shapes)
    card_panel_count = mechanical_card_panel_count(native_shapes)
    audience_slot_count = len(content_slot_shapes(native_shapes))
    mechanical_card_template_detected = (
        card_panel_count >= 2
        and audience_slot_count >= 2
        and structural_visual_count < 1
    )
    composition = composition_signature(native_shapes)
    coordinate_payload = [
        {
            'shape_id': shape.get('shape_id'),
            'kind': shape.get('kind'),
            'role': shape.get('role'),
            'bounds': shape.get('bounds'),
        }
        for shape in native_shapes
    ]
    coordinate_determinism_hash = hashlib.sha256(
        json.dumps(coordinate_payload, ensure_ascii=False, sort_keys=True).encode('utf-8')
    ).hexdigest()
    text_char_count = sum(len(safe_text(shape.get('text'))) for shape in content_shapes)
    clipped_nodes = len(block_content_failures)
    title_typography_ok = typography_hierarchy_ok
    page_number_consistency_ok = bool(page_number_shapes)
    table_min_font_pt = min(
        (float(metrics.get('min_font_pt') or MIN_TABLE_BODY_FONT_PT) for metrics in table_metrics),
        default=MIN_TABLE_BODY_FONT_PT,
    )
    card_blank_ratio = max(
        (float(metrics.get('max_cell_blank_ratio') or 0.0) for metrics in table_metrics),
        default=0.24,
    )
    layout_richness_score = round(clamp(
        (min(len(native_shapes), 20) / 20.0 * 0.34)
        + (min(len(shape_kinds), 4) / 4.0 * 0.22)
        + (min(len(shape_roles), 10) / 10.0 * 0.22)
        + (min(len(decorative_shapes), 7) / 7.0 * 0.22),
        0.0,
        1.0,
    ), 4)
    checks = {
        'overflow_free': clipped_nodes == 0,
        'occlusion_free': len(overlap_pairs) == 0 and len(structural_text_collisions) == 0,
        'visual_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and primary_points <= MAX_NATIVE_PRIMARY_POINTS,
        'speaker_fit_ok': text_char_count <= 950,
        'edge_clearance_ok': min(edge_clearance.values()) >= MIN_NATIVE_EDGE_CLEARANCE,
        'block_content_fit_ok': clipped_nodes == 0,
        'title_typography_ok': title_typography_ok,
        'body_text_readability_ok': body_text_readability_ok,
        'typography_hierarchy_ok': typography_hierarchy_ok,
        'title_core_overlap_ok': len(title_core_failures) == 0,
        'page_number_consistency_ok': page_number_consistency_ok,
        'layout_richness_ok': layout_richness_score >= MIN_NATIVE_LAYOUT_RICHNESS,
        'slot_fill_ok': slot_audit['slot_fill_ok'],
        'audience_label_readability_ok': len(label_failures) == 0,
        'content_depth_ok': content_depth['content_depth_ok'],
        'grid_balance_ok': grid_audit['grid_balance_ok'],
        'title_underline_absent_ok': len(underline_failures) == 0,
        'external_audience_language_ok': len(language_fragments) == 0,
        'title_safe_zone_clear': len(title_zone_failures) == 0,
        'table_legibility_ok': len(table_failures) == 0,
        'layout_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and card_blank_ratio <= MAX_TABLE_CELL_BLANK_RATIO,
        'visual_structure_present': structural_visual_count >= 1,
        'non_text_visual_specific_ok': structural_visual_count >= 1,
        'mechanical_card_template_absent': not mechanical_card_template_detected,
        'panel_text_safe_area_ok': len(panel_safe_area_failures) == 0,
        'short_label_wrap_ok': len(label_wrap_failures) == 0,
    }
    issues = []
    if not checks['visual_density_ok']:
        issues.append('visual_density_out_of_range')
    if not checks['edge_clearance_ok']:
        issues.append('edge_clearance_out_of_range')
    if not checks['occlusion_free']:
        issues.append('occlusion_detected')
    if structural_text_collisions:
        issues.append('structural_text_collision_detected')
    if not checks['block_content_fit_ok']:
        issues.append('block_content_overflow_detected')
    if not checks['speaker_fit_ok']:
        issues.append('speaker_fit_exceeded')
    if not checks['title_typography_ok']:
        issues.append('title_typography_missing_or_too_small')
    if not checks['body_text_readability_ok']:
        issues.append('body_text_below_readability_floor')
    if not checks['typography_hierarchy_ok']:
        issues.append('typography_hierarchy_too_flat')
    if not checks['title_core_overlap_ok']:
        issues.append('title_core_overlap_detected')
    if not checks['page_number_consistency_ok']:
        issues.append('page_number_missing')
    if not checks['layout_richness_ok']:
        issues.append('layout_richness_below_threshold')
    if not checks['slot_fill_ok']:
        issues.append('native_slot_fill_failed')
    if not checks['audience_label_readability_ok']:
        issues.append('audience_label_below_readability_floor')
    if not checks['content_depth_ok']:
        issues.append('native_content_depth_failed')
    if not checks['grid_balance_ok']:
        issues.append('native_grid_balance_failed')
    if not checks['title_underline_absent_ok']:
        issues.append('title_underline_motif_detected')
    if not checks['external_audience_language_ok']:
        issues.append('operator_language_leak_detected')
    if not checks['title_safe_zone_clear']:
        issues.append('title_safe_zone_obstructed')
    if any(failure.get('reason') == 'table_font_below_minimum' for failure in table_failures):
        issues.append('table_font_below_minimum')
    if table_failures and 'table_font_below_minimum' not in issues:
        issues.append('table_cell_fit_failed')
    if not checks['layout_density_ok']:
        issues.append('layout_density_too_sparse')
    if not checks['visual_structure_present']:
        issues.append('native_visual_structure_missing')
    if not checks['non_text_visual_specific_ok']:
        issues.append('native_non_text_visual_too_generic')
    if not checks['mechanical_card_template_absent']:
        issues.append('native_mechanical_card_template_detected')
    if not checks['panel_text_safe_area_ok']:
        issues.append('panel_text_safe_area_violation')
    if not checks['short_label_wrap_ok']:
        issues.append('short_label_unbalanced_wrap')
    return {
        'checks': checks,
        'issues': issues,
        'metrics': {
            'title_font_size': round(title_font_size, 2),
            'min_body_font_pt': round(min_body_font_pt, 2),
            'body_text_readability_floor_pt': MIN_NATIVE_BODY_FONT_PT,
            'body_text_readability_ok': body_text_readability_ok,
            'body_text_font_failures': body_text_font_failures,
            'typography_hierarchy_ratio': round(typography_hierarchy_ratio, 4),
            'typography_hierarchy_ok': typography_hierarchy_ok,
            'title_core_overlap_count': len(title_core_failures),
            'title_core_overlap_failures': title_core_failures,
            'text_char_count': text_char_count,
            'block_count': len(content_shapes),
            'decorative_shape_count': len(decorative_shapes),
            'visual_support_shape_count': len(decorative_shapes),
            'audience_content_slot_count': audience_slot_count,
            'shape_count': len(native_shapes),
            'shape_kind_count': len(shape_kinds),
            'role_count': len(shape_roles),
            'layout_richness_score': layout_richness_score,
            'layout_variant': slot_audit['layout_variant'],
            'expected_slot_count': slot_audit['expected_slot_count'],
            'filled_slot_count': slot_audit['filled_slot_count'],
            'slot_fill_ok': slot_audit['slot_fill_ok'],
            'slot_fill_failures': slot_audit['slot_fill_failures'],
            'audience_label_readability_ok': len(label_failures) == 0,
            'audience_label_font_floor_pt': MIN_AUDIENCE_LABEL_FONT_PT,
            'audience_label_readability_failures': label_failures,
            'content_depth_ok': content_depth['content_depth_ok'],
            'content_depth_floor_chars': content_depth['content_depth_floor_chars'],
            'content_depth_failures': content_depth['content_depth_failures'],
            'grid_balance_ok': grid_audit['grid_balance_ok'],
            'grid_balance_ratio': grid_audit['grid_balance_ratio'],
            'grid_balance_failures': grid_audit['grid_balance_failures'],
            'composition_signature': composition,
            'title_underline_absent_ok': len(underline_failures) == 0,
            'title_underline_failures': underline_failures,
            'overlap_pairs': len(overlap_pairs),
            'overlaps': overlap_pairs,
            'structural_text_collision_count': len(structural_text_collisions),
            'structural_text_collisions': structural_text_collisions,
            'clipped_nodes': clipped_nodes,
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'edge_clearance': {key: round(value, 2) for key, value in edge_clearance.items()},
            'block_content_failures': block_content_failures,
            'bounds': [shape['bounds'] for shape in content_shapes],
            'chart_count': len(chart_shapes),
            'table_count': len(table_shapes),
            'metric_grid_count': len(metric_grid_shapes),
            'chart_metrics': chart_metrics,
            'table_metrics': table_metrics,
            'metric_grid_metrics': metric_grid_metrics,
            'operator_language_fragments': language_fragments,
            'title_safe_zone_failures': title_zone_failures,
            'title_safe_zone_clearance_ok': len(title_zone_failures) == 0,
            'table_min_font_pt': round(table_min_font_pt, 2),
            'table_legibility_failures': table_failures,
            'card_blank_ratio': round(card_blank_ratio, 4),
            'chart_bounds': [shape['bounds'] for shape in chart_shapes],
            'table_bounds': [shape['bounds'] for shape in table_shapes],
            'metric_grid_bounds': [shape['bounds'] for shape in metric_grid_shapes],
            'axis_label_count': sum(int(metrics.get('axis_label_count') or 0) for metrics in chart_metrics),
            'legend_label_count': sum(int(metrics.get('legend_label_count') or 0) for metrics in chart_metrics),
            'table_cell_fit_ok': len(table_cell_fit_failures) == 0,
            'table_cell_fit_failures': table_cell_fit_failures,
            'numeric_label_overflow_count': len(numeric_label_overflows),
            'numeric_label_overflows': numeric_label_overflows,
            'coordinate_determinism_hash': coordinate_determinism_hash,
            'structural_visual_count': structural_visual_count,
            'structural_visual_roles': [safe_text(shape.get('role')) for shape in structural_shapes],
            'card_panel_count': card_panel_count,
            'visual_structure_present': checks['visual_structure_present'],
            'non_text_visual_specific_ok': checks['non_text_visual_specific_ok'],
            'mechanical_card_template_detected': mechanical_card_template_detected,
            'mechanical_card_template_absent': checks['mechanical_card_template_absent'],
            'panel_text_safe_area_ok': checks['panel_text_safe_area_ok'],
            'panel_text_safe_area_failures': panel_safe_area_failures,
            'short_label_wrap_ok': checks['short_label_wrap_ok'],
            'short_label_wrap_failures': label_wrap_failures,
        },
    }
