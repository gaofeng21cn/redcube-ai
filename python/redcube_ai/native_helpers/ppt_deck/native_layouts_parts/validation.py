from redcube_ai.native_helpers.ppt_deck.native_layout_constants import (
    AI_FIRST_MIN_AUDIENCE_CONTENT_SLOTS,
    AI_FIRST_MIN_CONTENT_SHAPES,
    AI_FIRST_MIN_SHAPES,
    AI_FIRST_MIN_VISUAL_SUPPORT_SHAPES,
    BODY_TEXT_READABILITY_FLOOR_PT,
    OFFICECLI_SHAPE_KINDS,
    POINT_INDEX_FLOOR_PT,
    STRUCTURAL_VISUAL_ROLE_HINTS,
)
from redcube_ai.native_helpers.ppt_deck.native_layout_grammar import template_layout_binding_failures
from redcube_ai.native_helpers.ppt_deck.native_manifest_qa import connector_direction_failure
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import ai_shape_text, native_ai_design_shapes, safe_text, shape_kind
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import ai_line_bounds_failure, ai_shape_bounds_in
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.rules import (
    audience_content_slot_shape,
    layout_intent_failures,
    recommended_quality_role,
    structural_visual_shape,
    visual_structure_failures,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import ai_shape_line_end, resolve_color
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_metrics import (
    ai_content_depth_failures,
    ai_page_number_failures,
    ai_shape_font_size,
    ai_shape_quality_role,
    ai_text_capacity_failure,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.text_safety import (
    ai_panel_safe_area_failures,
    ai_short_label_wrap_failures,
    ai_structural_text_collision_failures,
    ai_text_card_internal_padding_failures,
    ai_text_overlap_failures,
)

__all__ = ['validate_ai_first_design_plan']


def validate_ai_first_design_plan(slide_data: dict) -> list[dict]:
    shapes = native_ai_design_shapes(slide_data)
    failures = []
    failures.extend(template_layout_binding_failures(slide_data, shapes, ai_shape_quality_role))
    failures.extend(layout_intent_failures(slide_data))
    if len(shapes) < AI_FIRST_MIN_SHAPES:
        failures.append({'reason': 'ai_first_shape_plan_too_thin', 'actual': len(shapes), 'minimum': AI_FIRST_MIN_SHAPES})
    content_count = sum(1 for shape in shapes if ai_shape_quality_role(shape) == 'content')
    decorative_count = sum(1 for shape in shapes if ai_shape_quality_role(shape) == 'decorative')
    structural_count = sum(1 for shape in shapes if structural_visual_shape(shape))
    visual_support_count = decorative_count + structural_count
    audience_slot_count = sum(1 for shape in shapes if audience_content_slot_shape(shape))
    if content_count < AI_FIRST_MIN_CONTENT_SHAPES:
        failures.append({'reason': 'ai_first_content_shape_count_too_low', 'actual': content_count, 'minimum': AI_FIRST_MIN_CONTENT_SHAPES})
    if visual_support_count < AI_FIRST_MIN_VISUAL_SUPPORT_SHAPES:
        failures.append({
            'reason': 'ai_first_visual_support_shape_count_too_low',
            'actual': visual_support_count,
            'minimum': AI_FIRST_MIN_VISUAL_SUPPORT_SHAPES,
            'structural_count': structural_count,
            'decorative_count': decorative_count,
        })
    if audience_slot_count < AI_FIRST_MIN_AUDIENCE_CONTENT_SLOTS:
        failures.append({
            'reason': 'ai_first_audience_content_slot_missing',
            'actual': audience_slot_count,
            'minimum': AI_FIRST_MIN_AUDIENCE_CONTENT_SLOTS,
        })
    failures.extend({
        'reason': 'ai_first_structural_role_not_specific',
        'shape_id': safe_text(shape.get('shape_id'), '<missing-shape-id>'),
        'role': safe_text(shape.get('role')),
        'kind': shape_kind(shape),
        'required_role_hint': STRUCTURAL_VISUAL_ROLE_HINTS,
    } for shape in shapes if safe_text(shape.get('quality_role')).lower() == 'structural' and not structural_visual_shape(shape))
    failures.extend(visual_structure_failures(shapes))
    failures.extend(ai_text_overlap_failures(shapes))
    failures.extend(ai_structural_text_collision_failures(shapes))
    failures.extend(ai_panel_safe_area_failures(shapes))
    failures.extend(ai_short_label_wrap_failures(shapes))
    failures.extend(ai_text_card_internal_padding_failures(shapes))
    failures.extend(ai_content_depth_failures(shapes))
    failures.extend(ai_page_number_failures(shapes))
    for shape in shapes:
        shape_id = safe_text(shape.get('shape_id'), '<missing-shape-id>')
        kind = shape_kind(shape)
        role = safe_text(shape.get('role'))
        text = ai_shape_text(shape)
        quality_role = ai_shape_quality_role(shape)
        if not safe_text(shape.get('shape_id')):
            failures.append({'reason': 'ai_first_shape_id_missing', 'shape_id': shape_id})
        explicit_quality_role = safe_text(shape.get('quality_role')).lower()
        if explicit_quality_role not in {'content', 'decorative', 'auxiliary', 'structural'}:
            failures.append({
                'reason': 'ai_first_quality_role_missing_or_invalid',
                'shape_id': shape_id,
                'role': role,
                'kind': kind,
                'layout_zone_id': safe_text(shape.get('layout_zone_id')),
                'actual': safe_text(shape.get('quality_role')),
                'allowed': ['content', 'decorative', 'auxiliary', 'structural'],
                'required_quality_role': recommended_quality_role(shape),
            })
        if kind not in OFFICECLI_SHAPE_KINDS:
            failures.append({'reason': 'ai_first_shape_kind_not_officecli_materializable', 'shape_id': shape_id, 'kind': kind})
        if ai_shape_bounds_in(shape) is None:
            failures.append({'reason': 'ai_first_shape_bounds_invalid', 'shape_id': shape_id})
        line_bounds_failure = ai_line_bounds_failure(shape)
        if line_bounds_failure:
            failures.append(line_bounds_failure)
        if kind == 'connector' and ai_shape_line_end(shape, end='head') == 'none' and ai_shape_line_end(shape, end='tail') == 'none': failures.append(connector_direction_failure(shape_id, role))
        if kind in {'text', 'text_box'} and not text:
            failures.append({'reason': 'ai_first_text_missing', 'shape_id': shape_id})
        font_size = ai_shape_font_size(shape, role)
        if text and font_size <= 0:
            failures.append({'reason': 'ai_first_font_size_missing', 'shape_id': shape_id, 'role': role})
        if role == 'point_index' and font_size < POINT_INDEX_FLOOR_PT:
            failures.append({'reason': 'ai_first_point_index_too_small', 'shape_id': shape_id, 'font_size': round(font_size, 2)})
        if kind in {'text', 'text_box'} and quality_role == 'content':
            if role not in {'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'} and font_size < BODY_TEXT_READABILITY_FLOOR_PT:
                failures.append({'reason': 'ai_first_body_text_too_small', 'shape_id': shape_id, 'font_size': round(font_size, 2)})
            if role not in {'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'}:
                capacity_failure = ai_text_capacity_failure(shape)
                if capacity_failure:
                    failures.append(capacity_failure)
        native_content_visible = (
            (kind == 'picture' and bool(safe_text(
                shape.get('src') or shape.get('source') or shape.get('file') or shape.get('source_data_uri')
            )))
            or (kind == 'chart' and bool(shape.get('categories')) and bool(shape.get('series')))
            or (kind in {'table', 'metric_grid'} and bool(shape.get('data')))
            or (kind == 'group' and bool(shape.get('children')))
            or (
                kind in {'chart', 'table', 'metric_grid'}
                and safe_text(shape.get('materialization_intent')) == 'stable_drawingml'
                and bool(shape.get('drawingml_shapes') or shape.get('children'))
            )
        )
        if not text and not native_content_visible and resolve_color(shape.get('fill') or shape.get('fill_color'), 'none') == 'none' and resolve_color(shape.get('line') or shape.get('line_color') or shape.get('stroke'), 'none') == 'none':
            failures.append({'reason': 'ai_first_non_text_shape_invisible', 'shape_id': shape_id})
        if (
            not text
            and not native_content_visible
            and explicit_quality_role in {'content', 'structural'}
            and resolve_color(shape.get('fill') or shape.get('fill_color'), 'none') == 'none'
            and resolve_color(shape.get('line') or shape.get('line_color') or shape.get('stroke'), 'none') == 'none'
        ):
            failures.append({
                'reason': 'ai_first_visible_style_missing',
                'shape_id': shape_id,
                'quality_role': explicit_quality_role,
                'required': 'non-text content/structural shapes need explicit fill or line styling from the AI plan',
            })
    return failures
