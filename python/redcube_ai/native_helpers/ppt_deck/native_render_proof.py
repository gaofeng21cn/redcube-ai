#!/usr/bin/env python3
import hashlib
import platform
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

from redcube_ai.native_helpers.renderer_dependencies import libreoffice_probe, poppler_probe
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import safe_list, safe_text
from redcube_ai.native_helpers.ppt_deck.native_shape_plan import RENDERER_KIND, RENDERER_PIPELINE


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def file_sha256(file: Path) -> str:
    if not file.exists():
        return ''
    with file.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def image_dimensions(file: Path) -> dict:
    with Image.open(file) as image:
        return {'width': int(image.width), 'height': int(image.height)}


def command_version(command: list[str]) -> str:
    completed = subprocess.run(
        command,
        text=True,
        capture_output=True,
        check=False,
    )
    return safe_text(completed.stdout) or safe_text(completed.stderr) or 'unknown'


def platform_provenance() -> dict:
    uname = platform.uname()
    return {
        'system': uname.system,
        'release': uname.release,
        'version': uname.version,
        'machine': uname.machine,
        'python': platform.python_version(),
    }


def renderer_dependency_blocker(
    message: str,
    *,
    probes: list[dict] | None = None,
) -> str:
    payload = {
        'error_kind': 'missing_renderer_dependency',
        'typed_blocker_kind': 'missing_renderer_dependency',
        'renderer_selection': 'opl_probe_then_helper_capability_bind',
        'required_surface': 'native_pptx_true_render_proof',
        'supported_renderers': [
            {
                'renderer_kind': RENDERER_KIND,
                'renderer_pipeline': RENDERER_PIPELINE,
                'runtime': RENDERER_KIND,
                'requires': ['LibreOffice headless', 'Poppler pdftoppm'],
            }
        ],
        'synthetic_preview_allowed': False,
        'fail_closed_when_missing': True,
        'dependency_provisioning_owner': 'opl_connect_or_operator',
        'required_commands': ['officecli', 'soffice', 'pdftoppm'],
        'probe_surface': 'opl pack native-helper probe',
        'message': message,
        'probes': probes or [],
    }
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def missing_renderer_reasons(*probes: dict) -> list[str]:
    return [
        safe_text(probe.get('blocked_reason'))
        for probe in probes
        if not probe.get('available') and safe_text(probe.get('blocked_reason'))
    ]


def renderer_probe() -> dict:
    soffice_probe = libreoffice_probe()
    pdftoppm_probe = poppler_probe('pdftoppm')
    return {
        'soffice_probe': soffice_probe,
        'pdftoppm_probe': pdftoppm_probe,
        'soffice': safe_text(soffice_probe.get('path')),
        'pdftoppm': safe_text(pdftoppm_probe.get('path')),
    }


def resolve_probed_renderer(probe: dict) -> dict | None:
    soffice = safe_text(probe.get('soffice'))
    pdftoppm = safe_text(probe.get('pdftoppm'))
    if not soffice or not pdftoppm:
        return None
    return {
        'kind': RENDERER_KIND,
        'pipeline': RENDERER_PIPELINE,
        'runtime': RENDERER_KIND,
        'selection_policy': 'opl_probe_then_helper_capability_bind',
        'dependency_provisioning_owner': 'opl_connect_or_operator',
        'soffice': soffice,
        'pdftoppm': pdftoppm,
        'libreoffice_version': command_version([soffice, '--version']),
        'poppler_version': command_version([pdftoppm, '-v']),
    }


def resolve_renderer(renderer_name: str) -> dict:
    requested = safe_text(renderer_name, 'auto')
    if requested not in {'auto', RENDERER_KIND}:
        fail(f'unsupported native PPT renderer: {requested}; expected auto or {RENDERER_KIND}')
    initial_probe = renderer_probe()
    renderer = resolve_probed_renderer(initial_probe)
    if renderer:
        return renderer
    probes = [initial_probe['soffice_probe'], initial_probe['pdftoppm_probe']]
    reasons = missing_renderer_reasons(*probes)
    fail(renderer_dependency_blocker(
        'native PPT true render proof requires a supported renderer capability; '
        f'current supported pipeline is {RENDERER_PIPELINE}; resolve the OPL native-helper '
        f'probe/provisioning blocker before execution: {"; ".join(reasons)}',
        probes=probes,
    ) if requested == 'auto' else renderer_dependency_blocker(
        'native PPT true render proof requires LibreOffice headless and Poppler for '
        f'{RENDERER_PIPELINE}: {"; ".join(reasons)}; resolve the OPL native-helper '
        'probe/provisioning blocker before execution',
        probes=probes,
    ))


def clean_render_outputs(preview_dir: Path, pdf_target: Path) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    for stale in preview_dir.glob('*'):
        if stale.is_file() and stale.suffix.lower() in {'.png', '.pdf'}:
            stale.unlink()
    if pdf_target.exists():
        pdf_target.unlink()


def render_pptx_to_pdf(output_pptx: Path, pdf_target: Path, renderer: dict) -> None:
    pdf_target.parent.mkdir(parents=True, exist_ok=True)
    convert_dir = pdf_target.parent
    completed = subprocess.run(
        [
            renderer['soffice'],
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            str(convert_dir),
            str(output_pptx),
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = safe_text(completed.stderr) or safe_text(completed.stdout) or 'unknown LibreOffice error'
        fail(f'true PPTX render proof failed via LibreOffice headless: {stderr}')
    converted_pdf = convert_dir / f'{output_pptx.stem}.pdf'
    if not converted_pdf.exists():
        fail(f'LibreOffice headless did not produce expected PDF: {converted_pdf}')
    if converted_pdf.resolve() != pdf_target.resolve():
        if pdf_target.exists():
            pdf_target.unlink()
        shutil.move(str(converted_pdf), str(pdf_target))


def render_png_from_pdf(pdf_file: Path, preview_dir: Path, renderer: dict) -> list[Path]:
    if not pdf_file.exists():
        fail(f'LibreOffice PDF render output missing before Poppler conversion: {pdf_file}')
    prefix = preview_dir / 'slide'
    completed = subprocess.run(
        [renderer['pdftoppm'], '-png', '-r', '144', str(pdf_file), str(prefix)],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = safe_text(completed.stderr) or safe_text(completed.stdout) or 'unknown Poppler error'
        fail(f'PDF-to-PNG render proof conversion failed with Poppler pdftoppm: {stderr}')
    return sorted(path for path in preview_dir.glob('slide-*.png') if path.is_file())


def render_pptx(
    output_pptx: Path,
    preview_dir: Path,
    output_pdf: Path | None,
    renderer_name: str = 'auto',
) -> dict:
    renderer = resolve_renderer(renderer_name)
    pdf_target = output_pdf or (preview_dir / 'render-proof.pdf')
    clean_render_outputs(preview_dir, pdf_target)
    render_pptx_to_pdf(output_pptx, pdf_target, renderer)
    png_files = render_png_from_pdf(pdf_target, preview_dir, renderer)
    if not png_files:
        fail(f'true PPTX render proof produced no Poppler PNG previews in {preview_dir}')
    preview_hashes = [
        {
            'file': str(path),
            'sha256': file_sha256(path),
        }
        for path in png_files
    ]
    return {
        'source_surface_kind': 'native_pptx',
        'renderer_kind': renderer['kind'],
        'renderer_pipeline': renderer['pipeline'],
        'runtime': RENDERER_KIND,
        'command_family': 'soffice --headless',
        'cross_platform_render_required': True,
        'synthetic_preview': False,
        'required': True,
        'pptx_file': str(output_pptx),
        'pdf_file': str(pdf_target),
        'libreoffice_version': renderer['libreoffice_version'],
        'poppler_version': renderer['poppler_version'],
        'platform': platform_provenance(),
        'source_pptx_sha256': file_sha256(output_pptx),
        'pdf_sha256': file_sha256(pdf_target),
        'preview_png_hashes': preview_hashes,
        'slide_count': len(png_files),
        'preview_screenshots': [str(path) for path in png_files],
    }


def attach_rendered_previews(manifest_slides: list, render_proof: dict) -> list:
    preview_files = [Path(path) for path in safe_list(render_proof.get('preview_screenshots'))]
    if len(preview_files) != len(manifest_slides):
        fail(
            'true PPTX render proof slide count mismatch: '
            f'{len(preview_files)} previews for {len(manifest_slides)} manifest slides'
        )
    attached = []
    preview_hashes = safe_list(render_proof.get('preview_png_hashes'))
    for index, (slide, preview_file) in enumerate(zip(manifest_slides, preview_files)):
        if not preview_file.exists():
            fail(f'true PPTX render proof screenshot missing: {preview_file}')
        preview_sha256 = file_sha256(preview_file)
        if index < len(preview_hashes) and preview_hashes[index].get('sha256') != preview_sha256:
            fail(f'true PPTX render proof screenshot hash mismatch: {preview_file}')
        preview_dimensions = image_dimensions(preview_file)
        render_provenance = {
            'renderer_kind': render_proof.get('renderer_kind'),
            'renderer_pipeline': render_proof.get('renderer_pipeline'),
            'source_surface_kind': render_proof.get('source_surface_kind'),
            'source_pptx_sha256': render_proof.get('source_pptx_sha256'),
            'pdf_sha256': render_proof.get('pdf_sha256'),
            'preview_screenshot_sha256': preview_sha256,
            'preview_screenshot_file': str(preview_file),
            'preview_screenshot_dimensions': preview_dimensions,
            'synthetic_preview': False,
        }
        attached.append({
            **slide,
            'preview_screenshot_file': str(preview_file),
            'preview_screenshot_sha256': preview_sha256,
            'preview_screenshot_dimensions': preview_dimensions,
            'render_proof_source': safe_text(render_proof.get('renderer_kind')),
            'renderer_kind': render_proof.get('renderer_kind'),
            'renderer_pipeline': render_proof.get('renderer_pipeline'),
            'render_provenance': render_provenance,
            'synthetic_preview': False,
        })
    return attached
