"""Canonical native PPT object specifications and manifest records."""
from __future__ import annotations

from redcube_ai.native_helpers.ppt_deck.native_hyperlinks import planned_hyperlinks
from redcube_ai.native_helpers.ppt_deck.native_layouts.common import (
    ai_shape_text,
    safe_list,
    safe_text,
    shape_kind,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.geometry import shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_layouts.style import (
    ai_shape_fill,
    ai_shape_line,
    ai_shape_line_end,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.text_metrics import (
    ai_shape_font_size,
    ai_shape_quality_role,
    margin_inches,
)
from redcube_ai.native_helpers.ppt_deck.native_package import source_payload_sha256

__all__ = [
    'OBJECT_KIND_ALIASES',
    'SUPPORTED_OBJECT_KINDS',
    'canonical_object_kind',
    'native_shape_manifest_record',
    'picture_crop',
    'picture_source',
]

OBJECT_KIND_ALIASES = {
    'text': 'text_box',
    'textbox': 'text_box',
    'rectangle': 'rect',
    'panel': 'rounded_rect',
    'circle': 'oval',
    'image': 'picture',
    'preset_shape': 'shape',
}

SUPPORTED_OBJECT_KINDS = {
    'text_box',
    'shape',
    'rect',
    'rounded_rect',
    'oval',
    'line',
    'connector',
    'picture',
    'group',
    'path',
    'chart',
    'table',
    'metric_grid',
}


def _number_or_text(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return value
    return int(number) if number.is_integer() else number


def picture_crop(shape_spec: dict) -> dict | None:
    raw = shape_spec.get('crop')
    if raw not in (None, ''):
        if isinstance(raw, dict):
            values = [raw.get(key, 0) for key in ('left', 'top', 'right', 'bottom')]
        elif isinstance(raw, (list, tuple)):
            values = list(raw)
        else:
            values = [value.strip() for value in str(raw).split(',')]
        if len(values) != 4:
            raise ValueError('native PPT picture crop must contain left, top, right, and bottom')
        return dict(zip(('left', 'top', 'right', 'bottom'), (_number_or_text(value) for value in values)))
    explicit = [shape_spec.get(f'crop_{key}') for key in ('left', 'top', 'right', 'bottom')]
    if all(value in (None, '') for value in explicit):
        return None
    return dict(zip(
        ('left', 'top', 'right', 'bottom'),
        (_number_or_text(value if value not in (None, '') else 0) for value in explicit),
    ))


def picture_source(shape_spec: dict) -> str:
    return safe_text(
        shape_spec.get('source_file')
        or shape_spec.get('src')
        or shape_spec.get('source')
        or shape_spec.get('file')
        or shape_spec.get('source_data_uri')
    )


def canonical_object_kind(shape_spec: dict) -> str:
    raw = shape_kind(shape_spec)
    kind = OBJECT_KIND_ALIASES.get(raw, raw)
    if kind not in SUPPORTED_OBJECT_KINDS:
        raise ValueError(f'unsupported native PPT object kind: {raw or "<missing>"}')
    return kind


def native_shape_manifest_record(shape_spec: dict) -> dict:
    kind = canonical_object_kind(shape_spec)
    role = safe_text(shape_spec.get('role'), 'shape')
    text = ai_shape_text(shape_spec)
    record = {
        'shape_id': safe_text(shape_spec.get('shape_id')),
        'kind': kind,
        'semantic_kind': kind,
        'role': role,
        'quality_role': ai_shape_quality_role(shape_spec),
        'bounds': shape_rect_from_ai_bounds(shape_spec),
        'text': text,
        'font_size': ai_shape_font_size(shape_spec, role) if text else 0,
        'margin_in': margin_inches(shape_spec) if text else 0,
        'fill': (
            ai_shape_fill(shape_spec, text=text)
            if kind not in {'line', 'connector', 'picture', 'chart', 'table', 'metric_grid'}
            else 'none'
        ),
        'line': ai_shape_line(shape_spec, text=text),
        'materialization_intent': safe_text(
            shape_spec.get('materialization_intent'),
            'native_data_object' if kind in {'chart', 'table', 'metric_grid'} else 'native_object',
        ),
        'python_pptx_materialized': True,
        'hyperlinks': planned_hyperlinks(shape_spec),
    }
    if kind == 'connector':
        record.update({
            'from_shape_id': safe_text(shape_spec.get('from_shape_id') or shape_spec.get('from')),
            'to_shape_id': safe_text(shape_spec.get('to_shape_id') or shape_spec.get('to')),
            'head_end': ai_shape_line_end(shape_spec, end='head'),
            'tail_end': ai_shape_line_end(shape_spec, end='tail'),
        })
    if kind == 'chart':
        record.update({
            'chart_type': safe_text(shape_spec.get('chart_type') or shape_spec.get('chartType'), 'column'),
            'categories': safe_list(shape_spec.get('categories')),
            'series': safe_list(shape_spec.get('series')),
            'metrics': dict(shape_spec.get('metrics')) if isinstance(shape_spec.get('metrics'), dict) else {},
        })
    if kind in {'table', 'metric_grid'}:
        metrics = dict(shape_spec.get('metrics')) if isinstance(shape_spec.get('metrics'), dict) else {}
        body_font_size = shape_spec.get('body_font_size')
        if body_font_size not in (None, ''):
            metrics.setdefault('min_font_pt', body_font_size)
        record.update({
            'data': safe_list(shape_spec.get('data')),
            'first_row': shape_spec.get('first_row', True) is not False,
            'body_font_size': body_font_size,
            'metrics': metrics,
        })
        for key in (
            'header_fill',
            'header_color',
            'header_font',
            'header_font_size',
            'body_font',
            'body_color',
        ):
            if shape_spec.get(key) not in (None, ''):
                record[key] = shape_spec[key]
    if kind == 'picture':
        record['source_payload_sha256'] = source_payload_sha256(picture_source(shape_spec))
        record['alt'] = safe_text(shape_spec.get('alt'))
        record['crop'] = picture_crop(shape_spec) or {
            'left': 0,
            'top': 0,
            'right': 0,
            'bottom': 0,
        }
    if kind == 'group' or (
        kind in {'chart', 'table', 'metric_grid'}
        and safe_text(shape_spec.get('materialization_intent')) == 'stable_drawingml'
    ):
        children = safe_list(shape_spec.get('drawingml_shapes') or shape_spec.get('children'))
        record['children'] = [native_shape_manifest_record(item) for item in children if isinstance(item, dict)]
        record['child_object_count'] = len(record['children'])
    return record
