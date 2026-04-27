import statistics
from typing import Any, Dict, List

TITLE_FONT_SIZE_TOLERANCE = 2.5
PAGE_NUMBER_POSITION_TOLERANCE = 8.0
PAGE_NUMBER_FONT_SIZE_TOLERANCE = 1.5
PAGE_NUMBER_COLOR_TOLERANCE = 18.0


def title_consistency_exempt(review: Dict[str, Any]) -> bool:
    slide_id = str(review.get('slide_id') or '')
    layout_family = str(review.get('layout_family') or '')
    return slide_id == 'S01' or layout_family == 'cover_signal'


def apply_title_typography_consistency(slide_reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    body_sizes = [
        float(review.get('metrics', {}).get('title_font_size') or 0)
        for review in slide_reviews
        if not title_consistency_exempt(review) and float(review.get('metrics', {}).get('title_font_size') or 0) > 0
    ]
    reference = statistics.median(body_sizes) if body_sizes else 0.0
    for review in slide_reviews:
        checks = review.setdefault('checks', {})
        metrics = review.setdefault('metrics', {})
        if title_consistency_exempt(review):
            checks['title_typography_ok'] = True
            metrics['title_font_reference'] = round(reference, 2) if reference else None
            metrics['title_font_delta'] = 0.0
            continue
        font_size = float(metrics.get('title_font_size') or 0)
        if reference <= 0 or font_size <= 0:
            checks['title_typography_ok'] = False
            metrics['title_font_reference'] = round(reference, 2) if reference else None
            metrics['title_font_delta'] = None
            if 'title_typography_inconsistent' not in review['issues']:
                review['issues'].append('title_typography_inconsistent')
            continue
        delta = abs(font_size - reference)
        checks['title_typography_ok'] = delta <= TITLE_FONT_SIZE_TOLERANCE
        metrics['title_font_reference'] = round(reference, 2)
        metrics['title_font_delta'] = round(delta, 2)
        if not checks['title_typography_ok'] and 'title_typography_inconsistent' not in review['issues']:
            review['issues'].append('title_typography_inconsistent')
    return {
        'reference_font_size': round(reference, 2) if reference else None,
        'body_slide_count': len(body_sizes),
    }


def page_number_reference_candidates(slide_reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        review.get('metrics', {}).get('page_number_audit', {}) or {}
        for review in slide_reviews
        if (review.get('metrics', {}).get('page_number_audit', {}) or {}).get('present')
    ]


def page_number_position_failure(current: Dict[str, Any], reference: Dict[str, Any]) -> bool:
    if current.get('position_family') != reference.get('position_family'):
        return True
    current_rect = current.get('rect', {}) or {}
    reference_rect = reference.get('rect', {}) or {}
    for key in ('left', 'top', 'right_gap', 'bottom_gap'):
        current_value = current_rect.get(key)
        reference_value = reference_rect.get(key)
        if current_value is None or reference_value is None:
            continue
        if abs(float(current_value) - float(reference_value)) > PAGE_NUMBER_POSITION_TOLERANCE:
            return True
    return False


def page_number_color_failure(current: Dict[str, Any], reference: Dict[str, Any]) -> bool:
    current_rgb = current.get('color_rgb')
    reference_rgb = reference.get('color_rgb')
    if not isinstance(current_rgb, list) or not isinstance(reference_rgb, list):
        return False
    if len(current_rgb) < 3 or len(reference_rgb) < 3:
        return False
    return any(abs(float(current_rgb[index]) - float(reference_rgb[index])) > PAGE_NUMBER_COLOR_TOLERANCE for index in range(3))


def page_number_reference_payload(reference: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'text': reference.get('text'),
        'syntax_family': reference.get('syntax_family'),
        'position_family': reference.get('position_family'),
        'font_size': reference.get('font_size'),
        'color_rgb': reference.get('color_rgb'),
        'rect': reference.get('rect'),
    }


def apply_page_number_consistency(slide_reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    candidates = page_number_reference_candidates(slide_reviews)
    reference = candidates[0] if candidates else None
    for review in slide_reviews:
        checks = review.setdefault('checks', {})
        metrics = review.setdefault('metrics', {})
        audit = metrics.setdefault('page_number_audit', {'present': False})
        failures: List[str] = []
        if reference and audit.get('present'):
            if audit.get('syntax_family') != reference.get('syntax_family'):
                failures.append('syntax_family')
            if page_number_position_failure(audit, reference):
                failures.append('position')
            if abs(float(audit.get('font_size', 0) or 0) - float(reference.get('font_size', 0) or 0)) > PAGE_NUMBER_FONT_SIZE_TOLERANCE:
                failures.append('font_size')
            if page_number_color_failure(audit, reference):
                failures.append('color')
        audit['reference'] = page_number_reference_payload(reference) if reference else None
        audit['failures'] = failures
        checks['page_number_consistency_ok'] = len(failures) == 0
        without_page_number_issue = [
            issue for issue in review.get('issues', [])
            if issue != 'page_number_consistency_failed'
        ]
        review['issues'] = without_page_number_issue
        if failures:
            review['issues'].append('page_number_consistency_failed')
    return {
        'reference': page_number_reference_payload(reference) if reference else None,
        'slide_count_with_page_number': len(candidates),
    }
