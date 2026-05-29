import math
import json


def safe_text(value, fallback: str = '') -> str:
    text = str(value or '').strip()
    return text or fallback


def safe_list(value):
    return value if isinstance(value, list) else []


def connector_direction_failure(shape_id: str, role: str) -> dict:
    return {
        'reason': 'ai_first_connector_direction_missing',
        'shape_id': shape_id,
        'role': role,
        'required': 'connector shape must declare flow direction with headEnd/tailEnd or line.begin_arrow/end_arrow',
        'repair_instruction': 'Set a connector arrow endpoint so Office materializes semantic flow direction instead of an untyped line.',
    }


def manifest_metric_failure_details(metrics: dict, issue: str) -> dict:
    if issue == 'visual_density_out_of_range':
        return {'occupied_ratio': metrics.get('occupied_ratio')}
    if issue == 'layout_density_too_sparse':
        return {
            'occupied_ratio': metrics.get('occupied_ratio'),
            'card_blank_ratio': metrics.get('card_blank_ratio'),
        }
    if issue == 'layout_richness_below_threshold':
        return {'layout_richness_score': metrics.get('layout_richness_score')}
    if issue == 'edge_clearance_out_of_range':
        return {'edge_clearance': metrics.get('edge_clearance')}
    if issue == 'occlusion_detected':
        return {
            'overlap_pairs': metrics.get('overlaps') or [],
            'structural_text_collisions': metrics.get('structural_text_collisions') or [],
        }
    if issue == 'structural_text_collision_detected':
        return {'structural_text_collisions': metrics.get('structural_text_collisions') or []}
    if issue == 'block_content_overflow_detected':
        return {'block_content_failures': metrics.get('block_content_failures') or []}
    if issue == 'body_text_below_readability_floor':
        return {'body_text_font_failures': metrics.get('body_text_font_failures') or []}
    if issue == 'title_core_overlap_detected':
        return {'title_core_overlap_failures': metrics.get('title_core_overlap_failures') or []}
    if issue == 'native_slot_fill_failed':
        return {'slot_fill_failures': metrics.get('slot_fill_failures') or []}
    if issue == 'audience_label_below_readability_floor':
        return {'audience_label_readability_failures': metrics.get('audience_label_readability_failures') or []}
    if issue == 'native_content_depth_failed':
        return {'content_depth_failures': metrics.get('content_depth_failures') or []}
    if issue == 'native_grid_balance_failed':
        return {'grid_balance_failures': metrics.get('grid_balance_failures') or []}
    if issue == 'title_underline_motif_detected':
        return {'title_underline_failures': metrics.get('title_underline_failures') or []}
    if issue == 'operator_language_leak_detected':
        return {'operator_language_fragments': metrics.get('operator_language_fragments') or []}
    if issue == 'title_safe_zone_obstructed':
        return {'title_safe_zone_failures': metrics.get('title_safe_zone_failures') or []}
    if issue in {'table_font_below_minimum', 'table_cell_fit_failed'}:
        return {'table_legibility_failures': metrics.get('table_legibility_failures') or []}
    if issue == 'native_visual_structure_missing':
        return {'structural_visual_count': metrics.get('structural_visual_count')}
    if issue == 'native_non_text_visual_too_generic':
        return {
            'structural_visual_count': metrics.get('structural_visual_count'),
            'structural_visual_roles': metrics.get('structural_visual_roles') or [],
        }
    if issue == 'native_mechanical_card_template_detected':
        return {
            'card_panel_count': metrics.get('card_panel_count'),
            'audience_content_slot_count': metrics.get('audience_content_slot_count'),
            'structural_visual_count': metrics.get('structural_visual_count'),
        }
    if issue == 'panel_text_safe_area_violation':
        return {'panel_text_safe_area_failures': metrics.get('panel_text_safe_area_failures') or []}
    if issue == 'text_card_internal_padding_too_small':
        return {'text_card_internal_padding_failures': metrics.get('text_card_internal_padding_failures') or []}
    if issue == 'short_label_unbalanced_wrap':
        return {'short_label_wrap_failures': metrics.get('short_label_wrap_failures') or []}
    return {}


def deck_layout_rhythm_limits(manifest_slides: list[dict]) -> dict:
    default_limits = {
        'repeated_concrete_composition_limit': 2,
        'required_distinct_composition_share': 0.75,
    }
    for slide in manifest_slides:
        layout_rhythm = slide.get('_deck_layout_rhythm') if isinstance(slide.get('_deck_layout_rhythm'), dict) else {}
        try:
            repeated_limit = int(float(layout_rhythm.get('repeated_concrete_composition_limit')))
        except (TypeError, ValueError):
            repeated_limit = default_limits['repeated_concrete_composition_limit']
        try:
            distinct_share = float(layout_rhythm.get('required_distinct_composition_share'))
        except (TypeError, ValueError):
            distinct_share = default_limits['required_distinct_composition_share']
        return {
            'repeated_concrete_composition_limit': max(1, repeated_limit),
            'required_distinct_composition_share': max(0.0, min(distinct_share, 1.0)),
        }
    return default_limits


def deck_composition_rhythm_failures(manifest_slides: list[dict]) -> list[dict]:
    if len(manifest_slides) < 3:
        return []
    limits = deck_layout_rhythm_limits(manifest_slides)
    repeated_limit = limits['repeated_concrete_composition_limit']
    required_share = limits['required_distinct_composition_share']
    composition_rows = [
        {
            'slide_id': safe_text(slide.get('slide_id')),
            'layout_family': safe_text(slide.get('layout_family')),
            'signature': safe_text((slide.get('metrics') or {}).get('composition_signature')),
        }
        for slide in manifest_slides
    ]
    signature_groups = {}
    for row in composition_rows:
        if not row['signature']:
            continue
        signature_groups.setdefault(row['signature'], []).append(row)
    failures = []
    for signature, members in sorted(signature_groups.items()):
        if len(members) > repeated_limit:
            failures.append({
                'reason': 'native_deck_repeated_composition_signature_limit_exceeded',
                'composition_signature': signature,
                'slide_ids': [member['slide_id'] for member in members],
                'layout_families': [member['layout_family'] for member in members],
                'actual': len(members),
                'maximum': repeated_limit,
            })
    if len([row for row in composition_rows if row['signature']]) == len(manifest_slides):
        distinct_count = len(signature_groups)
        required_count = max(1, int(math.ceil(len(manifest_slides) * required_share)))
        if distinct_count < required_count:
            failures.append({
                'reason': 'native_deck_distinct_composition_share_too_low',
                'actual_distinct_composition_count': distinct_count,
                'required_distinct_composition_count': required_count,
                'slide_count': len(manifest_slides),
                'required_distinct_composition_share': required_share,
            })
    return failures


def manifest_qa_failures(manifest_slides: list[dict]) -> list[dict]:
    failures = []
    for slide in manifest_slides:
        issues = [safe_text(issue) for issue in safe_list(slide.get('issues')) if safe_text(issue)]
        if not issues:
            continue
        metrics = slide.get('metrics') if isinstance(slide.get('metrics'), dict) else {}
        checks = slide.get('checks') if isinstance(slide.get('checks'), dict) else {}
        failures.append({
            'reason': 'native_pptx_manifest_slide_quality_failed',
            'slide_id': safe_text(slide.get('slide_id')),
            'title': safe_text(slide.get('title')),
            'issues': issues,
            'failed_checks': sorted(key for key, value in checks.items() if value is False),
            'metric_failures': {
                issue: manifest_metric_failure_details(metrics, issue)
                for issue in issues
            },
            'core_metrics': {
                'occupied_ratio': metrics.get('occupied_ratio'),
                'edge_clearance': metrics.get('edge_clearance'),
                'layout_richness_score': metrics.get('layout_richness_score'),
                'layout_variant': metrics.get('layout_variant'),
                'composition_signature': metrics.get('composition_signature'),
                'overlap_pairs': metrics.get('overlap_pairs'),
                'structural_text_collision_count': metrics.get('structural_text_collision_count'),
                'min_body_font_pt': metrics.get('min_body_font_pt'),
                'body_text_readability_floor_pt': metrics.get('body_text_readability_floor_pt'),
            },
            'repair_instruction': 'Revise the AI editable_shape_plan for this slide; the Office/Python materializer must not redesign, relayout, hide, or silently tolerate manifest QA failures.',
        })
    for failure in deck_composition_rhythm_failures(manifest_slides):
        failures.append({
            'reason': failure['reason'],
            'slide_id': '__deck__',
            'title': 'Deck composition rhythm',
            'issues': [failure['reason']],
            'failed_checks': ['deck_composition_rhythm_ok'],
            'metric_failures': {'deck_composition_rhythm': failure},
            'core_metrics': {
                'composition_signatures': [
                    {
                        'slide_id': safe_text(slide.get('slide_id')),
                        'composition_signature': safe_text((slide.get('metrics') or {}).get('composition_signature')),
                    }
                    for slide in manifest_slides
                ],
            },
            'repair_instruction': 'Revise the AI editable_shape_plan so concrete composition signatures respect the deck layout rhythm; the materializer cannot reuse templates or redesign pages for the agent.',
        })
    return failures


def fail_closed_on_manifest_qa(manifest_slides: list[dict]) -> None:
    failures = manifest_qa_failures(manifest_slides)
    if not failures:
        return
    raise RuntimeError(
        'native PPTX manifest QA failed: '
        + json.dumps({
            'reason': 'native_pptx_manifest_quality_gate_failed',
            'failure_count': len(failures),
            'fail_closed': True,
            'helper_fallback_used': False,
            'materializer_role': 'execute_ai_spatial_plan_only',
            'failures': failures,
        }, ensure_ascii=False, sort_keys=True)
    )
