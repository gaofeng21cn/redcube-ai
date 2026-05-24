// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeHermesAgentLoop } from './package-surfaces.ts';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

const CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';
const ENGINE_CONTRACT_FILE = 'contracts/runtime-program/ppt-native-python-engine-contract.json';
const PROOF_LANE_FILE = 'contracts/runtime-program/ppt-native-authoring-proof-lane.json';
const NATIVE_PPT_HELPER_ID = 'ppt_deck_native';
const NATIVE_PPT_PACKAGE_MODULE = 'redcube_ai.native_helpers.ppt_deck.native';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
let cachedPythonCommand = null;
const PYTHON_CACHE_ROOT = mkdtempSync(path.join(os.tmpdir(), 'redcube-python-native-helper-cache-'));

const RUNTIME_PYTHON_CALLER_FILES = [
  'packages/redcube-runtime-protocol/src/python-native-helper.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stages.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/export.ts',
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts',
  'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts',
  'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/index.ts',
  'packages/redcube-runtime-protocol/src/hermes-agent-loop-bridge-client.ts',
];
const TEST_PYTHON_PROOF_CALLER_FILES = [
  'tests/block-content-fit-review-cases/shared.ts',
  'tests/block-content-fit-review-surface-children.test.ts',
  'tests/ppt-creative-ownership-cases/foundation-and-routes.test.ts',
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

function resolveTestPythonCommand() {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }
  const explicitTestPython = String(process.env.REDCUBE_TEST_PYTHON || '').trim();
  cachedPythonCommand = explicitTestPython
    ? { command: explicitTestPython, args: [] }
    : resolveRedCubePythonCommand();
  return cachedPythonCommand;
}

function runPython(args, options = {}) {
  const python = resolveTestPythonCommand();
  return spawnSync(python.command, [...(python.args || []), ...args], {
    cwd: path.resolve('.'),
    encoding: 'utf-8',
    ...options,
    env: {
      ...process.env,
      PYTHONPATH: path.resolve('python'),
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONPYCACHEPREFIX: path.join(PYTHON_CACHE_ROOT, 'pycache'),
      PYTEST_ADDOPTS: `${process.env.PYTEST_ADDOPTS || ''} -p no:cacheprovider -o cache_dir=${path.join(PYTHON_CACHE_ROOT, 'pytest-cache')}`.trim(),
      ...(options.env || {}),
    },
  });
}

function runPythonModule(module, args = []) {
  return runPython(['-m', module, ...args]);
}

function runPythonImportabilityCheck(module) {
  return runPython(['-c', [
    'import importlib',
    `module = importlib.import_module(${JSON.stringify(module)})`,
    "assert callable(getattr(module, 'main', None))",
  ].join('; ')]);
}

function readPyprojectScripts() {
  const result = runPython([
    '-c',
    [
      'import json, tomllib',
      "data = tomllib.loads(open('pyproject.toml', 'rb').read().decode('utf-8'))",
      "print(json.dumps(data.get('project', {}).get('scripts', {})))",
    ].join('; '),
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('Python native helper catalog records the repo-owned helper boundary', () => {
  const catalog = readJson(CATALOG_FILE);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(catalog.contract_id, 'python-native-helper-catalog');
  assert.equal(catalog.language, 'python');
  assert.equal(
    catalog.typescript_boundary,
    'TypeScript owns product entry, CLI/MCP, domain-entry protocol contracts, runtime-family route orchestration, and review/export gate wiring.',
  );
  assert.doesNotMatch(catalog.typescript_boundary, /\bgateway contracts\b/);
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
    legacy_wrapper_scripts_allowed: false,
    legacy_wrapper_scripts_are_preferred: false,
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

test('Python native helper catalog only points at tracked package modules', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);

  assert.deepEqual(
    Object.keys(helpers).sort(),
    ['hermes_agent_loop_bridge', 'ppt_deck_export', 'ppt_deck_native', 'ppt_deck_review'],
  );

  for (const helper of catalog.helpers) {
    assert.equal(helper.owner, 'python_native_helper');
    assert.equal(Object.hasOwn(helper, 'script'), false, helper.helper_id);
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
  }

  assert.equal(helpers.ppt_deck_review.deliverable_family, 'ppt_deck');
  assert.equal(helpers.ppt_deck_export.deliverable_family, 'ppt_deck');
  assert.equal(helpers.ppt_deck_native.deliverable_family, 'ppt_deck');
  assert.equal(helpers.hermes_agent_loop_bridge.deliverable_family, 'runtime_protocol');
});

test('Python helper package modules and entrypoint callables import from the formal package root', () => {
  const catalog = readJson(CATALOG_FILE);
  const moduleChecks = catalog.helpers.map((helper) => {
    return [
      `module = importlib.import_module(${JSON.stringify(helper.package_module)})`,
      "assert callable(getattr(module, 'main', None))",
    ].join('; ');
  }).join('; ');
  const result = runPython(['-c', `import importlib; ${moduleChecks}`]);

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

test('Python helper modules are discoverable without running native renderer gates in fast/meta checks', () => {
  const catalog = readJson(CATALOG_FILE);

  for (const helper of catalog.helpers) {
    const result = helper.helper_id === NATIVE_PPT_HELPER_ID
      ? runPythonImportabilityCheck(helper.package_module)
      : runPython(['-m', helper.package_module, '--help']);

    assert.equal(result.status, 0, `${helper.helper_id}: ${result.stderr || result.stdout}`);
  }
});

test('Native PPT helper catalog check never invokes the real native renderer entrypoint', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);
  const nativeHelper = helpers[NATIVE_PPT_HELPER_ID];
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf-8');
  const registrySource = readFileSync(path.resolve('scripts/test-registry.ts'), 'utf-8');
  const runGroupLibSource = readFileSync(path.resolve('scripts/run-test-group-lib.ts'), 'utf-8');

  assert.equal(nativeHelper.package_module, NATIVE_PPT_PACKAGE_MODULE);
  assert.equal(nativeHelper.default_enabled, false);
  assert.equal(nativeHelper.capability_status, 'production_selectable_optional');
  assert.equal(nativeHelper.package_entrypoint.module_command, `python -m ${NATIVE_PPT_PACKAGE_MODULE}`);
  assert.doesNotMatch(source, /runPython\(\['-m',\s*NATIVE_PPT_PACKAGE_MODULE,\s*'--help'\]\)/);
  assert.doesNotMatch(source, /runPythonModule\(NATIVE_PPT_PACKAGE_MODULE/);
  assert.match(source, /runPythonImportabilityCheck\(helper\.package_module\)/);
  assert.doesNotMatch(registrySource, /RED(CUBE)?_PYTHON_COMMAND[^\n]*soffice/i);
  assert.doesNotMatch(registrySource, new RegExp(['osa', 'script'].join(''), 'i'));
  assert.doesNotMatch(registrySource, new RegExp(['powerpoint', '_applescript'].join(''), 'i'));
  assert.doesNotMatch(registrySource, new RegExp(['microsoft', ' powerpoint'].join(''), 'i'));
  assert.match(registrySource, /tests\/ppt-native-ppt-runtime\.test\.ts/);
  assert.match(registrySource, /tests\/product-entry-native-ppt-proof-lane\.test\.ts/);
  assert.match(runGroupLibSource, /ROUTE_HEAVY_SERIALIZATION_GROUP_NAMES = new Set\(\[[\s\S]*'smoke'[\s\S]*'fast'[\s\S]*'full:with-historical'[\s\S]*\]\)/);
  assert.doesNotMatch(runGroupLibSource, /SERIALIZED_VERIFICATION_GROUP_NAMES = new Set\(\[[^\]]*'fast'|'meta'/);
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
  assert.equal(report.renderer_availability.surface_kind, 'native_ppt_renderer_availability');
  assert.equal(report.renderer_availability.executes_generation, false);
  assert.equal(report.renderer_availability.executes_review_export_gates, false);
  assert.equal(report.renderer_availability.linux_native_proof.renderer_kind, 'libreoffice_headless');
  assert.equal(report.renderer_availability.linux_native_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.deepEqual(report.renderer_availability.linux_native_proof.required_system_packages, [
    'libreoffice',
    'poppler-utils',
    'fonts-noto-cjk',
  ]);
  assert.deepEqual(report.renderer_availability.linux_native_proof.required_python_packages, [
    'Pillow',
    'python-pptx',
    'playwright',
  ]);
  assert.equal(report.renderer_availability.desktop_app_fallback_allowed, false);
  assert.deepEqual(report.renderer_availability.dependency_install, {
    automatic_installer: 'tools/native-ppt-proof/install-deps.sh',
    suggested_command: report.renderer_availability.dependency_install.suggested_command,
    commands: {
      redcube_dependency_installer: 'tools/native-ppt-proof/install-deps.sh',
      macos_homebrew: 'brew install --cask libreoffice && brew install poppler font-noto-sans-cjk',
      debian_ubuntu: 'sudo apt-get update && sudo apt-get install -y libreoffice poppler-utils fonts-noto-cjk',
      docker: report.renderer_availability.suggested_docker_command,
    },
    executes_generation: false,
    executes_review_export_gates: false,
  });
  assert.match(report.renderer_availability.dependency_install.suggested_command, /install-deps\.sh|apt-get|docker build/);
  assert.match(report.renderer_availability.suggested_docker_command, /docker build -f tools\/native-ppt-proof\/Dockerfile/);
  assert.equal(typeof report.renderer_availability.linux_native_proof.available, 'boolean');
  assert.equal(
    report.renderer_availability.linux_native_proof.available
      ? report.renderer_availability.linux_native_proof.blocked_reason
      : typeof report.renderer_availability.linux_native_proof.blocked_reason,
    report.renderer_availability.linux_native_proof.available ? null : 'string',
  );
  assert.equal(report.helper_count, catalog.helpers.length);
  assert.deepEqual(report.bypass_policy, catalog.bypass_policy);
  assert.deepEqual(report.required_gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.equal(report.helpers.length, catalog.helpers.length);

  for (const helper of report.helpers) {
    assert.equal(helper.importability.module_spec_found, true, helper.helper_id);
    assert.equal(helper.entrypoint.matches_pyproject, true, helper.helper_id);
    assert.equal(Array.isArray(helper.optional_dependencies.summary), true, helper.helper_id);
    if (helper.helper_id === 'ppt_deck_native') {
      assert.equal(helper.renderer_availability.linux_native_proof.renderer_kind, 'libreoffice_headless');
      assert.equal(helper.renderer_availability.linux_native_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
      assert.equal(helper.renderer_availability.desktop_app_fallback_allowed, false);
    } else {
      assert.equal(helper.renderer_availability, null);
    }
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
  assert.equal(nativeHelper.engine_capabilities.true_render_proof_renderer, 'libreoffice_headless');
  assert.equal(nativeHelper.true_render_proof.required, true);
  assert.equal(nativeHelper.true_render_proof.renderer_kind, 'libreoffice_headless');
  assert.equal(nativeHelper.true_render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(nativeHelper.true_render_proof.runtime, 'libreoffice_headless');
  assert.equal(nativeHelper.true_render_proof.cross_platform_render_required, true);
  assert.equal(nativeHelper.true_render_proof.synthetic_preview_allowed, false);
  assert.equal(nativeHelper.renderer_availability.executes_generation, false);
  assert.equal(nativeHelper.renderer_availability.executes_review_export_gates, false);
  assert.equal(nativeHelper.renderer_availability.desktop_app_fallback_allowed, false);
  assert.equal(
    nativeHelper.renderer_availability.dependency_install.automatic_installer,
    'tools/native-ppt-proof/install-deps.sh',
  );
});

test('Fast and meta diagnostic coverage does not invoke the native PPT renderer', () => {
  const registrySource = readFileSync(path.resolve('scripts/test-registry.ts'), 'utf-8');
  const doctor = readFileSync(path.resolve('python/redcube_ai/native_helpers/doctor.py'), 'utf-8');
  const rendererDependencies = readFileSync(path.resolve('python/redcube_ai/native_helpers/renderer_dependencies.py'), 'utf-8');

  assert.match(registrySource, /tests\/python-native-helper-catalog\.test\.ts/);
  assert.doesNotMatch(registrySource, /redcube-ppt-deck-native|ppt_deck_native\.py|tools\/native-ppt-proof|libreoffice|soffice|pdftoppm/);
  assert.doesNotMatch(doctor, /subprocess|run\(|Popen/);
  assert.doesNotMatch(rendererDependencies, /subprocess|run\(|Popen/);
  assert.match(rendererDependencies, /shutil\.which/);
});

test('Python helper catalog has retired compatibility wrapper scripts', () => {
  const catalog = readJson(CATALOG_FILE);
  const proofLane = readJson(PROOF_LANE_FILE);

  for (const helper of catalog.helpers) {
    assert.equal(Object.hasOwn(helper, 'script'), false, helper.helper_id);
    assert.equal(helper.preferred_invocation.kind, 'package_module', helper.helper_id);
    assert.deepEqual(helper.preferred_invocation.argv, ['-m', helper.package_module], helper.helper_id);
  }

  const runtimeExecutorProof = proofLane.candidate_route_model.runtime_executor_proof;

  assert.equal(runtimeExecutorProof.native_writer_package_module, NATIVE_PPT_PACKAGE_MODULE);
  assert.equal(
    runtimeExecutorProof.native_writer_module_command,
    `python -m ${NATIVE_PPT_PACKAGE_MODULE}`,
  );
  assert.equal(Object.hasOwn(runtimeExecutorProof, 'native_writer'), false);
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
  assert.match(combinedSource, /'-m',\s*DEFAULT_AGENT_LOOP_MODULE/);
  assert.match(combinedSource, /python-native-helper-catalog\.json/);

  for (const helper of readJson(CATALOG_FILE).helpers) {
    const source = combinedSource.includes(helper.helper_id);
    assert.equal(source, true, `${helper.helper_id} must be resolved from the helper catalog by id`);
  }
});

test('Runtime and test proof callers do not prefer ppt deck wrapper scripts', () => {
  const testProofSource = TEST_PYTHON_PROOF_CALLER_FILES
    .map((file) => readImplementation(file))
    .join('\n');
  const wrapperInvocationPathPattern = new RegExp(
    ['path\\.resolve\\([\'"]packages/redcube-runtime/scripts/', 'ppt_deck_[a-z_]+', '\\.py[\'"]\\)'].join(''),
  );

  assert.doesNotMatch(testProofSource, wrapperInvocationPathPattern);
  assert.match(testProofSource, /redcube_ai\.native_helpers\.ppt_deck\.review/);
  assert.match(testProofSource, /'-m',\s*PPT_DECK_REVIEW_MODULE/);
  assert.match(testProofSource, /PYTHONPATH/);
});

test('Retired wrapper script invocation shape has no active callers or contract anchors', () => {
  const activeRoots = ['apps', 'packages', 'contracts', 'scripts', 'tests', 'tools', 'python'];
  const textExtensions = new Set(['.json', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.py', '.sh', '.yaml', '.yml']);
  const activeWrapperInvocationPatterns = [
    /packages\/redcube-runtime\/scripts\/ppt_deck_[a-z_]+\.py/,
    /python\/redcube_ai\/hermes\/agent_loop_bridge\.py/,
    /compatibility_script/i,
    /compatibilityScript/,
  ];
  const listFiles = (root) => {
    if (!existsSync(path.resolve(root))) return [];
    return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(root, entry.name);
      if (entry.isDirectory()) {
        if (['dist', 'build', 'node_modules'].includes(entry.name)) return [];
        return listFiles(file);
      }
      return entry.isFile() && textExtensions.has(path.extname(entry.name)) ? [file] : [];
    });
  };

  assert.equal(existsSync(path.resolve('packages/redcube-runtime/scripts')), false);

  const violations = [];
  for (const file of activeRoots.flatMap(listFiles)) {
    const normalized = file.split(path.sep).join('/');
    if (normalized === 'tests/python-native-helper-catalog.test.ts') continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of activeWrapperInvocationPatterns) {
      if (pattern.test(text)) {
        violations.push(`${normalized}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('Hermes-Agent loop client defaults to the package module bridge', () => {
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

  const probe = probeHermesAgentLoop({
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      REDCUBE_HERMES_AGENT_LOOP_PYTHON_COMMAND: mockPython,
      REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND: '',
    },
  });

  assert.equal(probe.ok, true, probe.blocking_reason);
  const argv = JSON.parse(readFileSync(argvFile, 'utf-8'));
  assert.deepEqual(argv.slice(0, 2), ['-m', 'redcube_ai.hermes.agent_loop_bridge_impl']);
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
  assert.equal(helpers.ppt_deck_native.engine_capabilities.true_render_proof_renderer, 'libreoffice_headless');
  assert.equal(helpers.ppt_deck_native.true_render_proof.renderer_kind, 'libreoffice_headless');
  assert.equal(helpers.ppt_deck_native.true_render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(helpers.ppt_deck_native.true_render_proof.runtime, 'libreoffice_headless');
  assert.equal(helpers.ppt_deck_native.true_render_proof.cross_platform_render_required, true);
  assert.deepEqual(helpers.ppt_deck_native.requires, ['Pillow', 'python-pptx', 'LibreOffice headless']);
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

  assert.deepEqual(helpers.hermes_agent_loop_bridge.routes, []);
  assert.deepEqual(helpers.hermes_agent_loop_bridge.gates, []);
  assert.deepEqual(helpers.hermes_agent_loop_bridge.requires, ['upstream-hermes-agent-local']);
});
