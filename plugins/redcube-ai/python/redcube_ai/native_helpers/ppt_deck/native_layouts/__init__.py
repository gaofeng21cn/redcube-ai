"""Lazy package facade for native PPT layout helpers."""

from __future__ import annotations

import importlib

_EXPORTS: dict[str, tuple[str, ...]] = {
    'redcube_ai.native_helpers.ppt_deck.native_layout_constants': (
        'CANVAS_PX',
        'SLIDE_WIDTH_IN',
        'SLIDE_HEIGHT_IN',
        'EMU_PER_INCH',
        'PX_PER_INCH',
        'SVG_NS',
        'PPTX_NS',
        'STRICT_SVG_ALLOWED_TAGS',
        'PALETTE',
        'OFFICECLI_SHAPE_KINDS',
        'CONTENT_ROLES',
        'AUXILIARY_TEXT_ROLES',
        'LAYOUT_INTENT_REQUIRED_FIELDS',
        'GENERIC_NON_TEXT_VISUAL_FRAGMENTS',
        'STRUCTURAL_VISUAL_ROLE_HINTS',
        'MECHANICAL_CARD_PANEL_ROLES',
        'TEXT_PANEL_ROLES',
        'AI_FIRST_MIN_SHAPES',
        'AI_FIRST_MIN_CONTENT_SHAPES',
        'AI_FIRST_MIN_VISUAL_SUPPORT_SHAPES',
        'AI_FIRST_MIN_AUDIENCE_CONTENT_SLOTS',
        'BODY_TEXT_READABILITY_FLOOR_PT',
        'POINT_INDEX_FLOOR_PT',
        'OFFICECLI_DEFAULT_TEXT_MARGIN_IN',
        'CONTENT_TEXT_DEFAULT_MARGIN_IN',
        'MIN_TEXT_PANEL_INSET_IN',
        'PANEL_SAFE_AREA_EPSILON_IN',
        'MIN_TEXT_CARD_INTERNAL_PADDING_IN',
        'MIN_SHORT_ROUTE_LABEL_WIDTH_IN',
        'SHORT_ROUTE_LABEL_MAX_NORMALIZED_CHARS',
        'MIN_CONNECTOR_THICKNESS_IN',
        'MIN_COMPACT_TEXT_HEIGHT_IN',
        'MIN_BODY_SENTENCE_TEXT_HEIGHT_IN',
        'MIN_LEAD_SENTENCE_TEXT_HEIGHT_IN',
        'MIN_POINT_TEXT_CONTENT_CHARS',
        'MIN_TEXT_OVERLAP_AREA_IN2',
        'MIN_STRUCTURAL_TEXT_CLEARANCE_IN',
        'MIN_STRUCTURAL_TEXT_COLLISION_AREA_IN2',
        'CONTENT_DEPTH_EXCLUDED_ROLES',
        'LEAD_SENTENCE_TEXT_ROLES',
        'STRUCTURAL_TEXT_COLLISION_ROLES',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.common': (
        'safe_text',
        'safe_list',
        'visible_text',
        'shape_kind',
        'ai_shape_text',
        'native_ai_design_shapes',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.geometry': (
        'ai_shape_bounds_in',
        'ai_line_bounds_failure',
        'shape_rect_from_ai_bounds',
        'pptx_geometry_audit',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.text_metrics': (
        'ai_shape_quality_role',
        'ai_shape_font_size',
        'weighted_text_width_pt',
        'estimated_text_height_in',
        'margin_inches',
        'normalized_text_char_count',
        'estimated_text_lines',
        'ai_text_capacity_failure',
        'normalized_content_char_count',
        'ai_content_depth_failures',
        'ai_page_number_failures',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.style': (
        'resolve_color',
        'ai_shape_fill',
        'ai_shape_line',
        'ai_shape_line_width_pt',
        'ai_shape_line_end',
        'officecli_line_prop',
        'officecli_valign',
        'ai_shape_color',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.rules': (
        'layout_intent_failures',
        'layout_intent_has_structural_hint',
        'structural_visual_shape',
        'mechanical_card_panel_shape',
        'audience_content_slot_shape',
        'visual_structure_failures',
        'recommended_quality_role',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.text_safety': (
        'ai_panel_safe_area_failures',
        'ai_short_label_wrap_failures',
        'ai_text_card_internal_padding_failures',
        'ai_text_overlap_failures',
        'ai_structural_text_collision_failures',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.validation': (
        'validate_ai_first_design_plan',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.slide_metadata': (
        'slide_title',
        'layout_family',
        'primary_point_count',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.svg_ir': (
        'file_sha256',
        'svg_rect_from_bounds',
        'svg_text_from_bounds',
        'strict_svg_preflight',
        'render_slide_svg_ir',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.officecli': (
        'canonical_object_kind',
        'officecli_shape_props',
        'officecli_command_for_ai_shape',
        'native_shape_manifest_record',
    ),
    'redcube_ai.native_helpers.ppt_deck.native_layouts.materializer': (
        'parse_json_output',
        'issue_count',
        'materialize_native_pptx',
        'build_deck',
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
