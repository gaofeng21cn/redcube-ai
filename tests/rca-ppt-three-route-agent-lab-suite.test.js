import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  exportDomainHandler,
  prepareProductEntryWorkspace,
  runDeliverableRoute,
  SERIAL_ENV_TEST,
  withMockCodexRuntime,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';
import { readJson } from './helpers/json-io.ts';
import { withEnv } from './helpers/mock-codex-cli.js';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const suitePath = 'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json';
const agentLabHandoffPath = 'contracts/agent_lab_handoff.json';
const capabilityMapPath = 'contracts/capability_map.json';
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);

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
    'rca-visual-memory-curator',
    'rca-native-ppt-designer',
    'rca-template-profiler',
  ];
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
    'visual_memory',
    'memory_writeback',
    'review_export_memory',
    'editable_pptx_grammar',
  ];
  const expectedTokens = [
    ...requiredVisualFailureTokens,
    ...methodTokens,
    'visual_density',
    'layout_quality',
    'ppt_review',
  ];
  const expectedResourceRefs = Object.fromEntries(
    expectedCapabilityIds.map((capabilityId) => [
      capabilityId,
      `agent/professional_skills/${capabilityId}/resources/minimal-resource-pack.md`,
    ]),
  );

  assert.equal(map.surface_kind, 'opl_standard_agent_capability_map');
  assert.equal(map.domain_capability_map_kind, 'rca_professional_capability_map');
  assert.equal(map.owner, 'redcube_ai');
  for (const key of [
    'skill_files_are_method_source_of_truth',
    'capability_map_is_routing_metadata_only',
    'skill_local_resource_pack_is_refs_only',
    'resource_pack_does_not_authorize_visual_truth',
    'resource_pack_does_not_authorize_export_or_quality_verdict',
    'resource_pack_does_not_write_runtime_state',
  ]) {
    assert.equal(map.professional_skill_policy[key], true, `policy.${key}`);
  }
  assert.equal(map.skill_local_resource_pack.pack_kind, 'rca_professional_skill_local_resource_pack');
  for (const key of [
    'refs_only',
    'does_not_authorize_visual_truth',
    'does_not_authorize_artifact_body',
    'does_not_authorize_owner_receipt',
    'does_not_authorize_quality_or_export_verdict',
    'does_not_write_runtime_state',
  ]) {
    assert.equal(map.skill_local_resource_pack[key], true, `resource_pack.${key}`);
  }
  assert.deepEqual(map.skill_local_resource_pack.required_sections, ['## Template', '## Example', '## Checklist']);
  const professionalCapabilities = map.capabilities.filter((entry) => (
    entry.surface_role === 'professional_skill'
    && expectedCapabilityIds.includes(entry.capability_id)
  ));
  assert.deepEqual(
    professionalCapabilities.map((entry) => entry.capability_id),
    expectedCapabilityIds,
  );
  for (const token of expectedTokens) {
    assert.equal(Boolean(map.feedback_token_index[token]), true, token);
  }
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

  for (const capabilityId of expectedCapabilityIds) {
    const expectedSkillRef = `agent/professional_skills/${capabilityId}/SKILL.md`;
    const expectedResourceRef = expectedResourceRefs[capabilityId];
    const resolverCapability = map.capabilities.find((entry) => entry.capability_id === capabilityId);
    assert.equal(Boolean(resolverCapability), true, capabilityId);
    assert.equal(resolverCapability.surface_role, 'professional_skill', capabilityId);
    assert.equal(resolverCapability.physical_source_ref.ref, expectedSkillRef, capabilityId);
    assert.equal(fs.existsSync(path.join(repoRoot, expectedSkillRef)), true, expectedSkillRef);
    assert.equal(
      resolverCapability.runtime_projection_refs.some((entry) => entry.ref === 'contracts/capability_map.json#/feedback_token_index'),
      true,
      capabilityId,
    );
    assert.equal(resolverCapability.owner_closeout_boundary_ref, 'contracts/capability_map.json#/ppt_visual_failure_token_contract/owner_closeout_boundary');
    assert.equal(resolverCapability.canonical_paths.includes(expectedSkillRef), true, capabilityId);
    assert.equal(resolverCapability.canonical_paths.includes(expectedResourceRef), true, capabilityId);
    assert.deepEqual(resolverCapability.resource_refs, [expectedResourceRef]);
    assert.equal(fs.existsSync(path.join(repoRoot, expectedResourceRef)), true, expectedResourceRef);
    assert.equal(resolverCapability.resource_pack_boundary_ref, 'contracts/capability_map.json#/skill_local_resource_pack');
    assert.equal(resolverCapability.verification_refs.includes('contracts/capability_map.json#/skill_local_resource_pack'), true);
    assert.equal(resolverCapability.verification_refs.includes('contracts/agent_lab_handoff.json#/visual_feedback_failure_fixture'), true);
    assert.equal(resolverCapability.forbidden_surfaces.includes('visual_truth_artifacts'), true, capabilityId);
    assert.equal(resolverCapability.forbidden_surfaces.includes('owner_receipts'), true, capabilityId);
    assertCapabilityRouterBoundary(resolverCapability.authority_boundary, `${capabilityId}.resolver`);
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

  for (const [token, capabilityId] of Object.entries({
    storyline: 'rca-ppt-story-architect',
    visual_review: 'rca-ppt-reviewer',
    native_pptx_editability: 'rca-native-ppt-designer',
    template_profile: 'rca-template-profiler',
    editable_pptx_grammar: 'rca-native-ppt-designer',
  })) {
    assert.equal(map.feedback_token_index[token].canonical_capability_ids.includes(capabilityId), true, token);
  }
  assert.equal(
    map.professional_skill_consolidation.template_profiler_merge_decision,
    'retain_separate_refs_only_professional_skill',
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
  assert.equal(handoff.dry_run_token_mapping_check.check_kind, undefined);
  assert.equal(handoff.dry_run_token_mapping_check.dry_run_only, undefined);
  assert.equal(handoff.dry_run_token_mapping_check.source_feedback, undefined);
  assert.equal(
    handoff.external_suite_improvement_policy.dry_run_token_mapping_check_ref,
    'contracts/agent_lab_handoff.json#/dry_run_token_mapping_check',
  );
  assert.equal(handoff.dry_run_token_mapping_check.capability_map_ref, 'contracts/capability_map.json#/dry_run_token_mapping_check');
  assert.equal(handoff.dry_run_token_mapping_check.feedback_token_index_ref, 'contracts/capability_map.json#/feedback_token_index');
  assert.equal(handoff.dry_run_token_mapping_check.token_cases_ref, 'contracts/capability_map.json#/dry_run_token_mapping_check/token_cases');
  assert.equal(handoff.dry_run_token_mapping_check.token_mappings_in_handoff, false);
  assert.equal(handoff.dry_run_token_mapping_check.required_observations, undefined);
  assert.equal(handoff.dry_run_token_mapping_check.forbidden_surfaces, undefined);
  assert.equal(handoff.dry_run_token_mapping_check.token_cases, undefined);

  for (const dryRunCase of map.dry_run_token_mapping_check.token_cases) {
    const token = dryRunCase.feedback_token;
    const tokenIndex = map.feedback_token_index[token];
    assert.equal(Boolean(tokenIndex), true, token);
    assert.deepEqual(dryRunCase.capability_ids, tokenIndex.canonical_capability_ids, token);
    assert.equal(
      dryRunCase.verification_refs.includes(
        'tests/rca-ppt-three-route-agent-lab-suite.test.js#RCA PPT dry-run feedback tokens resolve to professional skills without live artifacts',
      ),
      true,
      token,
    );

    for (const skillRef of dryRunCase.primary_skill_refs) {
      const skillPath = path.join(repoRoot, skillRef);
      assert.equal(fs.existsSync(skillPath), true, `${token}:${skillRef}`);
    }
  }

  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_write_domain_truth, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_mutate_artifact_body, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_sign_owner_receipt, false);
  assert.equal(handoff.dry_run_token_mapping_check.authority_boundary.can_authorize_quality_or_export, false);
}

function assertIncludesAll(values, expected, label) {
  for (const value of expected) {
    assert.equal(values.includes(value), true, `${label}:${value}`);
  }
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
  assert.deepEqual(suite.tasks.map((route) => route.primary_route), [
    'author_image_pages',
    'render_html',
    'author_pptx_native',
  ]);
  assertIncludesAll(suite.required_observations, [
    'task_manifests_observed',
    'recovery_probes_observed',
    'forbidden_authority_flags_all_false',
  ], 'required_observations');
  assert.equal(suite.native_pptx_real_route_probe.probe_state, 'retired_to_history_provenance');
  assert.equal(
    suite.native_pptx_real_route_probe.current_proof_command_ref,
    'opl agent-lab run --suite contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json --json',
  );
  assert.equal(JSON.stringify(suite).includes('scripts/run-real-route-evolution-probe.ts'), false);
  assertIncludesAll(suite.native_pptx_real_route_probe.required_report_observations, [
    'native_pptx_terminal_export_refs_observed',
    'agent_lab_run_report_ref_observed',
    'mock_visual_quality_claims_absent',
  ], 'native_pptx_real_route_probe.required_report_observations');
  assertIncludesAll(suite.target_runtime_consumption_refs, [
    'contracts/agent_lab_handoff.json#/external_suite_seeds/ppt_three_route_native_terminal_refs',
    'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json',
  ], 'target_runtime_consumption_refs');
  assert.equal(suite.target_runtime_consumption_refs.some((ref) => ref.startsWith('redcube domain-handler export#/')), false);
  assertIncludesAll(suite.target_verification_refs, [
    'target-verification:redcube-ai/product-manifest-read',
    'target-verification:redcube-ai/domain-handler-export-read',
    'target-verification:redcube-ai/real-native-pptx-product-entry-route-terminal-refs',
  ], 'target_verification_refs');
  assert.equal(suite.native_pptx_real_route_probe.product_entry_domain_route_required, true);
  assert.equal(suite.native_pptx_real_route_probe.task_intent, 'run_deliverable_route');
  assert.equal(suite.native_pptx_real_route_probe.terminal_route, 'export_pptx');
  assertIncludesAll(suite.native_pptx_real_route_probe.route_chain, [
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ], 'native_pptx_real_route_probe.route_chain');
  assertIncludesAll(suite.native_pptx_real_route_probe.terminal_evidence_required_ref_groups, [
    'editable_pptx',
    'pdf',
    'render_screenshots',
    'shape_manifest',
    'export_receipt',
    'artifact_gallery',
    'agent_lab_run_report',
  ], 'native_pptx_real_route_probe.terminal_evidence_required_ref_groups');
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('handwritten_pptx_script_as_workflow'), true);
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('mock_provider_visual_quality_claim'), true);
  assertRefsOnlyAuthorityBoundary(suite.authority_boundary, 'suite.authority_boundary');
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.records_refs_only, true);
  for (const key of ['writes_rca_visual_verdict', 'writes_owner_receipt', 'writes_artifact_body']) {
    assert.equal(suite.terminal_evidence_contract.agent_lab_role[key], false, `terminal_evidence_contract.${key}`);
  }
  assert.equal(suite.target_verification_refs.includes('target-verification:redcube-ai/mock-artifact-producing-ppt-three-route-export-bundles'), true);
  assert.equal(suite.artifact_sample_policy.sample_kind, 'mock_provider_artifact_producing_ppt_three_route_export');
  assert.equal(suite.artifact_sample_policy.proves_artifact_export_chain, true);
  assert.equal(suite.artifact_sample_policy.proves_visual_design_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.proves_visual_sample_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.can_claim_visual_ready, false);
  assert.equal(suite.artifact_sample_policy.proves_live_image_provider, false);
  assert.equal(suite.artifact_sample_policy.route_cases.length, 3);
  assertIncludesAll(suite.artifact_sample_refs, [
    'artifact-sample:path:publish/<deliverable>.pptx',
    'artifact-sample:path:publish/<deliverable>.pdf',
    'artifact-sample:path:artifacts/native_ppt/<deliverable>-shape-manifest.json',
    'artifact-sample:path:publish/artifact_gallery/index.json',
  ], 'artifact_sample_refs');
  assert.equal(suite.native_live_evidence_policy.required_for_native_visual_quality_claim, true);
  assert.equal(suite.native_live_evidence_policy.mock_provider_can_satisfy, false);
  assert.equal(suite.native_live_evidence_policy.agent_lab_records_refs_only, true);
  assertIncludesAll(suite.native_live_evidence_policy.required_terminal_routes, [
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ], 'native_live_evidence_policy.required_terminal_routes');
  assertIncludesAll(suite.native_live_evidence_policy.required_artifact_refs, [
    'editable_pptx_file',
    'render_preview_screenshot_png',
    'artifact_gallery_index_file',
  ], 'native_live_evidence_policy.required_artifact_refs');
  assertIncludesAll(suite.accepted_terminal_shapes, ['domain_receipt', 'typed_blocker'], 'accepted_terminal_shapes');
  assert.equal(suite.not_authorized_claims.includes('visual_ready'), true);
  assert.equal(suite.not_authorized_claims.includes('production_soak_complete'), true);

  const task = suite.tasks[0];
  assert.equal(task.task_id, 'agent-lab-task:rca/ppt-three-route/default-image-first');
  assert.equal(task.scorecard.score_is_rca_visual_verdict, false);
  assert.equal(task.scorecard.claims_exportable, false);
  assert.equal(task.promotion_gate.gate_status, 'passed');
  assert.equal(task.promotion_gate.regression_suite_refs.includes('tests/rca-ppt-three-route-agent-lab-suite.test.js'), true);
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
        assert.equal(screenshot.visual_memory_proposal.status, 'skip');
        assert.equal(screenshot.visual_memory_proposal.non_blocking, true);
        assert.equal(screenshot.visual_memory_proposal.proposal_candidate, null);
        assert.equal(exported.export_bundle.visual_memory_proposal.status, 'skip');
        assert.equal(exported.status, 'completed');
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

test('screenshot summary creates one non-authority memory candidate that export preserves without signing', SERIAL_ENV_TEST, async () => {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_IMAGE_GENERATION_MOCK: '1',
    REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'visual_memory_candidate',
  });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-ppt-memory-proposal-');
      const results = await runPptVisualRoute({
        workspaceRoot,
        deliverableId: 'deck-memory-candidate',
        visualRoute: 'author_pptx_native',
      });
      const screenshot = artifactFor(results, 'screenshot_review');
      const exported = artifactFor(results, 'export_pptx');
      const proposal = screenshot.visual_memory_proposal;
      const forwarded = exported.export_bundle.visual_memory_proposal;

      assert.equal(proposal.status, 'proposal_candidate');
      assert.equal(proposal.non_authority, true);
      assert.equal(proposal.non_blocking, true);
      assert.equal(proposal.accept_reject_status, 'pending_rca_memory_owner');
      assert.deepEqual(proposal.accept_reject_receipt_refs, []);
      assert.equal(proposal.proposal_candidate.evidence_slide_ids.length, 1);
      assert.equal(
        proposal.proposal_candidate.evidence_refs.includes(screenshot.review_export_refs[0]),
        true,
      );
      assert.deepEqual(forwarded.proposal_candidate, proposal.proposal_candidate);
      assert.equal(forwarded.terminal_binding.review_export_refs.includes(screenshot.review_export_refs[0]), true);
      assert.equal(forwarded.terminal_binding.review_export_refs.includes(exported.review_export_refs[0]), true);
      assert.equal(exported.owner_receipt_refs.includes(proposal.proposal_candidate.proposal_ref), false);
      assert.deepEqual(forwarded.accept_reject_receipt_refs, []);
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
