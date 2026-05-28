CANVAS_PX = (1152, 648)
FRAME_AREA = float(CANVAS_PX[0] * CANVAS_PX[1])
MIN_NATIVE_DENSITY = 0.18
MAX_NATIVE_DENSITY = 0.82
MIN_NATIVE_EDGE_CLEARANCE = 24.0
MAX_NATIVE_PRIMARY_POINTS = 5
MIN_NATIVE_LAYOUT_RICHNESS = 0.68
TITLE_SAFE_ZONE_BOTTOM = 128.0
MIN_NATIVE_BODY_FONT_PT = 18.0
MIN_NATIVE_TITLE_FONT_PT = 36.0
MIN_NATIVE_TYPOGRAPHY_HIERARCHY_RATIO = 2.0
MIN_NATIVE_TITLE_CORE_GAP_PX = 8.0
MIN_AUDIENCE_LABEL_FONT_PT = 16.0
MIN_NATIVE_TEXT_PANEL_INSET_PX = 10.8
MIN_GRID_BALANCE_RATIO = 0.56
MAX_GRID_BALANCE_RATIO = 1.78
MIN_POINT_TEXT_CONTENT_CHARS = 12
MIN_TABLE_BODY_FONT_PT = 11.0
MAX_TABLE_CELL_BLANK_RATIO = 0.38
COMPOSITION_BUCKET_PX = 36.0
MIN_STRUCTURAL_TEXT_CLEARANCE_PX = 8.64
MIN_STRUCTURAL_TEXT_COLLISION_AREA_PX2 = 6.0
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
MECHANICAL_CARD_PANEL_ROLES = {
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
}
SYSTEM_MAP_PANEL_ROLES = {
    'content_panel',
    'input_panel',
    'source_panel',
    'route_lane',
    'route_rail',
    'gate_card',
    'gate_ladder_panel',
    'gate_stack_panel',
    'evidence_band',
    'evidence_panel',
}
SYSTEM_MAP_ROUTE_ROLES = {
    'flow_connector',
    'horizontal_route_connector',
    'route_flow_connector',
    'route_gate_connector',
    'route_lane',
    'route_rail',
}
SYSTEM_MAP_CONTENT_ROLES = {
    'body_sentence',
    'takeaway',
    'evidence_item',
    'metric',
    'route_label',
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
SYSTEM_MAP_STRUCTURAL_HINTS = (
    'document',
    'evidence',
    'gate',
    'input',
    'route',
    'system',
)
FLEX_CONTENT_SLOT_ROLES = {
    'content_panel',
    'takeaway',
    'takeaway_band',
    'hub_panel',
}
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
    'point_index',
    *AUXILIARY_TEXT_ROLES,
}
GENERIC_OVERLAP_EXCLUDED_ROLE_PAIRS = {
    frozenset({'title', 'core_sentence'}),
}
OPERATOR_LANGUAGE_FRAGMENTS = [
    '汇报讨论用途',
    '客观专业版',
    '本次汇报边界',
    '不在展示页暴露',
    '本地原始文件名',
    '清洗脚本名',
    'RCA',
    'RedCube',
    'product-entry',
    'product entry',
    'live proof',
    'proof lane',
    'source intake',
    'author_pptx_native',
    'slide_blueprint',
    'visual_direction',
]
