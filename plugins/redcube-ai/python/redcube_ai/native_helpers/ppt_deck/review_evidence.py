"""Bind real page images to RCA observations; report measurements, never verdicts."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

DIMENSIONS = ('content', 'facts', 'style', 'readability')
REFERENCE_ROLES = {'content', 'style', 'anatomy', 'verified_asset', 'neighbor'}


def number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError(f'{field} must be a finite nonnegative number')
    return value


def image_evidence(asset, root):
    from PIL import Image

    name = asset['image_ref']
    if not isinstance(name, str) or '://' in name or Path(name).is_absolute():
        raise ValueError('image_ref must be an asset-root-relative physical image')
    path = (root / name).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError('Image is missing or outside asset_root')
    with path.open('rb') as handle:
        digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    if digest != asset['sha256']:
        raise ValueError('Image hash mismatch')
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        image.load()
        width, height = image.size
    return {'image_ref': name, 'sha256': digest, 'width': width, 'height': height, 'bytes': path.stat().st_size}


def collect_evidence(manifest, root, expected_revision=None):
    if manifest.get('schema_version') != 'rca.ppt-review-evidence.v1' or manifest.get('evidence_kind') != 'rendered_images':
        raise ValueError('Real rendered-image evidence manifest required; placeholders are not visual evidence')
    revision = hashlib.sha256(json.dumps(manifest, sort_keys=True, ensure_ascii=False,
                                        separators=(',', ':'), allow_nan=False).encode()).hexdigest()
    if expected_revision is not None and expected_revision != revision:
        raise ValueError('Review evidence changed; read the current manifest before continuing')
    pages = manifest.get('pages', [])
    if not pages:
        raise ValueError('No page evidence')
    groups, seen, sources = {}, set(), {}
    bound = []
    for page in pages:
        slide_id, variant = page['slide_id'], page.get('variant', 'candidate')
        if not isinstance(slide_id, str) or not slide_id or not isinstance(variant, str) or not variant or (variant, slide_id) in seen:
            raise ValueError('Each variant/slide_id must be nonempty and unique')
        seen.add((variant, slide_id))
        mapping = page['source_page_ids']
        if not isinstance(mapping, list) or not mapping or not all(isinstance(x, str) and x for x in mapping) or len(set(mapping)) != len(mapping):
            raise ValueError('Source-page ids must be a nonempty unique collection')
        if slide_id in sources and sources[slide_id] != set(mapping):
            raise ValueError('Compared variants must bind the same source-page collection')
        sources[slide_id] = set(mapping)
        generations = page['generations']
        if not generations or generations[0]['phase'] != 'initial':
            raise ValueError('Preserve the first generation before refinement')
        identities, elapsed, costs = [], [], []
        for index, generation in enumerate(generations):
            if generation['phase'] not in ({'initial'} if index == 0 else {'refinement', 'repair'}):
                raise ValueError('Only the first generation may have phase initial')
            if not generation.get('attempt_id') or not generation.get('model'):
                raise ValueError('Record actual model and attempt identity')
            info = image_evidence(generation, root)
            if abs(info['width'] / info['height'] - 16 / 9) > .01:
                raise ValueError('Generated page must have an uncropped near-16:9 composition')
            info.update(phase=generation['phase'], attempt_id=generation['attempt_id'], model=generation['model'])
            identities.append(info)
            elapsed.append(number(generation['elapsed_seconds'], 'elapsed_seconds'))
            if generation.get('cost_usd') is not None:
                costs.append(number(generation['cost_usd'], 'cost_usd'))
        references = []
        for reference in page.get('references', []):
            if reference['role'] not in REFERENCE_ROLES:
                raise ValueError('Unknown reference role')
            reference_info = image_evidence(reference, root)
            references.append(dict(reference_info, role=reference['role']))
        review = page.get('first_review')
        if review is not None:
            if review.get('image_sha256') != identities[0]['sha256'] or not review.get('reviewer_ref'):
                raise ValueError('First review must bind the first image and an RCA reviewer ref')
            if any(review.get(d) not in {'pass', 'fail', 'unassessed'} for d in DIMENSIONS):
                raise ValueError('Every review dimension must be pass, fail or unassessed')
        selected = page.get('selected_image_sha256')
        if selected is not None and selected not in [i['sha256'] for i in identities]:
            raise ValueError('Selected image is not among the recorded generations')
        group = groups.setdefault(variant, [])
        group.append({'review': review, 'calls': len(generations), 'elapsed': sum(elapsed),
                      'costs': costs, 'selected': selected is not None})
        bound.append({
            'slide_id': slide_id, 'variant': variant, 'source_page_ids': mapping,
            'images': identities, 'references': references,
            'first_review': dict(review) if review is not None else None,
            'selected_image_sha256': selected,
        })
    metrics = {}
    for variant, items in groups.items():
        reviewed = [i['review'] for i in items if i['review'] is not None]
        assessed = [i for i in reviewed if all(i[d] != 'unassessed' for d in DIMENSIONS)]
        selected = [i for i in items if i['selected']]
        costs = [c for i in items for c in i['costs']]
        calls = sum(i['calls'] for i in items)
        metrics[variant] = {
            'page_count': len(items), 'generation_calls': calls,
            'first_images_reviewed': len(reviewed), 'first_images_fully_assessed': len(assessed),
            'first_images_usable': sum(all(i[d] == 'pass' for d in DIMENSIONS) for i in assessed),
            'first_attempt_usable_fraction': (sum(all(i[d] == 'pass' for d in DIMENSIONS) for i in assessed) / len(assessed)) if assessed else None,
            'first_attempt_failure_counts': {d: sum(i[d] == 'fail' for i in reviewed) for d in DIMENSIONS},
            'sum_generation_elapsed_seconds': sum(i['elapsed'] for i in items),
            'known_cost_usd': sum(costs) if costs else None,
            'costed_generation_count': len(costs), 'uncosted_generation_count': calls - len(costs),
            'calls_per_selected_page': sum(i['calls'] for i in selected) / len(selected) if selected else None,
        }
    return {'schema_version': 'rca.ppt-review-measurements.v1', 'revision': revision,
            'evidence_integrity': 'verified',
            'claim_boundary': 'Image identity/decoding and arithmetic over supplied RCA observations only. No provenance, semantic, aesthetic, review/export or readiness verdict.',
            'metrics': metrics, 'bound_pages': bound}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--asset-root', type=Path)
    parser.add_argument('--expected-revision', help='Revision returned by the previously inspected evidence')
    args = parser.parse_args()
    try:
        result = collect_evidence(json.loads(args.manifest.read_text()),
                                  (args.asset_root or args.manifest.parent).resolve(), args.expected_revision)
    except (ValueError, KeyError, TypeError, OSError, ZeroDivisionError) as error:
        parser.exit(2, f'Evidence rejected: {error}\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
