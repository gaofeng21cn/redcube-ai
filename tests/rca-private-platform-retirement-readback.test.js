import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  analyzeTypeScriptOwnerBoundaryClosure,
  analyzeTypeScriptOwnerBoundarySource,
  buildPrivatePlatformSourceGuardReadback,
} from '../scripts/check-private-platform-retirement.ts';

function assertSourceGuardSummary(payload) {
  assert.equal(payload.surface_kind, 'rca_private_platform_source_guard_summary');
  assert.equal(payload.schema_version, 2);
  assert.equal(payload.state, 'passed_repo_source_guard_only');
  assert.deepEqual(payload.failed_checks, []);
  assert.equal(payload.guard_summary.functional_structure_gap_count, 0);
  assert.equal(
    payload.guard_summary.source_ref_integrity_state,
    'repo_local_source_refs_declared_no_second_truth',
  );
  assert.equal(payload.guard_summary.tail_surface_count, 0);
  assert.equal(payload.guard_summary.current_non_tail_surface_count, 5);
  assert.equal(payload.guard_summary.retained_current_refs_only_boundary_count, 3);
  assert.equal(payload.guard_summary.cleanup_candidate_count, 0);
  assert.equal(payload.guard_summary.owner_delta_required, false);
  assert.deepEqual(payload.guard_summary.missing_evidence_ids, []);
  assert.equal(payload.guard_summary.active_source_scan.state, 'passed_active_source_no_resurrection_scan');
  assert.equal(
    payload.guard_summary.active_source_scan.behavioral_scan_policy_id,
    'rca.source_morphology.behavioral_owner_boundary_scan.v1',
  );
  assert.equal(
    payload.guard_summary.active_source_scan.typescript_ast_policy_id,
    'rca.source_morphology.product_session_owner_ast_boundary.v1',
  );
  assert.equal(payload.guard_summary.active_source_scan.resurrection_violation_count, 0);
  assert.equal(payload.guard_summary.active_source_scan.behavior_violation_count, 0);
  assert.equal(payload.guard_summary.active_source_scan.typescript_ast_violation_count, 0);
  assert.deepEqual(payload.guard_summary.active_source_scan.forbidden_construct_ids, [
    'repo_local_product_entry_companion_assembly',
    'repo_local_executor_attempt_blocker_envelope',
    'retired_get_product_start_wrapper',
    'retired_get_product_start_export',
  ]);
  assert.equal(payload.guard_summary.active_source_scan.violation_count, 0);
  assert.deepEqual(payload.guard_summary.active_source_scan.violations, []);
  assert.equal(payload.authority_boundary.readback_can_authorize_physical_delete, false);
  assert.equal(payload.authority_boundary.readback_can_claim_default_caller_cutover, false);
  assert.equal(payload.authority_boundary.readback_can_claim_visual_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_production_ready, false);
}

const AST_POLICY = {
  forbiddenModuleSpecifiers: ['fs', 'fs/promises', 'node:fs', 'node:fs/promises'],
  forbiddenPropertyNames: [
    'runtime_state_path',
    'session_file_ref',
    'session_store_root',
  ],
};

test('RCA product-session AST guard catches aliased filesystem imports after function renames', () => {
  for (const moduleSpecifier of AST_POLICY.forbiddenModuleSpecifiers) {
    const violations = analyzeTypeScriptOwnerBoundarySource({
      sourceRef: 'fixture/renamed-owner.ts',
      sourceText: `
        import { readFile as loadDomainSnapshot } from '${moduleSpecifier}';
        export function renamedDomainSnapshotOwner() { return loadDomainSnapshot('state.json'); }
      `,
      ...AST_POLICY,
    });
    assert.equal(violations.length, 1, moduleSpecifier);
    assert.equal(
      violations[0].endsWith(`forbidden_module_import:${moduleSpecifier}`),
      true,
      moduleSpecifier,
    );
  }
});

test('RCA product-session AST guard catches property syntax variants without scanning denylist strings', () => {
  const violations = analyzeTypeScriptOwnerBoundarySource({
    sourceRef: 'fixture/property-variants.ts',
    sourceText: `
      const runtime_state_path = 'state.json';
      const payload = {
        runtime_state_path,
        ['session_file_ref']: 'session-ref',
        session_store_root: 'sessions',
      };
      export function renamedAssembler() { return payload['session_file_ref']; }
    `,
    ...AST_POLICY,
  });
  assert.deepEqual(
    [...new Set(violations.map((entry) => entry.split(':').at(-1)))].sort(),
    [
      'runtime_state_path',
      'session_file_ref',
      'session_store_root',
    ],
  );
});

test('RCA product-session AST guard follows local helper imports recursively', () => {
  const violations = analyzeTypeScriptOwnerBoundaryClosure({
    entrySourceRefs: ['owner/entry.ts'],
    allowedFilesystemSourceRefs: [],
    traversalStopSourceRefs: [],
    sourceFiles: {
      'owner/entry.ts': "import { loadSession } from './helper.js'; export { loadSession };",
      'owner/helper.ts': "import { readFileSync } from 'node:fs'; export const loadSession = readFileSync;",
    },
    ...AST_POLICY,
  });
  assert.equal(violations.some((entry) => (
    entry.includes('owner/helper.ts') && entry.endsWith('forbidden_module_import:node:fs')
  )), true);
});

test('RCA product-session AST guard follows every runtime import form but skips type-only imports', () => {
  const violations = analyzeTypeScriptOwnerBoundaryClosure({
    entrySourceRefs: ['owner/entry.ts'],
    allowedFilesystemSourceRefs: [],
    traversalStopSourceRefs: [],
    sourceFiles: {
      'owner/entry.ts': `
        import './static.js';
        export { exported } from './exported.js';
        export async function dynamic() { return import('./dynamic.js'); }
        export const required = require('./required.js');
        import type { TypeOnly } from './type-only.js';
      `,
      'owner/static.ts': "import 'node:fs';",
      'owner/exported.ts': "import 'node:fs'; export const exported = true;",
      'owner/dynamic.ts': "import 'node:fs';",
      'owner/required.ts': "import 'node:fs';",
    },
    ...AST_POLICY,
  });
  assert.deepEqual(
    violations.filter((entry) => entry.endsWith('forbidden_module_import:node:fs')).map((entry) => (
      entry.split(':typescript_ast_owner_boundary:')[0].split(':')[0]
    )).sort(),
    ['owner/dynamic.ts', 'owner/exported.ts', 'owner/required.ts', 'owner/static.ts'],
  );
  assert.equal(violations.some((entry) => entry.includes('type-only')), false);
});

test('RCA product-session AST guard applies exact filesystem allow and stops traversal after scanning the boundary', () => {
  const violations = analyzeTypeScriptOwnerBoundaryClosure({
    entrySourceRefs: ['owner/entry.ts'],
    allowedFilesystemSourceRefs: ['owner/allowed.ts'],
    traversalStopSourceRefs: ['owner/stop.ts'],
    sourceFiles: {
      'owner/entry.ts': "import './allowed.js'; import './stop.js';",
      'owner/allowed.ts': "import 'node:fs'; export const payload = { runtime_state_path: 'forbidden' };",
      'owner/stop.ts': "import 'node:fs'; import './hidden.js';",
    },
    ...AST_POLICY,
  });
  assert.equal(
    violations.some((entry) => entry.includes('owner/allowed.ts') && entry.endsWith('forbidden_module_import:node:fs')),
    false,
  );
  assert.equal(
    violations.some((entry) => entry.includes('owner/allowed.ts') && entry.endsWith('forbidden_property:runtime_state_path')),
    true,
  );
  assert.equal(
    violations.some((entry) => entry.includes('owner/stop.ts') && entry.endsWith('forbidden_module_import:node:fs')),
    true,
  );
  assert.equal(violations.some((entry) => entry.includes('hidden')), false);
});

test('RCA product-session AST guard fails closed for unresolved, nonliteral, and out-of-repo imports', () => {
  const violations = analyzeTypeScriptOwnerBoundaryClosure({
    entrySourceRefs: ['owner/entry.ts'],
    allowedFilesystemSourceRefs: [],
    traversalStopSourceRefs: [],
    sourceFiles: {
      'owner/entry.ts': `
        import './missing.js';
        import '../../../outside.js';
        const target = './hidden.js';
        export const dynamic = import(target);
        export const required = require(target);
      `,
    },
    ...AST_POLICY,
  });
  for (const failureKind of [
    'local_import_unresolved:./missing.js',
    'local_import_traversal_outside_repo:../../../outside.js',
    'non_literal_dynamic_import',
    'non_literal_require',
  ]) {
    assert.equal(violations.some((entry) => entry.includes(failureKind)), true, failureKind);
  }
});

test('RCA product-session AST guard rejects a repo-local symlink that resolves outside the source root', (t) => {
  const sourceRoot = mkdtempSync(path.join(os.tmpdir(), 'rca-owner-ast-root-'));
  const outsideRoot = mkdtempSync(path.join(os.tmpdir(), 'rca-owner-ast-outside-'));
  try {
    mkdirSync(path.join(sourceRoot, 'owner'), { recursive: true });
    writeFileSync(path.join(sourceRoot, 'owner', 'entry.ts'), "import './escape.js';", 'utf-8');
    writeFileSync(path.join(outsideRoot, 'escape.ts'), "import 'node:fs';", 'utf-8');
    try {
      symlinkSync(path.join(outsideRoot, 'escape.ts'), path.join(sourceRoot, 'owner', 'escape.ts'));
    } catch (error) {
      if (error?.code === 'EPERM' || error?.code === 'EACCES') {
        t.skip(`symlink unavailable: ${error.code}`);
        return;
      }
      throw error;
    }
    const violations = analyzeTypeScriptOwnerBoundaryClosure({
      entrySourceRefs: ['owner/entry.ts'],
      allowedFilesystemSourceRefs: [],
      traversalStopSourceRefs: [],
      sourceRoot,
      ...AST_POLICY,
    });
    assert.equal(
      violations.some((entry) => entry.includes('local_import_traversal_outside_repo:./escape.js')),
      true,
    );
  } finally {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(outsideRoot, { recursive: true, force: true });
  }
});

test('RCA product-session AST guard accepts canonical OPL session fields in runtime objects', () => {
  const violations = analyzeTypeScriptOwnerBoundarySource({
    sourceRef: 'owner/generated-session-input.ts',
    sourceText: `
      export interface OplGeneratedSessionInput {
        session_file: string;
        session_store_root?: string;
      }
      export function projectDomainRefs(input: OplGeneratedSessionInput) {
        return {
          session_file: input.session_file,
          resumed_from_session: true,
          domain_snapshot_ref: 'domain-snapshot:rca/example',
        };
      }
    `,
    ...AST_POLICY,
  });
  assert.deepEqual(violations, []);
});

test('RCA no-resurrection readback is a compact source guard summary', () => {
  const payload = buildPrivatePlatformSourceGuardReadback();

  assertSourceGuardSummary(payload);
  assert.equal(
    payload.source_refs.active_source_scan_policy,
    'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate/active_source_resurrection_scan_policy',
  );
  assert.equal(
    payload.source_refs.behavioral_source_scan_policy,
    'contracts/physical_source_morphology_policy.json#/behavioral_source_scan_policy',
  );
});

test('RCA no-resurrection script emits compact parseable JSON', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      'scripts/check-private-platform-retirement.ts',
      '--format',
      'json',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.length < 20000);
  assertSourceGuardSummary(JSON.parse(result.stdout));
});
