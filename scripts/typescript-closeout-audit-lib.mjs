import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { resolveRuntimeStatePath } from '../packages/redcube-runtime/src/runtime-state.js';

export const AUDIT_FILE = resolveRuntimeStatePath('reports', 'redcube-runtime-program', 'P18_TYPESCRIPT_CLOSEOUT_AUDIT.json');

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
  'packages/redcube-codex-cli-client': ['src/index.js'],
  'packages/redcube-config': [
    'src/index.js',
    'src/private-profile.js',
    'src/xiaohongshu-author-profile.js',
  ],
  'packages/redcube-gateway': [
    'src/actions/apply-review-mutation.js',
    'src/actions/audit-deliverable.js',
    'src/actions/create-deliverable.js',
    'src/actions/doctor-workspace.js',
    'src/actions/domain-entry-contract.js',
    'src/actions/execute-source-augmentation.js',
    'src/actions/family-orchestration-companion.js',
    'src/actions/get-deliverable.js',
    'src/actions/get-managed-run.js',
    'src/actions/get-overlay-catalog.js',
    'src/actions/get-product-entry-manifest.js',
    'src/actions/get-product-entry-session.js',
    'src/actions/get-product-frontdesk.js',
    'src/actions/get-product-preflight.js',
    'src/actions/get-product-start.js',
    'src/actions/get-publication-projection.js',
    'src/actions/get-review-state.js',
    'src/actions/get-run.js',
    'src/actions/import-legacy-project.js',
    'src/actions/intake-source.js',
    'src/actions/invoke-domain-entry.js',
    'src/actions/invoke-federated-product-entry.js',
    'src/actions/invoke-product-entry.js',
    'src/actions/list-topics.js',
    'src/actions/ops-eval-summary.js',
    'src/actions/prepare-source-augmentation-result.js',
    'src/actions/prepare-source-augmentation.js',
    'src/actions/product-entry-continuity-surfaces.js',
    'src/actions/review-render-output.js',
    'src/actions/run-deliverable-route.js',
    'src/actions/run-managed-deliverable.js',
    'src/actions/run-source-first-fanout.js',
    'src/actions/runtime-watch.js',
    'src/actions/source-research.js',
    'src/actions/supervise-managed-run.js',
    'src/actions/write-source-augmentation-result.js',
    'src/index.js',
  ],
  'packages/redcube-governance': [
    'src/governance-surface.js',
    'src/index.js',
    'src/review-state.js',
    'src/reviews.js',
  ],
  'packages/redcube-hermes-substrate': [
    'src/hermes-native-proof-client.js',
    'src/index.js',
  ],
  'packages/redcube-llm': ['src/index.js'],
  'packages/redcube-overlay-core': [
    'src/contracts.js',
    'src/index.js',
    'src/registry.js',
  ],
  'packages/redcube-overlay-poster-onepager': [
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
  'packages/redcube-overlay-registry': ['src/index.js'],
  'packages/redcube-overlay-xiaohongshu': [
    'src/contracts.js',
    'src/gates.js',
    'src/index.js',
    'src/surface.js',
  ],
  'packages/redcube-reference-os': [
    'src/index.js',
    'src/reference-samples.js',
    'src/relative-quality.js',
  ],
  'packages/redcube-runtime': [
    'src/candidate-racing.js',
    'src/creative-ownership.js',
    'src/deliverable-route-local.js',
    'src/deliverable-routes.js',
    'src/executors.js',
    'src/index.js',
    'src/managed-dag-scheduler.js',
    'src/managed-deliverable.js',
    'src/managed-event-log.js',
    'src/managed-run-store.js',
    'src/product-entry-session-store.js',
    'src/runtime-state.js',
    'src/shared-source-truth.js',
    'src/source-augmentation-execution.js',
    'src/source-augmentation-executor.js',
    'src/source-augmentation-request.js',
    'src/source-augmentation-result.js',
    'src/source-intake.js',
    'src/source-readiness-pack.js',
    'src/source-research.js',
  ],
  'packages/redcube-runtime-family-poster-onepager': [
    'src/index.js',
    'src/poster-onepager-runtime-parts/authoring.js',
    'src/poster-onepager-runtime-parts/core.js',
    'src/poster-onepager-runtime-parts/review-helpers.js',
    'src/poster-onepager-runtime.js',
  ],
  'packages/redcube-runtime-family-ppt': [
    'src/index.js',
    'src/ppt-deck-runtime-family-parts/authoring.js',
    'src/ppt-deck-runtime-family-parts/core-helpers.js',
    'src/ppt-deck-runtime-family-parts/core.js',
    'src/ppt-deck-runtime-family-parts/export.js',
    'src/ppt-deck-runtime-family-parts/index.js',
    'src/ppt-deck-runtime-family-parts/native-ppt.js',
    'src/ppt-deck-runtime-family-parts/render-batch-cache.js',
    'src/ppt-deck-runtime-family-parts/render.js',
    'src/ppt-deck-runtime-family-parts/stages.js',
    'src/ppt-deck-runtime-family-parts/surface.js',
    'src/ppt-deck-runtime.js',
    'src/ppt-structured-artifact-builders.js',
  ],
  'packages/redcube-runtime-family-registry': ['src/index.js'],
  'packages/redcube-runtime-family-xiaohongshu': [
    'src/index.js',
    'src/xiaohongshu-runtime-family-parts/authoring.js',
    'src/xiaohongshu-runtime-family-parts/delivery.js',
    'src/xiaohongshu-runtime-family-parts/index.js',
    'src/xiaohongshu-runtime-family-parts/render.js',
    'src/xiaohongshu-runtime-family-parts/review.js',
    'src/xiaohongshu-runtime-family-parts/shared.js',
    'src/xiaohongshu-runtime-family-parts/support.js',
    'src/xiaohongshu-runtime.js',
  ],
  'packages/redcube-runtime-protocol': [
    'src/index.js',
    'src/managed-runs.js',
    'src/python-command.js',
    'src/runs.js',
    'src/source-augmentation-contract.js',
    'src/source-readiness-summary.js',
    'src/source-truth.js',
    'src/workspace.js',
  ],
  'packages/redcube-tools': ['src/index.js'],
};

const JS_RESIDUE_SCAN_ROOTS = ['apps', 'packages'];
const DEFAULT_JS_EXCEPTION_REGISTRATION = Object.freeze({
  owner: 'redcube-ai-maintainers',
  reason: 'pre-existing JavaScript implementation residue retained during staged TypeScript migration',
  migration_window: 'dedicated package-level TypeScript conversion tranche',
});

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function readText(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function listSourceFiles(directory, extension) {
  const sourceDir = path.resolve(directory, 'src');
  if (!existsSync(sourceDir)) return [];

  const files = [];
  function visit(currentDirectory) {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const fullPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(path.relative(path.resolve(directory), fullPath).split(path.sep).join('/'));
      }
    }
  }

  visit(sourceDir);
  return files.sort();
}

function listResidueDirectories() {
  const directories = new Set(Object.keys(JS_RESIDUE_ALLOWLIST));
  for (const root of JS_RESIDUE_SCAN_ROOTS) {
    const rootPath = path.resolve(root);
    if (!existsSync(rootPath)) continue;

    for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = path.posix.join(root, entry.name);
      if (existsSync(path.resolve(directory, 'src'))) {
        directories.add(directory);
      }
    }
  }

  return [...directories].sort();
}

function fileDifference(files, baseline) {
  const baselineFiles = new Set(baseline);
  return files.filter((file) => !baselineFiles.has(file));
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
  return listResidueDirectories().map((directory) => {
    const expectedFiles = [...(JS_RESIDUE_ALLOWLIST[directory] ?? [])].sort();
    const actualFiles = listSourceFiles(directory, '.js');
    const unexpectedFiles = fileDifference(actualFiles, expectedFiles);
    const missingFiles = fileDifference(expectedFiles, actualFiles);

    return {
      directory,
      exception_registration: DEFAULT_JS_EXCEPTION_REGISTRATION,
      expected_js_files: expectedFiles,
      actual_js_files: actualFiles,
      unexpected_js_files: unexpectedFiles,
      missing_js_files: missingFiles,
      explicit_residue_only: unexpectedFiles.length === 0 && missingFiles.length === 0,
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

function defaultQualityGates() {
  return {
    typecheck: {
      command: 'rtk npm run typecheck',
      status: 'pending_external_verification',
      exit_code: null,
    },
    full_test_suite: {
      command: 'rtk npm run test:full -- --test-reporter=dot',
      status: 'pending_external_verification',
      exit_code: null,
    },
    diagnostics: {
      command: 'npx tsc --noEmit --pretty false --project tsconfig.json',
      status: 'pending_external_verification',
      exit_code: null,
    },
  };
}

export function buildCloseoutAudit(options = {}) {
  const qualityGates = options.qualityGates ?? defaultQualityGates();
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
    audit_command: rootPackage.scripts['audit:typescript-closeout'] ?? null,
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
      quality_gates_green: Object.values(qualityGates).every((gate) => gate.status === 'pass' && gate.exit_code === 0),
    },
    evidence: {
      contract_surfaces: contractSurfaces,
      service_boundaries: serviceBoundaries,
      high_churn_packages: highChurnPackages,
      js_residue_inventory: residueInventory,
    },
    quality_gates: qualityGates,
  };

  audit.criteria.closeout_ready = Object.values(audit.criteria).every(Boolean);
  return audit;
}

export function writeAuditFile(audit) {
  mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  writeFileSync(AUDIT_FILE, `${JSON.stringify(audit, null, 2)}\n`, 'utf-8');
}
