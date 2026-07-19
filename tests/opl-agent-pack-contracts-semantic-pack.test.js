import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertCleanAgentRepoPathRef,
  readJson,
  repoRoot,
} from './helpers/opl-agent-pack-contracts.js';

const EXPECTED_STAGE_DISPLAY_NAMES = {
  source_intake: { 'en-US': 'Source intake', 'zh-CN': '资料接收与梳理' },
  communication_strategy: { 'en-US': 'Communication strategy', 'zh-CN': '传播策略' },
  visual_direction: { 'en-US': 'Visual direction', 'zh-CN': '视觉方向' },
  artifact_creation: { 'en-US': 'Artifact creation', 'zh-CN': '视觉成果制作' },
  review_and_revision: { 'en-US': 'Review and revision', 'zh-CN': '评审与修订' },
  package_and_handoff: { 'en-US': 'Package and handoff', 'zh-CN': '打包与交付' },
};

const EXPECTED_STAGE_CATALOG = {
  source_kind: 'agent_repo_relative_json',
  relative_path: 'agent/stages/manifest.json',
  items_pointer: '/stages',
  field_map: {
    stage_id: 'stage_id',
    display_name: 'title',
    display_names: 'display_names',
  },
};

function dependencyClosure(scope) {
  const sourcesByDependent = new Map();
  for (const edge of scope.dependency_edges) {
    const sources = sourcesByDependent.get(edge.dependent_ref) ?? [];
    sourcesByDependent.set(edge.dependent_ref, [...sources, edge.source_ref]);
  }
  const closure = new Set(scope.reviewed_node_refs);
  const pending = [...scope.reviewed_node_refs];
  while (pending.length > 0) {
    const dependentRef = pending.pop();
    for (const sourceRef of sourcesByDependent.get(dependentRef) ?? []) {
      if (closure.has(sourceRef)) continue;
      closure.add(sourceRef);
      pending.push(sourceRef);
    }
  }
  return closure;
}

function invalidatedScopeIds(adoption, change) {
  if (!change.semantic_changed || change.change_class === 'locator_only') return [];
  return adoption.review_scopes
    .filter((scope) => dependencyClosure(scope).has(change.node_ref))
    .map((scope) => scope.scope_id);
}

test('RCA canonical semantic pack remains concrete while root stage/pack contracts are refs-only', () => {
  const packRefs = readJson('contracts/pack_compiler_input.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const stageManifest = readJson('agent/stages/manifest.json');

  assert.equal(packRefs.canonical_semantic_pack_root, 'agent/');
  assert.equal(packRefs.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.equal(packRefs.projection_mode, 'repo_source_refs_only');
  assert.equal(stageManifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(stageManifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');
  assert.deepEqual(domainDescriptor.standard_agent_interface, {
    version: 'opl_standard_agent_interface.v1',
    ref_kind: 'repo_json_pointer',
    ref: 'contracts/standard_agent_interface.json#/standard_agent_interface',
    projection_ref: 'opl_generated:standard_agent_interface',
    stage_catalog: EXPECTED_STAGE_CATALOG,
  });

  for (const relativePath of packRefs.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  assert.deepEqual(
    stageManifest.stages.map((stage) => stage.stage_id),
    Object.keys(EXPECTED_STAGE_DISPLAY_NAMES),
  );

  for (const stage of stageManifest.stages) {
    const stageId = stage.stage_id;
    const expectedNames = EXPECTED_STAGE_DISPLAY_NAMES[stageId];

    assert.equal(typeof stage.display_names, 'object', `${stageId}.display_names`);
    assert.deepEqual({
      'en-US': stage.display_names?.['en-US'],
      'zh-CN': stage.display_names?.['zh-CN'],
    }, expectedNames, `${stageId}.display_names`);
    assert.equal(stage.title, stage.display_names['en-US'], `${stageId}.title`);
    assertCleanAgentRepoPathRef(
      { ref_kind: 'repo_path', ref: `agent/prompts/${stageId}.md` },
      'agent/prompts/',
      `${stageId}.prompt_ref`,
    );
    assertCleanAgentRepoPathRef(
      { ref_kind: 'repo_path', ref: `agent/stages/${stageId}.md` },
      'agent/stages/',
      `${stageId}.stage_ref`,
    );
  }

  assert.equal(stageManifest.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageManifest.authority_boundary.provider_completion_is_domain_completion, false);
  assert.equal(packRefs.source_refs.stage_graph_source_ref, 'agent/stages/manifest.json');
});

test('RCA opts into the canonical quality profile with one independent primary-only Meta Review', () => {
  const stageManifest = readJson('agent/stages/manifest.json');
  const qualityPolicy = readJson('contracts/stage_quality_cycle_policy.json');
  const metaReviewStage = stageManifest.stages.find(
    (stage) => stage.stage_role === 'cross_stage_meta_review',
  );

  assert.equal(
    stageManifest.quality_governance_profile_ref,
    'contracts/opl-framework/official-knowledge-deliverable-quality-profile.json',
  );
  assert.equal(
    stageManifest.meta_review_policy_ref,
    'contracts/stage_quality_cycle_policy.json#/meta_review_policy',
  );
  assert.equal('stage_quality_cycle_profile_ref' in stageManifest, false);
  assert.equal('meta_review_stage_ref' in stageManifest, false);
  assert.equal('meta_review' in qualityPolicy, false);
  assert.deepEqual(qualityPolicy.meta_review_policy, {
    stage_id: 'review_and_revision',
    stage_role: 'cross_stage_meta_review',
    independent_stage_run_required: true,
    primary_attempt_role: 'producer',
    no_context_inheritance: true,
    max_route_back_rounds: 3,
    terminal_route_output: 'route_impact.stage_route_decision',
    terminal_route_owner: 'producer',
    allowed_verdicts: [
      'pass',
      'route_back',
      'completed_with_quality_debt',
      'human_gate',
      'typed_blocker',
    ],
    route_back_targets: [
      'source_intake',
      'communication_strategy',
      'visual_direction',
      'artifact_creation',
    ],
    multiple_defect_policy: 'route_to_earliest_stage_that_can_close_root_cause',
    downstream_review_currentness_policy: 'declared_epistemic_dependency_closure_only',
    downstream_release_integrity_policy: 'separate_exact_byte_contract',
  });
  assert.equal(metaReviewStage?.stage_id, 'review_and_revision');
  assert.equal(
    qualityPolicy.stage_policies[metaReviewStage.stage_id].formal_review.required,
    false,
  );
});

test('package handoff prompt keeps the quality loop under the StageRun controller', () => {
  const prompt = fs.readFileSync(
    path.join(repoRoot, 'agent/prompts/package_and_handoff.md'),
    'utf8',
  );

  assert.doesNotMatch(prompt, /Run the focused formal quality loop/);
  assert.match(prompt, /controller-managed formal quality loop/);
  assert.match(prompt, /current executor call performs only its injected Attempt role/);
  assert.match(prompt, /must not run the whole sequence or create the next StageAttempt/);
  assert.match(prompt, /Only the OPL StageRunController creates each fresh role Attempt/);
  assert.match(prompt, /producer -> reviewer -> repairer -> re_reviewer/);
});

test('RCA Review routes cross-Stage repairs early without bypassing local repair or visual order', () => {
  const policy = readJson('contracts/stage_quality_cycle_policy.json');
  const routePolicy = policy.finding_and_repair_contract.route_output_policy;
  const rolePrompt = fs.readFileSync(
    path.join(repoRoot, 'agent/prompts/stage-quality-cycle-roles.md'),
    'utf8',
  );
  const handoffPrompt = fs.readFileSync(
    path.join(repoRoot, 'agent/prompts/package_and_handoff.md'),
    'utf8',
  );
  const artifactPrompt = fs.readFileSync(
    path.join(repoRoot, 'agent/prompts/artifact_creation.md'),
    'utf8',
  );

  assert.deepEqual(policy.cross_stage_route_selection, {
    primary_only_decisive_attempt_role: 'producer',
    formal_review_decisive_attempt_roles: ['reviewer', 're_reviewer'],
    repairer_can_be_decisive_attempt: false,
    producer_can_be_decisive_attempt_in_formal_review: false,
    repair_required_review_or_re_review_may_select_cross_stage_route_back_before_budget_exhaustion: true,
    repair_required_cross_stage_route_back_requires_target_different_from_current_stage: true,
    repair_required_review_or_re_review_may_select_other_terminal_route_before_budget_exhaustion: false,
    repair_required_review_or_re_review_may_select_terminal_route_after_budget_exhaustion: true,
    same_stage_repair_required_with_budget_remaining_continues_quality_loop: true,
    cross_stage_route_back_requires_narrowest_canonical_owner_stage: true,
  });
  assert.deepEqual(routePolicy, {
    pass: 'terminal_stage_route_decision',
    quality_debt: 'terminal_stage_route_decision',
    same_stage_repair_required: 'continue_quality_loop_with_stage_route_recommendation',
    cross_stage_route_back_before_budget_exhaustion: 'terminal_stage_route_decision',
    repair_required_at_budget_exhaustion_with_consumable_artifact:
      'terminal_stage_route_decision_and_completed_with_quality_debt',
    repair_required_at_budget_exhaustion_without_consumable_artifact:
      'no_stage_route_decision_and_typed_blocker',
    blocked_or_human_gate: 'no_stage_route_decision',
  });
  for (const section of [
    rolePrompt.match(/## Reviewer\n\n([\s\S]*?)\n\n## Repairer/)?.[1] ?? '',
    rolePrompt.match(/## Re Reviewer\n\n([\s\S]*)$/)?.[1] ?? '',
  ]) {
    assert.match(section, /`same_stage_repair_required`/);
    assert.match(section, /`cross_stage_route_back_before_budget_exhaustion`/);
    assert.match(section, /different declared Stage is the narrowest owner/);
    assert.match(section, /decision_kind=route_back/);
    assert.match(section, /target_stage_id.*different from the current Stage/);
    assert.match(section, /only terminal route permitted.*while budget remains/);
    assert.match(section, /zero consumable artifact returns no Stage route decision or recommendation/);
  }
  assert.match(handoffPrompt, /`same_stage_repair_required`/);
  assert.match(handoffPrompt, /`cross_stage_route_back_before_budget_exhaustion`/);
  assert.match(handoffPrompt, /package-local defect with repair budget remaining returns only a recommendation/);
  assert.match(handoffPrompt, /upstream-owned defect may instead terminate this StageRun/);
  assert.match(handoffPrompt, /exact-ref-and-hash no-output diagnostic/);
  assert.match(handoffPrompt, /diagnostic remains consumable and may support that owner route/);
  assert.match(handoffPrompt, /neither candidate nor diagnostic exists/);
  assert.match(
    artifactPrompt,
    /candidate -> render\/mechanical evidence -> visual-director QA -> screenshot QA -> targeted repair -> rerender -> fresh re-review/,
  );
  assert.deepEqual(policy.professional_sequence.ppt_visual_quality_loop, [
    'candidate',
    'render_and_mechanical_evidence',
    'visual_director_route_qa_evidence',
    'screenshot_route_qa_evidence',
    'targeted_repair',
    'rerender',
    'fresh_re_review',
  ]);
});

test('RCA adopts OPL epistemic currentness without replacing StageAttempt or repair-loop ownership', () => {
  const policy = readJson('contracts/stage_quality_cycle_policy.json');
  const receipt = readJson('contracts/owner_receipt_contract.json');
  const adoption = policy.epistemic_review_currentness;
  const epistemicRef = 'contracts/stage_quality_cycle_policy.json#/epistemic_review_currentness';

  assert.equal(
    adoption.framework_contract_ref,
    'opl-framework:contracts/opl-framework/epistemic-review-currentness-contract.json',
  );
  assert.equal(adoption.evidence_profile, 'epistemic_provenance');
  assert.equal(adoption.trust_model, 'trusted_local_workspace');
  assert.deepEqual(adoption.stage_attempt_reuse, {
    formal_review_uses_existing_opl_stage_attempt_roles: true,
    fresh_re_review_uses_opl_stage_attempt: true,
    currentness_evaluation_creates_stage_attempt: false,
    rca_parallel_attempt_runtime_allowed: false,
    quality_budget_ref: '#/quality_budget',
    finding_and_repair_contract_ref: '#/finding_and_repair_contract',
  });
  assert.equal(policy.quality_budget.max_repair_rounds, 3);
  assert.equal(
    Object.values(policy.stage_policies)
      .filter((stagePolicy) => stagePolicy.formal_review.required)
      .every((stagePolicy) => stagePolicy.formal_review.max_repair_rounds === 3),
    true,
  );
  assert.equal(
    policy.finding_and_repair_contract.ordinary_new_suggestion_policy,
    'optional_observation_without_reopening_loop',
  );
  assert.equal(policy.finding_and_repair_contract.pass_with_optional_observations_allowed, true);
  for (const stageId of ['artifact_creation', 'review_and_revision', 'package_and_handoff']) {
    assert.ok(policy.stage_policies[stageId].quality_rubric_refs.includes(epistemicRef), stageId);
  }
  assert.equal(
    receipt.formal_stage_review_handoff_policy.exact_artifact_identity_binding_role,
    'transport_identity_and_release_integrity_not_epistemic_content_authority',
  );
  assert.equal(
    receipt.formal_stage_review_handoff_policy.release_integrity_is_separate_from_epistemic_review,
    true,
  );

  assert.deepEqual(adoption.review_scopes.map((scope) => scope.scope_id), [
    'rca.slide_content',
    'rca.slide_references',
    'rca.visual_layout_and_render',
    'rca.export_artifact',
    'rca.delivery_package',
  ]);
  for (const scope of adoption.review_scopes) {
    const nodeRefs = new Set(scope.nodes.map((node) => node.node_ref));
    assert.equal(scope.surface_kind, 'opl_epistemic_review_scope', scope.scope_id);
    assert.equal(scope.version, 'opl-epistemic-review-scope.v2', scope.scope_id);
    assert.equal(scope.evidence_profile, 'epistemic_provenance', scope.scope_id);
    assert.equal(scope.trust_model, 'trusted_local_workspace', scope.scope_id);
    assert.equal(nodeRefs.size, scope.nodes.length, scope.scope_id);
    assert.equal(
      scope.dependency_edges.every(
        (edge) => nodeRefs.has(edge.source_ref) && nodeRefs.has(edge.dependent_ref),
      ),
      true,
      scope.scope_id,
    );
    assert.deepEqual(scope.authority_boundary, {
      hash_is_locator_or_stale_hint_only: true,
      hash_is_content_authority: false,
      release_integrity_is_separate: true,
      framework_can_issue_domain_verdict: false,
    });
  }
});

test('layout render export and package-only deltas preserve content and reference Review', () => {
  const adoption = readJson('contracts/stage_quality_cycle_policy.json').epistemic_review_currentness;
  const displayAndDownstream = [
    'rca.visual_layout_and_render',
    'rca.export_artifact',
    'rca.delivery_package',
  ];

  for (const [nodeRef, changeClass] of [
    ['rca:visual_layout', 'layout'],
    ['rca:render_template', 'render_template'],
    ['rca:rendered_slide', 'visual_content'],
  ]) {
    assert.deepEqual(invalidatedScopeIds(adoption, {
      node_ref: nodeRef,
      change_class: changeClass,
      semantic_changed: true,
    }), displayAndDownstream, nodeRef);
  }
  assert.deepEqual(invalidatedScopeIds(adoption, {
    node_ref: 'rca:export_artifact',
    change_class: 'package_composition',
    semantic_changed: true,
  }), ['rca.export_artifact', 'rca.delivery_package']);
  assert.deepEqual(invalidatedScopeIds(adoption, {
    node_ref: 'rca:delivery_package',
    change_class: 'package_wrapper',
    semantic_changed: true,
  }), ['rca.delivery_package']);
});

test('content claim and reference deltas invalidate only their declared dependents', () => {
  const adoption = readJson('contracts/stage_quality_cycle_policy.json').epistemic_review_currentness;

  assert.deepEqual(invalidatedScopeIds(adoption, {
    node_ref: 'rca:slide_content',
    change_class: 'context',
    semantic_changed: true,
  }), [
    'rca.slide_content',
    'rca.visual_layout_and_render',
    'rca.export_artifact',
    'rca.delivery_package',
  ]);
  for (const [nodeRef, changeClass] of [
    ['rca:slide_claim', 'claim'],
    ['rca:citation_linkage', 'citation_linkage'],
    ['rca:reference_source', 'reference_source'],
  ]) {
    assert.deepEqual(
      invalidatedScopeIds(adoption, {
        node_ref: nodeRef,
        change_class: changeClass,
        semantic_changed: true,
      }),
      adoption.review_scopes.map((scope) => scope.scope_id),
      nodeRef,
    );
  }
});

test('hash-only locator drift is not epistemic authority or release-integrity substitution', () => {
  const adoption = readJson('contracts/stage_quality_cycle_policy.json').epistemic_review_currentness;

  assert.deepEqual(invalidatedScopeIds(adoption, {
    node_ref: 'rca:slide_claim',
    change_class: 'locator_only',
    semantic_changed: true,
  }), []);
  assert.equal(adoption.currentness_policy.hash_change_alone_invalidates_review, false);
  assert.equal(adoption.integrity_separation.exact_hash_is_content_claim_or_reference_authority, false);
  assert.equal(adoption.integrity_separation.release_integrity_is_separate_contract, true);
  assert.equal(adoption.integrity_separation.release_integrity_can_replace_epistemic_review, false);
  assert.equal(adoption.integrity_separation.epistemic_review_can_replace_release_integrity, false);
});

test('RCA capability map routes visual feedback fixtures through declarative professional skills', () => {
  const capabilityMap = readJson('contracts/capability_map.json');
  const handoff = readJson('contracts/agent_lab_handoff.json');
  const capabilities = new Map(
    capabilityMap.capabilities.map((entry) => [entry.capability_id, entry]),
  );
  const sharedPolicy = capabilityMap.capability_policy_profiles.rca_refs_only_router;

  assert.equal(handoff.agent_lab_owner, 'one-person-lab');
  assert.equal(handoff.authority_boundary.domain_repo_can_own_agent_lab_runtime, false);
  assert.equal(sharedPolicy.authority_boundary.can_write_domain_truth, false);
  assert.equal(sharedPolicy.authority_boundary.can_authorize_quality_or_export, false);
  assert.equal(sharedPolicy.owner_closeout_boundary.can_write_owner_receipt_body, false);
  assert.equal(sharedPolicy.owner_closeout_boundary.can_create_typed_blocker, false);
  assert.equal(capabilityMap.capabilities.every(
    (entry) => entry.capability_policy_profile_ref === '#/capability_policy_profiles/rca_refs_only_router',
  ), true);
  assert.equal(capabilityMap.capabilities.some((entry) => Object.hasOwn(entry, 'authority_boundary')), false);
  for (const token of handoff.visual_feedback_failure_fixture.tokens) {
    const mapping = capabilityMap.feedback_token_index[token];
    assert.ok(mapping, token);
    assert.notDeepEqual(mapping.canonical_capability_ids, [], token);
    for (const capabilityId of mapping.canonical_capability_ids) {
      const capability = capabilities.get(capabilityId);
      assert.ok(capability, `${token}:${capabilityId}`);
      assert.equal(capability.surface_role, 'professional_skill');
      assertCleanAgentRepoPathRef(
        capability.physical_source_ref,
        'agent/professional_skills/',
        `${token}:${capabilityId}`,
      );
    }
  }
});

test('RCA provider-hosted evidence task declares its domain-owned stage binding', () => {
  const receiptContract = readJson('contracts/owner_receipt_contract.json');
  const binding = receiptContract.provider_hosted_task_stage_bindings.emit_no_regression_evidence;

  assert.equal(binding.runtime_domain_id, 'redcube');
  assert.equal(binding.stage_id, 'controlled_visual_stage_attempt');
  assert.equal(binding.stage_semantics_ref, 'contracts/owner_receipt_contract.json#/receipt_cases/5');
  assert.equal(binding.provider_hosted_stage_attempt_required, true);
  assert.equal(binding.domain_stage_semantics_owner, 'redcube_ai');
  assert.equal(receiptContract.receipt_cases[5].generator_action, 'emit_no_regression_evidence');
  assert.equal(receiptContract.receipt_cases[5].attempt_ref, '/controlled_visual_stage_attempt');
});

test('RCA capability map dry-run tokens resolve without private runtime callers', () => {
  const capabilityMap = readJson('contracts/capability_map.json');
  const dryRun = capabilityMap.dry_run_token_mapping_check;

  assert.equal(dryRun.dry_run_only, true);
  assert.equal(dryRun.invokes_live_provider, false);
  assert.equal(dryRun.writes_runtime_state, false);
  for (const tokenCase of dryRun.token_cases) {
    assert.ok(capabilityMap.feedback_token_index[tokenCase.feedback_token], tokenCase.feedback_token);
    for (const skillRef of tokenCase.primary_skill_refs) {
      assertCleanAgentRepoPathRef(
        { ref_kind: 'repo_path', ref: skillRef },
        'agent/professional_skills/',
        `${tokenCase.feedback_token}:${skillRef}`,
      );
    }
  }
});
