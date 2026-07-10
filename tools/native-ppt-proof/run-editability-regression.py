#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native import render_pptx
from redcube_ai.native_helpers.ppt_deck.native_package import patch_chart_data, read_pptx_package


def run_officecli(officecli: str, *args: str) -> None:
    completed = subprocess.run(
        [officecli, *args],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(json.dumps({
            'error_kind': 'native_ppt_edit_task_failed',
            'command': [officecli, *args],
            'returncode': completed.returncode,
            'stdout': completed.stdout,
            'stderr': completed.stderr,
        }, ensure_ascii=False, sort_keys=True))


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: run-editability-regression.py <pptx> <output-dir>')
    pptx_file = Path(sys.argv[1]).resolve()
    output_dir = Path(sys.argv[2]).resolve()
    if not pptx_file.is_file():
        raise FileNotFoundError(f'native PPT edit task input not found: {pptx_file}')
    officecli = shutil.which('officecli')
    if not officecli:
        raise RuntimeError(json.dumps({
            'error_kind': 'missing_officecli_dependency',
            'required_surface': 'native_ppt_editability_regression',
            'fail_closed_when_missing': True,
        }, sort_keys=True))

    patch_chart_data(pptx_file, [{
        'slide_index': 1,
        'shape_spec': {
            'shape_id': 'S01-chart',
            'categories': ['North', 'South', 'West'],
            'series': [{'name': 'Reforecast', 'values': [5, 9, 12]}],
        },
    }])
    run_officecli(officecli, 'open', str(pptx_file))
    try:
        run_officecli(
            officecli, 'set', str(pptx_file), '/slide[1]/shape[@name=S01-title]',
            '--prop', 'text=Updated operating result',
        )
        run_officecli(
            officecli, 'set', str(pptx_file), '/slide[1]/shape[@name=S01-node-a]',
            '--prop', 'fill=#0F766E', '--prop', 'x=1.5in', '--prop', 'y=2.2in',
        )
        run_officecli(
            officecli, 'set', str(pptx_file), '/slide[1]/notes',
            '--prop', 'text=Updated speaker notes for the reforecast.',
        )
        run_officecli(officecli, 'save', str(pptx_file))
    finally:
        run_officecli(officecli, 'close', str(pptx_file))

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
