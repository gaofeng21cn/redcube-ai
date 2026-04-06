import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT,
  P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT,
  P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES,
  P19_TEAM_GATE_CONTRACT,
  buildCreativeOwnershipResidueAudit,
} from '../packages/redcube-runtime/src/index.js';
import { buildCreativeOwnershipAudit } from '../scripts/p19-creative-ownership-audit-lib.mjs';

const STATUS_FILE = path.resolve('.omx/reports/redcube-runtime-program/P19_CREATIVE_OWNERSHIP_STATUS.json');

function writeStatus() {
  const audit = buildCreativeOwnershipResidueAudit();
  const closeout = buildCreativeOwnershipAudit();
  const status = {
    program: 'P19',
    current_milestone: 'P19.A',
    current_mode: 'ralph',
    macro_lifecycle_stage: 'shared_lifecycle_freeze',
    shared_execution_contract: audit.shared_execution_contract,
    unified_lifecycle: audit.unified_lifecycle,
    residue_by_family: audit.families,
    team_lane_contract: closeout.team_lane_contract,
    team_gate: {
      satisfied: closeout.team_gate.missing_gates.length === 0,
      missing_gates: closeout.team_gate.missing_gates,
    },
  };
  mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  writeFileSync(STATUS_FILE, `${JSON.stringify(status, null, 2)}\n`, 'utf-8');
  return JSON.parse(readFileSync(STATUS_FILE, 'utf-8'));
}

test('P19.A freezes Codex-native host-agent as the formal primary creative executor', () => {
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.program, 'P19');
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.milestone, 'P19.A');
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.adapter, 'host_agent');
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.runtime, 'codex_native_host_agent');
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.adapter_roles.host_agent, 'formal_primary_executor');
  assert.equal(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.adapter_roles.external_llm, 'optional_compatibility_adapter');
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.optional_compatibility_adapters, ['external_llm']);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.protected_creative_routes.xiaohongshu.story_architecture, ['storyline', 'single_note_plan']);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.protected_creative_routes.ppt_deck.visual_authorship, ['visual_direction', 'render_html']);
});

test('P19.A freezes unified lifecycle alignment, review overlay, and research ownership semantics', () => {
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.macro_lifecycle, [
    'source_readiness',
    'story_architecture',
    'visual_authorship',
    'delivery_packaging',
  ]);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.review_overlay, ['visual_director_review', 'screenshot_review']);
  assert.equal(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.research_ownership.semantic_role, 'shared_source_readiness_augmentation');
  assert.equal(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.research_ownership.trigger_conditions.length >= 4, true);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.family_mapping.xiaohongshu.story_architecture, ['storyline', 'single_note_plan']);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.family_mapping.xiaohongshu.delivery_packaging, ['publish_copy', 'export_bundle']);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.family_mapping.ppt_deck.story_architecture, ['storyline', 'detailed_outline', 'slide_blueprint']);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.family_mapping.ppt_deck.review_overlay, ['visual_director_review', 'screenshot_review']);
});

test('P19.A freezes the creative ownership forbidden boundary for both families', () => {
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.allowed_code_responsibilities, [
    'contract',
    'validation',
    'shell_boundary',
    'audit',
    'governance',
    'artifact_persistence',
    'review_rerun_publish_gates',
  ]);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.forbidden_code_authorship.xiaohongshu, [
    'page_core_content',
    'visual_direction_major_expression',
    'recipe_selection',
    'final_html_markup',
    'publish_copy_body',
    'visual_director_review_decision',
  ]);
  assert.deepEqual(P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.forbidden_code_authorship.ppt_deck, [
    'outline_major_text',
    'blueprint_major_text',
    'visual_direction_major_expression',
    'final_html_markup',
    'visual_director_review_decision',
  ]);
});

test('P19.A freezes lane write scopes by unified lifecycle before any short-lived team opens', () => {
  assert.deepEqual(P19_TEAM_GATE_CONTRACT.required_gates, [
    'shared_contract_frozen',
    'shared_lifecycle_contract_frozen',
    'research_ownership_frozen',
    'ppt_visual_director_review_contract_frozen',
    'lifecycle_alignment_red_tests_written',
    'lane_write_scopes_by_shared_lifecycle',
    'independent_verification_defined',
    'final_convergence_order_defined',
  ]);
  assert.deepEqual(
    P19_TEAM_GATE_CONTRACT.candidate_lanes.map((lane) => lane.lane_id),
    [
      'shared_lifecycle_review_overlay_convergence',
      'xiaohongshu_creative_ownership_recovery',
      'ppt_deck_creative_ownership_recovery',
      'red_tests_regression_audit_closeout',
    ],
  );
  assert.deepEqual(
    P19_TEAM_GATE_CONTRACT.candidate_lanes[0].write_scopes,
    [
      'packages/redcube-runtime/src/creative-ownership.js',
      'scripts/p19-creative-ownership-audit-lib.mjs',
      'tests/p19-creative-ownership-freeze.test.js',
      'tests/creative-ownership-recovery-audit.test.js',
    ],
  );
  assert.deepEqual(
    P19_TEAM_GATE_CONTRACT.candidate_lanes[1].write_scopes,
    [
      'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
      'packages/redcube-pack-xiaohongshu/src/planning.js',
      'packages/redcube-pack-xiaohongshu/src/render-compiler.js',
      'prompts/xiaohongshu/**',
      'tests/xiaohongshu-creative-ownership.test.js',
      'tests/xiaohongshu-deliverable-e2e.test.js',
    ],
  );
  assert.deepEqual(
    P19_TEAM_GATE_CONTRACT.candidate_lanes[2].write_scopes,
    [
      'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
      'packages/redcube-pack-ppt/src/index.js',
      'packages/redcube-pack-ppt/src/render-compiler.js',
      'prompts/ppt_deck/**',
      'tests/ppt-creative-ownership.test.js',
      'tests/ppt-deliverable-e2e.test.js',
    ],
  );
  assert.deepEqual(
    P19_TEAM_GATE_CONTRACT.candidate_lanes[3].write_scopes,
    [
      'tests/review-platform.test.js',
      'tests/reference-regression.test.js',
      '.omx/reports/redcube-runtime-program/**',
    ],
  );
  assert.deepEqual(P19_TEAM_GATE_CONTRACT.final_convergence_order, [
    'shared_lifecycle_review_overlay_convergence',
    'xiaohongshu_creative_ownership_recovery',
    'ppt_deck_creative_ownership_recovery',
    'red_tests_regression_audit_closeout',
  ]);
});

test('P19.A machine-readable audit records lifecycle residue for both families', () => {
  const audit = buildCreativeOwnershipResidueAudit();

  assert.equal(audit.shared_execution_contract.primary_adapter, 'host_agent');
  assert.equal(audit.shared_execution_contract.external_llm_status, 'optional_compatibility_adapter');
  assert.deepEqual(audit.unified_lifecycle.review_overlay, ['visual_director_review', 'screenshot_review']);
  assert.equal(audit.families.xiaohongshu.status, 'cleared');
  assert.equal(audit.families.ppt_deck.status, 'present');
  assert.equal(typeof audit.families.xiaohongshu.lifecycle_residue.story_architecture.status, 'string');
  assert.equal(typeof audit.families.xiaohongshu.lifecycle_residue.visual_authorship.status, 'string');
  assert.equal(typeof audit.families.xiaohongshu.lifecycle_residue.delivery_packaging.status, 'string');
  assert.equal(typeof audit.families.ppt_deck.lifecycle_residue.story_architecture.status, 'string');
  assert.equal(typeof audit.families.ppt_deck.lifecycle_residue.visual_authorship.status, 'string');
  assert.deepEqual(
    audit.families.xiaohongshu.violations.filter((item) => item.status === 'present').map((item) => item.violation_id),
    [],
  );
  assert.deepEqual(
    audit.families.ppt_deck.violations.filter((item) => item.status === 'present').map((item) => item.violation_id),
    ['ppt.storyline.prompt_seed_authorship', 'ppt.slide_blueprint.shaping_authorship', 'ppt.render_html.template_authorship'],
  );
});

test('P19.A status report is synchronized with lifecycle freeze, residue, and team gate', () => {
  const status = writeStatus();
  const audit = buildCreativeOwnershipResidueAudit();
  const closeout = buildCreativeOwnershipAudit();

  assert.equal(status.program, 'P19');
  assert.equal(status.current_milestone, 'P19.A');
  assert.equal(status.current_mode, 'ralph');
  assert.equal(status.macro_lifecycle_stage, 'shared_lifecycle_freeze');
  assert.deepEqual(status.shared_execution_contract, audit.shared_execution_contract);
  assert.deepEqual(status.unified_lifecycle, audit.unified_lifecycle);
  assert.equal(status.team_lane_contract.tracking_model, 'unified_lifecycle');
  assert.equal(status.team_lane_contract.lanes.length, 4);
  assert.equal(status.residue_by_family.xiaohongshu.status, audit.families.xiaohongshu.status);
  assert.equal(status.residue_by_family.ppt_deck.status, audit.families.ppt_deck.status);
  assert.equal(status.team_gate.satisfied, true);
  assert.deepEqual(status.team_gate.missing_gates, closeout.team_gate.missing_gates);
  assert.deepEqual(status.team_gate.missing_gates, []);
});
