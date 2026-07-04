// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  exportDomainActionAdapter,
  prepareProductEntryWorkspace,
  runDeliverableRoute,
  SERIAL_ENV_TEST,
  withMockCodexRuntime,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';
import { withEnv } from './helpers/mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const suitePath = 'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json';
const agentLabHandoffPath = 'contracts/agent_lab_handoff.json';
const capabilityMapPath = 'contracts/capability_map.json';
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readRepoJson(relativePath) {
  return readJson(path.join(repoRoot, relativePath));
}

function assertRefsOnlyAuthorityBoundary(boundary, label) {
  assert.equal(boundary.refs_only, true, label);
  for (const key of [
    'can_write_domain_truth',
    'can_write_memory_body',
    'can_authorize_quality_verdict',
    'can_authorize_export_verdict',
    'can_mutate_domain_artifact',
    'can_write_owner_receipt',
  ]) {
    assert.equal(boundary[key], false, `${label}.${key}`);
  }
  assert.equal(boundary.opl_agent_lab_can_write_rca_visual_truth, false, label);
  assert.equal(boundary.opl_agent_lab_can_authorize_quality_verdict, false, label);
  assert.equal(boundary.opl_agent_lab_can_authorize_export_verdict, false, label);
  assert.equal(boundary.opl_agent_lab_can_mutate_artifact_body, false, label);
  assert.equal(boundary.opl_agent_lab_can_write_owner_receipt, false, label);
}

function assertCapabilityRouterBoundary(boundary, label) {
  assert.equal(boundary.refs_only, true, label);
  for (const key of [
    'can_write_domain_truth',
    'can_write_memory_body',
    'can_mutate_artifact_body',
    'can_sign_owner_receipt',
    'can_create_typed_blocker',
    'can_authorize_quality_or_export',
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_write_visual_truth_artifact',
    'can_write_export_or_quality_verdict',
  ]) {
    assert.equal(boundary[key], false, `${label}.${key}`);
  }
  assert.equal(boundary.rca_owner_receipt_or_typed_blocker_required, true, label);
}

function assertPptCapabilityMapShape(map, handoff, adoption) {
  const expectedCapabilityIds = [
    'rca-ppt-story-architect',
    'rca-ppt-visual-director',
    'rca-ppt-page-author',
    'rca-ppt-reviewer',
    'rca-native-ppt-designer',
    'rca-template-profiler',
  ];
  const expectedResourceRefs = Object.fromEntries(
    expectedCapabilityIds.map((capabilityId) => [
      capabilityId,
      `agent/professional_skills/${capabilityId}/resources/minimal-resource-pack.md`,
    ]),
  );
  const expectedResourceSignals = {
    'rca-ppt-story-architect': ['serial_pipeline', 'story_spec_lock', 'progressive_disclosure'],
    'rca-ppt-visual-director': ['spec_lock', 'progressive_disclosure', 'visual_qa'],
    'rca-ppt-page-author': ['serial_pipeline', 'progressive_disclosure', 'editable_pptx_grammar'],
    'rca-ppt-reviewer': ['visual_qa'],
    'rca-native-ppt-designer': ['spec_lock', 'editable_pptx_grammar'],
    'rca-template-profiler': ['template_capacity', 'placeholder_capacity', 'editable_pptx_grammar'],
  };
  const requiredVisualFailureTokens = [
    'storyline',
    'outline',
    'visual_direction',
    'style',
    'page_authoring',
    'visual_review',
    'native_pptx_editability',
    'template_profile',
    'placeholder_capacity',
  ];
  const methodTokens = [
    'ppt_visual_density',
    'serial_pipeline',
    'spec_lock',
    'progressive_disclosure',
    'style_boundary',
    'visual_qa',
    'editable_pptx_grammar',
  ];
  const expectedTokens = [
    ...requiredVisualFailureTokens,
    ...methodTokens,
    'visual_density',
    'layout_quality',
    'ppt_review',
  ];

  assert.equal(map.surface_kind, 'opl_standard_agent_capability_map');
  assert.equal(map.domain_capability_map_kind, 'rca_professional_capability_map');
  assert.equal(map.owner, 'redcube_ai');
  assert.equal(map.professional_skill_policy.skill_files_are_method_source_of_truth, true);
  assert.equal(map.professional_skill_policy.capability_map_is_routing_metadata_only, true);
  assert.equal(map.professional_skill_policy.skill_local_resource_pack_is_refs_only, true);
  assert.equal(map.professional_skill_policy.resource_pack_does_not_authorize_visual_truth, true);
  assert.equal(map.professional_skill_policy.resource_pack_does_not_authorize_export_or_quality_verdict, true);
  assert.equal(map.professional_skill_policy.resource_pack_does_not_write_runtime_state, true);
  assert.equal(map.skill_local_resource_pack.pack_kind, 'rca_ppt_professional_skill_local_resource_pack');
  assert.equal(map.skill_local_resource_pack.refs_only, true);
  assert.equal(map.skill_local_resource_pack.does_not_authorize_visual_truth, true);
  assert.equal(map.skill_local_resource_pack.does_not_authorize_artifact_body, true);
  assert.equal(map.skill_local_resource_pack.does_not_authorize_owner_receipt, true);
  assert.equal(map.skill_local_resource_pack.does_not_authorize_quality_or_export_verdict, true);
  assert.equal(map.skill_local_resource_pack.does_not_write_runtime_state, true);
  assert.deepEqual(
    map.skill_local_resource_pack.capability_resource_refs.map((entry) => entry.capability_id),
    expectedCapabilityIds,
  );
  for (const resourceEntry of map.skill_local_resource_pack.capability_resource_refs) {
    const expectedResourceRef = expectedResourceRefs[resourceEntry.capability_id];
    assert.equal(resourceEntry.skill_ref, `agent/professional_skills/${resourceEntry.capability_id}/SKILL.md`);
    assert.deepEqual(resourceEntry.resource_refs, [expectedResourceRef]);
    assert.deepEqual(resourceEntry.required_sections, ['## Template', '## Example', '## Checklist']);
    const skill = fs.readFileSync(path.join(repoRoot, resourceEntry.skill_ref), 'utf8');
    assert.equal(skill.includes('resources/minimal-resource-pack.md'), true, resourceEntry.skill_ref);
    const resourcePath = path.join(repoRoot, expectedResourceRef);
    assert.equal(fs.existsSync(resourcePath), true, expectedResourceRef);
    const resource = fs.readFileSync(resourcePath, 'utf8');
    assert.equal(resource.includes('Boundary: refs-only professional method resource.'), true, expectedResourceRef);
    for (const section of resourceEntry.required_sections) {
      assert.equal(resource.includes(section), true, `${expectedResourceRef}:${section}`);
    }
    for (const signal of expectedResourceSignals[resourceEntry.capability_id]) {
      assert.equal(resource.includes(signal), true, `${expectedResourceRef}:${signal}`);
    }
  }
  assert.deepEqual(map.professional_capabilities.map((entry) => entry.capability_id), expectedCapabilityIds);
  assert.deepEqual(Object.keys(map.feedback_token_index), expectedTokens);
  assert.deepEqual(map.ppt_visual_failure_token_contract.required_tokens, requiredVisualFailureTokens);
  assert.deepEqual(map.ppt_visual_failure_token_contract.required_token_groups.storyline_outline, ['storyline', 'outline']);
  assert.deepEqual(map.ppt_visual_failure_token_contract.required_token_groups.visual_direction_style, ['visual_direction', 'style']);
  assert.deepEqual(map.ppt_visual_failure_token_contract.required_token_groups.template_profile_placeholder_capacity, [
    'template_profile',
    'placeholder_capacity',
  ]);
  assert.deepEqual(map.ppt_visual_failure_token_contract.skill_method_tokens, methodTokens);
  assert.deepEqual(map.ppt_visual_failure_token_contract.all_supported_tokens, expectedTokens);
  assert.equal(map.ppt_visual_failure_token_contract.owner_closeout_boundary.rca_holds.includes('visual_truth'), true);
  assert.equal(map.ppt_visual_failure_token_contract.owner_closeout_boundary.rca_holds.includes('review_export_verdict'), true);
  assert.equal(map.ppt_visual_failure_token_contract.owner_closeout_boundary.rca_holds.includes('artifact_authority'), true);
  assert.equal(
    map.ppt_visual_failure_token_contract.owner_closeout_boundary.opl_oma_allowed_outputs.includes('refs_only_work_order'),
    true,
  );
  assert.equal(
    map.ppt_visual_failure_token_contract.owner_closeout_boundary.opl_oma_allowed_outputs.includes('typed_blocker_candidate'),
    true,
  );

  for (const capability of map.professional_capabilities) {
    const expectedResourceRef = expectedResourceRefs[capability.capability_id];
    assert.equal(fs.existsSync(path.join(repoRoot, capability.skill_ref)), true, capability.skill_ref);
    assert.equal(capability.allowed_change_refs.includes(capability.skill_ref), true, capability.capability_id);
    assert.equal(capability.allowed_change_refs.includes(expectedResourceRef), true, capability.capability_id);
    assert.equal(capability.canonical_paths.includes(capability.skill_ref), true, capability.capability_id);
    assert.equal(capability.canonical_paths.includes(expectedResourceRef), true, capability.capability_id);
    assert.equal(capability.target_repo_file_hints.includes(expectedResourceRef), true, capability.capability_id);
    assert.deepEqual(capability.resource_refs, [expectedResourceRef]);
    assert.equal(capability.resource_pack_boundary_ref, 'contracts/capability_map.json#/skill_local_resource_pack');
    assert.equal(capability.verification_refs.includes('contracts/capability_map.json#/skill_local_resource_pack'), true);
    assert.equal(capability.verification_refs.includes('contracts/agent_lab_handoff.json#/visual_feedback_failure_fixture'), true);
    assert.equal(
      capability.verification_refs.includes(
        'tests/rca-ppt-three-route-agent-lab-suite.test.ts#RCA PPT capability map routes AgentLab visual feedback fixture to professional skills and owner closeout boundary',
      ),
      true,
      capability.capability_id,
    );
    assert.equal(capability.forbidden_surfaces.includes('visual_truth_artifacts'), true, capability.capability_id);
    assert.equal(capability.forbidden_surfaces.includes('owner_receipts'), true, capability.capability_id);
    assertCapabilityRouterBoundary(capability.authority_boundary, capability.capability_id);
    assert.equal(
      capability.owner_closeout_boundary_ref,
      'contracts/capability_map.json#/ppt_visual_failure_token_contract/owner_closeout_boundary',
      capability.capability_id,
    );

    const resolverCapability = map.capabilities.find((entry) => entry.capability_id === capability.capability_id);
    assert.equal(Boolean(resolverCapability), true, capability.capability_id);
    assert.equal(resolverCapability.canonical_paths.includes(capability.skill_ref), true, capability.capability_id);
    assert.equal(resolverCapability.canonical_paths.includes(expectedResourceRef), true, capability.capability_id);
    assert.equal(resolverCapability.target_repo_file_hints.includes(expectedResourceRef), true, capability.capability_id);
    assert.deepEqual(resolverCapability.resource_refs, [expectedResourceRef]);
    assert.equal(resolverCapability.resource_pack_boundary_ref, 'contracts/capability_map.json#/skill_local_resource_pack');
    assert.equal(resolverCapability.verification_refs.includes('contracts/capability_map.json#/skill_local_resource_pack'), true);
    assert.equal(resolverCapability.verification_refs.includes('contracts/agent_lab_handoff.json#/visual_feedback_failure_fixture'), true);
    assert.equal(resolverCapability.forbidden_surfaces.includes('visual_truth_artifacts'), true, capability.capability_id);
    assertCapabilityRouterBoundary(resolverCapability.authority_boundary, `${capability.capability_id}.resolver`);
  }

  assert.equal(handoff.capability_map_ref, capabilityMapPath);
  assert.equal(handoff.external_suite_improvement_policy.capability_map_ref, capabilityMapPath);
  assert.equal(
    handoff.external_suite_improvement_policy.feedback_token_contract_ref,
    'contracts/capability_map.json#/ppt_visual_failure_token_contract/all_supported_tokens',
  );
  assert.equal(handoff.external_suite_improvement_policy.feedback_token_contract, undefined);
  assert.equal(handoff.external_suite_improvement_policy.patch_authority_boundary_ref, 'contracts/capability_map.json#/oma_patch_authority_boundary');
  assert.equal(handoff.patch_surface_hints.handoff_carries_patch_target_authority, false);
  assert.equal(handoff.patch_surface_hints.source_of_truth_refs.includes('contracts/capability_map.json#/feedback_token_index'), true);
  assert.equal(handoff.patch_surface_hints.allowed_patch_roots, undefined);
  assert.equal(map.oma_patch_authority_boundary.oma_can_patch_repo_source_docs_tests_skills, true);
  assert.equal(handoff.authority_boundary.handoff_carries_patch_target_authority, false);
  assert.equal(handoff.authority_boundary.patch_target_authority_source_ref, 'contracts/capability_map.json#/oma_patch_authority_boundary');
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_patch_repo_source_docs_tests_skills, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_emit_refs_only_patch_candidate, true);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_visual_truth_artifacts, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_artifact_blobs, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_export_or_quality_verdicts, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_runtime_data, false);
  assert.equal(adoption.source_refs.capability_map_ref, capabilityMapPath);

  assert.equal(handoff.change_ref_mappings.summary_kind, 'refs_only_consumer_summary');
  assert.equal(handoff.change_ref_mappings.source_of_truth_ref, 'contracts/capability_map.json#/feedback_token_index');
  assert.equal(handoff.change_ref_mappings.per_token_mappings_in_handoff, false);
  assert.equal(handoff.change_ref_mappings.handoff_carries_patch_target_authority, false);
  assert.equal(handoff.change_ref_mappings.supported_tokens_ref, 'contracts/capability_map.json#/ppt_visual_failure_token_contract/all_supported_tokens');
  for (const token of expectedTokens) {
    assert.equal(Boolean(map.feedback_token_index[token]), true, token);
    assert.equal(Object.hasOwn(handoff.change_ref_mappings, token), false, token);
    assert.equal(typeof map.feedback_token_index[token].default_patch_surface_hint, 'string', token);
  }

  assert.deepEqual(map.feedback_token_index.storyline.canonical_capability_ids, ['rca-ppt-story-architect']);
  assert.deepEqual(map.feedback_token_index.outline.canonical_capability_ids, ['rca-ppt-story-architect']);
  assert.deepEqual(map.feedback_token_index.visual_direction.canonical_capability_ids, ['rca-ppt-visual-director']);
  assert.deepEqual(map.feedback_token_index.visual_review.canonical_capability_ids, [
    'rca-ppt-reviewer',
    'rca-ppt-visual-director',
  ]);
  assert.deepEqual(map.feedback_token_index.placeholder_capacity.canonical_capability_ids, [
    'rca-template-profiler',
    'rca-ppt-visual-director',
    'rca-native-ppt-designer',
  ]);
  assert.deepEqual(map.feedback_token_index.ppt_visual_density.canonical_capability_ids, [
    'rca-ppt-visual-director',
    'rca-ppt-page-author',
    'rca-ppt-reviewer',
  ]);
  assert.deepEqual(map.feedback_token_index.serial_pipeline.canonical_capability_ids, [
    'rca-ppt-story-architect',
    'rca-ppt-page-author',
  ]);
  assert.deepEqual(map.feedback_token_index.spec_lock.canonical_capability_ids, [
    'rca-ppt-visual-director',
    'rca-native-ppt-designer',
  ]);
  assert.deepEqual(map.feedback_token_index.progressive_disclosure.canonical_capability_ids, [
    'rca-ppt-story-architect',
    'rca-ppt-visual-director',
    'rca-ppt-page-author',
  ]);
  assert.deepEqual(map.feedback_token_index.style_boundary.canonical_capability_ids, [
    'rca-ppt-visual-director',
    'rca-template-profiler',
  ]);
  assert.deepEqual(map.feedback_token_index.visual_qa.canonical_capability_ids, [
    'rca-ppt-reviewer',
    'rca-ppt-visual-director',
  ]);
  assert.deepEqual(map.feedback_token_index.editable_pptx_grammar.canonical_capability_ids, [
    'rca-native-ppt-designer',
    'rca-template-profiler',
    'rca-ppt-page-author',
  ]);
  assert.equal(
    map.feedback_token_index.native_pptx_editability.canonical_capability_ids.includes('rca-native-ppt-designer'),
    true,
  );
  assert.deepEqual(handoff.visual_feedback_failure_fixture.source_feedback.tokens, requiredVisualFailureTokens);
  assert.equal(handoff.visual_feedback_failure_fixture.fixture_kind, 'visual_negative_feedback_to_capability_hit_and_owner_closeout_boundary');
  assert.deepEqual(
    handoff.visual_feedback_failure_fixture.capability_hit_refs.map((entry) => entry.feedback_token),
    requiredVisualFailureTokens,
  );
  assert.equal(handoff.visual_feedback_failure_fixture.capability_hits, undefined);
  for (const hit of handoff.visual_feedback_failure_fixture.capability_hit_refs) {
    assert.equal(map.feedback_token_index[hit.feedback_token].canonical_capability_ids.length > 0, true, hit.feedback_token);
    assert.equal(hit.capability_map_ref, `contracts/capability_map.json#/feedback_token_index/${hit.feedback_token}`);
  }
  assert.equal(handoff.visual_feedback_failure_fixture.owner_closeout_boundary.rca_holds.includes('visual_truth'), true);
  assert.equal(handoff.visual_feedback_failure_fixture.owner_closeout_boundary.rca_holds.includes('review_export_verdict'), true);
  assert.equal(handoff.visual_feedback_failure_fixture.owner_closeout_boundary.rca_holds.includes('artifact_authority'), true);
}

function assertPptDryRunTokenMapping(map, handoff) {
  const dryRunTokens = [
    'ppt_visual_density',
    'native_pptx_editability',
    'serial_pipeline',
    'spec_lock',
    'progressive_disclosure',
    'style_boundary',
    'visual_qa',
    'editable_pptx_grammar',
  ];
  assert.equal(map.dry_run_token_mapping_check.check_kind, 'non_live_feedback_token_to_professional_skill_mapping');
  assert.equal(map.dry_run_token_mapping_check.dry_run_only, true);
  assert.equal(map.dry_run_token_mapping_check.invokes_live_provider, false);
  assert.equal(map.dry_run_token_mapping_check.writes_runtime_state, false);
  assert.equal(map.dry_run_token_mapping_check.writes_visual_truth_or_artifacts, false);
  assert.deepEqual(map.dry_run_token_mapping_check.tokens, dryRunTokens);
  assert.equal(map.dry_run_token_mapping_check.required_observations.includes('handoff_points_to_capability_map_source'), true);
  assert.equal(handoff.dry_run_token_mapping_check.check_kind, map.dry_run_token_mapping_check.check_kind);
  assert.equal(handoff.dry_run_token_mapping_check.dry_run_only, true);
  assert.deepEqual(handoff.dry_run_token_mapping_check.source_feedback.tokens, dryRunTokens);
  assert.equal(
    handoff.external_suite_improvement_policy.dry_run_token_mapping_check_ref,
    'contracts/agent_lab_handoff.json#/dry_run_token_mapping_check',
  );
  assert.equal(handoff.dry_run_token_mapping_check.capability_map_ref, 'contracts/capability_map.json#/dry_run_token_mapping_check');
  assert.equal(handoff.dry_run_token_mapping_check.feedback_token_index_ref, 'contracts/capability_map.json#/feedback_token_index');
  assert.equal(handoff.dry_run_token_mapping_check.token_cases_ref, 'contracts/capability_map.json#/dry_run_token_mapping_check/token_cases');
  assert.equal(handoff.dry_run_token_mapping_check.token_mappings_in_handoff, false);
  assert.equal(handoff.dry_run_token_mapping_check.token_cases, undefined);

  for (const dryRunCase of map.dry_run_token_mapping_check.token_cases) {
    const token = dryRunCase.feedback_token;
    const tokenIndex = map.feedback_token_index[token];
    assert.equal(Boolean(tokenIndex), true, token);
    assert.deepEqual(dryRunCase.capability_ids, tokenIndex.canonical_capability_ids, token);
    assert.equal(
      dryRunCase.verification_refs.includes(
        'tests/rca-ppt-three-route-agent-lab-suite.test.ts#RCA PPT dry-run feedback tokens resolve to professional skills without live artifacts',
      ),
      true,
      token,
    );

    for (const skillRef of dryRunCase.primary_skill_refs) {
      const skillPath = path.join(repoRoot, skillRef);
      assert.equal(fs.existsSync(skillPath), true, `${token}:${skillRef}`);
      const skill = fs.readFileSync(skillPath, 'utf8');
      assert.equal(skill.includes('## Minimal Template Resource'), true, `${token}:${skillRef}`);
    }
  }

  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_write_domain_truth, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_mutate_artifact_body, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_sign_owner_receipt, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_authorize_quality_or_export, false);
}

function assertPptThreeRouteSuiteShape(suite) {
  assert.equal(suite.surface_kind, 'rca_ppt_three_route_agent_lab_suite_handoff');
  assert.equal(suite.owner, 'redcube_ai');
  assert.equal(suite.consumer, 'opl_agent_lab');
  assert.equal(suite.suite_kind, 'agent_lab_external_suite');
  assert.equal(suite.suite_id, 'redcube-ai.ppt-three-route-agent-lab-suite.v1');
  assert.equal(suite.handoff_surface.agent_lab_suite_ref, suitePath);
  assert.equal(suite.handoff_surface.refs_only, true);
  assert.equal(suite.deliverable_family, 'ppt_deck');
  assert.equal(suite.route_family_summary.default_visual_route, 'author_image_pages');
  assert.equal(suite.route_family_summary.default_visual_policy, 'image_first');
  assert.deepEqual(suite.route_family_summary.explicit_routes, ['render_html', 'author_pptx_native']);
  assert.equal(suite.route_family_summary.artifact_body_required_in_suite, false);
  assert.equal(suite.declares_visual_ready, false);
  assert.equal(suite.declares_exportable, false);
  assert.equal(suite.declares_production_soak_complete, false);
  assert.deepEqual(
    suite.tasks.map((route) => route.primary_route),
    ['author_image_pages', 'render_html', 'author_pptx_native'],
  );
  assert.deepEqual(
    suite.tasks.map((route) => route.selection_mode),
    ['default', 'explicit_operator_selection_required', 'explicit_operator_selection_required'],
  );
  assert.equal(suite.required_observations.includes('task_manifests_observed'), true);
  assert.equal(suite.required_observations.includes('recovery_probes_observed'), true);
  assert.equal(suite.required_observations.includes('forbidden_authority_flags_all_false'), true);
  assert.deepEqual(suite.native_pptx_real_route_probe.required_report_observations, [
    'native_pptx_terminal_export_refs_observed',
    'agent_lab_run_report_ref_observed',
    'mock_visual_quality_claims_absent',
  ]);
  assert.equal(
    suite.target_runtime_consumption_refs.includes('opl_generated:product_entry_manifest#/ppt_three_route_agent_lab_suite'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/mapped_surfaces/ppt_three_route_agent_lab_suite',
    ),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/source_manifest_refs/ppt_three_route_agent_lab_suite_ref',
    ),
    true,
  );
  assert.equal(suite.target_verification_refs.includes('target-verification:redcube-ai/product-manifest-read'), true);
  assert.equal(suite.target_verification_refs.includes('target-verification:redcube-ai/domain-handler-export-read'), true);
  assert.equal(
    suite.target_verification_refs.includes('target-verification:redcube-ai/real-native-pptx-product-entry-route-terminal-refs'),
    true,
  );
  assert.equal(suite.native_pptx_real_route_probe.product_entry_domain_route_required, true);
  assert.equal(suite.native_pptx_real_route_probe.task_intent, 'run_deliverable_route');
  assert.equal(suite.native_pptx_real_route_probe.terminal_route, 'export_pptx');
  assert.deepEqual(suite.native_pptx_real_route_probe.route_chain, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.deepEqual(suite.native_pptx_real_route_probe.terminal_evidence_required_ref_groups, [
    'editable_pptx',
    'pdf',
    'render_screenshots',
    'shape_manifest',
    'visual_director_review_receipt',
    'screenshot_review_receipt',
    'export_receipt',
    'artifact_gallery',
    'agent_lab_run_report',
  ]);
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('handwritten_pptx_script_as_workflow'), true);
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('mock_provider_visual_quality_claim'), true);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.records_refs_only, true);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_rca_visual_verdict, false);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_owner_receipt, false);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_artifact_body, false);
  assert.equal(
    suite.target_verification_refs.includes(
      'target-verification:redcube-ai/mock-artifact-producing-ppt-three-route-export-bundles',
    ),
    true,
  );
  assert.equal(suite.artifact_sample_policy.sample_kind, 'mock_provider_artifact_producing_ppt_three_route_export');
  assert.equal(suite.artifact_sample_policy.proves_artifact_export_chain, true);
  assert.equal(suite.artifact_sample_policy.proves_visual_design_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.proves_visual_sample_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.can_claim_visual_ready, false);
  assert.equal(suite.artifact_sample_policy.proves_live_image_provider, false);
  assert.equal(suite.artifact_sample_policy.codex_native_imagegen_policy.executor_task_surface, 'codex_native_imagegen_skill');
  assert.equal(suite.artifact_sample_policy.codex_native_imagegen_policy.explicit_provider_token_required, false);
  assert.equal(suite.artifact_sample_policy.route_cases.length, 3);
  assert.equal(
    suite.artifact_sample_refs.includes(
      'artifact-sample:test:rca-ppt-three-route-agent-lab-suite#artifact-producing-ppt-three-route-export-bundles',
    ),
    true,
  );
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/<deliverable>.pptx'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/<deliverable>.pdf'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/native_ppt/<deliverable>-shape-manifest.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:reports/native_ppt/<deliverable>-screenshots/slide-1.png'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/director_review.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/quality_gate.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/publish_bundle.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/artifact_gallery/index.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:<probe-output>/real-route-evolution-probe.json'), true);
  assert.equal(suite.native_live_evidence_policy.required_for_native_visual_quality_claim, true);
  assert.equal(suite.native_live_evidence_policy.mock_provider_can_satisfy, false);
  assert.equal(suite.native_live_evidence_policy.agent_lab_records_refs_only, true);
  assert.deepEqual(suite.native_live_evidence_policy.required_terminal_routes, [
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('editable_pptx_file'),
    true,
  );
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('render_preview_screenshot_png'),
    true,
  );
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('artifact_gallery_index_file'),
    true,
  );
  assert.deepEqual(suite.accepted_terminal_shapes, [
    'domain_receipt',
    'typed_blocker',
    'no_regression_evidence',
  ]);
  assert.equal(suite.not_authorized_claims.includes('visual_ready'), true);
  assert.equal(suite.not_authorized_claims.includes('production_soak_complete'), true);
  assertRefsOnlyAuthorityBoundary(suite.authority_boundary, 'suite.authority_boundary');

  const task = suite.tasks[0];
  assert.equal(task.task_id, 'agent-lab-task:rca/ppt-three-route/default-image-first');
  assert.equal(task.task_family, 'ppt_three_route_technical_route_contract');
  assert.equal(task.scorecard.domain_owned, true);
  assert.equal(task.scorecard.opl_scorecard_role, 'scorecard_ref_projection_only');
  assert.equal(task.scorecard.score_is_rca_visual_verdict, false);
  assert.equal(task.scorecard.claims_exportable, false);
  assert.equal(task.scorecard.review_refs.includes('agent/quality_gates/review_export_memory.md'), true);
  assert.equal(task.trajectory.file_refs.includes(suitePath), true);
  assert.equal(task.promotion_gate.gate_status, 'passed');
  assert.equal(task.promotion_gate.artifact_producing_runtime_tests_changed, true);
  assert.equal(task.promotion_gate.regression_suite_refs.includes('tests/rca-ppt-three-route-agent-lab-suite.test.ts'), true);
}

async function runPlanningChain({ workspaceRoot, deliverableId }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId,
    title: `PPT 三路线测试 ${deliverableId}`,
    goal: '验证 RCA PPT 可以从单一目标自主推进到可导出的 PPTX/PDF 产物链路',
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${deliverableId}:${route}`);
  }
}

async function runPptVisualRoute({ workspaceRoot, deliverableId, visualRoute }) {
  await runPlanningChain({ workspaceRoot, deliverableId });
  const results = [];
  for (const route of [visualRoute, 'visual_director_review', 'screenshot_review', 'export_pptx']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${deliverableId}:${route}`);
    results.push({ route, result });
  }
  return results;
}

function artifactFor(results, route) {
  const entry = results.find((candidate) => candidate.route === route);
  assert.equal(Boolean(entry), true, route);
  assert.equal(fs.existsSync(entry.result.artifactFile), true, entry.result.artifactFile);
  return readJson(entry.result.artifactFile);
}

function assertCommonExport({ exported, expectedRoute }) {
  assert.equal(exported.status, 'completed');
  assert.equal(exported.export_bundle.delivery_state.current, 'output_ready');
  assert.equal(fs.existsSync(exported.export_bundle.pptx_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.pdf_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.presenter_notes_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.final_delivery.pptx_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.final_delivery.pdf_file), true);
  if (expectedRoute) {
    assert.equal(exported.export_bundle.source_visual_route, expectedRoute);
  }
}

test('RCA PPT three-route AgentLab suite is a top-level refs-only external suite contract', () => {
  assertPptThreeRouteSuiteShape(readRepoJson(suitePath));
});

test('RCA PPT capability map routes AgentLab visual feedback fixture to professional skills and owner closeout boundary', () => {
  assertPptCapabilityMapShape(
    readRepoJson(capabilityMapPath),
    readRepoJson(agentLabHandoffPath),
    readRepoJson('contracts/standard-agent-principles-adoption.json'),
  );
});

test('RCA PPT dry-run feedback tokens resolve to professional skills without live artifacts', () => {
  assertPptDryRunTokenMapping(readRepoJson(capabilityMapPath), readRepoJson(agentLabHandoffPath));
});

test('artifact-producing PPT workflow reaches export_pptx through image-first, HTML, and native PPT routes', SERIAL_ENV_TEST, async () => {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_IMAGE_GENERATION_MOCK: '1',
  });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-ppt-three-route-');
      const routeCases = [
        { deliverableId: 'deck-image-first', visualRoute: 'author_image_pages' },
        { deliverableId: 'deck-html', visualRoute: 'render_html' },
        { deliverableId: 'deck-native', visualRoute: 'author_pptx_native' },
      ];

      for (const routeCase of routeCases) {
        const results = await runPptVisualRoute({ workspaceRoot, ...routeCase });
        const visualArtifact = artifactFor(results, routeCase.visualRoute);
        const screenshot = artifactFor(results, 'screenshot_review');
        const exported = artifactFor(results, 'export_pptx');

        assert.equal(screenshot.status, 'pass');
        assert.equal(screenshot.review_capture.source_visual_route, routeCase.visualRoute);
        assert.equal(
          screenshot.slide_reviews.every((slide) => fs.existsSync(slide.screenshot_file)),
          true,
        );

        if (routeCase.visualRoute === 'author_image_pages') {
          assert.equal(visualArtifact.image_pages_bundle.source_visual_route, 'author_image_pages');
          assert.equal(visualArtifact.image_pages_bundle.editable, false);
          assert.equal(
            visualArtifact.image_page_manifest.slides.every((slide) => fs.existsSync(slide.image_file)),
            true,
          );
          assertCommonExport({ exported, expectedRoute: 'author_image_pages' });
          assert.equal(exported.export_bundle.editable, false);
          assert.equal(fs.existsSync(exported.export_bundle.artifact_gallery.index_file), true);
        }

        if (routeCase.visualRoute === 'render_html') {
          assert.equal(visualArtifact.html_bundle.page_count > 0, true);
          assert.equal(fs.existsSync(visualArtifact.html_bundle.html_file), true);
          assert.equal(fs.existsSync(visualArtifact.html_bundle.slides_file), true);
          const html = fs.readFileSync(visualArtifact.html_bundle.html_file, 'utf8');
          assert.equal(html.includes('[object Object]'), false);
          assert.equal(html.includes('04 / 03'), false);
          assert.equal(html.includes('08 / 08'), true);
          assertCommonExport({ exported });
          assert.equal(fs.existsSync(exported.export_bundle.source_html), true);
          assert.equal(exported.export_bundle.review_capture.source_visual_route, 'render_html');
        }

        if (routeCase.visualRoute === 'author_pptx_native') {
          assert.equal(visualArtifact.native_ppt_bundle.source_visual_route, 'author_pptx_native');
          assert.equal(visualArtifact.native_ppt_bundle.editable_artifact, true);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.proves_artifact_export_chain, true);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.proves_visual_design_quality, false);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.mock_fixture_visual_sample_allowed, false);
          assert.equal(visualArtifact.native_ppt_bundle.test_double_boundary.kind, 'deterministic_codex_test_double');
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.pptx_file), true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.pdf_file), true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.shape_manifest_file), true);
          assert.equal(
            visualArtifact.native_ppt_bundle.preview_screenshots.every((file) => fs.existsSync(file)),
            true,
          );
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'visual_director_review').result.artifactFile), true);
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'screenshot_review').result.artifactFile), true);
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'export_pptx').result.artifactFile), true);
          assertCommonExport({ exported, expectedRoute: 'author_pptx_native' });
          assert.equal(exported.export_bundle.renderer_proof.source_surface_kind, 'native_pptx');
          assert.equal(exported.export_bundle.source_pptx, visualArtifact.native_ppt_bundle.pptx_file);
          assert.equal(exported.export_bundle.native_ppt_shape_manifest, visualArtifact.native_ppt_bundle.shape_manifest_file);
          assert.equal(
            exported.export_bundle.renderer_proof.preview_screenshots.every((file) => fs.existsSync(file)),
            true,
          );
          assert.equal(fs.existsSync(exported.export_bundle.artifact_gallery.index_file), true);
        }
      }
    });
  } finally {
    restoreEnv();
  }
});

test('OPL AgentLab runner consumes the RCA PPT three-route suite with refs-only pass or typed-blocker boundary', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agent-lab',
    'run',
    '--suite',
    path.join(repoRoot, suitePath),
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const suiteResult = payload.agent_lab_run.suite_result;
  assert.equal(payload.agent_lab_run.surface_id, 'opl_agent_lab_external_suite_run');
  assert.equal(suiteResult.suite_id, 'redcube-ai.ppt-three-route-agent-lab-suite.v1');
  assert.deepEqual(suiteResult.missing_observations, []);
  assert.equal(suiteResult.summary.forbidden_authority_flag_count, 0);
  assert.equal(suiteResult.summary.memory_body_observed, false);
  assert.equal(['passed', 'blocked'].includes(suiteResult.status), true);
  if (suiteResult.status === 'blocked') {
    assert.equal(suiteResult.summary.stage_completion_policy_blocker_count > 0, true);
    assert.equal(
      suiteResult.refs.stage_completion_policy_blocker_refs.includes('stage-completion-policy-blocker:stage_completion_policy_missing'),
      true,
    );
    assert.equal(suiteResult.authority_boundary.can_write_domain_truth, false);
    assert.equal(suiteResult.authority_boundary.can_write_owner_receipt, false);
  }
});

test('manifest and domain-handler export expose the RCA PPT three-route AgentLab suite', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifestModule = await import('../packages/redcube-domain-entry/dist/index.js');
    const manifest = await manifestModule.getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    const projection = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });

    assertPptThreeRouteSuiteShape(manifest.ppt_three_route_agent_lab_suite);
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.ppt_three_route_agent_lab_suite,
      manifest.ppt_three_route_agent_lab_suite,
    );
    assertPptThreeRouteSuiteShape(projection.mapped_surfaces.ppt_three_route_agent_lab_suite);
    assert.equal(
      projection.source_manifest_refs.ppt_three_route_agent_lab_suite_ref,
      '/ppt_three_route_agent_lab_suite',
    );
    assert.equal(
      manifest.owner_route.projection_refs.some((entry) => entry.ref === '/ppt_three_route_agent_lab_suite'),
      true,
    );
  });
});
