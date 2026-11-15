"""Resolve explicit image-deck inputs; validate identities and geometry, not meaning."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image

SCHEMA = 'rca.image-deck-export.v1'
ASSET_KINDS = {'medical_image', 'qr', 'download', 'ui', 'paper', 'logo'}
SLIDE_SIZE = (14630400, 8229600)  # 16 by 9 inches in EMU


def sha256(path):
    with Path(path).open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{field} must be a nonempty string')
    return value


def image_asset(asset, root, *, full_page=False):
    ref = text(asset.get('image_ref'), 'image_ref')
    if Path(ref).is_absolute() or '://' in ref:
        raise ValueError('image_ref must be relative to asset_root')
    path = (root / ref).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError('Image is missing or outside asset_root')
    digest = sha256(path)
    if asset.get('sha256') != digest:
        raise ValueError(f'Image hash mismatch: {ref}')
    with Image.open(path) as image:
        image.load()
        width, height = image.size
        if image.format not in ({'PNG'} if full_page else {'PNG', 'JPEG'}):
            raise ValueError('Full pages must be PNG; original verified layers may be PNG or JPEG')
    if full_page and abs(width / height - 16 / 9) > .01:
        raise ValueError('Full-page image must be near 16:9; stretching is forbidden')
    return {**asset, 'path': path, 'sha256': digest, 'width': width, 'height': height}


def fractions(value, field):
    if not isinstance(value, list) or len(value) != 4 or any(
        isinstance(x, bool) or not isinstance(x, (int, float))
        or not math.isfinite(x) or not 0 <= x <= 1 for x in value
    ):
        raise ValueError(f'{field} must contain four finite fractions in [0,1]')
    return value


def placement(asset):
    x, y, width, height = fractions(asset.get('box'), 'box')
    if width <= 0 or height <= 0 or x + width > 1 or y + height > 1:
        raise ValueError('Overlay box must be nonempty and inside the slide')
    crop = fractions(asset.get('crop_ltrb', [0, 0, 0, 0]), 'crop_ltrb')
    left, top, right, bottom = [round(v * 100000) for v in crop]
    if left + right >= 100000 or top + bottom >= 100000:
        raise ValueError('crop_ltrb must leave a visible image area')
    if (round(crop[0] * asset['width']) >= round((1-crop[2]) * asset['width'])
            or round(crop[1] * asset['height']) >= round((1-crop[3]) * asset['height'])):
        raise ValueError('crop_ltrb must retain image pixels at source resolution')
    if asset['kind'] == 'qr' and any(crop):
        raise ValueError('QR assets must retain their complete image and quiet zone')
    sw, sh = SLIDE_SIZE
    geometry = [round(x * sw), round(y * sh), round(width * sw), round(height * sh)]
    if min(geometry[2:]) <= 0:
        raise ValueError('Overlay box rounds to an empty shape')
    if asset['kind'] == 'qr':
        expected = asset['width'] / asset['height']
        if abs(geometry[2] / geometry[3] / expected - 1) > .001:
            raise ValueError('QR placement must preserve the original aspect ratio')
    return {'box': [x, y, width, height], 'crop_ltrb': crop, 'geometry': geometry}


def composition_hash(page):
    """Path-independent visual recipe plus notes; no review decision is inferred."""
    return canonical_hash({
        'slide_size_emu': SLIDE_SIZE, 'base_sha256': page['sha256'], 'notes': page['notes'],
        'overlays': [{key: a[key] for key in ('asset_id', 'kind', 'sha256', 'geometry', 'crop_ltrb')}
                     for a in page['overlays']],
    })


def load_pages(manifest, root):
    if not isinstance(manifest, dict):
        raise ValueError('Export manifest must be an object')
    if manifest.get('schema_version') != SCHEMA:
        raise ValueError(f'Expected {SCHEMA}')
    rows = manifest.get('pages')
    expected = manifest.get('expected_slide_count')
    if (not isinstance(rows, list) or not rows or isinstance(expected, bool)
            or not isinstance(expected, int) or expected != len(rows)):
        raise ValueError('expected_slide_count must match the nonempty explicit pages list')
    pages, ids = [], set()
    root = Path(root).resolve()
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get('overlays', []), list):
            raise ValueError('Each page must be an object with an overlays list')
        slide_id = text(row.get('slide_id'), 'slide_id')
        if slide_id in ids:
            raise ValueError('Duplicate slide_id')
        ids.add(slide_id)
        page = image_asset(row, root, full_page=True)
        notes = row.get('notes', '')
        if not isinstance(notes, str):
            raise ValueError('notes must be a string')
        page.update(slide_id=slide_id, notes=notes, overlays=[])
        assets = set()
        for item in row.get('overlays', []):
            if not isinstance(item, dict):
                raise ValueError('Each overlay must be an object')
            asset_id = text(item.get('asset_id'), 'asset_id')
            if asset_id in assets:
                raise ValueError('Duplicate overlay asset_id')
            assets.add(asset_id)
            if item.get('kind') not in ASSET_KINDS:
                raise ValueError('Only declared verified asset kinds may be overlaid')
            text(item.get('source_ref'), 'source_ref')
            asset = image_asset(item, root)
            if item['kind'] == 'qr':
                text(item.get('expected_text'), 'QR expected_text')
            asset.update(placement(asset))
            page['overlays'].append(asset)
        page['composition_sha256'] = composition_hash(page)
        binding = row.get('review_binding')
        if binding is not None:
            if not isinstance(binding, dict):
                raise ValueError('review_binding must be an object')
            text(binding.get('review_ref'), 'review_ref')
            text(binding.get('composition_sha256'), 'review composition_sha256')
        pages.append(page)
    return pages


def pages_from_images(images):
    """Compatibility path; production uses an explicit manifest."""
    pages = []
    for image in images:
        path = Path(image).resolve()
        pages.extend(load_pages({'schema_version': SCHEMA, 'expected_slide_count': 1, 'pages': [{
            'slide_id': path.stem, 'image_ref': path.name, 'sha256': sha256(path),
        }]}, path.parent))
    if not pages or len({p['slide_id'] for p in pages}) != len(pages):
        raise ValueError('Nonempty unique slide ids required')
    return pages
