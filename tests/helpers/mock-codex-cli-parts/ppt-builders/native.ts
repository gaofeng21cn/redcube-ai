// @ts-nocheck
import { safeArray, safeText } from '../shared.ts';

export function buildMockPptNativeShapePlan(meta) {
  const route = safeText(meta?.route);
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const repairFeedback = safeArray(meta?.context?.repair_feedback);
  const targetSlideIds = new Set(
    safeArray(meta?.context?.unit_repair_scope?.target_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  return {
    ai_first_editing_contract: {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    },
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route,
      scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
      target_slide_ids: [...targetSlideIds],
      authoring_ir: {
        kind: 'redcube_svg_ir',
        version: 1,
        required: true,
        strict_svg_preflight_required: true,
        allowed_svg_tags: ['svg', 'g', 'rect', 'text'],
      },
      consumed_feedback_count: repairFeedback.length,
      slides: slides.map((slide, index) => ({
        slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
        title: safeText(slide?.title, `Slide ${index + 1}`),
        layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
        core_sentence: safeText(slide?.core_sentence),
        page_core_content: safeArray(slide?.page_core_content),
        evidence_and_sources: safeArray(slide?.evidence_and_sources),
        native_shapes: [
          {
            shape_id: `${safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`)}-title`,
            kind: 'text_box',
            role: 'title',
            editable_text: safeText(slide?.title, `Slide ${index + 1}`),
          },
          {
            shape_id: `${safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`)}-body`,
            kind: 'group',
            role: 'content_stack',
            editable_text: safeArray(slide?.page_core_content).map((item) => safeText(item?.text || item)).filter(Boolean).join('\n'),
          },
        ],
        redcube_svg_ir_intent: {
          root_viewbox: '0 0 1152 648',
          editable_text_required: true,
          required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'group:content_point'],
        },
        repair_directive: targetSlideIds.has(safeText(slide?.slide_id)) ? 'apply screenshot feedback to this editable slide only' : 'preserve passed slide',
      })),
    },
  };
}
