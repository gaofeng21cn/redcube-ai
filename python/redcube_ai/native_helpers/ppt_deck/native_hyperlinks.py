import re
from urllib.parse import urlsplit

from .native_layouts.common import native_ai_design_shapes, shape_kind


LINK_OBJECT_KINDS = {
    'text_box',
    'text',
    'textbox',
    'shape',
    'preset_shape',
    'rect',
    'rectangle',
    'rounded_rect',
    'panel',
    'oval',
    'circle',
    'path',
}

_A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
_P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main'
_R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def _qn(ns: str, local: str) -> str:
    return f'{{{ns}}}{local}'


def text_units(text: str) -> int:
    return len(text.encode('utf-16-le')) // 2


def _slice_units(text: str, start: int, end: int) -> str:
    return text.encode('utf-16-le')[start * 2:end * 2].decode('utf-16-le')


def planned_hyperlinks(shape: dict) -> dict:
    links = {'object': str(shape.get('link') or ''), 'runs': []}
    for paragraph_index, paragraph in enumerate(shape.get('paragraphs') or [], 1):
        offset = 0
        for run in paragraph.get('runs') or []:
            text = str(run.get('text') or '')
            if run.get('link'):
                links['runs'].append({
                    'paragraph_index': paragraph_index,
                    'start': offset,
                    'end': offset + text_units(text),
                    'text': text,
                    'link': str(run['link']),
                })
            offset += text_units(text)
    return links


def validate_hyperlinks(slides: list[dict]) -> None:
    def validate_target(target: str) -> None:
        jump = re.fullmatch(r'slide\[([1-9][0-9]*)\]', target)
        if jump:
            if int(jump.group(1)) <= len(slides):
                return
            raise ValueError('native PPT hyperlink slide target is outside the final roster')
        parsed = urlsplit(target)
        if (
            any(character.isspace() or ord(character) < 32 for character in target)
            or parsed.scheme.lower() not in {'https', 'http', 'mailto', 'tel'}
            or (parsed.scheme.lower() in {'https', 'http'} and not parsed.netloc)
            or not (parsed.netloc or parsed.path)
        ):
            raise ValueError('native PPT hyperlink requires an exact public URI or slide[N] target')

    def visit(shape: dict) -> None:
        links = planned_hyperlinks(shape)
        targets = ([links['object']] if links['object'] else []) + [run['link'] for run in links['runs']]
        if targets and shape_kind(shape) not in LINK_OBJECT_KINDS:
            raise ValueError('native PPT authored hyperlinks currently require a text or shape object')
        for target in targets:
            validate_target(target)
        if any(not run['text'] for run in links['runs']):
            raise ValueError('native PPT inline hyperlink requires non-empty visible text')
        for child in shape.get('drawingml_shapes') or shape.get('children') or []:
            visit(child)

    for slide in slides:
        for shape in native_ai_design_shapes(slide):
            visit(shape)


def _resolve_hlink_click(hlink, slide_part, slide_part_indices: dict[str, int]) -> str:
    if hlink is None:
        return ''
    r_id = hlink.get(_qn(_R_NS, 'id')) or ''
    action = hlink.get('action') or ''
    if not r_id or slide_part is None:
        return ''
    rel = slide_part.rels.get(r_id)
    if rel is None:
        return ''
    if rel.is_external:
        return str(rel.target_ref or '')
    if 'hlinksldjump' in action or rel.reltype.endswith('/slide'):
        target_part = getattr(rel, 'target_part', None)
        partname = str(getattr(target_part, 'partname', ''))
        if partname in slide_part_indices:
            return f'slide[{slide_part_indices[partname]}]'
    return str(rel.target_ref or '')


def readback_hyperlinks(
    shape_or_node,
    *,
    slide_part=None,
    slide_part_indices: dict[str, int] | None = None,
) -> dict:
    if isinstance(shape_or_node, dict):
        links = {'object': str((shape_or_node.get('format') or {}).get('link') or ''), 'runs': []}
        paragraphs = [child for child in shape_or_node.get('children') or [] if child.get('type') == 'paragraph']
        for paragraph_index, paragraph in enumerate(paragraphs, 1):
            offset = 0
            for run in paragraph.get('children') or []:
                text = str(run.get('text') or '')
                target = str((run.get('format') or {}).get('link') or '')
                links['runs'].append({
                    'paragraph_index': paragraph_index,
                    'start': offset,
                    'end': offset + text_units(text),
                    'text': text,
                    'link': target,
                })
                offset += text_units(text)
        return links

    part_indices = slide_part_indices or {}
    element = getattr(shape_or_node, '_element', shape_or_node)
    if element is None:
        return {'object': '', 'runs': []}

    object_link = ''
    for nv_tag in ('nvSpPr', 'nvPicPr', 'nvCxnSpPr', 'nvGraphicFramePr', 'nvGrpSpPr'):
        nv = element.find(_qn(_P_NS, nv_tag))
        if nv is not None:
            c_nv_pr = nv.find(_qn(_P_NS, 'cNvPr'))
            if c_nv_pr is not None:
                hlink = c_nv_pr.find(_qn(_A_NS, 'hlinkClick'))
                object_link = _resolve_hlink_click(hlink, slide_part, part_indices)
            break

    runs_out = []
    tx_body = element.find(_qn(_P_NS, 'txBody'))
    if tx_body is not None:
        for paragraph_index, paragraph in enumerate(tx_body.findall(_qn(_A_NS, 'p')), 1):
            offset = 0
            for child in paragraph:
                local = child.tag.rsplit('}', 1)[-1]
                if local in {'r', 'fld'}:
                    t_elem = child.find(_qn(_A_NS, 't'))
                    text = t_elem.text if (t_elem is not None and t_elem.text) else ''
                    r_pr = child.find(_qn(_A_NS, 'rPr'))
                    hlink = r_pr.find(_qn(_A_NS, 'hlinkClick')) if r_pr is not None else None
                    target = _resolve_hlink_click(hlink, slide_part, part_indices)
                    runs_out.append({
                        'paragraph_index': paragraph_index,
                        'start': offset,
                        'end': offset + text_units(text),
                        'text': text,
                        'link': target,
                    })
                    offset += text_units(text)
                elif local == 'br':
                    offset += 1
    return {'object': object_link, 'runs': runs_out}


def assert_hyperlink_readback(expected: dict, actual: dict) -> None:
    if expected.get('object') and expected['object'] != actual.get('object'):
        raise RuntimeError('native PPT object hyperlink target mismatch')
    for wanted in expected.get('runs') or []:
        found = [
            run for run in actual.get('runs') or []
            if (
                run['paragraph_index'] == wanted['paragraph_index']
                and run['end'] > wanted['start']
                and run['start'] < wanted['end']
            )
        ]
        text = ''.join(
            _slice_units(run['text'], max(0, wanted['start'] - run['start']), wanted['end'] - run['start'])
            for run in found
        )
        if text != wanted['text'] or any(run['link'] != wanted['link'] for run in found):
            raise RuntimeError('native PPT inline hyperlink text or target mismatch')
