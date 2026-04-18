import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { runtimeStateDisplayGlob, runtimeStateDisplayPath } from './runtime-state.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');

function readRepoFile(relativePath) {
  return readFileSync(path.join(REPO_ROOT, relativePath), 'utf-8');
}

function matchesAllEvidence(relativePath, evidencePatterns) {
  const content = readRepoFile(relativePath);
  return evidencePatterns.every((pattern) => content.includes(pattern));
}

function collectViolations(definitions) {
  return definitions.map((definition) => {
    const matched = matchesAllEvidence(definition.file, definition.evidence_patterns);
    const present = definition.inverted_match ? !matched : matched;
    return {
      ...definition,
      status: present ? 'present' : 'cleared',
    };
  });
}

function summarizeLifecycleResidue(violations) {
  const grouped = {
    story_architecture: [],
    visual_authorship: [],
    delivery_packaging: [],
  };
  for (const violation of violations) {
    if (grouped[violation.stage]) {
      grouped[violation.stage].push(violation);
    }
  }
  return Object.fromEntries(
    Object.entries(grouped).map(([stage, items]) => [stage, {
      status: items.length > 0 ? 'present' : 'cleared',
      violations: items,
    }]),
  );
}

export const P19_UNIFIED_LIFECYCLE_CONTRACT = Object.freeze({
  tracking_model: 'unified_lifecycle',
  macro_lifecycle: ['source_readiness', 'story_architecture', 'visual_authorship', 'delivery_packaging'],
  review_overlay: ['visual_director_review', 'screenshot_review'],
  research_ownership: {
    semantic_role: 'shared_source_readiness_augmentation',
    trigger_conditions: [
      'source_missing_or_insufficient',
      'source_audit_insufficient',
      'task_requires_public_evidence',
      'story_or_visual_needs_more_truth',
    ],
  },
  stages: ['source_readiness', 'story_architecture', 'visual_authorship', 'delivery_packaging'],
  family_mapping: {
    xiaohongshu: {
      source_readiness: ['shared_source_readiness', 'research_augmentation_optional'],
      story_architecture: ['storyline', 'single_note_plan'],
      visual_authorship: ['visual_direction', 'render_html', 'fix_html'],
      delivery_packaging: ['publish_copy', 'export_bundle'],
      review_overlay: ['visual_director_review', 'screenshot_review'],
    },
    ppt_deck: {
      source_readiness: ['shared_source_readiness', 'research_augmentation_optional'],
      story_architecture: ['storyline', 'detailed_outline', 'slide_blueprint'],
      visual_authorship: ['visual_direction', 'render_html', 'fix_html'],
      delivery_packaging: ['export_pptx'],
      review_overlay: ['visual_director_review', 'screenshot_review'],
    },
  },
});

export const P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT = P19_UNIFIED_LIFECYCLE_CONTRACT;

export const P19_RESEARCH_OWNERSHIP_CONTRACT = Object.freeze({
  positioning: 'shared_source_readiness_optional_augmentation',
  trigger_conditions: [
    'source_missing_or_insufficient',
    'source_audit_insufficient',
    'task_requires_public_evidence',
    'story_or_visual_needs_more_truth',
  ],
});

export const P19_REVIEW_OVERLAY_CONTRACT = Object.freeze({
  shared_layers: ['visual_director_review', 'screenshot_review'],
  family_mapping: {
    xiaohongshu: ['visual_director_review', 'screenshot_review'],
    ppt_deck: ['visual_director_review', 'screenshot_review'],
  },
});

export const P19_TEAM_GATE_CONTRACT = Object.freeze({
  tracking_model: P19_UNIFIED_LIFECYCLE_CONTRACT.tracking_model,
  required_gates: [
    'shared_contract_frozen',
    'shared_lifecycle_contract_frozen',
    'research_ownership_frozen',
    'ppt_visual_director_review_contract_frozen',
    'lifecycle_alignment_red_tests_written',
    'lane_write_scopes_by_shared_lifecycle',
    'independent_verification_defined',
    'final_convergence_order_defined',
  ],
  frozen_contracts: {
    shared_contract: [
      'packages/redcube-runtime/src/executors.js',
      'packages/redcube-runtime/src/deliverable-routes.js',
      'packages/redcube-runtime/src/creative-ownership.js',
    ],
    shared_lifecycle_contract: [
      'packages/redcube-runtime/src/creative-ownership.js',
      'tests/p19-creative-ownership-freeze.test.js',
      'tests/creative-ownership-recovery-audit.test.js',
    ],
    research_ownership: [
      'packages/redcube-runtime/src/creative-ownership.js',
      runtimeStateDisplayPath('plans', 'spec-redcube-unified-stage-lifecycle-and-family-alignment.md'),
      runtimeStateDisplayPath('plans', 'spec-redcube-agent-first-execution-and-creative-ownership-recovery.md'),
    ],
    ppt_visual_director_review_contract: [
      'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
      'packages/redcube-overlay-ppt/src/profiles.js',
      'tests/ppt-creative-ownership.test.js',
    ],
  },
  lifecycle_alignment_red_tests: [
    'tests/p19-creative-ownership-freeze.test.js',
    'tests/creative-ownership-recovery-audit.test.js',
    'tests/xiaohongshu-creative-ownership.test.js',
    'tests/ppt-creative-ownership.test.js',
  ],
  candidate_lanes: [
    {
      lane_id: 'shared_lifecycle_review_overlay_convergence',
      lifecycle_focus: ['source_readiness', 'review_overlay'],
      write_scopes: [
        'packages/redcube-runtime/src/creative-ownership.js',
        'scripts/p19-creative-ownership-audit-lib.mjs',
        'tests/p19-creative-ownership-freeze.test.js',
        'tests/creative-ownership-recovery-audit.test.js',
      ],
      verification_commands: [
        'node --test tests/p19-creative-ownership-freeze.test.js',
        'node --test tests/creative-ownership-recovery-audit.test.js',
      ],
    },
    {
      lane_id: 'xiaohongshu_creative_ownership_recovery',
      lifecycle_focus: ['story_architecture', 'visual_authorship', 'delivery_packaging'],
      write_scopes: [
        'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
        'packages/redcube-pack-xiaohongshu/src/index.ts',
        'prompts/xiaohongshu/**',
        'tests/xiaohongshu-creative-ownership.test.js',
        'tests/xiaohongshu-deliverable-e2e.test.js',
      ],
      verification_commands: [
        'node --test tests/xiaohongshu-creative-ownership.test.js',
        'node --test tests/xiaohongshu-deliverable-e2e.test.js',
      ],
    },
    {
      lane_id: 'ppt_deck_creative_ownership_recovery',
      lifecycle_focus: ['story_architecture', 'visual_authorship', 'review_overlay'],
      write_scopes: [
        'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
        'packages/redcube-runtime-family-ppt/src/ppt-structured-artifact-builders.js',
        'packages/redcube-pack-ppt/src/index.ts',
        'prompts/ppt_deck/**',
        'tests/ppt-creative-ownership.test.js',
        'tests/ppt-deliverable-e2e.test.js',
      ],
      verification_commands: [
        'node --test tests/ppt-creative-ownership.test.js',
        'node --test tests/ppt-deliverable-e2e.test.js',
      ],
    },
    {
      lane_id: 'red_tests_regression_audit_closeout',
      lifecycle_focus: ['regression', 'audit', 'reports'],
      write_scopes: [
        'tests/review-platform.test.js',
        'tests/reference-regression.test.js',
        runtimeStateDisplayGlob('reports', 'redcube-runtime-program', '**'),
      ],
      verification_commands: [
        'node --test tests/review-platform.test.js',
        'node --test tests/reference-regression.test.js',
        'npm test -- --test-reporter=dot',
      ],
    },
  ],
  final_convergence_order: [
    'shared_lifecycle_review_overlay_convergence',
    'xiaohongshu_creative_ownership_recovery',
    'ppt_deck_creative_ownership_recovery',
    'red_tests_regression_audit_closeout',
  ],
});

export const P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT = Object.freeze({
  program: 'P19',
  milestone: 'P19.A',
  tracking_model: P19_UNIFIED_LIFECYCLE_CONTRACT.tracking_model,
  primary_executor: {
    adapter: 'host_agent',
    runtime: 'codex_native_host_agent',
    status: 'formal_primary_executor',
  },
  adapter_roles: {
    host_agent: 'formal_primary_executor',
    external_llm: 'secondary_proof_adapter',
  },
  secondary_proof_adapters: ['external_llm'],
  protected_creative_routes: P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping,
  primary_creative_routes: {
    xiaohongshu: ['storyline', 'single_note_plan', 'visual_direction', 'render_html', 'fix_html', 'publish_copy'],
    ppt_deck: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'fix_html'],
  },
  unified_lifecycle: P19_UNIFIED_LIFECYCLE_CONTRACT,
  review_overlay: P19_REVIEW_OVERLAY_CONTRACT,
  research_ownership: P19_RESEARCH_OWNERSHIP_CONTRACT,
  mainline_topology: [
    'Gateway',
    'Harness OS',
    'Codex-default host-agent runtime',
    'family/profile/pack contracts',
    'review/governance/audit',
    'artifacts',
  ],
});

export const P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT = Object.freeze({
  current_milestone: 'P19.D',
  macro_lifecycle_stage: 'cross_lifecycle_closeout',
  completed_milestones: ['P19.A', 'P19.B', 'P19.C'],
  closeout_ready: true,
  closeout_scope: {
    story_architecture: 'cleared_across_families',
    visual_authorship: 'cleared_across_families',
    delivery_packaging: 'no_creative_residue_priority_deferred',
    review_overlay: 'dual_layer_active_across_families',
    remaining_shared_closeout: [],
  },
});

export const P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES = Object.freeze({
  allowed_code_responsibilities: [
    'contract',
    'validation',
    'shell_boundary',
    'audit',
    'governance',
    'artifact_persistence',
    'review_rerun_publish_gates',
  ],
  forbidden_code_authorship: {
    xiaohongshu: [
      'page_core_content',
      'visual_direction_major_expression',
      'recipe_selection',
      'final_html_markup',
      'publish_copy_body',
      'visual_director_review_decision',
    ],
    ppt_deck: [
      'outline_major_text',
      'blueprint_major_text',
      'visual_direction_major_expression',
      'final_html_markup',
      'visual_director_review_decision',
    ],
  },
  fake_progress_conditions: [
    'docs_only_without_execution_shift',
    'runtime_to_pack_relocation_only',
    'prompt_file_addition_without_route_shift',
    'director_fields_without_markup_authorship_shift',
    'storyline_only_agent_path',
    'single_family_only_fix',
    'abstraction_without_visual_ceiling_recovery',
  ],
});

const XIAOHONGSHU_RESIDUE_DEFINITIONS = Object.freeze([
  {
    violation_id: 'xhs.storyline.prompt_seed_authorship',
    stage: 'story_architecture',
    protected_surface: 'story_architecture_seed_authorship',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
    evidence_patterns: [
      "const seed = promptSeed(contract, 'storyline');",
      "audience_judgement: safeText(seed?.storyline?.audience_judgement, research?.research?.audience_judgement)",
    ],
    why_blocked: 'storyline 仍由 prompt_pack_seed 直接物化主叙事表达。',
  },
  {
    violation_id: 'xhs.single_note_plan.pack_shell_authorship',
    stage: 'story_architecture',
    protected_surface: 'page_core_content',
    file: 'packages/redcube-pack-xiaohongshu/src/index.ts',
    evidence_patterns: [
      'buildXhsPlanSlides',
      'buildXhsVisualDirection',
    ],
    why_blocked: 'single_note_plan / visual_direction 仍由 pack shell 暴露 creative builder。',
  },
  {
    violation_id: 'xhs.render_html.template_authorship',
    stage: 'visual_authorship',
    protected_surface: 'final_html_markup',
    file: 'packages/redcube-pack-xiaohongshu/src/index.ts',
    evidence_patterns: [
      'compileXhsRenderSlides',
    ],
    why_blocked: 'render_html 仍由 pack shell 暴露 compiler 出口。',
  },
  {
    violation_id: 'xhs.publish_copy.seed_authorship',
    stage: 'delivery_packaging',
    protected_surface: 'publish_copy_body',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
    evidence_patterns: [
      "const seed = promptSeed(contract, 'publish_copy', {",
      'const body = safeText(publishSeed.body);',
    ],
    why_blocked: 'publish_copy 仍由 prompt_pack_seed 直接物化正文与平台文案。',
  },
]);

const PPT_RESIDUE_DEFINITIONS = Object.freeze([
  {
    violation_id: 'ppt.storyline.prompt_seed_authorship',
    stage: 'story_architecture',
    protected_surface: 'story_architecture_seed_authorship',
    file: 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
    evidence_patterns: [
      "const seed = promptSeed('storyline', {",
      'core_metaphor: safeText(seed?.storyline?.core_metaphor)',
    ],
    why_blocked: 'storyline 仍由 prompt_runtime_seed 直接物化主叙事表达。',
  },
  {
    violation_id: 'ppt.slide_blueprint.shaping_authorship',
    stage: 'story_architecture',
    protected_surface: 'blueprint_major_text',
    file: 'packages/redcube-pack-ppt/src/index.ts',
    evidence_patterns: [
      'buildPptDetailedOutline',
      'buildPptSlideBlueprint',
      'buildPptVisualDirection',
    ],
    why_blocked: 'detailed_outline / slide_blueprint / visual_direction 仍由 pack shell 暴露 creative builder。',
  },
  {
    violation_id: 'ppt.render_html.template_authorship',
    stage: 'visual_authorship',
    protected_surface: 'final_html_markup',
    file: 'packages/redcube-pack-ppt/src/index.ts',
    evidence_patterns: [
      'compilePptRenderSlides',
    ],
    why_blocked: 'render_html 仍由 pack shell 暴露 compiler 出口。',
  },
]);

function buildReviewOverlayStatus() {
  const pptReviewActive = matchesAllEvidence('packages/redcube-overlay-ppt/src/profiles.js', [
    "stage_id: 'visual_director_review'",
    "requires_stages: ['render_html']",
    "stage_id: 'screenshot_review'",
    "requires_stages: ['visual_director_review']",
  ]) && matchesAllEvidence('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js', [
    "case 'visual_director_review':",
    "review_overlay: 'visual_director_review'",
  ]);

  return {
    shared_layers: P19_REVIEW_OVERLAY_CONTRACT.shared_layers,
    xiaohongshu: {
      status: 'active',
      layers: P19_REVIEW_OVERLAY_CONTRACT.family_mapping.xiaohongshu,
    },
    ppt_deck: {
      status: pptReviewActive ? 'active' : 'missing_visual_director_review_contract',
      layers: P19_REVIEW_OVERLAY_CONTRACT.family_mapping.ppt_deck,
    },
  };
}

export function buildCreativeOwnershipResidueAudit() {
  const xiaohongshuViolations = collectViolations(XIAOHONGSHU_RESIDUE_DEFINITIONS);
  const pptViolations = collectViolations(PPT_RESIDUE_DEFINITIONS);

  return {
    program: 'P19',
    milestone: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.current_milestone,
    macro_lifecycle_stage: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.macro_lifecycle_stage,
    completed_milestones: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.completed_milestones,
    closeout_ready: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.closeout_ready,
    tracking_model: P19_UNIFIED_LIFECYCLE_CONTRACT.tracking_model,
    shared_execution_contract: {
      primary_adapter: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.adapter,
      primary_runtime: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.runtime,
      external_llm_status: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.adapter_roles.external_llm,
      freeze_origin_milestone: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.milestone,
      mainline_topology: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.mainline_topology,
    },
    unified_lifecycle: P19_UNIFIED_LIFECYCLE_CONTRACT,
    research_ownership: P19_RESEARCH_OWNERSHIP_CONTRACT,
    review_overlay: buildReviewOverlayStatus(),
    shared_closeout: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.closeout_scope,
    families: {
      xiaohongshu: {
        status: xiaohongshuViolations.some((item) => item.status === 'present') ? 'present' : 'cleared',
        protected_routes: [
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.xiaohongshu.story_architecture,
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.xiaohongshu.visual_authorship,
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.xiaohongshu.delivery_packaging,
        ],
        lifecycle_residue: summarizeLifecycleResidue(xiaohongshuViolations.filter((item) => item.status === 'present')),
        violations: xiaohongshuViolations,
      },
      ppt_deck: {
        status: pptViolations.some((item) => item.status === 'present') ? 'present' : 'cleared',
        protected_routes: [
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.ppt_deck.story_architecture,
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.ppt_deck.visual_authorship,
          ...P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping.ppt_deck.delivery_packaging,
        ],
        lifecycle_residue: summarizeLifecycleResidue(pptViolations.filter((item) => item.status === 'present')),
        violations: pptViolations,
      },
    },
  };
}
