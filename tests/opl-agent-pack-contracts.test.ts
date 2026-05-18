// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildFamilyDomainMemoryDescriptor,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-gateway/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function jsonStable(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildCanonicalPack() {
  const actionCatalog = buildRedCubeActionMetadata().family_action_catalog;
  const stageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionCatalog,
  });
  const skeleton = buildStandardDomainAgentSkeleton({
    workspaceRoot: '<workspace_root>',
    runtime: {
      runtime_owner: 'codex_cli',
      runtime_state_root: '<runtime_state_root>',
      session_store_root: '<session_store_root>',
    },
    productEntrySessionCommand: 'redcube product session --entry-session-id <entry-session-id>',
  });
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const functionalAudit = buildPrivatizedFunctionalModuleAuditProjection();
  const generatedSurfaceIds = [
    ...OPL_GENERATED_INTERFACE_CONSUMPTION.generated_descriptor_scope,
    'functional_harness_cases',
  ];

  return jsonStable({
    actionCatalog: {
      ...actionCatalog,
      forbidden_generic_owner_roles: readJson('contracts/action_catalog.json').forbidden_generic_owner_roles,
      generated_surface_owner: 'one-person-lab',
      domain_repo_can_own_generated_surface: false,
    },
    stageControlPlane,
    memoryDescriptor: {
      ...buildFamilyDomainMemoryDescriptor({
        domainMemoryDescriptorLocator: skeleton.domain_memory_descriptor_locator,
      }),
      root_contract_role: 'opl_standard_domain_agent_memory_descriptor',
      memory_body_owner: 'redcube_ai',
      opl_projection_policy: 'locator_and_receipt_refs_only',
    },
    artifactLocatorContract: skeleton.artifact_locator_contract,
    ownerReceiptContract: skeleton.domain_owner_receipt_contract,
    packCompilerInput: {
      surface_kind: 'opl_domain_pack_compiler_input',
      schema_version: 1,
      domain_id: 'redcube_ai',
      domain_pack_owner: 'redcube_ai',
      generated_surface_owner: 'one-person-lab',
      declarative_domain_pack: visualPackCompilerHandoff.declarative_visual_pack_input.required_input_families,
      minimal_authority_functions: visualPackCompilerHandoff.minimal_authority_function_contract.allowed_functions,
      generated_surfaces_requested: generatedSurfaceIds,
      generated_interface_consumption_ref: '/opl_generated_interface_consumption',
      repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
      repo_local_handlers_are_generated_surface_owners: false,
      domain_repo_can_own_generated_surface: false,
      source_refs: {
        action_catalog: 'packages/redcube-gateway/src/actions/family-action-catalog.ts::buildRedCubeActionMetadata',
        stage_control_plane: 'packages/redcube-gateway/src/actions/family-stage-control-plane.ts::buildRedCubeFamilyStageControlPlane',
        memory_descriptor: 'packages/redcube-gateway/src/actions/standard-domain-agent-skeleton.ts::buildFamilyDomainMemoryDescriptor',
        functional_audit: 'packages/redcube-gateway/src/actions/product-sidecar-guarded-actions.ts::buildPrivatizedFunctionalModuleAuditProjection',
      },
      authority_boundary: {
        opl_can_write_domain_truth: false,
        opl_can_write_memory_body: false,
        opl_can_authorize_quality_or_export: false,
        domain_can_claim_generated_surface_owner: false,
      },
    },
    functionalAudit: {
      surface_kind: 'functional_privatization_audit',
      schema_version: 1,
      domain_id: 'redcube_ai',
      target_domain_id: 'redcube_ai',
      privatized_functional_module_audit: functionalAudit,
      opl_generated_interface_consumption: OPL_GENERATED_INTERFACE_CONSUMPTION,
      functional_structure_gap_closure: functionalAudit.functional_structure_gap_closure,
      authority_boundary: {
        opl_can_write_domain_truth: false,
        opl_can_write_memory_body: false,
        opl_can_authorize_quality_or_export: false,
        domain_can_claim_generic_runtime_owner: false,
        domain_repo_can_own_generated_surface: false,
      },
    },
  });
}

test('root OPL pack contracts stay aligned with RCA canonical metadata', () => {
  const canonical = buildCanonicalPack();

  assert.deepEqual(readJson('contracts/action_catalog.json'), canonical.actionCatalog);
  assert.deepEqual(readJson('contracts/stage_control_plane.json'), canonical.stageControlPlane);
  assert.deepEqual(readJson('contracts/memory_descriptor.json'), canonical.memoryDescriptor);
  assert.deepEqual(readJson('contracts/artifact_locator_contract.json'), canonical.artifactLocatorContract);
  assert.deepEqual(readJson('contracts/owner_receipt_contract.json'), canonical.ownerReceiptContract);
  assert.deepEqual(readJson('contracts/pack_compiler_input.json'), canonical.packCompilerInput);
  assert.deepEqual(readJson('contracts/functional_privatization_audit.json'), canonical.functionalAudit);
});

test('RCA root generated surface handoff names OPL as owner for skill, product status, and session metadata', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const functionalAudit = readJson('contracts/functional_privatization_audit.json');
  const generatedScope = functionalAudit
    .privatized_functional_module_audit
    .generated_interface_consumption
    .generated_descriptor_scope;
  const requestedSurfaces = packCompilerInput.generated_surfaces_requested;
  const handoffSurfaceIds = generatedSurfaceHandoff.generated_surfaces.map((surface) => surface.surface_id);

  for (const surfaceId of generatedScope) {
    assert.equal(requestedSurfaces.includes(surfaceId), true, surfaceId);
    assert.equal(handoffSurfaceIds.includes(surfaceId), true, surfaceId);
  }
  for (const surface of generatedSurfaceHandoff.generated_surfaces) {
    assert.equal(surface.owner, 'one-person-lab', surface.surface_id);
    assert.equal(surface.domain_repo_can_own_generated_surface, false, surface.surface_id);
  }
  assert.equal(
    generatedSurfaceHandoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner,
    'one-person-lab',
  );
  assert.equal(
    generatedSurfaceHandoff.repo_local_launcher_policy.default_generic_dispatch_owner,
    'one-person-lab',
  );
  assert.equal(
    generatedSurfaceHandoff.repo_local_launcher_policy.product_sidecar_role,
    'domain_action_target_or_refs_only_adapter',
  );
  assert.equal(
    generatedSurfaceHandoff.repo_local_launcher_policy.default_supervision_owner,
    'one-person-lab',
  );
  assert.equal(
    generatedSurfaceHandoff.repo_local_launcher_policy.legacy_supervision_public_surface,
    'retired',
  );
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.gate_id, 'rca.generated_surface_bridge_exit.v1');
  assert.equal(
    generatedSurfaceHandoff.bridge_exit_gate.current_rca_status,
    'opl_generated_surface_consumed_domain_handlers_only',
  );
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.required_before_retiring_repo_local_wrappers, [
    'domain_authority_refs_preserved',
    'no_regression_proof_recorded',
  ]);
  assert.equal(
    generatedSurfaceHandoff.bridge_exit_gate.repo_local_forbidden_roles.includes('generic_session_shell_owner'),
    true,
  );
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.rca_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_generated_surface_consumption_complete, true);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_production_consumption_complete, true);
  assert.equal(
    generatedSurfaceHandoff.bridge_exit_gate.production_consumption_scope,
    'opl_generated_surface_consumption_only_not_visual_stage_live_soak',
  );
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_visual_stage_long_soak_complete, false);
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.remaining_blocker_ids, []);
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.remaining_evidence_gate_ids, [
    'real_artifact_producing_domain_owner_receipt',
    'opl_hosted_controlled_visual_stage_long_soak',
    'real_memory_lifecycle_receipt_instances',
    'cross_family_repeated_no_regression_evidence',
  ]);
});

test('RCA bridge residue exposes exit gates without claiming generic ownership', () => {
  const rootAudit = readJson('contracts/functional_privatization_audit.json').privatized_functional_module_audit;
  const current = readJson('contracts/runtime-program/current-program.json');
  const adoption = readJson('contracts/runtime-program/opl-family-contract-adoption.json');
  const surfaces = [
    rootAudit,
    current.product_release_metadata.privatized_functional_module_audit,
    current.current_state.privatized_functional_module_audit,
    current.current_state.active_baton.scope.privatized_functional_module_audit,
    adoption.privatized_functional_module_audit,
  ];

  for (const surface of surfaces) {
    assert.equal(surface.bridge_exit_gate.gate_id, 'rca.private_generic_residue_bridge_exit.v1');
    assert.deepEqual(surface.bridge_exit_gate.required_before_retiring_remaining_repo_local_bridges, [
      'domain_authority_refs_preserved',
      'no_regression_proof_recorded',
    ]);
    assert.equal(surface.bridge_exit_gate.remaining_bridge_module_ids.includes('generic_cli_mcp_wrappers'), true);
    assert.equal(surface.bridge_exit_gate.forbidden_after_exit_rca_surface_classes.includes('generic_session_shell'), true);
    assert.equal(surface.bridge_exit_gate.declares_generated_surface_consumption_complete, true);
    assert.equal(surface.bridge_exit_gate.declares_production_consumption_complete, true);
    assert.equal(
      surface.bridge_exit_gate.production_consumption_scope,
      'opl_generated_surface_consumption_only_not_visual_stage_live_soak',
    );
    assert.equal(surface.bridge_exit_gate.declares_visual_stage_long_soak_complete, false);
    assert.deepEqual(surface.bridge_exit_gate.remaining_blocker_ids, []);
    assert.deepEqual(surface.bridge_exit_gate.remaining_evidence_gate_ids, [
      'real_artifact_producing_domain_owner_receipt',
      'opl_hosted_controlled_visual_stage_long_soak',
      'real_memory_lifecycle_receipt_instances',
      'cross_family_repeated_no_regression_evidence',
    ]);

    for (const entry of surface.modules) {
      assert.equal(entry.bridge_exit_gate.gate_id, `${entry.module_id}_bridge_exit_gate`, entry.module_id);
      assert.equal(entry.bridge_exit_gate.rca_can_own_replacement_runtime, false, entry.module_id);
      assert.equal(entry.bridge_exit_gate.opl_can_write_visual_truth, false, entry.module_id);
      assert.equal(entry.bridge_exit_gate.opl_can_store_artifact_blob, false, entry.module_id);
      assert.equal(entry.bridge_exit_gate.declares_replacement_complete, false, entry.module_id);
      if (!['visual_pack_compiler_handoff', 'visual_authority_functions'].includes(entry.module_id)) {
        assert.deepEqual(entry.bridge_exit_gate.required_before_retire, [
          'domain_authority_refs_preserved',
          'no_regression_proof_recorded',
        ], entry.module_id);
      }
    }
  }
});

test('OPL generated interfaces are ready from RCA root contracts when OPL checkout is available', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: repoRoot,
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
