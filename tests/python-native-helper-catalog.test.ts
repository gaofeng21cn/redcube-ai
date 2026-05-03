// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeHermesNativeProof } from './package-surfaces.ts';

const CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';
const ENGINE_CONTRACT_FILE = 'contracts/runtime-program/ppt-native-python-engine-contract.json';
const PROOF_LANE_FILE = 'contracts/runtime-program/ppt-native-authoring-proof-lane.json';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

const RUNTIME_PYTHON_CALLER_FILES = [
  'packages/redcube-runtime-protocol/src/python-native-helper.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stages.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/export.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts',
  'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts',
  'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/index.ts',
  'packages/redcube-hermes-substrate/src/hermes-native-proof-client.ts',
];

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function readImplementation(file) {
  const source = readFileSync(path.resolve(file), 'utf-8');
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? readFileSync(path.resolve(path.dirname(file), shell[1]), 'utf-8') : source;
}

function helperById(catalog) {
  return Object.fromEntries(catalog.helpers.map((helper) => [helper.helper_id, helper]));
}

function runPythonModule(module, args = []) {
  return spawnSync('python3', ['-m', module, ...args], {
    cwd: path.resolve('.'),
    encoding: 'utf-8',
    env: {
      ...process.env,
      PYTHONPATH: path.resolve('python'),
    },
  });
}

function readPyprojectScripts() {
  const result = spawnSync(
    'python3',
    [
      '-c',
      [
        'import json, tomllib',
        "data = tomllib.loads(open('pyproject.toml', 'rb').read().decode('utf-8'))",
        "print(json.dumps(data.get('project', {}).get('scripts', {})))",
      ].join('; '),
    ],
    {
      cwd: path.resolve('.'),
      encoding: 'utf-8',
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('Python native helper catalog records the repo-owned helper boundary', () => {
  const catalog = readJson(CATALOG_FILE);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(catalog.contract_id, 'python-native-helper-catalog');
  assert.equal(catalog.language, 'python');
  assert.deepEqual(catalog.package, {
    name: 'redcube-ai',
    source_root: 'python',
    import_root: 'redcube_ai',
    pyproject: 'pyproject.toml',
    diagnostics: {
      surface_kind: 'python_native_helper_doctor',
      package_module: 'redcube_ai.native_helpers.doctor',
      console_script: 'redcube-native-helper-doctor',
      module_command: 'python -m redcube_ai.native_helpers.doctor',
      output_format: 'fixed_json',
      executes_generation: false,
      executes_review_export_gates: false,
      route_authority: 'diagnostic_only',
      bypass_product_entry_allowed: false,
    },
  });
  assert.equal(existsSync(path.resolve(catalog.package.pyproject)), true);
  assert.deepEqual(catalog.invocation_policy, {
    preferred_internal_invocation: 'package_module',
    preferred_argv_shape: ['python', '-m', '<package_module>'],
    compatibility_script_wrappers_allowed: true,
    compatibility_script_wrappers_are_preferred: false,
  });
  assert.equal(catalog.bypass_policy.generic_bypass_allowed, false);
  assert.equal(currentProgram.longrun_goal.language_target.python_native_helper_catalog, CATALOG_FILE);
  assert.equal(currentProgram.current_state.runtime_manager_status.native_helper_catalog, CATALOG_FILE);
  assert.equal(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.native_helper_catalog,
    CATALOG_FILE,
  );
});

test('Python native helper catalog records doctor as diagnostics, not an execution helper route', () => {
  const catalog = readJson(CATALOG_FILE);
  const scripts = readPyprojectScripts();

  assert.equal(catalog.package.diagnostics.surface_kind, 'python_native_helper_doctor');
  assert.equal(catalog.package.diagnostics.package_module, 'redcube_ai.native_helpers.doctor');
  assert.equal(catalog.package.diagnostics.module_command, 'python -m redcube_ai.native_helpers.doctor');
  assert.equal(catalog.package.diagnostics.executes_generation, false);
  assert.equal(catalog.package.diagnostics.executes_review_export_gates, false);
  assert.equal(catalog.package.diagnostics.route_authority, 'diagnostic_only');
  assert.equal(catalog.package.diagnostics.bypass_product_entry_allowed, false);
  assert.equal(scripts[catalog.package.diagnostics.console_script], 'redcube_ai.native_helpers.doctor:main');
  assert.equal(catalog.helpers.some((helper) => helper.package_module === catalog.package.diagnostics.package_module), false);
});

test('Python native helper catalog only points at tracked Python helper scripts', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);

  assert.deepEqual(
    Object.keys(helpers).sort(),
    ['hermes_native_proof_bridge', 'ppt_deck_export', 'ppt_deck_native', 'ppt_deck_review'],
  );

  for (const helper of catalog.helpers) {
    assert.equal(helper.owner, 'python_native_helper');
    assert.equal(helper.script.endsWith('.py'), true, helper.helper_id);
    assert.equal(typeof helper.package_module, 'string', helper.helper_id);
    assert.match(helper.package_module, /^redcube_ai\./, helper.helper_id);
    assert.equal(helper.package_entrypoint.module, helper.package_module, helper.helper_id);
    assert.equal(helper.package_entrypoint.callable, 'main', helper.helper_id);
    assert.equal(helper.package_entrypoint.module_command, `python -m ${helper.package_module}`, helper.helper_id);
    assert.deepEqual(helper.preferred_invocation, {
      kind: 'package_module',
      argv: ['-m', helper.package_module],
    }, helper.helper_id);
    assert.match(helper.package_entrypoint.console_script, /^redcube-/, helper.helper_id);
    assert.equal(existsSync(path.resolve(helper.script)), true, helper.script);
  }

  assert.equal(helpers.ppt_deck_review.deliverable_family, 'ppt_deck');
  assert.equal(helpers.ppt_deck_export.deliverable_family, 'ppt_deck');
  assert.equal(helpers.ppt_deck_native.deliverable_family, 'ppt_deck');
  assert.equal(helpers.hermes_native_proof_bridge.deliverable_family, 'runtime_substrate');
});

test('Python helper package modules and entrypoint callables import from the formal package root', () => {
  const catalog = readJson(CATALOG_FILE);
  const moduleChecks = catalog.helpers.map((helper) => {
    return [
      `module = importlib.import_module(${JSON.stringify(helper.package_module)})`,
      "assert callable(getattr(module, 'main', None))",
    ].join('; ');
  }).join('; ');
  const result = spawnSync('python3', ['-c', `import importlib; ${moduleChecks}`], {
    cwd: path.resolve('.'),
    encoding: 'utf-8',
    env: {
      ...process.env,
      PYTHONPATH: path.resolve('python'),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('Python helper catalog package entrypoints match pyproject console scripts', () => {
  const catalog = readJson(CATALOG_FILE);
  const scripts = readPyprojectScripts();

  for (const helper of catalog.helpers) {
    const { console_script: consoleScript, module, callable } = helper.package_entrypoint;
    assert.equal(
      scripts[consoleScript],
      `${module}:${callable}`,
      `${helper.helper_id} console script must resolve to the package main callable`,
    );
  }
});

test('Python helper modules are discoverable without running native PowerPoint gates in fast checks', () => {
  const catalog = readJson(CATALOG_FILE);

  for (const helper of catalog.helpers) {
    const result = helper.helper_id === 'ppt_deck_native'
      ? spawnSync('python3', ['-c', [
        'import importlib',
        `module = importlib.import_module(${JSON.stringify(helper.package_module)})`,
        "assert callable(getattr(module, 'main', None))",
      ].join('; ')], {
        cwd: path.resolve('.'),
        encoding: 'utf-8',
        env: {
          ...process.env,
          PYTHONPATH: path.resolve('python'),
        },
      })
      : spawnSync('python3', ['-m', helper.package_module, '--help'], {
      cwd: path.resolve('.'),
      encoding: 'utf-8',
      env: {
        ...process.env,
        PYTHONPATH: path.resolve('python'),
      },
    });

    assert.equal(result.status, 0, `${helper.helper_id}: ${result.stderr || result.stdout}`);
  }
});

test('Python native helper doctor runs as a package module and emits fixed JSON diagnostics', () => {
  const catalog = readJson(CATALOG_FILE);
  const result = runPythonModule(catalog.package.diagnostics.package_module);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.surface_kind, 'python_native_helper_doctor');
  assert.equal(report.status, 'ok');
  assert.deepEqual(report.package, {
    name: 'redcube-ai',
    version: '0.1.0',
    import_root: 'redcube_ai',
    source_root: 'python',
  });
  assert.deepEqual(report.catalog, {
    path: CATALOG_FILE,
    contract_id: 'python-native-helper-catalog',
  });
  assert.equal(report.helper_count, catalog.helpers.length);
  assert.deepEqual(report.bypass_policy, catalog.bypass_policy);
  assert.deepEqual(report.required_gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.equal(report.helpers.length, catalog.helpers.length);

  for (const helper of report.helpers) {
    assert.equal(helper.importability.module_spec_found, true, helper.helper_id);
    assert.equal(helper.entrypoint.matches_pyproject, true, helper.helper_id);
    assert.equal(Array.isArray(helper.optional_dependencies.summary), true, helper.helper_id);
  }
});

test('Python native helper doctor does not create a bypass around review/export gates', () => {
  const result = runPythonModule('redcube_ai.native_helpers.doctor');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  const nativeHelper = report.helpers.find((helper) => helper.helper_id === 'ppt_deck_native');

  assert.deepEqual(report.required_gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.equal(report.bypass_policy.generic_bypass_allowed, false);
  assert.equal(report.bypass_policy.required_entry_surface, 'RedCube product-entry or runtime-family route');
  assert.deepEqual(nativeHelper.routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(nativeHelper.gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.equal(nativeHelper.capability_status, 'production_selectable_optional');
  assert.equal(nativeHelper.default_enabled, false);
  assert.equal(nativeHelper.engine_capabilities.authoring_ir, 'redcube_svg_ir');
  assert.equal(nativeHelper.engine_capabilities.pptx_writer, 'redcube_drawingml_writer');
  assert.equal(nativeHelper.engine_capabilities.true_render_proof_required, true);
  assert.equal(nativeHelper.true_render_proof.required, true);
  assert.equal(nativeHelper.true_render_proof.synthetic_preview_allowed, false);
});

test('Compatibility wrapper scripts remain thin package entrypoints', () => {
  const catalog = readJson(CATALOG_FILE);

  for (const helper of catalog.helpers) {
    const wrapper = readFileSync(path.resolve(helper.script), 'utf-8');
    assert.match(wrapper, new RegExp(`from ${helper.package_module.replaceAll('.', '\\.')} import main`), helper.helper_id);
    assert.match(wrapper, /if __name__ == ['"]__main__['"]:/, helper.helper_id);
  }
});

test('Runtime Python helper callers prefer package module invocation over wrapper script paths', () => {
  const combinedSource = RUNTIME_PYTHON_CALLER_FILES
    .map((file) => readImplementation(file))
    .join('\n');

  assert.doesNotMatch(
    combinedSource,
    /const\s+PYTHON_[A-Z_]+\s*=\s*path\.join\([^;]+redcube-runtime\/scripts\/ppt_deck_[a-z_]+\.py/s,
  );
  assert.doesNotMatch(combinedSource, /DEFAULT_BRIDGE_SCRIPT/);
  assert.match(combinedSource, /'-m',\s*helper\.packageModule/);
  assert.match(combinedSource, /runRedCubePythonHelper/);
  assert.match(combinedSource, /'-m',\s*DEFAULT_BRIDGE_MODULE/);
  assert.match(combinedSource, /python-native-helper-catalog\.json/);

  for (const helper of readJson(CATALOG_FILE).helpers) {
    const source = combinedSource.includes(helper.helper_id);
    assert.equal(source, true, `${helper.helper_id} must be resolved from the helper catalog by id`);
  }
});

test('Hermes native proof client defaults to the package module bridge', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-module-entry-'));
  const argvFile = path.join(tempDir, 'argv.json');
  const mockPython = path.join(tempDir, 'mock-python.mjs');
  writeFileSync(mockPython, [
    '#!/usr/bin/env node',
    "import { readFileSync, writeFileSync } from 'node:fs';",
    `writeFileSync(${JSON.stringify(argvFile)}, JSON.stringify(process.argv.slice(2)));`,
    'const request = JSON.parse(readFileSync(process.argv.at(-1), "utf-8"));',
    'if (request.action !== "probe") throw new Error("expected probe request");',
    'process.stdout.write(JSON.stringify({ ok: true, contract: { model: "mock-model" } }) + "\\n");',
  ].join('\n'), { mode: 0o755 });

  const probe = probeHermesNativeProof({
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      REDCUBE_HERMES_NATIVE_PYTHON_COMMAND: mockPython,
      REDCUBE_HERMES_NATIVE_BRIDGE_COMMAND: '',
    },
  });

  assert.equal(probe.ok, true, probe.blocking_reason);
  const argv = JSON.parse(readFileSync(argvFile, 'utf-8'));
  assert.deepEqual(argv.slice(0, 2), ['-m', 'redcube_ai.hermes.native_proof_bridge']);
  assert.equal(path.basename(argv.at(-1)), 'request.json');
});

test('Native PPT helper routes stay tied to the engine contract and review/export gates', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);
  const engineContract = readJson(ENGINE_CONTRACT_FILE);
  const proofLane = readJson(PROOF_LANE_FILE);

  assert.deepEqual(helpers.ppt_deck_native.routes, engineContract.owned_routes);
  assert.equal(helpers.ppt_deck_native.engine_contract, ENGINE_CONTRACT_FILE);
  assert.equal(helpers.ppt_deck_native.proof_lane_contract, PROOF_LANE_FILE);
  assert.deepEqual(
    helpers.ppt_deck_native.routes,
    proofLane.candidate_route_model.runnable_routes,
  );
  assert.deepEqual(
    helpers.ppt_deck_native.gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
});

test('Review and export helpers stay scoped to their existing runtime gates', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);

  assert.deepEqual(helpers.ppt_deck_review.routes, []);
  assert.deepEqual(helpers.ppt_deck_review.gates, ['screenshot_review']);
  assert.deepEqual(helpers.ppt_deck_review.requires, ['playwright']);

  assert.deepEqual(helpers.ppt_deck_export.routes, ['export_pptx']);
  assert.deepEqual(helpers.ppt_deck_export.gates, ['export_pptx']);
  assert.deepEqual(helpers.ppt_deck_export.requires, ['Pillow', 'python-pptx']);

  assert.deepEqual(helpers.hermes_native_proof_bridge.routes, []);
  assert.deepEqual(helpers.hermes_native_proof_bridge.gates, []);
  assert.deepEqual(helpers.hermes_native_proof_bridge.requires, ['upstream-hermes-agent-local']);
});
