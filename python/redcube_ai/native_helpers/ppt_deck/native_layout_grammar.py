def safe_text(value, fallback: str = '') -> str:
    text = str(value or '').strip()
    return text or fallback


def safe_list(value):
    return value if isinstance(value, list) else []


SAMPLE_TEMPLATE_ARCHETYPES = {
    'sample_status_proof_board',
    'sample_decision_proof_split',
}

REQUIRED_REFERENCE_DISCIPLINE_FLAGS = [
    'template_profile_required',
    'semantic_layout_selection_required',
    'placeholder_capacity_required',
    'reference_deck_analysis_required',
    'action_title_required',
]

REQUIRED_REFERENCE_SOURCE_PROJECTS = {
    'ppt-master',
    'agent-slides',
    'PPTAgent',
    'pptx-from-layouts-skill',
    'officecli-pptx',
}


def _compact_sample_catalog_allowed(plan: dict, catalog: list[dict]) -> bool:
    if safe_text(plan.get('authoring_mode')) != 'native_visual_sample_compact':
        return False
    catalog_ids = {
        safe_text(entry.get('archetype_id'))
        for entry in catalog
        if isinstance(entry, dict) and safe_text(entry.get('archetype_id'))
    }
    return catalog_ids == SAMPLE_TEMPLATE_ARCHETYPES


def validate_template_layout_grammar(plan: dict) -> list[dict]:
    grammar = plan.get('template_layout_grammar') if isinstance(plan.get('template_layout_grammar'), dict) else {}
    catalog = safe_list(grammar.get('archetype_catalog'))
    minimum_catalog_size = 2 if _compact_sample_catalog_allowed(plan, catalog) else 3
    failures = []
    if safe_text(grammar.get('owner')) != 'llm_agent':
        failures.append({'reason': 'ai_first_template_layout_grammar_owner_invalid'})
    if grammar.get('required') is not True:
        failures.append({'reason': 'ai_first_template_layout_grammar_not_required'})
    if safe_text(grammar.get('materializer_role')) != 'execute_selected_archetype_zones_only':
        failures.append({'reason': 'ai_first_template_layout_materializer_boundary_invalid'})
    if grammar.get('helper_template_layout_allowed') is not False:
        failures.append({'reason': 'ai_first_template_layout_helper_allowed'})
    failures.extend(_reference_discipline_failures(grammar))
    if len(catalog) < minimum_catalog_size:
        failures.append({
            'reason': 'ai_first_template_layout_archetype_catalog_too_few',
            'actual': len(catalog),
            'minimum': minimum_catalog_size,
        })
    failures.extend(_archetype_catalog_failures(catalog))
    return failures


def _reference_discipline_failures(grammar: dict) -> list[dict]:
    reference_discipline = (
        grammar.get('reference_discipline')
        if isinstance(grammar.get('reference_discipline'), dict)
        else {}
    )
    failures = []
    for field in REQUIRED_REFERENCE_DISCIPLINE_FLAGS:
        if reference_discipline.get(field) is not True:
            failures.append({
                'reason': 'ai_first_template_layout_reference_discipline_missing',
                'field': field,
                'actual': reference_discipline.get(field),
            })
    source_projects = {
        safe_text(project)
        for project in safe_list(reference_discipline.get('source_projects'))
        if safe_text(project)
    }
    missing_projects = sorted(REQUIRED_REFERENCE_SOURCE_PROJECTS - source_projects)
    if missing_projects:
        failures.append({
            'reason': 'ai_first_template_layout_reference_source_projects_missing',
            'missing_source_projects': missing_projects,
            'required_source_projects': sorted(REQUIRED_REFERENCE_SOURCE_PROJECTS),
        })
    return failures


def _archetype_catalog_failures(catalog: list[dict]) -> list[dict]:
    failures = []
    for entry in catalog:
        if not isinstance(entry, dict):
            failures.append({'reason': 'ai_first_template_layout_archetype_entry_invalid'})
            continue
        archetype_id = safe_text(entry.get('archetype_id'))
        missing = [
            field for field in ('use_when', 'layout_description')
            if not safe_text(entry.get(field))
        ]
        required_zones = safe_list(entry.get('required_zones'))
        prohibited = safe_list(entry.get('prohibited'))
        content_schema = entry.get('content_schema') if isinstance(entry.get('content_schema'), dict) else {}
        if not archetype_id:
            failures.append({'reason': 'ai_first_template_layout_archetype_id_missing'})
            continue
        if missing:
            failures.append({
                'reason': 'ai_first_template_layout_archetype_incomplete',
                'archetype_id': archetype_id,
                'missing_fields': missing,
            })
        if len(required_zones) < 3:
            failures.append({
                'reason': 'ai_first_template_layout_archetype_required_zones_too_few',
                'archetype_id': archetype_id,
                'actual': len(required_zones),
                'minimum': 3,
            })
        if len(prohibited) < 1:
            failures.append({
                'reason': 'ai_first_template_layout_archetype_prohibited_rules_missing',
                'archetype_id': archetype_id,
            })
        if not safe_list(content_schema.get('required_shape_roles')):
            failures.append({
                'reason': 'ai_first_template_layout_archetype_content_schema_missing',
                'archetype_id': archetype_id,
            })
        if not safe_list(content_schema.get('required_shape_role_groups')):
            failures.append({
                'reason': 'ai_first_template_layout_archetype_role_groups_missing',
                'archetype_id': archetype_id,
            })
    return failures


def archetype_contracts(plan: dict) -> dict[str, dict]:
    grammar = plan.get('template_layout_grammar') if isinstance(plan.get('template_layout_grammar'), dict) else {}
    return {
        safe_text(entry.get('archetype_id')): entry
        for entry in safe_list(grammar.get('archetype_catalog'))
        if isinstance(entry, dict) and safe_text(entry.get('archetype_id'))
    }


def allowed_template_archetypes(plan: dict) -> set[str]:
    return set(archetype_contracts(plan).keys())


def template_archetype_contract_for_slide(slide_data: dict) -> dict:
    contract = slide_data.get('_template_archetype_contract')
    return contract if isinstance(contract, dict) else {}


def template_layout_binding_failures(slide_data: dict, shapes: list[dict], quality_role) -> list[dict]:
    binding = slide_data.get('template_layout_binding')
    if not isinstance(binding, dict):
        return [{'reason': 'ai_first_template_layout_binding_missing'}]
    failures = []
    selected_archetype = safe_text(binding.get('selected_archetype'))
    zones = [
        zone for zone in safe_list(binding.get('zones'))
        if isinstance(zone, dict)
    ]
    if not selected_archetype:
        failures.append({'reason': 'ai_first_template_layout_selected_archetype_missing'})
    if not safe_text(binding.get('archetype_instance_id')):
        failures.append({'reason': 'ai_first_template_layout_archetype_instance_missing'})
    if not safe_text(binding.get('rhythm_role')):
        failures.append({'reason': 'ai_first_template_layout_rhythm_role_missing'})
    failures.extend(_gap_failures(binding))
    failures.extend(_zone_failures(zones))
    failures.extend(_required_archetype_zone_failures(template_archetype_contract_for_slide(slide_data), zones))
    failures.extend(_archetype_content_schema_failures(
        template_archetype_contract_for_slide(slide_data),
        shapes,
        quality_role,
    ))
    zone_ids = {
        safe_text(zone.get('zone_id'))
        for zone in zones
        if safe_text(zone.get('zone_id'))
    }
    failures.extend(_shape_binding_failures(shapes, zone_ids, quality_role, zones))
    return failures


def _required_archetype_zone_failures(archetype_contract: dict, zones: list[dict]) -> list[dict]:
    required_zones = [
        safe_text(zone_id)
        for zone_id in safe_list(archetype_contract.get('required_zones'))
        if safe_text(zone_id)
    ]
    if not required_zones:
        return []
    zone_ids = {
        safe_text(zone.get('zone_id'))
        for zone in zones
        if isinstance(zone, dict) and safe_text(zone.get('zone_id'))
    }
    missing = [zone_id for zone_id in required_zones if zone_id not in zone_ids]
    if not missing:
        return []
    return [{
        'reason': 'ai_first_template_layout_required_zones_missing',
        'archetype_id': safe_text(archetype_contract.get('archetype_id')),
        'missing_zones': missing,
    }]


def _archetype_content_schema_failures(
    archetype_contract: dict,
    shapes: list[dict],
    quality_role,
) -> list[dict]:
    content_schema = (
        archetype_contract.get('content_schema')
        if isinstance(archetype_contract.get('content_schema'), dict)
        else {}
    )
    if not content_schema:
        return []
    failures = []
    role_groups = [
        safe_text(group_id)
        for group_id in safe_list(content_schema.get('required_shape_role_groups'))
        if safe_text(group_id)
    ]
    missing_role_groups = [
        group_id for group_id in role_groups
        if not _shape_role_group_satisfied(group_id, shapes, quality_role)
    ]
    if missing_role_groups:
        failures.append({
            'reason': 'ai_first_template_layout_required_role_group_missing',
            'archetype_id': safe_text(archetype_contract.get('archetype_id')),
            'missing_role_groups': missing_role_groups,
        })
    required_zones = [
        safe_text(zone_id)
        for zone_id in safe_list(archetype_contract.get('required_zones'))
        if safe_text(zone_id)
    ]
    if required_zones:
        min_share = _safe_float(content_schema.get('min_filled_required_zone_share'), 0.8)
        min_count = max(1, int(len(required_zones) * min_share + 0.999))
        filled_zone_ids = _filled_required_zone_ids(shapes, quality_role)
        filled_count = sum(1 for zone_id in required_zones if zone_id in filled_zone_ids)
        if filled_count < min_count:
            failures.append({
                'reason': 'ai_first_template_layout_required_zone_coverage_too_low',
                'archetype_id': safe_text(archetype_contract.get('archetype_id')),
                'filled_required_zone_count': filled_count,
                'required_filled_zone_count': min_count,
                'required_zone_count': len(required_zones),
                'unfilled_required_zones': [zone_id for zone_id in required_zones if zone_id not in filled_zone_ids],
            })
    max_text_shapes = _safe_int(content_schema.get('max_audience_text_shapes'), 0)
    if max_text_shapes > 0:
        text_shape_count = sum(1 for shape in shapes if _audience_text_shape(shape, quality_role))
        if text_shape_count > max_text_shapes:
            failures.append({
                'reason': 'ai_first_template_layout_audience_text_shape_count_too_high',
                'archetype_id': safe_text(archetype_contract.get('archetype_id')),
                'actual': text_shape_count,
                'maximum': max_text_shapes,
            })
    return failures


def _gap_failures(binding: dict) -> list[dict]:
    failures = []
    for field, minimum, reason in (
        ('zone_gap_in_min', 0.32, 'ai_first_template_layout_zone_gap_too_small'),
        ('zone_inset_in_min', 0.15, 'ai_first_template_layout_zone_inset_too_small'),
    ):
        try:
            value = float(binding.get(field) or 0)
        except (TypeError, ValueError):
            value = 0.0
        if value < minimum:
            failures.append({
                'reason': reason,
                field: round(value, 4),
                f'minimum_{field.replace("_min", "")}': minimum,
            })
    return failures


def _zone_failures(zones: list[dict]) -> list[dict]:
    failures = []
    if len(zones) < 3:
        failures.append({
            'reason': 'ai_first_template_layout_zones_too_few',
            'actual': len(zones),
            'minimum': 3,
        })
    for zone in zones:
        zone_id = safe_text(zone.get('zone_id'))
        bounds = zone.get('bounds') if isinstance(zone.get('bounds'), dict) else {}
        if not zone_id:
            failures.append({'reason': 'ai_first_template_layout_zone_id_missing'})
            continue
        missing = [
            field for field in ('semantic_role', 'intended_content')
            if not safe_text(zone.get(field))
        ]
        if missing:
            failures.append({
                'reason': 'ai_first_template_layout_zone_incomplete',
                'zone_id': zone_id,
                'missing_fields': missing,
            })
        failures.extend(_zone_bounds_failures(zone_id, bounds, zone))
    return failures


def _zone_bounds_failures(zone_id: str, bounds: dict, zone: dict) -> list[dict]:
    failures = []
    numeric = []
    for key in ('left_in', 'top_in', 'width_in', 'height_in'):
        try:
            numeric.append(float(bounds.get(key)))
        except (TypeError, ValueError):
            numeric.append(None)
    if any(value is None for value in numeric) or numeric[2] <= 0 or numeric[3] <= 0:
        failures.append({
            'reason': 'ai_first_template_layout_zone_bounds_invalid',
            'zone_id': zone_id,
        })
    try:
        safe_inset = float(zone.get('safe_inset_in') or 0)
    except (TypeError, ValueError):
        safe_inset = 0.0
    if safe_inset < 0.15:
        failures.append({
            'reason': 'ai_first_template_layout_zone_safe_inset_too_small',
            'zone_id': zone_id,
            'safe_inset_in': round(safe_inset, 4),
            'minimum_safe_inset_in': 0.15,
        })
    return failures


def _shape_binding_failures(shapes: list[dict], zone_ids: set[str], quality_role, zones: list[dict]) -> list[dict]:
    failures = []
    zones_by_id = {
        safe_text(zone.get('zone_id')): zone
        for zone in zones
        if isinstance(zone, dict) and safe_text(zone.get('zone_id'))
    }
    for shape in shapes:
        role = safe_text(shape.get('role'))
        if quality_role(shape) in {'decorative', 'auxiliary'}:
            continue
        if role in {'title', 'core_sentence'}:
            continue
        layout_zone_id = safe_text(shape.get('layout_zone_id'))
        if not layout_zone_id or layout_zone_id not in zone_ids:
            failures.append({
                'reason': 'ai_first_shape_layout_zone_binding_missing',
                'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
                'role': role,
                'layout_zone_id': layout_zone_id,
            })
            continue
        failures.extend(_shape_zone_fit_failures(shape, zones_by_id.get(layout_zone_id) or {}))
    return failures


def _shape_bounds(shape: dict) -> dict | None:
    bounds = shape.get('bounds') if isinstance(shape.get('bounds'), dict) else {}
    values = []
    for key in ('left_in', 'top_in', 'width_in', 'height_in'):
        try:
            values.append(float(bounds.get(key)))
        except (TypeError, ValueError):
            return None
    left, top, width, height = values
    if width <= 0 or height <= 0:
        return None
    return {
        'left_in': left,
        'top_in': top,
        'width_in': width,
        'height_in': height,
        'right_in': left + width,
        'bottom_in': top + height,
    }


def _zone_bounds(zone: dict) -> dict | None:
    bounds = zone.get('bounds') if isinstance(zone.get('bounds'), dict) else {}
    values = []
    for key in ('left_in', 'top_in', 'width_in', 'height_in'):
        try:
            values.append(float(bounds.get(key)))
        except (TypeError, ValueError):
            return None
    left, top, width, height = values
    if width <= 0 or height <= 0:
        return None
    return {
        'left_in': left,
        'top_in': top,
        'width_in': width,
        'height_in': height,
        'right_in': left + width,
        'bottom_in': top + height,
    }


def _shape_zone_fit_failures(shape: dict, zone: dict) -> list[dict]:
    shape_bounds = _shape_bounds(shape)
    zone_bounds = _zone_bounds(zone)
    if shape_bounds is None or zone_bounds is None:
        return []
    tolerance = 0.02
    required_inset = 0.02
    safe_left = zone_bounds['left_in'] + required_inset
    safe_top = zone_bounds['top_in'] + required_inset
    safe_right = zone_bounds['right_in'] - required_inset
    safe_bottom = zone_bounds['bottom_in'] - required_inset
    if (
        shape_bounds['left_in'] >= safe_left - tolerance
        and shape_bounds['top_in'] >= safe_top - tolerance
        and shape_bounds['right_in'] <= safe_right + tolerance
        and shape_bounds['bottom_in'] <= safe_bottom + tolerance
    ):
        return []
    return [{
        'reason': 'ai_first_shape_outside_template_layout_zone',
        'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
        'role': safe_text(shape.get('role')),
        'layout_zone_id': safe_text(shape.get('layout_zone_id')),
        'required_zone_inset_in': required_inset,
        'zone_bounds': {
            'left_in': round(zone_bounds['left_in'], 4),
            'top_in': round(zone_bounds['top_in'], 4),
            'width_in': round(zone_bounds['width_in'], 4),
            'height_in': round(zone_bounds['height_in'], 4),
        },
        'zone_safe_bounds': {
            'left_in': round(safe_left, 4),
            'top_in': round(safe_top, 4),
            'right_in': round(safe_right, 4),
            'bottom_in': round(safe_bottom, 4),
        },
        'shape_bounds': {
            'left_in': round(shape_bounds['left_in'], 4),
            'top_in': round(shape_bounds['top_in'], 4),
            'width_in': round(shape_bounds['width_in'], 4),
            'height_in': round(shape_bounds['height_in'], 4),
        },
        'required_delta_in': {
            'left': round(max(0.0, safe_left - shape_bounds['left_in']), 4),
            'top': round(max(0.0, safe_top - shape_bounds['top_in']), 4),
            'right': round(max(0.0, shape_bounds['right_in'] - safe_right), 4),
            'bottom': round(max(0.0, shape_bounds['bottom_in'] - safe_bottom), 4),
        },
    }]


def _safe_float(value, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _safe_int(value, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _shape_text(shape: dict) -> str:
    return safe_text(
        shape.get('editable_text')
        or shape.get('text')
        or shape.get('label')
    )


def _audience_text_shape(shape: dict, quality_role) -> bool:
    if quality_role(shape) != 'content':
        return False
    kind = safe_text(shape.get('kind') or shape.get('type')).lower()
    if kind not in {'text', 'text_box'}:
        return False
    role = safe_text(shape.get('role')).lower()
    if role in {'page_number', 'page_no', 'footer', 'cover_meta', 'meta', 'point_index'}:
        return False
    return bool(_shape_text(shape))


def _visible_content_shape(shape: dict, quality_role) -> bool:
    if quality_role(shape) not in {'content', 'structural'}:
        return False
    role = safe_text(shape.get('role')).lower()
    if role in {'page_number', 'page_no', 'footer', 'cover_meta', 'meta'}:
        return False
    kind = safe_text(shape.get('kind') or shape.get('type')).lower()
    return bool(_shape_text(shape)) or kind in {'rect', 'rectangle', 'rounded_rect', 'panel', 'oval', 'circle', 'line', 'connector'}


def _filled_required_zone_ids(shapes: list[dict], quality_role) -> set[str]:
    return {
        safe_text(shape.get('layout_zone_id'))
        for shape in shapes
        if safe_text(shape.get('layout_zone_id')) and _visible_content_shape(shape, quality_role)
    }


def _shape_role_group_satisfied(group_id: str, shapes: list[dict], quality_role) -> bool:
    for shape in shapes:
        role = safe_text(shape.get('role')).lower()
        kind = safe_text(shape.get('kind') or shape.get('type')).lower()
        if group_id == 'title_text' and role == 'title' and _shape_text(shape):
            return True
        if group_id == 'core_claim_text' and role == 'core_sentence' and _shape_text(shape):
            return True
        if group_id == 'audience_body_text' and _audience_text_shape(shape, quality_role):
            return True
        if group_id == 'structural_visual' and quality_role(shape) == 'structural':
            return True
        if group_id == 'structural_visual' and kind in {'line', 'connector', 'oval', 'circle'}:
            return True
        if group_id == 'input_hub' and 'input_hub' in role:
            if kind in {'oval', 'circle', 'rect', 'rectangle', 'rounded_rect', 'panel'}:
                return True
        if group_id == 'flow_connector' and any(token in role for token in ('flow_connector', 'merge_connector', 'connector')):
            if kind in {'line', 'connector'}:
                return True
        if group_id == 'decision_rail' and any(token in role for token in ('decision_rail', 'decision_connector', 'proof_rail')):
            if kind in {'line', 'connector', 'rect', 'rectangle', 'rounded_rect', 'panel'}:
                return True
        if group_id == 'content_container' and kind in {'rect', 'rectangle', 'rounded_rect', 'panel'}:
            if quality_role(shape) in {'content', 'structural'}:
                return True
        if group_id == 'evidence_or_metric_text' and any(token in role for token in ('evidence', 'metric', 'proof')):
            if _shape_text(shape):
                return True
        if group_id == 'takeaway_text' and 'takeaway' in role and _shape_text(shape):
            return True
        if group_id == 'timeline_marker' and any(token in role for token in ('timeline', 'milestone')):
            return True
        if group_id == 'matrix_or_compare_container':
            layout_zone_id = safe_text(shape.get('layout_zone_id')).lower()
            if (
                any(token in role for token in ('matrix', 'compare', 'comparison'))
                or layout_zone_id in {'matrix_zone', 'signal_zone'}
            ) and kind in {'rect', 'rectangle', 'rounded_rect', 'panel'}:
                return True
        if group_id == 'gate_or_route_label' and any(token in role for token in ('gate', 'route')):
            if _shape_text(shape) or kind in {'rect', 'rectangle', 'rounded_rect', 'panel'}:
                return True
    return False
