from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, safe_list, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_package import source_payload_sha256
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
    'canonical_object_kind',
    'officecli_shape_props',
    'officecli_command_for_ai_shape',
    'native_shape_manifest_record',
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


def _picture_crop(shape_spec: dict) -> dict | None:
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


def canonical_object_kind(shape_spec: dict) -> str:
    raw = shape_kind(shape_spec)
    kind = OBJECT_KIND_ALIASES.get(raw, raw)
    if kind not in SUPPORTED_OBJECT_KINDS:
        raise ValueError(f'unsupported native PPT object kind: {raw or "<missing>"}')
    return kind


def _base_bounds_props(shape_spec: dict, bounds_in: dict) -> dict:
    return {
        'name': safe_text(shape_spec.get('shape_id')),
        'x': f"{bounds_in['left_in']:.4f}in",
        'y': f"{bounds_in['top_in']:.4f}in",
        'width': f"{bounds_in['width_in']:.4f}in",
        'height': f"{bounds_in['height_in']:.4f}in",
    }


def officecli_shape_props(shape_spec: dict, bounds_in: dict, bounds_px: dict) -> dict:
    del bounds_px
    kind = canonical_object_kind(shape_spec)
    role = safe_text(shape_spec.get('role'), 'shape')
    text = ai_shape_text(shape_spec)
    fill = ai_shape_fill(shape_spec, text=text)
    line = ai_shape_line(shape_spec, text=text)
    color = ai_shape_color(shape_spec)
    geometry = safe_text(shape_spec.get('preset') or shape_spec.get('geometry'))
    if not geometry:
        geometry = {
            'rounded_rect': 'roundRect',
            'oval': 'ellipse',
        }.get(kind, 'rect')
    props = {
        **_base_bounds_props(shape_spec, bounds_in),
        'preset': geometry,
        'fill': fill,
        'line': officecli_line_prop(shape_spec, line),
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


def _connector_command(shape_spec: dict, slide_index: int, bounds_in: dict) -> dict:
    line_color = ai_shape_line(shape_spec, text=ai_shape_text(shape_spec))
    props = {
        **_base_bounds_props(shape_spec, bounds_in),
        'shape': safe_text(shape_spec.get('connector_shape') or shape_spec.get('connectorShape'), 'straight'),
        'color': line_color if safe_text(line_color).lower() != 'none' else '#2563EB',
        'lineWidth': f"{ai_shape_line_width_pt(shape_spec):g}pt",
        'headEnd': ai_shape_line_end(shape_spec, end='head'),
        'tailEnd': ai_shape_line_end(shape_spec, end='tail'),
    }
    from_shape = safe_text(shape_spec.get('from_shape_id') or shape_spec.get('from'))
    to_shape = safe_text(shape_spec.get('to_shape_id') or shape_spec.get('to'))
    if from_shape:
        props['from'] = from_shape if from_shape.startswith('/') else f'/slide[{slide_index}]/shape[@name={from_shape}]'
    if to_shape:
        props['to'] = to_shape if to_shape.startswith('/') else f'/slide[{slide_index}]/shape[@name={to_shape}]'
    line_dash = safe_text(shape_spec.get('lineDash') or shape_spec.get('line_dash'))
    if line_dash:
        props['lineDash'] = line_dash
    return {'command': 'add', 'parent': f'/slide[{slide_index}]', 'type': 'connector', 'props': props}


def _picture_command(shape_spec: dict, slide_index: int, bounds_in: dict) -> dict:
    source = _picture_source(shape_spec)
    if not source:
        raise ValueError(f"native PPT picture requires src: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    props = {**_base_bounds_props(shape_spec, bounds_in), 'src': source}
    for source_key, target_key in [
        ('alt', 'alt'),
        ('crop', 'crop'),
        ('crop_left', 'cropLeft'),
        ('crop_right', 'cropRight'),
        ('crop_top', 'cropTop'),
        ('crop_bottom', 'cropBottom'),
        ('rotation', 'rotation'),
        ('opacity', 'opacity'),
    ]:
        value = shape_spec.get(source_key)
        if value not in (None, ''):
            props[target_key] = value
    return {'command': 'add', 'parent': f'/slide[{slide_index}]', 'type': 'picture', 'props': props}


def _picture_source(shape_spec: dict) -> str:
    return safe_text(
        shape_spec.get('source_file')
        or shape_spec.get('src')
        or shape_spec.get('source')
        or shape_spec.get('file')
        or shape_spec.get('source_data_uri')
    )


def _chart_command(shape_spec: dict, slide_index: int, bounds_in: dict) -> dict:
    intent = safe_text(shape_spec.get('materialization_intent'), 'native_data_object')
    if intent != 'native_data_object':
        raise ValueError('stable_drawingml chart must provide children and be materialized as a grouped drawing')
    categories = safe_list(shape_spec.get('categories'))
    series = safe_list(shape_spec.get('series'))
    if not categories or not series:
        raise ValueError(f"native PPT chart requires categories and series: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    props = {
        **_base_bounds_props(shape_spec, bounds_in),
        'chartType': safe_text(shape_spec.get('chart_type') or shape_spec.get('chartType'), 'column'),
        'categories': ','.join(str(value) for value in categories),
    }
    title = safe_text(shape_spec.get('title'))
    if title:
        props['title'] = title
    for index, item in enumerate(series, 1):
        if not isinstance(item, dict) or not safe_list(item.get('values')):
            raise ValueError(f'native PPT chart series {index} requires values')
        values = safe_list(item.get('values'))
        if len(values) != len(categories):
            raise ValueError(
                f'native PPT chart series {index} value count must match categories: '
                f'{len(values)} != {len(categories)}'
            )
        props[f'series{index}.name'] = safe_text(item.get('name'), f'Series {index}')
        props[f'series{index}.values'] = ','.join(str(value) for value in values)
        color = safe_text(item.get('color'))
        if color:
            props[f'series{index}.color'] = color
    return {'command': 'add', 'parent': f'/slide[{slide_index}]', 'type': 'chart', 'props': props}


def _table_command(shape_spec: dict, slide_index: int, bounds_in: dict, kind: str) -> dict:
    intent = safe_text(shape_spec.get('materialization_intent'), 'native_data_object')
    if intent != 'native_data_object':
        raise ValueError(f'stable_drawingml {kind} must provide children and be materialized as a grouped drawing')
    data = safe_list(shape_spec.get('data'))
    if not data or not all(isinstance(row, list) and row for row in data):
        raise ValueError(f"native PPT {kind} requires rectangular data: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    column_count = len(data[0])
    if any(len(row) != column_count for row in data):
        raise ValueError(f'native PPT {kind} data rows must have equal length')
    if any(',' in str(value) or ';' in str(value) for row in data for value in row):
        raise ValueError(f'native PPT {kind} data cells cannot contain comma or semicolon in OfficeCLI inline mode')
    props = {
        **_base_bounds_props(shape_spec, bounds_in),
        'rows': len(data),
        'cols': column_count,
        'data': ';'.join(','.join(str(value) for value in row) for row in data),
        'firstRow': bool(shape_spec.get('first_row', True)),
    }
    header_fill = safe_text(shape_spec.get('header_fill'))
    if header_fill:
        props['headerFill'] = header_fill
    return {'command': 'add', 'parent': f'/slide[{slide_index}]', 'type': 'table', 'props': props}


def officecli_command_for_ai_shape(shape_spec: dict, slide_index: int, bounds_in: dict, bounds_px: dict) -> dict:
    kind = canonical_object_kind(shape_spec)
    if kind in {'line', 'connector'}:
        return _connector_command(shape_spec, slide_index, bounds_in)
    if kind == 'picture':
        return _picture_command(shape_spec, slide_index, bounds_in)
    if kind == 'chart':
        return _chart_command(shape_spec, slide_index, bounds_in)
    if kind in {'table', 'metric_grid'}:
        return _table_command(shape_spec, slide_index, bounds_in, kind)
    if kind == 'group':
        raise ValueError('native PPT group requires child materialization before group creation')
    props = officecli_shape_props(shape_spec, bounds_in, bounds_px)
    object_type = 'textbox' if kind == 'text_box' else 'shape'
    return {'command': 'add', 'parent': f'/slide[{slide_index}]', 'type': object_type, 'props': props}


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
        'fill': ai_shape_fill(shape_spec, text=text) if kind not in {'line', 'connector', 'picture', 'chart', 'table', 'metric_grid'} else 'none',
        'line': ai_shape_line(shape_spec, text=text),
        'materialization_intent': safe_text(shape_spec.get('materialization_intent'), 'native_data_object' if kind in {'chart', 'table', 'metric_grid'} else 'native_object'),
        'officecli_materialized': True,
    }
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
        record['source_payload_sha256'] = source_payload_sha256(_picture_source(shape_spec))
        record['alt'] = safe_text(shape_spec.get('alt'))
        record['crop'] = _picture_crop(shape_spec) or {
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
