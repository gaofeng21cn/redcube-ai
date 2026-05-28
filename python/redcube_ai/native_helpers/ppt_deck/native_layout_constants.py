CANVAS_PX = (1152, 648)
SLIDE_WIDTH_IN = 16.0
SLIDE_HEIGHT_IN = 9.0
EMU_PER_INCH = 914400.0
PX_PER_INCH = CANVAS_PX[0] / SLIDE_WIDTH_IN
SVG_NS = 'http://www.w3.org/2000/svg'
PPTX_NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
}
STRICT_SVG_ALLOWED_TAGS = {
    f'{{{SVG_NS}}}svg',
    f'{{{SVG_NS}}}g',
    f'{{{SVG_NS}}}rect',
    f'{{{SVG_NS}}}text',
}
PALETTE = {
    'bg': '#F6F2EA',
    'ink': '#171C24',
    'muted': '#5B6570',
    'accent': '#B94624',
    'panel': '#EFE6D6',
    'line': '#D8C8B2',
    'white': '#FFFFFF',
    'none': 'none',
}
OFFICECLI_SHAPE_KINDS = {
    'rect',
    'rectangle',
    'rounded_rect',
    'panel',
    'text_box',
    'text',
    'oval',
    'circle',
    'line',
    'connector',
}
CONTENT_ROLES = {
    'title',
    'subtitle',
    'core_sentence',
    'point_text',
    'body',
    'content',
    'content_panel',
    'content_stack',
    'point_index',
    'page_number',
    'cover_meta',
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'hub_panel',
    'takeaway',
    'takeaway_band',
    'takeaway_panel',
    'structured_note_panel',
}
AUXILIARY_TEXT_ROLES = {
    'caption',
    'cover_meta',
    'date',
    'footer',
    'meta',
    'page',
    'page_no',
    'page_number',
    'source_note',
}
LAYOUT_INTENT_REQUIRED_FIELDS = [
    'rhetorical_role',
    'composition_signature',
    'primary_grid',
    'visual_weight',
    'negative_space_strategy',
    'non_text_visual',
    'forbidden_template_reuse_checked',
]
GENERIC_NON_TEXT_VISUAL_FRAGMENTS = [
    'card',
    'cards',
    'panel',
    'panels',
    'filled comparison panels',
    'editable shape system',
    'shape system',
]
STRUCTURAL_VISUAL_ROLE_HINTS = [
    'axis',
    'band',
    'bridge',
    'connector',
    'flow',
    'hub',
    'ladder',
    'map',
    'metric',
    'rail',
    'stack',
    'table',
    'timeline',
    'track',
]
MECHANICAL_CARD_PANEL_ROLES = {
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
}
AI_FIRST_MIN_SHAPES = 7
AI_FIRST_MIN_CONTENT_SHAPES = 4
AI_FIRST_MIN_VISUAL_SUPPORT_SHAPES = 2
AI_FIRST_MIN_AUDIENCE_CONTENT_SLOTS = 1
BODY_TEXT_READABILITY_FLOOR_PT = 18.0
POINT_INDEX_FLOOR_PT = 16.0
OFFICECLI_DEFAULT_TEXT_MARGIN_IN = 0.02
CONTENT_TEXT_DEFAULT_MARGIN_IN = 0.10
MIN_TEXT_PANEL_INSET_IN = 0.15
MIN_SHORT_ROUTE_LABEL_WIDTH_IN = 4.20
SHORT_ROUTE_LABEL_MAX_NORMALIZED_CHARS = 22
MIN_CONNECTOR_THICKNESS_IN = 0.03
MIN_COMPACT_TEXT_HEIGHT_IN = 0.54
MIN_BODY_SENTENCE_TEXT_HEIGHT_IN = 0.84
MIN_LEAD_SENTENCE_TEXT_HEIGHT_IN = 0.95
MIN_POINT_TEXT_CONTENT_CHARS = 12
MIN_TEXT_OVERLAP_AREA_IN2 = 0.0024
MIN_STRUCTURAL_TEXT_CLEARANCE_IN = 0.12
MIN_STRUCTURAL_TEXT_COLLISION_AREA_IN2 = 0.0012
CONTENT_DEPTH_EXCLUDED_ROLES = {
    'title',
    'subtitle',
    'core_sentence',
    'evidence_item',
    'metric',
    'metric_label',
    'panel_title',
    'speaker_identity',
    'route_label',
    'point_text_short',
    'boundary_note',
    'page_number',
    'page_no',
    'cover_meta',
    'footer',
    'meta',
    'point_index',
    *AUXILIARY_TEXT_ROLES,
}
LEAD_SENTENCE_TEXT_ROLES = {
    'lead',
    'intro',
    'thesis',
    'takeaway',
    'core_sentence',
}
STRUCTURAL_TEXT_COLLISION_ROLES = {
    'body',
    'body_sentence',
    'boundary_note',
    'content',
    'evidence_item',
    'gate_card',
    'metric',
    'panel_title',
    'point_text',
    'route_label',
    'takeaway',
}
