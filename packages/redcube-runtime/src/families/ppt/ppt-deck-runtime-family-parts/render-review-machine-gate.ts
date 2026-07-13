// @ts-nocheck

export function createPptRenderReviewMachineGateBuilder({ safeArray, safeText }) {
  return function buildRenderReviewMachineGate(input = {}) {
    const renderedPageRefs = safeArray(input?.renderedPageRefs).map((ref) => safeText(ref)).filter(Boolean);
    const imagePngRefs = safeArray(input?.imagePngRefs).map((ref) => safeText(ref)).filter(Boolean);
    const materialGapRefs = safeArray(input?.materialGapRefs).map((ref) => safeText(ref)).filter(Boolean);
    const brandGapRefs = safeArray(input?.brandGapRefs).map((ref) => safeText(ref)).filter(Boolean);
    const observedHardBoundaryRefs = safeArray(input?.typedBlockerRefs).map((ref) => safeText(ref)).filter(Boolean);
    const slideReviews = safeArray(input?.slideReviews);
    const blockedPageRefs = slideReviews
      .filter((slide) => (
        safeText(slide?.status) === 'block'
        || safeArray(slide?.issues).length > 0
        || safeArray(slide?.mechanical_issues).length > 0
      ))
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    const failedChecks = safeArray(input?.failedChecks).map((check) => safeText(check)).filter(Boolean);
    const rerunFromStage = safeText(input?.rerunFromStage);
    return {
      gate_id: 'rca_render_review_machine_gate.v1',
      surface_kind: 'render_review_machine_gate_policy',
      owner: 'redcube_ai',
      source_surface_kind: safeText(input?.sourceSurfaceKind, 'rendered_visual_surface'),
      required_evidence: {
        rendered_page_refs_or_image_png_refs: true,
        page_manifest_ref_required: true,
        page_hash_required: true,
        page_hash_uniqueness_required: true,
        crop_or_safe_bounds_signal_required: true,
        field_leakage_signal_required: true,
        readability_signal_required: true,
        material_gap_diagnostic_required: true,
        brand_gap_diagnostic_required: true,
      },
      required_signal_groups: {
        page_presence: ['rendered_page_refs', 'image_png_refs', 'page_manifest_ref'],
        render_integrity: ['non_empty_signal', 'sha256_or_hash', 'hash_uniqueness', 'crop_or_safe_bounds'],
        content_safety: ['field_leakage', 'readability'],
        source_and_brand: ['material_gap_refs_or_diagnostic', 'brand_gap_refs_or_diagnostic'],
      },
      evidence_refs: {
        rendered_page_refs: renderedPageRefs,
        image_png_refs: imagePngRefs,
        page_manifest_ref: safeText(input?.pageManifestRef) || null,
        material_gap_refs: materialGapRefs,
        brand_gap_refs: brandGapRefs,
        observed_hard_boundary_refs: observedHardBoundaryRefs,
      },
      machine_check_output: {
        failed_checks: failedChecks,
        blocked_page_refs: blockedPageRefs,
        repair_target: failedChecks.length > 0 || blockedPageRefs.length > 0
          ? {
              rerun_from_stage: rerunFromStage || null,
              target_slide_ids: blockedPageRefs,
            }
          : null,
        observed_hard_boundary_refs: observedHardBoundaryRefs,
      },
      output_boundary: {
        machine_check_may_emit: [
          'repair_target',
          'quality_debt_ref',
          'blocked_page_refs',
          'failed_checks',
          'evidence_gap_ref',
        ],
        machine_check_must_not_emit: [
          'visual_ready',
          'exportable',
          'handoffable',
          'quality_verdict',
          'review_verdict',
          'owner_receipt',
        ],
        grants_visual_ready: false,
        grants_exportable: false,
        grants_handoffable: false,
        writes_rca_visual_truth: false,
      },
    };
  };
}
