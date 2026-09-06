import re
from urllib.parse import urlsplit

from .native_layouts_parts.common import native_ai_design_shapes, shape_kind


LINK_OBJECT_KINDS = {'text_box', 'text', 'textbox', 'shape', 'preset_shape', 'rect', 'rectangle', 'rounded_rect', 'panel', 'oval', 'circle', 'path'}


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


def readback_hyperlinks(node: dict) -> dict:
    links = {'object': str((node.get('format') or {}).get('link') or ''), 'runs': []}
    paragraphs = [child for child in node.get('children') or [] if child.get('type') == 'paragraph']
    for paragraph_index, paragraph in enumerate(paragraphs, 1):
        offset = 0
        for run in paragraph.get('children') or []:
            text = str(run.get('text') or '')
            target = str((run.get('format') or {}).get('link') or '')
            links['runs'].append({
                'paragraph_index': paragraph_index, 'start': offset,
                'end': offset + text_units(text), 'text': text, 'link': target,
            })
            offset += text_units(text)
    return links


def assert_hyperlink_readback(expected: dict, actual: dict) -> None:
    if expected.get('object') and expected['object'] != actual.get('object'):
        raise RuntimeError('native PPT object hyperlink target mismatch')
    for wanted in expected.get('runs') or []:
        found = [run for run in actual.get('runs') or [] if (
            run['paragraph_index'] == wanted['paragraph_index']
            and run['end'] > wanted['start'] and run['start'] < wanted['end']
        )]
        text = ''.join(_slice_units(run['text'], max(0, wanted['start'] - run['start']), wanted['end'] - run['start']) for run in found)
        if text != wanted['text'] or any(run['link'] != wanted['link'] for run in found):
            raise RuntimeError('native PPT inline hyperlink text or target mismatch')
