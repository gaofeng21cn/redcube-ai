"""Read the actual image-deck package; mechanical equivalence is not visual approval."""
from __future__ import annotations

import hashlib
import posixpath
from urllib.parse import unquote
from zipfile import ZipFile

from lxml import etree
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

from .image_export_manifest import SLIDE_SIZE, sha256

XSI = 'http://www.w3.org/2001/XMLSchema-instance'
MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def package_integrity(path):
    with ZipFile(path) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)), 'Duplicate ZIP parts')
        require(archive.testzip() is None, 'ZIP CRC failure')
        for name in names:
            if not name.endswith(('.xml', '.rels')):
                continue
            root = etree.fromstring(archive.read(name))
            if name == '[Content_Types].xml':
                require(root.tag == '{http://schemas.openxmlformats.org/package/2006/content-types}Types',
                        'Invalid Content Types namespace')
            for node in root.iter():
                qname = node.get(f'{{{XSI}}}type')
                if qname and ':' in qname:
                    require(qname.split(':')[0] in node.nsmap, 'Undeclared xsi:type prefix')
                for prefix in (node.get(f'{{{MC}}}Ignorable') or '').split():
                    require(prefix in node.nsmap, 'Undeclared mc:Ignorable prefix')
            if name.endswith('.rels'):
                source_dir = '' if name == '_rels/.rels' else posixpath.dirname(posixpath.dirname(name))
                for rel in root:
                    if rel.get('TargetMode') == 'External':
                        continue
                    target = unquote(rel.get('Target', ''))
                    resolved = posixpath.normpath(posixpath.join(source_dir, target)) if not target.startswith('/') else target[1:]
                    require(resolved in names, f'Unresolved relationship in {name}: {target}')


def check_picture(shape, asset, geometry, crop):
    require(shape.shape_type == MSO_SHAPE_TYPE.PICTURE, 'Unexpected covering/non-picture shape')
    require(hashlib.sha256(shape.image.blob).hexdigest() == asset['sha256'], 'Packaged media hash mismatch')
    require([shape.left, shape.top, shape.width, shape.height] == list(geometry), 'Picture geometry mismatch')
    require(shape.rotation == 0, 'Unexpected picture rotation')
    xfrm = shape._element.spPr.xfrm
    require(xfrm.get('flipH', '0') in ('0', 'false') and xfrm.get('flipV', '0') in ('0', 'false'),
            'Unexpected picture flip')
    require(len(shape._element.blipFill.blip) == 0, 'Unexpected image color/alpha effect')
    require(shape._element.blipFill.blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}link') is None,
            'Unexpected externally linked picture')
    require(all(etree.QName(child).localname in ('xfrm', 'prstGeom') for child in shape._element.spPr),
            'Unexpected picture shape effect')
    require(shape._element.spPr.prstGeom is not None
            and shape._element.spPr.prstGeom.get('prst') == 'rect', 'Unexpected picture clipping shape')
    fill = shape._element.blipFill.find('{http://schemas.openxmlformats.org/drawingml/2006/main}stretch')
    require(fill is not None and len(fill) == 1 and not fill[0].attrib,
            'Unexpected picture fill or inset')
    actual_crop = [shape.crop_left, shape.crop_top, shape.crop_right, shape.crop_bottom]
    require([round(v * 100000) for v in actual_crop] == [round(v * 100000) for v in crop],
            'Picture crop mismatch')


def readback_pptx(path, pages):
    package_integrity(path)
    prs = Presentation(path)
    require((prs.slide_width, prs.slide_height) == SLIDE_SIZE, 'Slide size mismatch')
    require(len(prs.slides) == len(pages), 'PPTX page count mismatch')
    result = []
    for slide, page in zip(prs.slides, pages):
        require(slide._element.get('show', '1') not in ('0', 'false'), 'Unexpected hidden slide')
        require(len(slide.shapes) == 1 + len(page['overlays']), 'Unexpected picture/layer count')
        base = slide.shapes[0]
        require(base.name == f"rca-page:{page['slide_id']}", 'PPTX page order/id mismatch')
        check_picture(base, page, (0, 0, *SLIDE_SIZE), (0, 0, 0, 0))
        for shape, asset in zip(list(slide.shapes)[1:], page['overlays']):
            require(shape.name == f"rca-asset:{asset['asset_id']}", 'Asset layer order/id mismatch')
            check_picture(shape, asset, asset['geometry'], asset['crop_ltrb'])
        notes = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ''
        require(notes == page['notes'], 'PPTX notes mismatch')
        binding = page.get('review_binding')
        result.append({
            'slide_id': page['slide_id'], 'image_sha256': page['sha256'],
            'composition_sha256': page['composition_sha256'],
            'notes_sha256': hashlib.sha256(notes.encode()).hexdigest(),
            'overlays': [{key: a[key] for key in ('asset_id', 'kind', 'sha256', 'source_ref', 'geometry', 'crop_ltrb')}
                         for a in page['overlays']],
            'review_binding': binding,
            'review_binding_matches': bool(binding and binding['composition_sha256'] == page['composition_sha256']),
        })
    return {
        'status': 'verified', 'pptx_sha256': sha256(path), 'page_count': len(result), 'pages': result,
        'claim_boundary': 'Package/media/order/geometry/notes equivalence only; RCA decides review reuse and readiness.',
        'native_powerpoint_open': 'unverified',
    }


def scan_qr(image, page):
    checks = []
    for asset in page['overlays']:
        if asset['kind'] != 'qr':
            continue
        import zxingcpp

        x, y, width, height = asset['geometry']
        sw, sh = SLIDE_SIZE
        region = image.crop((round(x / sw * image.width), round(y / sh * image.height),
                             round((x + width) / sw * image.width), round((y + height) / sh * image.height)))
        results = zxingcpp.read_barcodes(region, formats=zxingcpp.BarcodeFormat.QRCode)
        region.close()
        require(any(result.text == asset['expected_text'] for result in results),
                f"Final QR could not be decoded as expected: {asset['asset_id']}")
        checks.append({'asset_id': asset['asset_id'], 'status': 'decoded',
                       'payload_sha256': hashlib.sha256(asset['expected_text'].encode()).hexdigest(),
                       'source_sha256': asset['sha256'], 'composition_sha256': page['composition_sha256']})
    return checks


def readback_pdf(path, expected_count, pages=None):
    from pypdf import PdfReader

    reader = PdfReader(path, strict=True)
    require(len(reader.pages) == expected_count, 'PDF page count mismatch')
    qr_checks = []
    for index, page in enumerate(reader.pages):
        require(abs(float(page.mediabox.width) - 1152) < .01
                and abs(float(page.mediabox.height) - 648) < .01, 'PDF page geometry mismatch')
        contents = page.get_contents()
        require(contents is not None and bool(contents.get_data()), 'Empty PDF page')
        require(bool(page.images), 'Missing PDF page image')
        # Decode the actual embedded image; a PDF header/resource name is insufficient.
        for image in page.images:
            image.image.load()
        if pages is not None:
            require(len(page.images) == 1, 'Expected one composed raster per PDF page')
            qr_checks.extend(scan_qr(page.images[0].image, pages[index]))
    return {'status': 'verified', 'pdf_sha256': sha256(path), 'page_count': len(reader.pages),
            'qr_checks': qr_checks,
            'claim_boundary': 'PDF parsing/page geometry/image decoding only; no visual or native-viewer verdict.'}
