"""Native PPTX package operations unified on python-pptx."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import unquote_to_bytes

from lxml import etree
from pptx import Presentation
from pptx.chart.data import CategoryChartData

from .native_layout_constants import EMU_PER_INCH
from .native_layouts.text_metrics import weighted_text_width_pt
from .native_readback import A_NS, P_NS, read_pptx_package

__all__ = [
    'apply_custom_geometry',
    'copy_template_source',
    'decode_picture_bytes',
    'patch_chart_data',
    'patch_custom_paths',
    'read_pptx_package',
    'save_presentation',
    'source_payload_sha256',
    'template_preservation',
    'validate_pptx_package',
]

_TEMPLATE_PREFIXES = ('ppt/slideMasters/', 'ppt/slideLayouts/', 'ppt/theme/')


def _qn(namespace: str, name: str) -> str:
    return f'{{{namespace}}}{name}'


def _local_name(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


def _part_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _file_sha256(file: Path) -> str:
    with file.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def decode_picture_bytes(source: str) -> bytes:
    if not source.startswith('data:'):
        return Path(source).expanduser().read_bytes()
    metadata, separator, encoded = source[5:].partition(',')
    if not separator:
        raise ValueError('native PPT picture data URI must contain a payload separator')
    payload = unquote_to_bytes(encoded)
    if 'base64' in {token.lower() for token in metadata.split(';')[1:]}:
        try:
            payload = base64.b64decode(payload, validate=True)
        except ValueError as exc:
            raise ValueError('native PPT picture data URI contains invalid base64') from exc
    return payload


def source_payload_sha256(source: str) -> str:
    if not source.startswith('data:'):
        return _file_sha256(Path(source).expanduser())
    return _part_sha256(decode_picture_bytes(source))


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


def save_presentation(
    prs: Presentation,
    output_pptx: Path,
    *,
    template_source: Path | None = None,
) -> None:
    """Atomically save a python-pptx Presentation, preserving template part bytes when derived from a template."""
    output_pptx = Path(output_pptx).resolve()
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output_pptx.parent, suffix='.pptx', delete=False) as handle:
        temp_file = Path(handle.name)
    try:
        prs.save(str(temp_file))
        if template_source is not None and template_source.is_file():
            _preserve_template_part_bytes(temp_file, template_source)
        temp_file.replace(output_pptx)
    finally:
        temp_file.unlink(missing_ok=True)


def _preserve_template_part_bytes(saved_pptx: Path, template_source: Path) -> None:
    """Restore verbatim bytes for untouched template master/layout/theme parts if lxml re-serialized them."""
    with zipfile.ZipFile(template_source, 'r') as src_zip:
        template_bytes = {
            name: src_zip.read(name)
            for name in src_zip.namelist()
            if name.startswith(_TEMPLATE_PREFIXES) and not name.endswith('/')
        }
    if not template_bytes:
        return
    with zipfile.ZipFile(saved_pptx, 'r') as dst_zip:
        infos = dst_zip.infolist()
        needs_restore = any(
            info.filename in template_bytes and dst_zip.read(info.filename) != template_bytes[info.filename]
            for info in infos
        )
        if not needs_restore:
            return
        payloads = {
            info.filename: template_bytes.get(info.filename, dst_zip.read(info.filename))
            for info in infos
        }
    with tempfile.NamedTemporaryFile(dir=saved_pptx.parent, suffix='.pptx', delete=False) as handle:
        patched = Path(handle.name)
    try:
        with zipfile.ZipFile(patched, 'w') as out_zip:
            for info in infos:
                out_zip.writestr(info, payloads[info.filename])
        patched.replace(saved_pptx)
    finally:
        patched.unlink(missing_ok=True)


def _path_commands(shape_spec: dict) -> list[dict]:
    commands = shape_spec.get('path_commands')
    if isinstance(commands, list) and commands:
        return [command for command in commands if isinstance(command, dict)]
    points = shape_spec.get('path_points')
    if not isinstance(points, list) or len(points) < 2:
        raise ValueError(
            f"native PPT path requires path_points or path_commands: {shape_spec.get('shape_id', '<missing>')}"
        )
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


def _custom_geometry_lxml(shape_spec: dict):
    geometry = etree.Element(_qn(A_NS, 'custGeom'))
    for name in ('avLst', 'gdLst', 'ahLst', 'cxnLst'):
        etree.SubElement(geometry, _qn(A_NS, name))
    etree.SubElement(geometry, _qn(A_NS, 'rect'), {'l': '0', 't': '0', 'r': 'r', 'b': 'b'})
    path_list = etree.SubElement(geometry, _qn(A_NS, 'pathLst'))
    path = etree.SubElement(path_list, _qn(A_NS, 'path'), {'w': '100000', 'h': '100000'})
    for command in _path_commands(shape_spec):
        op = str(command.get('op') or '').strip().lower()
        if op in {'move', 'line'}:
            node = etree.SubElement(path, _qn(A_NS, 'moveTo' if op == 'move' else 'lnTo'))
            x, y = _scaled_point(command.get('point'))
            etree.SubElement(node, _qn(A_NS, 'pt'), {'x': x, 'y': y})
        elif op in {'cubic', 'curve'}:
            points = command.get('points')
            if not isinstance(points, list) or len(points) != 3:
                raise ValueError('native PPT cubic path command requires exactly three points')
            node = etree.SubElement(path, _qn(A_NS, 'cubicBezTo'))
            for point in points:
                x, y = _scaled_point(point)
                etree.SubElement(node, _qn(A_NS, 'pt'), {'x': x, 'y': y})
        elif op == 'close':
            etree.SubElement(path, _qn(A_NS, 'close'))
        else:
            raise ValueError(f'unsupported native PPT path command: {op or "<missing>"}')
    return geometry


def apply_custom_geometry(shape, shape_spec: dict) -> None:
    """Replace a shape's preset geometry with DrawingML <a:custGeom> directly on the python-pptx element."""
    sp_pr = shape._element.find(_qn(P_NS, 'spPr'))
    if sp_pr is None:
        raise ValueError(f"native PPT path target lacks spPr: {shape_spec.get('shape_id', '<missing>')}")
    for child in list(sp_pr):
        if _local_name(child.tag) in {'prstGeom', 'custGeom'}:
            sp_pr.remove(child)
    insert_at = 1 if len(sp_pr) and _local_name(sp_pr[0].tag) == 'xfrm' else 0
    sp_pr.insert(insert_at, _custom_geometry_lxml(shape_spec))


def patch_custom_paths(pptx_file: Path, path_specs: list[dict]) -> None:
    """Apply custom path geometry to named shapes inside an existing PPTX via python-pptx."""
    if not path_specs:
        return
    pptx_file = Path(pptx_file).resolve()
    prs = Presentation(str(pptx_file))
    for item in path_specs:
        slide_index = int(item['slide_index'])
        shape_spec = item['shape_spec']
        if slide_index < 1 or slide_index > len(prs.slides):
            raise ValueError(f'native PPT path target slide not found: {slide_index}')
        slide = prs.slides[slide_index - 1]
        shape_id = str(shape_spec.get('shape_id') or '').strip()
        target = next((sh for sh in slide.shapes if sh.name == shape_id), None)
        if target is None:
            raise ValueError(f'native PPT path target shape not found after materialization: {shape_id}')
        apply_custom_geometry(target, shape_spec)
    save_presentation(prs, pptx_file)


def patch_chart_data(pptx_file: Path, chart_specs: list[dict]) -> None:
    """Replace chart categories and series natively via python-pptx CategoryChartData."""
    if not chart_specs:
        return
    pptx_file = Path(pptx_file).resolve()
    prs = Presentation(str(pptx_file))
    for item in chart_specs:
        slide_index = int(item['slide_index'])
        shape_spec = item['shape_spec']
        if slide_index < 1 or slide_index > len(prs.slides):
            raise ValueError(f'native PPT chart target slide not found: {slide_index}')
        slide = prs.slides[slide_index - 1]
        shape_id = str(shape_spec.get('shape_id') or '').strip()
        target = next((sh for sh in slide.shapes if sh.name == shape_id and sh.has_chart), None)
        if target is None:
            raise ValueError(f'native PPT chart target not found: {shape_id}')
        categories = shape_spec.get('categories') if isinstance(shape_spec.get('categories'), list) else []
        declared_series = shape_spec.get('series') if isinstance(shape_spec.get('series'), list) else []
        if not categories or not declared_series:
            raise ValueError(f'native PPT chart requires categories and series: {shape_id}')
        chart_data = CategoryChartData()
        chart_data.categories = [str(cat) for cat in categories]
        for index, series_spec in enumerate(declared_series, 1):
            values = (
                series_spec.get('values')
                if isinstance(series_spec, dict) and isinstance(series_spec.get('values'), list)
                else []
            )
            if len(values) != len(categories):
                raise ValueError(f'native PPT chart series {index} value count must match categories')
            chart_data.add_series(
                str(series_spec.get('name') or f'Series {index}'),
                tuple(values),
            )
        target.chart.replace_data(chart_data)
    save_presentation(prs, pptx_file)


def validate_pptx_package(pptx_file: Path) -> tuple[dict, dict, dict]:
    """Validate a materialized PPTX via python-pptx and inspect visual/text issues."""
    pptx_file = Path(pptx_file).resolve()
    prs = Presentation(str(pptx_file))
    slide_width = int(prs.slide_width or 0)
    slide_height = int(prs.slide_height or 0)
    issues = []
    slides_text = []

    for slide_index, slide in enumerate(prs.slides, 1):
        slide_fragments = []
        for shape in slide.shapes:
            left = int(shape.left or 0)
            top = int(shape.top or 0)
            width = int(shape.width or 0)
            height = int(shape.height or 0)
            if slide_width > 0 and slide_height > 0:
                if left < 0 or top < 0 or left + width > slide_width or top + height > slide_height:
                    issues.append({
                        'slide_index': slide_index,
                        'shape_name': shape.name,
                        'kind': 'bounds_overflow',
                        'message': f'Shape {shape.name!r} extends outside slide bounds',
                    })
            if not getattr(shape, 'has_text_frame', False):
                continue
            tf = shape.text_frame
            text = (tf.text or '').strip()
            if not text:
                continue
            slide_fragments.append({'shape_name': shape.name, 'text': text})
            font_sizes = []
            for para in tf.paragraphs:
                if para.font.size is not None:
                    font_sizes.append(para.font.size.pt)
                for run in para.runs:
                    if run.font.size is not None:
                        font_sizes.append(run.font.size.pt)
            if not font_sizes or width <= 0 or height <= 0:
                continue
            font_pt = max(font_sizes)
            margin_l = int(tf.margin_left or 0) / EMU_PER_INCH
            margin_r = int(tf.margin_right or 0) / EMU_PER_INCH
            margin_t = int(tf.margin_top or 0) / EMU_PER_INCH
            margin_b = int(tf.margin_bottom or 0) / EMU_PER_INCH
            avail_w = max((width / EMU_PER_INCH) - margin_l - margin_r, 0.05)
            avail_h = max((height / EMU_PER_INCH) - margin_t - margin_b, 0.05)
            usable_w_pt = max(avail_w * 72.0, 1.0)
            lines = sum(
                max(1, int((weighted_text_width_pt(line, font_pt) + usable_w_pt - 1.0) // usable_w_pt))
                for line in (text.splitlines() or [''])
            )
            needed_h = lines * font_pt * 1.18 / 72.0
            if needed_h > avail_h * 1.35 and (needed_h - avail_h) > 0.15:
                issues.append({
                    'slide_index': slide_index,
                    'shape_name': shape.name,
                    'kind': 'text_overflow',
                    'font_size_pt': round(font_pt, 2),
                    'available_height_in': round(avail_h, 3),
                    'estimated_height_in': round(needed_h, 3),
                    'message': (
                        f'Text in {shape.name!r} overflows frame '
                        f'({needed_h:.2f}in needed > {avail_h:.2f}in available)'
                    ),
                })
        slides_text.append({
            'slide_index': slide_index,
            'shapes': slide_fragments,
            'text': '\n'.join(item['text'] for item in slide_fragments),
        })

    validate_payload = {
        'success': True,
        'data': {
            'valid': True,
            'engine': 'python-pptx',
            'slide_count': len(prs.slides),
            'part_count': len(list(prs.part.package.iter_parts())),
        },
    }
    issues_payload = {
        'success': True,
        'data': {
            'count': len(issues),
            'issues': issues,
        },
    }
    text_payload = {
        'success': True,
        'data': {
            'slides': slides_text,
        },
    }
    return validate_payload, issues_payload, text_payload


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
