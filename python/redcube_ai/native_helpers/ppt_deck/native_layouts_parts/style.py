from redcube_ai.native_helpers.ppt_deck.native_layout_constants import PALETTE
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import safe_text

__all__ = [
    'resolve_color',
    'ai_shape_fill',
    'ai_shape_line',
    'ai_shape_line_width_pt',
    'ai_shape_line_end',
    'officecli_line_prop',
    'officecli_valign',
    'ai_shape_color',
]


def resolve_color(value, default_key: str) -> str:
    if isinstance(value, dict):
        value = value.get('color') or value.get('value')
    color = safe_text(value, default_key)
    return PALETTE.get(color, color)


def ai_shape_fill(shape_spec: dict, *, text: str) -> str:
    return resolve_color(shape_spec.get('fill') or shape_spec.get('fill_color'), 'none')


def ai_shape_line(shape_spec: dict, *, text: str) -> str:
    return resolve_color(shape_spec.get('line') or shape_spec.get('line_color') or shape_spec.get('stroke'), 'none')


def ai_shape_line_width_pt(shape_spec: dict) -> float:
    line_spec = shape_spec.get('line')
    width = None
    if isinstance(line_spec, dict):
        width = line_spec.get('width_pt') or line_spec.get('width') or line_spec.get('line_width')
    if width is None:
        width = shape_spec.get('line_width') or shape_spec.get('stroke_width') or 1.0
    try:
        numeric = float(width)
    except (TypeError, ValueError):
        numeric = 1.0
    return max(numeric, 0.0)


def ai_shape_line_end(shape_spec: dict, *, end: str) -> str:
    line_spec = shape_spec.get('line') if isinstance(shape_spec.get('line'), dict) else {}
    keys = ['headEnd', 'head_end', 'arrowStart', 'arrow_start'] if end == 'head' else ['tailEnd', 'tail_end', 'arrowEnd', 'arrow_end']
    raw = next((source.get(key) for source in (shape_spec, line_spec) for key in keys if source.get(key)), None)
    bool_key = 'begin_arrow' if end == 'head' else 'end_arrow'
    if (shape_spec.get(bool_key) is True or line_spec.get(bool_key) is True) and not raw:
        raw = 'triangle'
    value = safe_text(raw).lower()
    if value in {'none', 'triangle', 'arrow', 'stealth', 'diamond', 'oval'}:
        return value
    return 'none'


def officecli_line_prop(shape_spec: dict, line_color: str) -> str:
    if safe_text(line_color).lower() == 'none':
        return 'none'
    width = ai_shape_line_width_pt(shape_spec)
    return f'{line_color}:{width:g}' if width > 0 else line_color


def officecli_valign(shape_spec: dict) -> str:
    raw = safe_text(shape_spec.get('valign') or shape_spec.get('vertical_align'), 'top').lower()
    if raw in {'mid', 'middle', 'center', 'centre', 'ctr', 'c', 'm'}:
        return 'center'
    if raw in {'bottom', 'b'}:
        return 'bottom'
    return 'top'


def ai_shape_color(shape_spec: dict) -> str:
    return resolve_color(shape_spec.get('color') or shape_spec.get('text_color'), 'ink')
