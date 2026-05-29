from redcube_ai.native_helpers.ppt_deck.native_layouts import (
    ai_shape_bounds_in,
    ai_shape_font_size,
    ai_shape_text,
    estimated_text_lines,
    margin_inches,
    normalized_text_char_count,
    safe_list,
    safe_text,
)


def sample_layout_profile_failures(slide_data: dict) -> list[dict]:
    profile = slide_data.get('_native_ppt_sample_layout_profile')
    if not isinstance(profile, dict) or profile.get('required') is not True:
        return []
    binding = slide_data.get('template_layout_binding') if isinstance(slide_data.get('template_layout_binding'), dict) else {}
    archetype = safe_text(binding.get('selected_archetype'))
    allowed = {
        safe_text(item)
        for item in safe_list(profile.get('allowed_sample_archetypes'))
        if safe_text(item)
    }
    forbidden = {
        safe_text(item)
        for item in safe_list(profile.get('forbidden_archetypes'))
        if safe_text(item)
    }
    zones = [
        zone for zone in safe_list(binding.get('zones'))
        if isinstance(zone, dict)
    ]
    zone_ids = {
        safe_text(zone.get('zone_id'))
        for zone in zones
        if safe_text(zone.get('zone_id'))
    }
    shapes = slide_data.get('_editable_native_shapes')
    shapes = shapes if isinstance(shapes, list) else []
    role_counts = {}
    for shape in shapes:
        role = safe_text(shape.get('role'))
        role_counts[role] = role_counts.get(role, 0) + 1

    zones_by_id = {
        safe_text(zone.get('zone_id')): zone
        for zone in zones
        if safe_text(zone.get('zone_id'))
    }
    profile_contracts = [
        contract for contract in safe_list(profile.get('archetype_contracts'))
        if isinstance(contract, dict)
    ]
    profile_contract = next(
        (
            contract for contract in profile_contracts
            if safe_text(contract.get('archetype_id')) == archetype
        ),
        {},
    )
    zone_floor_in = profile_contract.get('zone_floor_in') if isinstance(profile_contract.get('zone_floor_in'), dict) else {}

    def bounds_in(shape_or_zone: dict) -> dict:
        bounds = shape_or_zone.get('bounds') if isinstance(shape_or_zone.get('bounds'), dict) else {}
        parsed = {}
        for key in ('left_in', 'top_in', 'width_in', 'height_in'):
            try:
                parsed[key] = float(bounds.get(key))
            except (TypeError, ValueError):
                return {}
        return parsed

    def shape_text(shape: dict) -> str:
        return safe_text(shape.get('editable_text') or shape.get('text') or shape.get('label'))

    def shape_kind(shape: dict) -> str:
        return safe_text(shape.get('kind') or shape.get('type')).lower()

    def shape_quality_role(shape: dict) -> str:
        return safe_text(shape.get('quality_role')).lower()

    def shape_role(shape: dict) -> str:
        return safe_text(shape.get('role')).lower()

    def rect_right(rect: dict) -> float:
        return float(rect.get('left_in') or 0.0) + float(rect.get('width_in') or 0.0)

    def rect_bottom(rect: dict) -> float:
        return float(rect.get('top_in') or 0.0) + float(rect.get('height_in') or 0.0)

    def rect_center_x(rect: dict) -> float:
        return float(rect.get('left_in') or 0.0) + (float(rect.get('width_in') or 0.0) / 2.0)

    def rect_center_y(rect: dict) -> float:
        return float(rect.get('top_in') or 0.0) + (float(rect.get('height_in') or 0.0) / 2.0)

    def shape_arrow_end(shape: dict) -> str:
        line_spec = shape.get('line') if isinstance(shape.get('line'), dict) else {}
        raw = (
            shape.get('tailEnd')
            or shape.get('tail_end')
            or shape.get('arrowEnd')
            or shape.get('arrow_end')
            or line_spec.get('tailEnd')
            or line_spec.get('tail_end')
            or line_spec.get('arrowEnd')
            or line_spec.get('arrow_end')
        )
        arrow = safe_text(raw).lower()
        if arrow in {'arrow', 'triangle', 'stealth', 'diamond', 'oval'}:
            return arrow
        if shape.get('end_arrow') is True or line_spec.get('end_arrow') is True:
            return 'triangle'
        return ''

    def shape_font_size(shape: dict) -> float:
        try:
            return float(shape.get('font_size') or shape.get('size_pt') or shape.get('size') or 0.0)
        except (TypeError, ValueError):
            return 0.0

    def content_text_shapes_in_zone(zone_id: str) -> list[dict]:
        return [
            shape for shape in shapes
            if safe_text(shape.get('layout_zone_id')) == zone_id
            and shape_quality_role(shape) == 'content'
            and shape_kind(shape) in {'text', 'text_box'}
            and shape_text(shape)
            and shape_role(shape) not in {'page_number', 'page_no', 'footer', 'cover_meta', 'meta'}
        ]

    def role_has(*needles):
        return any(
            any(needle in safe_text(shape.get('role')).lower() for needle in needles)
            for shape in shapes
        )
    failures = []
    for zone_id, minimum in zone_floor_in.items():
        zone = zones_by_id.get(safe_text(zone_id))
        zone_bounds = bounds_in(zone or {})
        try:
            minimum_height = float(minimum)
        except (TypeError, ValueError):
            continue
        if not zone_bounds:
            continue
        if float(zone_bounds.get('height_in') or 0.0) < minimum_height:
            failures.append({
                'reason': 'ai_first_native_sample_zone_too_short',
                'selected_archetype': archetype,
                'zone_id': safe_text(zone_id),
                'height_in': round(float(zone_bounds.get('height_in') or 0.0), 4),
                'minimum_height_in': round(minimum_height, 4),
                'repair_instruction': 'Resize the selected sample layout zones before emitting shapes. Do not squeeze title, claim, status cards, or proof text below the sample capacity floor.',
            })
    if allowed and archetype not in allowed:
        failures.append({
            'reason': 'ai_first_native_sample_archetype_not_capacity_safe',
            'selected_archetype': archetype,
            'allowed_sample_archetypes': sorted(allowed),
        })
    if archetype in forbidden:
        failures.append({
            'reason': 'ai_first_native_sample_forbidden_general_archetype',
            'selected_archetype': archetype,
        })
    if archetype == 'sample_status_proof_board':
        status_panels = [
            shape for shape in shapes
            if safe_text(shape.get('layout_zone_id')) == 'status_zone'
            and shape_role(shape) == 'content_panel'
        ]
        status_texts = [
            shape for shape in shapes
            if safe_text(shape.get('layout_zone_id')) == 'status_zone'
            and shape_role(shape) == 'point_text'
            and shape_text(shape)
        ]
        proof_texts = content_text_shapes_in_zone('proof_zone')
        boundary_notes = [
            shape for shape in shapes
            if shape_role(shape) == 'boundary_note'
            and shape_quality_role(shape) == 'content'
        ]
        if len(status_panels) != 3 or len(status_texts) != 3:
            failures.append({
                'reason': 'ai_first_native_sample_status_slots_not_exact',
                'selected_archetype': archetype,
                'content_panel_count': len(status_panels),
                'point_text_count': len(status_texts),
                'expected_count': 3,
                'repair_instruction': 'sample_status_proof_board must use exactly three filled status cards: three content_panel shapes paired with three point_text shapes. Do not create empty, missing, or extra slots.',
            })
        structural_status_panels = [
            panel for panel in status_panels
            if shape_quality_role(panel) != 'content'
        ]
        if structural_status_panels:
            failures.append({
                'reason': 'ai_first_native_sample_status_card_quality_role_invalid',
                'selected_archetype': archetype,
                'shape_ids': [safe_text(panel.get('shape_id'), '<missing-shape-id>') for panel in structural_status_panels],
                'required_quality_role': 'content',
                'repair_instruction': 'Set each sample_status_proof_board content_panel card background to quality_role=content. Structural is reserved for the input_hub, connector arrows, and proof_band.',
            })
        capacity_rules = profile.get('capacity_rules') if isinstance(profile.get('capacity_rules'), dict) else {}
        try:
            point_text_box_height_min = float(capacity_rules.get('status_card_text_box_height_in_min') or 0.96)
        except (TypeError, ValueError):
            point_text_box_height_min = 0.96
        try:
            point_text_max_lines = int(capacity_rules.get('status_card_point_text_max_estimated_lines') or 2)
        except (TypeError, ValueError):
            point_text_max_lines = 2
        try:
            point_text_max_chars = int(capacity_rules.get('status_card_point_text_max_cjk_chars') or 22)
        except (TypeError, ValueError):
            point_text_max_chars = 22
        enforce_flow_geometry = capacity_rules.get('input_hub_card_flow_geometry_required') is True
        for panel in status_panels:
            panel_bounds = bounds_in(panel)
            if not panel_bounds:
                continue
            if panel_bounds.get('width_in', 0.0) < 4.0 or panel_bounds.get('height_in', 0.0) < 1.35:
                failures.append({
                    'reason': 'ai_first_native_sample_status_card_too_small',
                    'selected_archetype': archetype,
                    'shape_id': safe_text(panel.get('shape_id'), '<missing-shape-id>'),
                    'width_in': round(panel_bounds.get('width_in', 0.0), 4),
                    'height_in': round(panel_bounds.get('height_in', 0.0), 4),
                    'minimum_width_in': 4.0,
                    'minimum_height_in': 1.35,
                    'repair_instruction': 'Use three large, equal status cards. Each card needs enough height for 18pt point text plus 0.15in internal safe inset; do not compress cards to make room for extra bottom notes.',
                })
        for text_shape in status_texts:
            text_bounds = ai_shape_bounds_in(text_shape)
            if text_bounds is None:
                continue
            estimated_lines = estimated_text_lines(text_shape, text_bounds)
            meaningful_chars = normalized_text_char_count(ai_shape_text(text_shape))
            if text_bounds.get('height_in', 0.0) < point_text_box_height_min:
                failures.append({
                    'reason': 'ai_first_native_sample_status_text_box_too_short',
                    'selected_archetype': archetype,
                    'shape_id': safe_text(text_shape.get('shape_id'), '<missing-shape-id>'),
                    'role': 'point_text',
                    'height_in': round(text_bounds.get('height_in', 0.0), 4),
                    'minimum_height_in': round(point_text_box_height_min, 4),
                    'repair_instruction': 'Give each status card point_text enough vertical space for readable 18pt text inside the card safe area; use at least 0.96in or shorten the text.',
                })
            if estimated_lines > point_text_max_lines:
                failures.append({
                    'reason': 'ai_first_native_sample_status_text_wrap_too_deep',
                    'selected_archetype': archetype,
                    'shape_id': safe_text(text_shape.get('shape_id'), '<missing-shape-id>'),
                    'role': 'point_text',
                    'estimated_lines': estimated_lines,
                    'maximum_estimated_lines': point_text_max_lines,
                    'width_in': round(text_bounds.get('width_in', 0.0), 4),
                    'font_size': round(ai_shape_font_size(text_shape, 'point_text'), 2),
                    'margin_in': round(margin_inches(text_shape), 4),
                    'repair_instruction': 'Rewrite the card point_text as a concise label/short phrase that fits in at most two estimated 18pt lines, or widen the card while preserving the three-card status board.',
                })
            if meaningful_chars > point_text_max_chars:
                failures.append({
                    'reason': 'ai_first_native_sample_status_text_too_long',
                    'selected_archetype': archetype,
                    'shape_id': safe_text(text_shape.get('shape_id'), '<missing-shape-id>'),
                    'role': 'point_text',
                    'text_char_count': meaningful_chars,
                    'maximum_text_char_count': point_text_max_chars,
                    'repair_instruction': 'Shorten status card point_text before placing it. The one-slide sample should use compact card labels, not full explanatory sentences.',
                })
        if len(proof_texts) > 1:
            failures.append({
                'reason': 'ai_first_native_sample_too_many_proof_text_blocks',
                'selected_archetype': archetype,
                'proof_text_block_count': len(proof_texts),
                'maximum': 1,
                'shape_ids': [safe_text(shape.get('shape_id')) for shape in proof_texts],
                'repair_instruction': 'sample_status_proof_board proof_zone may contain only one compact evidence sentence. Move boundary details into artifact metadata, not visible slide text.',
            })
        if boundary_notes:
            failures.append({
                'reason': 'ai_first_native_sample_boundary_note_forbidden',
                'selected_archetype': archetype,
                'shape_ids': [safe_text(shape.get('shape_id')) for shape in boundary_notes],
                'repair_instruction': 'Do not place boundary_note text on the one-slide visual sample. The visible page should show the causal proof board; scope boundaries belong in artifact metadata or speaker notes.',
            })
        if not role_has('input_hub') or not role_has('flow_connector', 'merge_connector'):
            failures.append({
                'reason': 'ai_first_native_sample_flow_structure_missing',
                'selected_archetype': archetype,
                'repair_instruction': 'Add a visible input_hub and flow/merge connectors that show one shared input feeding the three route cards and converging into the proof band.',
            })
        if enforce_flow_geometry and len(status_panels) == 3:
            panel_records = [
                {
                    'shape_id': safe_text(panel.get('shape_id'), '<missing-shape-id>'),
                    'bounds': bounds_in(panel),
                }
                for panel in status_panels
            ]
            panel_records = [record for record in panel_records if record['bounds']]
            panel_records.sort(key=lambda record: rect_center_x(record['bounds']))
            hub_records = [
                {
                    'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
                    'bounds': bounds_in(shape),
                    'text': shape_text(shape),
                }
                for shape in shapes
                if safe_text(shape.get('layout_zone_id')) == 'status_zone'
                and shape_role(shape) == 'input_hub'
            ]
            hub_records = [record for record in hub_records if record['bounds']]
            hub_record = max(
                hub_records,
                key=lambda record: record['bounds'].get('width_in', 0.0) * record['bounds'].get('height_in', 0.0),
                default=None,
            )
            connector_records = [
                {
                    'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
                    'role': shape_role(shape),
                    'kind': shape_kind(shape),
                    'bounds': bounds_in(shape),
                    'arrow_end': shape_arrow_end(shape),
                }
                for shape in shapes
                if safe_text(shape.get('layout_zone_id')) == 'status_zone'
                and shape_kind(shape) in {'line', 'connector'}
                and any(token in shape_role(shape) for token in ('flow_connector', 'merge_connector', 'connector'))
            ]
            connector_records = [record for record in connector_records if record['bounds']]
            try:
                hub_width_min = float(capacity_rules.get('input_hub_width_in_min') or 10.4)
            except (TypeError, ValueError):
                hub_width_min = 10.4
            try:
                hub_height_min = float(capacity_rules.get('input_hub_height_in_min') or 0.0)
            except (TypeError, ValueError):
                hub_height_min = 0.0
            try:
                hub_font_min = float(capacity_rules.get('input_hub_font_pt_min') or 0.0)
            except (TypeError, ValueError):
                hub_font_min = 0.0
            try:
                hub_center_tolerance = float(capacity_rules.get('input_hub_center_tolerance_in') or 0.35)
            except (TypeError, ValueError):
                hub_center_tolerance = 0.35
            try:
                connector_alignment_tolerance = float(capacity_rules.get('connector_card_center_tolerance_in') or 0.22)
            except (TypeError, ValueError):
                connector_alignment_tolerance = 0.22
            try:
                connector_vertical_width_max = float(capacity_rules.get('connector_vertical_width_in_max') or 0.0)
            except (TypeError, ValueError):
                connector_vertical_width_max = 0.0
            try:
                connector_vertical_height_min = float(capacity_rules.get('connector_vertical_height_in_min') or 0.0)
            except (TypeError, ValueError):
                connector_vertical_height_min = 0.0
            try:
                connector_hub_gap_max = float(capacity_rules.get('connector_hub_gap_in_max') or 0.12)
            except (TypeError, ValueError):
                connector_hub_gap_max = 0.12
            horizontal_bus_allowed = capacity_rules.get('horizontal_connector_bus_allowed') is True
            if not hub_record:
                failures.append({
                    'reason': 'ai_first_native_sample_input_hub_missing',
                    'selected_archetype': archetype,
                    'repair_instruction': 'Add one wide input_hub shape above the three route cards. It must be a visible hub card owned by the AI plan, not a small dot or implied label.',
                })
            elif panel_records:
                hub_bounds = hub_record['bounds']
                row_left = min(record['bounds']['left_in'] for record in panel_records)
                row_right = max(rect_right(record['bounds']) for record in panel_records)
                row_center = (row_left + row_right) / 2.0
                if hub_bounds.get('width_in', 0.0) < hub_width_min:
                    failures.append({
                        'reason': 'ai_first_native_sample_input_hub_too_small',
                        'selected_archetype': archetype,
                        'shape_id': hub_record['shape_id'],
                        'width_in': round(hub_bounds.get('width_in', 0.0), 4),
                        'minimum_width_in': round(hub_width_min, 4),
                        'repair_instruction': 'Make input_hub a broad shared-input card centered over the three route cards. It should visually read as the common source for all routes, not a small label attached to one card.',
                    })
                if hub_height_min > 0 and hub_bounds.get('height_in', 0.0) < hub_height_min:
                    failures.append({
                        'reason': 'ai_first_native_sample_input_hub_too_short',
                        'selected_archetype': archetype,
                        'shape_id': hub_record['shape_id'],
                        'height_in': round(hub_bounds.get('height_in', 0.0), 4),
                        'minimum_height_in': round(hub_height_min, 4),
                        'repair_instruction': 'Make input_hub tall enough to read as a major shared-input node, not a narrow chip. Keep it centered and spanning the route row.',
                    })
                hub_font_size = shape_font_size(next(
                    (shape for shape in shapes if safe_text(shape.get('shape_id')) == hub_record['shape_id']),
                    {},
                ))
                if hub_font_min > 0 and hub_record['text'] and hub_font_size < hub_font_min:
                    failures.append({
                        'reason': 'ai_first_native_sample_input_hub_font_too_small',
                        'selected_archetype': archetype,
                        'shape_id': hub_record['shape_id'],
                        'font_size': round(hub_font_size, 2),
                        'required_font_size': round(hub_font_min, 2),
                        'repair_instruction': 'Use a readable hub label font so the shared-input node has clear visual priority over connector lines.',
                    })
                hub_center_delta = abs(rect_center_x(hub_bounds) - row_center)
                if hub_center_delta > hub_center_tolerance:
                    failures.append({
                        'reason': 'ai_first_native_sample_input_hub_not_centered',
                        'selected_archetype': archetype,
                        'shape_id': hub_record['shape_id'],
                        'hub_center_x_in': round(rect_center_x(hub_bounds), 4),
                        'route_row_center_x_in': round(row_center, 4),
                        'maximum_delta_in': round(hub_center_tolerance, 4),
                        'repair_instruction': 'Center input_hub over the three-card route row before drawing connectors. The shared input must not sit over only the left route card.',
                    })
                card_centers = [rect_center_x(record['bounds']) for record in panel_records]
                card_top = min(record['bounds']['top_in'] for record in panel_records)
                hub_bottom = rect_bottom(hub_bounds)
                if capacity_rules.get('input_hub_spans_route_card_centers_required') is True and (
                    hub_bounds['left_in'] > min(card_centers) - connector_alignment_tolerance
                    or rect_right(hub_bounds) < max(card_centers) + connector_alignment_tolerance
                ):
                    failures.append({
                        'reason': 'ai_first_native_sample_input_hub_does_not_span_card_centers',
                        'selected_archetype': archetype,
                        'shape_id': hub_record['shape_id'],
                        'hub_left_in': round(hub_bounds['left_in'], 4),
                        'hub_right_in': round(rect_right(hub_bounds), 4),
                        'left_card_center_in': round(min(card_centers), 4),
                        'right_card_center_in': round(max(card_centers), 4),
                        'repair_instruction': 'Widen input_hub so its visual body spans the left, middle, and right route-card centers. The hub should be the shared source node, not a compact label above the middle card.',
                    })
                horizontal_bus = [
                    record for record in connector_records
                    if record['bounds']['width_in'] >= max(0.8, record['bounds']['height_in'] * 2.0)
                    and rect_center_y(record['bounds']) >= hub_bottom - 0.18
                    and rect_center_y(record['bounds']) <= card_top + 0.18
                    and record['bounds']['left_in'] <= min(card_centers) + connector_alignment_tolerance
                    and rect_right(record['bounds']) >= max(card_centers) - connector_alignment_tolerance
                    and rect_right(record['bounds']) >= hub_bounds['left_in']
                    and record['bounds']['left_in'] <= rect_right(hub_bounds)
                ]
                vertical_connectors = [
                    record for record in connector_records
                    if record['bounds']['height_in'] >= max(0.2, record['bounds']['width_in'] * 2.0)
                ]
                matched_vertical = []
                missing_card_ids = []
                undirected_card_ids = []
                non_connector_card_ids = []
                non_vertical_card_ids = []
                for panel_record, card_center in zip(panel_records, card_centers):
                    candidates = [
                        record for record in vertical_connectors
                        if abs(rect_center_x(record['bounds']) - card_center) <= connector_alignment_tolerance
                        and rect_bottom(record['bounds']) >= panel_record['bounds']['top_in'] - 0.28
                        and rect_bottom(record['bounds']) <= panel_record['bounds']['top_in'] + 0.32
                        and record['bounds']['top_in'] >= hub_bottom - 0.28
                        and record['bounds']['top_in'] <= panel_record['bounds']['top_in']
                    ]
                    if not candidates:
                        missing_card_ids.append(panel_record['shape_id'])
                        continue
                    connector_candidates = [
                        record for record in candidates
                        if record['kind'] == 'connector'
                    ]
                    matched = (connector_candidates or candidates)[0]
                    matched_vertical.append(matched)
                    if matched['kind'] != 'connector':
                        non_connector_card_ids.append(panel_record['shape_id'])
                    if not matched['arrow_end']:
                        undirected_card_ids.append(panel_record['shape_id'])
                    if (
                        connector_vertical_width_max > 0
                        and matched['bounds'].get('width_in', 0.0) > connector_vertical_width_max
                    ) or (
                        connector_vertical_height_min > 0
                        and matched['bounds'].get('height_in', 0.0) < connector_vertical_height_min
                    ):
                        non_vertical_card_ids.append(panel_record['shape_id'])
                    if abs(matched['bounds']['top_in'] - hub_bottom) > connector_hub_gap_max:
                        failures.append({
                            'reason': 'ai_first_native_sample_connector_detached_from_hub',
                            'selected_archetype': archetype,
                            'shape_id': matched['shape_id'],
                            'card_shape_id': panel_record['shape_id'],
                            'connector_top_in': round(matched['bounds']['top_in'], 4),
                            'hub_bottom_in': round(hub_bottom, 4),
                            'maximum_gap_in': round(connector_hub_gap_max, 4),
                            'repair_instruction': 'Start each vertical route-card arrow at the input_hub bottom edge. The arrow should read as dropping directly from the hub, not from a separate bus line or floating tick.',
                        })
                if len(set(record['shape_id'] for record in matched_vertical)) != 3:
                    failures.append({
                        'reason': 'ai_first_native_sample_connector_count_invalid',
                        'selected_archetype': archetype,
                        'vertical_connector_count': len(set(record['shape_id'] for record in matched_vertical)),
                        'expected_vertical_connector_count': 3,
                        'repair_instruction': 'Use exactly three vertical route-card connectors: one straight arrow from the hub bottom to each card top center.',
                    })
                if horizontal_bus and not horizontal_bus_allowed:
                    failures.append({
                        'reason': 'ai_first_native_sample_horizontal_bus_forbidden',
                        'selected_archetype': archetype,
                        'shape_ids': [record['shape_id'] for record in horizontal_bus],
                        'repair_instruction': 'Remove the horizontal connector bus. The wide input_hub itself is the shared source; draw only three vertical arrows from the hub to the card top centers.',
                    })
                if missing_card_ids:
                    failures.append({
                        'reason': 'ai_first_native_sample_connector_card_alignment_invalid',
                        'selected_archetype': archetype,
                        'missing_aligned_card_shape_ids': missing_card_ids,
                        'maximum_center_delta_in': round(connector_alignment_tolerance, 4),
                        'repair_instruction': 'Place one vertical arrow/drop connector for each route card, with its center x aligned to that card center and its bottom landing on the top edge of the card.',
                    })
                if undirected_card_ids:
                    failures.append({
                        'reason': 'ai_first_native_sample_connector_direction_missing',
                        'selected_archetype': archetype,
                        'undirected_card_shape_ids': undirected_card_ids,
                        'repair_instruction': 'Set arrow direction on each route-card connector, for example tailEnd=triangle or line.end_arrow=true, so the flow reads from input hub into the card.',
                    })
                if non_connector_card_ids:
                    failures.append({
                        'reason': 'ai_first_native_sample_connector_kind_invalid',
                        'selected_archetype': archetype,
                        'non_connector_card_shape_ids': non_connector_card_ids,
                        'repair_instruction': 'Use kind=connector for each route-card arrow. kind=line is not accepted for the card landing arrows because native PPTX export must materialize real connector shapes.',
                    })
                if non_vertical_card_ids:
                    failures.append({
                        'reason': 'ai_first_native_sample_connector_not_vertical_drop',
                        'selected_archetype': archetype,
                        'non_vertical_card_shape_ids': non_vertical_card_ids,
                        'maximum_width_in': round(connector_vertical_width_max, 4) if connector_vertical_width_max > 0 else None,
                        'minimum_height_in': round(connector_vertical_height_min, 4) if connector_vertical_height_min > 0 else None,
                        'repair_instruction': 'Use straight vertical card landing arrows from the hub bottom to each card top center. Do not use slanted elbows, short ticks, or wide diagonal connector boxes for the three drops.',
                    })
        if 'takeaway_zone' in zone_ids or role_counts.get('takeaway', 0) > 0 or role_counts.get('takeaway_panel', 0) > 0:
            failures.append({
                'reason': 'ai_first_native_sample_status_board_overloaded_with_takeaway',
                'selected_archetype': archetype,
                'repair_instruction': 'Use title + claim + status cards + one proof band only; merge takeaway text into the claim or proof sentence.',
            })
        if role_counts.get('evidence_axis', 0) > 0 and role_counts.get('evidence_item', 0) > 0:
            failures.append({
                'reason': 'ai_first_native_sample_evidence_axis_text_collision_risk',
                'selected_archetype': archetype,
                'repair_instruction': 'Use a proof_band container or an evidence_axis, not both with proof text in the same compact bottom zone.',
            })
    if archetype == 'sample_decision_proof_split':
        if not role_has('decision_rail', 'decision_connector', 'proof_rail'):
            failures.append({
                'reason': 'ai_first_native_sample_decision_rail_missing',
                'selected_archetype': archetype,
                'repair_instruction': 'Add a visible decision_rail or proof_rail connecting the decision panel to the proof stack and bottom takeaway band.',
            })
    return failures
