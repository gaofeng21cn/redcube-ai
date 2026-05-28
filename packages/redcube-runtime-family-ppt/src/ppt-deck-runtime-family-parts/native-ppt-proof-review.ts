import { readFileSync } from 'node:fs';
import {
  NATIVE_PPT_AGGREGATED_CHECK_KEYS,
  NATIVE_QUALITY_REQUIRED_BOOLEAN_CHECK_KEYS,
  NATIVE_QUALITY_REQUIRED_BOOLEAN_METRIC_KEYS,
  NATIVE_QUALITY_REQUIRED_NUMERIC_METRIC_KEYS,
  REQUIRED_ENGINE_CAPABILITIES,
} from './native-ppt-quality-contract.js';

type JsonRecord = Record<string, any>;

interface NativePptProofReviewDeps {
  existsSync(file: string): boolean;
  expectedNativeEngineContract(): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptProofReviewParts({
  existsSync,
  expectedNativeEngineContract,
  safeArray,
  safeText,
}: NativePptProofReviewDeps) {
  function requireNativeEngineContract(payload: JsonRecord): JsonRecord {
    const contract = payload?.engine_contract || {};
    const ownedRoutes = safeArray(contract?.owned_routes).map((route) => safeText(route)).filter(Boolean);
    const expected = expectedNativeEngineContract();
    const expectedRoutes = safeArray(expected?.owned_routes).map((route) => safeText(route)).filter(Boolean);
    const capabilities = contract?.engine_capabilities || {};
    const valid = safeText(contract?.kind) === 'redcube_native_ppt_python_engine'
      && safeText(contract?.language) === 'python'
      && Number(contract?.contract_version || 0) === 1
      && expectedRoutes.every((route) => ownedRoutes.includes(route))
      && safeText(contract?.input_boundary) === safeText(expected?.input_boundary)
      && safeText(contract?.review_boundary) === safeText(expected?.review_boundary)
      && Object.entries(REQUIRED_ENGINE_CAPABILITIES).every(([key, value]) => capabilities?.[key] === value)
      && contract?.true_render_proof?.required === true
      && contract?.true_render_proof?.renderer_kind === safeText(expected?.true_render_proof?.renderer_kind)
      && contract?.true_render_proof?.renderer_pipeline === safeText(expected?.true_render_proof?.renderer_pipeline)
      && contract?.true_render_proof?.runtime === safeText(expected?.true_render_proof?.runtime)
      && contract?.true_render_proof?.cross_platform_render_required === true;
    if (!valid) {
      throw new Error('Native PPT route requires python engine contract v1');
    }
    return expected;
  }

  function requireTrueRenderProof(payload: JsonRecord, shapeManifest: JsonRecord): JsonRecord {
    const expected = expectedNativeEngineContract()?.true_render_proof || {};
    const proof = payload?.render_proof || shapeManifest?.render_proof || {};
    const previewScreenshots = safeArray(proof?.preview_screenshots || payload?.preview_screenshots);
    const valid = safeText(proof?.source_surface_kind) === 'native_pptx'
      && safeText(proof?.renderer_kind) === safeText(expected?.renderer_kind)
      && safeText(proof?.renderer_pipeline) === safeText(expected?.renderer_pipeline)
      && safeText(proof?.runtime) === safeText(expected?.runtime)
      && proof?.cross_platform_render_required === true
      && proof?.synthetic_preview === false
      && proof?.required === true
      && (
        shapeManifest?.proof_flags == null
        || shapeManifest?.proof_flags?.libreoffice_headless_pdf_png_v1 === true
      )
      && previewScreenshots.length > 0
      && previewScreenshots.every((file) => existsSync(safeText(file)));
    if (!valid) {
      throw new Error('Native PPT route requires LibreOffice headless true-render proof; stale desktop-app, synthetic, or missing preview proof is blocked');
    }
    return {
      ...proof,
      source_surface_kind: 'native_pptx',
      renderer_kind: safeText(expected?.renderer_kind),
      renderer_pipeline: safeText(expected?.renderer_pipeline),
      runtime: safeText(expected?.runtime),
      cross_platform_render_required: true,
      synthetic_preview: false,
      required: true,
      preview_screenshots: previewScreenshots.map((file) => safeText(file)).filter(Boolean),
    };
  }

  function readNativeShapeManifest(file: string): JsonRecord {
    if (!file || !existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8'));
  }

  function aggregateNativeChecks(slideReviews: JsonRecord[]): JsonRecord {
    return Object.fromEntries(
      NATIVE_PPT_AGGREGATED_CHECK_KEYS.map((key) => [
        key,
        slideReviews.every((slide) => slide?.checks?.[key] !== false),
      ]),
    );
  }

  function nativeManifestIssues(shapeManifest: JsonRecord): string[] {
    return safeArray(shapeManifest?.slides)
      .flatMap((slide) => safeArray(slide?.issues).map((issue) => safeText(issue)).filter(Boolean));
  }

  function nativeManifestQualityPassed(shapeManifest: JsonRecord): boolean {
    const slides = safeArray(shapeManifest?.slides);
    if (slides.length === 0) return false;
    const checks = aggregateNativeChecks(slides);
    return nativeManifestIssues(shapeManifest).length === 0
      && NATIVE_PPT_AGGREGATED_CHECK_KEYS.every((key) => checks[key] === true);
  }

  function finiteNumberOrNull(value: unknown): number | null {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function nativeQualityMissingIssues(manifestSlide: JsonRecord | undefined, expectedProof: JsonRecord): string[] {
    if (!manifestSlide) return ['native_quality_metrics_missing'];
    const metrics = manifestSlide.metrics || {};
    const missing = NATIVE_QUALITY_REQUIRED_NUMERIC_METRIC_KEYS
      .filter((key) => finiteNumberOrNull(metrics[key]) === null);
    if (missing.length > 0) return ['native_quality_metrics_missing'];
    if (!safeText(metrics.composition_signature)) return ['native_quality_metrics_missing'];
    if (!manifestSlide.checks || typeof manifestSlide.checks !== 'object') return ['native_quality_checks_missing'];
    if (NATIVE_QUALITY_REQUIRED_BOOLEAN_METRIC_KEYS.some((key) => typeof metrics[key] !== 'boolean')) {
      return ['native_quality_metrics_missing'];
    }
    if (NATIVE_QUALITY_REQUIRED_BOOLEAN_CHECK_KEYS.some((key) => typeof manifestSlide.checks?.[key] !== 'boolean')) {
      return ['native_quality_checks_missing'];
    }
    const nativeShapes = safeArray(manifestSlide?.native_shapes);
    const hasChartShape = nativeShapes.some((shape) => {
      const text = `${safeText(shape?.kind)} ${safeText(shape?.role)} ${safeText(shape?.quality_role)}`.toLowerCase();
      return text.includes('chart');
    });
    const hasTableShape = nativeShapes.some((shape) => {
      const text = `${safeText(shape?.kind)} ${safeText(shape?.role)} ${safeText(shape?.quality_role)}`.toLowerCase();
      return text.includes('table');
    });
    if (hasChartShape && (!Array.isArray(metrics.chart_metrics) || metrics.chart_metrics.length === 0)) {
      return ['native_chart_metrics_missing'];
    }
    if (hasTableShape && (!Array.isArray(metrics.table_metrics) || metrics.table_metrics.length === 0)) {
      return ['native_table_metrics_missing'];
    }
    if (hasTableShape && finiteNumberOrNull(metrics.table_min_font_pt) === null) {
      return ['native_table_metrics_missing'];
    }
    if (!manifestSlide.preview_screenshot_sha256) return ['native_preview_screenshot_hash_missing'];
    if (manifestSlide.synthetic_preview !== false) return ['native_true_render_proof_missing'];
    if (safeText(manifestSlide.render_proof_source) !== safeText(expectedProof?.renderer_kind)) return ['native_true_render_proof_missing'];
    if (safeText(manifestSlide.renderer_pipeline) !== safeText(expectedProof?.renderer_pipeline)) return ['native_true_render_proof_missing'];
    return [];
  }

  function booleanCheck(manifestSlide: JsonRecord | undefined, key: string, missingQuality: boolean): boolean {
    if (missingQuality) return false;
    return manifestSlide?.checks?.[key] === true;
  }

  function nativeMechanicalReviewPayload(nativeArtifact: JsonRecord | null) {
    const bundle = nativeArtifact?.native_ppt_bundle || {};
    const shapeManifest = readNativeShapeManifest(safeText(bundle?.shape_manifest_file));
    const expectedProof = expectedNativeEngineContract()?.true_render_proof || {};
    const renderProof = shapeManifest?.render_proof || {};
    const renderProofScreenshots = safeArray(renderProof?.preview_screenshots);
    const missingRenderProof = safeText(renderProof?.source_surface_kind) !== 'native_pptx'
      || safeText(renderProof?.renderer_kind) !== safeText(expectedProof?.renderer_kind)
      || safeText(renderProof?.renderer_pipeline) !== safeText(expectedProof?.renderer_pipeline)
      || safeText(renderProof?.runtime) !== safeText(expectedProof?.runtime)
      || renderProof?.cross_platform_render_required !== true
      || renderProof?.synthetic_preview !== false
      || renderProof?.required !== true
      || shapeManifest?.proof_flags?.libreoffice_headless_pdf_png_v1 !== true
      || renderProofScreenshots.length === 0
      || !renderProofScreenshots.every((file) => existsSync(safeText(file)));
    const manifestSlidesById = new Map(
      safeArray(shapeManifest?.slides).map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const slideReviews = safeArray(bundle?.slides).map((slide) => {
      const slideId = safeText(slide?.slide_id);
      const manifestSlide = manifestSlidesById.get(slideId);
      const missingIssues = [
        ...nativeQualityMissingIssues(manifestSlide, expectedProof),
        ...(missingRenderProof ? ['native_true_render_proof_missing'] : []),
      ];
      const missingQuality = missingIssues.length > 0;
      return {
        slide_id: slideId,
        title: safeText(slide?.title),
        layout_family: safeText(slide?.layout_family),
        screenshot_file: safeText(slide?.preview_screenshot_file),
        checks: {
          overflow_free: booleanCheck(manifestSlide, 'overflow_free', missingQuality),
          occlusion_free: booleanCheck(manifestSlide, 'occlusion_free', missingQuality),
          visual_density_ok: booleanCheck(manifestSlide, 'visual_density_ok', missingQuality),
          speaker_fit_ok: booleanCheck(manifestSlide, 'speaker_fit_ok', missingQuality),
          edge_clearance_ok: booleanCheck(manifestSlide, 'edge_clearance_ok', missingQuality),
          block_content_fit_ok: booleanCheck(manifestSlide, 'block_content_fit_ok', missingQuality),
          title_typography_ok: booleanCheck(manifestSlide, 'title_typography_ok', missingQuality),
          body_text_readability_ok: booleanCheck(manifestSlide, 'body_text_readability_ok', missingQuality),
          typography_hierarchy_ok: booleanCheck(manifestSlide, 'typography_hierarchy_ok', missingQuality),
          title_core_overlap_ok: booleanCheck(manifestSlide, 'title_core_overlap_ok', missingQuality),
          page_number_consistency_ok: booleanCheck(manifestSlide, 'page_number_consistency_ok', missingQuality),
          external_audience_language_ok: booleanCheck(manifestSlide, 'external_audience_language_ok', missingQuality),
          title_safe_zone_clear: booleanCheck(manifestSlide, 'title_safe_zone_clear', missingQuality),
          table_legibility_ok: booleanCheck(manifestSlide, 'table_legibility_ok', missingQuality),
          layout_density_ok: booleanCheck(manifestSlide, 'layout_density_ok', missingQuality),
          slot_fill_ok: booleanCheck(manifestSlide, 'slot_fill_ok', missingQuality),
          audience_label_readability_ok: booleanCheck(manifestSlide, 'audience_label_readability_ok', missingQuality),
          content_depth_ok: booleanCheck(manifestSlide, 'content_depth_ok', missingQuality),
          grid_balance_ok: booleanCheck(manifestSlide, 'grid_balance_ok', missingQuality),
          visual_structure_present: booleanCheck(manifestSlide, 'visual_structure_present', missingQuality),
          non_text_visual_specific_ok: booleanCheck(manifestSlide, 'non_text_visual_specific_ok', missingQuality),
          mechanical_card_template_absent: booleanCheck(manifestSlide, 'mechanical_card_template_absent', missingQuality),
          panel_text_safe_area_ok: booleanCheck(manifestSlide, 'panel_text_safe_area_ok', missingQuality),
          short_label_wrap_ok: booleanCheck(manifestSlide, 'short_label_wrap_ok', missingQuality),
        },
        metrics: {
          title_font_size: Number(slide?.title_font_size || 32),
          text_char_count: finiteNumberOrNull(manifestSlide?.metrics?.text_char_count) ?? 0,
          block_count: finiteNumberOrNull(manifestSlide?.metrics?.block_count) ?? Number(slide?.shape_count || 0),
          overlap_pairs: finiteNumberOrNull(manifestSlide?.metrics?.overlap_pairs) ?? 0,
          structural_text_collision_count: finiteNumberOrNull(manifestSlide?.metrics?.structural_text_collision_count) ?? 0,
          clipped_nodes: finiteNumberOrNull(manifestSlide?.metrics?.clipped_nodes) ?? 0,
          occupied_ratio: finiteNumberOrNull(manifestSlide?.metrics?.occupied_ratio) ?? 0,
          primary_points: finiteNumberOrNull(manifestSlide?.metrics?.primary_points)
            ?? Math.max(1, Number(slide?.text_box_count || 0) - 1),
          edge_clearance: manifestSlide?.metrics?.edge_clearance || null,
          overlaps: safeArray(manifestSlide?.metrics?.overlaps),
          structural_text_collisions: safeArray(manifestSlide?.metrics?.structural_text_collisions),
          native_shape_count: Number(slide?.shape_count || 0),
          native_text_box_count: Number(slide?.text_box_count || 0),
          native_quality_source: 'shape_manifest',
          native_quality_model: shapeManifest?.native_quality_model || 'shape_manifest_layout_metrics',
          render_proof_source: missingRenderProof ? 'missing_contract_declared_true_render' : safeText(expectedProof?.renderer_kind),
          synthetic_preview: renderProof?.synthetic_preview !== false,
          block_content_failures: safeArray(manifestSlide?.metrics?.block_content_failures),
          operator_language_fragments: safeArray(manifestSlide?.metrics?.operator_language_fragments),
          title_safe_zone_clearance_ok: manifestSlide?.metrics?.title_safe_zone_clearance_ok === true,
          min_body_font_pt: finiteNumberOrNull(manifestSlide?.metrics?.min_body_font_pt),
          body_text_readability_floor_pt: finiteNumberOrNull(manifestSlide?.metrics?.body_text_readability_floor_pt),
          body_text_readability_ok: manifestSlide?.metrics?.body_text_readability_ok === true,
          body_text_font_failures: safeArray(manifestSlide?.metrics?.body_text_font_failures),
          typography_hierarchy_ratio: finiteNumberOrNull(manifestSlide?.metrics?.typography_hierarchy_ratio),
          typography_hierarchy_ok: manifestSlide?.metrics?.typography_hierarchy_ok === true,
          title_core_overlap_count: finiteNumberOrNull(manifestSlide?.metrics?.title_core_overlap_count),
          title_core_overlap_failures: safeArray(manifestSlide?.metrics?.title_core_overlap_failures),
          layout_variant: safeText(manifestSlide?.metrics?.layout_variant),
          composition_signature: safeText(manifestSlide?.metrics?.composition_signature),
          expected_slot_count: finiteNumberOrNull(manifestSlide?.metrics?.expected_slot_count),
          filled_slot_count: finiteNumberOrNull(manifestSlide?.metrics?.filled_slot_count),
          slot_fill_ok: manifestSlide?.metrics?.slot_fill_ok === true,
          slot_fill_failures: safeArray(manifestSlide?.metrics?.slot_fill_failures),
          audience_label_readability_ok: manifestSlide?.metrics?.audience_label_readability_ok === true,
          audience_label_font_floor_pt: finiteNumberOrNull(manifestSlide?.metrics?.audience_label_font_floor_pt),
          audience_label_readability_failures: safeArray(manifestSlide?.metrics?.audience_label_readability_failures),
          content_depth_ok: manifestSlide?.metrics?.content_depth_ok === true,
          content_depth_floor_chars: finiteNumberOrNull(manifestSlide?.metrics?.content_depth_floor_chars),
          content_depth_failures: safeArray(manifestSlide?.metrics?.content_depth_failures),
          grid_balance_ok: manifestSlide?.metrics?.grid_balance_ok === true,
          grid_balance_ratio: finiteNumberOrNull(manifestSlide?.metrics?.grid_balance_ratio),
          grid_balance_failures: safeArray(manifestSlide?.metrics?.grid_balance_failures),
          visual_structure_present: manifestSlide?.metrics?.visual_structure_present === true,
          non_text_visual_specific_ok: manifestSlide?.metrics?.non_text_visual_specific_ok === true,
          mechanical_card_template_absent: manifestSlide?.metrics?.mechanical_card_template_absent === true,
          mechanical_card_template_detected: manifestSlide?.metrics?.mechanical_card_template_detected === true,
          panel_text_safe_area_ok: manifestSlide?.metrics?.panel_text_safe_area_ok === true,
          panel_text_safe_area_failures: safeArray(manifestSlide?.metrics?.panel_text_safe_area_failures),
          short_label_wrap_ok: manifestSlide?.metrics?.short_label_wrap_ok === true,
          short_label_wrap_failures: safeArray(manifestSlide?.metrics?.short_label_wrap_failures),
          structural_visual_count: finiteNumberOrNull(manifestSlide?.metrics?.structural_visual_count),
          structural_visual_roles: safeArray(manifestSlide?.metrics?.structural_visual_roles).map((role) => safeText(role)),
          card_panel_count: finiteNumberOrNull(manifestSlide?.metrics?.card_panel_count),
          title_underline_absent_ok: manifestSlide?.metrics?.title_underline_absent_ok === true,
          title_underline_failures: safeArray(manifestSlide?.metrics?.title_underline_failures),
          table_min_font_pt: finiteNumberOrNull(manifestSlide?.metrics?.table_min_font_pt),
          card_blank_ratio: finiteNumberOrNull(manifestSlide?.metrics?.card_blank_ratio),
          table_metrics: manifestSlide?.metrics?.table_metrics || [],
        },
        issues: [
          ...safeArray(manifestSlide?.issues).map((issue) => safeText(issue)),
          ...missingIssues,
        ],
      };
    });
    const checks = aggregateNativeChecks(slideReviews);
    return {
      source_surface_kind: 'native_pptx',
      source_pptx: safeText(bundle?.pptx_file),
      shape_manifest_file: safeText(bundle?.shape_manifest_file),
      render_proof: renderProof,
      page_count: Number(bundle?.page_count || slideReviews.length),
      device_scale_factor: 1,
      screenshot_dimensions: bundle?.screenshot_dimensions || null,
      checks,
      metrics: {
        page_count: slideReviews.length,
        source_surface_kind: 'native_pptx',
        native_quality_model: shapeManifest?.native_quality_model || 'shape_manifest_layout_metrics',
        render_proof_source: missingRenderProof ? 'missing_contract_declared_true_render' : safeText(expectedProof?.renderer_kind),
        synthetic_preview: renderProof?.synthetic_preview !== false,
        average_density: slideReviews.reduce((sum, slide) => sum + Number(slide?.metrics?.occupied_ratio || 0), 0)
          / Math.max(slideReviews.length, 1),
      },
      slide_reviews: slideReviews,
    };
  }

  function summarizeNativeSlides(nativeArtifact: JsonRecord | null): JsonRecord[] {
    const shapeManifest = readNativeShapeManifest(safeText(nativeArtifact?.native_ppt_bundle?.shape_manifest_file));
    const manifestSlidesById = new Map(
      safeArray(shapeManifest?.slides).map((slide) => [safeText(slide?.slide_id), slide]),
    );
    return safeArray(nativeArtifact?.native_ppt_bundle?.slides).map((slide) => {
      const manifestSlide = manifestSlidesById.get(safeText(slide?.slide_id)) || {};
      const metrics = manifestSlide?.metrics || slide?.metrics || {};
      return {
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        layout_family: safeText(slide?.layout_family),
        layout_variant: safeText(metrics?.layout_variant),
        composition_signature: safeText(metrics?.composition_signature),
        expected_slot_count: Number(metrics?.expected_slot_count || 0),
        filled_slot_count: Number(metrics?.filled_slot_count || 0),
        slot_fill_ok: metrics?.slot_fill_ok === true,
        audience_label_readability_ok: metrics?.audience_label_readability_ok === true,
        content_depth_ok: metrics?.content_depth_ok === true,
        grid_balance_ok: metrics?.grid_balance_ok === true,
        structural_visual_count: Number(metrics?.structural_visual_count || 0),
        structural_visual_roles: safeArray(metrics?.structural_visual_roles).map((role) => safeText(role)),
        mechanical_card_template_absent: metrics?.mechanical_card_template_absent === true,
        non_text_visual_specific_ok: metrics?.non_text_visual_specific_ok === true,
        shape_count: Number(slide?.shape_count || 0),
        text_box_count: Number(slide?.text_box_count || 0),
        preview_screenshot_file: safeText(manifestSlide?.preview_screenshot_file || slide?.preview_screenshot_file),
      };
    });
  }

  return {
    nativeMechanicalReviewPayload,
    nativeManifestQualityPassed,
    readNativeShapeManifest,
    requireNativeEngineContract,
    requireTrueRenderProof,
    summarizeNativeSlides,
  };
}
