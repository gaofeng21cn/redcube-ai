from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import (
    ai_shape_color,
    ai_shape_fill,
    ai_shape_line,
    ai_shape_line_end,
    ai_shape_line_width_pt,
    officecli_line_prop,
    officecli_valign,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_metrics import ai_shape_font_size, ai_shape_quality_role, margin_inches

__all__ = [
    'officecli_shape_props',
    'officecli_command_for_ai_shape',
    'native_shape_manifest_record',
]


def officecli_shape_props(shape_spec: dict, bounds_in: dict, bounds_px: dict) -> dict:
    kind = shape_kind(shape_spec)
    role = safe_text(shape_spec.get('role'), 'shape')
    text = ai_shape_text(shape_spec)
    fill = ai_shape_fill(shape_spec, text=text)
    line = ai_shape_line(shape_spec, text=text)
    color = ai_shape_color(shape_spec)
    geometry = 'rect'
    if kind in {'rounded_rect', 'panel'}:
        geometry = 'roundRect'
    elif kind in {'oval', 'circle'}:
        geometry = 'ellipse'
    props = {
        'name': safe_text(shape_spec.get('shape_id')),
        'x': f"{bounds_in['left_in']:.4f}in",
        'y': f"{bounds_in['top_in']:.4f}in",
        'width': f"{bounds_in['width_in']:.4f}in",
        'height': f"{bounds_in['height_in']:.4f}in",
        'preset': 'rect' if kind in {'line', 'connector'} else geometry,
        'fill': line if kind in {'line', 'connector'} else fill,
        'line': 'none' if kind in {'line', 'connector'} else officecli_line_prop(shape_spec, line),
        'lineWidth': f"{ai_shape_line_width_pt(shape_spec):g}pt",
    }
    if text:
        props.update({
            'text': text,
            'font': safe_text(shape_spec.get('font'), 'Aptos'),
            'font.ea': safe_text(shape_spec.get('font_ea') or shape_spec.get('font.ea'), 'Noto Sans CJK SC'),
            'size': f'{ai_shape_font_size(shape_spec, role):g}',
            'color': color,
            'bold': bool(shape_spec.get('bold')) or role in {'title', 'point_index'},
            'align': safe_text(shape_spec.get('align'), 'left'),
            'valign': officecli_valign(shape_spec),
            'autoFit': 'none',
            'margin': f'{margin_inches(shape_spec):g}in',
        })
    return props


def officecli_command_for_ai_shape(shape_spec: dict, slide_index: int, bounds_in: dict, bounds_px: dict) -> dict:
    kind = shape_kind(shape_spec)
    props = officecli_shape_props(shape_spec, bounds_in, bounds_px)
    if kind != 'connector':
        return {
            'command': 'add',
            'parent': f'/slide[{slide_index}]',
            'type': 'shape',
            'props': props,
        }
    line_color = ai_shape_line(shape_spec, text=ai_shape_text(shape_spec))
    connector_props = {
        'name': safe_text(shape_spec.get('shape_id')),
        'shape': safe_text(shape_spec.get('connector_shape') or shape_spec.get('connectorShape'), 'straight'),
        'x': props['x'],
        'y': props['y'],
        'width': props['width'],
        'height': props['height'],
        'color': line_color if safe_text(line_color).lower() != 'none' else '#2563EB',
        'lineWidth': f"{ai_shape_line_width_pt(shape_spec):g}pt",
        'headEnd': ai_shape_line_end(shape_spec, end='head'),
        'tailEnd': ai_shape_line_end(shape_spec, end='tail'),
    }
    if safe_text(shape_spec.get('lineDash') or shape_spec.get('line_dash')):
        connector_props['lineDash'] = safe_text(shape_spec.get('lineDash') or shape_spec.get('line_dash'))
    return {
        'command': 'add',
        'parent': f'/slide[{slide_index}]',
        'type': 'connector',
        'props': connector_props,
    }


def native_shape_manifest_record(shape_spec: dict) -> dict:
    kind = shape_kind(shape_spec)
    role = safe_text(shape_spec.get('role'), 'shape')
    text = ai_shape_text(shape_spec)
    return {
        'shape_id': safe_text(shape_spec.get('shape_id')),
        'kind': 'line' if kind in {'line', 'connector'} else ('text_box' if kind in {'text', 'text_box'} else ('oval' if kind in {'oval', 'circle'} else 'rounded_rect' if kind in {'rounded_rect', 'panel'} else 'rect')),
        'role': role,
        'quality_role': ai_shape_quality_role(shape_spec),
        'bounds': shape_rect_from_ai_bounds(shape_spec),
        'text': text,
        'font_size': ai_shape_font_size(shape_spec, role) if text else 0,
        'margin_in': margin_inches(shape_spec) if text else 0,
        'fill': ai_shape_fill(shape_spec, text=text) if kind not in {'line', 'connector'} else 'none',
        'line': ai_shape_line(shape_spec, text=text),
        'officecli_materialized': True,
    }
