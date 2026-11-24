"""Direct python-pptx materializer for AI-first native editable PPTX decks."""
from __future__ import annotations

import io
import json
import re
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.util import Inches, Pt

from redcube_ai.native_helpers.ppt_deck.native_hyperlinks import (
    assert_hyperlink_readback,
    planned_hyperlinks,
    readback_hyperlinks,
    validate_hyperlinks,
)
from redcube_ai.native_helpers.ppt_deck.native_layout_constants import SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN
from redcube_ai.native_helpers.ppt_deck.native_layouts.common import (
    ai_shape_text,
    native_ai_design_shapes,
    safe_list,
    safe_text,
    shape_kind,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.geometry import ai_shape_bounds_in, pptx_geometry_audit
from redcube_ai.native_helpers.ppt_deck.native_layouts.object_specs import (
    canonical_object_kind,
    native_shape_manifest_record,
    picture_crop,
    picture_source,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.style import (
    ai_shape_color,
    ai_shape_fill,
    ai_shape_line,
    ai_shape_line_end,
    ai_shape_line_width_pt,
    normalize_valign,
    parse_rgb_color,
    resolve_color,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts.text_metrics import ai_shape_font_size, margin_inches
from redcube_ai.native_helpers.ppt_deck.native_package import (
    apply_custom_geometry,
    copy_template_source,
    decode_picture_bytes,
    read_pptx_package,
    save_presentation,
    template_preservation,
    validate_pptx_package,
)
from redcube_ai.native_helpers.ppt_deck.native_readback import A_NS, P14_NS, P_NS, R_NS

__all__ = [
    'SUPPORTED_ANIMATION_TARGET_KINDS',
    'issue_count',
    'materialize_native_pptx',
]

SUPPORTED_ANIMATION_TARGET_KINDS = {'text_box', 'shape', 'rect', 'rounded_rect', 'oval', 'path'}

_PRESET_SHAPE_MAP = {
    'rect': MSO_SHAPE.RECTANGLE,
    'rectangle': MSO_SHAPE.RECTANGLE,
    'roundrect': MSO_SHAPE.ROUNDED_RECTANGLE,
    'rounded_rect': MSO_SHAPE.ROUNDED_RECTANGLE,
    'ellipse': MSO_SHAPE.OVAL,
    'oval': MSO_SHAPE.OVAL,
    'triangle': MSO_SHAPE.ISOSCELES_TRIANGLE,
    'diamond': MSO_SHAPE.DIAMOND,
    'hexagon': MSO_SHAPE.HEXAGON,
    'pentagon': MSO_SHAPE.PENTAGON,
    'chevron': MSO_SHAPE.CHEVRON,
    'rightarrow': MSO_SHAPE.RIGHT_ARROW,
    'leftarrow': MSO_SHAPE.LEFT_ARROW,
    'uparrow': MSO_SHAPE.UP_ARROW,
    'downarrow': MSO_SHAPE.DOWN_ARROW,
    'star5': MSO_SHAPE.STAR_5_POINT,
    'callout': MSO_SHAPE.RECTANGULAR_CALLOUT,
}

_CHART_TYPE_MAP = {
    'column': XL_CHART_TYPE.COLUMN_CLUSTERED,
    'column_clustered': XL_CHART_TYPE.COLUMN_CLUSTERED,
    'column_stacked': XL_CHART_TYPE.COLUMN_STACKED,
    'stacked_column': XL_CHART_TYPE.COLUMN_STACKED,
    'bar': XL_CHART_TYPE.BAR_CLUSTERED,
    'bar_clustered': XL_CHART_TYPE.BAR_CLUSTERED,
    'bar_stacked': XL_CHART_TYPE.BAR_STACKED,
    'stacked_bar': XL_CHART_TYPE.BAR_STACKED,
    'line': XL_CHART_TYPE.LINE,
    'pie': XL_CHART_TYPE.PIE,
    'doughnut': XL_CHART_TYPE.DOUGHNUT,
    'area': XL_CHART_TYPE.AREA,
}

_ALIGN_MAP = {
    'left': PP_ALIGN.LEFT,
    'center': PP_ALIGN.CENTER,
    'centre': PP_ALIGN.CENTER,
    'right': PP_ALIGN.RIGHT,
    'justify': PP_ALIGN.JUSTIFY,
    'distributed': PP_ALIGN.DISTRIBUTE,
}

_VALIGN_MAP = {
    'top': MSO_ANCHOR.TOP,
    'center': MSO_ANCHOR.MIDDLE,
    'bottom': MSO_ANCHOR.BOTTOM,
}

_CONNECTOR_TYPE_MAP = {
    'straight': MSO_CONNECTOR.STRAIGHT,
    'elbow': MSO_CONNECTOR.ELBOW,
    'bent': MSO_CONNECTOR.ELBOW,
    'curve': MSO_CONNECTOR.CURVE,
    'curved': MSO_CONNECTOR.CURVE,
}

_EFFECT_TO_PRESET_ID = {
    'appear': 1,
    'fly': 2,
    'blinds': 3,
    'box': 4,
    'checkerboard': 5,
    'circle': 6,
    'dissolve': 9,
    'fade': 10,
    'peek': 12,
    'randombars': 14,
    'split': 16,
    'strips': 17,
    'wheel': 21,
    'wipe': 22,
    'zoom': 23,
    'bounce': 26,
    'float': 53,
}

_CLASS_TO_OOXML = {
    'entrance': 'entr',
    'exit': 'exit',
    'emphasis': 'emph',
    'motion': 'path',
    'media': 'mediacall',
}

_TRIGGER_TO_NODE_TYPE = {
    'onclick': 'clickEffect',
    'withprevious': 'withEffect',
    'afterprevious': 'afterEffect',
}

_DIR_MAP = {
    'left': 'l',
    'right': 'r',
    'up': 'u',
    'down': 'd',
    'l': 'l',
    'r': 'r',
    'u': 'u',
    'd': 'd',
}

_NAME_REF_RE = re.compile(r'\[@name=([^\]]+)\]$')


def _qn(namespace: str, name: str) -> str:
    return f'{{{namespace}}}{name}'


def issue_count(payload: dict) -> int:
    data = payload.get('data')
    if not isinstance(data, dict) or 'count' not in data:
        raise RuntimeError('native PPTX view issues JSON data.count is required')
    raw = data['count']
    if isinstance(raw, bool) or not isinstance(raw, int) or raw < 0:
        raise RuntimeError(f'native PPTX view issues JSON data.count must be a non-negative integer: {raw!r}')
    return raw


def _animation_object_kind(shape: dict) -> str:
    try:
        return canonical_object_kind(shape)
    except ValueError:
        return shape_kind(shape)


def _animation_target_failures(slides: list[dict]) -> list[dict]:
    failures = []
    for slide_index, slide_data in enumerate(slides, 1):
        animations = [
            item for item in safe_list(slide_data.get('animation_timeline'))
            if isinstance(item, dict)
        ]
        if not animations:
            continue
        top_level_by_id = {
            safe_text(shape.get('shape_id')): shape
            for shape in native_ai_design_shapes(slide_data)
            if safe_text(shape.get('shape_id'))
        }
        group_children_by_id: dict[str, dict] = {}

        def collect_group_children(shape: dict) -> None:
            kind = _animation_object_kind(shape)
            stable_drawing = kind in {'chart', 'table', 'metric_grid'} and safe_text(
                shape.get('materialization_intent'), 'native_data_object'
            ) == 'stable_drawingml'
            if kind != 'group' and not stable_drawing:
                return
            children = safe_list(shape.get('drawingml_shapes') or shape.get('children'))
            for child in [item for item in children if isinstance(item, dict)]:
                child_id = safe_text(child.get('shape_id'))
                if child_id:
                    group_children_by_id[child_id] = child
                collect_group_children(child)

        for shape in native_ai_design_shapes(slide_data):
            collect_group_children(shape)

        for animation in animations:
            target_id = safe_text(animation.get('target_shape_id') or animation.get('target_id'))
            target = top_level_by_id.get(target_id)
            if target is None:
                child = group_children_by_id.get(target_id)
                failures.append({
                    'slide_index': slide_index,
                    'slide_id': safe_text(slide_data.get('slide_id'), f'S{slide_index:02d}'),
                    'shape_id': target_id,
                    'kind': _animation_object_kind(child) if child is not None else '',
                    'materialization_intent': safe_text((child or {}).get('materialization_intent')),
                    'reason': 'animation_target_group_child' if child is not None else 'animation_target_missing',
                })
                continue
            kind = _animation_object_kind(target)
            intent = safe_text(target.get('materialization_intent'), 'native_data_object' if kind == 'chart' else '')
            if kind in SUPPORTED_ANIMATION_TARGET_KINDS or (kind == 'chart' and intent == 'native_data_object'):
                continue
            reason = (
                'animation_target_stable_drawingml_group_unsupported'
                if kind in {'chart', 'table', 'metric_grid'} and intent == 'stable_drawingml'
                else 'animation_target_kind_unsupported'
            )
            failures.append({
                'slide_index': slide_index,
                'slide_id': safe_text(slide_data.get('slide_id'), f'S{slide_index:02d}'),
                'shape_id': target_id,
                'kind': kind,
                'materialization_intent': intent,
                'reason': reason,
            })
    return failures


def _assert_animation_targets(slides: list[dict]) -> None:
    failures = _animation_target_failures(slides)
    if failures:
        raise ValueError(
            'native PPT animation target preflight failed: '
            + json.dumps(failures, ensure_ascii=False, sort_keys=True)
        )


def _children_for_group(shape_spec: dict, kind: str) -> list[dict]:
    key = 'drawingml_shapes' if kind in {'chart', 'table', 'metric_grid'} else 'children'
    children = [item for item in safe_list(shape_spec.get(key) or shape_spec.get('children')) if isinstance(item, dict)]
    if not children:
        raise ValueError(f"native PPT {kind} requires non-empty {key}: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    return children


def _template_mode(template_intake: dict | None) -> str:
    if not template_intake:
        return 'none'
    mode = safe_text(template_intake.get('mode'), 'replace_slides')
    if mode not in {'replace_slides', 'fill_existing'}:
        raise ValueError(f'unsupported native PPT template mode: {mode}')
    return mode


def _fill_existing_slide_indices(slides: list[dict], slide_count: int) -> list[int]:
    indices = []
    for index, slide_data in enumerate(slides, 1):
        binding = slide_data.get('template_layout_binding') if isinstance(slide_data.get('template_layout_binding'), dict) else {}
        target_slide_index = binding.get('target_slide_index')
        if target_slide_index in (None, ''):
            target_slide_index = index
        try:
            indices.append(int(target_slide_index))
        except (TypeError, ValueError) as exc:
            raise ValueError('native PPT fill_existing target_slide_index must be an integer') from exc
    expected = list(range(1, slide_count + 1))
    if sorted(indices) != expected:
        raise ValueError(
            'native PPT fill_existing requires unique complete target_slide_index coverage: '
            f'expected {expected}, got {indices}'
        )
    return indices


def _speaker_notes(slide_data: dict) -> str:
    notes = slide_data.get('speaker_notes') or slide_data.get('notes')
    if isinstance(notes, dict):
        notes = notes.get('text') or notes.get('speaker_notes')
    return safe_text(notes)


def _select_slide_layout(prs: Presentation, layout_name: str):
    wanted = safe_text(layout_name, 'blank').lower()
    for layout in prs.slide_layouts:
        if safe_text(layout.name).lower() == wanted:
            return layout
    if wanted == 'blank':
        return min(prs.slide_layouts, key=lambda layout: len(layout.placeholders))
    return prs.slide_layouts[0]


def _remove_all_slides(prs: Presentation) -> None:
    sld_id_lst = prs.slides._sldIdLst
    for sld_id in list(sld_id_lst):
        r_id = sld_id.get(_qn(R_NS, 'id'))
        if r_id:
            prs.part.drop_rel(r_id)
        sld_id_lst.remove(sld_id)


def _set_slide_background(slide, color_value) -> None:
    rgb = parse_rgb_color(resolve_color(color_value, 'bg'))
    if rgb is None:
        return
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def _set_ea_font(run, typeface: str) -> None:
    if not typeface:
        return
    r_pr = run._r.get_or_add_rPr()
    for existing in list(r_pr.findall(_qn(A_NS, 'ea'))):
        r_pr.remove(existing)
    ea = etree.SubElement(r_pr, _qn(A_NS, 'ea'))
    ea.set('typeface', typeface)


def _set_paragraph_bullet(paragraph, *, enabled: bool) -> None:
    if not enabled:
        return
    p_pr = paragraph._p.get_or_add_pPr()
    for tag in ('buNone', 'buChar', 'buAutoNum'):
        for existing in list(p_pr.findall(_qn(A_NS, tag))):
            p_pr.remove(existing)
    bu = etree.SubElement(p_pr, _qn(A_NS, 'buChar'))
    bu.set('char', '•')


def _apply_fill_and_line(shape, shape_spec: dict, *, text: str) -> None:
    fill_str = ai_shape_fill(shape_spec, text=text)
    fill_rgb = parse_rgb_color(fill_str)
    if fill_rgb is not None:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_rgb
    else:
        shape.fill.background()

    line_str = ai_shape_line(shape_spec, text=text)
    line_rgb = parse_rgb_color(line_str)
    if line_rgb is not None:
        shape.line.color.rgb = line_rgb
        width_pt = ai_shape_line_width_pt(shape_spec)
        if width_pt > 0:
            shape.line.width = Pt(width_pt)
    else:
        shape.line.fill.background()


def _parse_font_size(value, fallback: float) -> float:
    if value in (None, ''):
        return fallback
    raw = str(value).strip().lower().removesuffix('pt')
    try:
        return float(raw)
    except ValueError:
        return fallback


def _apply_text_frame(shape, shape_spec: dict) -> int:
    text = ai_shape_text(shape_spec)
    paragraphs_spec = [item for item in safe_list(shape_spec.get('paragraphs')) if isinstance(item, dict)]
    if not text and not paragraphs_spec:
        return 0
    role = safe_text(shape_spec.get('role'), 'shape')
    default_font = safe_text(shape_spec.get('font'), 'Aptos')
    default_font_ea = safe_text(shape_spec.get('font_ea') or shape_spec.get('font.ea'), 'Noto Sans CJK SC')
    default_size = ai_shape_font_size(shape_spec, role)
    default_color = ai_shape_color(shape_spec)
    default_bold = bool(shape_spec.get('bold')) or role in {'title', 'point_index'}
    default_align = _ALIGN_MAP.get(safe_text(shape_spec.get('align'), 'left').lower(), PP_ALIGN.LEFT)
    valign = _VALIGN_MAP.get(normalize_valign(shape_spec), MSO_ANCHOR.TOP)
    margin = Inches(margin_inches(shape_spec))

    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = valign
    tf.margin_left = margin
    tf.margin_right = margin
    tf.margin_top = margin
    tf.margin_bottom = margin

    body_pr = tf._txBody.find(_qn(A_NS, 'bodyPr'))
    if body_pr is not None:
        for tag in ('normAutofit', 'spAutoFit', 'noAutofit'):
            for existing in list(body_pr.findall(_qn(A_NS, tag))):
                body_pr.remove(existing)
        etree.SubElement(body_pr, _qn(A_NS, 'noAutofit'))

    ops = 1
    if paragraphs_spec:
        for p_index, p_spec in enumerate(paragraphs_spec):
            para = tf.paragraphs[0] if p_index == 0 else tf.add_paragraph()
            p_align_raw = safe_text(p_spec.get('align')).lower()
            para.alignment = _ALIGN_MAP.get(p_align_raw, default_align) if p_align_raw else default_align
            if p_spec.get('level') not in (None, ''):
                para.level = int(p_spec['level'])
            if p_spec.get('bullet') is True:
                _set_paragraph_bullet(para, enabled=True)
            if p_spec.get('lineSpacing') not in (None, ''):
                try:
                    para.line_spacing = float(p_spec['lineSpacing'])
                except (TypeError, ValueError):
                    pass
            p_size = _parse_font_size(p_spec.get('size'), default_size)
            p_bold = p_spec.get('bold') if p_spec.get('bold') is not None else default_bold
            p_italic = bool(p_spec.get('italic')) if p_spec.get('italic') is not None else False
            p_color = resolve_color(p_spec.get('color'), default_color) if p_spec.get('color') else default_color

            runs_spec = [item for item in safe_list(p_spec.get('runs')) if isinstance(item, dict)]
            if runs_spec:
                for r_spec in runs_spec:
                    run = para.add_run()
                    run.text = str(r_spec.get('text') or '')
                    run.font.name = safe_text(r_spec.get('font'), default_font)
                    _set_ea_font(run, safe_text(r_spec.get('font_ea') or r_spec.get('font.ea'), default_font_ea))
                    run.font.size = Pt(_parse_font_size(r_spec.get('size'), p_size))
                    run.font.bold = bool(r_spec['bold']) if r_spec.get('bold') is not None else bool(p_bold)
                    if r_spec.get('italic') is not None or p_italic:
                        run.font.italic = bool(r_spec['italic']) if r_spec.get('italic') is not None else p_italic
                    if r_spec.get('underline') is not None:
                        run.font.underline = bool(r_spec['underline'])
                    r_rgb = parse_rgb_color(resolve_color(r_spec.get('color'), p_color) if r_spec.get('color') else p_color)
                    if r_rgb is not None:
                        run.font.color.rgb = r_rgb
                    ops += 1
            else:
                run = para.add_run()
                run.text = str(p_spec.get('text') or '')
                run.font.name = default_font
                _set_ea_font(run, default_font_ea)
                run.font.size = Pt(p_size)
                run.font.bold = bool(p_bold)
                if p_italic:
                    run.font.italic = True
                p_rgb = parse_rgb_color(p_color)
                if p_rgb is not None:
                    run.font.color.rgb = p_rgb
                ops += 1
    else:
        lines = text.split('\n')
        for l_index, line in enumerate(lines):
            para = tf.paragraphs[0] if l_index == 0 else tf.add_paragraph()
            para.alignment = default_align
            run = para.add_run()
            run.text = line
            run.font.name = default_font
            _set_ea_font(run, default_font_ea)
            run.font.size = Pt(default_size)
            run.font.bold = bool(default_bold)
            rgb = parse_rgb_color(default_color)
            if rgb is not None:
                run.font.color.rgb = rgb
            ops += 1
    return ops


def _extract_shape_ref_name(raw_ref: str) -> str:
    text = safe_text(raw_ref)
    match = _NAME_REF_RE.search(text)
    return match.group(1) if match else text


def _add_connector_shape(parent_shapes, shape_spec: dict, bounds_in: dict, shape_id_map: dict[str, int]):
    conn_type_raw = safe_text(shape_spec.get('connector_shape') or shape_spec.get('connectorShape'), 'straight').lower()
    conn_type = _CONNECTOR_TYPE_MAP.get(conn_type_raw, MSO_CONNECTOR.STRAIGHT)
    left = Inches(bounds_in['left_in'])
    top = Inches(bounds_in['top_in'])
    width = Inches(bounds_in['width_in'])
    height = Inches(bounds_in['height_in'])
    connector = parent_shapes.add_connector(conn_type, left, top, left + width, top + height)
    connector.name = safe_text(shape_spec.get('shape_id'))

    line_color = ai_shape_line(shape_spec, text=ai_shape_text(shape_spec))
    line_rgb = parse_rgb_color(line_color) or RGBColor(0x25, 0x63, 0xEB)
    connector.line.color.rgb = line_rgb
    width_pt = ai_shape_line_width_pt(shape_spec)
    if width_pt > 0:
        connector.line.width = Pt(width_pt)

    sp_pr = connector._element.find(_qn(P_NS, 'spPr'))
    ln = sp_pr.find(_qn(A_NS, 'ln')) if sp_pr is not None else None
    if ln is None and sp_pr is not None:
        ln = etree.SubElement(sp_pr, _qn(A_NS, 'ln'))
    if ln is not None:
        line_dash = safe_text(shape_spec.get('lineDash') or shape_spec.get('line_dash'))
        if line_dash:
            for existing in list(ln.findall(_qn(A_NS, 'prstDash'))):
                ln.remove(existing)
            dash = etree.SubElement(ln, _qn(A_NS, 'prstDash'))
            dash.set('val', line_dash)
        head_end = ai_shape_line_end(shape_spec, end='head')
        tail_end = ai_shape_line_end(shape_spec, end='tail')
        if head_end != 'none':
            for existing in list(ln.findall(_qn(A_NS, 'headEnd'))):
                ln.remove(existing)
            el = etree.SubElement(ln, _qn(A_NS, 'headEnd'))
            el.set('type', head_end)
        if tail_end != 'none':
            for existing in list(ln.findall(_qn(A_NS, 'tailEnd'))):
                ln.remove(existing)
            el = etree.SubElement(ln, _qn(A_NS, 'tailEnd'))
            el.set('type', tail_end)

    from_name = _extract_shape_ref_name(shape_spec.get('from_shape_id') or shape_spec.get('from') or '')
    to_name = _extract_shape_ref_name(shape_spec.get('to_shape_id') or shape_spec.get('to') or '')
    nv_cxn = connector._element.find(_qn(P_NS, 'nvCxnSpPr'))
    c_nv_cxn = nv_cxn.find(_qn(P_NS, 'cNvCxnSpPr')) if nv_cxn is not None else None
    if c_nv_cxn is not None:
        if from_name and from_name in shape_id_map:
            st = etree.SubElement(c_nv_cxn, _qn(A_NS, 'stCxn'))
            st.set('id', str(shape_id_map[from_name]))
            st.set('idx', '0')
        if to_name and to_name in shape_id_map:
            end = etree.SubElement(c_nv_cxn, _qn(A_NS, 'endCxn'))
            end.set('id', str(shape_id_map[to_name]))
            end.set('idx', '0')
    return connector


def _normalize_crop_fraction(value) -> float:
    num = float(value or 0)
    return num / 100.0 if num > 1.0 else num


def _add_picture_shape(parent_shapes, shape_spec: dict, bounds_in: dict):
    source = picture_source(shape_spec)
    if not source:
        raise ValueError(f"native PPT picture requires src: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    image_bytes = decode_picture_bytes(source)
    pic = parent_shapes.add_picture(
        io.BytesIO(image_bytes),
        Inches(bounds_in['left_in']),
        Inches(bounds_in['top_in']),
        Inches(bounds_in['width_in']),
        Inches(bounds_in['height_in']),
    )
    pic.name = safe_text(shape_spec.get('shape_id'))
    alt = safe_text(shape_spec.get('alt'))
    if alt:
        c_nv_pr = pic._element.find(f'./{_qn(P_NS, "nvPicPr")}/{_qn(P_NS, "cNvPr")}')
        if c_nv_pr is not None:
            c_nv_pr.set('descr', alt)
    crop = picture_crop(shape_spec)
    if crop:
        pic.crop_left = _normalize_crop_fraction(crop.get('left', 0))
        pic.crop_top = _normalize_crop_fraction(crop.get('top', 0))
        pic.crop_right = _normalize_crop_fraction(crop.get('right', 0))
        pic.crop_bottom = _normalize_crop_fraction(crop.get('bottom', 0))
    if shape_spec.get('rotation') not in (None, ''):
        pic.rotation = float(shape_spec['rotation'])
    return pic


def _add_chart_shape(parent_shapes, shape_spec: dict, bounds_in: dict):
    intent = safe_text(shape_spec.get('materialization_intent'), 'native_data_object')
    if intent != 'native_data_object':
        raise ValueError('stable_drawingml chart must provide children and be materialized as a grouped drawing')
    categories = safe_list(shape_spec.get('categories'))
    series = safe_list(shape_spec.get('series'))
    if not categories or not series:
        raise ValueError(f"native PPT chart requires categories and series: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    chart_type_raw = safe_text(shape_spec.get('chart_type') or shape_spec.get('chartType'), 'column').lower()
    xl_type = _CHART_TYPE_MAP.get(chart_type_raw, XL_CHART_TYPE.COLUMN_CLUSTERED)

    chart_data = CategoryChartData()
    chart_data.categories = [str(cat) for cat in categories]
    series_colors = []
    for index, item in enumerate(series, 1):
        if not isinstance(item, dict) or not safe_list(item.get('values')):
            raise ValueError(f'native PPT chart series {index} requires values')
        values = safe_list(item.get('values'))
        if len(values) != len(categories):
            raise ValueError(
                f'native PPT chart series {index} value count must match categories: '
                f'{len(values)} != {len(categories)}'
            )
        chart_data.add_series(safe_text(item.get('name'), f'Series {index}'), tuple(values))
        series_colors.append(safe_text(item.get('color')))

    graphic_frame = parent_shapes.add_chart(
        xl_type,
        Inches(bounds_in['left_in']),
        Inches(bounds_in['top_in']),
        Inches(bounds_in['width_in']),
        Inches(bounds_in['height_in']),
        chart_data,
    )
    graphic_frame.name = safe_text(shape_spec.get('shape_id'))
    chart = graphic_frame.chart
    title = safe_text(shape_spec.get('title'))
    if title:
        chart.has_title = True
        chart.chart_title.text_frame.text = title
    if shape_spec.get('show_legend') is not None:
        chart.has_legend = bool(shape_spec['show_legend'])
    for ser, color_str in zip(chart.series, series_colors):
        rgb = parse_rgb_color(color_str)
        if rgb is not None:
            if xl_type == XL_CHART_TYPE.LINE:
                ser.format.line.color.rgb = rgb
            else:
                ser.format.fill.solid()
                ser.format.fill.fore_color.rgb = rgb
    return graphic_frame


def _add_table_shape(parent_shapes, shape_spec: dict, bounds_in: dict, kind: str) -> tuple[object, int]:
    intent = safe_text(shape_spec.get('materialization_intent'), 'native_data_object')
    if intent != 'native_data_object':
        raise ValueError(f'stable_drawingml {kind} must provide children and be materialized as a grouped drawing')
    data = safe_list(shape_spec.get('data'))
    if not data or not all(isinstance(row, list) and row for row in data):
        raise ValueError(f"native PPT {kind} requires rectangular data: {safe_text(shape_spec.get('shape_id'), '<missing>')}")
    col_count = len(data[0])
    if any(len(row) != col_count for row in data):
        raise ValueError(f'native PPT {kind} data rows must have equal length')

    graphic_frame = parent_shapes.add_table(
        len(data),
        col_count,
        Inches(bounds_in['left_in']),
        Inches(bounds_in['top_in']),
        Inches(bounds_in['width_in']),
        Inches(bounds_in['height_in']),
    )
    graphic_frame.name = safe_text(shape_spec.get('shape_id'))
    table = graphic_frame.table
    first_row = shape_spec.get('first_row', True) is not False
    table.first_row = first_row

    header_fill_rgb = parse_rgb_color(safe_text(shape_spec.get('header_fill')))
    body_font = safe_text(shape_spec.get('body_font'))
    body_size = _parse_font_size(shape_spec.get('body_font_size'), 0.0)
    body_color_rgb = parse_rgb_color(safe_text(shape_spec.get('body_color')))
    header_font = safe_text(shape_spec.get('header_font'), body_font)
    header_size = _parse_font_size(shape_spec.get('header_font_size'), body_size)
    header_color_rgb = parse_rgb_color(safe_text(shape_spec.get('header_color'))) or body_color_rgb
    header_bold = bool(shape_spec.get('header_bold', True)) if any(
        shape_spec.get(key) not in (None, '') for key in ('header_font', 'header_font_size', 'header_color')
    ) else False

    ops = 1
    for r_idx, row in enumerate(data):
        is_header = first_row and r_idx == 0
        for c_idx, cell_value in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            if is_header and header_fill_rgb is not None:
                cell.fill.solid()
                cell.fill.fore_color.rgb = header_fill_rgb
            tf = cell.text_frame
            tf.clear()
            para = tf.paragraphs[0]
            run = para.add_run()
            run.text = str(cell_value)
            font_name = header_font if is_header else body_font
            font_size = header_size if is_header else body_size
            font_rgb = header_color_rgb if is_header else body_color_rgb
            if font_name:
                run.font.name = font_name
            if font_size > 0:
                run.font.size = Pt(font_size)
            if is_header and header_bold:
                run.font.bold = True
            if font_rgb is not None:
                run.font.color.rgb = font_rgb
            ops += 1
    return graphic_frame, ops


def _add_preset_or_text_shape(parent_shapes, shape_spec: dict, bounds_in: dict, kind: str) -> tuple[object, int]:
    left = Inches(bounds_in['left_in'])
    top = Inches(bounds_in['top_in'])
    width = Inches(bounds_in['width_in'])
    height = Inches(bounds_in['height_in'])
    text = ai_shape_text(shape_spec)
    if kind == 'text_box':
        shape = parent_shapes.add_textbox(left, top, width, height)
    else:
        geom = safe_text(shape_spec.get('preset') or shape_spec.get('geometry'))
        if not geom:
            geom = {'rounded_rect': 'roundRect', 'oval': 'ellipse'}.get(kind, 'rect')
        mso_type = _PRESET_SHAPE_MAP.get(geom.lower(), MSO_SHAPE.RECTANGLE)
        shape = parent_shapes.add_shape(mso_type, left, top, width, height)
        if geom.lower() not in _PRESET_SHAPE_MAP and kind != 'path':
            sp_pr = shape._element.find(_qn(P_NS, 'spPr'))
            prst = sp_pr.find(_qn(A_NS, 'prstGeom')) if sp_pr is not None else None
            if prst is not None:
                prst.set('prst', geom)
    shape.name = safe_text(shape_spec.get('shape_id'))
    _apply_fill_and_line(shape, shape_spec, text=text)
    ops = 1 + _apply_text_frame(shape, shape_spec)
    if kind == 'path':
        apply_custom_geometry(shape, shape_spec)
        ops += 1
    return shape, ops


def _materialize_shapes_into(
    parent_shapes,
    shape_specs: list[dict],
    shape_id_map: dict[str, int],
    authored_pairs: list[tuple[object, dict]],
) -> int:
    ops = 0
    non_connectors: list[dict] = []
    connectors: list[dict] = []
    for spec in shape_specs:
        kind = canonical_object_kind(spec)
        if kind in {'line', 'connector'}:
            connectors.append(spec)
        else:
            non_connectors.append(spec)

    for spec in non_connectors:
        kind = canonical_object_kind(spec)
        stable_drawing = kind in {'chart', 'table', 'metric_grid'} and safe_text(
            spec.get('materialization_intent'), 'native_data_object'
        ) == 'stable_drawingml'
        if kind == 'group' or stable_drawing:
            children = _children_for_group(spec, kind)
            group = parent_shapes.add_group_shape()
            group.name = safe_text(spec.get('shape_id'))
            ops += 1 + _materialize_shapes_into(group.shapes, children, shape_id_map, authored_pairs)
            shape_id_map[group.name] = group.shape_id
            authored_pairs.append((group, spec))
            continue

        bounds_in = ai_shape_bounds_in(spec)
        if bounds_in is None:
            raise ValueError(f"native PPT object has invalid bounds: {safe_text(spec.get('shape_id'), '<missing>')}")
        if kind == 'picture':
            shape = _add_picture_shape(parent_shapes, spec, bounds_in)
            ops += 1
        elif kind == 'chart':
            shape = _add_chart_shape(parent_shapes, spec, bounds_in)
            ops += 1
        elif kind in {'table', 'metric_grid'}:
            shape, table_ops = _add_table_shape(parent_shapes, spec, bounds_in, kind)
            ops += table_ops
        else:
            shape, shape_ops = _add_preset_or_text_shape(parent_shapes, spec, bounds_in, kind)
            ops += shape_ops
        shape_id_map[shape.name] = shape.shape_id
        authored_pairs.append((shape, spec))

    for spec in connectors:
        bounds_in = ai_shape_bounds_in(spec)
        if bounds_in is None:
            raise ValueError(f"native PPT object has invalid bounds: {safe_text(spec.get('shape_id'), '<missing>')}")
        conn = _add_connector_shape(parent_shapes, spec, bounds_in, shape_id_map)
        shape_id_map[conn.name] = conn.shape_id
        authored_pairs.append((conn, spec))
        ops += 1
    return ops


def _attach_hlink_click(parent_elem, slide, prs: Presentation, target: str) -> None:
    for existing in list(parent_elem.findall(_qn(A_NS, 'hlinkClick'))):
        parent_elem.remove(existing)
    jump = re.fullmatch(r'slide\[([1-9][0-9]*)\]', target)
    hlink = etree.SubElement(parent_elem, _qn(A_NS, 'hlinkClick'))
    if jump:
        target_slide = prs.slides[int(jump.group(1)) - 1]
        r_id = slide.part.relate_to(target_slide.part, RT.SLIDE)
        hlink.set(_qn(R_NS, 'id'), r_id)
        hlink.set('action', 'ppaction://hlinksldjump')
    else:
        r_id = slide.part.relate_to(target, RT.HYPERLINK, is_external=True)
        hlink.set(_qn(R_NS, 'id'), r_id)


def _apply_shape_hyperlinks(shape, shape_spec: dict, slide, prs: Presentation, slide_part_indices: dict[str, int]) -> int:
    links = planned_hyperlinks(shape_spec)
    if not links['object'] and not links['runs']:
        return 0
    ops = 0
    if links['object']:
        for nv_tag in ('nvSpPr', 'nvPicPr', 'nvCxnSpPr', 'nvGraphicFramePr', 'nvGrpSpPr'):
            nv = shape._element.find(_qn(P_NS, nv_tag))
            if nv is not None:
                c_nv_pr = nv.find(_qn(P_NS, 'cNvPr'))
                if c_nv_pr is not None:
                    _attach_hlink_click(c_nv_pr, slide, prs, links['object'])
                    ops += 1
                break
    if links['runs'] and getattr(shape, 'has_text_frame', False):
        paragraphs_spec = [item for item in safe_list(shape_spec.get('paragraphs')) if isinstance(item, dict)]
        for p_index, p_spec in enumerate(paragraphs_spec):
            if p_index >= len(shape.text_frame.paragraphs):
                break
            para = shape.text_frame.paragraphs[p_index]
            runs_spec = [item for item in safe_list(p_spec.get('runs')) if isinstance(item, dict)]
            for r_index, r_spec in enumerate(runs_spec):
                target = safe_text(r_spec.get('link'))
                if not target or r_index >= len(para.runs):
                    continue
                r_pr = para.runs[r_index]._r.get_or_add_rPr()
                _attach_hlink_click(r_pr, slide, prs, target)
                ops += 1
    actual = readback_hyperlinks(shape, slide_part=slide.part, slide_part_indices=slide_part_indices)
    assert_hyperlink_readback(links, actual)
    return ops


def _insert_slide_child(slide_elem, new_elem, *, before_tags: tuple[str, ...]) -> None:
    for idx, child in enumerate(slide_elem):
        if child.tag.rsplit('}', 1)[-1] in before_tags:
            slide_elem.insert(idx, new_elem)
            return
    slide_elem.append(new_elem)


def _apply_transition(slide, slide_data: dict) -> bool:
    transition = slide_data.get('transition')
    if not transition:
        return False
    if isinstance(transition, str):
        trans_type = safe_text(transition)
        direction = ''
        speed = ''
        duration_ms = None
        advance_time_ms = None
        advance_click = None
    elif isinstance(transition, dict):
        trans_type = safe_text(transition.get('type') or transition.get('transition'))
        if not trans_type:
            raise ValueError('native PPT transition requires type')
        direction = safe_text(transition.get('direction')).lower()
        speed = safe_text(transition.get('speed')).lower()
        duration_ms = transition.get('duration_ms')
        advance_time_ms = transition.get('advance_time_ms')
        advance_click = transition.get('advance_click')
    else:
        return False

    slide_elem = slide._element
    for existing in list(slide_elem.findall(_qn(P_NS, 'transition'))):
        slide_elem.remove(existing)
    trans_el = etree.Element(_qn(P_NS, 'transition'), nsmap={'p14': P14_NS})
    if speed in {'slow', 'med', 'fast'}:
        trans_el.set('spd', speed)
    if duration_ms not in (None, ''):
        trans_el.set(_qn(P14_NS, 'dur'), str(int(duration_ms)))
    if advance_time_ms not in (None, ''):
        trans_el.set('advTm', str(int(advance_time_ms)))
    if advance_click is not None:
        trans_el.set('advClick', '1' if bool(advance_click) else '0')
    effect_el = etree.SubElement(trans_el, _qn(P_NS, trans_type))
    if direction:
        effect_el.set('dir', _DIR_MAP.get(direction, direction))
    _insert_slide_child(slide_elem, trans_el, before_tags=('timing', 'extLst'))
    return True


def _apply_animations(slide, slide_data: dict, shape_id_map: dict[str, int]) -> int:
    animations = [item for item in safe_list(slide_data.get('animation_timeline')) if isinstance(item, dict)]
    if not animations:
        return 0
    slide_elem = slide._element
    for existing in list(slide_elem.findall(_qn(P_NS, 'timing'))):
        slide_elem.remove(existing)
    timing = etree.Element(_qn(P_NS, 'timing'))
    tn_lst = etree.SubElement(timing, _qn(P_NS, 'tnLst'))
    root_par = etree.SubElement(tn_lst, _qn(P_NS, 'par'))
    root_ctn = etree.SubElement(root_par, _qn(P_NS, 'cTn'), {'id': '1', 'dur': 'indefinite', 'restart': 'never', 'nodeType': 'tmRoot'})
    root_children = etree.SubElement(root_ctn, _qn(P_NS, 'childTnLst'))
    seq = etree.SubElement(root_children, _qn(P_NS, 'seq'), {'concurrent': '1', 'nextAc': 'seek'})
    seq_ctn = etree.SubElement(seq, _qn(P_NS, 'cTn'), {'id': '2', 'dur': 'indefinite', 'nodeType': 'mainSeq'})
    seq_children = etree.SubElement(seq_ctn, _qn(P_NS, 'childTnLst'))

    next_id = 3
    for anim in animations:
        target_name = safe_text(anim.get('target_shape_id') or anim.get('target_id'))
        spid = shape_id_map.get(target_name)
        if spid is None:
            raise ValueError(f'native PPT animation target not found: {target_name or "<missing>"}')
        effect = safe_text(anim.get('effect'), 'fade').lower()
        preset_id = _EFFECT_TO_PRESET_ID.get(effect, 10)
        preset_class = _CLASS_TO_OOXML.get(safe_text(anim.get('class'), 'entrance').lower(), 'entr')
        node_type = _TRIGGER_TO_NODE_TYPE.get(safe_text(anim.get('trigger'), 'onClick').lower(), 'clickEffect')
        duration_ms = int(anim['duration_ms']) if anim.get('duration_ms') not in (None, '') else 500
        delay_ms = int(anim['delay_ms']) if anim.get('delay_ms') not in (None, '') else 0

        outer_par = etree.SubElement(seq_children, _qn(P_NS, 'par'))
        outer_ctn = etree.SubElement(outer_par, _qn(P_NS, 'cTn'), {'id': str(next_id), 'fill': 'hold'})
        next_id += 1
        outer_st = etree.SubElement(outer_ctn, _qn(P_NS, 'stCondLst'))
        etree.SubElement(outer_st, _qn(P_NS, 'cond'), {'delay': 'indefinite'})
        outer_children = etree.SubElement(outer_ctn, _qn(P_NS, 'childTnLst'))

        group_par = etree.SubElement(outer_children, _qn(P_NS, 'par'))
        group_ctn = etree.SubElement(group_par, _qn(P_NS, 'cTn'), {'id': str(next_id), 'fill': 'hold'})
        next_id += 1
        group_st = etree.SubElement(group_ctn, _qn(P_NS, 'stCondLst'))
        etree.SubElement(group_st, _qn(P_NS, 'cond'), {'delay': '0'})
        group_children = etree.SubElement(group_ctn, _qn(P_NS, 'childTnLst'))

        effect_par = etree.SubElement(group_children, _qn(P_NS, 'par'))
        effect_ctn = etree.SubElement(effect_par, _qn(P_NS, 'cTn'), {
            'id': str(next_id),
            'presetID': str(preset_id),
            'presetClass': preset_class,
            'presetSubtype': '0',
            'fill': 'hold',
            'dur': str(duration_ms),
            'nodeType': node_type,
        })
        next_id += 1
        effect_st = etree.SubElement(effect_ctn, _qn(P_NS, 'stCondLst'))
        etree.SubElement(effect_st, _qn(P_NS, 'cond'), {'delay': str(delay_ms)})
        effect_children = etree.SubElement(effect_ctn, _qn(P_NS, 'childTnLst'))
        anim_effect = etree.SubElement(effect_children, _qn(P_NS, 'animEffect'), {'transition': 'in', 'filter': 'fade'})
        c_bhvr = etree.SubElement(anim_effect, _qn(P_NS, 'cBhvr'))
        etree.SubElement(c_bhvr, _qn(P_NS, 'cTn'), {'id': str(next_id), 'dur': str(duration_ms)})
        next_id += 1
        tgt_el = etree.SubElement(c_bhvr, _qn(P_NS, 'tgtEl'))
        etree.SubElement(tgt_el, _qn(P_NS, 'spTgt'), {'spid': str(spid)})

    _insert_slide_child(slide_elem, timing, before_tags=('extLst',))
    return len(animations)


def _enable_show_timings(prs: Presentation) -> None:
    pres_elem = prs.element
    show_pr = pres_elem.find(_qn(P_NS, 'showPr'))
    if show_pr is None:
        show_pr = etree.SubElement(pres_elem, _qn(P_NS, 'showPr'))
    show_pr.set('useTimings', '1')


def _reuse_template_theme_for_notes_master(prs: Presentation, original_themes: set[str]) -> None:
    if not original_themes or not prs.slide_masters:
        return
    master_theme = next(
        (rel.target_part for rel in prs.slide_masters[0].part.rels.values() if rel.reltype == RT.THEME),
        None,
    )
    if master_theme is None:
        return
    for rel in list(prs.part.rels.values()):
        if rel.reltype != RT.NOTES_MASTER:
            continue
        notes_master_part = getattr(rel, 'target_part', None)
        if notes_master_part is None:
            continue
        theme_rel = next(
            (r for r in notes_master_part.rels.values() if r.reltype == RT.THEME),
            None,
        )
        if theme_rel is not None and str(theme_rel.target_part.partname) not in original_themes:
            notes_master_part.drop_rel(theme_rel.rId)
            notes_master_part.relate_to(master_theme, RT.THEME)


def materialize_native_pptx(
    slides,
    output_pptx: Path,
    template_intake: dict | None = None,
    *,
    allow_quality_debt: bool = False,
) -> dict:
    _assert_animation_targets(slides)
    validate_hyperlinks(slides)

    output_pptx = Path(output_pptx).resolve()
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    mode = _template_mode(template_intake)
    template_before = None
    template_source_path: Path | None = None
    fill_existing_indices: list[int] = []

    if mode == 'none':
        prs = Presentation()
        prs.slide_width = Inches(SLIDE_WIDTH_IN)
        prs.slide_height = Inches(SLIDE_HEIGHT_IN)
    else:
        source_pptx = safe_text((template_intake or {}).get('source_pptx'))
        if not source_pptx:
            raise ValueError('native PPT template intake requires source_pptx')
        template_source_path = Path(source_pptx).resolve()
        if template_source_path == output_pptx:
            raise ValueError('native PPT template source_pptx and output_pptx must be different files')
        source_readback = read_pptx_package(template_source_path)
        if mode == 'fill_existing':
            fill_existing_indices = _fill_existing_slide_indices(
                slides,
                int(source_readback.get('slide_count') or 0),
            )
        template_before = copy_template_source(template_source_path, output_pptx)
        prs = Presentation(str(output_pptx))
        original_themes = {
            str(part.partname)
            for part in prs.part.package.iter_parts()
            if str(part.partname).startswith('/ppt/theme/')
        }
        if mode == 'replace_slides':
            _remove_all_slides(prs)
    if mode == 'none':
        original_themes = set()

    slide_indices: list[int] = []
    authored_slides: list[tuple[object, dict, dict[str, int], list[tuple[object, dict]]]] = []
    text_probe: list[str] = []
    op_count = 0

    for index, slide_data in enumerate(slides, 1):
        if mode == 'fill_existing':
            slide_index = fill_existing_indices[index - 1]
            slide = prs.slides[slide_index - 1]
            background = safe_text(slide_data.get('background'))
            if background:
                _set_slide_background(slide, background)
                op_count += 1
        else:
            slide_index = index
            binding = slide_data.get('template_layout_binding') if isinstance(slide_data.get('template_layout_binding'), dict) else {}
            layout_name = safe_text(binding.get('layout_name') or binding.get('source_layout_name'), 'blank')
            slide = prs.slides.add_slide(_select_slide_layout(prs, layout_name))
            _set_slide_background(slide, slide_data.get('background'))
            op_count += 2
        slide_indices.append(slide_index)

        shape_id_map: dict[str, int] = {
            sh.name: sh.shape_id for sh in slide.shapes if sh.name
        }
        authored_pairs: list[tuple[object, dict]] = []
        op_count += _materialize_shapes_into(
            slide.shapes,
            native_ai_design_shapes(slide_data),
            shape_id_map,
            authored_pairs,
        )
        authored_slides.append((slide, slide_data, shape_id_map, authored_pairs))
        text_probe.extend(
            safe_text(record.get('text'))
            for record in (native_shape_manifest_record(shape) for shape in native_ai_design_shapes(slide_data))
            if safe_text(record.get('text'))
        )

    slide_part_indices = {str(s.part.partname): i for i, s in enumerate(prs.slides, 1)}
    timing_used = False
    for slide, slide_data, shape_id_map, authored_pairs in authored_slides:
        for shape, spec in authored_pairs:
            op_count += _apply_shape_hyperlinks(shape, spec, slide, prs, slide_part_indices)
        notes = _speaker_notes(slide_data)
        if notes:
            slide.notes_slide.notes_text_frame.text = notes
            op_count += 1
        if _apply_transition(slide, slide_data):
            op_count += 1
            timing_used = True
        anim_count = _apply_animations(slide, slide_data, shape_id_map)
        if anim_count > 0:
            op_count += anim_count
            timing_used = True

    if timing_used:
        _enable_show_timings(prs)
        op_count += 1

    _reuse_template_theme_for_notes_master(prs, original_themes)
    save_presentation(prs, output_pptx, template_source=template_source_path)

    validate_payload, issues_payload, text_payload = validate_pptx_package(output_pptx)
    issues_count = issue_count(issues_payload)
    if issues_count > 0 and not allow_quality_debt:
        raise RuntimeError(
            'native PPTX materializer quality gate failed: '
            + json.dumps({
                'issues_count': issues_count,
                'validate': validate_payload,
                'view_issues': issues_payload,
            }, ensure_ascii=False, sort_keys=True)
        )

    package_readback = read_pptx_package(output_pptx)
    expected_canvas = (template_before or {}).get('canvas_in') or {
        'width': SLIDE_WIDTH_IN,
        'height': SLIDE_HEIGHT_IN,
    }
    geometry_audit = pptx_geometry_audit(
        output_pptx,
        expected_width_in=float(expected_canvas.get('width') or SLIDE_WIDTH_IN),
        expected_height_in=float(expected_canvas.get('height') or SLIDE_HEIGHT_IN),
    )
    if not geometry_audit['ok'] and not allow_quality_debt:
        raise RuntimeError(
            'native PPTX geometry audit failed: '
            + json.dumps(geometry_audit, ensure_ascii=False, sort_keys=True)
        )

    return {
        'materializer': 'python_pptx_materializer',
        'command_count': op_count,
        'save_before_close': True,
        'validate': validate_payload,
        'view_issues': issues_payload,
        'view_text': text_payload,
        'expected_text_fragments': text_probe,
        'geometry_audit': geometry_audit,
        'package_readback': package_readback,
        'template_preservation': template_preservation(template_before, package_readback, mode),
        'plan_slide_indices': slide_indices,
        'quality_debt': {
            'reason': 'native_materialized_visual_quality',
            'issues': (issues_payload.get('data') or {}).get('issues') or [],
            'geometry_audit': geometry_audit,
            'blocks_stage_transition': False,
            'blocks_visual_ready_claim': True,
            'blocks_export_ready_claim': True,
        } if issues_count > 0 or not geometry_audit['ok'] else None,
    }
