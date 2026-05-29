from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import *  # noqa: F403


def panel_text_safe_area_failures(native_shapes: list[dict]) -> list[dict]:
    panels = [
        shape for shape in native_shapes
        if safe_text(shape.get('role')) in TEXT_PANEL_ROLES
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
            required_delta = {
                'left': safe_left - float(text_rect.get('left') or 0.0),
                'top': safe_top - float(text_rect.get('top') or 0.0),
                'right': text_right - safe_right,
                'bottom': text_bottom - safe_bottom,
            }
            if (
                required_delta['left'] <= PANEL_SAFE_AREA_EPSILON_PX
                and required_delta['top'] <= PANEL_SAFE_AREA_EPSILON_PX
                and required_delta['right'] <= PANEL_SAFE_AREA_EPSILON_PX
                and required_delta['bottom'] <= PANEL_SAFE_AREA_EPSILON_PX
            ):
                continue
            failures.append({
                'shape_id': text_shape.get('shape_id'),
                'panel_shape_id': panel.get('shape_id'),
                'role': text_shape.get('role'),
                'required_inset_px': MIN_NATIVE_TEXT_PANEL_INSET_PX,
            })
    return failures


def text_card_internal_padding_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        if shape.get('quality_role') != 'content':
            continue
        if shape.get('kind') != 'text_box':
            continue
        if not safe_text(shape.get('text')):
            continue
        fill = safe_text(shape.get('fill')).lower()
        if not fill or fill == 'none':
            continue
        role = safe_text(shape.get('role'))
        if role in AUXILIARY_TEXT_ROLES or role in {'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'}:
            continue
        current_margin = float(shape.get('margin_in') or 0.0)
        if current_margin * 72.0 >= MIN_NATIVE_TEXT_CARD_INTERNAL_PADDING_PX - 0.01:
            continue
        failures.append({
            'shape_id': shape.get('shape_id'),
            'role': role,
            'current_margin_px': round(current_margin * 72.0, 2),
            'required_margin_px': MIN_NATIVE_TEXT_CARD_INTERNAL_PADDING_PX,
            'reason': 'native_text_card_internal_padding_too_small',
        })
    return failures
