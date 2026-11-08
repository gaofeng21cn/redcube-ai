from redcube_ai.native_helpers.ppt_deck.native_layout_text_safety import (
    ai_panel_safe_area_failures as layout_panel_safe_area_failures,
    ai_short_label_wrap_failures as layout_short_label_wrap_failures,
    ai_structural_text_collision_failures as layout_structural_text_collision_failures,
    ai_text_card_internal_padding_failures as layout_text_card_internal_padding_failures,
    ai_text_overlap_failures as layout_text_overlap_failures,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import ai_shape_bounds_in
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.rules import structural_visual_shape
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import resolve_color
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_metrics import (
    ai_shape_font_size,
    ai_shape_quality_role,
    estimated_text_height_in,
    estimated_text_lines,
    margin_inches,
    normalized_text_char_count,
    weighted_text_width_pt,
)

__all__ = [
    'ai_panel_safe_area_failures',
    'ai_short_label_wrap_failures',
    'ai_text_card_internal_padding_failures',
    'ai_text_overlap_failures',
    'ai_structural_text_collision_failures',
]


def ai_panel_safe_area_failures(shapes: list[dict]) -> list[dict]:
    return layout_panel_safe_area_failures(
        shapes,
        ai_shape_bounds_in=ai_shape_bounds_in,
        ai_shape_quality_role=ai_shape_quality_role,
        shape_kind=shape_kind,
        ai_shape_text=ai_shape_text,
        safe_text=safe_text,
    )


def ai_short_label_wrap_failures(shapes: list[dict]) -> list[dict]:
    return layout_short_label_wrap_failures(
        shapes,
        ai_shape_bounds_in=ai_shape_bounds_in,
        ai_shape_font_size=ai_shape_font_size,
        ai_shape_quality_role=ai_shape_quality_role,
        ai_shape_text=ai_shape_text,
        estimated_text_lines=estimated_text_lines,
        margin_inches=margin_inches,
        normalized_text_char_count=normalized_text_char_count,
        shape_kind=shape_kind,
        safe_text=safe_text,
        weighted_text_width_pt=weighted_text_width_pt,
    )


def ai_text_card_internal_padding_failures(shapes: list[dict]) -> list[dict]:
    return layout_text_card_internal_padding_failures(
        shapes,
        ai_shape_bounds_in=ai_shape_bounds_in,
        ai_shape_quality_role=ai_shape_quality_role,
        shape_kind=shape_kind,
        ai_shape_text=ai_shape_text,
        margin_inches=margin_inches,
        resolve_color=resolve_color,
        safe_text=safe_text,
    )


def ai_text_overlap_failures(shapes: list[dict]) -> list[dict]:
    return layout_text_overlap_failures(
        shapes,
        ai_shape_bounds_in=ai_shape_bounds_in,
        ai_shape_quality_role=ai_shape_quality_role,
        ai_shape_text=ai_shape_text,
        estimated_text_height_in=estimated_text_height_in,
        shape_kind=shape_kind,
        safe_text=safe_text,
    )


def ai_structural_text_collision_failures(shapes: list[dict]) -> list[dict]:
    return layout_structural_text_collision_failures(
        shapes,
        ai_shape_bounds_in=ai_shape_bounds_in,
        ai_shape_quality_role=ai_shape_quality_role,
        ai_shape_text=ai_shape_text,
        estimated_text_height_in=estimated_text_height_in,
        shape_kind=shape_kind,
        structural_visual_shape=structural_visual_shape,
        safe_text=safe_text,
    )
