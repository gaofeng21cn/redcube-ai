"""Structured PPTX package readback backed directly by python-pptx."""
from __future__ import annotations

import hashlib
import zipfile
from collections import Counter
from pathlib import Path

from pptx import Presentation

from .native_hyperlinks import readback_hyperlinks

P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
C_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
P14_NS = 'http://schemas.microsoft.com/office/powerpoint/2010/main'

_PRESET_ID_TO_EFFECT = {
    1: 'appear',
    2: 'fly',
    3: 'blinds',
    4: 'box',
    5: 'checkerboard',
    6: 'circle',
    9: 'dissolve',
    10: 'fade',
    12: 'peek',
    14: 'randomBars',
    16: 'split',
    17: 'strips',
    21: 'wheel',
    22: 'wipe',
    23: 'zoom',
    26: 'bounce',
    53: 'float',
}

_PRESET_CLASS_MAP = {
    'entr': 'entrance',
    'exit': 'exit',
    'emph': 'emphasis',
    'path': 'motion',
    'mediacall': 'media',
}

_NODE_TYPE_TO_TRIGGER = {
    'clickEffect': 'onClick',
    'withEffect': 'withPrevious',
    'afterEffect': 'afterPrevious',
}

_CHART_TAG_TO_TYPE = {
    'barChart': 'column',
    'bar3DChart': 'column',
    'lineChart': 'line',
    'line3DChart': 'line',
    'pieChart': 'pie',
    'pie3DChart': 'pie',
    'doughnutChart': 'doughnut',
    'areaChart': 'area',
    'area3DChart': 'area',
    'scatterChart': 'scatter',
    'bubbleChart': 'bubble',
    'radarChart': 'radar',
}

_PATH_SEG_TAGS = {'moveTo', 'lnTo', 'cubicBezTo', 'quadBezTo', 'arcTo', 'close'}


def _qn(namespace: str, name: str) -> str:
    return f'{{{namespace}}}{name}'


def _local(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


def _sha256_file(file: Path) -> str:
    with file.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _number(value: object) -> int | float | str:
    try:
        num = float(str(value))
    except (TypeError, ValueError):
        return str(value or '')
    return int(num) if num.is_integer() else num


def _hex_color_from_container(elem) -> str:
    if elem is None:
        return ''
    srgb = elem.find(_qn(A_NS, 'srgbClr'))
    if srgb is not None and srgb.get('val'):
        return f"#{srgb.get('val').upper()}"
    return ''


def _fill_hex(sp_pr) -> str:
    if sp_pr is None:
        return ''
    solid = sp_pr.find(_qn(A_NS, 'solidFill'))
    return _hex_color_from_container(solid)


def _c_nv_pr(element):
    for nv_tag in ('nvSpPr', 'nvPicPr', 'nvCxnSpPr', 'nvGraphicFramePr', 'nvGrpSpPr'):
        nv = element.find(_qn(P_NS, nv_tag))
        if nv is not None:
            return nv.find(_qn(P_NS, 'cNvPr'))
    return None


def _nv_pr(element):
    for nv_tag in ('nvSpPr', 'nvPicPr', 'nvCxnSpPr', 'nvGraphicFramePr', 'nvGrpSpPr'):
        nv = element.find(_qn(P_NS, nv_tag))
        if nv is not None:
            return nv.find(_qn(P_NS, 'nvPr'))
    return None


def _shape_name_and_id(element) -> tuple[str, str]:
    c_nv_pr = _c_nv_pr(element)
    if c_nv_pr is None:
        return '', ''
    return str(c_nv_pr.get('name') or ''), str(c_nv_pr.get('id') or '')


def _shape_bounds_emu(element) -> dict[str, int]:
    xfrm = None
    for parent_tag in ('spPr', 'grpSpPr'):
        parent = element.find(_qn(P_NS, parent_tag))
        if parent is not None:
            xfrm = parent.find(_qn(A_NS, 'xfrm'))
            if xfrm is not None:
                break
    if xfrm is None:
        xfrm = element.find(_qn(P_NS, 'xfrm'))
    if xfrm is None:
        return {'left': 0, 'top': 0, 'width': 0, 'height': 0}
    off = xfrm.find(_qn(A_NS, 'off'))
    ext = xfrm.find(_qn(A_NS, 'ext'))
    return {
        'left': int(off.get('x') or 0) if off is not None else 0,
        'top': int(off.get('y') or 0) if off is not None else 0,
        'width': int(ext.get('cx') or 0) if ext is not None else 0,
        'height': int(ext.get('cy') or 0) if ext is not None else 0,
    }


def _shape_kind(element) -> str:
    tag = _local(element.tag)
    if tag == 'cxnSp':
        return 'connector'
    if tag == 'pic':
        return 'picture'
    if tag == 'grpSp':
        return 'group'
    if tag == 'graphicFrame':
        if element.find(f'.//{_qn(C_NS, "chart")}') is not None:
            return 'chart'
        if element.find(f'.//{_qn(A_NS, "tbl")}') is not None:
            return 'table'
        return 'unknown'
    if tag == 'sp':
        nv_sp = element.find(_qn(P_NS, 'nvSpPr'))
        c_nv_sp = nv_sp.find(_qn(P_NS, 'cNvSpPr')) if nv_sp is not None else None
        if c_nv_sp is not None and c_nv_sp.get('txBox') in {'1', 'true'}:
            return 'text_box'
        sp_pr = element.find(_qn(P_NS, 'spPr'))
        if sp_pr is not None:
            if sp_pr.find(_qn(A_NS, 'custGeom')) is not None:
                return 'path'
            prst = sp_pr.find(_qn(A_NS, 'prstGeom'))
            if prst is not None:
                geom = prst.get('prst') or ''
                return {
                    'rect': 'rect',
                    'roundRect': 'rounded_rect',
                    'ellipse': 'oval',
                }.get(geom, 'shape')
        nv_pr = _nv_pr(element)
        if nv_pr is not None and nv_pr.find(_qn(P_NS, 'ph')) is not None:
            return 'text_box'
        return 'shape'
    return 'unknown'


def _text_metrics_from_txbody(tx_body) -> tuple[str, int, int, int]:
    if tx_body is None:
        return '', 0, 0, 0
    paragraphs = tx_body.findall(_qn(A_NS, 'p'))
    para_texts = []
    run_count = 0
    bullet_count = 0
    for para in paragraphs:
        p_pr = para.find(_qn(A_NS, 'pPr'))
        if p_pr is not None and (
            p_pr.find(_qn(A_NS, 'buChar')) is not None
            or p_pr.find(_qn(A_NS, 'buAutoNum')) is not None
        ):
            bullet_count += 1
        parts = []
        for child in para:
            local = _local(child.tag)
            if local in {'r', 'fld'}:
                run_count += 1
                t_elem = child.find(_qn(A_NS, 't'))
                if t_elem is not None and t_elem.text:
                    parts.append(t_elem.text)
            elif local == 'br':
                parts.append('\n')
        para_texts.append(''.join(parts))
    return '\n'.join(para_texts), len(paragraphs), run_count, bullet_count


def _extract_chart_info(element, slide_part) -> dict:
    chart_ref = element.find(f'.//{_qn(C_NS, "chart")}')
    rel_id = chart_ref.get(_qn(R_NS, 'id')) if chart_ref is not None else ''
    rel = slide_part.rels.get(rel_id) if (rel_id and slide_part is not None) else None
    chart_part = getattr(rel, 'target_part', None) if rel is not None else None
    if chart_part is None:
        return {
            'relationship_resolved': False,
            'content_type': '',
            'chart_type': '',
            'series_count': 0,
            'series': [],
            'categories': [],
            'category_count': 0,
            'categories_raw': '',
            'categories_readback': 'unavailable',
        }
    chart_root = getattr(chart_part, '_element', None)
    if chart_root is None:
        from lxml import etree
        chart_root = etree.fromstring(chart_part.blob)

    plot_area = chart_root.find(f'.//{_qn(C_NS, "plotArea")}')
    chart_type = ''
    if plot_area is not None:
        for child in plot_area:
            local = _local(child.tag)
            if local in _CHART_TAG_TO_TYPE:
                if local in {'barChart', 'bar3DChart'}:
                    bar_dir = child.find(_qn(C_NS, 'barDir'))
                    chart_type = 'bar' if (bar_dir is not None and bar_dir.get('val') == 'bar') else 'column'
                else:
                    chart_type = _CHART_TAG_TO_TYPE[local]
                break

    categories: list[str] = []
    series_list = []
    for ser in chart_root.findall(f'.//{_qn(C_NS, "ser")}'):
        # Series name
        tx = ser.find(_qn(C_NS, 'tx'))
        name = ''
        if tx is not None:
            v_nodes = tx.findall(f'.//{_qn(C_NS, "v")}')
            if v_nodes and v_nodes[0].text:
                name = v_nodes[0].text
        # Categories (capture from first series that has them)
        if not categories:
            cat = ser.find(_qn(C_NS, 'cat'))
            if cat is not None:
                pts = sorted(
                    cat.findall(f'.//{_qn(C_NS, "pt")}'),
                    key=lambda pt: int(pt.get('idx') or 0),
                )
                for pt in pts:
                    v = pt.find(_qn(C_NS, 'v'))
                    categories.append(v.text if (v is not None and v.text is not None) else '')
        # Values
        val = ser.find(_qn(C_NS, 'val'))
        values = []
        if val is not None:
            pts = sorted(
                val.findall(f'.//{_qn(C_NS, "pt")}'),
                key=lambda pt: int(pt.get('idx') or 0),
            )
            for pt in pts:
                v = pt.find(_qn(C_NS, 'v'))
                if v is not None and v.text is not None:
                    values.append(_number(v.text))
        series_list.append({'name': name, 'values': values})

    return {
        'relationship_resolved': True,
        'content_type': str(getattr(chart_part, 'content_type', '') or ''),
        'chart_type': chart_type,
        'series_count': len(series_list),
        'series': series_list,
        'categories': categories,
        'category_count': len(categories),
        'categories_raw': ','.join(categories),
        'categories_readback': 'exact' if categories else 'unavailable',
    }


def _extract_table_info(element) -> dict:
    tbl = element.find(f'.//{_qn(A_NS, "tbl")}')
    if tbl is None:
        return {'row_count': 0, 'column_count': 0, 'cell_count': 0, 'data': [], 'cells': []}
    rows = tbl.findall(_qn(A_NS, 'tr'))
    cells = []
    data = []
    max_cols = 0
    for row_index, tr in enumerate(rows, 1):
        row_texts = []
        tcs = tr.findall(_qn(A_NS, 'tc'))
        max_cols = max(max_cols, len(tcs))
        for col_index, tc in enumerate(tcs, 1):
            tx_body = tc.find(_qn(A_NS, 'txBody'))
            cell_text, _, _, _ = _text_metrics_from_txbody(tx_body)
            row_texts.append(cell_text)
            tc_pr = tc.find(_qn(A_NS, 'tcPr'))
            fill_hex = _fill_hex(tc_pr)
            font_name = ''
            font_size_pt: int | float = 0
            bold = False
            color_hex = ''
            if tx_body is not None:
                first_r_pr = tx_body.find(f'.//{_qn(A_NS, "rPr")}')
                if first_r_pr is None:
                    first_r_pr = tx_body.find(f'.//{_qn(A_NS, "defRPr")}')
                if first_r_pr is not None:
                    latin = first_r_pr.find(_qn(A_NS, 'latin'))
                    if latin is not None and latin.get('typeface'):
                        font_name = str(latin.get('typeface'))
                    sz = first_r_pr.get('sz')
                    if sz:
                        font_size_pt = _number(int(sz) / 100.0)
                    bold = first_r_pr.get('b') in {'1', 'true'}
                    color_hex = _fill_hex(first_r_pr)
            cells.append({
                'row': row_index,
                'column': col_index,
                'text': cell_text,
                'font': font_name,
                'font_size_pt': font_size_pt,
                'bold': bold,
                'color': color_hex,
                'fill': fill_hex,
            })
        data.append(row_texts)
    return {
        'row_count': len(rows),
        'column_count': max_cols,
        'cell_count': len(cells),
        'data': data,
        'cells': cells,
    }


def _extract_picture_info(element, slide_part) -> dict:
    c_nv_pr = _c_nv_pr(element)
    alt = str(c_nv_pr.get('descr') or '') if c_nv_pr is not None else ''
    blip_fill = element.find(_qn(P_NS, 'blipFill'))
    blip = blip_fill.find(_qn(A_NS, 'blip')) if blip_fill is not None else None
    rel_id = blip.get(_qn(R_NS, 'embed')) if blip is not None else ''
    rel = slide_part.rels.get(rel_id) if (rel_id and slide_part is not None) else None
    image_part = getattr(rel, 'target_part', None) if rel is not None else None

    crop = {'left': 0, 'top': 0, 'right': 0, 'bottom': 0}
    src_rect = blip_fill.find(_qn(A_NS, 'srcRect')) if blip_fill is not None else None
    if src_rect is not None:
        for attr, key in (('l', 'left'), ('t', 'top'), ('r', 'right'), ('b', 'bottom')):
            raw = src_rect.get(attr)
            if raw not in (None, ''):
                crop[key] = _number(round(int(raw) / 100000.0, 6))

    if image_part is not None:
        blob = image_part.blob
        content_type = str(getattr(image_part, 'content_type', '') or '')
        size = len(blob)
        sha = _sha256_bytes(blob)
        resolved = bool(content_type)
    else:
        content_type = ''
        size = 0
        sha = ''
        resolved = False

    return {
        'alt': alt,
        'alt_text': alt,
        'has_alt': bool(alt.strip()),
        'crop': crop,
        'relationship_resolved': resolved,
        'content_type': content_type,
        'embedded_size_bytes': size,
        'embedded_sha256': sha,
    }


def _read_shape_element(
    element,
    slide_part,
    id_to_name: dict[str, str],
    slide_part_indices: dict[str, int],
) -> dict | None:
    kind = _shape_kind(element)
    if kind == 'unknown':
        return None
    name, object_id = _shape_name_and_id(element)
    tx_body = element.find(_qn(P_NS, 'txBody'))
    text, para_count, run_count, bullet_count = _text_metrics_from_txbody(tx_body)
    sp_pr = element.find(_qn(P_NS, 'spPr'))
    nv_pr = _nv_pr(element)
    is_placeholder = nv_pr is not None and nv_pr.find(_qn(P_NS, 'ph')) is not None

    record: dict = {
        'name': name,
        'object_id': object_id,
        'kind': kind,
        'text': text,
        'paragraph_count': para_count,
        'run_count': run_count,
        'bullet_count': bullet_count,
        'fill': _fill_hex(sp_pr),
        'bounds_emu': _shape_bounds_emu(element),
        'placeholder': is_placeholder,
        'hyperlinks': readback_hyperlinks(
            element,
            slide_part=slide_part,
            slide_part_indices=slide_part_indices,
        ),
    }

    if kind == 'connector':
        nv_cxn = element.find(_qn(P_NS, 'nvCxnSpPr'))
        c_nv_cxn = nv_cxn.find(_qn(P_NS, 'cNvCxnSpPr')) if nv_cxn is not None else None
        st_cxn = c_nv_cxn.find(_qn(A_NS, 'stCxn')) if c_nv_cxn is not None else None
        end_cxn = c_nv_cxn.find(_qn(A_NS, 'endCxn')) if c_nv_cxn is not None else None
        start_id = str(st_cxn.get('id') or '') if st_cxn is not None else ''
        end_id = str(end_cxn.get('id') or '') if end_cxn is not None else ''
        ln = sp_pr.find(_qn(A_NS, 'ln')) if sp_pr is not None else None
        head_el = ln.find(_qn(A_NS, 'headEnd')) if ln is not None else None
        tail_el = ln.find(_qn(A_NS, 'tailEnd')) if ln is not None else None
        record.update({
            'from_object_id': start_id,
            'to_object_id': end_id,
            'from_shape_name': id_to_name.get(start_id, ''),
            'to_shape_name': id_to_name.get(end_id, ''),
            'head_end': str(head_el.get('type') or 'none') if head_el is not None else 'none',
            'tail_end': str(tail_el.get('type') or 'none') if tail_el is not None else 'none',
        })
    elif kind == 'picture':
        record.update(_extract_picture_info(element, slide_part))
    elif kind == 'chart':
        record.update(_extract_chart_info(element, slide_part))
    elif kind == 'table':
        record.update(_extract_table_info(element))
    elif kind == 'group':
        child_elements = [
            child for child in element
            if _local(child.tag) in {'sp', 'cxnSp', 'pic', 'graphicFrame', 'grpSp'}
        ]
        child_id_map = dict(id_to_name)
        for child_el in child_elements:
            c_name, c_id = _shape_name_and_id(child_el)
            if c_id:
                child_id_map[c_id] = c_name
        children = []
        for child_el in child_elements:
            child_rec = _read_shape_element(child_el, slide_part, child_id_map, slide_part_indices)
            if child_rec is not None:
                children.append(child_rec)
        record['children'] = children
        record['child_object_count'] = len(children)
    elif kind == 'path':
        record['geometry'] = 'custom'
        cust_geom = sp_pr.find(_qn(A_NS, 'custGeom')) if sp_pr is not None else None
        seg_count = 0
        if cust_geom is not None:
            for path_el in cust_geom.findall(f'.//{_qn(A_NS, "path")}'):
                seg_count += sum(1 for seg in path_el if _local(seg.tag) in _PATH_SEG_TAGS)
        record['path_segment_count'] = seg_count

    return record


def _read_transition(slide_elem) -> dict:
    trans = slide_elem.find(_qn(P_NS, 'transition'))
    if trans is None:
        # Check mc:AlternateContent wrapper if present
        for candidate in slide_elem.iter():
            if _local(candidate.tag) == 'transition':
                trans = candidate
                break
    if trans is None:
        return {}
    trans_type = ''
    direction = ''
    for child in trans:
        trans_type = _local(child.tag)
        direction = str(child.get('dir') or '')
        break
    dur_raw = trans.get(_qn(P14_NS, 'dur')) or trans.get('dur') or ''
    duration_ms = int(dur_raw) if str(dur_raw).isdigit() else 0
    speed = str(trans.get('spd') or '')
    adv_tm = str(trans.get('advTm') or '')
    adv_click_attr = trans.get('advClick')
    advance_click = adv_click_attr not in {'0', 'false'}
    return {
        'type': trans_type,
        'direction': direction,
        'duration_ms': duration_ms,
        'speed': speed,
        'advance_time_ms': adv_tm,
        'advance_click': advance_click,
    }


def _read_animations(slide_elem, id_to_name: dict[str, str]) -> list[dict]:
    timing = slide_elem.find(_qn(P_NS, 'timing'))
    if timing is None:
        return []
    animations = []
    for c_tn in timing.findall(f'.//{_qn(P_NS, "cTn")}'):
        preset_id_raw = c_tn.get('presetID')
        if preset_id_raw is None:
            continue
        parent = c_tn.getparent()
        if parent is None:
            continue
        sp_tgt = parent.find(f'.//{_qn(P_NS, "spTgt")}')
        if sp_tgt is None:
            continue
        target_id = str(sp_tgt.get('spid') or '')
        preset_id = int(preset_id_raw) if str(preset_id_raw).isdigit() else 0
        preset_class = _PRESET_CLASS_MAP.get(str(c_tn.get('presetClass') or ''), str(c_tn.get('presetClass') or ''))
        trigger = _NODE_TYPE_TO_TRIGGER.get(str(c_tn.get('nodeType') or ''), str(c_tn.get('nodeType') or ''))
        dur_raw = c_tn.get('dur') or ''
        if not str(dur_raw).isdigit():
            for sub_ctn in parent.findall(f'.//{_qn(P_NS, "cTn")}'):
                candidate = sub_ctn.get('dur') or ''
                if str(candidate).isdigit():
                    dur_raw = candidate
                    break
        delay_ms = 0
        st_cond = c_tn.find(f'./{_qn(P_NS, "stCondLst")}/{_qn(P_NS, "cond")}')
        if st_cond is not None and str(st_cond.get('delay') or '').isdigit():
            delay_ms = int(st_cond.get('delay'))
        animations.append({
            'target_object_id': target_id,
            'target_shape_name': id_to_name.get(target_id, ''),
            'effect': _PRESET_ID_TO_EFFECT.get(preset_id, f'preset_{preset_id}'),
            'class': preset_class,
            'trigger': trigger,
            'duration_ms': int(dur_raw) if str(dur_raw).isdigit() else 0,
            'delay_ms': delay_ms,
            'preset_id': preset_id,
        })
    return animations


def _read_speaker_notes(slide) -> tuple[str, bool, str]:
    notes_rel = next(
        (rel for rel in slide.part.rels.values() if rel.reltype.endswith('/notesSlide')),
        None,
    )
    if notes_rel is None:
        return '', False, ''
    notes_part = getattr(notes_rel, 'target_part', None)
    if notes_part is None:
        return '', False, ''
    content_type = str(getattr(notes_part, 'content_type', '') or '')
    text = ''
    try:
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame is not None:
            text = slide.notes_slide.notes_text_frame.text
    except Exception:
        notes_root = getattr(notes_part, '_element', None)
        if notes_root is not None:
            for sp in notes_root.findall(f'.//{_qn(P_NS, "sp")}'):
                nv_pr = _nv_pr(sp)
                ph = nv_pr.find(_qn(P_NS, 'ph')) if nv_pr is not None else None
                if ph is not None and ph.get('type') == 'body':
                    text, _, _, _ = _text_metrics_from_txbody(sp.find(_qn(P_NS, 'txBody')))
                    break
    text = str(text or '')
    return text, bool(text), content_type if text else ''


def _template_part_hashes(file: Path) -> dict[str, str]:
    prefixes = ('ppt/slideMasters/', 'ppt/slideLayouts/', 'ppt/theme/')
    with zipfile.ZipFile(file) as archive:
        return {
            name: _sha256_bytes(archive.read(name))
            for name in sorted(archive.namelist())
            if name.startswith(prefixes) and not name.endswith('/')
        }


def _slide_size_label(width_emu: int, height_emu: int) -> str:
    if not width_emu or not height_emu:
        return ''
    ratio = width_emu / height_emu
    if abs(ratio - 16 / 9) < 0.02:
        return '16:9'
    if abs(ratio - 4 / 3) < 0.02:
        return '4:3'
    return 'custom'


def read_pptx_package(pptx_file: Path) -> dict:
    pptx_file = Path(pptx_file).resolve()
    if not pptx_file.is_file():
        raise FileNotFoundError(f'native PPTX package not found: {pptx_file}')
    prs = Presentation(str(pptx_file))
    slide_part_indices = {
        str(slide.part.partname): index
        for index, slide in enumerate(prs.slides, 1)
    }

    slides_out = []
    object_counts: Counter[str] = Counter()
    for index, slide in enumerate(prs.slides, 1):
        slide_elem = slide._element
        sp_tree = slide_elem.find(f'./{_qn(P_NS, "cSld")}/{_qn(P_NS, "spTree")}')
        top_elements = [
            child for child in (sp_tree if sp_tree is not None else [])
            if _local(child.tag) in {'sp', 'cxnSp', 'pic', 'graphicFrame', 'grpSp'}
        ]
        id_to_name = {}
        for elem in top_elements:
            name, obj_id = _shape_name_and_id(elem)
            if obj_id:
                id_to_name[obj_id] = name
        objects = []
        for elem in top_elements:
            rec = _read_shape_element(elem, slide.part, id_to_name, slide_part_indices)
            if rec is not None:
                objects.append(rec)

        local_counts = Counter(rec['kind'] for rec in objects)
        object_counts.update(local_counts)
        notes_text, notes_resolved, notes_ct = _read_speaker_notes(slide)
        transition = _read_transition(slide_elem)
        animations = _read_animations(slide_elem, id_to_name)

        slides_out.append({
            'slide_index': index,
            'object_counts': dict(sorted(local_counts.items())),
            'object_names': [rec['name'] for rec in objects if rec['name']],
            'objects': objects,
            'speaker_notes': notes_text,
            'notes_relationship_resolved': notes_resolved,
            'notes_content_type': notes_ct,
            'transition': transition,
            'animation_targets': list(dict.fromkeys(
                item['target_shape_name'] for item in animations if item['target_shape_name']
            )),
            'animations': animations,
            'animation_count': len(animations),
            'timing_node_count': len(animations),
            'placeholder_count': sum(1 for rec in objects if rec['placeholder']),
        })

    width = int(prs.slide_width or 0)
    height = int(prs.slide_height or 0)
    notes_count = sum(1 for slide in slides_out if slide['speaker_notes'])

    all_parts = list(prs.part.package.iter_parts())
    master_count = sum(1 for p in all_parts if str(p.partname).startswith('/ppt/slideMasters/') and str(p.partname).endswith('.xml'))
    layout_count = sum(1 for p in all_parts if str(p.partname).startswith('/ppt/slideLayouts/') and str(p.partname).endswith('.xml'))
    theme_count = sum(1 for p in all_parts if str(p.partname).startswith('/ppt/theme/') and str(p.partname).endswith('.xml'))

    return {
        'schema_version': 2,
        'evidence_source': 'python_pptx_structured_readback',
        'pptx_file': str(pptx_file),
        'pptx_sha256': _sha256_file(pptx_file),
        'canvas_emu': {'width': width, 'height': height},
        'canvas_in': {'width': round(width / 914400, 4), 'height': round(height / 914400, 4)},
        'slide_size_type': _slide_size_label(width, height),
        'slide_count': len(slides_out),
        'object_type_counts': dict(sorted(object_counts.items())),
        'placeholder_count': sum(slide['placeholder_count'] for slide in slides_out),
        'notes_slide_count': notes_count,
        'transition_count': sum(1 for slide in slides_out if slide['transition']),
        'animation_count': sum(slide['animation_count'] for slide in slides_out),
        'timing_node_count': sum(slide['timing_node_count'] for slide in slides_out),
        'relationship_type_counts': {
            'chart': object_counts['chart'],
            'image': object_counts['picture'],
            'notesSlide': notes_count,
        },
        'part_counts': {
            'chart': object_counts['chart'],
            'media': object_counts['picture'],
            'notes': notes_count,
            'master': master_count,
            'layout': layout_count,
            'theme': theme_count,
        },
        'template_part_hashes': _template_part_hashes(pptx_file),
        'slides': slides_out,
    }
