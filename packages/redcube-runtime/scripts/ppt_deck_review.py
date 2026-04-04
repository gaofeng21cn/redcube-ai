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


def review_slide(info: Dict[str, Any], max_primary_points: int) -> Dict[str, Any]:
    wrapper = info.get('wrapper', {}) or {}
    blocks = info.get('blocks', []) or []
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

    return {
        'slide_id': info.get('slideId'),
        'title': info.get('title'),
        'layout_family': info.get('layoutFamily'),
        'checks': {
            'overflow_free': overflow_free,
            'occlusion_free': occlusion_free,
            'visual_density_ok': visual_density_ok,
            'speaker_fit_ok': speaker_fit_ok,
        },
        'metrics': {
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'speaker_seconds': speaker_seconds,
            'overlaps': overlaps,
        },
        'issues': issues,
    }


def summarize_checks(slide_reviews: List[Dict[str, Any]]) -> Dict[str, bool]:
    keys = ['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok']
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
    passed = current_failures <= baseline_failures and current_avg <= baseline_avg + 0.08
    return {
        'baseline_comparison_passed': passed,
        'baseline_review_file': str(baseline_file),
        'current_average_density': round(current_avg, 4),
        'baseline_average_density': round(baseline_avg, 4),
        'current_failed_slides': current_failures,
        'baseline_failed_slides': baseline_failures,
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
        page = await browser.new_page(viewport={'width': 1440, 'height': 1024})
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
            await browser.close()

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
        },
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
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = asyncio.run(collect_review(args))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
