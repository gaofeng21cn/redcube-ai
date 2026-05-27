import hashlib
import json
import shutil
import subprocess
from zipfile import ZipFile
from pathlib import Path
from xml.etree import ElementTree
from xml.sax.saxutils import escape as xml_escape


CANVAS_PX = (1152, 648)
SLIDE_WIDTH_IN = 16.0
SLIDE_HEIGHT_IN = 9.0
EMU_PER_INCH = 914400.0
PX_PER_INCH = CANVAS_PX[0] / SLIDE_WIDTH_IN
SVG_NS = 'http://www.w3.org/2000/svg'
PPTX_NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
}
STRICT_SVG_ALLOWED_TAGS = {
    f'{{{SVG_NS}}}svg',
    f'{{{SVG_NS}}}g',
    f'{{{SVG_NS}}}rect',
    f'{{{SVG_NS}}}text',
}
PALETTE = {
    'bg': '#F6F2EA',
    'ink': '#171C24',
    'muted': '#5B6570',
    'accent': '#B94624',
    'panel': '#EFE6D6',
    'line': '#D8C8B2',
    'white': '#FFFFFF',
    'none': 'none',
}
OFFICECLI_SHAPE_KINDS = {
    'rect',
    'rectangle',
    'rounded_rect',
    'panel',
    'text_box',
    'text',
    'oval',
    'circle',
    'line',
    'connector',
}
CONTENT_ROLES = {
    'title',
    'subtitle',
    'core_sentence',
    'point_text',
    'body',
    'content',
    'content_stack',
    'point_index',
    'page_number',
    'cover_meta',
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
}
AI_FIRST_MIN_SHAPES = 7
AI_FIRST_MIN_CONTENT_SHAPES = 4
AI_FIRST_MIN_DECORATIVE_SHAPES = 2
AI_FIRST_MIN_POINT_TEXT = 1
BODY_TEXT_READABILITY_FLOOR_PT = 18.0
POINT_INDEX_FLOOR_PT = 16.0
OFFICECLI_DEFAULT_TEXT_MARGIN_IN = 0.08


def safe_text(value, fallback: str = '') -> str:
    text = str(value or '').strip()
    return text or fallback


def safe_list(value):
    return value if isinstance(value, list) else []


def visible_text(value, fallback: str = '') -> str:
    if value is None:
        return fallback
    if isinstance(value, str):
        return safe_text(value, fallback)
    if isinstance(value, (int, float)):
        return safe_text(value, fallback)
    if isinstance(value, list):
        return safe_text('\n'.join(visible_text(item) for item in value if visible_text(item)), fallback)
    if isinstance(value, dict):
        for key in ('editable_text', 'text', 'body', 'title', 'core_sentence', 'label'):
            text = visible_text(value.get(key))
            if text:
                return text
        return fallback
    return fallback


def shape_kind(shape: dict) -> str:
    return safe_text(shape.get('kind') or shape.get('type') or shape.get('role')).lower()


def ai_shape_text(shape_spec: dict) -> str:
    return visible_text(shape_spec.get('editable_text') or shape_spec.get('text') or shape_spec.get('label'))


def ai_shape_bounds_in(shape_spec: dict):
    bounds = shape_spec.get('bounds') if isinstance(shape_spec.get('bounds'), dict) else {}
    values = []
    for primary, alternate in (
        ('left_in', 'x_in'),
        ('top_in', 'y_in'),
        ('width_in', 'w_in'),
        ('height_in', 'h_in'),
    ):
        raw = bounds.get(primary) if bounds.get(primary) is not None else bounds.get(alternate)
        try:
            values.append(float(raw))
        except (TypeError, ValueError):
            return None
    left, top, width, height = values
    if left < 0 or top < 0 or width <= 0 or height <= 0:
        return None
    if left + width > SLIDE_WIDTH_IN or top + height > SLIDE_HEIGHT_IN:
        return None
    return {
        'left_in': left,
        'top_in': top,
        'width_in': width,
        'height_in': height,
    }


def shape_rect_from_ai_bounds(shape_spec: dict) -> dict:
    bounds = ai_shape_bounds_in(shape_spec)
    if bounds is None:
        raise ValueError(f"native AI-first shape has invalid bounds: {safe_text(shape_spec.get('shape_id'), '<missing-shape-id>')}")
    left = bounds['left_in'] * PX_PER_INCH
    top = bounds['top_in'] * PX_PER_INCH
    width = bounds['width_in'] * PX_PER_INCH
    height = bounds['height_in'] * PX_PER_INCH
    return {
        'left': round(left, 2),
        'top': round(top, 2),
        'width': round(width, 2),
        'height': round(height, 2),
        'right': round(left + width, 2),
        'bottom': round(top + height, 2),
    }


def ai_shape_quality_role(shape_spec: dict) -> str:
    quality_role = safe_text(shape_spec.get('quality_role')).lower()
    if quality_role in {'content', 'decorative'}:
        return quality_role
    role = safe_text(shape_spec.get('role')).lower()
    kind = shape_kind(shape_spec)
    if kind in {'text', 'text_box'} or role in CONTENT_ROLES or role.endswith('_panel'):
        return 'content'
    return 'decorative'


def ai_shape_font_size(shape_spec: dict, role: str) -> float:
    try:
        explicit = float(shape_spec.get('font_size') or shape_spec.get('size_pt') or shape_spec.get('size') or 0)
    except (TypeError, ValueError):
        explicit = 0
    if explicit > 0:
        return explicit
    if role == 'title':
        return 44.0
    if role in {'subtitle', 'core_sentence'}:
        return 24.0
    if role == 'point_index':
        return POINT_INDEX_FLOOR_PT
    if role == 'page_number':
        return 18.0
    return BODY_TEXT_READABILITY_FLOOR_PT


def weighted_text_width_pt(text: str, font_size: float) -> float:
    width = 0.0
    for char in safe_text(text):
        codepoint = ord(char)
        if char.isspace():
            width += font_size * 0.32
        elif codepoint > 127:
            width += font_size * 0.95
        elif char.isupper():
            width += font_size * 0.68
        elif char in {'-', '/', ':'}:
            width += font_size * 0.38
        else:
            width += font_size * 0.56
    return width


def margin_inches(shape_spec: dict) -> float:
    raw = safe_text(shape_spec.get('margin'), f'{OFFICECLI_DEFAULT_TEXT_MARGIN_IN}in').lower()
    try:
        return float(raw[:-2]) if raw.endswith('in') else float(raw)
    except ValueError:
        return OFFICECLI_DEFAULT_TEXT_MARGIN_IN


def ai_text_capacity_failure(shape_spec: dict) -> dict | None:
    kind = shape_kind(shape_spec)
    if kind not in {'text', 'text_box'}:
        return None
    text = ai_shape_text(shape_spec)
    if not text:
        return None
    bounds = ai_shape_bounds_in(shape_spec)
    if bounds is None:
        return None
    role = safe_text(shape_spec.get('role'))
    font_size = ai_shape_font_size(shape_spec, role)
    margin_in = margin_inches(shape_spec)
    usable_width_pt = max((bounds['width_in'] - (2 * margin_in)) * 72.0, 1.0)
    usable_height_pt = max((bounds['height_in'] - (2 * margin_in)) * 72.0, 1.0)
    estimated_lines = max(1, int((weighted_text_width_pt(text, font_size) + usable_width_pt - 1.0) // usable_width_pt))
    required_height_pt = estimated_lines * font_size
    if required_height_pt <= usable_height_pt:
        return None
    return {
        'reason': 'ai_first_text_capacity_exceeded',
        'shape_id': safe_text(shape_spec.get('shape_id'), '<missing-shape-id>'),
        'role': role,
        'font_size': round(font_size, 2),
        'estimated_lines': estimated_lines,
        'required_height_pt': round(required_height_pt, 2),
        'usable_height_pt': round(usable_height_pt, 2),
        'suggested_height_in': round((required_height_pt / 72.0) + (2 * margin_in), 3),
    }


def resolve_color(value, default_key: str) -> str:
    color = safe_text(value, default_key)
    return PALETTE.get(color, color)


def ai_shape_fill(shape_spec: dict, *, text: str) -> str:
    fallback = 'none' if text else 'panel'
    return resolve_color(shape_spec.get('fill') or shape_spec.get('fill_color'), fallback)


def ai_shape_line(shape_spec: dict, *, text: str) -> str:
    fallback = 'none' if text else 'line'
    return resolve_color(shape_spec.get('line') or shape_spec.get('line_color') or shape_spec.get('stroke'), fallback)


def ai_shape_color(shape_spec: dict) -> str:
    return resolve_color(shape_spec.get('color') or shape_spec.get('text_color'), 'ink')


def native_ai_design_shapes(slide_data: dict) -> list[dict]:
    return [
        shape for shape in safe_list(slide_data.get('_editable_native_shapes'))
        if isinstance(shape, dict)
    ]


def validate_ai_first_design_plan(slide_data: dict) -> list[dict]:
    shapes = native_ai_design_shapes(slide_data)
    failures = []
    if len(shapes) < AI_FIRST_MIN_SHAPES:
        failures.append({'reason': 'ai_first_shape_plan_too_thin', 'actual': len(shapes), 'minimum': AI_FIRST_MIN_SHAPES})
    content_count = sum(1 for shape in shapes if ai_shape_quality_role(shape) == 'content')
    decorative_count = sum(1 for shape in shapes if ai_shape_quality_role(shape) == 'decorative')
    point_text_count = sum(1 for shape in shapes if safe_text(shape.get('role')) == 'point_text' and ai_shape_text(shape))
    if content_count < AI_FIRST_MIN_CONTENT_SHAPES:
        failures.append({'reason': 'ai_first_content_shape_count_too_low', 'actual': content_count, 'minimum': AI_FIRST_MIN_CONTENT_SHAPES})
    if decorative_count < AI_FIRST_MIN_DECORATIVE_SHAPES:
        failures.append({'reason': 'ai_first_decorative_shape_count_too_low', 'actual': decorative_count, 'minimum': AI_FIRST_MIN_DECORATIVE_SHAPES})
    if point_text_count < AI_FIRST_MIN_POINT_TEXT:
        failures.append({'reason': 'ai_first_point_text_missing', 'actual': point_text_count, 'minimum': AI_FIRST_MIN_POINT_TEXT})
    for shape in shapes:
        shape_id = safe_text(shape.get('shape_id'), '<missing-shape-id>')
        kind = shape_kind(shape)
        role = safe_text(shape.get('role'))
        text = ai_shape_text(shape)
        if not safe_text(shape.get('shape_id')):
            failures.append({'reason': 'ai_first_shape_id_missing', 'shape_id': shape_id})
        if kind not in OFFICECLI_SHAPE_KINDS:
            failures.append({'reason': 'ai_first_shape_kind_not_officecli_materializable', 'shape_id': shape_id, 'kind': kind})
        if ai_shape_bounds_in(shape) is None:
            failures.append({'reason': 'ai_first_shape_bounds_invalid', 'shape_id': shape_id})
        if kind in {'text', 'text_box'} and not text:
            failures.append({'reason': 'ai_first_text_missing', 'shape_id': shape_id})
        font_size = ai_shape_font_size(shape, role)
        if role == 'point_index' and font_size < POINT_INDEX_FLOOR_PT:
            failures.append({'reason': 'ai_first_point_index_too_small', 'shape_id': shape_id, 'font_size': round(font_size, 2)})
        if kind in {'text', 'text_box'} and ai_shape_quality_role(shape) == 'content':
            if role not in {'page_number', 'point_index'} and font_size < BODY_TEXT_READABILITY_FLOOR_PT:
                failures.append({'reason': 'ai_first_body_text_too_small', 'shape_id': shape_id, 'font_size': round(font_size, 2)})
            if role not in {'page_number', 'point_index'}:
                capacity_failure = ai_text_capacity_failure(shape)
                if capacity_failure:
                    failures.append(capacity_failure)
        if not text and resolve_color(shape.get('fill') or shape.get('fill_color'), 'none') == 'none' and resolve_color(shape.get('line') or shape.get('line_color') or shape.get('stroke'), 'none') == 'none':
            failures.append({'reason': 'ai_first_non_text_shape_invisible', 'shape_id': shape_id})
    return failures


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
    count = sum(1 for shape in shapes if safe_text(shape.get('role')) == 'point_text' and ai_shape_text(shape))
    return max(1, min(count, 5))


def file_sha256(file: Path) -> str:
    if not file.exists():
        return ''
    digest = hashlib.sha256()
    with file.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def svg_rect_from_bounds(bounds: dict, fill: str, intent: str, shape_id: str, stroke: str = 'none') -> str:
    return (
        f'    <rect x="{bounds["left"]:.2f}" y="{bounds["top"]:.2f}" '
        f'width="{bounds["width"]:.2f}" height="{bounds["height"]:.2f}" '
        f'fill="{xml_escape(fill)}" stroke="{xml_escape(stroke)}" '
        f'data-intent="{xml_escape(intent)}" id="{xml_escape(shape_id)}" />'
    )


def svg_text_from_bounds(bounds: dict, text: str, size: float, fill: str, intent: str, shape_id: str, weight: str) -> str:
    x = bounds['left'] + 10
    y = bounds['top'] + max(18, size)
    checked = safe_text(text)[:180]
    return (
        f'    <text x="{x:.2f}" y="{y:.2f}" font-size="{size:g}" '
        f'font-family="Aptos, Arial, sans-serif" font-weight="{weight}" '
        f'fill="{xml_escape(fill)}" data-intent="{xml_escape(intent)}" '
        f'id="{xml_escape(shape_id)}-text">{xml_escape(checked)}</text>'
    )


def strict_svg_preflight(svg_file: Path) -> dict:
    try:
        root = ElementTree.parse(svg_file).getroot()
    except ElementTree.ParseError as exc:
        raise ValueError(f'SVG IR preflight failed for {svg_file}: {exc}') from exc
    if root.tag != f'{{{SVG_NS}}}svg':
        raise ValueError(f'SVG IR preflight failed for {svg_file}: root element must be svg')
    if root.attrib.get('data-redcube-ir') != 'redcube_svg_ir_v1':
        raise ValueError(f'SVG IR preflight failed for {svg_file}: missing redcube_svg_ir_v1 marker')
    counts = {'text': 0, 'rect': 0, 'group': 0}
    for element in root.iter():
        if element.tag not in STRICT_SVG_ALLOWED_TAGS:
            raise ValueError(f'SVG IR preflight failed for {svg_file}: unsupported tag {element.tag}')
        local = element.tag.split('}', 1)[-1]
        if local == 'text':
            counts['text'] += 1
        elif local == 'rect':
            counts['rect'] += 1
        elif local == 'g':
            counts['group'] += 1
    if counts['text'] < 1 or counts['rect'] < 1 or counts['group'] < 1:
        raise ValueError(f'SVG IR preflight failed for {svg_file}: text/rect/group intent is required')
    return {
        'status': 'pass',
        'strict': True,
        'allowed_tags': ['svg', 'g', 'rect', 'text'],
        'intent_counts': counts,
    }


def render_slide_svg_ir(slide_data, index: int, total: int, svg_dir: Path, repaired: bool) -> dict:
    slide_id = safe_text(slide_data.get('slide_id'), f'S{index:02d}')
    background = resolve_color(slide_data.get('background'), 'bg')
    lines = [
        f'<svg xmlns="{SVG_NS}" width="{CANVAS_PX[0]}" height="{CANVAS_PX[1]}" viewBox="0 0 {CANVAS_PX[0]} {CANVAS_PX[1]}" data-redcube-ir="redcube_svg_ir_v1" data-slide-id="{xml_escape(slide_id)}" data-materializer="officecli_pptx_materializer">',
        '  <g id="slide-root" data-intent="group:ai_spatial_plan">',
        f'    <rect x="0" y="0" width="{CANVAS_PX[0]}" height="{CANVAS_PX[1]}" fill="{xml_escape(background)}" data-intent="rect:background" id="{xml_escape(slide_id)}-background" />',
    ]
    for shape in native_ai_design_shapes(slide_data):
        shape_id = safe_text(shape.get('shape_id'))
        role = safe_text(shape.get('role'), 'shape')
        kind = shape_kind(shape)
        text = ai_shape_text(shape)
        bounds = shape_rect_from_ai_bounds(shape)
        fill = ai_shape_fill(shape, text=text)
        line = ai_shape_line(shape, text=text)
        color = ai_shape_color(shape)
        rect_height = bounds['height'] if kind not in {'line', 'connector'} else max(2.0, bounds['height'])
        rect_bounds = {**bounds, 'height': rect_height}
        lines.append(f'  <g id="{xml_escape(shape_id)}" data-intent="group:{xml_escape(role)}">')
        lines.append(svg_rect_from_bounds(rect_bounds, fill if kind not in {'line', 'connector'} else line, f'{kind}:{role}', shape_id, line))
        if text:
            weight = '700' if role in {'title', 'point_index'} or bool(shape.get('bold')) else '500'
            lines.append(svg_text_from_bounds(bounds, text, ai_shape_font_size(shape, role), color, f'text:{role}', shape_id, weight))
        lines.append('  </g>')
    if repaired:
        lines.append(f'    <rect x="1032" y="36" width="52" height="12" fill="{xml_escape(PALETTE["accent"])}" data-intent="rect:repair_marker" id="{xml_escape(slide_id)}-repair-marker" />')
    lines.extend(['  </g>', '</svg>'])
    svg_dir.mkdir(parents=True, exist_ok=True)
    svg_file = svg_dir / f'{slide_id}.svg'
    svg_file.write_text('\n'.join(lines), encoding='utf-8')
    return {
        'file': str(svg_file),
        'sha256': file_sha256(svg_file),
        'preflight': strict_svg_preflight(svg_file),
    }


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
        'line': 'none' if kind in {'line', 'connector'} else line,
        'lineWidth': f"{float(shape_spec.get('line_width') or shape_spec.get('stroke_width') or 1.0)}pt",
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
            'valign': safe_text(shape_spec.get('valign'), 'top'),
            'autoFit': 'none',
            'margin': safe_text(shape_spec.get('margin'), '0.08in'),
        })
    return props


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
        'officecli_materialized': True,
    }


def parse_json_output(completed: subprocess.CompletedProcess, fallback):
    text = safe_text(completed.stdout)
    if not text:
        return fallback
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {'raw_stdout': text}


def pptx_geometry_audit(pptx_file: Path) -> dict:
    overflows = []
    with ZipFile(pptx_file) as package:
        presentation = ElementTree.fromstring(package.read('ppt/presentation.xml'))
        slide_size = presentation.find('p:sldSz', PPTX_NS)
        if slide_size is None:
            raise ValueError('PPTX geometry audit failed: missing ppt/presentation.xml p:sldSz')
        slide_width_emu = int(slide_size.attrib.get('cx') or 0)
        slide_height_emu = int(slide_size.attrib.get('cy') or 0)
        slide_width_in = slide_width_emu / EMU_PER_INCH
        slide_height_in = slide_height_emu / EMU_PER_INCH
        slide_files = sorted(
            (name for name in package.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')),
            key=lambda name: int(''.join(ch for ch in Path(name).stem if ch.isdigit()) or 0),
        )
        for slide_index, slide_file in enumerate(slide_files, 1):
            slide = ElementTree.fromstring(package.read(slide_file))
            for shape in slide.findall('.//p:sp', PPTX_NS):
                xfrm = shape.find('.//a:xfrm', PPTX_NS)
                if xfrm is None:
                    continue
                offset = xfrm.find('a:off', PPTX_NS)
                extent = xfrm.find('a:ext', PPTX_NS)
                if offset is None or extent is None:
                    continue
                left = int(offset.attrib.get('x') or 0)
                top = int(offset.attrib.get('y') or 0)
                width = int(extent.attrib.get('cx') or 0)
                height = int(extent.attrib.get('cy') or 0)
                right = left + width
                bottom = top + height
                if left < 0 or top < 0 or right > slide_width_emu or bottom > slide_height_emu:
                    shape_name = ''
                    non_visual = shape.find('p:nvSpPr/p:cNvPr', PPTX_NS)
                    if non_visual is not None:
                        shape_name = safe_text(non_visual.attrib.get('name'))
                    text = safe_text(''.join(item.text or '' for item in shape.findall('.//a:t', PPTX_NS)))
                    overflows.append({
                        'slide_index': slide_index,
                        'shape_name': shape_name,
                        'text': text[:80],
                        'left_in': round(left / EMU_PER_INCH, 4),
                        'top_in': round(top / EMU_PER_INCH, 4),
                        'width_in': round(width / EMU_PER_INCH, 4),
                        'height_in': round(height / EMU_PER_INCH, 4),
                        'right_in': round(right / EMU_PER_INCH, 4),
                        'bottom_in': round(bottom / EMU_PER_INCH, 4),
                    })
    size_ok = abs(slide_width_in - SLIDE_WIDTH_IN) < 0.001 and abs(slide_height_in - SLIDE_HEIGHT_IN) < 0.001
    return {
        'slide_width_in': round(slide_width_in, 4),
        'slide_height_in': round(slide_height_in, 4),
        'expected_slide_width_in': SLIDE_WIDTH_IN,
        'expected_slide_height_in': SLIDE_HEIGHT_IN,
        'slide_size_ok': size_ok,
        'overflow_count': len(overflows),
        'overflows': overflows,
        'ok': size_ok and len(overflows) == 0,
    }


def build_deck(slides, output_pptx: Path, svg_ir_dir: Path, repaired_slide_ids, evaluate_native_slide_quality):
    officecli = shutil.which('officecli')
    if not officecli:
        raise RuntimeError('native PPT officecli materializer requires officecli on PATH')

    manifest_slides = []
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    output_pptx.unlink(missing_ok=True)
    officecli_commands = []
    officecli_text_probe = []
    for index, slide_data in enumerate(slides, 1):
        slide_id = safe_text(slide_data.get('slide_id'), f'S{index:02d}')
        failures = validate_ai_first_design_plan(slide_data)
        if failures:
            raise RuntimeError(
                'native PPT AI-first editable_shape_plan failed: '
                + json.dumps(failures, ensure_ascii=False, sort_keys=True)
            )
        try:
            svg_ir = render_slide_svg_ir(slide_data, index, len(slides), svg_ir_dir, slide_id in repaired_slide_ids)
        except ValueError as exc:
            raise RuntimeError(str(exc)) from exc

        ai_shapes = native_ai_design_shapes(slide_data)
        native_shapes = []
        officecli_commands.append({
            'command': 'add',
            'parent': '/',
            'type': 'slide',
            'props': {
                'layout': 'blank',
                'background': resolve_color(slide_data.get('background'), 'bg'),
            },
        })
        for shape_spec in ai_shapes:
            bounds_in = ai_shape_bounds_in(shape_spec)
            bounds_px = shape_rect_from_ai_bounds(shape_spec)
            officecli_commands.append({
                'command': 'add',
                'parent': f'/slide[{index}]',
                'type': 'shape',
                'props': officecli_shape_props(shape_spec, bounds_in, bounds_px),
            })
            native_shape = native_shape_manifest_record(shape_spec)
            native_shapes.append(native_shape)
            if native_shape['text']:
                officecli_text_probe.append(native_shape['text'])

        quality = evaluate_native_slide_quality(native_shapes, primary_point_count(ai_shapes))
        title_sizes = [
            shape['font_size'] for shape in native_shapes
            if shape['role'] == 'title' and shape['font_size'] > 0
        ]
        manifest_slides.append({
            'slide_id': slide_id,
            'title': slide_title(slide_data, index),
            'layout_family': layout_family(slide_data),
            'layout_writer': 'officecli_pptx_materializer',
            'ai_first_spatial_plan': {
                'required': True,
                'materialized': True,
                'helper_template_layout_used': False,
                'materializer': 'officecli_pptx_materializer',
                'shape_count': len(ai_shapes),
            },
            'title_font_size': max(title_sizes, default=0),
            'shape_count': len(native_shapes),
            'text_box_count': sum(1 for shape in native_shapes if shape['kind'] == 'text_box'),
            'redcube_svg_ir_file': svg_ir['file'],
            'redcube_svg_ir_sha256': svg_ir['sha256'],
            'redcube_svg_ir_preflight': svg_ir['preflight'],
            'redcube_svg_ir': svg_ir,
            'preview_screenshot_file': '',
            'preview_screenshot_sha256': '',
            'preview_screenshot_dimensions': None,
            'render_proof_source': '',
            'synthetic_preview': False,
            'native_shapes': native_shapes,
            'checks': quality['checks'],
            'metrics': quality['metrics'],
            'issues': quality['issues'],
            'repaired': slide_id in repaired_slide_ids,
        })

    def run_officecli(args, *, input_text: str | None = None) -> subprocess.CompletedProcess:
        completed = subprocess.run(
            [officecli, *args],
            text=True,
            input=input_text,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(
                'officecli materializer command failed: '
                + json.dumps({
                    'args': args,
                    'stdout': completed.stdout,
                    'stderr': completed.stderr,
                    'returncode': completed.returncode,
                }, ensure_ascii=False, sort_keys=True)
            )
        return completed

    run_officecli(['create', str(output_pptx)])
    run_officecli(['open', str(output_pptx)])
    try:
        run_officecli([
            'set',
            str(output_pptx),
            '/',
            '--prop',
            f'slideWidth={SLIDE_WIDTH_IN:g}in',
            '--prop',
            f'slideHeight={SLIDE_HEIGHT_IN:g}in',
        ])
        run_officecli(['batch', str(output_pptx)], input_text=json.dumps(officecli_commands, ensure_ascii=False))
        run_officecli(['save', str(output_pptx)])
        validate = run_officecli(['validate', str(output_pptx), '--json'])
        issues = run_officecli(['view', str(output_pptx), 'issues', '--json'])
        text = run_officecli(['view', str(output_pptx), 'text', '--json'])
    finally:
        run_officecli(['close', str(output_pptx)])
    geometry_audit = pptx_geometry_audit(output_pptx)
    if not geometry_audit['ok']:
        raise RuntimeError(
            'native PPTX geometry audit failed: '
            + json.dumps(geometry_audit, ensure_ascii=False, sort_keys=True)
        )

    return {
        'slides': manifest_slides,
        'officecli_gate': {
            'materializer': 'officecli_pptx_materializer',
            'command_count': len(officecli_commands),
            'save_before_close': True,
            'validate': parse_json_output(validate, {}),
            'view_issues': parse_json_output(issues, {}),
            'view_text': parse_json_output(text, {}),
            'expected_text_fragments': officecli_text_probe,
            'geometry_audit': geometry_audit,
        },
    }
