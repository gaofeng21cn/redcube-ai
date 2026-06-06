import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import (
    AUXILIARY_TEXT_ROLES,
    CONTENT_DEPTH_EXCLUDED_ROLES,
    MIN_AUDIENCE_LABEL_FONT_PT,
    MIN_NATIVE_BODY_FONT_PT,
    MIN_NATIVE_TEXT_PANEL_INSET_PX,
    MIN_NATIVE_TITLE_CORE_GAP_PX,
    MIN_POINT_TEXT_CONTENT_CHARS,
    OPERATOR_LANGUAGE_FRAGMENTS,
    SYSTEM_MAP_CONTENT_ROLES,
    TITLE_SAFE_ZONE_BOTTOM,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.geometry import (
    normalized_text_char_count,
    text_shape_bottom,
    text_shape_estimated_lines,
    weighted_text_width_px,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.layout_slots import (
    content_slot_shapes,
    shapes_with_role,
)


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


def title_core_overlap_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for title_shape in title_text_shapes(native_shapes):
        for core_shape in core_sentence_shapes(native_shapes):
            failure = title_core_overlap_failure(title_shape, core_shape)
            if failure:
                failures.append(failure)
    return failures


def title_text_shapes(native_shapes: list[dict]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]


def core_sentence_shapes(native_shapes: list[dict]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('role') == 'core_sentence' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]


def title_core_overlap_failure(title_shape: dict, core_shape: dict) -> dict | None:
    title_rect = title_shape.get('bounds') or {}
    core_rect = core_shape.get('bounds') or {}
    horizontal_overlap = min(
        float(title_rect.get('right') or 0.0),
        float(core_rect.get('right') or 0.0),
    ) - max(
        float(title_rect.get('left') or 0.0),
        float(core_rect.get('left') or 0.0),
    )
    if horizontal_overlap <= 0:
        return None
    gap = float(core_rect.get('top') or 0.0) - text_shape_bottom(title_shape)
    if gap >= MIN_NATIVE_TITLE_CORE_GAP_PX:
        return None
    return {
        'title_shape_id': title_shape.get('shape_id'),
        'core_shape_id': core_shape.get('shape_id'),
        'gap_px': round(gap, 2),
        'threshold_px': MIN_NATIVE_TITLE_CORE_GAP_PX,
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
