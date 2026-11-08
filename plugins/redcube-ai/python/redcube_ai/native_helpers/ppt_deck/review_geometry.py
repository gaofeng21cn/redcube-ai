from typing import Any, Dict, List, Tuple

FRAME_WIDTH = 1152.0
FRAME_HEIGHT = 648.0
MIN_DENSITY = 0.18
MAX_DENSITY = 0.82
OVERLAP_PIXELS = 12.0
OVERLAP_RATIO = 0.08
MIN_SPEAKER_SECONDS = 20
MAX_SPEAKER_SECONDS = 120
DEFAULT_DEVICE_SCALE_FACTOR = 2.0
MIN_BLOCK_EDGE_CLEARANCE = 24.0
MIN_LARGE_BLOCK_BOTTOM_CLEARANCE = 32.0
MIN_CONTENT_PADDING = 8.0
MIN_ADJACENT_READABLE_BLOCK_GAP = 6.0
MIN_ADJACENT_READABLE_BLOCK_OVERLAP_PIXELS = 48.0
MIN_ADJACENT_READABLE_BLOCK_OVERLAP_RATIO = 0.25
MIN_SURFACE_TARGET_GAP = 8.0
MIN_SURFACE_TARGET_OVERLAP_PIXELS = 8.0
MIN_SURFACE_TARGET_OVERLAP_RATIO = 0.04
SURFACE_SCROLL_OVERFLOW_TOLERANCE = 4.0
EDGE_CLEARANCE_IGNORED_IDS = ('page-number', 'page_no', 'page-no', 'slide-number', 'pager')
BLOCK_CONTENT_OVERFLOW_TOLERANCE = 1.5
TITLE_SAFE_ZONE_BOTTOM = 128.0
MIN_TABLE_BODY_FONT_PX = 14.67
MAX_TABLE_CELL_BLANK_RATIO = 0.38
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


def set_frame_size(width: float, height: float) -> None:
    global FRAME_WIDTH, FRAME_HEIGHT
    FRAME_WIDTH = float(width)
    FRAME_HEIGHT = float(height)


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def overlap_details(block_a: Dict[str, Any], block_b: Dict[str, Any]) -> Tuple[float, float, float]:
    ax1, ay1 = float(block_a.get('left', 0)), float(block_a.get('top', 0))
    ax2 = ax1 + float(block_a.get('width', 0))
    ay2 = ay1 + float(block_a.get('height', 0))
    bx1, by1 = float(block_b.get('left', 0)), float(block_b.get('top', 0))
    bx2 = bx1 + float(block_b.get('width', 0))
    by2 = by1 + float(block_b.get('height', 0))
    overlap_w = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    overlap_h = max(0.0, min(ay2, by2) - max(ay1, by1))
    overlap_area = overlap_w * overlap_h
    return overlap_w, overlap_h, overlap_area


def is_decorative_surface_container(block: Dict[str, Any]) -> bool:
    return bool(block.get('hasSurfaceFrame')) and int(block.get('textNodeCount', 0) or 0) == 0


def should_ignore_overlap(block_a: Dict[str, Any], block_b: Dict[str, Any], ratio: float) -> bool:
    if ratio < 0.98:
        return False
    return is_decorative_surface_container(block_a) != is_decorative_surface_container(block_b)


def is_clearance_relevant_block(block: Dict[str, Any]) -> bool:
    block_id = str(block.get('id') or '').lower()
    if any(token in block_id for token in EDGE_CLEARANCE_IGNORED_IDS):
        return False
    return float(block.get('area', 0) or 0) >= 3000.0 and float(block.get('height', 0) or 0) >= 60.0


def is_internal_padding_relevant(block: Dict[str, Any]) -> bool:
    block_id = str(block.get('id') or '').lower()
    if any(token in block_id for token in EDGE_CLEARANCE_IGNORED_IDS):
        return False
    if int(block.get('textNodeCount', 0) or 0) == 0:
        return False
    if float(block.get('height', 0) or 0) < 72.0:
        return False
    return bool(block.get('hasSurfaceFrame'))


def clearance_failures(block: Dict[str, Any]) -> List[Dict[str, Any]]:
    failures: List[Dict[str, Any]] = []
    if not is_clearance_relevant_block(block):
        return failures
    edge_clearance = block.get('edgeClearance', {}) or {}
    internal_padding = block.get('internalPadding', {}) or {}
    block_height = float(block.get('height', 0) or 0)
    side_thresholds = {
        'left': MIN_BLOCK_EDGE_CLEARANCE,
        'top': MIN_BLOCK_EDGE_CLEARANCE,
        'right': MIN_BLOCK_EDGE_CLEARANCE,
        'bottom': MIN_LARGE_BLOCK_BOTTOM_CLEARANCE if block_height >= 120.0 else MIN_BLOCK_EDGE_CLEARANCE,
    }
    for side, threshold in side_thresholds.items():
        value = float(edge_clearance.get(side, 9999) or 0)
        if value < threshold:
            failures.append({'block_id': block.get('id'), 'scope': 'wrapper_edge', 'side': side, 'value': round(value, 2), 'threshold': round(threshold, 2)})
    if internal_padding and is_internal_padding_relevant(block):
        for side in ('left', 'top', 'right', 'bottom'):
            value = float(internal_padding.get(side, 9999) or 0)
            if value < MIN_CONTENT_PADDING:
                failures.append({'block_id': block.get('id'), 'scope': 'block_padding', 'side': side, 'value': round(value, 2), 'threshold': round(MIN_CONTENT_PADDING, 2)})
    return failures


def review_blocks(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [block for block in (info.get('blocks', []) or []) if not is_decorative_surface_container(block)]


def overflow_is_free(info: Dict[str, Any]) -> bool:
    wrapper = info.get('wrapper', {}) or {}
    return (
        float(wrapper.get('scrollWidth', 0)) <= float(wrapper.get('clientWidth', 0)) + 1
        and float(wrapper.get('scrollHeight', 0)) <= float(wrapper.get('clientHeight', 0)) + 1
        and not bool(info.get('bodyScroll'))
    )


def overlap_failures(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    overlaps = []
    for index, block in enumerate(blocks):
        for other in blocks[index + 1:]:
            overlap_w, overlap_h, overlap_area = overlap_details(block, other)
            if overlap_w <= OVERLAP_PIXELS or overlap_h <= OVERLAP_PIXELS:
                continue
            smaller_area = max(1.0, min(float(block.get('area', 0)), float(other.get('area', 0))))
            ratio = overlap_area / smaller_area
            if ratio < OVERLAP_RATIO or should_ignore_overlap(block, other, ratio):
                continue
            overlaps.append({'a': block.get('id'), 'b': other.get('id'), 'ratio': round(ratio, 4)})
    return overlaps


def density_metrics(blocks: List[Dict[str, Any]], primary_points: int, max_primary_points: int) -> Dict[str, Any]:
    occupied_area = sum(float(block.get('area', 0)) for block in blocks)
    frame_area = FRAME_WIDTH * FRAME_HEIGHT
    occupied_ratio = clamp(occupied_area / frame_area if frame_area else 0.0, 0.0, 1.0)
    return {'occupied_ratio': occupied_ratio, 'visual_density_ok': MIN_DENSITY <= occupied_ratio <= MAX_DENSITY and primary_points <= max_primary_points}


def collect_edge_failures(audit_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    failures = []
    for block in audit_blocks:
        failures.extend(clearance_failures(block))
    return failures


def issue_list(checks: Dict[str, bool]) -> List[str]:
    issue_by_check = {
        'overflow_free': 'overflow_detected',
        'occlusion_free': 'occlusion_detected',
        'visual_density_ok': 'visual_density_out_of_range',
        'speaker_fit_ok': 'speaker_fit_out_of_range',
        'edge_clearance_ok': 'edge_clearance_out_of_range',
        'block_content_fit_ok': 'block_content_overflow_detected',
        'external_audience_language_ok': 'operator_language_leak_detected',
        'title_safe_zone_clear': 'title_safe_zone_obstructed',
        'table_legibility_ok': 'table_font_below_minimum',
        'layout_density_ok': 'layout_density_too_sparse',
    }
    return [issue for check, issue in issue_by_check.items() if not checks.get(check)]


def text_fragments(value: Any) -> List[str]:
    text = str(value or '')
    return sorted({fragment for fragment in OPERATOR_LANGUAGE_FRAGMENTS if fragment in text})


def block_bottom(block: Dict[str, Any]) -> float:
    top = float(block.get('top', 0) or 0)
    height = float(block.get('height', 0) or 0)
    return float(block.get('bottom') or (top + height) or 0)


def title_safe_zone_bottom(info: Dict[str, Any], title_meta: Dict[str, Any]) -> Tuple[float, float | None, float | None]:
    title_block_id = str(title_meta.get('titleBlockId') or '')
    title_block = next((block for block in review_blocks(info) if str(block.get('id') or '') == title_block_id), None)
    if title_block:
        title_bottom = block_bottom(title_block)
        title_font_size = float(title_meta.get('titleFontSize', 0) or 0)
        required_gap = max(12.0, min(24.0, title_font_size * 0.35))
        return title_bottom + required_gap, title_bottom, required_gap
    wrapper = info.get('wrapper', {}) or {}
    frame_height = float(wrapper.get('clientHeight') or FRAME_HEIGHT)
    return min(TITLE_SAFE_ZONE_BOTTOM, frame_height * 0.2), None, None


def title_safe_zone_failures(info: Dict[str, Any], title_meta: Dict[str, Any]) -> List[Dict[str, Any]]:
    title_block_id = str(title_meta.get('titleBlockId') or '')
    safe_zone_bottom, title_bottom, required_gap = title_safe_zone_bottom(info, title_meta)
    failures = []
    for block in review_blocks(info):
        block_id = str(block.get('id') or '')
        if not block_id or block_id == title_block_id:
            continue
        if block_id.startswith('footer') or any(token in block_id.lower() for token in EDGE_CLEARANCE_IGNORED_IDS):
            continue
        if float(block.get('top', 0) or 0) < safe_zone_bottom:
            failures.append({
                'block_id': block_id,
                'top': round(float(block.get('top', 0) or 0), 2),
                'safe_zone_bottom': round(safe_zone_bottom, 2),
                'title_bottom': round(title_bottom, 2) if title_bottom is not None else None,
                'required_gap': round(required_gap, 2) if required_gap is not None else None,
            })
    return failures


def table_legibility_failures(info: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], float, float]:
    failures = []
    table_metrics = info.get('tableMetrics', []) or []
    min_font = MIN_TABLE_BODY_FONT_PX
    max_blank_ratio = 0.0
    for table in table_metrics:
        table_id = table.get('table_id') or table.get('block_id')
        table_min_font = float(table.get('min_font_px') or table.get('min_font_pt') or MIN_TABLE_BODY_FONT_PX)
        blank_ratio = float(table.get('max_blank_ratio') or table.get('card_blank_ratio') or 0.0)
        min_font = min(min_font, table_min_font)
        max_blank_ratio = max(max_blank_ratio, blank_ratio)
        if table_min_font < MIN_TABLE_BODY_FONT_PX:
            failures.append({'table_id': table_id, 'reason': 'table_font_below_minimum', 'value': round(table_min_font, 2), 'threshold': MIN_TABLE_BODY_FONT_PX})
        if blank_ratio > MAX_TABLE_CELL_BLANK_RATIO:
            failures.append({'table_id': table_id, 'reason': 'table_cell_blank_ratio_too_high', 'value': round(blank_ratio, 4), 'threshold': MAX_TABLE_CELL_BLANK_RATIO})
    return failures, min_font, max_blank_ratio
