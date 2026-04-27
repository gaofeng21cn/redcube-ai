#!/usr/bin/env python3
import argparse
import asyncio
import json
import statistics
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

from playwright.async_api import async_playwright

from redcube_ai.native_helpers.ppt_deck.review_consistency import (
    apply_page_number_consistency,
    apply_title_typography_consistency,
)

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
MIN_ADJACENT_READABLE_BLOCK_GAP = 6.0
MIN_ADJACENT_READABLE_BLOCK_OVERLAP_PIXELS = 48.0
MIN_ADJACENT_READABLE_BLOCK_OVERLAP_RATIO = 0.25
MIN_SURFACE_TARGET_GAP = 8.0
MIN_SURFACE_TARGET_OVERLAP_PIXELS = 8.0
MIN_SURFACE_TARGET_OVERLAP_RATIO = 0.04
SURFACE_SCROLL_OVERFLOW_TOLERANCE = 4.0
EDGE_CLEARANCE_IGNORED_IDS = ('page-number', 'page_no', 'page-no', 'slide-number', 'pager')
INTERNAL_PADDING_ROLE_HINTS = ('card', 'panel', 'zone', 'row', 'stack', 'ladder', 'notes', 'band', 'summary', 'takeaway')
BLOCK_CONTENT_OVERFLOW_TOLERANCE = 1.5


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


def review_slide(info: Dict[str, Any], max_primary_points: int) -> Dict[str, Any]:
    wrapper = info.get('wrapper', {}) or {}
    blocks = [
        block for block in (info.get('blocks', []) or [])
        if not is_decorative_surface_container(block)
    ]
    audit_blocks = info.get('auditBlocks', []) or []
    title_meta = info.get('titleMeta', {}) or {}
    block_content_audit = info.get('blockContentAudit', {}) or {}
    page_number_audit = info.get('pageNumberAudit', {}) or {'present': False}
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

    block_content_failures = block_content_audit.get('failures', []) or []
    block_content_occlusion_failures = [
        failure for failure in block_content_failures
        if failure.get('overflow_reason') == 'surface_text_targets_overlap'
    ]
    if block_content_occlusion_failures:
        occlusion_free = False
        if 'occlusion_detected' not in issues:
            issues.append('occlusion_detected')
    block_content_fit_ok = len(block_content_failures) == 0
    if not block_content_fit_ok:
        issues.append('block_content_overflow_detected')

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
            'block_content_fit_ok': block_content_fit_ok,
            'title_typography_ok': True,
            'page_number_consistency_ok': True,
        },
        'metrics': {
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'speaker_seconds': speaker_seconds,
            'overlaps': overlaps,
            'edge_clearance_failures': edge_failures,
            'block_content_failures': block_content_failures,
            'title_font_size': round(float(title_meta.get('titleFontSize', 0) or 0), 2),
            'title_line_count': int(title_meta.get('titleLineCount', 0) or 0),
            'title_block_id': title_meta.get('titleBlockId'),
            'page_number_audit': page_number_audit,
        },
        'issues': issues,
    }


def summarize_checks(slide_reviews: List[Dict[str, Any]]) -> Dict[str, bool]:
    keys = ['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok', 'edge_clearance_ok', 'block_content_fit_ok', 'title_typography_ok', 'page_number_consistency_ok']
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


def target_slide_indexes(slide_ids: str, total: int) -> List[int]:
    ids = [item.strip() for item in str(slide_ids or '').split(',') if item.strip()]
    if not ids:
        return list(range(total))
    indexes: List[int] = []
    for slide_id in ids:
        digits = ''.join(ch for ch in slide_id if ch.isdigit())
        if not digits:
            continue
        index = int(digits) - 1
        if 0 <= index < total and index not in indexes:
            indexes.append(index)
    return indexes or list(range(total))


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
            for index in target_slide_indexes(args.slide_ids, int(total or 0)):
                await page.evaluate('(slideIndex) => window.redcubeDeckReview.showSlide(slideIndex)', index)
                await page.wait_for_timeout(120)
                info = await page.evaluate(
                    f"""
                    () => {{
                      const base = window.redcubeDeckReview.inspectCurrentSlide();
                      const wrapper = document.querySelector('.slide.visible .slide-content-wrapper');
                      const tolerance = {BLOCK_CONTENT_OVERFLOW_TOLERANCE};
                      const minAdjacentReadableBlockGap = {MIN_ADJACENT_READABLE_BLOCK_GAP};
                      const minAdjacentReadableBlockOverlapPixels = {MIN_ADJACENT_READABLE_BLOCK_OVERLAP_PIXELS};
                      const minAdjacentReadableBlockOverlapRatio = {MIN_ADJACENT_READABLE_BLOCK_OVERLAP_RATIO};
                      const minSurfaceTargetGap = {MIN_SURFACE_TARGET_GAP};
                      const minSurfaceTargetOverlapPixels = {MIN_SURFACE_TARGET_OVERLAP_PIXELS};
                      const minSurfaceTargetOverlapRatio = {MIN_SURFACE_TARGET_OVERLAP_RATIO};
                      const surfaceScrollOverflowTolerance = {SURFACE_SCROLL_OVERFLOW_TOLERANCE};
                      const adjacentReadableBlockIgnoreIdTokens = {json.dumps(EDGE_CLEARANCE_IGNORED_IDS)};
                      const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
                      const normalizeText = (value) => String(value || '').replace(/\\s+/g, '').trim();
                      const normalizePageNumberText = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
                      const classifyPageNumberSyntax = (text) => {{
                        const normalized = normalizePageNumberText(text);
                        if (/^\\d{{2}}$/.test(normalized)) return 'two_digit';
                        if (/^\\d+$/.test(normalized)) return 'plain_number';
                        if (/^\\d+\\s*\\/\\s*\\d+$/.test(normalized)) return 'current_total_slash';
                        if (/^P\\s*\\d+$/i.test(normalized)) return 'p_prefixed';
                        if (/^第\\s*\\d+\\s*页$/.test(normalized)) return 'chinese_page';
                        return normalized ? 'custom' : 'missing';
                      }};
                      const parseRgb = (value) => {{
                        const match = String(value || '').match(/rgba?\\(([^)]+)\\)/i);
                        if (!match) return null;
                        return match[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()));
                      }};
                      const classifyPositionFamily = (rect) => {{
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const horizontal = centerX < bounds.width * 0.33 ? 'left' : (centerX > bounds.width * 0.67 ? 'right' : 'center');
                        const vertical = centerY < bounds.height * 0.33 ? 'top' : (centerY > bounds.height * 0.67 ? 'bottom' : 'middle');
                        return `${{vertical}}-${{horizontal}}`;
                      }};
                      const isVisibleElement = (node) => {{
                        if (!(node instanceof Element)) return false;
                        const style = window.getComputedStyle(node);
                        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) {{
                          return false;
                        }}
                        const rect = node.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                      }};
                      const rectRelativeToBounds = (rect, bounds) => {{
                        const left = rect.left - bounds.left;
                        const top = rect.top - bounds.top;
                        const width = rect.width;
                        const height = rect.height;
                        return {{
                          left: round(left),
                          top: round(top),
                          width: round(width),
                          height: round(height),
                          right: round(left + width),
                          bottom: round(top + height),
                        }};
                      }};
                      const hasDecorativeSurface = (node) => {{
                        if (!(node instanceof Element)) return false;
                        const rect = node.getBoundingClientRect();
                        if (rect.width < 12 || rect.height < 12) return false;
                        const style = window.getComputedStyle(node);
                        const backgroundColor = style.backgroundColor || '';
                        const hasBackground = !['rgba(0, 0, 0, 0)', 'transparent'].includes(backgroundColor);
                        const hasBorder = ['Top', 'Right', 'Bottom', 'Left']
                          .some((side) => Number.parseFloat(style[`border${{side}}Width`] || '0') > 0);
                        const hasShadow = style.boxShadow && style.boxShadow !== 'none';
                        const hasRadius = Number.parseFloat(style.borderTopLeftRadius || '0') > 0;
                        return hasBackground || hasBorder || hasShadow || hasRadius;
                      }};
                      const isSurfaceTextTarget = (node) => {{
                        if (!(node instanceof Element) || !isVisibleElement(node)) return false;
                        if (!normalizeText(node.textContent || '')) return false;
                        return hasDecorativeSurface(node);
                      }};
                      const collectAuditTargets = (blockNode) => {{
                        if (!(blockNode instanceof Element) || !isVisibleElement(blockNode)) return [];
                        const targets = [];
                        if (isSurfaceTextTarget(blockNode)) {{
                          targets.push(blockNode);
                        }}
                        for (const node of Array.from(blockNode.querySelectorAll('*'))) {{
                          if (isSurfaceTextTarget(node)) {{
                            targets.push(node);
                          }}
                        }}
                        return targets;
                      }};
                      const buildRelativeRectFromNodes = (nodes) => {{
                        const rects = nodes
                          .map((node) => {{
                            if (!(node instanceof Element) || !isVisibleElement(node)) return null;
                            return rectRelativeToBounds(node.getBoundingClientRect(), bounds);
                          }})
                          .filter(Boolean);
                        if (rects.length === 0) return null;
                        const left = Math.min(...rects.map((rect) => rect.left));
                        const top = Math.min(...rects.map((rect) => rect.top));
                        const right = Math.max(...rects.map((rect) => rect.right));
                        const bottom = Math.max(...rects.map((rect) => rect.bottom));
                        return {{
                          left: round(left),
                          top: round(top),
                          right: round(right),
                          bottom: round(bottom),
                          width: round(right - left),
                          height: round(bottom - top),
                        }};
                      }};
                      const overflowSidesForRects = (innerRect, outerRect) => {{
                        if (!innerRect || !outerRect) return [];
                        const overflowSides = [];
                        if (innerRect.left < outerRect.left - tolerance) overflowSides.push('left');
                        if (innerRect.top < outerRect.top - tolerance) overflowSides.push('top');
                        if (innerRect.right > outerRect.right + tolerance) overflowSides.push('right');
                        if (innerRect.bottom > outerRect.bottom + tolerance) overflowSides.push('bottom');
                        return Array.from(new Set(overflowSides));
                      }};
                      const collectUncoveredTextFailures = () => {{
                        const failures = [];
                        const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, {{
                          acceptNode(textNode) {{
                            if (!(textNode instanceof Text)) return NodeFilter.FILTER_REJECT;
                            if (!normalizeText(textNode.textContent || '')) return NodeFilter.FILTER_REJECT;
                            const parent = textNode.parentElement;
                            if (!parent || !wrapper.contains(parent)) return NodeFilter.FILTER_REJECT;
                            if (parent.closest('[data-qa-block]')) return NodeFilter.FILTER_REJECT;
                            if (parent.closest('script, style, [aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
                            if (!isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
                            return NodeFilter.FILTER_ACCEPT;
                          }},
                        }});
                        let index = 0;
                        while (walker.nextNode()) {{
                          const textNode = walker.currentNode;
                          const range = document.createRange();
                          range.selectNodeContents(textNode);
                          const textRects = Array.from(range.getClientRects())
                            .filter((rect) => rect.width > 0 && rect.height > 0)
                            .map((rect) => rectRelativeToBounds(rect, bounds));
                          if (textRects.length === 0) continue;
                          const contentRect = buildRelativeRectFromNodes([textNode.parentElement]) || {{
                            left: round(Math.min(...textRects.map((rect) => rect.left))),
                            top: round(Math.min(...textRects.map((rect) => rect.top))),
                            right: round(Math.max(...textRects.map((rect) => rect.right))),
                            bottom: round(Math.max(...textRects.map((rect) => rect.bottom))),
                          }};
                          index += 1;
                          failures.push({{
                            block_id: `untagged-text-${{index}}`,
                            target_tag: textNode.parentElement.tagName.toLowerCase(),
                            overflow_sides: [],
                            scroll_overflow_x: false,
                            scroll_overflow_y: false,
                            block_rect: contentRect,
                            overflow_reason: 'untagged_text_block',
                            text_rect_count: textRects.length,
                          }});
                        }}
                        return failures;
                      }};
                      const collectAdjacentReadableBlockFailures = (readableBlockNodes) => {{
                        const readableBlocks = readableBlockNodes
                          .filter((node) => node instanceof Element)
                          .filter((node) => {{
                            const blockId = String(node.getAttribute('data-qa-block') || '').toLowerCase();
                            if (adjacentReadableBlockIgnoreIdTokens.some((token) => blockId.includes(token))) return false;
                            return normalizeText(node.textContent || '').length > 0 && isVisibleElement(node);
                          }})
                          .map((node, index) => {{
                            const rect = rectRelativeToBounds(node.getBoundingClientRect(), bounds);
                            return {{
                              node,
                              id: node.getAttribute('data-qa-block') || `readable-block-${{index + 1}}`,
                              tag: node.tagName.toLowerCase(),
                              rect,
                            }};
                          }})
                          .filter((item) => item.rect.width > 0 && item.rect.height > 0);
                        const failures = [];
                        const horizontalOverlap = (left, right) => Math.max(
                          0,
                          Math.min(left.rect.right, right.rect.right) - Math.max(left.rect.left, right.rect.left),
                        );
                        const verticalOverlap = (left, right) => Math.max(
                          0,
                          Math.min(left.rect.bottom, right.rect.bottom) - Math.max(left.rect.top, right.rect.top),
                        );
                        const hasEnoughHorizontalOverlap = (left, right) => {{
                          const overlap = horizontalOverlap(left, right);
                          const threshold = Math.max(
                            minAdjacentReadableBlockOverlapPixels,
                            Math.min(left.rect.width, right.rect.width) * minAdjacentReadableBlockOverlapRatio,
                          );
                          return overlap >= threshold;
                        }};
                        const hasEnoughVerticalOverlap = (left, right) => {{
                          const overlap = verticalOverlap(left, right);
                          const threshold = Math.max(
                            minAdjacentReadableBlockOverlapPixels,
                            Math.min(left.rect.height, right.rect.height) * minAdjacentReadableBlockOverlapRatio,
                          );
                          return overlap >= threshold;
                        }};
                        const pushFailure = (primary, adjacent, axis, gap, overlap) => {{
                          failures.push({{
                            block_id: primary.id,
                            adjacent_block_id: adjacent.id,
                            target_tag: primary.tag,
                            overflow_sides: [],
                            scroll_overflow_x: false,
                            scroll_overflow_y: false,
                            block_rect: primary.rect,
                            adjacent_block_rect: adjacent.rect,
                            overflow_reason: 'adjacent_readable_blocks_too_close',
                            clearance_axis: axis,
                            gap: round(gap),
                            threshold: round(minAdjacentReadableBlockGap),
                            overlap: round(overlap),
                          }});
                        }};
                        for (let index = 0; index < readableBlocks.length; index += 1) {{
                          const current = readableBlocks[index];
                          for (const other of readableBlocks.slice(index + 1)) {{
                            if (current.node.contains(other.node) || other.node.contains(current.node)) continue;
                            const upper = current.rect.top <= other.rect.top ? current : other;
                            const lower = upper === current ? other : current;
                            const verticalGap = lower.rect.top - upper.rect.bottom;
                            if (
                              verticalGap >= -tolerance
                              && verticalGap < minAdjacentReadableBlockGap
                              && hasEnoughHorizontalOverlap(upper, lower)
                            ) {{
                              pushFailure(upper, lower, 'vertical', verticalGap, horizontalOverlap(upper, lower));
                              continue;
                            }}
                            const left = current.rect.left <= other.rect.left ? current : other;
                            const right = left === current ? other : current;
                            const horizontalGap = right.rect.left - left.rect.right;
                            if (
                              horizontalGap >= -tolerance
                              && horizontalGap < minAdjacentReadableBlockGap
                              && hasEnoughVerticalOverlap(left, right)
                            ) {{
                              pushFailure(left, right, 'horizontal', horizontalGap, verticalOverlap(left, right));
                            }}
                          }}
                        }}
                        return failures;
                      }};
                      if (!(wrapper instanceof Element)) {{
                        return {{
                          ...base,
                          blockContentAudit: {{ failures: [] }},
                          pageNumberAudit: {{ present: false }},
                        }};
                      }}
                      const bounds = wrapper.getBoundingClientRect();
                      const pageNumberIdTokens = {json.dumps(EDGE_CLEARANCE_IGNORED_IDS)};
                      const pageNumberPattern = /^(?:\\d{{1,2}}|\\d+\\s*\\/\\s*\\d+|P\\s*\\d+|第\\s*\\d+\\s*页)$/i;
                      const pageNumberNodes = Array.from(wrapper.querySelectorAll('[data-qa-block], [data-page-number], [aria-label]'))
                        .filter((node) => node instanceof Element && isVisibleElement(node))
                        .filter((node) => {{
                          const blockId = String(node.getAttribute('data-qa-block') || node.getAttribute('data-page-number') || node.getAttribute('aria-label') || '').toLowerCase();
                          const text = normalizePageNumberText(node.textContent || '');
                          return pageNumberIdTokens.some((token) => blockId.includes(token)) || pageNumberPattern.test(text);
                        }});
                      const pageNumberNode = pageNumberNodes[0] || null;
                      let pageNumberAudit = {{ present: false }};
                      if (pageNumberNode) {{
                        const rect = rectRelativeToBounds(pageNumberNode.getBoundingClientRect(), bounds);
                        const style = window.getComputedStyle(pageNumberNode);
                        const text = normalizePageNumberText(pageNumberNode.textContent || '');
                        pageNumberAudit = {{
                          present: true,
                          block_id: pageNumberNode.getAttribute('data-qa-block') || pageNumberNode.getAttribute('data-page-number') || null,
                          text,
                          syntax_family: classifyPageNumberSyntax(text),
                          position_family: classifyPositionFamily(rect),
                          font_size: round(Number.parseFloat(style.fontSize || '0')),
                          font_weight: String(style.fontWeight || ''),
                          color: style.color || '',
                          color_rgb: parseRgb(style.color || ''),
                          rect: {{
                            ...rect,
                            right_gap: round(bounds.width - rect.right),
                            bottom_gap: round(bounds.height - rect.bottom),
                          }},
                        }};
                      }}
                      const qaBlocks = Array.from(wrapper.querySelectorAll('[data-qa-block]'))
                        .filter((node) => isVisibleElement(node));
                      const leafBlocks = qaBlocks
                        .filter((node) => !node.querySelector('[data-qa-block]'))
                        .filter((node) => isVisibleElement(node));
                      const parentGroups = qaBlocks.filter((node) => {{
                        if (!node.querySelector('[data-qa-block]')) return false;
                        const style = window.getComputedStyle(node);
                        const hasExplicitFrame = ['Top', 'Right', 'Bottom', 'Left']
                          .some((side) => Number.parseFloat(style[`border${{side}}Width`] || '0') > 0);
                        return hasExplicitFrame && hasDecorativeSurface(node);
                      }});
                      const adjacentReadableBlockFailures = collectAdjacentReadableBlockFailures(leafBlocks);
                      const collectSurfaceTargetFailures = (blockId, targets) => {{
                        const failures = [];
                        const surfacedTargets = targets
                          .filter((node) => node instanceof Element && isVisibleElement(node))
                          .map((node, index) => ({{
                            node,
                            id: `${{blockId}}:surface-${{index + 1}}`,
                            tag: node.tagName.toLowerCase(),
                            rect: rectRelativeToBounds(node.getBoundingClientRect(), bounds),
                          }}))
                          .filter((item) => item.rect.width > 0 && item.rect.height > 0);
                        for (const target of surfacedTargets) {{
                          const scrollOverflowX = (target.node.scrollWidth || 0) > (target.node.clientWidth || 0) + surfaceScrollOverflowTolerance;
                          const scrollOverflowY = (target.node.scrollHeight || 0) > (target.node.clientHeight || 0) + surfaceScrollOverflowTolerance;
                          if (scrollOverflowX || scrollOverflowY) {{
                            failures.push({{
                              block_id: blockId,
                              target_id: target.id,
                              target_tag: target.tag,
                              overflow_sides: [
                                ...(scrollOverflowX ? ['right'] : []),
                                ...(scrollOverflowY ? ['bottom'] : []),
                              ],
                              scroll_overflow_x: scrollOverflowX,
                              scroll_overflow_y: scrollOverflowY,
                              scroll_overflow_x_px: round((target.node.scrollWidth || 0) - (target.node.clientWidth || 0)),
                              scroll_overflow_y_px: round((target.node.scrollHeight || 0) - (target.node.clientHeight || 0)),
                              block_rect: target.rect,
                              overflow_reason: 'surface_text_scroll_overflow',
                            }});
                          }}
                        }}
                        const horizontalOverlap = (left, right) => Math.max(0, Math.min(left.rect.right, right.rect.right) - Math.max(left.rect.left, right.rect.left));
                        const verticalOverlap = (left, right) => Math.max(0, Math.min(left.rect.bottom, right.rect.bottom) - Math.max(left.rect.top, right.rect.top));
                        const overlapThreshold = (left, right, axis) => Math.max(
                          minSurfaceTargetOverlapPixels,
                          Math.min(axis === 'horizontal' ? left.rect.width : left.rect.height, axis === 'horizontal' ? right.rect.width : right.rect.height) * minSurfaceTargetOverlapRatio,
                        );
                        for (let index = 0; index < surfacedTargets.length; index += 1) {{
                          const current = surfacedTargets[index];
                          for (const other of surfacedTargets.slice(index + 1)) {{
                            if (current.node.contains(other.node) || other.node.contains(current.node)) continue;
                            const xOverlap = horizontalOverlap(current, other);
                            const yOverlap = verticalOverlap(current, other);
                            const overlapArea = xOverlap * yOverlap;
                            const smallerArea = Math.max(1, Math.min(current.rect.width * current.rect.height, other.rect.width * other.rect.height));
                            if (
                              xOverlap > overlapThreshold(current, other, 'horizontal')
                              && yOverlap > overlapThreshold(current, other, 'vertical')
                              && overlapArea / smallerArea >= minSurfaceTargetOverlapRatio
                            ) {{
                              failures.push({{
                                block_id: blockId,
                                target_id: current.id,
                                adjacent_target_id: other.id,
                                target_tag: current.tag,
                                overflow_sides: [],
                                scroll_overflow_x: false,
                                scroll_overflow_y: false,
                                block_rect: current.rect,
                                adjacent_block_rect: other.rect,
                                overflow_reason: 'surface_text_targets_overlap',
                                overlap_width: round(xOverlap),
                                overlap_height: round(yOverlap),
                                overlap_ratio: round(overlapArea / smallerArea),
                              }});
                              continue;
                            }}
                            const upper = current.rect.top <= other.rect.top ? current : other;
                            const lower = upper === current ? other : current;
                            const verticalGap = lower.rect.top - upper.rect.bottom;
                            if (
                              verticalGap >= -tolerance
                              && verticalGap < minSurfaceTargetGap
                              && xOverlap >= Math.max(minAdjacentReadableBlockOverlapPixels, Math.min(upper.rect.width, lower.rect.width) * minAdjacentReadableBlockOverlapRatio)
                            ) {{
                              failures.push({{
                                block_id: blockId,
                                target_id: upper.id,
                                adjacent_target_id: lower.id,
                                target_tag: upper.tag,
                                overflow_sides: [],
                                scroll_overflow_x: false,
                                scroll_overflow_y: false,
                                block_rect: upper.rect,
                                adjacent_block_rect: lower.rect,
                                overflow_reason: 'surface_text_targets_too_close',
                                clearance_axis: 'vertical',
                                gap: round(verticalGap),
                                threshold: round(minSurfaceTargetGap),
                                overlap: round(xOverlap),
                              }});
                              continue;
                            }}
                            const left = current.rect.left <= other.rect.left ? current : other;
                            const right = left === current ? other : current;
                            const horizontalGap = right.rect.left - left.rect.right;
                            if (
                              horizontalGap >= -tolerance
                              && horizontalGap < minSurfaceTargetGap
                              && yOverlap >= Math.max(minAdjacentReadableBlockOverlapPixels, Math.min(left.rect.height, right.rect.height) * minAdjacentReadableBlockOverlapRatio)
                            ) {{
                              failures.push({{
                                block_id: blockId,
                                target_id: left.id,
                                adjacent_target_id: right.id,
                                target_tag: left.tag,
                                overflow_sides: [],
                                scroll_overflow_x: false,
                                scroll_overflow_y: false,
                                block_rect: left.rect,
                                adjacent_block_rect: right.rect,
                                overflow_reason: 'surface_text_targets_too_close',
                                clearance_axis: 'horizontal',
                                gap: round(horizontalGap),
                                threshold: round(minSurfaceTargetGap),
                                overlap: round(yOverlap),
                              }});
                            }}
                          }}
                        }}
                        return failures;
                      }};
                      const collectTextOverflowFailures = (blockId, targets) => {{
                        const failures = [];
                        for (const target of targets.filter((node) => node instanceof Element && isVisibleElement(node))) {{
                          const targetRect = target.getBoundingClientRect();
                          const targetRelative = rectRelativeToBounds(targetRect, bounds);
                          const textRects = [];
                          const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {{
                            acceptNode(textNode) {{
                              if (!(textNode instanceof Text)) return NodeFilter.FILTER_REJECT;
                              if (!textNode.parentElement || !target.contains(textNode.parentElement)) return NodeFilter.FILTER_REJECT;
                              if (!isVisibleElement(textNode.parentElement)) return NodeFilter.FILTER_REJECT;
                              if (!normalizeText(textNode.textContent || '')) return NodeFilter.FILTER_REJECT;
                              return NodeFilter.FILTER_ACCEPT;
                            }},
                          }});
                          while (walker.nextNode()) {{
                            const textNode = walker.currentNode;
                            const range = document.createRange();
                            range.selectNodeContents(textNode);
                            for (const rect of Array.from(range.getClientRects())) {{
                              if (rect.width <= 0 || rect.height <= 0) continue;
                              textRects.push(rectRelativeToBounds(rect, bounds));
                            }}
                          }}
                          if (textRects.length === 0) continue;
                          const overflowSides = [];
                          if (textRects.some((rect) => rect.left < targetRelative.left - tolerance)) overflowSides.push('left');
                          if (textRects.some((rect) => rect.top < targetRelative.top - tolerance)) overflowSides.push('top');
                          if (textRects.some((rect) => rect.right > targetRelative.right + tolerance)) overflowSides.push('right');
                          if (textRects.some((rect) => rect.bottom > targetRelative.bottom + tolerance)) overflowSides.push('bottom');
                          if (overflowSides.length === 0) continue;
                          failures.push({{
                            block_id: blockId,
                            target_tag: target.tagName.toLowerCase(),
                            overflow_sides: Array.from(new Set(overflowSides)),
                            scroll_overflow_x: (target.scrollWidth || 0) > (target.clientWidth || 0) + 1,
                            scroll_overflow_y: (target.scrollHeight || 0) > (target.clientHeight || 0) + 1,
                            block_rect: targetRelative,
                            overflow_reason: 'block_text_overflow',
                            text_rect_count: textRects.length,
                            max_text_right: round(Math.max(...textRects.map((rect) => rect.right))),
                            max_text_bottom: round(Math.max(...textRects.map((rect) => rect.bottom))),
                          }});
                        }}
                        return failures;
                      }};
                      const collectLocalGroupAuditTargets = (groupNode) => collectAuditTargets(groupNode)
                        .filter((target) => target === groupNode || target.closest('[data-qa-block]') === groupNode);
                      const leafFailures = leafBlocks.flatMap((node, index) => {{
                        const blockId = node.getAttribute('data-qa-block') || `block-${{index + 1}}`;
                        const auditTargets = collectAuditTargets(node);
                        return [
                          ...collectTextOverflowFailures(blockId, auditTargets),
                          ...collectSurfaceTargetFailures(blockId, auditTargets),
                        ];
                      }});
                      const groupFailures = parentGroups.flatMap((node, index) => {{
                        const groupId = node.getAttribute('data-qa-block') || `group-${{index + 1}}`;
                        const groupRect = rectRelativeToBounds(node.getBoundingClientRect(), bounds);
                        const descendantBlocks = Array.from(node.querySelectorAll('[data-qa-block]'))
                          .filter((child) => child !== node && isVisibleElement(child));
                        const contentRect = buildRelativeRectFromNodes(descendantBlocks);
                        const overflowSides = overflowSidesForRects(contentRect, groupRect);
                        const failures = [];
                        if (overflowSides.length > 0) {{
                          failures.push({{
                            block_id: groupId,
                            target_tag: node.tagName.toLowerCase(),
                            overflow_sides: overflowSides,
                            scroll_overflow_x: false,
                            scroll_overflow_y: false,
                            block_rect: groupRect,
                            content_rect: contentRect,
                            overflow_reason: 'parent_group_frame_overflow',
                            child_block_count: descendantBlocks.length,
                          }});
                        }}
                        const localTargets = collectLocalGroupAuditTargets(node);
                        failures.push(...collectTextOverflowFailures(groupId, localTargets));
                        failures.push(...collectSurfaceTargetFailures(groupId, localTargets));
                        return failures;
                      }});
                      const failures = [
                        ...leafFailures,
                        ...groupFailures,
                        ...collectUncoveredTextFailures(),
                        ...adjacentReadableBlockFailures,
                      ];
                      return {{
                        ...base,
                        blockContentAudit: {{ failures }},
                        pageNumberAudit,
                      }};
                    }}
                    """
                )
                screenshot_file = output_dir / f'slide-{index + 1:02d}.png'
                await page.locator('.slide.visible .slide-content-wrapper').screenshot(path=str(screenshot_file))
                review = review_slide(info, args.max_primary_points)
                review['screenshot_file'] = str(screenshot_file)
                slide_reviews.append(review)
        finally:
            await context.close()
            await browser.close()

    title_metrics = apply_title_typography_consistency(slide_reviews)
    page_number_metrics = apply_page_number_consistency(slide_reviews)
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
            'page_number_consistency': page_number_metrics,
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
    parser.add_argument('--slide-ids', default='')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = asyncio.run(collect_review(args))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
