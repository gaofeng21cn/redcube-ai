from redcube_ai.native_helpers.ppt_deck.native_layout_constants import *  # noqa: F403


def recommended_quality_role(
    shape_spec: dict,
    *,
    ai_shape_text,
    shape_kind,
    structural_visual_shape,
    safe_text,
) -> str:
    role = safe_text(shape_spec.get('role')).lower()
    kind = shape_kind(shape_spec)
    if role in AUXILIARY_TEXT_ROLES:
        return 'auxiliary'
    if ai_shape_text(shape_spec):
        return 'content'
    if structural_visual_shape(shape_spec):
        return 'structural'
    if kind in {'line', 'connector', 'oval', 'circle'} and role != 'accent_dot':
        return 'structural'
    return 'decorative'


def ai_panel_safe_area_failures(
    shapes: list[dict],
    *,
    ai_shape_bounds_in,
    ai_shape_quality_role,
    shape_kind,
    ai_shape_text,
    safe_text,
) -> list[dict]:
    panels = [
        shape for shape in shapes
        if ai_shape_bounds_in(shape) is not None
        and safe_text(shape.get('role')) in TEXT_PANEL_ROLES
    ]
    text_shapes = [
        shape for shape in shapes
        if ai_shape_quality_role(shape) == 'content'
        and shape_kind(shape) in {'text', 'text_box'}
        and ai_shape_text(shape)
        and ai_shape_bounds_in(shape) is not None
    ]
    failures = []
    for panel in panels:
        panel_rect = ai_shape_bounds_in(panel)
        if panel_rect is None:
            continue
        safe_left = panel_rect['left_in'] + MIN_TEXT_PANEL_INSET_IN
        safe_top = panel_rect['top_in'] + MIN_TEXT_PANEL_INSET_IN
        safe_right = panel_rect['left_in'] + panel_rect['width_in'] - MIN_TEXT_PANEL_INSET_IN
        safe_bottom = panel_rect['top_in'] + panel_rect['height_in'] - MIN_TEXT_PANEL_INSET_IN
        for text_shape in text_shapes:
            text_rect = ai_shape_bounds_in(text_shape)
            if text_rect is None:
                continue
            if not (
                panel_rect['left_in'] <= text_rect['left_in'] + text_rect['width_in'] / 2.0 <= panel_rect['left_in'] + panel_rect['width_in']
                and panel_rect['top_in'] <= text_rect['top_in'] + text_rect['height_in'] / 2.0 <= panel_rect['top_in'] + panel_rect['height_in']
            ):
                continue
            required_delta = {
                'left': safe_left - text_rect['left_in'],
                'top': safe_top - text_rect['top_in'],
                'right': text_rect['left_in'] + text_rect['width_in'] - safe_right,
                'bottom': text_rect['top_in'] + text_rect['height_in'] - safe_bottom,
            }
            if (
                required_delta['left'] <= PANEL_SAFE_AREA_EPSILON_IN
                and required_delta['top'] <= PANEL_SAFE_AREA_EPSILON_IN
                and required_delta['right'] <= PANEL_SAFE_AREA_EPSILON_IN
                and required_delta['bottom'] <= PANEL_SAFE_AREA_EPSILON_IN
            ):
                continue
            safe_bounds = {'left_in': safe_left, 'top_in': safe_top, 'right_in': safe_right, 'bottom_in': safe_bottom}
            failures.append({
                'reason': 'ai_first_text_panel_safe_area_violation',
                'shape_id': safe_text(text_shape.get('shape_id'), '<missing-shape-id>'),
                'panel_shape_id': safe_text(panel.get('shape_id'), '<missing-panel-id>'),
                'role': safe_text(text_shape.get('role')),
                'required_inset_in': MIN_TEXT_PANEL_INSET_IN,
                'panel_bounds': {key: round(panel_rect[key], 4) for key in ('left_in', 'top_in', 'width_in', 'height_in')},
                'panel_safe_bounds': {key: round(value, 4) for key, value in safe_bounds.items()},
                'shape_bounds': {key: round(text_rect[key], 4) for key in ('left_in', 'top_in', 'width_in', 'height_in')},
                'required_delta_in': {key: round(max(0.0, value), 4) for key, value in required_delta.items()},
                'geometry_repair_instruction': 'Keep the text box fully inside its containing visual panel with the required inset on all sides; shrink the text box, enlarge the panel, or move the text.',
            })
    return failures


def ai_text_card_internal_padding_failures(
    shapes: list[dict],
    *,
    ai_shape_bounds_in,
    ai_shape_quality_role,
    shape_kind,
    ai_shape_text,
    margin_inches,
    resolve_color,
    safe_text,
) -> list[dict]:
    failures = []
    for shape in shapes:
        if ai_shape_quality_role(shape) != 'content':
            continue
        if shape_kind(shape) not in {'text', 'text_box'}:
            continue
        text = ai_shape_text(shape)
        fill = resolve_color(shape.get('fill') or shape.get('fill_color'), 'none').lower()
        if not text or not fill or fill == 'none' or fill.startswith('rgba(0,0,0,0'):
            continue
        role = safe_text(shape.get('role'))
        if role in AUXILIARY_TEXT_ROLES or role in {'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'}:
            continue
        bounds = ai_shape_bounds_in(shape)
        if bounds is None:
            continue
        current_margin = margin_inches(shape)
        if current_margin >= MIN_TEXT_CARD_INTERNAL_PADDING_IN:
            continue
        failures.append({
            'reason': 'ai_first_text_card_internal_padding_too_small',
            'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
            'role': role,
            'current_margin_in': round(current_margin, 4),
            'required_inset_in': MIN_TEXT_CARD_INTERNAL_PADDING_IN,
            'shape_bounds': {key: round(bounds[key], 4) for key in ('left_in', 'top_in', 'width_in', 'height_in')},
            'text_repair_instruction': 'Filled text cards must carry their own internal padding; set margin to at least 0.15in or split the card into a background panel plus inset text box.',
        })
    return failures


def ai_short_label_wrap_failures(
    shapes: list[dict],
    *,
    ai_shape_bounds_in,
    ai_shape_font_size,
    ai_shape_quality_role,
    ai_shape_text,
    estimated_text_lines,
    margin_inches,
    normalized_text_char_count,
    shape_kind,
    safe_text,
    weighted_text_width_pt,
) -> list[dict]:
    failures = []
    for shape in shapes:
        role = safe_text(shape.get('role'))
        if role not in {'route_label', 'gate_card'}:
            continue
        if ai_shape_quality_role(shape) != 'content' or shape_kind(shape) not in {'text', 'text_box'}:
            continue
        text = ai_shape_text(shape)
        if not text:
            continue
        bounds = ai_shape_bounds_in(shape)
        if bounds is None:
            continue
        normalized_chars = normalized_text_char_count(text)
        if normalized_chars > SHORT_ROUTE_LABEL_MAX_NORMALIZED_CHARS:
            continue
        estimated_lines = estimated_text_lines(shape, bounds)
        if estimated_lines <= 1:
            continue
        font_size = ai_shape_font_size(shape, role)
        required_width = max(
            MIN_SHORT_ROUTE_LABEL_WIDTH_IN,
            (weighted_text_width_pt(text, font_size) / 72.0) + (2 * margin_inches(shape)),
        )
        failures.append({
            'reason': 'ai_first_route_label_unbalanced_wrap',
            'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
            'role': role,
            'text_char_count': normalized_chars,
            'estimated_lines': estimated_lines,
            'width_in': round(bounds['width_in'], 4),
            'minimum_width_in': round(required_width, 4),
            'text_repair_instruction': 'Short route/gate labels should read as one balanced line; widen the label box or shorten the sentence instead of allowing an awkward wrap.',
        })
    return failures


def rect_overlap_area_in(rect_a: dict, rect_b: dict) -> float:
    overlap_w = max(
        0.0,
        min(rect_a['left_in'] + rect_a['width_in'], rect_b['left_in'] + rect_b['width_in'])
        - max(rect_a['left_in'], rect_b['left_in'])
    )
    overlap_h = max(
        0.0,
        min(rect_a['top_in'] + rect_a['height_in'], rect_b['top_in'] + rect_b['height_in'])
        - max(rect_a['top_in'], rect_b['top_in'])
    )
    return overlap_w * overlap_h


def ai_text_overlap_failures(
    shapes: list[dict],
    *,
    ai_shape_bounds_in,
    ai_shape_quality_role,
    ai_shape_text,
    estimated_text_height_in,
    shape_kind,
    safe_text,
) -> list[dict]:
    text_shapes = [
        shape for shape in shapes
        if ai_shape_quality_role(shape) == 'content'
        and shape_kind(shape) in {'text', 'text_box'}
        and ai_shape_text(shape)
        and ai_shape_bounds_in(shape) is not None
    ]
    failures = []
    for left_index, shape_a in enumerate(text_shapes):
        rect_a = ai_shape_bounds_in(shape_a)
        if rect_a is None:
            continue
        visible_a = {
            **rect_a,
            'height_in': min(rect_a['height_in'], estimated_text_height_in(shape_a, rect_a)),
        }
        for shape_b in text_shapes[left_index + 1:]:
            rect_b = ai_shape_bounds_in(shape_b)
            if rect_b is None:
                continue
            visible_b = {
                **rect_b,
                'height_in': min(rect_b['height_in'], estimated_text_height_in(shape_b, rect_b)),
            }
            overlap_area = rect_overlap_area_in(visible_a, visible_b)
            if overlap_area <= MIN_TEXT_OVERLAP_AREA_IN2:
                continue
            failures.append({
                'reason': 'ai_first_text_box_overlap',
                'shape_id': safe_text(shape_a.get('shape_id'), '<missing-shape-id>'),
                'other_shape_id': safe_text(shape_b.get('shape_id'), '<missing-shape-id>'),
                'overlap_area_in2': round(overlap_area, 4),
            })
    return failures


def ai_structural_text_collision_failures(
    shapes: list[dict],
    *,
    ai_shape_bounds_in,
    ai_shape_quality_role,
    ai_shape_text,
    estimated_text_height_in,
    shape_kind,
    structural_visual_shape,
    safe_text,
) -> list[dict]:
    text_shapes = [
        shape for shape in shapes
        if ai_shape_quality_role(shape) == 'content'
        and shape_kind(shape) in {'text', 'text_box'}
        and safe_text(shape.get('role')) in STRUCTURAL_TEXT_COLLISION_ROLES
        and ai_shape_text(shape)
        and ai_shape_bounds_in(shape) is not None
    ]
    structural_shapes = [
        shape for shape in shapes
        if structural_visual_shape(shape)
        and shape_kind(shape) in {'line', 'connector'}
        and ai_shape_bounds_in(shape) is not None
    ]
    failures = []
    for text_shape in text_shapes:
        text_rect = ai_shape_bounds_in(text_shape)
        if text_rect is None:
            continue
        visible_text_rect = {
            **text_rect,
            'height_in': min(text_rect['height_in'], estimated_text_height_in(text_shape, text_rect)),
        }
        for structural_shape in structural_shapes:
            structural_rect = ai_shape_bounds_in(structural_shape)
            if structural_rect is None:
                continue
            overlap_area = rect_overlap_area_in(visible_text_rect, structural_rect)
            if overlap_area <= MIN_STRUCTURAL_TEXT_COLLISION_AREA_IN2:
                continue
            failures.append({
                'reason': 'ai_first_structural_text_collision',
                'shape_id': safe_text(text_shape.get('shape_id'), '<missing-shape-id>'),
                'other_shape_id': safe_text(structural_shape.get('shape_id'), '<missing-shape-id>'),
                'role': safe_text(text_shape.get('role')),
                'other_role': safe_text(structural_shape.get('role')),
                'overlap_area_in2': round(overlap_area, 4),
                'required_gap_in': MIN_STRUCTURAL_TEXT_CLEARANCE_IN,
            })
    return failures
