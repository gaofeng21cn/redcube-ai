import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildVisualPackCompilerHandoffProjection } from '../packages/redcube-domain-entry/dist/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredStagePackSections = [
  'prompt_refs',
  'skill_refs',
  'tool_refs',
  'tool_affordance_boundary',
  'knowledge_refs',
  'quality_gate_refs',
  'strategy_refs',
  'candidate_pool_policy',
  'independent_gate_policy',
  'handoff_policy',
];

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function refs(entries: any[]): Set<string> {
  return new Set(entries.map((entry) => entry.ref));
}

test('RCA pack declares advisory cognitive-kernel contracts', () => {
  const pack = readJson('contracts/pack_compiler_input.json');
  const adoption = readJson('contracts/cognitive_kernel_adoption.json');
  const golden = readJson('contracts/golden_path_profile.json');

  assert.deepEqual(pack.stage_pack_required_sections, requiredStagePackSections);
  assert.equal(pack.cognitive_kernel_adoption_ref, 'contracts/cognitive_kernel_adoption.json');
  assert.equal(pack.golden_path_profile_ref, 'contracts/golden_path_profile.json');
  assert.ok(pack.declarative_domain_pack.includes('tool_affordance_catalog'));
  assert.ok(pack.required_domain_pack_paths.includes('agent/tools/domain_affordances.md'));
  assert.equal(fs.existsSync(path.join(repoRoot, 'agent/tools/domain_affordances.md')), true);

  assert.deepEqual(pack.tool_refs, [
    {
      ref: 'agent/tools/domain_affordances.md',
      ref_kind: 'repo_path',
      role: 'domain_tool_affordance_catalog',
      catalog_role: 'available_affordance_catalog_not_workflow_script',
    },
  ]);

  const packBoundary = pack.cognitive_stage_pack_contract.tool_affordance_boundary;
  assert.equal(packBoundary.catalog_role, 'available_affordance_catalog_not_workflow_script');
  assert.equal(packBoundary.executor_autonomy.executor_can_choose_order_and_parallelism, true);
  assert.equal(packBoundary.executor_autonomy.tool_catalog_can_prescribe_tool_sequence, false);
  assert.equal(refs(packBoundary.forbidden_authority_refs).has('review_verdict_without_rca_owner_receipt'), true);

  assert.equal(adoption.state, 'advisory_current_contract');
  assert.equal(adoption.domain_id, 'redcube_ai');
  assert.deepEqual(adoption.stage_pack_required_sections, requiredStagePackSections);
  assert.equal(adoption.adoption_policy.advisory_not_launch_hard_gate, true);
  assert.equal(adoption.authority_boundary.opl_can_claim_domain_ready, false);
  assert.equal(adoption.authority_boundary.same_attempt_self_review_can_close_quality_gate, false);

  assert.equal(golden.surface_kind, 'opl_golden_path_profile');
  assert.equal(golden.schema_version, 'golden-path-profile.v1');
  assert.equal(golden.profile_id, 'redcube-ai.golden-path');
  assert.equal(golden.domain, 'redcube_ai');
  assert.equal(golden.default_outer_loop, 'current_owner_delta');
  assert.equal(golden.stage_attempt_strategy, 'cognitive_kernel_stage_internal');
  assert.deepEqual(golden.ordinary_path, {
    path_id: 'redcube-ai_ordinary_default',
    path_role: 'ordinary_default',
    stage_refs: [
      'source_intake',
    ],
  });
  assert.deepEqual(golden.explicit_variants, []);
  assert.equal(golden.default_surface_policy.ordinary_route_count, 1);
  assert.equal(golden.authority_boundary.variant_can_be_default_without_explicit_selection, false);
  assert.ok(golden.required_closeout_refs.includes('owner_receipt_ref_or_typed_blocker_ref'));
  assert.ok(golden.forbidden_claims.includes('tool_catalog_prescribes_executor_sequence'));
});

test('RCA visual pack compiler handoff exposes cognitive-kernel refs-only inputs', () => {
  const input = buildVisualPackCompilerHandoffProjection().declarative_visual_pack_input;
  const contract = input.cognitive_stage_pack_contract;

  assert.deepEqual(contract.required_stage_sections, requiredStagePackSections);
  assert.equal(contract.refs_only, true);
  assert.equal(contract.user_visible_flow_changed, false);
  assert.equal(contract.launch_hard_gate, false);
  assert.deepEqual(contract.domain_affordance_catalog_ref, {
    ref: 'agent/tools/domain_affordances.md',
    ref_kind: 'repo_path',
    role: 'domain_tool_affordance_catalog',
    catalog_role: 'available_affordance_catalog_not_workflow_script',
  });
  assert.equal(contract.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(contract.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(contract.authority_boundary.same_attempt_self_review_can_close_quality_gate, false);

  assert.ok(input.required_input_families.includes('tool_affordance_catalog'));
  assert.ok(input.required_input_families.includes('cognitive_kernel_adoption_contract'));
  assert.ok(input.required_input_families.includes('golden_path_profile'));
  assert.ok(input.required_domain_pack_paths.includes('agent/tools/domain_affordances.md'));
  assert.deepEqual(input.source_refs.filter((entry: any) => (
    entry.source_id === 'cognitive_kernel_adoption'
    || entry.source_id === 'golden_path_profile'
    || entry.source_id === 'domain_tool_affordance_catalog'
    || entry.source_id === 'professional_specialist_skill_pack'
  )), [
    { source_id: 'cognitive_kernel_adoption', ref: 'contracts/cognitive_kernel_adoption.json' },
    { source_id: 'golden_path_profile', ref: 'contracts/golden_path_profile.json' },
    { source_id: 'domain_tool_affordance_catalog', ref: 'agent/tools/domain_affordances.md' },
    { source_id: 'professional_specialist_skill_pack', ref: 'agent/professional_skills/' },
  ]);
});

test('RCA stage control plane declares tool boundaries and independent gates', () => {
  const plane = readJson('contracts/stage_control_plane.json');
  const adoption = readJson('contracts/cognitive_kernel_adoption.json');
  const adoptionBoundary = adoption.tool_affordance_boundary;

  assert.equal(plane.cognitive_kernel_adoption_ref, 'contracts/cognitive_kernel_adoption.json');
  assert.equal(plane.golden_path_profile_ref, 'contracts/golden_path_profile.json');
  assert.deepEqual(plane.stage_pack_required_sections, requiredStagePackSections);

  for (const [index, stage] of plane.stages.entries()) {
    assert.equal(stage.tool_refs[0].ref, 'agent/tools/domain_affordances.md');
    assert.equal(stage.tool_refs[0].catalog_role, 'available_affordance_catalog_not_workflow_script');

    assert.equal(
      stage.stage_contract.tool_affordance_boundary_ref,
      `contracts/stage_control_plane.json#/stages/${index}/tool_affordance_boundary`,
    );
    assert.equal(refs(adoptionBoundary.capability_refs).has('source_context_and_visual_brief_reading'), true);
    assert.equal(adoptionBoundary.executor_autonomy.executor_can_choose_tools, true);
    assert.equal(adoptionBoundary.executor_autonomy.tool_catalog_can_define_cognitive_strategy, false);
    assert.equal(adoptionBoundary.executor_autonomy.tool_catalog_can_authorize_forbidden_write, false);

    assert.equal(
      stage.stage_contract.candidate_pool_policy_ref,
      `contracts/stage_control_plane.json#/stages/${index}/candidate_pool_policy`,
    );
    assert.ok(stage.strategy_refs.length > 0);
    assert.equal(
      stage.stage_contract.handoff_policy_ref,
      `contracts/stage_control_plane.json#/stages/${index}/handoff_policy`,
    );

    const declaredGateRefs = new Set(stage.evaluation.map((entry: any) => entry.ref));
    assert.equal(declaredGateRefs.size > 0, true);
    assert.equal(
      stage.stage_contract.independent_gate_policy_ref,
      `contracts/stage_control_plane.json#/stages/${index}/independent_gate_policy`,
    );
  }
});
