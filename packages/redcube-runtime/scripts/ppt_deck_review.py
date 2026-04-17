#!/usr/bin/env python3
import argparse
import asyncio
import json
import statistics
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

from playwright.async_api import async_playwright

FRAME_WIDTH = 1152.0
FRAME_HEIGHT = 648.0
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]
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
TITLE_FONT_SIZE_TOLERANCE = 2.5
EDGE_CLEARANCE_IGNORED_IDS = ('page-number', 'page_no', 'page-no', 'slide-number', 'pager')
INTERNAL_PADDING_ROLE_HINTS = ('card', 'panel', 'zone', 'row', 'stack', 'ladder', 'notes', 'band', 'summary', 'takeaway')


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


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
            failures.append({
                'block_id': block.get('id'),
                'scope': 'wrapper_edge',
                'side': side,
                'value': round(value, 2),
                'threshold': round(threshold, 2),
            })
    if internal_padding and is_internal_padding_relevant(block):
        for side in ('left', 'top', 'right', 'bottom'):
            value = float(internal_padding.get(side, 9999) or 0)
            if value < MIN_CONTENT_PADDING:
                failures.append({
                    'block_id': block.get('id'),
                    'scope': 'block_padding',
                    'side': side,
                    'value': round(value, 2),
                    'threshold': round(MIN_CONTENT_PADDING, 2),
                })
    return failures


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


def review_slide(info: Dict[str, Any], max_primary_points: int) -> Dict[str, Any]:
    wrapper = info.get('wrapper', {}) or {}
    blocks = info.get('blocks', []) or []
    audit_blocks = info.get('auditBlocks', []) or []
    title_meta = info.get('titleMeta', {}) or {}
    issues: List[str] = []
    overflow_free = (
        float(wrapper.get('scrollWidth', 0)) <= float(wrapper.get('clientWidth', 0)) + 1
        and float(wrapper.get('scrollHeight', 0)) <= float(wrapper.get('clientHeight', 0)) + 1
        and not bool(info.get('bodyScroll'))
    )
    if not overflow_free:
        issues.append('overflow_detected')

    overlaps = []
    occlusion_free = True
    for index, block in enumerate(blocks):
        for other in blocks[index + 1:]:
            overlap_w, overlap_h, overlap_area = overlap_details(block, other)
            if overlap_w > OVERLAP_PIXELS and overlap_h > OVERLAP_PIXELS:
                smaller_area = max(1.0, min(float(block.get('area', 0)), float(other.get('area', 0))))
                ratio = overlap_area / smaller_area
                if ratio >= OVERLAP_RATIO:
                    if should_ignore_overlap(block, other, ratio):
                        continue
                    overlaps.append({
                        'a': block.get('id'),
                        'b': other.get('id'),
                        'ratio': round(ratio, 4),
                    })
    if overlaps:
        occlusion_free = False
        issues.append('occlusion_detected')

    occupied_area = sum(float(block.get('area', 0)) for block in blocks)
    frame_area = FRAME_WIDTH * FRAME_HEIGHT
    occupied_ratio = clamp(occupied_area / frame_area if frame_area else 0.0, 0.0, 1.0)
    primary_points = int(info.get('primaryPoints', 0) or 0)
    visual_density_ok = MIN_DENSITY <= occupied_ratio <= MAX_DENSITY and primary_points <= max_primary_points
    if not visual_density_ok:
        issues.append('visual_density_out_of_range')

    speaker_seconds = int(info.get('speakerSeconds', 0) or 0)
    speaker_fit_ok = MIN_SPEAKER_SECONDS <= speaker_seconds <= MAX_SPEAKER_SECONDS and primary_points <= max_primary_points + 1
    if not speaker_fit_ok:
        issues.append('speaker_fit_out_of_range')

    edge_failures = []
    for block in audit_blocks:
        edge_failures.extend(clearance_failures(block))
    edge_clearance_ok = len(edge_failures) == 0
    if not edge_clearance_ok:
        issues.append('edge_clearance_out_of_range')

    return {
        'slide_id': info.get('slideId'),
        'title': info.get('title'),
        'layout_family': info.get('layoutFamily'),
        'checks': {
            'overflow_free': overflow_free,
            'occlusion_free': occlusion_free,
            'visual_density_ok': visual_density_ok,
            'speaker_fit_ok': speaker_fit_ok,
            'edge_clearance_ok': edge_clearance_ok,
            'title_typography_ok': True,
        },
        'metrics': {
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'speaker_seconds': speaker_seconds,
            'overlaps': overlaps,
            'edge_clearance_failures': edge_failures,
            'title_font_size': round(float(title_meta.get('titleFontSize', 0) or 0), 2),
            'title_line_count': int(title_meta.get('titleLineCount', 0) or 0),
            'title_block_id': title_meta.get('titleBlockId'),
        },
        'issues': issues,
    }


def summarize_checks(slide_reviews: List[Dict[str, Any]]) -> Dict[str, bool]:
    keys = ['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok', 'edge_clearance_ok', 'title_typography_ok']
    return {
        key: all(bool(review.get('checks', {}).get(key)) for review in slide_reviews)
        for key in keys
    }


def baseline_check(slide_reviews: List[Dict[str, Any]], baseline_file: Path) -> Dict[str, Any]:
    if not baseline_file.exists():
        fail(f'Baseline review file not found: {baseline_file}')
    baseline = json.loads(baseline_file.read_text(encoding='utf-8'))
    baseline_reviews = baseline.get('slide_reviews', []) or []
    current_avg = statistics.mean([review['metrics']['occupied_ratio'] for review in slide_reviews]) if slide_reviews else 0.0
    baseline_avg = statistics.mean([review.get('metrics', {}).get('occupied_ratio', 0.0) for review in baseline_reviews]) if baseline_reviews else 0.0
    current_failures = sum(1 for review in slide_reviews if review.get('issues'))
    baseline_failures = sum(1 for review in baseline_reviews if review.get('issues'))
    failure_delta = current_failures - baseline_failures
    density_delta = current_avg - baseline_avg
    failure_status = 'improved' if failure_delta < 0 else ('degraded' if failure_delta > 0 else 'acceptable')
    density_status = 'improved' if density_delta < 0 else ('degraded' if density_delta > 0.08 else 'acceptable')
    relative_quality = {
        'verdict': 'degraded' if 'degraded' in [failure_status, density_status] else ('improved' if 'improved' in [failure_status, density_status] else 'acceptable'),
        'degradations': [name for name, status in [('failed_slide_count', failure_status), ('average_density', density_status)] if status == 'degraded'],
        'improvements': [name for name, status in [('failed_slide_count', failure_status), ('average_density', density_status)] if status == 'improved'],
        'acceptable_changes': [name for name, status in [('failed_slide_count', failure_status), ('average_density', density_status)] if status == 'acceptable'],
        'dimensions': [
            {
                'dimension_id': 'failed_slide_count',
                'label': '失败页数',
                'current': current_failures,
                'baseline': baseline_failures,
                'delta': failure_delta,
                'tolerance': 0,
                'preferred_direction': 'lower',
                'status': failure_status,
            },
            {
                'dimension_id': 'average_density',
                'label': '平均占用率',
                'current': round(current_avg, 4),
                'baseline': round(baseline_avg, 4),
                'delta': round(density_delta, 4),
                'tolerance': 0.08,
                'preferred_direction': 'lower',
                'status': density_status,
            },
        ],
    }
    passed = relative_quality['verdict'] != 'degraded'
    summary = (
        '相对 baseline 出现退化：' + '、'.join(relative_quality['degradations'])
        if relative_quality['verdict'] == 'degraded'
        else (
            '相对 baseline 保持可接受且有提升：' + '、'.join(relative_quality['improvements'])
            if relative_quality['improvements']
            else '相对 baseline 变化可接受。'
        )
    )
    return {
        'baseline_comparison_passed': passed,
        'baseline_review_file': str(baseline_file),
        'current_average_density': round(current_avg, 4),
        'baseline_average_density': round(baseline_avg, 4),
        'current_failed_slides': current_failures,
        'baseline_failed_slides': baseline_failures,
        'relative_quality': relative_quality,
        'summary': summary,
    }


def build_markdown(result: Dict[str, Any]) -> str:
    lines = ['# 视觉质控', '']
    checks = result.get('checks', {})
    lines.append('## 总体检查')
    for key, value in checks.items():
        lines.append(f'- {key}: {"PASS" if value else "BLOCK"}')
    if 'baseline_comparison_passed' in checks:
        lines.append(f'- baseline_comparison_passed: {"PASS" if checks["baseline_comparison_passed"] else "BLOCK"}')
    lines.append('')
    lines.append('## 分页记录')
    for review in result.get('slide_reviews', []):
        lines.append(f"### {review.get('slide_id')} / {review.get('title')}")
        lines.append(f"- layout_family: {review.get('layout_family')}")
        lines.append(f"- screenshot: {review.get('screenshot_file')}")
        lines.append(f"- occupied_ratio: {review.get('metrics', {}).get('occupied_ratio')}")
        lines.append(f"- primary_points: {review.get('metrics', {}).get('primary_points')}")
        lines.append(f"- speaker_seconds: {review.get('metrics', {}).get('speaker_seconds')}")
        if review.get('issues'):
            lines.append(f"- issues: {', '.join(review['issues'])}")
        else:
            lines.append('- issues: none')
        lines.append('')
    return '\n'.join(lines).strip() + '\n'


async def collect_review(args: argparse.Namespace) -> Dict[str, Any]:
    global FRAME_WIDTH, FRAME_HEIGHT
    FRAME_WIDTH = float(args.frame_width)
    FRAME_HEIGHT = float(args.frame_height)
    html_file = Path(args.html).resolve()
    if not html_file.exists():
        fail(f'HTML file not found: {html_file}')
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as playwright:
        browser = None
        launch_errors = []
        try:
            browser = await playwright.chromium.launch()
        except Exception as exc:
            launch_errors.append(str(exc))
            for candidate in CHROME_CANDIDATES:
                if Path(candidate).is_file():
                    browser = await playwright.chromium.launch(executable_path=candidate)
                    break
        if browser is None:
            fail("无法启动浏览器进行截图: " + " | ".join(launch_errors))
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=args.device_scale_factor if args.device_scale_factor else 2.0,
        )
        page = await context.new_page()
        try:
            await page.goto(html_file.as_uri(), wait_until='networkidle')
            await page.wait_for_function("() => Boolean(window.redcubeDeckReview)")
            total = await page.evaluate(
                """
                () => typeof window.redcubeDeckReview.totalSlides === 'function'
                  ? window.redcubeDeckReview.totalSlides()
                  : window.redcubeDeckReview.totalSlides
                """
            )
            slide_reviews: List[Dict[str, Any]] = []
            for index in range(total):
                await page.evaluate('(slideIndex) => window.redcubeDeckReview.showSlide(slideIndex)', index)
                await page.wait_for_timeout(120)
                info = await page.evaluate('() => window.redcubeDeckReview.inspectCurrentSlide()')
                screenshot_file = output_dir / f'slide-{index + 1:02d}.png'
                await page.locator('.slide.visible .slide-content-wrapper').screenshot(path=str(screenshot_file))
                review = review_slide(info, args.max_primary_points)
                review['screenshot_file'] = str(screenshot_file)
                slide_reviews.append(review)
        finally:
            await context.close()
            await browser.close()

    title_metrics = apply_title_typography_consistency(slide_reviews)
    screenshot_dimensions = {
        'width': int(round(float(args.frame_width) * float(args.device_scale_factor))),
        'height': int(round(float(args.frame_height) * float(args.device_scale_factor))),
    }
    checks = summarize_checks(slide_reviews)
    baseline_summary = None
    if args.baseline_review:
        baseline_summary = baseline_check(slide_reviews, Path(args.baseline_review).resolve())
        checks['baseline_comparison_passed'] = baseline_summary['baseline_comparison_passed']

    result = {
        'status': 'pass' if all(checks.values()) else 'block',
        'checks': checks,
        'slide_reviews': slide_reviews,
        'metrics': {
            'slide_count': len(slide_reviews),
            'average_density': round(statistics.mean([review['metrics']['occupied_ratio'] for review in slide_reviews]) if slide_reviews else 0.0, 4),
            'title_typography_reference': title_metrics['reference_font_size'],
        },
        'device_scale_factor': float(args.device_scale_factor),
        'screenshot_dimensions': screenshot_dimensions,
    }
    if baseline_summary is not None:
        result['baseline'] = baseline_summary

    if args.review_markdown:
        review_markdown = Path(args.review_markdown).resolve()
        review_markdown.parent.mkdir(parents=True, exist_ok=True)
        review_markdown.write_text(build_markdown(result), encoding='utf-8')
        result['review_markdown'] = str(review_markdown)

    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Review ppt_deck HTML by taking slide screenshots and computing layout checks.')
    parser.add_argument('--html', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--review-markdown')
    parser.add_argument('--baseline-review')
    parser.add_argument('--max-primary-points', type=int, default=5)
    parser.add_argument('--frame-width', type=float, default=1152)
    parser.add_argument('--frame-height', type=float, default=648)
    parser.add_argument('--device-scale-factor', type=float, default=DEFAULT_DEVICE_SCALE_FACTOR)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = asyncio.run(collect_review(args))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
