#!/usr/bin/env python3
import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

from playwright.async_api import async_playwright

from redcube_ai.native_helpers.ppt_deck.review_consistency import (
    apply_page_number_consistency,
    apply_title_typography_consistency,
)
from redcube_ai.native_helpers.ppt_deck.review_geometry import (
    BLOCK_CONTENT_OVERFLOW_TOLERANCE,
    DEFAULT_DEVICE_SCALE_FACTOR,
    EDGE_CLEARANCE_IGNORED_IDS,
    MAX_TABLE_CELL_BLANK_RATIO,
    MIN_ADJACENT_READABLE_BLOCK_GAP,
    MIN_ADJACENT_READABLE_BLOCK_OVERLAP_PIXELS,
    MIN_ADJACENT_READABLE_BLOCK_OVERLAP_RATIO,
    MIN_SPEAKER_SECONDS,
    MIN_SURFACE_TARGET_GAP,
    MIN_SURFACE_TARGET_OVERLAP_PIXELS,
    MIN_SURFACE_TARGET_OVERLAP_RATIO,
    MAX_SPEAKER_SECONDS,
    SURFACE_SCROLL_OVERFLOW_TOLERANCE,
    collect_edge_failures,
    density_metrics,
    issue_list,
    overlap_failures,
    overflow_is_free,
    review_blocks,
    set_frame_size,
    table_legibility_failures,
    text_fragments,
    title_safe_zone_failures,
)
from redcube_ai.native_helpers.ppt_deck.review_summary import (
    baseline_check as compute_baseline_check,
    build_markdown,
)

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


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
    set_frame_size(args.frame_width, args.frame_height)
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
                      const visibleText = normalizePageNumberText(wrapper.textContent || '');
                      const tableMetrics = Array.from(wrapper.querySelectorAll('table, [data-table], [role="table"]'))
                        .filter((node) => node instanceof Element && isVisibleElement(node))
                        .map((node, tableIndex) => {{
                          const cells = Array.from(node.querySelectorAll('th, td, [role="cell"], [role="columnheader"], [role="rowheader"]'))
                            .filter((cell) => cell instanceof Element && isVisibleElement(cell));
                          const cellMetrics = cells.map((cell) => {{
                            const style = window.getComputedStyle(cell);
                            const rect = cell.getBoundingClientRect();
                            const text = normalizePageNumberText(cell.textContent || '');
                            const textLength = normalizeText(text).length;
                            const area = Math.max(1, rect.width * rect.height);
                            const fontSize = Number.parseFloat(style.fontSize || '0') || 0;
                            const estimatedTextArea = textLength * Math.max(fontSize, 1) * Math.max(fontSize * 0.62, 1);
                            return {{
                              fontSize,
                              blankRatio: Math.max(0, Math.min(1, 1 - (estimatedTextArea / area))),
                            }};
                          }});
                          const minFontPx = cellMetrics.length
                            ? Math.min(...cellMetrics.map((metric) => metric.fontSize).filter((value) => value > 0))
                            : null;
                          const maxBlankRatio = cellMetrics.length
                            ? Math.max(...cellMetrics.map((metric) => metric.blankRatio))
                            : 0;
                          return {{
                            table_id: node.getAttribute('data-table') || node.getAttribute('data-qa-block') || `table-${{tableIndex + 1}}`,
                            cell_count: cells.length,
                            min_font_px: minFontPx,
                            max_blank_ratio: round(maxBlankRatio),
                          }};
                        }});
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
                        visibleText,
                        tableMetrics,
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
        try:
            baseline_summary = compute_baseline_check(slide_reviews, Path(args.baseline_review).resolve())
        except ValueError as exc:
            fail(str(exc))
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
