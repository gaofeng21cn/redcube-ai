import hashlib
import json
import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import (
    CANVAS_PX,
    COMPOSITION_BUCKET_PX,
    GENERIC_OVERLAP_EXCLUDED_ROLE_PAIRS,
    MECHANICAL_CARD_PANEL_ROLES,
    MIN_STRUCTURAL_TEXT_CLEARANCE_PX,
    MIN_STRUCTURAL_TEXT_COLLISION_AREA_PX2,
    STRUCTURAL_TEXT_COLLISION_ROLES,
    STRUCTURAL_VISUAL_ROLE_HINTS,
    TITLE_SAFE_ZONE_BOTTOM,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.geometry import (
    bucket_px,
    rect_overlap_area,
    text_shape_bottom,
)


def generic_overlap_excluded(shape_a: dict, shape_b: dict) -> bool:
    roles = frozenset({
        safe_text(shape_a.get('role')),
        safe_text(shape_b.get('role')),
    })
    return roles in GENERIC_OVERLAP_EXCLUDED_ROLE_PAIRS


def structural_text_collision_failures(native_shapes: list[dict]) -> list[dict]:
    text_shapes = [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and shape.get('kind') == 'text_box'
        and safe_text(shape.get('role')) in STRUCTURAL_TEXT_COLLISION_ROLES
        and safe_text(shape.get('text'))
    ]
    structural_shapes = [
        shape for shape in structural_visual_shapes(native_shapes)
        if shape.get('kind') in {'line', 'connector'}
    ]
    failures = []
    for text_shape in text_shapes:
        text_rect = text_shape.get('bounds') or {}
        visible_text_rect = {
            **text_rect,
            'bottom': text_shape_bottom(text_shape),
        }
        for structural_shape in structural_shapes:
            structural_rect = structural_shape.get('bounds') or {}
            overlap_area = rect_overlap_area(visible_text_rect, structural_rect)
            if overlap_area <= MIN_STRUCTURAL_TEXT_COLLISION_AREA_PX2:
                continue
            failures.append({
                'text_shape_id': text_shape.get('shape_id'),
                'structural_shape_id': structural_shape.get('shape_id'),
                'text_role': text_shape.get('role'),
                'structural_role': structural_shape.get('role'),
                'overlap_area': round(overlap_area, 2),
                'required_gap_px': MIN_STRUCTURAL_TEXT_CLEARANCE_PX,
            })
    return failures


def composition_signature(native_shapes: list[dict]) -> str:
    signature_shapes = []
    signature_roles = {
        'title',
        'core_sentence',
        'compare_panel',
        'signal_panel',
        'timeline_panel',
        'judgement_step',
        'axis_panel',
        'takeaway_panel',
        'structured_note_panel',
        'chart',
        'table',
        'metric_grid',
    }
    for shape in native_shapes:
        role = safe_text(shape.get('role'))
        if role not in signature_roles:
            continue
        rect = shape.get('bounds') or {}
        signature_shapes.append({
            'role': role,
            'kind': safe_text(shape.get('kind')),
            'x': bucket_px(float(rect.get('left') or 0.0)),
            'y': bucket_px(float(rect.get('top') or 0.0)),
            'w': bucket_px(float(rect.get('width') or 0.0)),
            'h': bucket_px(float(rect.get('height') or 0.0)),
        })
    signature_shapes.sort(key=lambda item: (item['role'], item['y'], item['x'], item['w'], item['h']))
    payload = json.dumps(signature_shapes, ensure_ascii=False, sort_keys=True)
    digest = hashlib.sha256(payload.encode('utf-8')).hexdigest()[:12]
    role_summary = '-'.join(
        f'{role}:{sum(1 for item in signature_shapes if item["role"] == role)}'
        for role in sorted({item['role'] for item in signature_shapes})
    )
    return f'native-composition:{digest}:{role_summary or "empty"}'


def title_underline_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        role = safe_text(shape.get('role'))
        kind = safe_text(shape.get('kind'))
        rect = shape.get('bounds') or {}
        width = float(rect.get('width') or 0.0)
        height = float(rect.get('height') or 0.0)
        top = float(rect.get('top') or 0.0)
        if role != 'accent_rule' and not (
            kind == 'line'
            and width >= CANVAS_PX[0] * 0.45
            and height <= 4.0
            and TITLE_SAFE_ZONE_BOTTOM <= top <= TITLE_SAFE_ZONE_BOTTOM + 120.0
        ):
            continue
        failures.append({
            'shape_id': shape.get('shape_id'),
            'role': role,
            'kind': kind,
            'top': round(top, 2),
            'width': round(width, 2),
            'reason': 'title_underline_motif_forbidden',
        })
    return failures


def structural_visual_shapes(native_shapes: list[dict]) -> list[dict]:
    results = []
    for shape in native_shapes:
        role = safe_text(shape.get('role')).lower()
        kind = safe_text(shape.get('kind')).lower()
        if kind in {'chart', 'table', 'metric_grid'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval'} and role not in {'accent_dot', 'page_number', 'page_no'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval', 'rect', 'rounded_rect'} and any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            results.append(shape)
    return results


def mechanical_card_panel_count(native_shapes: list[dict]) -> int:
    count = 0
    for shape in native_shapes:
        role = safe_text(shape.get('role')).lower()
        if role in MECHANICAL_CARD_PANEL_ROLES:
            count += 1
        elif role.endswith('_panel') and not any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            count += 1
    return count
