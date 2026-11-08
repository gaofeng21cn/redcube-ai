import statistics
from pathlib import Path
from typing import Any, Dict, List


def fail(message: str) -> None:
    raise ValueError(message)


def baseline_check(slide_reviews: List[Dict[str, Any]], baseline_file: Path) -> Dict[str, Any]:
    if not baseline_file.exists():
        fail(f'Baseline review file not found: {baseline_file}')
    baseline = __import__('json').loads(baseline_file.read_text(encoding='utf-8'))
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
