// @ts-nocheck
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { resolveRuntimeStatePath } from '../packages/redcube-runtime/src/runtime-state.ts';
import { rootPartitionFiles } from './test-registry.ts';

export const AUDIT_FILE = resolveRuntimeStatePath('reports', 'redcube-runtime-program', 'P18_TYPESCRIPT_CLOSEOUT_AUDIT.json');
export const JS_RESIDUE_LINE_LOCK_FILE = 'contracts/runtime-program/js-residue-line-lock.json';

const CONTRACT_SURFACES = [
  'packages/redcube-runtime-protocol',
  'packages/redcube-domain-entry',
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

const UTILITY_BOUNDARIES = [
  'packages/redcube-config',
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

const JS_RESIDUE_SCAN_ROOTS = ['apps', 'packages'];
const LANGUAGE_TARGET = Object.freeze({
  primary_implementation_languages: ['TypeScript', 'Python'],
  default_new_runtime_code: 'TypeScript',
  native_helper_language: 'Python',
  javascript_policy: 'repo_tracked_javascript_retired',
  test_language_policy: 'new_tests_default_to_typescript',
  script_language_policy: 'new_scripts_default_to_typescript',
  agent_guidance: [
    'New product/runtime contracts, CLI/MCP surfaces, domain actions, packages, and tests should land as TypeScript.',
    'New Office/PPT/document automation helpers should land in Python-owned helper surfaces.',
    'Repo-tracked product, test, and script JavaScript is retired.',
    'New JavaScript under apps/*, packages/*, tests/*, or scripts/* is blocked before merge.',
  ],
});

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function readText(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readPackageName(directory) {
  const packageFile = path.resolve(directory, 'package.json');
  if (!existsSync(packageFile)) return null;
  return readJson(packageFile).name ?? null;
}

function countLines(content) {
  if (content.length === 0) return 0;
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
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

function listFilesUnder(directory, predicate) {
  const root = path.resolve(directory);
  if (!existsSync(root)) return [];

  const files = [];
  function visit(currentDirectory) {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const fullPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && predicate(fullPath)) {
        files.push(path.relative(path.resolve(), fullPath).split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return files.sort();
}

function readRegisteredRootTestFiles() {
  return rootPartitionFiles().sort();
}

function languageSurfaceAudit() {
  const registeredRootTests = readRegisteredRootTestFiles();
  const actualTestJs = listFilesUnder('tests', (file) => (
    file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')
  ));
  const actualTestTs = listFilesUnder('tests', (file) => file.endsWith('.ts'));
  const actualScriptJs = listFilesUnder('scripts', (file) => (
    file.endsWith('.mjs') || file.endsWith('.js') || file.endsWith('.cjs')
  ));
  const actualScriptTs = listFilesUnder('scripts', (file) => file.endsWith('.ts'));

  const tests = {
    scan_glob: 'tests/**/*.{js,mjs,cjs,ts}',
    allowed_new_extension: '.test.ts',
    registered_ts_files: registeredRootTests.filter((file) => file.endsWith('.ts')),
    actual_js_files: actualTestJs,
    actual_ts_files: actualTestTs,
    forbidden_js_files: actualTestJs,
  };
  const scripts = {
    scan_glob: 'scripts/**/*.{js,mjs,cjs,ts}',
    allowed_new_extension: '.ts',
    actual_js_files: actualScriptJs,
    actual_ts_files: actualScriptTs,
    forbidden_js_files: actualScriptJs,
  };
  const closed = tests.forbidden_js_files.length === 0
    && scripts.forbidden_js_files.length === 0;

  return {
    status: closed ? 'closed' : 'open',
    policy: 'Repo-tracked tests and scripts are TypeScript-only; JavaScript is blocked.',
    tests,
    scripts,
  };
}

function listResidueDirectories() {
  const directories = new Set();
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

function classifyResidueFiles(actualFiles) {
  return actualFiles.map((file) => ({
    file,
    status: 'forbidden_js_source',
  }));
}

function packageAudit(directory, rootTsconfig) {
  const pkg = readJson(path.join(directory, 'package.json'));
  const tsconfig = readJson(path.join(directory, 'tsconfig.json'));
  const expectedReference = `./${directory}`;

  return {
    directory,
    package_name: pkg.name,
    types_entry: pkg.types === './src/index.ts' || pkg.types === './dist/index.d.ts',
    has_index_ts: existsSync(path.resolve(directory, 'src/index.ts')),
    has_types_ts: existsSync(path.resolve(directory, 'src/types.ts')),
    has_tsconfig: existsSync(path.resolve(directory, 'tsconfig.json')),
    extends_root_tsconfig: tsconfig.extends === '../../tsconfig.base.json'
      || tsconfig.extends === '../../tsconfig.package-build.json',
    in_root_type_graph: rootTsconfig.references.some((entry) => entry.path === expectedReference),
  };
}

function residueAudit() {
  return listResidueDirectories().map((directory) => {
    const actualFiles = listSourceFiles(directory, '.js');
    const residueClassification = classifyResidueFiles(actualFiles);

    return {
      directory,
      package_name: readPackageName(directory),
      actual_js_files: actualFiles,
      forbidden_js_files: actualFiles,
      residue_classification: residueClassification,
      zero_js_source: actualFiles.length === 0,
    };
  });
}

function residueLineLockAudit(residueInventory = residueAudit()) {
  const lock = readJson(JS_RESIDUE_LINE_LOCK_FILE);
  const lockedLineCounts = lock.line_counts || {};
  const entries = [];

  for (const residue of residueInventory) {
    for (const file of residue.actual_js_files) {
      const relativePath = `${residue.directory}/${file}`;
      const actualLineCount = countLines(readText(relativePath));
      const lockedLineCount = lockedLineCounts[relativePath];
      const lineGrowth = typeof lockedLineCount === 'number'
        ? actualLineCount - lockedLineCount
        : null;
      entries.push({
        file: relativePath,
        locked_line_count: lockedLineCount ?? null,
        actual_line_count: actualLineCount,
        line_growth: lineGrowth,
        within_lock: typeof lockedLineCount === 'number' && actualLineCount <= lockedLineCount,
      });
    }
  }

  return {
    contract_file: JS_RESIDUE_LINE_LOCK_FILE,
    policy: lock.policy,
    max_js_file_count: lock.max_js_file_count ?? null,
    max_actual_js_line_count: lock.max_actual_js_line_count ?? null,
    entries,
  };
}

function residueSummary(residueInventory, residueLineLock) {
  const lineCountsByDirectory = new Map();
  for (const entry of residueLineLock.entries) {
    const directory = entry.file.split('/src/')[0];
    lineCountsByDirectory.set(
      directory,
      (lineCountsByDirectory.get(directory) ?? 0) + entry.actual_line_count,
    );
  }

  const byDirectory = residueInventory
    .filter((entry) => entry.actual_js_files.length > 0)
    .map((entry) => ({
      directory: entry.directory,
      package_name: entry.package_name,
      forbidden_js_file_count: entry.forbidden_js_files.length,
      actual_js_line_count: lineCountsByDirectory.get(entry.directory) ?? 0,
      forbidden_js_files: entry.forbidden_js_files,
    }));

  return {
    policy: 'TypeScript/Python-first; product source JavaScript is retired.',
    blocked_residue_statuses: ['forbidden_js_source'],
    line_lock_contract_file: JS_RESIDUE_LINE_LOCK_FILE,
    totals: {
      scanned_directories: residueInventory.length,
      directories_with_js_residue: byDirectory.length,
      forbidden_js_file_count: byDirectory.reduce((sum, entry) => sum + entry.forbidden_js_file_count, 0),
      actual_js_line_count: byDirectory.reduce((sum, entry) => sum + entry.actual_js_line_count, 0),
    },
    by_directory: byDirectory,
  };
}

function zeroJsSourceGateAudit({ jsResidueSummary, residueLineLock }) {
  const maxJsFiles = residueLineLock.max_js_file_count;
  const maxActualLines = residueLineLock.max_actual_js_line_count;
  const actualFileCount = jsResidueSummary.totals.forbidden_js_file_count;
  const actualLineCount = jsResidueSummary.totals.actual_js_line_count;

  return {
    policy: 'Product source JavaScript must remain at zero files and zero lines.',
    max_js_file_count: maxJsFiles,
    actual_js_file_count: actualFileCount,
    actual_js_file_count_within_zero_gate:
      maxJsFiles === 0 && actualFileCount === 0,
    max_actual_js_line_count: maxActualLines,
    actual_js_line_count: actualLineCount,
    actual_js_line_count_within_zero_gate:
      maxActualLines === 0 && actualLineCount === 0,
  };
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
  const contractSurfaces = categoryAudit(CONTRACT_SURFACES, rootTsconfig);
  const serviceBoundaries = categoryAudit(SERVICE_BOUNDARIES, rootTsconfig);
  const utilityBoundaries = categoryAudit(UTILITY_BOUNDARIES, rootTsconfig);
  const highChurnPackages = categoryAudit(HIGH_CHURN_PACKAGES, rootTsconfig);
  const residueInventory = residueAudit();
  const residueLineLock = residueLineLockAudit(residueInventory);
  const jsResidueSummary = residueSummary(residueInventory, residueLineLock);
  const jsSourceZeroGate = zeroJsSourceGateAudit({
    jsResidueSummary,
    residueLineLock,
  });
  const testAndScriptLanguagePolicy = languageSurfaceAudit();

  const audit = {
    milestone: 'P18',
    phase: 'TypeScript Closeout And Harness Re-Audit',
    audit_command: rootPackage.scripts['audit:typescript-closeout'] ?? null,
    language_target: LANGUAGE_TARGET,
    criteria: {
      new_code_defaults_to_typescript:
        baseTsconfig.compilerOptions.module === 'NodeNext'
        && baseTsconfig.compilerOptions.moduleResolution === 'NodeNext'
        && rootPackage.scripts.typecheck === 'npm run --silent build && tsc --noEmit --project tsconfig.typecheck.json --pretty false',
      core_contract_surfaces_typed: contractSurfaces.every((entry) => entry.typed_boundary_ready),
      service_boundaries_typed: serviceBoundaries.every((entry) => entry.typed_boundary_ready),
      utility_boundaries_typed: utilityBoundaries.every((entry) => entry.typed_boundary_ready),
      high_churn_paths_typed: highChurnPackages.every((entry) => entry.typed_boundary_ready),
      js_source_absent: residueInventory.every((entry) => entry.zero_js_source),
      repo_tracked_js_blocked: jsResidueSummary.totals.forbidden_js_file_count === 0,
      js_residue_file_count_locked:
        jsSourceZeroGate.actual_js_file_count_within_zero_gate
        && jsSourceZeroGate.actual_js_line_count_within_zero_gate,
      js_residue_line_growth_locked: residueLineLock.entries.every((entry) => entry.within_lock),
      test_and_script_language_policy_closed: testAndScriptLanguagePolicy.status === 'closed',
      quality_gates_green: Object.values(qualityGates).every((gate) => gate.status === 'pass' && gate.exit_code === 0),
    },
    evidence: {
      contract_surfaces: contractSurfaces,
      service_boundaries: serviceBoundaries,
      utility_boundaries: utilityBoundaries,
      high_churn_packages: highChurnPackages,
      js_residue_inventory: residueInventory,
      js_residue_line_lock: residueLineLock,
      js_source_zero_gate: jsSourceZeroGate,
      js_residue_summary: jsResidueSummary,
      test_and_script_language_policy: testAndScriptLanguagePolicy,
    },
    quality_gates: qualityGates,
  };

  audit.criteria.closeout_ready = Object.values(audit.criteria).every(Boolean);
  return audit;
}

export function writeAuditFile(audit, outputFile = AUDIT_FILE) {
  mkdirSync(path.dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(audit, null, 2)}\n`, 'utf-8');
}
