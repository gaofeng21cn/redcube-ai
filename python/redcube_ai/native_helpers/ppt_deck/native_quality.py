import hashlib
import json
import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text


CANVAS_PX = (1152, 648)
FRAME_AREA = float(CANVAS_PX[0] * CANVAS_PX[1])
MIN_NATIVE_DENSITY = 0.18
MAX_NATIVE_DENSITY = 0.82
MIN_NATIVE_EDGE_CLEARANCE = 24.0
MAX_NATIVE_PRIMARY_POINTS = 5
MIN_NATIVE_LAYOUT_RICHNESS = 0.68
TITLE_SAFE_ZONE_BOTTOM = 128.0
MIN_NATIVE_BODY_FONT_PT = 18.0
MIN_NATIVE_TITLE_FONT_PT = 36.0
MIN_NATIVE_TYPOGRAPHY_HIERARCHY_RATIO = 2.0
MIN_NATIVE_TITLE_CORE_GAP_PX = 8.0
MIN_AUDIENCE_LABEL_FONT_PT = 16.0
MIN_GRID_BALANCE_RATIO = 0.56
MAX_GRID_BALANCE_RATIO = 1.78
MIN_POINT_TEXT_CONTENT_CHARS = 12
MIN_TABLE_BODY_FONT_PT = 11.0
MAX_TABLE_CELL_BLANK_RATIO = 0.38
OPERATOR_LANGUAGE_FRAGMENTS = [
    '汇报讨论用途',
    '客观专业版',
    '本次汇报边界',
    '不在展示页暴露',
    '本地原始文件名',
    '清洗脚本名',
    'RCA',
    'RedCube',
    'source intake',
    'author_pptx_native',
    'slide_blueprint',
    'visual_direction',
]


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


def layout_variant(native_shapes: list[dict]) -> str:
    roles = {safe_text(shape.get('role')) for shape in native_shapes}
    zone_count = len(shapes_with_role(native_shapes, 'compare_panel'))
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
    return []


def slot_fill_audit(native_shapes: list[dict], primary_points: int) -> dict:
    variant = layout_variant(native_shapes)
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
    text_count = len([
        shape for shape in shapes_with_role(native_shapes, text_role)
        if safe_text(shape.get('text'))
    ]) if text_role else panel_count
    if variant == 'summary_peak':
        expected_slots = max(1, min(max(primary_points - 1, 1), 3))
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
    point_text_shapes = [
        shape for shape in shapes_with_role(native_shapes, 'point_text')
        if safe_text(shape.get('text'))
    ]
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


def evaluate_native_slide_quality(native_shapes: list, primary_points: int) -> dict:
    content_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'content']
    decorative_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'decorative']
    overlap_shapes = [shape for shape in content_shapes if shape.get('kind') == 'text_box']
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
        if shape.get('role') == 'page_number' and safe_text(shape.get('text'))
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
    slot_audit = slot_fill_audit(content_shapes, primary_points)
    label_failures = audience_label_readability_failures(content_shapes)
    content_depth = content_depth_audit(content_shapes)
    grid_audit = grid_balance_audit(content_shapes)
    table_failures = table_legibility_failures(table_metrics)
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
        'occlusion_free': len(overlap_pairs) == 0,
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
        'external_audience_language_ok': len(language_fragments) == 0,
        'title_safe_zone_clear': len(title_zone_failures) == 0,
        'table_legibility_ok': len(table_failures) == 0,
        'layout_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and card_blank_ratio <= MAX_TABLE_CELL_BLANK_RATIO,
    }
    issues = []
    if not checks['visual_density_ok']:
        issues.append('visual_density_out_of_range')
    if not checks['edge_clearance_ok']:
        issues.append('edge_clearance_out_of_range')
    if not checks['occlusion_free']:
        issues.append('occlusion_detected')
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
            'overlap_pairs': len(overlap_pairs),
            'overlaps': overlap_pairs,
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
        },
    }
