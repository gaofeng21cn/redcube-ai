import argparse
import base64
import hashlib
import json
import posixpath
import shutil
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from urllib.parse import unquote_to_bytes
from xml.etree import ElementTree as ET


P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
C_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
P14_NS = 'http://schemas.microsoft.com/office/powerpoint/2010/main'
PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
CONTENT_TYPES_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'

NS = {'p': P_NS, 'a': A_NS, 'r': R_NS, 'c': C_NS, 'rel': PKG_REL_NS}

__all__ = [
    'copy_template_source',
    'patch_chart_data',
    'patch_custom_paths',
    'read_pptx_package',
    'source_payload_sha256',
    'template_preservation',
]

for prefix, namespace in [('p', P_NS), ('a', A_NS), ('r', R_NS), ('c', C_NS)]:
    ET.register_namespace(prefix, namespace)


def _qn(namespace: str, name: str) -> str:
    return f'{{{namespace}}}{name}'


def _local_name(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


def _part_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _file_sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def source_payload_sha256(source: str) -> str:
    if not source.startswith('data:'):
        return _file_sha256(Path(source).expanduser())
    metadata, separator, encoded = source[5:].partition(',')
    if not separator:
        raise ValueError('native PPT picture data URI must contain a payload separator')
    payload = unquote_to_bytes(encoded)
    if 'base64' in {token.lower() for token in metadata.split(';')[1:]}:
        try:
            payload = base64.b64decode(payload, validate=True)
        except ValueError as exc:
            raise ValueError('native PPT picture data URI contains invalid base64') from exc
    return _part_sha256(payload)


def _relationship_part(source_part: str) -> str:
    directory, filename = posixpath.split(source_part)
    return posixpath.join(directory, '_rels', f'{filename}.rels')


def _resolve_target(source_part: str, target: str) -> str:
    if target.startswith('/'):
        return target.lstrip('/')
    return posixpath.normpath(posixpath.join(posixpath.dirname(source_part), target))


def _relationships(archive: zipfile.ZipFile, source_part: str) -> dict[str, dict]:
    rel_part = _relationship_part(source_part)
    if rel_part not in archive.namelist():
        return {}
    root = ET.fromstring(archive.read(rel_part))
    result = {}
    for rel in root.findall('rel:Relationship', NS):
        rel_id = rel.get('Id', '')
        result[rel_id] = {
            'type': rel.get('Type', ''),
            'target': _resolve_target(source_part, rel.get('Target', '')),
        }
    return result


def _ordered_slide_parts(archive: zipfile.ZipFile) -> list[str]:
    presentation_part = 'ppt/presentation.xml'
    if presentation_part not in archive.namelist():
        return []
    root = ET.fromstring(archive.read(presentation_part))
    rels = _relationships(archive, presentation_part)
    parts = []
    for slide_id in root.findall('./p:sldIdLst/p:sldId', NS):
        rel = rels.get(slide_id.get(_qn(R_NS, 'id'), ''))
        if rel and rel['target'] in archive.namelist():
            parts.append(rel['target'])
    return parts


def _shape_name(element: ET.Element) -> tuple[str, str]:
    c_nv_pr = element.find('.//p:cNvPr', NS)
    if c_nv_pr is None:
        return '', ''
    return c_nv_pr.get('name', ''), c_nv_pr.get('id', '')


def _solid_fill(element: ET.Element | None) -> str:
    if element is None:
        return ''
    solid = element.find('./a:solidFill', NS)
    if solid is None:
        return ''
    rgb = solid.find('./a:srgbClr', NS)
    if rgb is not None and rgb.get('val'):
        return f"#{rgb.get('val', '').upper()}"
    scheme = solid.find('./a:schemeClr', NS)
    return scheme.get('val', '') if scheme is not None else ''


def _crop_percent(value: str | None) -> int | float:
    try:
        percent = int(value or 0) / 1000
    except (TypeError, ValueError):
        return 0
    return int(percent) if percent.is_integer() else round(percent, 3)


def _table_cell_record(cell: ET.Element, row_index: int, column_index: int) -> dict:
    run_properties = cell.find('.//a:rPr', NS)
    font = ''
    if run_properties is not None:
        typeface = run_properties.find('./a:latin', NS)
        if typeface is None:
            typeface = run_properties.find('./a:ea', NS)
        font = typeface.get('typeface', '') if typeface is not None else ''
    try:
        font_size_pt = int((run_properties.get('sz') if run_properties is not None else '') or 0) / 100
    except ValueError:
        font_size_pt = 0
    if float(font_size_pt).is_integer():
        font_size_pt = int(font_size_pt)
    text = '\n'.join(
        (node.text or '').strip()
        for node in cell.findall('.//a:t', NS)
        if (node.text or '').strip()
    )
    return {
        'row': row_index,
        'column': column_index,
        'text': text,
        'font': font,
        'font_size_pt': font_size_pt,
        'bold': run_properties is not None and run_properties.get('b', '0') in {'1', 'true'},
        'color': _solid_fill(run_properties),
        'fill': _solid_fill(cell.find('./a:tcPr', NS)),
    }


def _related_part(record: dict, relationship: dict | None) -> None:
    relationship = relationship or {}
    record['relationship_type'] = relationship.get('type', '')
    record['relationship_target'] = relationship.get('target', '')


def _shape_record(element: ET.Element, relationships: dict[str, dict]) -> dict:
    name, object_id = _shape_name(element)
    local = _local_name(element.tag)
    record = {'name': name, 'object_id': object_id, 'kind': 'unknown'}
    if local == 'cxnSp':
        record['kind'] = 'connector'
        connection_properties = element.find('./p:nvCxnSpPr/p:cNvCxnSpPr', NS)
        start_connection = connection_properties.find('./a:stCxn', NS) if connection_properties is not None else None
        end_connection = connection_properties.find('./a:endCxn', NS) if connection_properties is not None else None
        record['from_object_id'] = start_connection.get('id', '') if start_connection is not None else ''
        record['to_object_id'] = end_connection.get('id', '') if end_connection is not None else ''
        line = element.find('./p:spPr/a:ln', NS)
        head = line.find('./a:headEnd', NS) if line is not None else None
        tail = line.find('./a:tailEnd', NS) if line is not None else None
        record['head_end'] = head.get('type', 'none') if head is not None else 'none'
        record['tail_end'] = tail.get('type', 'none') if tail is not None else 'none'
    elif local == 'pic':
        record['kind'] = 'picture'
        c_nv_pr = element.find('.//p:cNvPr', NS)
        record['alt'] = c_nv_pr.get('descr', '') if c_nv_pr is not None else ''
        record['alt_text'] = record['alt']
        record['has_alt'] = bool(record['alt_text'].strip())
        source_rect = element.find('./p:blipFill/a:srcRect', NS)
        record['crop'] = {
            'left': _crop_percent(source_rect.get('l') if source_rect is not None else None),
            'top': _crop_percent(source_rect.get('t') if source_rect is not None else None),
            'right': _crop_percent(source_rect.get('r') if source_rect is not None else None),
            'bottom': _crop_percent(source_rect.get('b') if source_rect is not None else None),
        }
        blip = element.find('.//a:blip', NS)
        rel_id = blip.get(_qn(R_NS, 'embed'), '') if blip is not None else ''
        record['relationship_id'] = rel_id
        _related_part(record, relationships.get(rel_id))
    elif local == 'graphicFrame':
        graphic_data = element.find('./a:graphic/a:graphicData', NS)
        children = list(graphic_data) if graphic_data is not None else []
        child_names = {_local_name(child.tag) for child in children}
        if 'chart' in child_names:
            record['kind'] = 'chart'
            chart = next((child for child in children if _local_name(child.tag) == 'chart'), None)
            rel_id = chart.get(_qn(R_NS, 'id'), '') if chart is not None else ''
            record['relationship_id'] = rel_id
            _related_part(record, relationships.get(rel_id))
        elif 'tbl' in child_names:
            record['kind'] = 'table'
            table = graphic_data.find('.//a:tbl', NS) if graphic_data is not None else None
            rows = table.findall('./a:tr', NS) if table is not None else []
            cells = [
                _table_cell_record(cell, row_index, column_index)
                for row_index, row in enumerate(rows, 1)
                for column_index, cell in enumerate(row.findall('./a:tc', NS), 1)
            ]
            record['row_count'] = len(rows)
            record['column_count'] = len(table.findall('./a:tblGrid/a:gridCol', NS)) if table is not None else 0
            record['cell_count'] = len(cells)
            record['data'] = [
                [cell['text'] for cell in cells if cell['row'] == row_index]
                for row_index in range(1, len(rows) + 1)
            ]
            record['cells'] = cells
        else:
            record['kind'] = 'graphic_frame'
    elif local == 'grpSp':
        record['kind'] = 'group'
    elif local == 'sp':
        sp_pr = element.find('./p:spPr', NS)
        custom_geometry = sp_pr.find('./a:custGeom', NS) if sp_pr is not None else None
        preset_geometry = sp_pr.find('./a:prstGeom', NS) if sp_pr is not None else None
        c_nv_sp_pr = element.find('./p:nvSpPr/p:cNvSpPr', NS)
        if custom_geometry is not None:
            record['kind'] = 'path'
            record['geometry'] = 'custom'
            record['path_segment_count'] = sum(
                1 for node in custom_geometry.findall('.//a:path/*', NS)
                if _local_name(node.tag) in {'moveTo', 'lnTo', 'cubicBezTo', 'quadBezTo', 'arcTo', 'close'}
            )
        elif c_nv_sp_pr is not None and c_nv_sp_pr.get('txBox') in {'1', 'true'}:
            record['kind'] = 'text_box'
            record['geometry'] = preset_geometry.get('prst', '') if preset_geometry is not None else ''
        else:
            geometry = preset_geometry.get('prst', 'rect') if preset_geometry is not None else 'rect'
            record['geometry'] = geometry
            record['kind'] = {
                'rect': 'rect',
                'roundRect': 'rounded_rect',
                'ellipse': 'oval',
            }.get(geometry, 'shape')
    record['text'] = '\n'.join(
        text.strip()
        for text in (node.text or '' for node in element.findall('.//a:t', NS))
        if text.strip()
    )
    paragraphs = element.findall('.//a:p', NS)
    record['paragraph_count'] = len(paragraphs)
    record['run_count'] = len(element.findall('.//a:r', NS))
    record['bullet_count'] = sum(
        1
        for paragraph in paragraphs
        for properties in paragraph.findall('./a:pPr', NS)
        if any(_local_name(child.tag) in {'buChar', 'buAutoNum', 'buBlip'} for child in list(properties))
    )
    record['placeholder'] = element.find('.//p:ph', NS) is not None
    return record


def _number_value(value: str) -> int | float | str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return value
    return int(number) if number.is_integer() else number


def _chart_point_values(element: ET.Element | None, *, numeric: bool = False) -> list:
    if element is None:
        return []
    points = sorted(
        element.findall('.//c:pt', NS),
        key=lambda point: int(point.get('idx', '0') or 0),
    )
    values = []
    for point in points:
        value = point.find('./c:v', NS)
        text = value.text if value is not None and value.text is not None else ''
        values.append(_number_value(text) if numeric else text)
    return values


def _chart_type(plot_area: ET.Element | None) -> str:
    if plot_area is None:
        return ''
    chart = next((child for child in list(plot_area) if _local_name(child.tag).endswith('Chart')), None)
    if chart is None:
        return ''
    local = _local_name(chart.tag)
    if local in {'barChart', 'bar3DChart'}:
        direction = chart.find('./c:barDir', NS)
        base = 'column' if direction is not None and direction.get('val') == 'col' else 'bar'
        return f'{base}3d' if local == 'bar3DChart' else base
    return local.removesuffix('Chart')


def _enrich_related_object(record: dict, archive: zipfile.ZipFile, content_types: dict[str, str]) -> None:
    target = record.get('relationship_target')
    if not target or target not in archive.namelist():
        if record.get('relationship_id'):
            record['relationship_resolved'] = False
        return
    payload = archive.read(target)
    record['relationship_resolved'] = True
    record['content_type'] = content_types.get(target, '')
    record['embedded_size_bytes'] = len(payload)
    record['embedded_sha256'] = _part_sha256(payload)
    if record.get('kind') != 'chart':
        return
    root = ET.fromstring(payload)
    series = []
    categories = []
    for series_node in root.findall('.//c:ser', NS):
        if not categories:
            categories = _chart_point_values(series_node.find('./c:cat', NS))
        name_node = series_node.find('./c:tx/c:v', NS)
        if name_node is None:
            name_node = series_node.find('.//c:tx//c:v', NS)
        series.append({
            'name': (name_node.text or '') if name_node is not None else '',
            'values': _chart_point_values(series_node.find('./c:val', NS), numeric=True),
        })
    record['series_count'] = len(series)
    record['category_count'] = len(categories)
    record['categories'] = categories
    record['series'] = series
    plot_area = root.find('.//c:plotArea', NS)
    record['chart_type'] = _chart_type(plot_area)


def _slide_objects(root: ET.Element, relationships: dict[str, dict]) -> list[dict]:
    shape_tree = root.find('./p:cSld/p:spTree', NS)
    if shape_tree is None:
        return []
    records = []

    def walk(element: ET.Element, group_name: str = '') -> dict | None:
        local = _local_name(element.tag)
        if local not in {'sp', 'cxnSp', 'pic', 'graphicFrame', 'grpSp'}:
            return None
        record = _shape_record(element, relationships)
        if group_name:
            record['group_name'] = group_name
        records.append(record)
        if local == 'grpSp':
            child_group = record['name'] or group_name
            children = [
                child_record
                for child in list(element)
                if (child_record := walk(child, child_group)) is not None
            ]
            record['children'] = children
            record['child_object_count'] = len(children)
        return record

    for child in list(shape_tree):
        walk(child)
    id_to_name = {
        record['object_id']: record['name']
        for record in records
        if record.get('object_id') and record.get('name')
    }
    for record in records:
        if record.get('kind') != 'connector':
            continue
        record['from_shape_name'] = id_to_name.get(record.get('from_object_id'), '')
        record['to_shape_name'] = id_to_name.get(record.get('to_object_id'), '')
    return records


def _transition(root: ET.Element) -> dict:
    transition = root.find('./p:transition', NS)
    if transition is None:
        return {}
    transition_type = ''
    for child in list(transition):
        local = _local_name(child.tag)
        if local not in {'sndAc', 'extLst'}:
            transition_type = local
            break
    child = next((item for item in list(transition) if _local_name(item.tag) not in {'sndAc', 'extLst'}), None)
    direction = child.get('dir', '') if child is not None else ''
    direction = {'l': 'left', 'r': 'right', 'u': 'up', 'd': 'down'}.get(direction, direction)
    duration = transition.get(_qn(P14_NS, 'dur'), '')
    try:
        duration = int(duration) if duration != '' else 0
    except ValueError:
        duration = 0
    return {
        'type': transition_type,
        'direction': direction,
        'duration_ms': duration,
        'speed': transition.get('spd', ''),
        'advance_time_ms': transition.get('advTm', ''),
        'advance_click': transition.get('advClick', '1') not in {'0', 'false'},
    }


def _animations(root: ET.Element, id_to_name: dict[str, str]) -> list[dict]:
    parents = {child: parent for parent in root.iter() for child in list(parent)}
    class_names = {
        'entr': 'entrance',
        'exit': 'exit',
        'emph': 'emphasis',
        'path': 'motion',
    }
    trigger_names = {
        'clickEffect': 'onClick',
        'withEffect': 'withPrevious',
        'afterEffect': 'afterPrevious',
    }
    animations = []
    for timing in root.findall('.//p:cTn', NS):
        if timing.get('presetID') is None:
            continue
        target = timing.find('.//p:spTgt', NS)
        target_id = target.get('spid', '') if target is not None else ''
        effect_node = timing.find('.//p:animEffect', NS)
        motion_node = timing.find('.//p:animMotion', NS)
        behavior = effect_node if effect_node is not None else motion_node
        duration_node = behavior.find('./p:cBhvr/p:cTn', NS) if behavior is not None else None
        try:
            duration_ms = int(duration_node.get('dur', '0') or 0) if duration_node is not None else 0
        except ValueError:
            duration_ms = 0
        delay_ms = 0
        ancestor = parents.get(timing)
        while ancestor is not None:
            if _local_name(ancestor.tag) == 'cTn':
                condition = ancestor.find('./p:stCondLst/p:cond', NS)
                try:
                    candidate = int(condition.get('delay', '0') or 0) if condition is not None else 0
                except ValueError:
                    candidate = 0
                if candidate > 0:
                    delay_ms = candidate
                    break
            ancestor = parents.get(ancestor)
        try:
            preset_id = int(timing.get('presetID', '0') or 0)
        except ValueError:
            preset_id = 0
        effect = effect_node.get('filter', '') if effect_node is not None else ''
        if not effect and motion_node is not None:
            effect = 'motion'
        animations.append({
            'target_object_id': target_id,
            'target_shape_name': id_to_name.get(target_id, target_id),
            'effect': effect,
            'class': class_names.get(timing.get('presetClass', ''), timing.get('presetClass', '')),
            'trigger': trigger_names.get(timing.get('nodeType', ''), timing.get('nodeType', '')),
            'duration_ms': duration_ms,
            'delay_ms': delay_ms,
            'preset_id': preset_id,
        })
    return animations


def _canvas(archive: zipfile.ZipFile) -> dict:
    presentation_part = 'ppt/presentation.xml'
    if presentation_part not in archive.namelist():
        return {'canvas_emu': {}, 'canvas_in': {}, 'slide_size_type': ''}
    root = ET.fromstring(archive.read(presentation_part))
    slide_size = root.find('./p:sldSz', NS)
    if slide_size is None:
        return {'canvas_emu': {}, 'canvas_in': {}, 'slide_size_type': ''}
    width = int(slide_size.get('cx', '0') or 0)
    height = int(slide_size.get('cy', '0') or 0)
    return {
        'canvas_emu': {'width': width, 'height': height},
        'canvas_in': {
            'width': round(width / 914400, 4),
            'height': round(height / 914400, 4),
        },
        'slide_size_type': slide_size.get('type', ''),
    }


def _speaker_notes(
    archive: zipfile.ZipFile,
    relationships: dict[str, dict],
    content_types: dict[str, str],
) -> dict:
    note_rel = next(
        (rel for rel in relationships.values() if rel['type'].endswith('/notesSlide')),
        None,
    )
    if not note_rel or note_rel['target'] not in archive.namelist():
        return {
            'text': '',
            'part': '',
            'relationship_type': note_rel['type'] if note_rel else '',
            'relationship_resolved': False,
            'content_type': '',
        }
    root = ET.fromstring(archive.read(note_rel['target']))
    texts = []
    for shape in root.findall('.//p:sp', NS):
        placeholder = shape.find('.//p:ph', NS)
        placeholder_type = placeholder.get('type', '') if placeholder is not None else ''
        if placeholder_type in {'sldImg', 'hdr', 'ftr', 'dt', 'sldNum'}:
            continue
        value = '\n'.join((node.text or '').strip() for node in shape.findall('.//a:t', NS) if (node.text or '').strip())
        if value:
            texts.append(value)
    return {
        'text': '\n'.join(texts),
        'part': note_rel['target'],
        'relationship_type': note_rel['type'],
        'relationship_resolved': True,
        'content_type': content_types.get(note_rel['target'], ''),
    }


def _template_part_hashes(archive: zipfile.ZipFile) -> dict[str, str]:
    prefixes = ('ppt/slideMasters/', 'ppt/slideLayouts/', 'ppt/theme/')
    return {
        name: _part_sha256(archive.read(name))
        for name in sorted(archive.namelist())
        if name.startswith(prefixes) and not name.endswith('/')
    }


def _content_types(archive: zipfile.ZipFile) -> dict[str, str]:
    part = '[Content_Types].xml'
    if part not in archive.namelist():
        return {}
    root = ET.fromstring(archive.read(part))
    defaults = {
        item.get('Extension', '').lower(): item.get('ContentType', '')
        for item in root.findall(_qn(CONTENT_TYPES_NS, 'Default'))
    }
    overrides = {
        item.get('PartName', '').lstrip('/'): item.get('ContentType', '')
        for item in root.findall(_qn(CONTENT_TYPES_NS, 'Override'))
    }
    return {
        name: overrides.get(name, defaults.get(posixpath.splitext(name)[1].lstrip('.').lower(), ''))
        for name in archive.namelist()
    }


def read_pptx_package(pptx_file: Path) -> dict:
    pptx_file = Path(pptx_file)
    if not pptx_file.exists():
        raise FileNotFoundError(f'native PPTX package not found: {pptx_file}')
    with zipfile.ZipFile(pptx_file) as archive:
        names = set(archive.namelist())
        canvas = _canvas(archive)
        content_types = _content_types(archive)
        slide_parts = _ordered_slide_parts(archive)
        slides = []
        object_counts = Counter()
        notes_parts = set()
        chart_parts = {
            part for part, content_type in content_types.items()
            if 'drawingml.chart' in content_type
        }
        media_parts = set()
        relationship_counts = Counter()
        transition_count = 0
        animation_count = 0
        timing_node_count = 0
        placeholder_count = 0
        for index, slide_part in enumerate(slide_parts, 1):
            root = ET.fromstring(archive.read(slide_part))
            rels = _relationships(archive, slide_part)
            local_relationship_counts = Counter(
                rel['type'].rsplit('/', 1)[-1] for rel in rels.values() if rel.get('type')
            )
            relationship_counts.update(local_relationship_counts)
            chart_parts.update(
                rel['target'] for rel in rels.values()
                if rel['type'].endswith('/chart') and rel['target'] in names
            )
            media_parts.update(
                rel['target'] for rel in rels.values()
                if rel['type'].endswith(('/image', '/audio', '/video')) and rel['target'] in names
            )
            objects = _slide_objects(root, rels)
            for record in objects:
                _enrich_related_object(record, archive, content_types)
            local_counts = Counter(record['kind'] for record in objects)
            object_counts.update(local_counts)
            placeholder_count += sum(1 for record in objects if record.get('placeholder'))
            transition = _transition(root)
            transition_count += int(bool(transition))
            id_to_name = {
                record['object_id']: record['name']
                for record in objects
                if record.get('object_id') and record.get('name')
            }
            animations = _animations(root, id_to_name)
            animation_targets = list(dict.fromkeys(
                animation['target_shape_name'] for animation in animations if animation['target_shape_name']
            ))
            slide_animation_count = len(animations)
            slide_timing_node_count = len(root.findall('.//p:cTn', NS))
            animation_count += slide_animation_count
            timing_node_count += slide_timing_node_count
            notes = _speaker_notes(archive, rels, content_types)
            if notes['part']:
                notes_parts.add(notes['part'])
            layout_rel = next((rel for rel in rels.values() if rel['type'].endswith('/slideLayout')), None)
            slides.append({
                'slide_index': index,
                'slide_part': slide_part,
                'layout_part': layout_rel['target'] if layout_rel else '',
                'relationship_type_counts': dict(sorted(local_relationship_counts.items())),
                'object_counts': dict(sorted(local_counts.items())),
                'object_names': [record['name'] for record in objects if record.get('name')],
                'objects': objects,
                'speaker_notes': notes['text'],
                'notes_part': notes['part'],
                'notes_relationship_type': notes['relationship_type'],
                'notes_relationship_resolved': notes['relationship_resolved'],
                'notes_content_type': notes['content_type'],
                'transition': transition,
                'animation_targets': animation_targets,
                'animations': animations,
                'animation_count': slide_animation_count,
                'timing_node_count': slide_timing_node_count,
                'placeholder_count': sum(1 for record in objects if record.get('placeholder')),
            })
        part_counts = {
            'chart': len(chart_parts),
            'media': len(media_parts),
            'notes': len(notes_parts),
            'master': sum(1 for name in names if name.startswith('ppt/slideMasters/slideMaster') and name.endswith('.xml')),
            'layout': sum(1 for name in names if name.startswith('ppt/slideLayouts/slideLayout') and name.endswith('.xml')),
            'theme': sum(1 for name in names if name.startswith('ppt/theme/theme') and name.endswith('.xml')),
        }
        return {
            'schema_version': 1,
            'evidence_source': 'pptx_package_readback',
            'pptx_file': str(pptx_file),
            'pptx_sha256': _file_sha256(pptx_file),
            **canvas,
            'slide_count': len(slides),
            'object_type_counts': dict(sorted(object_counts.items())),
            'placeholder_count': placeholder_count,
            'notes_slide_count': len(notes_parts),
            'transition_count': transition_count,
            'animation_count': animation_count,
            'timing_node_count': timing_node_count,
            'relationship_type_counts': dict(sorted(relationship_counts.items())),
            'part_counts': part_counts,
            'template_part_hashes': _template_part_hashes(archive),
            'slides': slides,
        }


def template_preservation(before: dict | None, after: dict, mode: str) -> dict:
    if not before:
        return {
            'mode': 'none',
            'source_pptx': '',
            'canvas_preserved': False,
            'source_canvas_emu': {},
            'output_canvas_emu': after.get('canvas_emu') or {},
            'master_parts_preserved': False,
            'layout_parts_preserved': False,
            'theme_parts_preserved': False,
            'changed_template_parts': [],
        }
    before_hashes = before.get('template_part_hashes') or {}
    after_hashes = after.get('template_part_hashes') or {}
    changed = sorted(
        part for part in set(before_hashes) | set(after_hashes)
        if before_hashes.get(part) != after_hashes.get(part)
    )

    def preserved(prefix: str) -> bool:
        expected = {part: value for part, value in before_hashes.items() if part.startswith(prefix)}
        return bool(expected) and all(after_hashes.get(part) == value for part, value in expected.items())

    result = {
        'mode': mode,
        'source_pptx': before.get('pptx_file', ''),
        'canvas_preserved': bool(before.get('canvas_emu')) and before.get('canvas_emu') == after.get('canvas_emu'),
        'source_canvas_emu': before.get('canvas_emu') or {},
        'output_canvas_emu': after.get('canvas_emu') or {},
        'master_parts_preserved': preserved('ppt/slideMasters/'),
        'layout_parts_preserved': preserved('ppt/slideLayouts/'),
        'theme_parts_preserved': preserved('ppt/theme/'),
        'changed_template_parts': changed,
        'source_part_counts': before.get('part_counts') or {},
        'output_part_counts': after.get('part_counts') or {},
    }
    failed = [
        field for field in (
            'canvas_preserved',
            'master_parts_preserved',
            'layout_parts_preserved',
            'theme_parts_preserved',
        )
        if result[field] is not True
    ]
    if failed:
        raise RuntimeError(
            'native PPT template preservation failed: '
            + json.dumps({
                'failed_fields': failed,
                'changed_template_parts': changed,
                'source_canvas_emu': result['source_canvas_emu'],
                'output_canvas_emu': result['output_canvas_emu'],
            }, ensure_ascii=False, sort_keys=True)
        )
    return result


def copy_template_source(source_pptx: Path, output_pptx: Path) -> dict:
    source_pptx = Path(source_pptx).resolve()
    output_pptx = Path(output_pptx).resolve()
    if not source_pptx.exists():
        raise FileNotFoundError(f'native PPT template source not found: {source_pptx}')
    if not zipfile.is_zipfile(source_pptx):
        raise ValueError(f'native PPT template source is not a PPTX package: {source_pptx}')
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_pptx, output_pptx)
    return read_pptx_package(source_pptx)


def _replace_chart_literal(parent: ET.Element, values: list, *, numeric: bool) -> None:
    for child in list(parent):
        parent.remove(child)
    literal = ET.SubElement(parent, _qn(C_NS, 'numLit' if numeric else 'strLit'))
    if numeric:
        ET.SubElement(literal, _qn(C_NS, 'formatCode')).text = 'General'
    ET.SubElement(literal, _qn(C_NS, 'ptCount'), {'val': str(len(values))})
    for index, value in enumerate(values):
        point = ET.SubElement(literal, _qn(C_NS, 'pt'), {'idx': str(index)})
        ET.SubElement(point, _qn(C_NS, 'v')).text = str(value)


def _patch_chart_root(root: ET.Element, shape_spec: dict) -> None:
    categories = shape_spec.get('categories') if isinstance(shape_spec.get('categories'), list) else []
    declared_series = shape_spec.get('series') if isinstance(shape_spec.get('series'), list) else []
    series_nodes = root.findall('.//c:ser', NS)
    if len(series_nodes) != len(declared_series):
        raise ValueError(
            f"native PPT chart series count changed during materialization: "
            f"{shape_spec.get('shape_id', '<missing>')}"
        )
    for index, (series_node, series_spec) in enumerate(zip(series_nodes, declared_series), 1):
        values = series_spec.get('values') if isinstance(series_spec, dict) and isinstance(series_spec.get('values'), list) else []
        if len(values) != len(categories):
            raise ValueError(f'native PPT chart series {index} value count must match categories')
        text = series_node.find('./c:tx', NS)
        if text is None:
            raise ValueError(f'native PPT chart series {index} text node missing after materialization')
        for child in list(text):
            text.remove(child)
        ET.SubElement(text, _qn(C_NS, 'v')).text = str(series_spec.get('name') or f'Series {index}')
        category_node = series_node.find('./c:cat', NS)
        value_node = series_node.find('./c:val', NS)
        if category_node is None or value_node is None:
            raise ValueError(f'native PPT chart series {index} data nodes missing after materialization')
        _replace_chart_literal(category_node, categories, numeric=False)
        _replace_chart_literal(value_node, values, numeric=True)


def patch_chart_data(pptx_file: Path, chart_specs: list[dict]) -> None:
    if not chart_specs:
        return
    pptx_file = Path(pptx_file)
    with zipfile.ZipFile(pptx_file, 'r') as source:
        ordered_slide_parts = _ordered_slide_parts(source)
        infos = source.infolist()
        payloads = {info.filename: source.read(info.filename) for info in infos}
        chart_targets = []
        for item in chart_specs:
            slide_index = int(item['slide_index'])
            shape_spec = item['shape_spec']
            if slide_index < 1 or slide_index > len(ordered_slide_parts):
                raise ValueError(f'native PPT chart target slide not found: {slide_index}')
            slide_part = ordered_slide_parts[slide_index - 1]
            slide_root = ET.fromstring(payloads[slide_part])
            relationship_id = ''
            shape_id = str(shape_spec.get('shape_id') or '').strip()
            for frame in slide_root.findall('.//p:graphicFrame', NS):
                name, _ = _shape_name(frame)
                if name != shape_id:
                    continue
                chart = frame.find('.//c:chart', NS)
                relationship_id = chart.get(_qn(R_NS, 'id'), '') if chart is not None else ''
                break
            relationship = _relationships(source, slide_part).get(relationship_id)
            chart_part = relationship.get('target', '') if relationship else ''
            if not chart_part or chart_part not in payloads:
                raise ValueError(f'native PPT chart relationship target missing after materialization: {shape_id}')
            chart_targets.append((chart_part, shape_spec))
    for chart_part, shape_spec in chart_targets:
        chart_root = ET.fromstring(payloads[chart_part])
        _patch_chart_root(chart_root, shape_spec)
        payloads[chart_part] = ET.tostring(chart_root, encoding='utf-8', xml_declaration=True)
    with tempfile.NamedTemporaryFile(dir=pptx_file.parent, suffix='.pptx', delete=False) as handle:
        temp_file = Path(handle.name)
    try:
        with zipfile.ZipFile(temp_file, 'w') as target:
            for info in infos:
                target.writestr(info, payloads[info.filename])
        temp_file.replace(pptx_file)
    finally:
        temp_file.unlink(missing_ok=True)


def _path_commands(shape_spec: dict) -> list[dict]:
    commands = shape_spec.get('path_commands')
    if isinstance(commands, list) and commands:
        return [command for command in commands if isinstance(command, dict)]
    points = shape_spec.get('path_points')
    if not isinstance(points, list) or len(points) < 2:
        raise ValueError(f"native PPT path requires path_points or path_commands: {shape_spec.get('shape_id', '<missing>')}")
    result = [{'op': 'move', 'point': points[0]}]
    result.extend({'op': 'line', 'point': point} for point in points[1:])
    if shape_spec.get('closed', True):
        result.append({'op': 'close'})
    return result


def _scaled_point(point) -> tuple[str, str]:
    if not isinstance(point, (list, tuple)) or len(point) != 2:
        raise ValueError(f'native PPT path point must be [x, y], got: {point!r}')
    x, y = float(point[0]), float(point[1])
    if not 0 <= x <= 1 or not 0 <= y <= 1:
        raise ValueError(f'native PPT path point must be normalized to 0..1, got: {point!r}')
    return str(round(x * 100000)), str(round(y * 100000))


def _custom_geometry(shape_spec: dict) -> ET.Element:
    geometry = ET.Element(_qn(A_NS, 'custGeom'))
    for name in ('avLst', 'gdLst', 'ahLst', 'cxnLst'):
        ET.SubElement(geometry, _qn(A_NS, name))
    ET.SubElement(geometry, _qn(A_NS, 'rect'), {'l': '0', 't': '0', 'r': 'r', 'b': 'b'})
    path_list = ET.SubElement(geometry, _qn(A_NS, 'pathLst'))
    path = ET.SubElement(path_list, _qn(A_NS, 'path'), {'w': '100000', 'h': '100000'})
    for command in _path_commands(shape_spec):
        op = str(command.get('op') or '').strip().lower()
        if op in {'move', 'line'}:
            node = ET.SubElement(path, _qn(A_NS, 'moveTo' if op == 'move' else 'lnTo'))
            x, y = _scaled_point(command.get('point'))
            ET.SubElement(node, _qn(A_NS, 'pt'), {'x': x, 'y': y})
        elif op in {'cubic', 'curve'}:
            points = command.get('points')
            if not isinstance(points, list) or len(points) != 3:
                raise ValueError('native PPT cubic path command requires exactly three points')
            node = ET.SubElement(path, _qn(A_NS, 'cubicBezTo'))
            for point in points:
                x, y = _scaled_point(point)
                ET.SubElement(node, _qn(A_NS, 'pt'), {'x': x, 'y': y})
        elif op == 'close':
            ET.SubElement(path, _qn(A_NS, 'close'))
        else:
            raise ValueError(f'unsupported native PPT path command: {op or "<missing>"}')
    return geometry


def patch_custom_paths(pptx_file: Path, path_specs: list[dict]) -> None:
    if not path_specs:
        return
    pptx_file = Path(pptx_file)
    by_slide = {}
    for item in path_specs:
        by_slide.setdefault(int(item['slide_index']), []).append(item['shape_spec'])
    with zipfile.ZipFile(pptx_file, 'r') as source:
        ordered_slide_parts = _ordered_slide_parts(source)
        infos = source.infolist()
        payloads = {info.filename: source.read(info.filename) for info in infos}
    for slide_index, specs in by_slide.items():
        if slide_index < 1 or slide_index > len(ordered_slide_parts):
            raise ValueError(f'native PPT path target slide not found: {slide_index}')
        slide_part = ordered_slide_parts[slide_index - 1]
        root = ET.fromstring(payloads[slide_part])
        for shape_spec in specs:
            shape_id = str(shape_spec.get('shape_id') or '').strip()
            target = None
            for shape in root.findall('.//p:sp', NS):
                name, _ = _shape_name(shape)
                if name == shape_id:
                    target = shape
                    break
            if target is None:
                raise ValueError(f'native PPT path target shape not found after materialization: {shape_id}')
            sp_pr = target.find('./p:spPr', NS)
            if sp_pr is None:
                raise ValueError(f'native PPT path target lacks spPr: {shape_id}')
            for geometry in list(sp_pr):
                if _local_name(geometry.tag) in {'prstGeom', 'custGeom'}:
                    sp_pr.remove(geometry)
            insert_at = 1 if len(sp_pr) and _local_name(sp_pr[0].tag) == 'xfrm' else 0
            sp_pr.insert(insert_at, _custom_geometry(shape_spec))
        payloads[slide_part] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    with tempfile.NamedTemporaryFile(dir=pptx_file.parent, suffix='.pptx', delete=False) as handle:
        temp_file = Path(handle.name)
    try:
        with zipfile.ZipFile(temp_file, 'w') as target:
            for info in infos:
                target.writestr(info, payloads[info.filename])
        temp_file.replace(pptx_file)
    finally:
        temp_file.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description='Read native PPTX package evidence as JSON.')
    parser.add_argument('pptx_file', type=Path)
    parser.add_argument('--pretty', action='store_true')
    args = parser.parse_args()
    print(json.dumps(
        read_pptx_package(args.pptx_file),
        ensure_ascii=False,
        indent=2 if args.pretty else None,
        sort_keys=True,
    ))


if __name__ == '__main__':
    main()
