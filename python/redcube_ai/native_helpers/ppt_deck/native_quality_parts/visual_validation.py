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
    semantic_shape_ids = {
        shape_id
        for item in semantic_visual_evidence(native_shapes)
        for shape_id in item['object_ids']
        if shape_id
    }
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
        if role not in signature_roles and safe_text(shape.get('shape_id')) not in semantic_shape_ids:
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
        if kind in {'chart', 'table', 'metric_grid', 'picture', 'group', 'path'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval'} and role not in {'accent_dot', 'page_number', 'page_no'}:
            results.append(shape)
            continue
        if kind in {'line', 'connector', 'oval', 'rect', 'rounded_rect'} and any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            results.append(shape)
    return results


def semantic_visual_evidence(native_shapes: list[dict]) -> list[dict]:
    shapes = [
        {
            'shape_id': safe_text(shape.get('shape_id')),
            'kind': safe_text(shape.get('kind')).lower(),
            'role': safe_text(shape.get('role')).lower(),
            'quality_role': safe_text(shape.get('quality_role')).lower(),
            'from_shape_id': safe_text(shape.get('from_shape_id')),
            'to_shape_id': safe_text(shape.get('to_shape_id')),
            'head_end': safe_text(shape.get('head_end')).lower(),
            'tail_end': safe_text(shape.get('tail_end')).lower(),
        }
        for shape in native_shapes
    ]
    evidence = []

    def semantic_shape(shape):
        return shape['quality_role'] in {'content', 'structural'}

    semantic_object_role_fragments = {
        'picture': ('evidence', 'screenshot', 'photo', 'diagram', 'visual'),
        'group': ('evidence', 'diagram', 'map', 'flow', 'structure'),
        'path': ('evidence', 'diagram', 'map', 'flow', 'structure'),
    }
    for kind, family in {
        'chart': 'data_chart',
        'table': 'data_table',
        'metric_grid': 'data_metric_grid',
        'picture': 'image_evidence',
        'group': 'grouped_diagram',
        'path': 'custom_diagram',
    }.items():
        role_fragments = semantic_object_role_fragments.get(kind)
        object_ids = [
            shape['shape_id']
            for shape in shapes
            if shape['kind'] == kind
            and semantic_shape(shape)
            and (
                role_fragments is None
                or any(fragment in shape['role'] for fragment in role_fragments)
            )
        ]
        if object_ids:
            evidence.append({
                'family': family,
                'object_ids': object_ids,
                'reason': f'native_{kind}_object_present',
            })

    def matching(*role_fragments):
        return [
            shape for shape in shapes
            if semantic_shape(shape)
            and any(fragment in shape['role'] for fragment in role_fragments)
        ]

    def nodes(*role_fragments):
        return [
            shape for shape in matching(*role_fragments)
            if shape['kind'] in {'rect', 'rounded_rect', 'oval', 'circle'}
        ]

    def directional_edges(family_nodes, *role_fragments):
        node_ids = {shape['shape_id'] for shape in family_nodes if shape['shape_id']}
        candidates = [
            shape for shape in matching(*role_fragments)
            if shape['kind'] == 'connector'
            and shape['from_shape_id'] in node_ids
            and shape['to_shape_id'] in node_ids
            and shape['from_shape_id'] != shape['to_shape_id']
            and any(value and value != 'none' for value in (shape['head_end'], shape['tail_end']))
        ]
        if not node_ids or not candidates:
            return []
        adjacency = {shape_id: set() for shape_id in node_ids}
        for edge in candidates:
            adjacency[edge['from_shape_id']].add(edge['to_shape_id'])
            adjacency[edge['to_shape_id']].add(edge['from_shape_id'])
        pending = [next(iter(node_ids))]
        visited = set()
        while pending:
            shape_id = pending.pop()
            if shape_id in visited:
                continue
            visited.add(shape_id)
            pending.extend(adjacency[shape_id] - visited)
        return candidates if visited == node_ids else []

    relationship_nodes = nodes('dependency_node', 'relationship_node', 'map_node')
    timeline_markers = nodes('milestone', 'timeline_node')
    timeline_nodes = timeline_markers if len(timeline_markers) >= 3 else nodes('timeline_panel')
    decision_nodes = nodes('judgement_step', 'decision_step', 'gate_step')
    comparison_nodes = nodes('compare_panel', 'comparison_node')
    system_route_nodes = nodes(
        'input_map_panel',
        'source_map_panel',
        'gate_stack_panel',
    )
    system_route_edges = directional_edges(
        system_route_nodes,
        'map_connector',
        'route_flow_connector',
        'horizontal_route_connector',
        'route_gate_connector',
    )
    system_axis_nodes = nodes(
        'center_hub',
        'axis_panel',
        'map_node',
        'document_map_icon',
    )
    system_axis_edges = directional_edges(
        system_axis_nodes,
        'axis_connector',
        'map_connector',
    )
    if len(system_route_nodes) >= 2 and system_route_edges:
        system_map_nodes = system_route_nodes
        system_map_edges = system_route_edges
    else:
        system_map_nodes = system_axis_nodes
        system_map_edges = system_axis_edges

    semantic_compositions = [
        (
            'relationship_graph',
            relationship_nodes,
            directional_edges(
                relationship_nodes,
                'dependency_connector',
                'relationship_connector',
                'map_connector',
            ),
            3,
            2,
        ),
        (
            'timeline',
            timeline_nodes,
            directional_edges(timeline_nodes, 'timeline_connector'),
            3,
            1,
        ),
        (
            'decision_ladder',
            decision_nodes,
            directional_edges(decision_nodes, 'decision_connector', 'gate_connector'),
            3,
            1,
        ),
        (
            'comparison_flow',
            comparison_nodes,
            directional_edges(comparison_nodes, 'comparison_connector', 'comparison_axis'),
            2,
            1,
        ),
        (
            'system_map',
            system_map_nodes,
            system_map_edges,
            2,
            1,
        ),
    ]
    for family, family_nodes, family_edges, minimum_nodes, minimum_edges in semantic_compositions:
        if len(family_nodes) < minimum_nodes or len(family_edges) < minimum_edges:
            continue
        evidence.append({
            'family': family,
            'object_ids': [shape['shape_id'] for shape in [*family_nodes, *family_edges]],
            'node_count': len(family_nodes),
            'edge_count': len(family_edges),
            'reason': 'semantic_node_edge_composition_present',
        })

    signal_nodes = nodes('signal_hub', 'signal_panel')
    signal_edges = directional_edges(signal_nodes, 'signal_connector')
    if len(signal_nodes) >= 2 and signal_edges:
        evidence.append({
            'family': 'signal_composition',
            'object_ids': [shape['shape_id'] for shape in [*signal_nodes, *signal_edges]],
            'node_count': len(signal_nodes),
            'edge_count': len(signal_edges),
            'reason': 'signal_hub_panel_connector_composition_present',
        })

    status_hubs = nodes('input_hub')
    status_panels = nodes('content_panel')
    status_nodes = [*status_hubs, *status_panels]
    status_edges = directional_edges(status_nodes, 'flow_connector')
    if len(status_hubs) == 1 and len(status_panels) == 3 and len(status_edges) >= 3:
        hub_id = status_hubs[0]['shape_id']
        panel_ids = {shape['shape_id'] for shape in status_panels}
        hub_panel_edges = [
            edge for edge in status_edges
            if edge['from_shape_id'] == hub_id and edge['to_shape_id'] in panel_ids
        ]
        pointed_panel_ids = [edge['to_shape_id'] for edge in hub_panel_edges]
        if (
            len(hub_panel_edges) == 3
            and set(pointed_panel_ids) == panel_ids
            and len(pointed_panel_ids) == len(set(pointed_panel_ids))
        ):
            evidence.append({
                'family': 'status_flow',
                'object_ids': [shape['shape_id'] for shape in [*status_nodes, *hub_panel_edges]],
                'node_count': len(status_nodes),
                'edge_count': len(hub_panel_edges),
                'reason': 'input_hub_to_three_status_panels_present',
            })

    synthesis_nodes = nodes('takeaway_panel')
    synthesis_bands = matching('takeaway_band', 'synthesis_peak')
    if len(synthesis_nodes) >= 2 and synthesis_bands:
        evidence.append({
            'family': 'synthesis_peak',
            'object_ids': [shape['shape_id'] for shape in [*synthesis_nodes, *synthesis_bands]],
            'node_count': len(synthesis_nodes),
            'edge_count': 0,
            'reason': 'takeaway_panels_and_synthesis_band_present',
        })
    return evidence


def mechanical_card_panel_count(native_shapes: list[dict]) -> int:
    count = 0
    for shape in native_shapes:
        role = safe_text(shape.get('role')).lower()
        if role in MECHANICAL_CARD_PANEL_ROLES:
            count += 1
        elif role.endswith('_panel') and not any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS):
            count += 1
    return count
