def safe_text(value, fallback: str = '') -> str:
    text = str(value or '').strip()
    return text or fallback


def safe_list(value):
    return value if isinstance(value, list) else []


def validate_template_layout_grammar(plan: dict) -> list[dict]:
    grammar = plan.get('template_layout_grammar') if isinstance(plan.get('template_layout_grammar'), dict) else {}
    catalog = safe_list(grammar.get('archetype_catalog'))
    failures = []
    if safe_text(grammar.get('owner')) != 'llm_agent':
        failures.append({'reason': 'ai_first_template_layout_grammar_owner_invalid'})
    if grammar.get('required') is not True:
        failures.append({'reason': 'ai_first_template_layout_grammar_not_required'})
    if safe_text(grammar.get('materializer_role')) != 'execute_selected_archetype_zones_only':
        failures.append({'reason': 'ai_first_template_layout_materializer_boundary_invalid'})
    if grammar.get('helper_template_layout_allowed') is not False:
        failures.append({'reason': 'ai_first_template_layout_helper_allowed'})
    if len(catalog) < 3:
        failures.append({
            'reason': 'ai_first_template_layout_archetype_catalog_too_few',
            'actual': len(catalog),
            'minimum': 3,
        })
    return failures


def allowed_template_archetypes(plan: dict) -> set[str]:
    grammar = plan.get('template_layout_grammar') if isinstance(plan.get('template_layout_grammar'), dict) else {}
    return {
        safe_text(entry.get('archetype_id'))
        for entry in safe_list(grammar.get('archetype_catalog'))
        if isinstance(entry, dict) and safe_text(entry.get('archetype_id'))
    }


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
    zone_ids = {
        safe_text(zone.get('zone_id'))
        for zone in zones
        if safe_text(zone.get('zone_id'))
    }
    failures.extend(_shape_binding_failures(shapes, zone_ids, quality_role))
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


def _shape_binding_failures(shapes: list[dict], zone_ids: set[str], quality_role) -> list[dict]:
    failures = []
    for shape in shapes:
        role = safe_text(shape.get('role'))
        if quality_role(shape) == 'decorative' or role in {'page_number', 'page_no', 'footer', 'cover_meta', 'meta'}:
            continue
        layout_zone_id = safe_text(shape.get('layout_zone_id'))
        if layout_zone_id and layout_zone_id in zone_ids:
            continue
        failures.append({
            'reason': 'ai_first_shape_layout_zone_binding_missing',
            'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
            'role': role,
            'layout_zone_id': layout_zone_id,
        })
    return failures
