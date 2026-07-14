import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

const repoRoot = path.resolve('.');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const sha256 = (bytes) => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;

function pythonEnv() {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rca-native-helper-test-'));
  return {
    ...process.env,
    PYTHONPATH: process.env.PYTHONPATH
      ? `${path.join(repoRoot, 'python')}${path.delimiter}${process.env.PYTHONPATH}`
      : path.join(repoRoot, 'python'),
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPYCACHEPREFIX: path.join(cacheRoot, 'pycache'),
    PYTEST_ADDOPTS: `-p no:cacheprovider -o cache_dir=${path.join(cacheRoot, 'pytest-cache')}`,
  };
}

test('Python native helper catalog exposes only RCA artifact helpers behind OPL execution', () => {
  const catalog = readJson('contracts/runtime-program/python-native-helper-catalog.json');
  const pyproject = fs.readFileSync(path.join(repoRoot, 'pyproject.toml'), 'utf8');

  assert.equal(catalog.contract_id, 'python-native-helper-catalog');
  assert.equal(catalog.language, 'python');
  assert.equal(catalog.bypass_policy.generic_bypass_allowed, false);
  assert.match(catalog.bypass_policy.required_entry_surface, /OPL-hosted/i);
  assert.deepEqual(catalog.helpers.map((entry) => entry.helper_id), [
    'ppt_deck_review',
    'ppt_deck_export',
    'ppt_deck_native',
  ]);
  assert.doesNotMatch(pyproject, /\[project\.scripts\]/);
  for (const helper of catalog.helpers) {
    assert.match(helper.package_module, /^redcube_ai\.native_helpers\./);
    assert.match(helper.probe_descriptor_ref, /\.native-helper-probe\.json$/);
    assert.equal(Object.hasOwn(helper, 'package_entrypoint'), false);
    assert.equal(Object.hasOwn(helper, 'console_script'), false);
  }
});

test('native helper catalog binds exact tracked Python entrypoints', () => {
  const catalog = readJson('contracts/runtime-program/python-native-helper-catalog.json');

  for (const helper of catalog.helpers) {
    assert.match(helper.source_ref, /^python\/redcube_ai\/native_helpers\/.+\.py$/);
    assert.equal(fs.existsSync(path.join(repoRoot, helper.source_ref)), true, helper.source_ref);
    assert.equal(
      helper.source_ref,
      `python/${helper.package_module.replaceAll('.', '/')}.py`,
      helper.helper_id,
    );
    const source = fs.readFileSync(path.join(repoRoot, helper.source_ref), 'utf8');
    assert.match(source, /^def main\(/m);

    const descriptor = readJson(helper.probe_descriptor_ref);
    const descriptorDir = path.dirname(path.join(repoRoot, helper.probe_descriptor_ref));
    const descriptorEntrypoint = path.resolve(descriptorDir, descriptor.entrypoint_ref);
    assert.equal(descriptor.surface_kind, 'opl_pack_native_helper_probe_descriptor');
    assert.equal(descriptor.schema_version, 1);
    assert.equal(descriptor.helper_id, helper.helper_id);
    assert.equal(descriptor.owner, 'rca');
    assert.equal(descriptorEntrypoint, path.resolve(repoRoot, helper.source_ref));
    assert.equal(
      Object.values(descriptor.authority_boundary).every((value) => value === false),
      true,
    );
    for (const slot of descriptor.source_closure.effect_slots) {
      const slotSource = fs.readFileSync(path.resolve(descriptorDir, slot.source_ref));
      assert.equal(slot.source_digest, sha256(slotSource), `${helper.helper_id}:${slot.slot_id}`);
      assert.equal(
        slot.target_policy,
        slot.effect_kind === 'process_spawn'
          ? 'declared_command_set'
          : 'declared_artifact_write_slot',
      );
    }
  }

  const nativeDescriptor = readJson(
    'python/redcube_ai/native_helpers/ppt_deck/native.native-helper-probe.json',
  );
  assert.deepEqual(nativeDescriptor.required_commands, ['officecli', 'soffice', 'pdftoppm']);
});

test('native helper package imports and doctor emits diagnostics without executing generation', () => {
  const python = resolveRedCubePythonCommand();
  const modules = [
    'redcube_ai.native_helpers.ppt_deck.review',
    'redcube_ai.native_helpers.ppt_deck.export',
    'redcube_ai.native_helpers.ppt_deck.native',
  ];
  const importResult = spawnSync(
    python.command,
    [...python.args, '-c', `import ${modules.join(', ')}`],
    { cwd: repoRoot, encoding: 'utf8', env: pythonEnv() },
  );
  assert.equal(importResult.status, 0, importResult.stderr || importResult.stdout);

  const doctorResult = spawnSync(
    python.command,
    [...python.args, '-m', 'redcube_ai.native_helpers.doctor'],
    { cwd: repoRoot, encoding: 'utf8', env: pythonEnv() },
  );
  assert.equal(doctorResult.status, 0, doctorResult.stderr || doctorResult.stdout);
  const report = JSON.parse(doctorResult.stdout);
  assert.equal(report.surface_kind, 'python_native_helper_doctor');
  assert.equal(report.helper_count, 3);
  assert.equal(report.renderer_availability.executes_generation, false);
  assert.equal(report.renderer_availability.executes_review_export_gates, false);
  assert.equal(report.helpers.every((helper) => helper.entrypoint.public_launcher === false), true);
  assert.equal(
    report.helpers.every((helper) => helper.entrypoint.probe_descriptor_matches_source === true),
    true,
  );
  assert.equal(report.renderer_availability.dependency_install.automatic_install_allowed, false);
  assert.equal(
    report.renderer_availability.dependency_install.provisioning_owner,
    'opl_connect_or_operator',
  );
});
