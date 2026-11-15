"""Mechanical regression only: synthetic pixels are never visual-quality evidence."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from zipfile import ZipFile

from PIL import Image
from pptx import Presentation
from pypdf import PdfReader

from redcube_ai.native_helpers.ppt_deck.export import build_pdf, build_pptx, compose_page, list_screenshots
from redcube_ai.native_helpers.ppt_deck.image_export_manifest import SCHEMA, load_pages, sha256
from redcube_ai.native_helpers.ppt_deck.image_export_readback import readback_pdf, readback_pptx, scan_qr


class ImageDeckExport(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='rca-image-export-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name, color, size in [('slide1', 'white', (320, 180)), ('slide10', 'green', (320, 180)),
                                  ('slide2', 'grey', (320, 180)), ('stale-preview', 'black', (100, 100))]:
            Image.new('RGB', size, color).save(self.root / f'{name}.png')
        evidence = Image.new('RGB', (100, 100), 'red')
        evidence.paste('blue', (50, 0, 100, 100))
        evidence.save(self.root / 'evidence.png')
        self.manifest = {'schema_version': SCHEMA, 'expected_slide_count': 3, 'pages': [
            {'slide_id': name, 'image_ref': f'{name}.png', 'sha256': sha256(self.root / f'{name}.png'),
             'notes': f'讲者备注 {name}\nTask/input attribution.\n来源 / source'}
            for name in ['slide2', 'slide1', 'slide10']
        ]}
        self.manifest['pages'][1]['overlays'] = [{
            'asset_id': 'original-evidence', 'kind': 'medical_image', 'image_ref': 'evidence.png',
            'sha256': sha256(self.root / 'evidence.png'), 'source_ref': 'test-only synthetic fixture',
            'box': [.1, .2, .3, .4], 'crop_ltrb': [.5, 0, 0, 0],
        }]
        self.pptx, self.pdf = self.root / 'result.pptx', self.root / 'result.pdf'

    def pages(self):
        return load_pages(self.manifest, self.root)

    def export(self):
        pages = self.pages()
        build_pptx(pages, self.pptx)
        return pages

    def test_explicit_order_notes_original_layers_and_crop(self):
        pages = self.export()
        report = readback_pptx(self.pptx, pages)
        self.assertEqual([p['slide_id'] for p in report['pages']], ['slide2', 'slide1', 'slide10'])
        self.assertEqual(report['page_count'], 3)
        prs = Presentation(self.pptx)
        self.assertEqual(len(prs.slides[1].shapes), 2)
        self.assertEqual(prs.slides[1].shapes[1].image.blob, (self.root / 'evidence.png').read_bytes())
        self.assertEqual(prs.slides[1].shapes[1].crop_left, .5)
        self.assertEqual(prs.slides[1].notes_slide.notes_text_frame.text, pages[1]['notes'])
        self.assertEqual(report['native_powerpoint_open'], 'unverified')

    def test_real_pdf_pages_dimensions_and_composited_crop(self):
        pages = self.pages()
        build_pdf(pages, self.pdf)
        self.assertEqual(readback_pdf(self.pdf, 3)['page_count'], 3)
        reader = PdfReader(self.pdf)
        composite = reader.pages[1].images[0].image.convert('RGB')
        red, green, blue = composite.getpixel((80, 70))
        self.assertLess(red, 50)
        self.assertLess(green, 50)
        self.assertGreater(blue, 200)

    def test_near_169_pixel_rounding_still_has_exact_pdf_slide_geometry(self):
        Image.new('RGB', (1672, 941), 'white').save(self.root / 'slide2.png')
        self.manifest['pages'][0]['sha256'] = sha256(self.root / 'slide2.png')
        pages = self.pages()
        build_pdf(pages, self.pdf)
        self.assertEqual(readback_pdf(self.pdf, 3)['page_count'], 3)

    def test_media_deduplication_does_not_count_as_missing_pages(self):
        self.manifest['pages'][2].update(image_ref='slide2.png', sha256=self.manifest['pages'][0]['sha256'])
        pages = self.export()
        self.assertEqual(readback_pptx(self.pptx, pages)['page_count'], 3)
        with ZipFile(self.pptx) as archive:
            self.assertLess(len([n for n in archive.namelist() if n.startswith('ppt/media/')]), 4)

    def test_original_jpeg_evidence_is_embedded_without_reencoding(self):
        Image.new('RGB', (100, 100), 'red').save(self.root / 'evidence.jpg')
        self.manifest['pages'][1]['overlays'][0].update(
            image_ref='evidence.jpg', sha256=sha256(self.root / 'evidence.jpg'))
        pages = self.export()
        readback_pptx(self.pptx, pages)
        self.assertEqual(Presentation(self.pptx).slides[1].shapes[1].image.blob,
                         (self.root / 'evidence.jpg').read_bytes())

    def test_review_reuse_requires_same_actual_recipe_and_notes(self):
        pages = self.pages()
        for row, page in zip(self.manifest['pages'], pages):
            row['review_binding'] = {'review_ref': 'existing-review', 'composition_sha256': page['composition_sha256']}
        pages = self.export()
        self.assertTrue(all(p['review_binding_matches'] for p in readback_pptx(self.pptx, pages)['pages']))
        self.manifest['pages'][1]['overlays'][0]['crop_ltrb'] = [0, 0, .5, 0]
        self.manifest['pages'][0]['notes'] += ' Changed meaning.'
        pages = self.export()
        self.assertEqual([p['review_binding_matches'] for p in readback_pptx(self.pptx, pages)['pages']],
                         [False, False, True])

    def test_reject_tampered_hash_missing_pages_duplicate_ids_and_invalid_geometry(self):
        mutations = [
            lambda d: d.update(expected_slide_count=4),
            lambda d: d['pages'][0].update(sha256='0' * 64),
            lambda d: d['pages'][0].update(slide_id='slide1'),
            lambda d: d['pages'][0].update(image_ref='../outside.png'),
            lambda d: d['pages'][0].update(image_ref='stale-preview.png', sha256=sha256(self.root / 'stale-preview.png')),
            lambda d: d['pages'][1]['overlays'][0].update(box=[.8, .2, .3, .4]),
            lambda d: d['pages'][1]['overlays'][0].update(crop_ltrb=[.5, 0, .5, 0]),
            lambda d: d['pages'][1]['overlays'][0].update(kind='generated_label'),
            lambda d: d['pages'][1]['overlays'][0].pop('source_ref'),
            lambda d: d['pages'][1]['overlays'][0].update(kind='qr'),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                manifest = copy.deepcopy(self.manifest)
                mutation(manifest)
                with self.assertRaises(ValueError):
                    load_pages(manifest, self.root)

    def test_qr_requires_full_image_and_undistorted_placement(self):
        self.qr_input()
        item = self.manifest['pages'][1]['overlays'][0]
        pages = self.export()
        self.assertEqual(readback_pptx(self.pptx, pages)['page_count'], 3)
        item['box'] = [.7, .1, .1, .1]
        with self.assertRaisesRegex(ValueError, 'aspect ratio'):
            self.pages()

    def qr_input(self):
        fixture = Path(__file__).parent / 'fixtures/image-deck-export/qr.png'
        (self.root / 'qr.png').write_bytes(fixture.read_bytes())
        Image.new('RGB', (1600, 900), 'white').save(self.root / 'slide1.png')
        self.manifest['pages'][1]['sha256'] = sha256(self.root / 'slide1.png')
        self.manifest['pages'][1]['overlays'][0].update(
            kind='qr', image_ref='qr.png', sha256=sha256(self.root / 'qr.png'),
            expected_text='https://example.invalid/rca-export-test', crop_ltrb=[0, 0, 0, 0],
            box=[.7, .1, .18, .32])

    def test_scan_actual_pdf_qr_and_reject_occlusion_or_wrong_payload(self):
        self.qr_input()
        pages = self.pages()
        build_pdf(pages, self.pdf)
        report = readback_pdf(self.pdf, 3, pages)
        self.assertEqual(report['qr_checks'][0]['status'], 'decoded')
        pages[1]['overlays'][0]['expected_text'] = 'different destination'
        with self.assertRaisesRegex(ValueError, 'Final QR'):
            readback_pdf(self.pdf, 3, pages)
        self.manifest['pages'][1]['overlays'].append({
            'asset_id': 'cover', 'kind': 'logo', 'image_ref': 'stale-preview.png',
            'sha256': sha256(self.root / 'stale-preview.png'), 'source_ref': 'test fixture',
            'box': [.7, .1, .18, .32],
        })
        page = self.pages()[1]
        with compose_page(page) as composite, self.assertRaisesRegex(ValueError, 'Final QR'):
            scan_qr(composite, page)

    def test_missing_media_relationship_is_rejected(self):
        pages = self.export()
        with ZipFile(self.pptx) as archive:
            content = {name: archive.read(name) for name in archive.namelist()}
        content.pop(next(n for n in content if n.startswith('ppt/media/')))
        with ZipFile(self.pptx, 'w') as archive:
            for name, data in content.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(ValueError, 'relationship'):
            readback_pptx(self.pptx, pages)

    def test_wrong_order_notes_crop_covering_shape_and_hidden_slide_are_rejected(self):
        pages = self.export()
        for defect in ['order', 'notes', 'crop', 'cover', 'hidden', 'flip', 'clip']:
            with self.subTest(defect=defect):
                build_pptx(pages, self.pptx)
                prs = Presentation(self.pptx)
                if defect == 'order':
                    prs.slides._sldIdLst.append(prs.slides._sldIdLst[0])
                elif defect == 'notes':
                    prs.slides[0].notes_slide.notes_text_frame.text = 'wrong'
                elif defect == 'crop':
                    prs.slides[0].shapes[0].crop_left = .1
                elif defect == 'cover':
                    prs.slides[0].shapes.add_picture(str(self.root / 'evidence.png'), 0, 0)
                elif defect == 'flip':
                    prs.slides[0].shapes[0]._element.spPr.xfrm.set('flipH', '1')
                elif defect == 'clip':
                    prs.slides[0].shapes[0]._element.spPr.prstGeom.set('prst', 'ellipse')
                else:
                    prs.slides[0]._element.set('show', '0')
                prs.save(self.pptx)
                with self.assertRaises(ValueError):
                    readback_pptx(self.pptx, pages)

    def test_qname_value_with_undeclared_prefix_is_rejected(self):
        pages = self.export()
        with ZipFile(self.pptx) as archive:
            content = {name: archive.read(name) for name in archive.namelist()}
        content['docProps/core.xml'] = content['docProps/core.xml'].replace(b'dcterms:W3CDTF', b'undefined:W3CDTF')
        with ZipFile(self.pptx, 'w') as archive:
            for name, data in content.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(ValueError, 'prefix'):
            readback_pptx(self.pptx, pages)

    def test_legacy_order_is_natural_and_square_preview_cannot_be_stretched(self):
        (self.root / 'stale-preview.png').unlink()
        (self.root / 'evidence.png').unlink()
        images = list_screenshots(self.root)
        self.assertEqual([p.stem for p in images], ['slide1', 'slide2', 'slide10'])
        build_pptx(images, self.pptx)
        Image.new('RGB', (100, 100), 'black').save(self.root / 'stale-preview.png')
        with self.assertRaisesRegex(ValueError, '16:9'):
            build_pptx(list_screenshots(self.root), self.pptx)

    def test_cli_emits_actual_readback_and_rejects_bad_input_without_output(self):
        manifest = self.root / 'pages.json'
        manifest.write_text(json.dumps(self.manifest))
        command = [sys.executable, '-m', 'redcube_ai.native_helpers.ppt_deck.export',
                   '--page-manifest', str(manifest), '--output-pptx', str(self.pptx), '--output-pdf', str(self.pdf)]
        run = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        result = json.loads(run.stdout)
        self.assertEqual(result['package_readback']['page_count'], 3)
        self.assertEqual(result['pdf_readback']['page_count'], 3)
        self.pptx.unlink()
        self.pdf.unlink()
        self.manifest['expected_slide_count'] = 4
        manifest.write_text(json.dumps(self.manifest))
        run = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0)
        self.assertFalse(self.pptx.exists())
        self.assertFalse(self.pdf.exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
