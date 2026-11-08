from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, native_ai_design_shapes, safe_text, visible_text
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.rules import audience_content_slot_shape

__all__ = [
    'slide_title',
    'layout_family',
    'primary_point_count',
]


def slide_title(slide_data, index: int) -> str:
    for shape in native_ai_design_shapes(slide_data):
        if safe_text(shape.get('role')) == 'title':
            text = ai_shape_text(shape)
            if text:
                return text
    return visible_text(slide_data.get('title'), f'Slide {index}')


def layout_family(slide_data: dict) -> str:
    nested = slide_data.get('visual_presentation') if isinstance(slide_data.get('visual_presentation'), dict) else {}
    return safe_text(slide_data.get('layout_family') or nested.get('layout_family'), 'ai_spatial_plan')


def primary_point_count(shapes: list[dict]) -> int:
    count = sum(1 for shape in shapes if audience_content_slot_shape(shape) and safe_text(shape.get('role')).lower() in {'point_text', 'body', 'body_sentence', 'content'})
    return max(1, min(count, 5))
