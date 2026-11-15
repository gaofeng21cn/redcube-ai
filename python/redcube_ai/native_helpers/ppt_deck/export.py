#!/usr/bin/env python3
import argparse
from io import BytesIO
import json
import re
import sys
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.util import Inches

from .image_export_manifest import load_pages, pages_from_images, SLIDE_SIZE
from .image_export_readback import readback_pdf, readback_pptx, scan_qr


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def list_screenshots(screenshots_dir: Path):
    def natural_key(path):
        return [int(token) if token.isdigit() else token for token in re.split(r'(\d+)', path.name)]
    files = sorted((path for path in screenshots_dir.glob('*.png') if path.is_file()), key=natural_key)
    if not files:
        fail(f'No PNG screenshots found in {screenshots_dir}')
    return files


def build_pptx(images, output_pptx: Path):
    pages = images if images and isinstance(images[0], dict) else pages_from_images(images)
    prs = Presentation()
    prs.slide_width = Inches(16)
    prs.slide_height = Inches(9)
    for page in pages:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        shape = slide.shapes.add_picture(str(page['path']), 0, 0, width=prs.slide_width, height=prs.slide_height)
        shape.name = f"rca-page:{page['slide_id']}"
        for asset in page['overlays']:
            shape = slide.shapes.add_picture(str(asset['path']), *asset['geometry'])
            shape.name = f"rca-asset:{asset['asset_id']}"
            shape.crop_left, shape.crop_top, shape.crop_right, shape.crop_bottom = asset['crop_ltrb']
        if page['notes']:
            slide.notes_slide.notes_text_frame.text = page['notes']
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output_pptx))


def compose_page(page):
    with Image.open(page['path']) as source:
        canvas = Image.new('RGB', source.size, 'white')
        rgba = source.convert('RGBA')
        canvas.paste(rgba, (0, 0), rgba)
        rgba.close()
    for asset in page['overlays']:
        with Image.open(asset['path']) as source:
            left, top, right, bottom = asset['crop_ltrb']
            rgba = source.convert('RGBA')
            cropped = rgba.crop((round(left * source.width), round(top * source.height),
                                 round((1-right) * source.width), round((1-bottom) * source.height)))
            rgba.close()
            x, y, width, height = asset['geometry']
            sw, sh = SLIDE_SIZE
            box = (round(x / sw * canvas.width), round(y / sh * canvas.height))
            size = (max(1, round(width / sw * canvas.width)), max(1, round(height / sh * canvas.height)))
            layer = cropped.resize(size, Image.Resampling.LANCZOS)
            canvas.paste(layer, box, layer)
            layer.close()
            cropped.close()
    return canvas


def build_pdf(images, output_pdf: Path):
    from pypdf import PdfReader, PdfWriter

    pages = images if images and isinstance(images[0], dict) else pages_from_images(images)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    writer = PdfWriter()
    for page in pages:
        canvas = compose_page(page)
        # The PDF is a raster delivery; the PPTX retains original independent assets.
        with BytesIO() as buffer:
            canvas.save(buffer, format='PDF', resolution=canvas.width / 16, quality=100, subsampling=0)
            pdf_page = writer.add_page(PdfReader(buffer).pages[0])
            # Image tools can return near-16:9 integer dimensions. Match the PPTX
            # frame exactly without reencoding or resizing the original asset.
            pdf_page.scale_to(1152, 648)
        canvas.close()
    with output_pdf.open('wb') as handle:
        writer.write(handle)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Export ppt_deck screenshots into PPTX/PDF artifacts.')
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--page-manifest', type=Path, help='Explicit ordered pages, notes and verified layers')
    inputs.add_argument('--screenshots-dir', help='Legacy directory input; prefer --page-manifest')
    parser.add_argument('--asset-root', type=Path)
    parser.add_argument('--expected-slide-count', type=int)
    parser.add_argument('--output-pptx', required=True)
    parser.add_argument('--output-pdf')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        if args.page_manifest:
            manifest = json.loads(args.page_manifest.read_text())
            pages = load_pages(manifest, args.asset_root or args.page_manifest.resolve().parent)
        else:
            if args.asset_root:
                raise ValueError('--asset-root requires --page-manifest')
            pages = pages_from_images(list_screenshots(Path(args.screenshots_dir).resolve()))
        if args.expected_slide_count is not None and len(pages) != args.expected_slide_count:
            raise ValueError('Expected page count mismatch')
        output_pptx = Path(args.output_pptx).resolve()
        output_pdf = Path(args.output_pdf).resolve() if args.output_pdf else None
        inputs = {asset['path'] for page in pages for asset in [page, *page['overlays']]}
        if args.page_manifest:
            inputs.add(args.page_manifest.resolve())
        if output_pptx in inputs or output_pdf in inputs or output_pdf == output_pptx:
            raise ValueError('Output paths must be distinct from inputs and each other')
        build_pptx(pages, output_pptx)
        package_readback = readback_pptx(output_pptx, pages)
        package_readback['qr_checks'] = []
        for page in pages:
            if any(a['kind'] == 'qr' for a in page['overlays']):
                with compose_page(page) as composite:
                    package_readback['qr_checks'].extend(scan_qr(composite, page))
        package_readback['qr_check_surface'] = 'composed recipe with package-verified media and geometry'
        pdf_readback = None
        if output_pdf:
            build_pdf(pages, output_pdf)
            pdf_readback = readback_pdf(output_pdf, len(pages), pages)
    except (ValueError, TypeError, KeyError, OSError) as error:
        fail(f'Export rejected: {error}')

    result = {
        'status': 'completed',
        'converter': {
            'kind': 'python_playwright_pptx',
            'input_mode': 'page_manifest' if args.page_manifest else 'legacy_directory',
        },
        'page_count': len(pages),
        'pptx_file': str(output_pptx),
        'pdf_file': str(output_pdf) if output_pdf else None,
        'package_readback': package_readback,
        'pdf_readback': pdf_readback,
        'editable': False,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
