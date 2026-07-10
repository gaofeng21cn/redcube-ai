#!/usr/bin/env node
// @ts-nocheck
import fs from 'node:fs';

function usage() {
  console.error('Usage: build-fixture-input.ts <benchmark.json> <output.json> [suite_id]');
}

const [, , fixturePath, outputPath, requestedSuiteId = 'data_charts'] = process.argv;
if (!fixturePath || !outputPath) {
  usage();
  process.exit(2);
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function templateLayoutGrammar() {
  const catalog = [
    ['cover_signal', 'hero signal board with explicit claim and evidence field'],
    ['multi_zone_compare', 'comparison board with separated editable evidence zones'],
    ['timeline_band', 'timeline band with milestone evidence outside the rail'],
    ['judgement_ladder', 'decision ladder with structured step evidence'],
    ['ring_cross', 'hub and axis synthesis map with bounded evidence'],
    ['summary_peak', 'closing synthesis board with proof and takeaway field'],
  ].map(([archetypeId, layoutDescription]) => ({
    archetype_id: archetypeId,
    use_when: `Use for ${archetypeId.replace(/_/g, ' ')} fixture slides when the AI plan chooses this composition.`,
    layout_description: layoutDescription,
    required_zones: ['title_zone', 'claim_zone', 'body_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'point_text'],
      required_shape_role_groups: [
        'title_text',
        'core_claim_text',
        'content_container',
        'audience_body_text',
        'structural_visual',
      ],
      min_filled_required_zone_share: 1,
      max_audience_text_shapes: 12,
      min_body_font_pt: 18,
    },
    prohibited: [
      'helper-selected template fallback',
      'shape coordinates without a semantic zone',
      'structural rails crossing readable text',
    ],
  }));
  return {
    grammar_id: 'native_ppt_proof_template_layout_grammar_v1',
    owner: 'llm_agent',
    required: true,
    materializer_role: 'execute_selected_archetype_zones_only',
    helper_template_layout_allowed: false,
    reference_discipline: {
      template_profile_required: true,
      semantic_layout_selection_required: true,
      placeholder_capacity_required: true,
      reference_deck_analysis_required: true,
      action_title_required: true,
      source_projects: ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills'],
      rule: 'Fixture coordinates are valid only after explicit template-profile and semantic-zone selection.',
    },
    archetype_catalog: catalog,
  };
}

function designSpecLock() {
  return {
    spec_id: 'native_ppt_proof_ai_first_design_lock_v1',
    owner: 'llm_agent',
    motif: 'warm accent rail with bounded evidence zones',
    layout_archetypes: [
      'cover_signal',
      'multi_zone_compare',
      'timeline_band',
      'judgement_ladder',
      'ring_cross',
      'summary_peak',
    ],
    palette: {
      canvas: '#F6F2EA',
      ink: '#171C24',
      muted: '#5B6570',
      accent: '#B94624',
      panel: '#EFE6D6',
    },
    typography: {
      title_pt_min: 36,
      body_pt_min: 18,
      point_index_pt_min: 16,
    },
    grid: {
      edge_margin_in_min: 0.6,
      inter_block_gap_in_min: 0.32,
    },
    layout_rhythm: {
      repeated_concrete_composition_limit: 2,
      required_distinct_composition_share: 0.75,
    },
    professional_design_brief: {
      design_register: 'native PPT proof fixture design system',
      reference_style_family: 'editorial business proof deck with explicit template zones',
      first_glance_hierarchy: 'action title, core claim, then bounded evidence shapes',
      template_profile_strategy: 'select a named archetype before assigning coordinates',
      capacity_strategy: 'bind every content shape to a semantic zone with 18pt body floor',
      forbidden_amateur_patterns: [
        'generic equal-card grid without structural intent',
        'decorative title underline as the only motif',
        'unbounded text placed directly on rails',
      ],
    },
    borrowed_principles: [
      'ppt_master_style_spec_lock',
      'template_layout_grammar',
      'template_profile',
      'semantic_layout_selection',
      'reference_deck_analysis',
      'per_page_visual_plan',
      'layout_rhythm',
      'rendered_quality_gate',
    ],
    qa_gates: ['bounds', 'font_floor', 'text_fit', 'structural_visual', 'layout_variety'],
  };
}

function deckLayoutRhythmPlan(slides) {
  return {
    owner: 'llm_agent',
    required: true,
    slides: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      rhetorical_role: slide.layout_intent.rhetorical_role,
      selected_archetype: slide.template_layout_binding.selected_archetype,
      rhythm_role: slide.template_layout_binding.rhythm_role,
      primary_grid: slide.layout_intent.primary_grid,
      composition_signature_budget: slide.layout_intent.composition_signature,
      proof_object: slide.layout_intent.non_text_visual,
      sequence_index: index + 1,
    })),
  };
}

function authoredBenchmarkSlide(slide) {
  if (!Array.isArray(slide?.native_shapes) || slide.native_shapes.length === 0) {
    throw new Error(`Benchmark slide ${safeText(slide?.slide_id, '<unknown>')} must carry authored native_shapes`);
  }
  return JSON.parse(JSON.stringify(slide));
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const suite = (fixture.suites || []).find((item) => item.suite_id === requestedSuiteId)
  || (fixture.suites || [fixture])[0];
if (!suite?.editable_shape_plan?.slides) {
  throw new Error(`Fixture suite ${requestedSuiteId} does not include editable_shape_plan.slides`);
}
const slides = suite.editable_shape_plan.slides.map(authoredBenchmarkSlide);
const route = suite.editable_shape_plan.route || 'author_pptx_native';
const payload = {
  fixture_id: fixture.fixture_id,
  suite_id: suite.suite_id,
  route,
  editable_shape_plan: {
    contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
    route,
    design_spec_lock: designSpecLock(),
    template_layout_grammar: templateLayoutGrammar(),
    deck_layout_rhythm_plan: deckLayoutRhythmPlan(slides),
    slides,
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
