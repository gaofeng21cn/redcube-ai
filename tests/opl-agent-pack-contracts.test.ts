// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildPrivatizedFunctionalModuleAuditProjection,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
} from '../packages/redcube-gateway/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const forbiddenGenericOwnerRoles = [
  'generic_scheduler_owner',
  'generic_daemon_owner',
  'generic_lifecycle_owner',
  'generic_queue_owner',
  'generic_attempt_ledger_owner',
  'generic_state_machine_runner_owner',
  'generic_cli_mcp_product_wrapper_owner',
  'generic_sidecar_owner',
  'generic_session_store_owner',
  'generic_status_workbench_owner',
  'generic_workspace_source_intake_owner',
  'generic_memory_transport_owner',
  'generic_artifact_gallery_owner',
  'generic_operator_workbench_owner',
  'generic_observability_slo_owner',
  'generic_persistence_engine_owner',
  'generic_sqlite_lifecycle_owner',
  'generic_native_helper_envelope_owner',
  'generic_review_repair_transport_owner',
  'generated_surface_owner_in_domain_repo',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function normalizeFunctionalAudit(audit) {
  return {
    surface_kind: 'functional_privatization_audit',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    consumer: 'opl',
    status: 'resolved',
    source_projection_ref: '/privatized_functional_module_audit',
    source_contract_ref: audit.contract_ref,
    read_only: audit.read_only,
    refs_only: audit.refs_only,
    functional_structure_gap_closure: audit.functional_structure_gap_closure,
    modules: audit.modules,
    authority_boundary: audit.authority_boundary,
    generated_surface_owner: 'one-person-lab',
    domain_repo_can_own_generated_surface: false,
    blockers: [],
    notes: [
      'This standard OPL audit read model is projected from the RCA privatized functional module audit.',
      'OPL ready status requires zero generic residue/blockers after normalization.',
    ],
  };
}

test('root OPL action and stage contracts stay aligned with RCA canonical metadata', () => {
  const actionMetadata = buildRedCubeActionMetadata();
  const expectedActionCatalog = {
    ...actionMetadata.family_action_catalog,
    forbidden_generic_owner_roles: forbiddenGenericOwnerRoles,
  };
  const expectedStageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: expectedActionCatalog,
  });

  assert.deepEqual(readJson('contracts/action_catalog.json'), expectedActionCatalog);
  assert.deepEqual(readJson('contracts/stage_control_plane.json'), expectedStageControlPlane);
  assert.equal(expectedActionCatalog.actions.length, 11);
  assert.deepEqual(
    expectedStageControlPlane.stages.map((stage) => stage.stage_id),
    [
      'source_intake',
      'communication_strategy',
      'visual_direction',
      'artifact_creation',
      'review_and_revision',
      'package_and_handoff',
    ],
  );
  assert.equal(expectedStageControlPlane.stage_action_parity.status, 'aligned');
});

test('root OPL functional privatization audit is ready and residue-free', () => {
  const rootAudit = readJson('contracts/functional_privatization_audit.json');
  const expectedAudit = normalizeFunctionalAudit(buildPrivatizedFunctionalModuleAuditProjection());

  assert.deepEqual(rootAudit, expectedAudit);
  assert.equal(rootAudit.surface_kind, 'functional_privatization_audit');
  assert.equal(rootAudit.status, 'resolved');
  assert.deepEqual(rootAudit.blockers, []);
  assert.equal(rootAudit.functional_structure_gap_closure.functional_structure_gap_count, 0);
  assert.equal(rootAudit.functional_structure_gap_closure.unclassified_private_generic_residue_count, 0);
  assert.equal(rootAudit.functional_structure_gap_closure.long_term_rca_generic_owner_claim_count, 0);
  assert.deepEqual(
    rootAudit.modules.reduce((counts, module) => {
      counts[module.migration_class] = (counts[module.migration_class] || 0) + 1;
      return counts;
    }, {}),
    {
      declarative_pack: 2,
      refs_only_adapter: 6,
      opl_hosted_surface: 3,
      opl_generated_surface: 3,
      minimal_authority_function: 1,
    },
  );
});

test('root OPL domain descriptor keeps generated interfaces owned by OPL', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');

  assert.equal(descriptor.surface_kind, 'domain_agent_descriptor');
  assert.equal(descriptor.domain_id, 'redcube_ai');
  assert.equal(descriptor.generated_interface_owner, 'one-person-lab');
  assert.equal(descriptor.authority_boundary.opl_owns_generated_interfaces, true);
  assert.equal(descriptor.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(descriptor.authority_boundary.opl_can_authorize_quality_or_export, false);
  assert.equal(descriptor.authority_boundary.opl_can_mutate_artifacts, false);
  assert.equal(descriptor.action_targets.cli, 'npm run --prefix <redcube-ai-repo> redcube -- ...');
  assert.deepEqual(descriptor.standard_contracts, {
    action_catalog: 'contracts/action_catalog.json',
    stage_control_plane: 'contracts/stage_control_plane.json',
    functional_privatization_audit: 'contracts/functional_privatization_audit.json',
  });
});

test('OPL generated interfaces are ready from RCA root contracts when OPL checkout is available', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const oplRoot = path.dirname(path.dirname(oplBin));
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: oplRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.status, 'ready');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.deepEqual(bundle.blocker_reasons, []);
  assert.equal(bundle.cli.status, 'ready');
  assert.equal(bundle.mcp.status, 'ready');
  assert.equal(bundle.skill.status, 'ready');
  assert.equal(bundle.product_entry.status, 'ready');
  assert.equal(bundle.stage_routes.length, 6);
});

test('OPL standard scaffold validation passes for RCA root contracts when OPL checkout is available', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const oplRoot = path.dirname(path.dirname(oplBin));
  const result = spawnSync(oplBin, [
    'agents',
    'scaffold',
    '--validate',
    repoRoot,
    '--json',
  ], {
    cwd: oplRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const validation = payload.standard_domain_agent_scaffold.validation;
  assert.equal(validation.status, 'passed');
  assert.deepEqual(validation.blockers, []);
  assert.deepEqual(validation.missing_contract_files, []);
  assert.deepEqual(validation.missing_forbidden_role_guards, []);
});
