import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';
const ENGINE_CONTRACT_FILE = 'contracts/runtime-program/ppt-native-python-engine-contract.json';
const PROOF_LANE_FILE = 'contracts/runtime-program/ppt-native-authoring-proof-lane.json';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function helperById(catalog) {
  return Object.fromEntries(catalog.helpers.map((helper) => [helper.helper_id, helper]));
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
  });
  assert.equal(existsSync(path.resolve(catalog.package.pyproject)), true);
  assert.equal(catalog.bypass_policy.generic_bypass_allowed, false);
  assert.equal(currentProgram.longrun_goal.language_target.python_native_helper_catalog, CATALOG_FILE);
  assert.equal(currentProgram.current_state.runtime_manager_status.native_helper_catalog, CATALOG_FILE);
  assert.equal(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.native_helper_catalog,
    CATALOG_FILE,
  );
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

test('Python helper modules are discoverable through python -m help without running gates', () => {
  const catalog = readJson(CATALOG_FILE);

  for (const helper of catalog.helpers) {
    const result = spawnSync('python3', ['-m', helper.package_module, '--help'], {
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

test('Compatibility wrapper scripts remain thin package entrypoints', () => {
  const catalog = readJson(CATALOG_FILE);

  for (const helper of catalog.helpers) {
    const wrapper = readFileSync(path.resolve(helper.script), 'utf-8');
    assert.match(wrapper, new RegExp(`from ${helper.package_module.replaceAll('.', '\\.')} import main`), helper.helper_id);
    assert.match(wrapper, /if __name__ == ['"]__main__['"]:/, helper.helper_id);
  }
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
