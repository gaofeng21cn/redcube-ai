from pathlib import Path

from pptx import Presentation

from redcube_ai.native_helpers.ppt_deck.native_layout_constants import (
    EMU_PER_INCH,
    MIN_CONNECTOR_THICKNESS_IN,
    PX_PER_INCH,
    SLIDE_HEIGHT_IN,
    SLIDE_WIDTH_IN,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.common import safe_text, shape_kind

__all__ = [
    'ai_shape_bounds_in',
    'ai_line_bounds_failure',
    'shape_rect_from_ai_bounds',
    'pptx_geometry_audit',
]


def ai_shape_bounds_in(shape_spec: dict):
    bounds = shape_spec.get('bounds') if isinstance(shape_spec.get('bounds'), dict) else {}
    values = []
    for primary, alternate in (
        ('left_in', 'x_in'),
        ('top_in', 'y_in'),
        ('width_in', 'w_in'),
        ('height_in', 'h_in'),
    ):
        raw = bounds.get(primary) if bounds.get(primary) is not None else bounds.get(alternate)
        try:
            values.append(float(raw))
        except (TypeError, ValueError):
            return None
    left, top, width, height = values
    if left < 0 or top < 0 or width <= 0 or height <= 0:
        return None
    if left + width > SLIDE_WIDTH_IN or top + height > SLIDE_HEIGHT_IN:
        return None
    return {
        'left_in': left,
        'top_in': top,
        'width_in': width,
        'height_in': height,
    }


def ai_line_bounds_failure(shape_spec: dict) -> dict | None:
    kind = shape_kind(shape_spec)
    if kind not in {'line', 'connector'}:
        return None
    bounds = shape_spec.get('bounds') if isinstance(shape_spec.get('bounds'), dict) else {}
    try:
        width = float(bounds.get('width_in') if bounds.get('width_in') is not None else bounds.get('w_in'))
        height = float(bounds.get('height_in') if bounds.get('height_in') is not None else bounds.get('h_in'))
    except (TypeError, ValueError):
        return {
            'reason': 'ai_first_connector_bounds_not_numeric',
            'shape_id': safe_text(shape_spec.get('shape_id'), '<missing-shape-id>'),
            'kind': kind,
        }
    if width < MIN_CONNECTOR_THICKNESS_IN or height < MIN_CONNECTOR_THICKNESS_IN:
        return {
            'reason': 'ai_first_connector_thickness_too_small',
            'shape_id': safe_text(shape_spec.get('shape_id'), '<missing-shape-id>'),
            'kind': kind,
            'width_in': round(width, 4),
            'height_in': round(height, 4),
            'minimum_thickness_in': MIN_CONNECTOR_THICKNESS_IN,
        }
    return None


def shape_rect_from_ai_bounds(shape_spec: dict) -> dict:
    bounds = ai_shape_bounds_in(shape_spec)
    if bounds is None:
        raise ValueError(f"native AI-first shape has invalid bounds: {safe_text(shape_spec.get('shape_id'), '<missing-shape-id>')}")
    left = bounds['left_in'] * PX_PER_INCH
    top = bounds['top_in'] * PX_PER_INCH
    width = bounds['width_in'] * PX_PER_INCH
    height = bounds['height_in'] * PX_PER_INCH
    return {
        'left': round(left, 2),
        'top': round(top, 2),
        'width': round(width, 2),
        'height': round(height, 2),
        'right': round(left + width, 2),
        'bottom': round(top + height, 2),
    }


def pptx_geometry_audit(
    pptx_file: Path,
    expected_width_in: float = SLIDE_WIDTH_IN,
    expected_height_in: float = SLIDE_HEIGHT_IN,
) -> dict:
    overflows = []
    prs = Presentation(str(pptx_file))
    if prs.slide_width is None or prs.slide_height is None:
        raise ValueError('PPTX geometry audit failed: missing presentation slide size')
    slide_width_emu = int(prs.slide_width)
    slide_height_emu = int(prs.slide_height)
    slide_width_in = slide_width_emu / EMU_PER_INCH
    slide_height_in = slide_height_emu / EMU_PER_INCH
    for slide_index, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            left = int(shape.left or 0)
            top = int(shape.top or 0)
            width = int(shape.width or 0)
            height = int(shape.height or 0)
            right = left + width
            bottom = top + height
            if left < 0 or top < 0 or right > slide_width_emu or bottom > slide_height_emu:
                text = safe_text(shape.text) if getattr(shape, 'has_text_frame', False) else ''
                overflows.append({
                    'slide_index': slide_index,
                    'shape_name': safe_text(shape.name),
                    'text': text[:80],
                    'left_in': round(left / EMU_PER_INCH, 4),
                    'top_in': round(top / EMU_PER_INCH, 4),
                    'width_in': round(width / EMU_PER_INCH, 4),
                    'height_in': round(height / EMU_PER_INCH, 4),
                    'right_in': round(right / EMU_PER_INCH, 4),
                    'bottom_in': round(bottom / EMU_PER_INCH, 4),
                })
    size_ok = abs(slide_width_in - expected_width_in) < 0.001 and abs(slide_height_in - expected_height_in) < 0.001
    return {
        'slide_width_in': round(slide_width_in, 4),
        'slide_height_in': round(slide_height_in, 4),
        'expected_slide_width_in': round(expected_width_in, 4),
        'expected_slide_height_in': round(expected_height_in, 4),
        'slide_size_ok': size_ok,
        'overflow_count': len(overflows),
        'overflows': overflows,
        'ok': size_ok and len(overflows) == 0,
    }
