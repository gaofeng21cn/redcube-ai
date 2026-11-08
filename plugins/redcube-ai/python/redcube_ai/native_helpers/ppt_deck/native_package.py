import argparse
import base64
import hashlib
import json
import posixpath
import shutil
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import unquote_to_bytes
from xml.etree import ElementTree as ET


P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
C_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'

NS = {'p': P_NS, 'a': A_NS, 'r': R_NS, 'c': C_NS, 'rel': PKG_REL_NS}

from .officecli_readback import read_pptx_package

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
    with file.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


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
