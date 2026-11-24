"""Focused helpers for native PPT quality evaluation."""

from __future__ import annotations

import importlib

_EXPORTS: dict[str, tuple[str, ...]] = {
    'redcube_ai.native_helpers.ppt_deck.native_quality.geometry': (
        'bucket_px',
        'clamp',
        'normalized_text_char_count',
        'rect_overlap_area',
        'rect_union_area',
        'text_shape_bottom',
        'text_shape_estimated_lines',
        'weighted_text_width_px',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_quality.layout_slots': (
        'content_shapes_with_any_role',
        'content_slot_shapes',
        'expected_slot_roles',
        'grid_balance_audit',
        'has_role_hint',
        'is_system_map_layout',
        'layout_variant',
        'shapes_with_any_role',
        'shapes_with_role',
        'slot_fill_audit',
        'system_map_slot_fill_audit',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_quality.reporting': (
        'evaluate_native_slide_quality',
        'table_legibility_failures',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_quality.text_validation': (
        'audience_label_readability_failures',
        'content_depth_audit',
        'normalized_content_char_count',
        'operator_language_fragments',
        'readable_body_text_shapes',
        'short_label_wrap_failures',
        'text_capacity_failure',
        'title_core_overlap_failures',
        'title_safe_zone_failures',
        'title_safe_zone_shape',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_quality.visual_validation': (
        'composition_signature',
        'generic_overlap_excluded',
        'mechanical_card_panel_count',
        'structural_text_collision_failures',
        'structural_visual_shapes',
        'title_underline_failures',
    ),
}

_SYMBOL_TO_MODULE: dict[str, str] = {
    symbol: module_name
    for module_name, symbols in _EXPORTS.items()
    for symbol in symbols
}

__all__ = list(_SYMBOL_TO_MODULE)


def __getattr__(name: str):
    module_name = _SYMBOL_TO_MODULE.get(name)
    if module_name is None:
        raise AttributeError(f'module {__name__!r} has no attribute {name!r}')
    value = getattr(importlib.import_module(module_name), name)
    globals()[name] = value
    return value


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(__all__))
