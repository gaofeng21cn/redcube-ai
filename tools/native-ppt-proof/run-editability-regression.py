#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Inches

from redcube_ai.native_helpers.ppt_deck.native import render_pptx
from redcube_ai.native_helpers.ppt_deck.native_package import (
    patch_chart_data,
    read_pptx_package,
    save_presentation,
)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: run-editability-regression.py <pptx> <output-dir>')
    pptx_file = Path(sys.argv[1]).resolve()
    output_dir = Path(sys.argv[2]).resolve()
    if not pptx_file.is_file():
        raise FileNotFoundError(f'native PPT edit task input not found: {pptx_file}')

    patch_chart_data(pptx_file, [{
        'slide_index': 1,
        'shape_spec': {
            'shape_id': 'S01-chart',
            'categories': ['North', 'South', 'West'],
            'series': [{'name': 'Reforecast', 'values': [5, 9, 12]}],
        },
    }])

    prs = Presentation(str(pptx_file))
    slide = prs.slides[0]
    title_shape = next((sh for sh in slide.shapes if sh.name == 'S01-title'), None)
    if title_shape is None or not title_shape.has_text_frame:
        raise RuntimeError('native PPT edit target S01-title not found')
    title_shape.text_frame.text = 'Updated operating result'

    node_a = next((sh for sh in slide.shapes if sh.name == 'S01-node-a'), None)
    if node_a is None:
        raise RuntimeError('native PPT edit target S01-node-a not found')
    node_a.fill.solid()
    node_a.fill.fore_color.rgb = RGBColor.from_string('0F766E')
    node_a.left = Inches(1.5)
    node_a.top = Inches(2.2)

    slide.notes_slide.notes_text_frame.text = 'Updated speaker notes for the reforecast.'
    save_presentation(prs, pptx_file)

    output_dir.mkdir(parents=True, exist_ok=True)
    package_readback = read_pptx_package(pptx_file)
    render_proof = render_pptx(
        pptx_file,
        output_dir / 'previews',
        output_dir / 'edited.pdf',
        renderer_name='libreoffice_headless',
    )
    print(json.dumps({
        'schema_version': 'native_ppt_editability_regression.v1',
        'status': 'passed',
        'package_readback': package_readback,
        'render_proof': render_proof,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
