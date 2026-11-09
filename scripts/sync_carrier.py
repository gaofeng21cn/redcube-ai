#!/usr/bin/env python3
"""Project RCA owner resources into its self-contained Codex carrier."""

import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CARRIER = ROOT / 'plugins/redcube-ai'
RESOURCE_ROOTS = ('agent', 'contracts', 'python', 'runtime', 'docs', 'prompts/ppt_deck')


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def projection():
    sources = subprocess.check_output(
        ['git', 'ls-files', '-z', '--', *RESOURCE_ROOTS], cwd=ROOT,
    ).decode().split('\0')
    sources = [Path(path) for path in sources if path
               and not Path(path).name.startswith('test_')]
    sources += [Path(path) for path in (
        'pyproject.toml', 'uv.lock', 'README.md', 'README.zh-CN.md', 'LICENSE',
        'assets/branding/redcube-ai-logo.png',
        'assets/branding/redcube-ai-overview-v3.png',
        'app-contribution-adapter.json',
    )]
    expected = {}
    for relative in sources:
        source = ROOT / relative
        if source.is_symlink() or not source.is_file():
            raise SystemExit(f'Carrier source must be a regular file: {relative}')
        expected[CARRIER / relative] = source.read_bytes()
    owner_path = ROOT / 'contracts/opl_agent_package_manifest.json'
    owner = json.loads(owner_path.read_text())
    domain = json.loads((ROOT / owner['domain_descriptor_ref']).read_text())
    descriptor = {key: owner[key] for key in (
        'surface_kind', 'agent_id', 'package_id', 'display_name', 'presentation',
        'publisher', 'version', 'source', 'carrier_source_role', 'source_repo',
        'schema_ref', 'domain_descriptor_ref', 'entrypoints', 'app_contributions',
    )}
    descriptor.update({
        'kind': 'agent',
        'domain_id': domain['domain_id'],
        'task_provider_ref': owner['domain_descriptor_ref'] + '#/standard_agent_interface/stage_catalog',
        'action_catalog_ref': 'contracts/action_catalog.json',
        'view_refs': [],
        'requires': [],
        'capability_dependencies': [],
    })
    for entrypoint in descriptor['entrypoints']:
        if 'carrier_ref' in entrypoint:
            entrypoint['carrier_ref'] = str(Path(entrypoint['carrier_ref']).relative_to('plugins/redcube-ai'))
    descriptor['codex_surface'] = {
        key: owner['codex_surface'][key] for key in (
            'plugin_id', 'configured_codex_plugin_carrier', 'required_skill_ids',
            'app_contribution_abi', 'app_contribution_adapter',
        )
    }
    descriptor['codex_surface']['plugin_source_path'] = '.'
    expected[ROOT / 'opl-package.json'] = owner_path.read_bytes()
    expected[CARRIER / 'opl-package.json'] = json_bytes(descriptor)
    expected[CARRIER / 'skills/redcube-ai/SKILL.md'] = (ROOT / 'agent/primary_skill/SKILL.md').read_bytes()
    for path in (ROOT / '.codex-plugin/plugin.json', CARRIER / '.codex-plugin/plugin.json', CARRIER / 'plugin.json'):
        manifest = json.loads(path.read_text())
        manifest['version'] = owner['version']
        expected[path] = json_bytes(manifest)
    return expected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = projection()
    stale = [path for area in RESOURCE_ROOTS for path in (CARRIER / area).rglob('*')
             if path.is_file() and path not in expected]
    mismatches = [path for path, content in expected.items()
                  if not path.is_file() or path.read_bytes() != content]
    if args.check:
        if stale or mismatches:
            raise SystemExit('Carrier resources differ; run python3 scripts/sync_carrier.py')
        print(f'Carrier resources: PASS ({len(expected)} exact files)')
        return
    for path, content in expected.items():
        if path.is_symlink():
            raise SystemExit(f'Refusing a symlink in the carrier projection: {path}')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    for path in stale:
        path.unlink()
    print(f'Projected {len(expected)} owner resources and declarations')


if __name__ == '__main__':
    main()
