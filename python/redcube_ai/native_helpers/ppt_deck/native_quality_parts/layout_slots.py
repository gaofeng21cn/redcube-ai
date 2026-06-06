import math

from redcube_ai.native_helpers.ppt_deck.native_layouts import safe_text
from redcube_ai.native_helpers.ppt_deck.native_quality_constants import (
    CONTENT_DEPTH_EXCLUDED_ROLES,
    MAX_GRID_BALANCE_RATIO,
    MAX_NATIVE_PRIMARY_POINTS,
    MIN_GRID_BALANCE_RATIO,
    SYSTEM_MAP_CONTENT_ROLES,
    SYSTEM_MAP_INPUT_PANEL_ROLES,
    SYSTEM_MAP_PANEL_ROLES,
    SYSTEM_MAP_ROUTE_ROLES,
    SYSTEM_MAP_STRUCTURAL_HINTS,
)
from redcube_ai.native_helpers.ppt_deck.native_quality_parts.geometry import clamp


def shapes_with_role(native_shapes: list[dict], role: str) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content' and safe_text(shape.get('role')) == role
    ]


def shapes_with_any_role(native_shapes: list[dict], roles: set[str]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if safe_text(shape.get('role')) in roles
    ]


def content_shapes_with_any_role(native_shapes: list[dict], roles: set[str]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content' and safe_text(shape.get('role')) in roles
    ]


def has_role_hint(native_shapes: list[dict], hint: str) -> bool:
    return any(hint in safe_text(shape.get('role')).lower() for shape in native_shapes)


def is_system_map_layout(native_shapes: list[dict]) -> bool:
    roles = {safe_text(shape.get('role')) for shape in native_shapes}
    has_system_panel = bool(roles.intersection(SYSTEM_MAP_PANEL_ROLES))
    has_structural_span = sum(1 for hint in SYSTEM_MAP_STRUCTURAL_HINTS if has_role_hint(native_shapes, hint)) >= 3
    has_content_variety = len(roles.intersection(SYSTEM_MAP_CONTENT_ROLES)) >= 3
    return has_system_panel and has_structural_span and has_content_variety


def content_slot_shapes(native_shapes: list[dict]) -> list[dict]:
    return [
        shape for shape in native_shapes
        if shape.get('quality_role') == 'content'
        and safe_text(shape.get('text'))
        and safe_text(shape.get('role')) not in CONTENT_DEPTH_EXCLUDED_ROLES
    ]


def layout_variant(native_shapes: list[dict]) -> str:
    roles = {safe_text(shape.get('role')) for shape in native_shapes}
    if is_system_map_layout(native_shapes):
        return 'system_map'
    zone_count = len(shapes_with_role(native_shapes, 'compare_panel'))
    content_panel_count = len(shapes_with_role(native_shapes, 'content_panel'))
    timeline_count = len(shapes_with_role(native_shapes, 'timeline_panel'))
    gate_count = len(shapes_with_role(native_shapes, 'judgement_step'))
    axis_count = len(shapes_with_role(native_shapes, 'axis_panel'))
    signal_count = len(shapes_with_role(native_shapes, 'signal_panel'))
    takeaway_count = len(shapes_with_role(native_shapes, 'takeaway_panel'))
    if zone_count == 2:
        return 'compare_two_column'
    if zone_count == 3:
        return 'compare_three_column'
    if zone_count == 4:
        return 'compare_four_zone'
    content_panel_variant = {
        1: 'content_single_panel', 2: 'content_two_panel', 3: 'content_three_panel',
    }.get(content_panel_count, 'content_four_panel' if content_panel_count >= 4 else '')
    if content_panel_variant:
        return content_panel_variant
    if 'structured_note_panel' in roles:
        return 'structured_compare'
    if timeline_count:
        return 'timeline_band'
    if gate_count <= 2 and gate_count > 0:
        return 'judgement_two_gate'
    if gate_count > 2:
        return 'judgement_ladder'
    if axis_count:
        return 'ring_cross'
    if signal_count:
        return 'cover_signal'
    if takeaway_count:
        return 'summary_peak'
    return 'unknown'


def expected_slot_roles(native_shapes: list[dict]) -> list[str]:
    variant = layout_variant(native_shapes)
    if variant.startswith('compare_'):
        return ['compare_panel', 'point_text']
    if variant.startswith('content_'):
        return ['content_panel']
    if variant == 'structured_compare':
        return ['structured_note_panel', 'point_text']
    if variant == 'timeline_band':
        return ['timeline_panel', 'point_text']
    if variant.startswith('judgement_'):
        return ['judgement_step', 'point_text']
    if variant == 'ring_cross':
        return ['axis_panel', 'point_text']
    if variant == 'cover_signal':
        return ['signal_panel', 'point_text']
    if variant == 'summary_peak':
        return ['takeaway_panel']
    if variant == 'system_map':
        return ['system_map_panel', 'system_map_text']
    return []


def system_map_slot_fill_audit(native_shapes: list[dict]) -> dict:
    panel_count = len(shapes_with_any_role(native_shapes, SYSTEM_MAP_PANEL_ROLES))
    text_count = len(content_shapes_with_any_role(native_shapes, SYSTEM_MAP_CONTENT_ROLES))
    filled_slots = min(panel_count, text_count)
    failures = []
    if panel_count < 3:
        failures.append({
            'reason': 'system_map_panel_count_too_low',
            'expected_minimum': 3,
            'actual': panel_count,
        })
    if text_count < 3:
        failures.append({
            'reason': 'system_map_text_count_too_low',
            'expected_minimum': 3,
            'actual': text_count,
        })
    return {
        'layout_variant': 'system_map',
        'expected_slot_count': 3,
        'filled_slot_count': min(filled_slots, 3),
        'slot_fill_ok': len(failures) == 0,
        'slot_fill_failures': failures,
    }


def slot_fill_audit(native_shapes: list[dict], primary_points: int) -> dict:
    variant = layout_variant(native_shapes)
    if variant == 'system_map':
        return system_map_slot_fill_audit(native_shapes)
    roles = expected_slot_roles(native_shapes)
    if not roles:
        return {
            'layout_variant': variant,
            'expected_slot_count': max(1, min(primary_points, MAX_NATIVE_PRIMARY_POINTS)),
            'filled_slot_count': 0,
            'slot_fill_ok': False,
            'slot_fill_failures': [{'reason': 'unknown_layout_variant'}],
        }
    panel_role = roles[0]
    panel_count = len(shapes_with_role(native_shapes, panel_role))
    text_role = roles[1] if len(roles) > 1 else ''
    if text_role:
        text_count = len([
            shape for shape in shapes_with_role(native_shapes, text_role)
            if safe_text(shape.get('text'))
        ])
    elif panel_role == 'content_panel':
        text_count = max(
            len([
                shape for shape in shapes_with_role(native_shapes, panel_role)
                if safe_text(shape.get('text'))
            ]),
            len([
                shape for shape in content_slot_shapes(native_shapes)
                if safe_text(shape.get('text'))
            ]),
        )
    else:
        text_count = panel_count
    if variant.startswith('content_'):
        expected_slots = min(max(1, primary_points), max(panel_count, 1))
    elif variant == 'structured_compare':
        expected_slots = min(max(1, primary_points), max(panel_count, 1))
    else:
        if variant == 'summary_peak':
            expected_slots = min(max(1, primary_points), max(panel_count, 1))
        else:
            expected_slots = max(1, min(primary_points, 4))
    filled_slots = min(panel_count, text_count)
    failures = []
    if panel_count != expected_slots:
        failures.append({
            'reason': 'panel_count_mismatch',
            'role': panel_role,
            'expected': expected_slots,
            'actual': panel_count,
        })
    if text_count < expected_slots:
        failures.append({
            'reason': 'text_slot_count_mismatch',
            'role': text_role,
            'expected': expected_slots,
            'actual': text_count,
        })
    return {
        'layout_variant': variant,
        'expected_slot_count': expected_slots,
        'filled_slot_count': filled_slots,
        'slot_fill_ok': len(failures) == 0,
        'slot_fill_failures': failures,
    }


def grid_balance_audit(native_shapes: list[dict]) -> dict:
    variant = layout_variant(native_shapes)
    if variant == 'system_map':
        route_lane_count = len(shapes_with_any_role(native_shapes, SYSTEM_MAP_ROUTE_ROLES))
        gate_card_count = len(shapes_with_any_role(native_shapes, {'gate_card', 'gate_ladder_panel', 'gate_stack_panel'}))
        evidence_band_count = len(shapes_with_any_role(native_shapes, {'evidence_band', 'evidence_panel', 'takeaway_band'}))
        input_panel_count = len(shapes_with_any_role(native_shapes, SYSTEM_MAP_INPUT_PANEL_ROLES))
        failures = []
        if route_lane_count < 2:
            failures.append({
                'reason': 'system_map_route_lanes_too_low',
                'expected_minimum': 2,
                'actual': route_lane_count,
            })
        if gate_card_count < 1:
            failures.append({
                'reason': 'system_map_gate_area_missing',
                'expected_minimum': 1,
                'actual': gate_card_count,
            })
        if evidence_band_count < 1:
            failures.append({
                'reason': 'system_map_evidence_band_missing',
                'expected_minimum': 1,
                'actual': evidence_band_count,
            })
        if input_panel_count < 1:
            failures.append({
                'reason': 'system_map_input_panel_missing',
                'expected_minimum': 1,
                'actual': input_panel_count,
            })
        return {
            'grid_balance_ratio': 1.0,
            'grid_balance_ok': len(failures) == 0,
            'grid_balance_failures': failures,
        }
    else:
        slot_roles = expected_slot_roles(native_shapes)
        panel_role = slot_roles[0] if slot_roles else ''
        panels = shapes_with_role(native_shapes, panel_role) if panel_role else []
    if len(panels) <= 1:
        return {
            'grid_balance_ratio': 1.0,
            'grid_balance_ok': True,
            'grid_balance_failures': [],
        }
    areas = []
    for panel in panels:
        rect = panel.get('bounds') or {}
        areas.append(float(rect.get('width') or 0.0) * float(rect.get('height') or 0.0))
    smallest = min((area for area in areas if area > 0), default=0.0)
    largest = max(areas, default=0.0)
    ratio = largest / smallest if smallest > 0 else float('inf')
    failures = []
    if ratio < MIN_GRID_BALANCE_RATIO or ratio > MAX_GRID_BALANCE_RATIO:
        failures.append({
            'reason': 'panel_area_ratio_out_of_range',
            'layout_variant': variant,
            'ratio': round(ratio, 4) if math.isfinite(ratio) else None,
            'min': MIN_GRID_BALANCE_RATIO,
            'max': MAX_GRID_BALANCE_RATIO,
        })
    return {
        'grid_balance_ratio': round(ratio, 4) if math.isfinite(ratio) else None,
        'grid_balance_ok': len(failures) == 0,
        'grid_balance_failures': failures,
    }
