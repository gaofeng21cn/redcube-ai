// @ts-nocheck
import { safeArray, safeText } from '../shared.ts';
import {
  buildSampleStatusSlide,
  sampleTemplateLayoutGrammar,
} from './native-sample.ts';
import { layoutIntentForSlide, slidePoints, stableCompositionSignature } from './native/slide-intent.ts';
import { nativeShapePlanForSlide, templateBindingForSlide } from './native/shape-geometry.ts';
import { templateLayoutGrammar } from './native/template-grammar.ts';

export function buildMockPptNativeShapePlan(meta) {
  const route = safeText(meta?.route);
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const repairFeedback = safeArray(meta?.context?.repair_feedback);
  const isNativeSample = meta?.context?.native_ppt_sample_layout_profile?.required === true
    || safeText(meta?.context?.native_ppt_authoring_mode) === 'native_visual_sample_compact';
  const targetSlideIds = new Set(
    safeArray(meta?.context?.unit_repair_scope?.target_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  const authoredSlides = isNativeSample
    ? slides.slice(0, 1).map((slide, index) => buildSampleStatusSlide(slide, index, stableCompositionSignature))
    : slides.map((slide, index) => {
        const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
        const nativeShapes = nativeShapePlanForSlide(slide, index);
        return {
          slide_id: slideId,
          title: safeText(slide?.title, `Slide ${index + 1}`),
          layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
          core_sentence: safeText(slide?.core_sentence),
          page_core_content: safeArray(slide?.page_core_content),
          evidence_and_sources: safeArray(slide?.evidence_and_sources),
          layout_intent: {
            ...layoutIntentForSlide(slide, index, slidePoints(slide).length),
            composition_signature: stableCompositionSignature(nativeShapes),
          },
          template_layout_binding: templateBindingForSlide(slide, index, slidePoints(slide).length),
          native_shapes: nativeShapes,
          redcube_svg_ir_intent: {
            root_viewbox: '0 0 1152 648',
            editable_text_required: true,
            required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'group:content_point'],
          },
          repair_directive: targetSlideIds.has(slideId) ? 'apply screenshot feedback to this editable slide only' : 'preserve passed slide',
        };
      });
  return {
    ai_first_editing_contract: {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      editable_shape_manifest_required: true,
      design_spec_lock_required: true,
      template_layout_grammar_required: true,
      per_slide_layout_binding_required: true,
      shape_quality_role_required: true,
      layout_intent_required: true,
      composition_signature_required: true,
      structural_visual_required: true,
      title_underline_motif_allowed: false,
      concrete_layout_variant_repetition_limit: 2,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    },
    test_double_boundary: {
      kind: 'deterministic_codex_test_double',
      fixture_owner: 'tests/helpers/mock-codex-cli-parts/ppt-builders/native.ts',
      purpose: 'ci_contract_route_plumbing_and_fail_closed_quality_tests',
      hardcoded_visual_style_fixture: true,
      proves_visual_design_quality: false,
      display_as_native_ppt_visual_sample_allowed: false,
      replacement_for_live_codex_executor: false,
    },
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      ...(isNativeSample ? { authoring_mode: 'native_visual_sample_compact' } : {}),
      route,
      scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
      target_slide_ids: [...targetSlideIds],
      deck_layout_rhythm_plan: {
        owner: 'llm_agent',
        required: true,
        slides: authoredSlides.map((slide, index) => {
          const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
          const binding = isNativeSample ? slide.template_layout_binding : templateBindingForSlide(slide, index, slidePoints(slide).length);
          const layoutIntent = isNativeSample ? slide.layout_intent : layoutIntentForSlide(slide, index, slidePoints(slide).length);
          return {
            slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
            rhetorical_role: layoutIntent.rhetorical_role,
            selected_archetype: binding.selected_archetype,
            primary_grid: layoutIntent.primary_grid,
            composition_signature_budget: `${layoutFamily}:budget:${index + 1}`,
            proof_object: layoutIntent.non_text_visual,
          };
        }),
      },
      design_spec_lock: {
        spec_id: 'native_pptx_mock_spec_lock_v1',
        owner: 'llm_agent',
        source: 'mock_visual_direction_fixture',
        design_owner: 'test_double_only',
        motif: 'hardcoded_ci_fixture_not_a_presentation_template',
        visual_motif: 'hardcoded_ci_fixture_not_a_presentation_template',
        layout_archetypes: isNativeSample
          ? ['sample_status_proof_board', 'sample_decision_proof_split', 'sample_proof_band']
          : [
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
          design_register: 'executive proof deck',
          reference_style_family: 'template-profiled multi-zone native PPT board',
          first_glance_hierarchy: 'audience-facing claim first, then structured proof objects',
          template_profile_strategy: 'semantic master layouts with explicit zones and placeholder capacity',
          capacity_strategy: 'shorten copy or reduce slots before coordinates if text cannot fit at font floors',
          forbidden_amateur_patterns: ['generic equal-card grid', 'decorative title underline', 'overfilled receipt ledger'],
        },
        borrowed_discipline: {
          from: 'ppt-master',
          adopted: ['spec_lock', 'template_layout_grammar', 'template_profile', 'semantic_layout_selection', 'reference_deck_analysis', 'per_page_visual_plan', 'rendered_quality_gate'],
          not_adopted: ['ppt_master_product_entry_owner', 'mock_helper_as_visual_template'],
        },
        borrowed_principles: [
          'ppt_master_style_spec_lock',
          'template_layout_grammar',
          'template_profile',
          'semantic_layout_selection',
          'reference_deck_analysis',
          'per_page_visual_plan',
          'explicit_grid',
          'font_floor',
          'layout_rhythm',
          'rendered_quality_gate',
        ],
        qa_gates: ['bounds', 'font_floor', 'text_fit', 'structural_visual', 'slot_fill', 'layout_variety', 'true_render_screenshot'],
      },
      template_layout_grammar: isNativeSample ? sampleTemplateLayoutGrammar() : templateLayoutGrammar(),
      authoring_ir: {
        kind: 'redcube_svg_ir',
        version: 1,
        required: true,
        strict_svg_preflight_required: true,
        allowed_svg_tags: ['svg', 'g', 'rect', 'text'],
      },
      consumed_feedback_count: repairFeedback.length,
      slides: authoredSlides,
    },
  };
}
