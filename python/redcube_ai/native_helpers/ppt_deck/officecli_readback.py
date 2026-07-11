import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from collections import Counter
from pathlib import Path


_LENGTH = re.compile(r'^(-?\d+(?:\.\d+)?)(pt|cm|mm|in)?$')


def _sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _officecli() -> str:
    command = os.environ.get('OFFICECLI_BIN') or shutil.which('officecli')
    if not command:
        raise RuntimeError('OfficeCLI is required for native PPT structured readback')
    return command


def _run(file: Path, *args: str, allow_missing: bool = False) -> dict:
    if not args:
        raise ValueError('OfficeCLI command is required')
    completed = subprocess.run(
        [_officecli(), args[0], str(file), *args[1:], '--json'],
        text=True,
        capture_output=True,
        check=False,
    )
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f'OfficeCLI returned invalid JSON for {args!r}') from exc
    if completed.returncode != 0 or payload.get('success') is not True:
        code = str((payload.get('error') or {}).get('code') or '')
        if allow_missing and code == 'not_found':
            return {}
        raise RuntimeError(json.dumps({
            'error_kind': 'officecli_readback_failed',
            'args': args,
            'returncode': completed.returncode,
            'payload': payload,
            'stderr': completed.stderr,
        }, ensure_ascii=False, sort_keys=True))
    return payload.get('data') or {}


def _get(file: Path, path: str, *, depth: int = 1, allow_missing: bool = False) -> dict:
    data = _run(file, 'get', path, '--depth', str(depth), allow_missing=allow_missing)
    results = data.get('results') or []
    return results[0] if results else {}


def _query_count(file: Path, selector: str) -> int:
    return int((_run(file, 'query', selector).get('matches') or 0))


def _query(file: Path, selector: str) -> list[dict]:
    return list(_run(file, 'query', selector).get('results') or [])


def _emu(value: object) -> int:
    match = _LENGTH.match(str(value or '').strip())
    if not match:
        return 0
    number = float(match.group(1))
    factor = {'pt': 12700, 'cm': 360000, 'mm': 36000, 'in': 914400, None: 1}[match.group(2)]
    return round(number * factor)


def _number(value: str) -> int | float | str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return value
    return int(number) if number.is_integer() else number


def _numeric_list(value: object) -> list:
    text = str(value or '')
    return [_number(item) for item in text.split(',')] if text else []


def _crop(value: object) -> dict:
    values = str(value or '').split(',') if value not in (None, '') else []
    values = [float(item) for item in values]
    if len(values) == 1:
        values *= 4
    elif len(values) == 2:
        values = [values[1], values[0], values[1], values[0]]
    values = (values + [0, 0, 0, 0])[:4]
    return dict(zip(('left', 'top', 'right', 'bottom'), values))


def _kind(node: dict) -> str:
    kind = str(node.get('type') or 'unknown')
    geometry = str((node.get('format') or {}).get('geometry') or '')
    if kind == 'textbox':
        return 'text_box'
    if kind == 'shape':
        if geometry == 'custom':
            return 'path'
        return {'rect': 'rect', 'roundRect': 'rounded_rect', 'ellipse': 'oval'}.get(geometry, 'shape')
    return {'series': 'unknown', 'tr': 'unknown', 'tc': 'unknown'}.get(kind, kind)


def _bounds(format_: dict) -> dict:
    return {
        'left': _emu(format_.get('x')),
        'top': _emu(format_.get('y')),
        'width': _emu(format_.get('width')),
        'height': _emu(format_.get('height')),
    }


def _picture_payload(file: Path, path: str) -> tuple[int, str]:
    with tempfile.TemporaryDirectory(prefix='redcube-officecli-picture-') as directory:
        output = Path(directory) / 'payload.bin'
        completed = subprocess.run(
            [_officecli(), 'get', str(file), path, '--save', str(output), '--json'],
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0 or not output.is_file():
            return 0, ''
        return output.stat().st_size, _sha256(output)


def _table(node: dict, record: dict) -> None:
    rows = [child for child in node.get('children') or [] if child.get('type') == 'tr']
    cells = []
    for row_index, row in enumerate(rows, 1):
        for column_index, cell in enumerate(row.get('children') or [], 1):
            format_ = cell.get('format') or {}
            cells.append({
                'row': row_index,
                'column': column_index,
                'text': str(cell.get('text') or ''),
                'font': str(format_.get('font') or format_.get('font.latin') or ''),
                'font_size_pt': _number(str(format_.get('size') or '0').removesuffix('pt')),
                'bold': format_.get('bold') is True,
                'color': str(format_.get('color') or ''),
                'fill': str(format_.get('fill') or ''),
            })
    record.update({
        'row_count': int((node.get('format') or {}).get('rows') or len(rows)),
        'column_count': int((node.get('format') or {}).get('cols') or 0),
        'cell_count': len(cells),
        'data': [[cell['text'] for cell in cells if cell['row'] == index] for index in range(1, len(rows) + 1)],
        'cells': cells,
    })


def _record(file: Path, node: dict, id_to_name: dict[str, str]) -> dict:
    format_ = node.get('format') or {}
    kind = _kind(node)
    record = {
        'name': str(format_.get('name') or node.get('preview') or ''),
        'object_id': str(format_.get('id') or ''),
        'kind': kind,
        'text': str(node.get('text') or ''),
        'paragraph_count': sum(child.get('type') == 'paragraph' for child in node.get('children') or []),
        'run_count': sum(len(child.get('children') or []) for child in node.get('children') or [] if child.get('type') == 'paragraph'),
        'bullet_count': sum(
            (child.get('format') or {}).get('list') == 'bullet'
            for child in node.get('children') or []
        ),
        'fill': str(format_.get('fill') or ''),
        'bounds_emu': _bounds(format_),
        'placeholder': bool(format_.get('isPlaceholder') or node.get('type') == 'placeholder'),
    }
    if kind == 'connector':
        start = str(format_.get('startShape') or '')
        end = str(format_.get('endShape') or '')
        record.update({
            'from_object_id': start,
            'to_object_id': end,
            'from_shape_name': id_to_name.get(start, ''),
            'to_shape_name': id_to_name.get(end, ''),
            'head_end': str(format_.get('headEnd') or 'none'),
            'tail_end': str(format_.get('tailEnd') or 'none'),
        })
    elif kind == 'picture':
        size, sha = _picture_payload(file, str(node.get('path') or ''))
        alt = str(format_.get('alt') or '')
        record.update({
            'alt': alt,
            'alt_text': alt,
            'has_alt': bool(alt.strip()),
            'crop': _crop(format_.get('crop')),
            'relationship_resolved': bool(format_.get('contentType')),
            'content_type': str(format_.get('contentType') or ''),
            'embedded_size_bytes': size or int(format_.get('fileSize') or 0),
            'embedded_sha256': sha,
        })
    elif kind == 'chart':
        raw_categories = str(format_.get('categories') or '')
        series = [{
            'name': str((child.get('format') or {}).get('name') or child.get('text') or ''),
            'values': _numeric_list((child.get('format') or {}).get('values')),
        } for child in node.get('children') or [] if child.get('type') == 'series']
        record.update({
            'relationship_resolved': True,
            'content_type': 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
            'chart_type': str(format_.get('chartType') or ''),
            'series_count': len(series),
            'series': series,
            'categories': [],
            'category_count': 0,
            'categories_raw': raw_categories,
            'categories_readback': 'delimiter_ambiguous' if raw_categories else 'unavailable',
        })
    elif kind == 'table':
        _table(node, record)
    elif kind == 'group':
        children = [_record(file, child, id_to_name) for child in node.get('children') or []]
        record['children'] = children
        record['child_object_count'] = len(children)
    elif kind == 'path':
        record['geometry'] = 'custom'
        record['path_segment_count'] = len(re.findall(
            r'[MLCQAZ]',
            str(format_.get('customPath') or ''),
            flags=re.IGNORECASE,
        ))
    return record


def _animations(nodes: list[dict]) -> list[dict]:
    result = []
    for node in nodes:
        target = str((node.get('format') or {}).get('name') or node.get('preview') or '')
        target_id = str((node.get('format') or {}).get('id') or '')
        for child in node.get('children') or []:
            if child.get('type') == 'animation':
                format_ = child.get('format') or {}
                result.append({
                    'target_object_id': target_id,
                    'target_shape_name': target,
                    'effect': str(format_.get('effect') or ''),
                    'class': str(format_.get('class') or ''),
                    'trigger': str(format_.get('trigger') or ''),
                    'duration_ms': int(format_.get('duration') or 0),
                    'delay_ms': int(format_.get('delay') or 0),
                    'preset_id': int(format_.get('presetId') or 0),
                })
            result.extend(_animations([child]))
    return result


def _queried_animations(nodes: list[dict], queried: list[dict]) -> list[dict]:
    id_to_name = {
        str((node.get('format') or {}).get('id') or ''): str((node.get('format') or {}).get('name') or '')
        for node in nodes
    }
    result = []
    for node in queried:
        format_ = node.get('format') or {}
        match = re.search(r'\[@id=(\d+)\]', str(node.get('path') or ''))
        target_id = match.group(1) if match else ''
        result.append({
            'target_object_id': target_id,
            'target_shape_name': id_to_name.get(target_id, ''),
            'effect': str(format_.get('effect') or ''),
            'class': str(format_.get('class') or ''),
            'trigger': str(format_.get('trigger') or ''),
            'duration_ms': int(format_.get('duration') or 0),
            'delay_ms': int(format_.get('delay') or 0),
            'preset_id': int(format_.get('presetId') or 0),
        })
    return result


def _transition(file: Path, slide_index: int, slide: dict) -> dict:
    token = str((slide.get('format') or {}).get('transition') or '')
    node = _get(file, f'/slide[{slide_index}]/transition', depth=2, allow_missing=True)
    if not token and not node:
        return {}
    child = next(iter(node.get('children') or []), {})
    type_ = token.split('-', 1)[0] if token else str(child.get('type') or '')
    direction = token.removeprefix(f'{type_}-') if token.startswith(f'{type_}-') else ''
    return {
        'type': type_,
        'direction': direction,
        'duration_ms': int((slide.get('format') or {}).get('transitionDuration') or (node.get('format') or {}).get('dur') or 0),
        'speed': str((slide.get('format') or {}).get('transitionSpeed') or ''),
        'advance_time_ms': str((slide.get('format') or {}).get('advanceTime') or ''),
        'advance_click': (slide.get('format') or {}).get('advanceClick', True) is not False,
    }


def _template_part_hashes(file: Path) -> dict[str, str]:
    prefixes = ('ppt/slideMasters/', 'ppt/slideLayouts/', 'ppt/theme/')
    with zipfile.ZipFile(file) as archive:
        return {
            name: hashlib.sha256(archive.read(name)).hexdigest()
            for name in sorted(archive.namelist())
            if name.startswith(prefixes) and not name.endswith('/')
        }


def read_pptx_package(pptx_file: Path) -> dict:
    pptx_file = Path(pptx_file).resolve()
    if not pptx_file.is_file():
        raise FileNotFoundError(f'native PPTX package not found: {pptx_file}')
    root = _get(pptx_file, '/', depth=1)
    format_ = root.get('format') or {}
    slides = []
    object_counts = Counter()
    queried_animations = _query(pptx_file, 'animation')
    placeholder_ids = {
        str((node.get('format') or {}).get('id') or '')
        for node in _query(pptx_file, 'placeholder')
    }
    slide_stubs = [child for child in root.get('children') or [] if child.get('type') == 'slide']
    for index, _ in enumerate(slide_stubs, 1):
        slide = _get(pptx_file, f'/slide[{index}]', depth=8)
        nodes = [child for child in slide.get('children') or [] if _kind(child) != 'unknown']
        id_to_name = {
            str((node.get('format') or {}).get('id') or ''): str((node.get('format') or {}).get('name') or '')
            for node in nodes
        }
        objects = [_record(pptx_file, node, id_to_name) for node in nodes]
        for record in objects:
            record['placeholder'] = record['placeholder'] or record['object_id'] in placeholder_ids
        local_counts = Counter(record['kind'] for record in objects)
        object_counts.update(local_counts)
        animation_nodes = [
            node for node in queried_animations
            if str(node.get('path') or '').startswith(f'/slide[{index}]/')
        ]
        animations = _queried_animations(nodes, animation_nodes) or _animations(nodes)
        transition = _transition(pptx_file, index, slide)
        notes = str((slide.get('format') or {}).get('notes') or '')
        slides.append({
            'slide_index': index,
            'object_counts': dict(sorted(local_counts.items())),
            'object_names': [record['name'] for record in objects if record['name']],
            'objects': objects,
            'speaker_notes': notes,
            'notes_relationship_resolved': bool(notes),
            'notes_content_type': 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml' if notes else '',
            'transition': transition,
            'animation_targets': list(dict.fromkeys(item['target_shape_name'] for item in animations if item['target_shape_name'])),
            'animations': animations,
            'animation_count': len(animations),
            'timing_node_count': len(animations),
            'placeholder_count': sum(record['placeholder'] for record in objects),
        })
    width = _emu(format_.get('slideWidth'))
    height = _emu(format_.get('slideHeight'))
    notes_count = sum(bool(slide['speaker_notes']) for slide in slides)
    return {
        'schema_version': 2,
        'evidence_source': 'officecli_structured_readback',
        'pptx_file': str(pptx_file),
        'pptx_sha256': _sha256(pptx_file),
        'canvas_emu': {'width': width, 'height': height},
        'canvas_in': {'width': round(width / 914400, 4), 'height': round(height / 914400, 4)},
        'slide_size_type': str(format_.get('slideSize') or ''),
        'slide_count': len(slides),
        'object_type_counts': dict(sorted(object_counts.items())),
        'placeholder_count': sum(slide['placeholder_count'] for slide in slides),
        'notes_slide_count': notes_count,
        'transition_count': sum(bool(slide['transition']) for slide in slides),
        'animation_count': sum(slide['animation_count'] for slide in slides),
        'timing_node_count': sum(slide['timing_node_count'] for slide in slides),
        'relationship_type_counts': {
            'chart': object_counts['chart'],
            'image': object_counts['picture'],
            'notesSlide': notes_count,
        },
        'part_counts': {
            'chart': object_counts['chart'],
            'media': object_counts['picture'],
            'notes': notes_count,
            'master': _query_count(pptx_file, 'slidemaster'),
            'layout': _query_count(pptx_file, 'slidelayout'),
            'theme': _query_count(pptx_file, 'theme'),
        },
        'template_part_hashes': _template_part_hashes(pptx_file),
        'slides': slides,
    }
