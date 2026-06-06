from redcube_ai.native_helpers.ppt_deck.native_layout_constants import (
    BODY_TEXT_READABILITY_FLOOR_PT,
    CONTENT_DEPTH_EXCLUDED_ROLES,
    CONTENT_TEXT_DEFAULT_MARGIN_IN,
    LEAD_SENTENCE_TEXT_ROLES,
    MIN_BODY_SENTENCE_TEXT_HEIGHT_IN,
    MIN_COMPACT_TEXT_HEIGHT_IN,
    MIN_LEAD_SENTENCE_TEXT_HEIGHT_IN,
    MIN_POINT_TEXT_CONTENT_CHARS,
    OFFICECLI_DEFAULT_TEXT_MARGIN_IN,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import ai_shape_bounds_in

__all__ = [
    'ai_shape_quality_role',
    'ai_shape_font_size',
    'weighted_text_width_pt',
    'estimated_text_height_in',
    'margin_inches',
    'normalized_text_char_count',
    'estimated_text_lines',
    'ai_text_capacity_failure',
    'normalized_content_char_count',
    'ai_content_depth_failures',
    'ai_page_number_failures',
]


def ai_shape_quality_role(shape_spec: dict) -> str:
    quality_role = safe_text(shape_spec.get('quality_role')).lower()
    if quality_role in {'content', 'decorative', 'auxiliary', 'structural'}:
        return quality_role
    return ''


def ai_shape_font_size(shape_spec: dict, role: str) -> float:
    try:
        explicit = float(shape_spec.get('font_size') or shape_spec.get('size_pt') or shape_spec.get('size') or 0)
    except (TypeError, ValueError):
        explicit = 0
    return explicit if explicit > 0 else 0.0


def weighted_text_width_pt(text: str, font_size: float) -> float:
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


def estimated_text_height_in(shape_spec: dict, bounds: dict) -> float:
    text = ai_shape_text(shape_spec)
    if not text:
        return 0.0
    font_size = ai_shape_font_size(shape_spec, safe_text(shape_spec.get('role')))
    margin_in = margin_inches(shape_spec)
    estimated_lines = estimated_text_lines(shape_spec, bounds)
    return (estimated_lines * font_size * 1.18 / 72.0) + (2 * margin_in)


def margin_inches(shape_spec: dict) -> float:
    role = safe_text(shape_spec.get('role'))
    quality_role = ai_shape_quality_role(shape_spec)
    default_margin = (
        CONTENT_TEXT_DEFAULT_MARGIN_IN
        if quality_role == 'content' and role not in {'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'}
        else OFFICECLI_DEFAULT_TEXT_MARGIN_IN
    )
    raw_margin_in = shape_spec.get('margin_in')
    if raw_margin_in is not None:
        try:
            margin_in = float(raw_margin_in)
            if margin_in >= 0:
                return margin_in
        except (TypeError, ValueError):
            pass
    raw = safe_text(shape_spec.get('margin'), f'{default_margin:g}in').lower()
    try:
        return float(raw[:-2]) if raw.endswith('in') else float(raw)
    except ValueError:
        return default_margin


def normalized_text_char_count(text: str) -> int:
    return sum(1 for char in safe_text(text) if not char.isspace() and char not in {'，', '。', '、', ',', '.', ':', '：', ';', '；'})


def estimated_text_lines(shape_spec: dict, bounds: dict) -> int:
    text = ai_shape_text(shape_spec)
    if not text:
        return 0
    font_size = ai_shape_font_size(shape_spec, safe_text(shape_spec.get('role')))
    margin_in = margin_inches(shape_spec)
    usable_width_pt = max((bounds['width_in'] - (2 * margin_in)) * 72.0, 1.0)
    return max(1, int((weighted_text_width_pt(text, font_size) + usable_width_pt - 1.0) // usable_width_pt))


def ai_text_capacity_failure(shape_spec: dict) -> dict | None:
    kind = shape_kind(shape_spec)
    if kind not in {'text', 'text_box'}:
        return None
    text = ai_shape_text(shape_spec)
    if not text:
        return None
    bounds = ai_shape_bounds_in(shape_spec)
    if bounds is None:
        return None
    role = safe_text(shape_spec.get('role'))
    font_size = ai_shape_font_size(shape_spec, role)
    margin_in = margin_inches(shape_spec)
    compact_min_height_in = MIN_BODY_SENTENCE_TEXT_HEIGHT_IN if role not in {'point_index'} and len(text) >= 18 else MIN_COMPACT_TEXT_HEIGHT_IN
    if role in LEAD_SENTENCE_TEXT_ROLES and font_size >= 20 and len(text) >= 12:
        compact_min_height_in = max(compact_min_height_in, MIN_LEAD_SENTENCE_TEXT_HEIGHT_IN)
    if (
        font_size >= BODY_TEXT_READABILITY_FLOOR_PT
        and role not in {'title', 'subtitle', 'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'}
        and bounds['height_in'] < compact_min_height_in
    ):
        return {
            'reason': 'ai_first_text_box_height_below_readability_floor',
            'shape_id': safe_text(shape_spec.get('shape_id'), '<missing-shape-id>'),
            'role': role,
            'font_size': round(font_size, 2),
            'text_char_count': len(text),
            'height_in': round(bounds['height_in'], 4),
            'minimum_height_in': compact_min_height_in,
        }
    usable_width_pt = max((bounds['width_in'] - (2 * margin_in)) * 72.0, 1.0)
    usable_height_pt = max((bounds['height_in'] - (2 * margin_in)) * 72.0, 1.0)
    estimated_lines = max(1, int((weighted_text_width_pt(text, font_size) + usable_width_pt - 1.0) // usable_width_pt))
    required_height_pt = estimated_lines * font_size * 1.18
    if required_height_pt <= usable_height_pt:
        return None
    return {
        'reason': 'ai_first_text_capacity_exceeded',
        'shape_id': safe_text(shape_spec.get('shape_id'), '<missing-shape-id>'),
        'role': role,
        'font_size': round(font_size, 2),
        'estimated_lines': estimated_lines,
        'required_height_pt': round(required_height_pt, 2),
        'usable_height_pt': round(usable_height_pt, 2),
        'suggested_height_in': round((required_height_pt / 72.0) + (2 * margin_in), 3),
    }


def normalized_content_char_count(text: str) -> int:
    return sum(1 for char in safe_text(text) if not char.isspace() and char not in {'，', '。', '、', ',', '.', ':', '：', ';', '；'})


def ai_content_depth_failures(shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in shapes:
        role = safe_text(shape.get('role'))
        if ai_shape_quality_role(shape) != 'content':
            continue
        if role in CONTENT_DEPTH_EXCLUDED_ROLES:
            continue
        text = ai_shape_text(shape)
        if not text:
            continue
        char_count = normalized_content_char_count(text)
        if char_count < MIN_POINT_TEXT_CONTENT_CHARS:
            failures.append({
                'reason': 'ai_first_content_depth_too_low',
                'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
                'role': role,
                'text_char_count': char_count,
                'threshold': MIN_POINT_TEXT_CONTENT_CHARS,
            })
    return failures


def ai_page_number_failures(shapes: list[dict]) -> list[dict]:
    if any(
        safe_text(shape.get('role')) in {'page_number', 'page_no', 'page'}
        and ai_shape_text(shape)
        for shape in shapes
    ):
        return []
    return [{'reason': 'ai_first_page_number_missing'}]
