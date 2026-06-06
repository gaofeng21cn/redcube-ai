import hashlib
from pathlib import Path
from xml.etree import ElementTree
from xml.sax.saxutils import escape as xml_escape

from redcube_ai.native_helpers.ppt_deck.native_layout_constants import CANVAS_PX, PALETTE, STRICT_SVG_ALLOWED_TAGS, SVG_NS
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, native_ai_design_shapes, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import ai_shape_color, ai_shape_fill, ai_shape_line, resolve_color
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_metrics import ai_shape_font_size

__all__ = [
    'file_sha256',
    'svg_rect_from_bounds',
    'svg_text_from_bounds',
    'strict_svg_preflight',
    'render_slide_svg_ir',
]


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
