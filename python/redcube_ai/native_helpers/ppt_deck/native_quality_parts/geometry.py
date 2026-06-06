import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import (COMPOSITION_BUCKET_PX, MIN_NATIVE_TEXT_PANEL_INSET_PX)


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


def bucket_px(value: float) -> int:
    return int(round(float(value or 0.0) / COMPOSITION_BUCKET_PX))
