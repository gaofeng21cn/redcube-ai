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
  buildPhysicalSourceMorphologyPolicy,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-domain-entry/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';

const requiredDomainPackPaths = [
  'agent/prompts/source_intake.md',
  'agent/prompts/communication_strategy.md',
  'agent/prompts/visual_direction.md',
  'agent/prompts/artifact_creation.md',
  'agent/prompts/review_and_revision.md',
  'agent/prompts/package_and_handoff.md',
  'agent/stages/source_intake.md',
  'agent/stages/communication_strategy.md',
  'agent/stages/visual_direction.md',
  'agent/stages/artifact_creation.md',
  'agent/stages/review_and_revision.md',
  'agent/stages/package_and_handoff.md',
  'agent/skills/visual_deliverable_authoring.md',
  'agent/skills/native_helper_policy.md',
  'agent/skills/visual_memory_policy.md',
  'agent/quality_gates/visual_authority_boundaries.md',
  'agent/quality_gates/source_and_truth.md',
  'agent/quality_gates/communication_and_direction.md',
  'agent/quality_gates/artifact_authority.md',
  'agent/quality_gates/review_export_memory.md',
  'agent/knowledge/visual_truth_boundaries.md',
  'agent/knowledge/communication_visual_direction.md',
  'agent/knowledge/artifact_and_export_authority.md',
  'agent/knowledge/review_export_memory.md',
  'agent/knowledge/owner_receipt_policy.md',
];

const oplCanonicalGeneratedSurfaceIds = [
  'cli',
  'mcp',
  'skill',
  'product_entry_manifest',
  'domain_action_adapter_export_dispatch',
  'status_read_model',
  'workbench_drilldown',
  'functional_harness_cases',
];

const wrapperDescriptorScopeIds = [
  'product_entry',
  'product_status',
  'product_session',
  'domain_action_adapter',
  'workbench',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function jsonStable(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoLegacyAuthorityFunctionFields(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoLegacyAuthorityFunctionFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (value.contract_id === 'rca.minimal_authority_functions.v1') {
    assert.equal('allowed_functions' in value, false, label);
    assert.equal(Array.isArray(value.allowed_authority_surface_ids), true, label);
    assert.equal('authority_surface_boundaries' in value, true, label);
    assert.equal('function_boundaries' in value, false, label);
  }
  if (value.surface_kind === 'rca_minimal_authority_surface') {
    assert.equal('function_id' in value, false, label);
    assert.equal('legacy_function_id_compatibility' in value, false, label);
    assert.equal(typeof value.authority_surface_id, 'string', label);
  }
  if (value.authority_surface_taxonomy) {
    assert.equal('retained_functions' in value, false, label);
    assert.equal('retained_function_count' in value, false, label);
  }

  for (const [key, entry] of Object.entries(value)) {
    assertNoLegacyAuthorityFunctionFields(entry, `${label}.${key}`);
  }
}

function assertCleanAgentRepoPathRef(refEntry, expectedPrefix, label) {
  assert.equal(refEntry.ref_kind, 'repo_path', label);
  assert.equal(refEntry.ref.startsWith(expectedPrefix), true, `${label}: ${refEntry.ref}`);
  const fullPath = path.join(repoRoot, refEntry.ref);
  assert.equal(fs.existsSync(fullPath), true, `${label}: ${refEntry.ref}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.notEqual(content.trim(), '', `${label}: ${refEntry.ref}`);
  assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, `${label}: ${refEntry.ref}`);
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
      session_continuity_root: '<session_continuity_root>',
    },
    productEntrySessionCommand: 'redcube product session --entry-session-id <entry-session-id>',
  });
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const functionalAudit = buildPrivatizedFunctionalModuleAuditProjection();
  const generatedSurfaceIds = [
    ...oplCanonicalGeneratedSurfaceIds,
    ...wrapperDescriptorScopeIds,
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
      canonical_semantic_pack_root: 'agent/',
      canonical_semantic_pack_role: 'repo_source_declarative_visual_pack',
      legacy_detail_asset_roots: [
        'prompts/ppt_deck/',
        'prompts/xiaohongshu/',
      ],
      legacy_detail_asset_policy: 'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
      required_domain_pack_paths: requiredDomainPackPaths,
      minimal_authority_surface_ids: visualPackCompilerHandoff.minimal_authority_function_contract.allowed_authority_surface_ids,
      minimal_authority_surface_taxonomy: (
        visualPackCompilerHandoff.minimal_authority_function_contract.authority_surface_taxonomy
      ),
      minimal_authority_surface_contracts: (
        visualPackCompilerHandoff.minimal_authority_function_contract.authority_surface_contracts
      ),
      generated_surfaces_requested: generatedSurfaceIds,
      generated_interface_consumption_ref: '/opl_generated_interface_consumption',
      repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
      repo_local_handlers_are_generated_surface_owners: false,
      domain_repo_can_own_generated_surface: false,
      source_refs: {
        canonical_semantic_pack: 'agent/',
        action_catalog: 'packages/redcube-domain-entry/src/actions/family-action-catalog.ts::buildRedCubeActionMetadata',
        stage_control_plane: 'packages/redcube-domain-entry/src/actions/family-stage-control-plane.ts::buildRedCubeFamilyStageControlPlane',
        memory_descriptor: 'packages/redcube-domain-entry/src/actions/standard-domain-agent-skeleton.ts::buildFamilyDomainMemoryDescriptor',
        functional_audit: 'packages/redcube-domain-entry/src/actions/guarded-domain-actions.ts::buildPrivatizedFunctionalModuleAuditProjection',
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
      ...functionalAudit,
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
    physicalSourceMorphologyPolicy: buildPhysicalSourceMorphologyPolicy(),
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
  assert.deepEqual(
    readJson('contracts/physical_source_morphology_policy.json'),
    canonical.physicalSourceMorphologyPolicy,
  );
});

test('RCA physical source morphology policy classifies active source tails without generic ownership', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const byId = Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.status, 'active_source_classification_policy_landed');
  assert.equal(policy.canonical_pack_root, 'agent/');
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.allowance_required_for_active_surface_text_matches, true);
  assert.equal(policy.legacy_name_policy.active_generic_runtime_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_domain_entry_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_session_runtime_owner_allowed, false);
  assert.deepEqual(policy.legacy_name_policy.tracked_legacy_terms, [
    'managed',
    'runtime',
    'gateway',
    'session',
    'domain_action_adapter',
  ]);
  assert.deepEqual(policy.legacy_name_policy.allowed_legacy_name_roles, [
    'machine_contract_ref',
    'package_protocol_boundary',
    'service_safe_domain_entry',
    'contract_safe_semantic_id',
    'tombstone_or_provenance',
    'negative_test_guard',
    'refs_only_read_model',
    'domain_handler_target',
    'minimal_visual_authority_function',
    'visual_native_helper_path',
    'locator_protocol_boundary',
  ]);
  assert.deepEqual(policy.legacy_name_policy.forbidden_active_surface_ids, [
    'legacy_managed_runtime_gateway_names',
  ]);
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.package_name, '@redcube/domain-entry');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_identity, 'redcube-ai');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_framework_identity_allowed, false);
  assert.equal(policy.new_surface_admission_gate.must_classify_before_active_caller, true);
  assert.equal(policy.new_surface_admission_gate.reopen_gap_if_forbidden_owner_role_appears, true);
  assert.equal(policy.allowed_surface_classes.includes('package_protocol_boundary'), true);
  assert.equal(policy.allowed_surface_classes.includes('service_safe_domain_entry'), true);
  assert.equal(policy.allowed_surface_classes.includes('refs_only_read_model'), true);
  assert.equal(policy.allowed_surface_classes.includes('minimal_visual_authority_function'), true);

  assert.equal(byId.mcp_product_entry_domain_entry.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_cli_domain_entry_adapter.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.classification, 'package_protocol_boundary');
  assert.equal(byId.product_entry_continuity_refs_adapter.classification, 'refs_only_read_model');
  assert.equal(byId.workspace_run_envelope_helpers.classification, 'refs_only_read_model');
  assert.equal(byId.runtime_watch_projection.classification, 'refs_only_read_model');
  assert.equal(byId.domain_action_adapter_guarded_actions.classification, 'domain_handler_target');
  assert.equal(byId.operator_evidence_stability_projection.classification, 'refs_only_read_model');
  assert.equal(byId.visual_authority_functions.classification, 'minimal_visual_authority_function');
  assert.equal(byId.legacy_managed_runtime_gateway_names, undefined);
  assert.equal(byId.retired_product_entry_contract_tombstone_refs.classification, 'tombstone_or_provenance');
  assert.deepEqual(byId.retired_product_entry_contract_tombstone_refs.retired_legacy_refs, [
    'contracts/runtime-program/managed-product-entry-hardening.json',
  ]);

  assert.deepEqual(byId.product_entry_continuity_refs_adapter.source_refs, [
    'packages/redcube-runtime/src/product-entry-continuity-ref-adapter.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-artifacts.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-surfaces.ts',
    'packages/redcube-domain-entry/src/actions/product-entry-continuity-surfaces.ts',
  ]);
  assert.deepEqual(byId.runtime_watch_projection.source_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts',
  ]);
  assert.deepEqual(byId.redcube_domain_entry_package_protocol_boundary.source_refs, [
    'packages/redcube-domain-entry/package.json',
    'packages/redcube-domain-entry/src/index.ts',
  ]);
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.source_refs, [
    'apps/redcube-cli/package.json',
    'apps/redcube-cli/src/cli-parts/dispatch.ts',
    'apps/redcube-cli/src/cli-parts/help.ts',
    'apps/redcube-cli/src/types.ts',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.current_rca_role,
    'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner',
  );
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.legacy_name_allowance.allowed_as, [
    'service_safe_domain_entry',
    'domain_handler_target',
    'refs_only_read_model',
    'package_protocol_boundary',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_cli_wrapper_owner_allowed,
    false,
  );
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_workbench_owner_allowed,
    false,
  );
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.legacy_name_allowance, undefined);
  assert.equal(
    byId.product_entry_continuity_refs_adapter.current_rca_role,
    'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
  );
  assert.deepEqual(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'contract_safe_semantic_id',
  ]);
  assert.equal(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.compatibility_alias_allowed, false);
  assert.deepEqual(byId.runtime_watch_projection.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'negative_test_guard',
  ]);
  assert.equal(byId.runtime_watch_projection.legacy_name_allowance.active_generic_runtime_owner_allowed, false);
  assert.equal(
    byId.runtime_watch_projection.current_rca_role,
    'run_review_existing_run_locator_refs_only_projection_not_supervisor',
  );
  assert.deepEqual(byId.workspace_run_envelope_helpers.machine_boundary_refs, [
    'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
    'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
  ]);
  assert.equal(
    byId.workspace_run_envelope_helpers.no_resurrection_gate.generic_attempt_ledger_owner_allowed,
    false,
  );
  assert.deepEqual(byId.runtime_watch_projection.machine_boundary_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
  ]);
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.generic_supervisor_owner_allowed,
    false,
  );
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.default_supervision_route_allowed,
    false,
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.current_rca_role,
    'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
  );
  assert.equal(
    byId.operator_evidence_stability_projection.current_rca_role,
    'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.allowed_outputs.includes('visual_transition_decision_refs'),
    true,
  );
  assert.equal(
    byId.operator_evidence_stability_projection.allowed_outputs.includes('stability_read_model_refs'),
    true,
  );

  for (const entry of policy.active_surface_classifications) {
    for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
      assert.equal(value, false, entry.surface_id);
    }
  }
});

test('RCA canonical semantic pack paths are concrete, clean, and stage semantic refs resolve under agent', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const stageControlPlane = readJson('contracts/stage_control_plane.json');

  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.deepEqual(packCompilerInput.legacy_detail_asset_roots, [
    'prompts/ppt_deck/',
    'prompts/xiaohongshu/',
  ]);
  assert.equal(
    packCompilerInput.legacy_detail_asset_policy,
    'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
  );
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, requiredDomainPackPaths);

  for (const relativePath of packCompilerInput.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  const stageIds = stageControlPlane.stages.map((stage) => stage.stage_id);
  assert.deepEqual(stageIds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  for (const stage of stageControlPlane.stages) {
    assert.deepEqual(stage.prompt_refs, [
      {
        ref_kind: 'repo_path',
        ref: `agent/prompts/${stage.stage_id}.md`,
        role: 'canonical_stage_prompt_policy',
      },
    ], stage.stage_id);
    assert.equal(stage.stage_contract.source_scope_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.cohort_query_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.trigger_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.monitor_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.dashboard_metric_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.metric_refs.length >= 4, true, stage.stage_id);
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'expected_success_ref'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'boundary_success_rate_ref'),
      true,
      stage.stage_id,
    );
    assert.deepEqual(stage.stage_contract.recorded_runtime_event_refs, stage.stage_contract.runtime_event_refs);
    assert.deepEqual(stage.stage_contract.owner_receipt_refs, [`owner_receipt:${stage.stage_id}`]);
    assert.equal(stage.stage_contract.append_only_event_log_refs.length, 1, stage.stage_id);
    assert.equal(stage.stage_contract.attempt_ledger_refs.length, 1, stage.stage_id);
    assert.equal(
      stage.stage_contract.closeout_receipt_refs.includes(`owner_receipt:${stage.stage_id}`),
      true,
      stage.stage_id,
    );
    assert.deepEqual(
      stage.stage_contract.replay_evidence_refs.map((replayRef) => replayRef.role),
      [
        'append_only_event_log_ref',
        'opl_stage_attempt_ledger_ref',
        'recorded_runtime_event_refs',
        'stage_closeout_receipt_ref',
        'domain_owner_receipt_ref',
      ],
      stage.stage_id,
    );
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_exportable, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false, stage.stage_id);
    assert.equal(
      stage.stage_contract.trigger_refs.some((triggerRef) =>
        triggerRef.role === 'opl_provider_stage_launch_trigger'),
      true,
      stage.stage_id,
    );
    assertCleanAgentRepoPathRef(stage.prompt_refs[0], 'agent/prompts/', `${stage.stage_id}.prompt_refs`);
    const stageSkillRefs = stage.skills.filter((skill) => skill.ref_kind === 'repo_path');
    assert.equal(stageSkillRefs.length > 0, true, stage.stage_id);
    assert.equal(
      stage.skills.some((skill) => skill.ref_kind === 'skill_id' && skill.ref === 'redcube-ai'),
      true,
      stage.stage_id,
    );
    for (const [index, skillRef] of stageSkillRefs.entries()) {
      assertCleanAgentRepoPathRef(skillRef, 'agent/skills/', `${stage.stage_id}.skills[${index}]`);
    }
    assert.equal(Array.isArray(stage.knowledge_refs), true, stage.stage_id);
    assert.equal(stage.knowledge_refs.length > 0, true, stage.stage_id);
    for (const [index, knowledgeRef] of stage.knowledge_refs.entries()) {
      assertCleanAgentRepoPathRef(knowledgeRef, 'agent/knowledge/', `${stage.stage_id}.knowledge_refs[${index}]`);
    }
    assert.equal(Array.isArray(stage.evaluation), true, stage.stage_id);
    assert.equal(stage.evaluation.length > 0, true, stage.stage_id);
    assert.equal(
      stage.evaluation.some((evaluationRef) => evaluationRef.role === 'owner_receipt_gate'),
      true,
      stage.stage_id,
    );
    for (const [index, evaluationRef] of stage.evaluation.entries()) {
      assertCleanAgentRepoPathRef(evaluationRef, 'agent/quality_gates/', `${stage.stage_id}.evaluation[${index}]`);
    }
    assert.equal(stage.legacy_prompt_asset_refs.length, 2, stage.stage_id);
    for (const legacyRef of stage.legacy_prompt_asset_refs) {
      assert.equal(legacyRef.ref.startsWith('prompts/'), true, stage.stage_id);
    }
  }
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
  const authorityTaxonomy = packCompilerInput.minimal_authority_surface_taxonomy;

  for (const surfaceId of generatedScope) {
    assert.equal(requestedSurfaces.includes(surfaceId), true, surfaceId);
    assert.equal(handoffSurfaceIds.includes(surfaceId), true, surfaceId);
  }
  for (const surfaceId of oplCanonicalGeneratedSurfaceIds) {
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
    generatedSurfaceHandoff.repo_local_launcher_policy.domain_action_adapter_role,
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
  assert.deepEqual(authorityTaxonomy.ai_first_judgment_surface_ids, [
    'source_readiness_verdict',
    'communication_visual_direction_decision',
    'review_export_verdict',
    'visual_memory_accept_reject',
  ]);
  assert.deepEqual(authorityTaxonomy.programmatic_authority_surface_ids, [
    'artifact_mutation_authorization',
    'owner_receipt_signer',
    'native_helper_implementation',
  ]);
  assert.equal(authorityTaxonomy.programmatic_verdict_generation_allowed, false);
  assert.equal(packCompilerInput.minimal_authority_surface_contracts.length, 7);
  for (const surface of packCompilerInput.minimal_authority_surface_contracts) {
    assert.equal(surface.surface_kind, 'rca_minimal_authority_surface', surface.authority_surface_id);
    assert.equal('function_id' in surface, false, surface.authority_surface_id);
    assert.equal('legacy_function_id_compatibility' in surface, false, surface.authority_surface_id);
    assert.equal(surface.mechanical_decision_forbidden, true, surface.authority_surface_id);
    assert.equal(surface.programmatic_verdict_generation_allowed, false, surface.authority_surface_id);
    assert.equal(
      surface.decision_boundary.programmatic_role_may_compute_ready_verdict,
      false,
      surface.authority_surface_id,
    );
  }

  assertNoLegacyAuthorityFunctionFields(packCompilerInput, 'contracts/pack_compiler_input.json');
  assertNoLegacyAuthorityFunctionFields(functionalAudit, 'contracts/functional_privatization_audit.json');
  assertNoLegacyAuthorityFunctionFields(
    readJson('contracts/runtime-program/current-program.json'),
    'contracts/runtime-program/current-program.json',
  );
  assertNoLegacyAuthorityFunctionFields(
    readJson('contracts/runtime-program/opl-family-contract-adoption.json'),
    'contracts/runtime-program/opl-family-contract-adoption.json',
  );
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

test('OPL default callers see RCA deletion evidence refs without delete authority', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agents',
    'default-callers',
    '--agent',
    `redcube-ai=${repoRoot}`,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const readiness = payload.agent_default_caller_readiness;
  assert.equal(readiness.status, 'ready_domain_evidence_required');
  assert.equal(readiness.summary.generated_default_caller_surface_count, 8);
  assert.equal(readiness.summary.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(readiness.summary.missing_no_forbidden_write_proof_count, 0);
  assert.equal(readiness.summary.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(readiness.migration_gate_policy.physical_delete_authorized_by_this_report, false);
  assert.equal(readiness.authority_boundary.report_can_authorize_domain_repo_physical_delete, false);

  const report = readiness.reports[0];
  assert.equal(report.deletion_gate.physical_delete_authorized, false);
  const bySurface = Object.fromEntries(report.surface_gates.map((gate) => [gate.surface_id, gate]));
  assert.equal(bySurface.cli.active_caller_module_id, 'generic_cli_mcp_wrappers');
  assert.equal(bySurface.skill.active_caller_module_id, 'generic_cli_mcp_wrappers');
  assert.equal(bySurface.product_status.active_caller_module_id, 'operator_projection_shell');
  for (const gate of report.surface_gates) {
    const worklist = gate.deletion_evidence_worklist;
    assert.equal(worklist.domain_owner_receipt_or_typed_blocker.status, 'observed', gate.surface_id);
    assert.equal(worklist.no_forbidden_write_proof.status, 'observed', gate.surface_id);
    assert.equal(worklist.tombstone_or_provenance_ref.status, 'observed', gate.surface_id);
    assert.equal(worklist.physical_delete_authorized, false, gate.surface_id);
  }
});
