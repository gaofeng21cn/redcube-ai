// @ts-nocheck

function failurePayload(slideId, failure) {
  return {
    ok: false,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: 1,
    failure_count: 1,
    failures: [{ slide_id: slideId, failures: [failure] }],
  };
}

function pageNumberFailure(slides) {
  const missing = slides.find((slide) => !(slide?.native_shapes || []).some((shape) => (
    ['page_number', 'page_no', 'page'].includes(shape?.role)
    && String(shape?.editable_text || shape?.text || shape?.label || '').trim()
  )));
  return missing && failurePayload(missing.slide_id || 'S01', {
    reason: 'ai_first_page_number_missing',
  });
}

function panelSafeAreaFailure(slides) {
  for (const slide of slides) {
    const shapes = slide?.native_shapes || [];
    const panel = shapes.find((shape) => shape?.role === 'content_panel');
    const text = shapes.find((shape) => shape?.role === 'point_text');
    if (!panel?.bounds || !text?.bounds) continue;
    const inset = 0.15;
    const panelRight = panel.bounds.left_in + panel.bounds.width_in;
    const textRight = text.bounds.left_in + text.bounds.width_in;
    if (text.bounds.left_in < panel.bounds.left_in + inset || textRight > panelRight - inset) {
      return failurePayload(slide.slide_id || 'S01', {
        reason: 'ai_first_text_panel_safe_area_violation',
        shape_id: text.shape_id,
        panel_shape_id: panel.shape_id,
        required_inset_in: inset,
        panel_safe_bounds: {
          left_in: panel.bounds.left_in + inset,
          right_in: panelRight - inset,
        },
        required_delta_in: {
          left: Math.max(0, panel.bounds.left_in + inset - text.bounds.left_in),
          right: Math.max(0, textRight - (panelRight - inset)),
        },
      });
    }
  }
  return null;
}

export function buildNativePlanValidationPayload(input) {
  const slides = Array.isArray(input?.editable_shape_plan?.slides)
    ? input.editable_shape_plan.slides
    : [];
  const variant = String(process.env.REDCUBE_MOCK_MUTATE_KIND || '').trim();
  const failure = variant === 'always_tiny_native_plan'
    ? failurePayload(slides[0]?.slide_id || 'S01', {
        reason: 'ai_first_text_box_height_below_readability_floor',
        shape_id: 'mock-point-text',
        minimum_height_in: 0.54,
      })
    : variant === 'require_panel_safe_area_retry_contract'
      ? panelSafeAreaFailure(slides)
      : variant === 'drop_layout_binding_after_page_number_feedback'
        ? pageNumberFailure(slides)
        : null;
  return failure || {
    ok: true,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: slides.length,
    failure_count: 0,
    failures: [],
  };
}
