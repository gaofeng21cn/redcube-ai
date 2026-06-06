import re

from redcube_ai.native_helpers.ppt_deck.native_layout_constants import (
    AUXILIARY_TEXT_ROLES,
    CONTENT_DEPTH_EXCLUDED_ROLES,
    GENERIC_NON_TEXT_VISUAL_FRAGMENTS,
    LAYOUT_INTENT_REQUIRED_FIELDS,
    MECHANICAL_CARD_PANEL_ROLES,
    STRUCTURAL_VISUAL_ROLE_HINTS,
)
from redcube_ai.native_helpers.ppt_deck.native_layout_text_safety import (
    recommended_quality_role as text_safety_recommended_quality_role,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_metrics import ai_shape_quality_role

__all__ = [
    'layout_intent_failures',
    'layout_intent_has_structural_hint',
    'structural_visual_shape',
    'mechanical_card_panel_shape',
    'audience_content_slot_shape',
    'visual_structure_failures',
    'recommended_quality_role',
]


def layout_intent_failures(slide_data: dict) -> list[dict]:
    layout_intent = slide_data.get('layout_intent')
    if not isinstance(layout_intent, dict):
        return [{'reason': 'ai_first_layout_intent_missing'}]
    failures = []
    missing_fields = [
        field for field in LAYOUT_INTENT_REQUIRED_FIELDS
        if field not in layout_intent or (
            field != 'forbidden_template_reuse_checked'
            and not safe_text(layout_intent.get(field))
        )
    ]
    if missing_fields:
        failures.append({
            'reason': 'ai_first_layout_intent_incomplete',
            'missing_fields': missing_fields,
        })
    if layout_intent.get('forbidden_template_reuse_checked') is not True:
        failures.append({'reason': 'ai_first_template_reuse_not_checked'})
    non_text_visual = safe_text(layout_intent.get('non_text_visual')).lower()
    has_structural_hint = layout_intent_has_structural_hint(non_text_visual)
    if (
        non_text_visual
        and not has_structural_hint
        and any(fragment in non_text_visual for fragment in GENERIC_NON_TEXT_VISUAL_FRAGMENTS)
    ):
        failures.append({
            'reason': 'ai_first_non_text_visual_too_generic',
            'non_text_visual': layout_intent.get('non_text_visual'),
        })
    return failures


def layout_intent_has_structural_hint(non_text_visual: str) -> bool:
    tokens = set(re.findall(r'[a-z0-9_]+', non_text_visual.lower()))
    singular_tokens = {token[:-1] for token in tokens if len(token) > 3 and token.endswith('s')}
    return bool((tokens | singular_tokens).intersection(STRUCTURAL_VISUAL_ROLE_HINTS))


def structural_visual_shape(shape_spec: dict) -> bool:
    role = safe_text(shape_spec.get('role')).lower()
    kind = shape_kind(shape_spec)
    if kind in {'chart', 'table', 'metric_grid'}:
        return True
    if kind in {'line', 'connector', 'oval', 'circle'} and role not in {'accent_dot', 'page_number'}:
        return True
    return kind in {'line', 'connector', 'oval', 'circle', 'rect', 'rounded_rect', 'panel'} and any(
        hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS
    )


def mechanical_card_panel_shape(shape_spec: dict) -> bool:
    role = safe_text(shape_spec.get('role')).lower()
    if role in MECHANICAL_CARD_PANEL_ROLES:
        return True
    return role.endswith('_panel') and not any(hint in role for hint in STRUCTURAL_VISUAL_ROLE_HINTS)


def audience_content_slot_shape(shape_spec: dict) -> bool:
    if ai_shape_quality_role(shape_spec) != 'content':
        return False
    if not ai_shape_text(shape_spec):
        return False
    role = safe_text(shape_spec.get('role')).lower()
    if role in {
        'title',
        'subtitle',
        'core_sentence',
        'point_index',
        *CONTENT_DEPTH_EXCLUDED_ROLES,
        *AUXILIARY_TEXT_ROLES,
    }:
        return False
    return True


def visual_structure_failures(shapes: list[dict]) -> list[dict]:
    structural_count = sum(1 for shape in shapes if structural_visual_shape(shape))
    panel_count = sum(1 for shape in shapes if mechanical_card_panel_shape(shape))
    audience_slot_count = sum(1 for shape in shapes if audience_content_slot_shape(shape))
    failures = []
    if structural_count < 1:
        failures.append({
            'reason': 'ai_first_visual_structure_missing',
            'structural_visual_count': structural_count,
        })
    if panel_count >= 2 and audience_slot_count >= 2 and structural_count < 1:
        failures.append({
            'reason': 'ai_first_mechanical_card_template_detected',
            'panel_count': panel_count,
            'audience_content_slot_count': audience_slot_count,
        })
    return failures


def recommended_quality_role(shape_spec: dict) -> str:
    return text_safety_recommended_quality_role(
        shape_spec,
        ai_shape_text=ai_shape_text,
        shape_kind=shape_kind,
        structural_visual_shape=structural_visual_shape,
        safe_text=safe_text,
    )
