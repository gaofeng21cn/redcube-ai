import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image

from redcube_ai.native_helpers import renderer_dependencies
from redcube_ai.native_helpers.ppt_deck import native


class NativePptLibreOfficeRendererTest(unittest.TestCase):
    def test_auto_renderer_fails_closed_instead_of_selecting_legacy_desktop_renderer(self):
        with (
            mock.patch.object(renderer_dependencies.shutil, 'which', return_value=None),
            mock.patch.object(renderer_dependencies.Path, 'exists', return_value=False),
            mock.patch('sys.stderr'),
            self.assertRaises(SystemExit),
        ):
            native.resolve_renderer('auto')

    def test_libreoffice_renderer_fails_closed_when_poppler_is_missing(self):
        def fake_which(name):
            return '/usr/local/bin/soffice' if name == 'soffice' else None

        with (
            mock.patch.object(renderer_dependencies.shutil, 'which', side_effect=fake_which),
            mock.patch.object(renderer_dependencies.Path, 'exists', return_value=False),
            self.assertRaises(SystemExit),
            mock.patch('sys.stderr') as stderr,
        ):
            native.resolve_renderer('libreoffice_headless')
        message = ''.join(call.args[0] for call in stderr.write.call_args_list if call.args)
        self.assertIn('pdftoppm', message)
        self.assertIn('Poppler', message)
        self.assertIn('Docker', message)
        self.assertIn('tools/native-ppt-proof/install-deps.sh', message)

    def test_renderer_resolves_macos_homebrew_cask_libreoffice_app_path(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            cask_soffice = root / 'LibreOffice.app' / 'Contents' / 'MacOS' / 'soffice'
            cask_soffice.parent.mkdir(parents=True)
            cask_soffice.write_text('#!/bin/sh\n', encoding='utf-8')

            def fake_which(name):
                return '/usr/local/bin/pdftoppm' if name == 'pdftoppm' else None

            def fake_run(command, text, capture_output, check):
                if command[:2] == [str(cask_soffice), '--version']:
                    return native.subprocess.CompletedProcess(command, 0, stdout='LibreOffice 26.2.3\n', stderr='')
                if command[:2] == ['/usr/local/bin/pdftoppm', '-v']:
                    return native.subprocess.CompletedProcess(command, 0, stdout='', stderr='pdftoppm version 26.04.0\n')
                raise AssertionError(f'unexpected command: {command}')

            with (
                mock.patch.object(renderer_dependencies, 'MACOS_LIBREOFFICE_PATHS', (cask_soffice,)),
                mock.patch.object(renderer_dependencies.shutil, 'which', side_effect=fake_which),
                mock.patch.object(native.subprocess, 'run', side_effect=fake_run),
            ):
                renderer = native.resolve_renderer('auto')

            self.assertEqual(renderer['soffice'], str(cask_soffice))
            self.assertEqual(renderer['pdftoppm'], '/usr/local/bin/pdftoppm')
            self.assertIn('LibreOffice 26.2.3', renderer['libreoffice_version'])
            self.assertIn('redcube_dependency_installer', renderer['dependency_install_commands'])

    def test_libreoffice_render_proof_records_hashes_versions_and_pipeline(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            pptx = root / 'deck.pptx'
            pptx.write_bytes(b'pptx')
            preview_dir = root / 'previews'
            output_pdf = root / 'proof.pdf'

            def fake_which(name):
                return {
                    'soffice': '/usr/local/bin/soffice',
                    'pdftoppm': '/usr/local/bin/pdftoppm',
                }.get(name)

            def fake_run(command, text, capture_output, check):
                if command[:2] == ['/usr/local/bin/soffice', '--version']:
                    return native.subprocess.CompletedProcess(command, 0, stdout='LibreOffice 24.2.0\n', stderr='')
                if command[:2] == ['/usr/local/bin/pdftoppm', '-v']:
                    return native.subprocess.CompletedProcess(command, 0, stdout='', stderr='pdftoppm version 24.02.0\n')
                if command[0] == '/usr/local/bin/soffice':
                    (output_pdf.parent / 'deck.pdf').write_bytes(b'pdf')
                    return native.subprocess.CompletedProcess(command, 0, stdout='', stderr='')
                if command[0] == '/usr/local/bin/pdftoppm':
                    preview_dir.mkdir(parents=True, exist_ok=True)
                    Image.new('RGB', (32, 18), (255, 255, 255)).save(preview_dir / 'slide-1.png')
                    return native.subprocess.CompletedProcess(command, 0, stdout='', stderr='')
                raise AssertionError(f'unexpected command: {command}')

            with (
                mock.patch.object(renderer_dependencies.shutil, 'which', side_effect=fake_which),
                mock.patch.object(native.subprocess, 'run', side_effect=fake_run),
            ):
                proof = native.render_pptx(
                    pptx,
                    preview_dir,
                    output_pdf,
                    renderer_name='auto',
                )

            self.assertEqual(proof['renderer_kind'], 'libreoffice_headless')
            self.assertEqual(proof['renderer_pipeline'], 'libreoffice_headless_pdf_png_v1')
            self.assertEqual(proof['slide_count'], 1)
            self.assertEqual(proof['source_pptx_sha256'], native.file_sha256(pptx))
            self.assertEqual(proof['pdf_sha256'], native.file_sha256(output_pdf))
            self.assertEqual(len(proof['preview_png_hashes']), 1)
            self.assertIn('LibreOffice 24.2.0', proof['libreoffice_version'])
            self.assertIn('pdftoppm version 24.02.0', proof['poppler_version'])

            slides = native.attach_rendered_previews(
                [{'slide_id': 'S01', 'native_shapes': []}],
                proof,
            )
            self.assertEqual(slides[0]['renderer_kind'], 'libreoffice_headless')
            self.assertEqual(slides[0]['renderer_pipeline'], 'libreoffice_headless_pdf_png_v1')
            self.assertEqual(slides[0]['render_provenance']['preview_screenshot_sha256'], proof['preview_png_hashes'][0]['sha256'])
            self.assertEqual(slides[0]['preview_screenshot_dimensions'], {'width': 32, 'height': 18})
            self.assertEqual(slides[0]['render_provenance']['preview_screenshot_dimensions'], {'width': 32, 'height': 18})
            self.assertFalse(slides[0]['synthetic_preview'])


if __name__ == '__main__':
    unittest.main()
