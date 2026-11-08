"""Pure slide review and deck-wide check aggregation over browser readback."""

from typing import Any, Dict, List

from redcube_ai.native_helpers.ppt_deck.review_geometry import (
    review_blocks,
    overlap_failures,
    density_metrics,
    collect_edge_failures,
    text_fragments,
    title_safe_zone_failures,
    table_legibility_failures,
    MIN_SPEAKER_SECONDS,
    MAX_SPEAKER_SECONDS,
    MAX_TABLE_CELL_BLANK_RATIO,
    overflow_is_free,
    issue_list,
)


def review_slide(info: Dict[str, Any], max_primary_points: int) -> Dict[str, Any]:
    blocks = review_blocks(info)
    audit_blocks = info.get('auditBlocks', []) or []
    title_meta = info.get('titleMeta', {}) or {}
    block_content_audit = info.get('blockContentAudit', {}) or {}
    page_number_audit = info.get('pageNumberAudit', {}) or {'present': False}
    visible_text = info.get('visibleText') or ''
    overlaps = overlap_failures(blocks)
    primary_points = int(info.get('primaryPoints', 0) or 0)
    density = density_metrics(blocks, primary_points, max_primary_points)
    speaker_seconds = int(info.get('speakerSeconds', 0) or 0)
    edge_failures = collect_edge_failures(audit_blocks)
    block_content_failures = block_content_audit.get('failures', []) or []
    operator_fragments = text_fragments(visible_text)
    title_zone_failures = title_safe_zone_failures(info, title_meta)
    table_failures, table_min_font_px, max_table_blank_ratio = table_legibility_failures(info)
    block_content_occlusion_failures = [
        failure for failure in block_content_failures
        if failure.get('overflow_reason') == 'surface_text_targets_overlap'
    ]
    checks = {
        'overflow_free': overflow_is_free(info),
        'occlusion_free': not overlaps and not block_content_occlusion_failures,
        'visual_density_ok': density['visual_density_ok'],
        'speaker_fit_ok': MIN_SPEAKER_SECONDS <= speaker_seconds <= MAX_SPEAKER_SECONDS and primary_points <= max_primary_points + 1,
        'edge_clearance_ok': len(edge_failures) == 0,
        'block_content_fit_ok': len(block_content_failures) == 0,
        'title_typography_ok': True,
        'page_number_consistency_ok': True,
        'external_audience_language_ok': len(operator_fragments) == 0,
        'title_safe_zone_clear': len(title_zone_failures) == 0,
        'table_legibility_ok': len(table_failures) == 0,
        'layout_density_ok': density['visual_density_ok'] and max_table_blank_ratio <= MAX_TABLE_CELL_BLANK_RATIO,
    }

    return {
        'slide_id': info.get('slideId'),
        'title': info.get('title'),
        'layout_family': info.get('layoutFamily'),
        'checks': checks,
        'metrics': {
            'occupied_ratio': round(density['occupied_ratio'], 4),
            'primary_points': primary_points,
            'speaker_seconds': speaker_seconds,
            'overlaps': overlaps,
            'edge_clearance_failures': edge_failures,
            'block_content_failures': block_content_failures,
            'title_font_size': round(float(title_meta.get('titleFontSize', 0) or 0), 2),
            'title_line_count': int(title_meta.get('titleLineCount', 0) or 0),
            'title_block_id': title_meta.get('titleBlockId'),
            'page_number_audit': page_number_audit,
            'operator_language_fragments': operator_fragments,
            'title_safe_zone_failures': title_zone_failures,
            'title_safe_zone_clearance_ok': len(title_zone_failures) == 0,
            'table_min_font_px': round(table_min_font_px, 2),
            'table_min_font_pt': round(table_min_font_px * 72.0 / 96.0, 2),
            'table_legibility_failures': table_failures,
            'card_blank_ratio': round(max_table_blank_ratio, 4),
            'card_blank_ratio_threshold': MAX_TABLE_CELL_BLANK_RATIO,
        },
        'issues': issue_list(checks),
    }



def summarize_checks(slide_reviews: List[Dict[str, Any]]) -> Dict[str, bool]:
    keys = [
        'overflow_free',
        'occlusion_free',
        'visual_density_ok',
        'speaker_fit_ok',
        'edge_clearance_ok',
        'block_content_fit_ok',
        'title_typography_ok',
        'page_number_consistency_ok',
        'external_audience_language_ok',
        'title_safe_zone_clear',
        'table_legibility_ok',
        'layout_density_ok',
    ]
    return {
        key: all(bool(review.get('checks', {}).get(key)) for review in slide_reviews)
        for key in keys
    }
