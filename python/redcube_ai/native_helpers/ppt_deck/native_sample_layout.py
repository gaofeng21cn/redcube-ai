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
