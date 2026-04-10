import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';

const AUDIT_FILE = path.resolve('.omx/reports/redcube-runtime-program/P18_TYPESCRIPT_CLOSEOUT_AUDIT.json');

const CONTRACT_SURFACES = [
  'packages/redcube-runtime-protocol',
  'packages/redcube-gateway',
  'packages/redcube-governance',
  'packages/redcube-reference-os',
  'packages/redcube-overlay-core',
  'packages/redcube-overlay-registry',
  'packages/redcube-overlay-xiaohongshu',
  'packages/redcube-overlay-ppt',
  'packages/redcube-overlay-poster-onepager',
];

const SERVICE_BOUNDARIES = [
  'packages/redcube-runtime',
  'packages/redcube-pack-runtime',
  'packages/redcube-runtime-family-registry',
  'apps/redcube-cli',
  'apps/redcube-mcp',
];

const HIGH_CHURN_PACKAGES = [
  'packages/redcube-pack-xiaohongshu',
  'packages/redcube-pack-ppt',
  'packages/redcube-pack-poster-onepager',
  'packages/redcube-overlay-core',
  'packages/redcube-overlay-registry',
  'packages/redcube-overlay-xiaohongshu',
  'packages/redcube-overlay-ppt',
  'packages/redcube-overlay-poster-onepager',
  'packages/redcube-runtime-family-xiaohongshu',
  'packages/redcube-runtime-family-ppt',
  'packages/redcube-runtime-family-poster-onepager',
];

const JS_RESIDUE_ALLOWLIST = {
  'apps/redcube-cli': ['src/cli.js'],
  'apps/redcube-mcp': ['src/server.js'],
  'packages/redcube-runtime-protocol': [
    'src/index.js',
    'src/managed-runs.js',
    'src/runs.js',
    'src/source-augmentation-contract.js',
    'src/source-readiness-summary.js',
    'src/source-truth.js',
    'src/workspace.js',
  ],
  'packages/redcube-gateway': ['src/index.js'],
  'packages/redcube-governance': [
    'src/index.js',
    'src/review-state.js',
    'src/reviews.js',
  ],
  'packages/redcube-reference-os': [
    'src/index.js',
    'src/reference-samples.js',
    'src/relative-quality.js',
  ],
  'packages/redcube-runtime': [
    'src/creative-ownership.js',
    'src/deliverable-routes.js',
    'src/event-log.js',
    'src/executors.js',
    'src/index.js',
    'src/managed-deliverable.js',
    'src/managed-event-log.js',
    'src/managed-run-store.js',
    'src/ppt-deck-runtime.js',
    'src/ppt-deck.js',
    'src/render-pack-compiler.js',
    'src/run-store.js',
    'src/shared-source-truth.js',
    'src/source-augmentation-execution.js',
    'src/source-augmentation-executor.js',
    'src/source-augmentation-request.js',
    'src/source-augmentation-result.js',
    'src/source-intake.js',
    'src/source-readiness-pack.js',
    'src/source-research.js',
    'src/xiaohongshu-runtime.js',
    'src/xiaohongshu.js',
  ],
  'packages/redcube-pack-runtime': ['src/index.js'],
  'packages/redcube-runtime-family-registry': ['src/index.js'],
  'packages/redcube-pack-xiaohongshu': [
    'src/index.js',
    'src/planning.js',
    'src/render-compiler.js',
  ],
  'packages/redcube-pack-ppt': [
    'src/index.js',
    'src/render-compiler.js',
  ],
  'packages/redcube-overlay-core': [
    'src/contracts.js',
    'src/index.js',
    'src/registry.js',
  ],
  'packages/redcube-overlay-registry': ['src/index.js'],
  'packages/redcube-overlay-xiaohongshu': [
    'src/contracts.js',
    'src/gates.js',
    'src/index.js',
    'src/surface.js',
  ],
  'packages/redcube-overlay-ppt': [
    'src/contracts.js',
    'src/gates.js',
    'src/index.js',
    'src/profiles.js',
    'src/surface.js',
  ],
  'packages/redcube-overlay-poster-onepager': [
    'src/contracts.js',
    'src/gates.js',
    'src/index.js',
    'src/surface.js',
  ],
  'packages/redcube-runtime-family-xiaohongshu': [
    'src/index.js',
    'src/xiaohongshu-runtime.js',
  ],
  'packages/redcube-runtime-family-ppt': [
    'src/index.js',
    'src/ppt-deck-runtime.js',
  ],
  'packages/redcube-runtime-family-poster-onepager': [
    'src/index.js',
    'src/poster-onepager-runtime.js',
  ],
  'packages/redcube-pack-poster-onepager': [
    'src/index.js',
    'src/render-compiler.js',
  ],
};

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function readText(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function listSourceFiles(directory, extension) {
  const sourceDir = path.resolve(directory, 'src');
  if (!existsSync(sourceDir)) return [];

  return readdirSync(sourceDir)
    .filter((entry) => entry.endsWith(extension))
    .filter((entry) => statSync(path.join(sourceDir, entry)).isFile())
    .map((entry) => path.posix.join('src', entry))
    .sort();
}

function packageAudit(directory, rootTsconfig) {
  const pkg = readJson(path.join(directory, 'package.json'));
  const tsconfig = readJson(path.join(directory, 'tsconfig.json'));
  const expectedReference = `./${directory}`;

  return {
    directory,
    package_name: pkg.name,
    types_entry: pkg.types === './src/index.ts',
    has_index_ts: existsSync(path.resolve(directory, 'src/index.ts')),
    has_types_ts: existsSync(path.resolve(directory, 'src/types.ts')),
    has_tsconfig: existsSync(path.resolve(directory, 'tsconfig.json')),
    extends_root_tsconfig: tsconfig.extends === '../../tsconfig.base.json',
    in_root_type_graph: rootTsconfig.references.some((entry) => entry.path === expectedReference),
  };
}

function residueAudit() {
  return Object.entries(JS_RESIDUE_ALLOWLIST).map(([directory, expectedFiles]) => {
    const actualFiles = listSourceFiles(directory, '.js');
    return {
      directory,
      expected_js_files: expectedFiles,
      actual_js_files: actualFiles,
      explicit_residue_only: actualFiles.length === expectedFiles.length
        && actualFiles.every((file, index) => file === expectedFiles[index]),
    };
  });
}

function categoryAudit(directories, rootTsconfig) {
  return directories.map((directory) => {
    const audit = packageAudit(directory, rootTsconfig);
    return {
      ...audit,
      typed_boundary_ready: audit.types_entry
        && audit.has_index_ts
        && audit.has_types_ts
        && audit.has_tsconfig
        && audit.extends_root_tsconfig
        && audit.in_root_type_graph,
    };
  });
}

function buildCloseoutAudit() {
  const rootPackage = readJson('package.json');
  const baseTsconfig = readJson('tsconfig.base.json');
  const rootTsconfig = readJson('tsconfig.json');
  const migrationPolicy = readText('docs/policies/typescript_migration_policy.md');

  const contractSurfaces = categoryAudit(CONTRACT_SURFACES, rootTsconfig);
  const serviceBoundaries = categoryAudit(SERVICE_BOUNDARIES, rootTsconfig);
  const highChurnPackages = categoryAudit(HIGH_CHURN_PACKAGES, rootTsconfig);
  const residueInventory = residueAudit();

  const audit = {
    milestone: 'P18',
    phase: 'TypeScript Closeout And Harness Re-Audit',
    criteria: {
      new_code_defaults_to_typescript:
        baseTsconfig.compilerOptions.module === 'NodeNext'
        && baseTsconfig.compilerOptions.moduleResolution === 'NodeNext'
        && rootPackage.scripts.typecheck === 'tsc --noEmit --project tsconfig.tests.json --pretty false'
        && /新代码默认使用 TypeScript/.test(migrationPolicy)
        && /typecheck 成为正式质量门/.test(migrationPolicy),
      core_contract_surfaces_typed: contractSurfaces.every((entry) => entry.typed_boundary_ready),
      service_boundaries_typed: serviceBoundaries.every((entry) => entry.typed_boundary_ready),
      high_churn_paths_typed: highChurnPackages.every((entry) => entry.typed_boundary_ready),
      js_residue_explicitly_closed_out: residueInventory.every((entry) => entry.explicit_residue_only),
    },
    evidence: {
      contract_surfaces: contractSurfaces,
      service_boundaries: serviceBoundaries,
      high_churn_packages: highChurnPackages,
      js_residue_inventory: residueInventory,
    },
    quality_gates: {
      typecheck: {
        command: 'rtk npm run typecheck',
        status: 'pending_external_verification',
      },
      full_test_suite: {
        command: 'rtk npm test -- --test-reporter=dot',
        status: 'pending_external_verification',
      },
      diagnostics: {
        command: 'npx tsc --noEmit --pretty false --project tsconfig.json',
        status: 'pending_external_verification',
      },
    },
  };

  audit.criteria.closeout_ready = Object.values(audit.criteria).every(Boolean);
  return audit;
}

function writeAuditFile(audit) {
  mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  writeFileSync(AUDIT_FILE, `${JSON.stringify(audit, null, 2)}\n`, 'utf-8');
}

test('P18 closeout audit proves structural TypeScript coverage across baseline, contracts, service boundaries, and high-churn lanes', () => {
  const audit = buildCloseoutAudit();

  assert.equal(audit.criteria.new_code_defaults_to_typescript, true);
  assert.equal(audit.criteria.core_contract_surfaces_typed, true);
  assert.equal(audit.criteria.service_boundaries_typed, true);
  assert.equal(audit.criteria.high_churn_paths_typed, true);
});

test('P18 closeout audit keeps JS residue explicit instead of silently drifting', () => {
  const audit = buildCloseoutAudit();

  assert.equal(audit.criteria.js_residue_explicitly_closed_out, true);
  for (const residue of audit.evidence.js_residue_inventory) {
    assert.deepEqual(
      residue.actual_js_files,
      residue.expected_js_files,
      residue.directory,
    );
  }
});

test('P18 closeout audit emits a machine-readable JSON artifact', () => {
  const audit = buildCloseoutAudit();
  writeAuditFile(audit);

  assert.equal(existsSync(AUDIT_FILE), true);
  assert.equal(readJson(AUDIT_FILE).criteria.closeout_ready, true);
});
