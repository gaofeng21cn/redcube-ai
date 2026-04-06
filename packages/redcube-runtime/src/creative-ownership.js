import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
      visual_authorship: ['visual_direction', 'render_html'],
      delivery_packaging: ['publish_copy', 'export_bundle'],
      review_overlay: ['visual_director_review', 'screenshot_review'],
    },
    ppt_deck: {
      source_readiness: ['shared_source_readiness', 'research_augmentation_optional'],
      story_architecture: ['storyline', 'detailed_outline', 'slide_blueprint'],
      visual_authorship: ['visual_direction', 'render_html'],
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
  required_gates: [
    'shared_contract_frozen',
    'shared_lifecycle_contract_frozen',
    'research_ownership_frozen',
    'ppt_visual_director_review_contract_frozen',
    'lifecycle_alignment_red_tests_written',
    'lane_write_scopes_aligned_to_shared_lifecycle',
    'independent_verification_defined',
    'final_convergence_order_defined',
  ],
  candidate_lanes: [
    {
      lane_id: 'shared_lifecycle_review_overlay_convergence',
      lifecycle_focus: ['source_readiness', 'review_overlay'],
    },
    {
      lane_id: 'xiaohongshu_creative_ownership_recovery',
      lifecycle_focus: ['story_architecture', 'visual_authorship', 'delivery_packaging'],
    },
    {
      lane_id: 'ppt_deck_creative_ownership_recovery',
      lifecycle_focus: ['story_architecture', 'visual_authorship', 'review_overlay'],
    },
    {
      lane_id: 'red_tests_regression_audit_closeout',
      lifecycle_focus: ['regression', 'audit', 'reports'],
    },
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
    external_llm: 'optional_compatibility_adapter',
  },
  optional_compatibility_adapters: ['external_llm'],
  protected_creative_routes: P19_UNIFIED_LIFECYCLE_CONTRACT.family_mapping,
  primary_creative_routes: {
    xiaohongshu: ['storyline', 'single_note_plan', 'visual_direction', 'render_html', 'publish_copy'],
    ppt_deck: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
  },
  unified_lifecycle: P19_UNIFIED_LIFECYCLE_CONTRACT,
  review_overlay: P19_REVIEW_OVERLAY_CONTRACT,
  research_ownership: P19_RESEARCH_OWNERSHIP_CONTRACT,
  mainline_topology: [
    'Gateway',
    'Harness OS',
    'Codex-native host agent',
    'family/profile/pack contracts',
    'review/governance/audit',
    'artifacts',
  ],
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
    violation_id: 'xhs.render_html.template_authorship',
    stage: 'visual_authorship',
    protected_surface: 'final_html_markup',
    file: 'packages/redcube-pack-xiaohongshu/src/render-compiler.js',
    evidence_patterns: [
      "materializedFrom: 'prompt_pack_template'",
      'compiled.content = renderTemplate(',
    ],
    why_blocked: 'render_html 仍由 template compiler 直接 author final markup。',
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
    file: 'packages/redcube-pack-ppt/src/index.js',
    evidence_patterns: [
      'function toBlueprintContent(slide, deps) {',
      "speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),",
    ],
    why_blocked: 'slide_blueprint 仍由 deterministic JS 对 major text 与讲述节奏做塑形。',
  },
  {
    violation_id: 'ppt.render_html.template_authorship',
    stage: 'visual_authorship',
    protected_surface: 'final_html_markup',
    file: 'packages/redcube-pack-ppt/src/render-compiler.js',
    evidence_patterns: [
      "materializedFrom: 'prompt_runtime_template'",
      'compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));',
    ],
    why_blocked: 'render_html 仍由 template compiler 直接 author final slide markup。',
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
    milestone: 'P19.A',
    tracking_model: P19_UNIFIED_LIFECYCLE_CONTRACT.tracking_model,
    shared_execution_contract: {
      primary_adapter: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.adapter,
      primary_runtime: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.runtime,
      external_llm_status: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.adapter_roles.external_llm,
      mainline_topology: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.mainline_topology,
    },
    unified_lifecycle: P19_UNIFIED_LIFECYCLE_CONTRACT,
    research_ownership: P19_RESEARCH_OWNERSHIP_CONTRACT,
    review_overlay: buildReviewOverlayStatus(),
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
