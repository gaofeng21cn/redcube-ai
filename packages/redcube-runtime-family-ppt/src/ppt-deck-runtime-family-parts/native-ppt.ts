import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runRedCubePythonHelper } from '@redcube/runtime-protocol';
import { createPptDeckVisualArtifactParts } from './visual-artifacts.js';
import { buildNativePptQualityNonregressionReadModel } from './native-ppt-quality-nonregression.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativeArtifactPathRequest {
  deliverablePaths: JsonRecord;
  deliverableId: string;
  route: NativePptRoute;
}

interface NativePptDeps {
  CODEX_DEFAULT_ADAPTER: string;
  CREATIVE_MATERIALIZED_FROM: string;
  NATIVE_PPT_ENGINE_CONTRACT: string;
  PYTHON_NATIVE: string;
  PROMPT_PACK?: Record<string, string>;
  attachCommon(route: string, contract: JsonRecord, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  buildAuthoringContext?(contract: JsonRecord): JsonRecord;
  collectSlidesNeedingTargetedRevision(slides: JsonRecord[]): JsonRecord[];
  creativeExecution(route: string, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  creativeSourceStamp(input: JsonRecord): JsonRecord;
  currentHtmlStageId(contract: JsonRecord, deliverablePaths: JsonRecord): string;
  ensureDir(dir: string): string;
  existsSync(file: string): boolean;
  generateStructuredArtifact?(input: JsonRecord): Promise<{
    data: JsonRecord;
    generationRuntime: JsonRecord;
  }>;
  readCurrentHtmlArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null;
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord | null;
  safeArray(value: unknown): JsonRecord[];
  safeFileMtimeMs(file: string): number;
  safeText(value: unknown, fallback?: string): string;
  stageArtifactPath(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): string;
  writeJson(file: string, data: unknown): void;
}

export function createPptDeckNativePptStageParts(deps: NativePptDeps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    NATIVE_PPT_ENGINE_CONTRACT,
    PYTHON_NATIVE,
    attachCommon,
    buildAuthoringContext,
    collectSlidesNeedingTargetedRevision,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    ensureDir,
    existsSync,
    generateStructuredArtifact,
    PROMPT_PACK,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
    writeJson,
  } = deps;

  let cachedNativeEngineContract: JsonRecord | null = null;
  const AI_FIRST_EDITING_CONTRACT = Object.freeze({
    contract_id: 'ppt_native_ai_first_editing_contract_v1',
    creative_owner: 'llm_agent',
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    python_helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  });
  const REQUIRED_ENGINE_CAPABILITIES = Object.freeze({
    authoring_ir: 'redcube_svg_ir',
    authoring_ir_version: 1,
    pptx_writer: 'redcube_drawingml_writer',
    editable_pptx: true,
    strict_svg_preflight: true,
    true_render_proof_required: true,
    true_render_proof_renderer: 'libreoffice_headless',
    cross_platform_render_required: true,
    screenshot_packaging: false,
  });

  function expectedNativeEngineContract(): JsonRecord {
    if (cachedNativeEngineContract) return cachedNativeEngineContract;
    if (!existsSync(NATIVE_PPT_ENGINE_CONTRACT)) {
      throw new Error(`Missing native PPT engine contract: ${NATIVE_PPT_ENGINE_CONTRACT}`);
    }
    cachedNativeEngineContract = JSON.parse(readFileSync(NATIVE_PPT_ENGINE_CONTRACT, 'utf-8')) as JsonRecord;
    return cachedNativeEngineContract;
  }

  function runPython(helper: string, args: string[]): JsonRecord {
    return runRedCubePythonHelper(helper, args, {
      fileExists: existsSync,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  function currentNativePptStageId(contract: JsonRecord, deliverablePaths: JsonRecord): NativePptRoute | '' {
    const authorFile = stageArtifactPath(contract, deliverablePaths, 'author_pptx_native');
    const repairFile = stageArtifactPath(contract, deliverablePaths, 'repair_pptx_native');
    const authorMtimeMs = safeFileMtimeMs(authorFile);
    const repairMtimeMs = safeFileMtimeMs(repairFile);
    if (repairMtimeMs > 0 && repairMtimeMs >= authorMtimeMs) {
      return 'repair_pptx_native';
    }
    return authorMtimeMs > 0 ? 'author_pptx_native' : '';
  }

  function readCurrentNativePptArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null {
    const stageId = currentNativePptStageId(contract, deliverablePaths);
    return stageId ? readStageArtifact(contract, deliverablePaths, stageId) : null;
  }

  function isNativePptArtifact(artifact: JsonRecord | null | undefined): boolean {
    return Boolean(safeText(artifact?.native_ppt_bundle?.pptx_file));
  }

  const visualArtifacts = createPptDeckVisualArtifactParts({
    currentHtmlStageId,
    currentNativePptStageId,
    existsSync,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
  });

  function nativeArtifactPaths({ deliverablePaths, deliverableId, route }: NativeArtifactPathRequest) {
    const nativeDir = ensureDir(path.join(deliverablePaths.artifactsDir, 'native_ppt'));
    const reportDir = ensureDir(path.join(deliverablePaths.reportsDir, 'native_ppt'));
    const basename = `${deliverableId}-${route}`;
    return {
      inputFile: path.join(nativeDir, `${basename}-input.json`),
      pptxFile: path.join(nativeDir, `${basename}.pptx`),
      pdfFile: path.join(nativeDir, `${basename}.pdf`),
      editableShapePlanFile: path.join(nativeDir, `${basename}-editable-shape-plan.json`),
      shapeManifestFile: path.join(nativeDir, `${basename}-shape-manifest.json`),
      repairLogFile: path.join(nativeDir, `${basename}-repair-log.json`),
      previewDir: ensureDir(path.join(reportDir, `${basename}-screenshots`)),
    };
  }

  function repairFeedbackFromReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    return collectSlidesNeedingTargetedRevision(safeArray(reviewArtifact?.slide_reviews))
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: safeArray(slide?.issues),
        mechanical_issues: safeArray(slide?.mechanical_issues),
        visual_findings: safeArray(slide?.ai_review?.visual_findings),
        recommended_fix: safeText(slide?.ai_review?.recommended_fix),
      }))
      .filter((slide) => slide.slide_id);
  }

  function buildUnitRepairScope({
    route,
    blueprintArtifact,
    repairFeedback,
  }: {
    route: NativePptRoute;
    blueprintArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
  }) {
    const allSlideIds = safeArray(blueprintArtifact?.slide_blueprint?.slides)
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    const targetSlideIds = route === 'repair_pptx_native'
      ? [...new Set(safeArray(repairFeedback).map((slide) => safeText(slide?.slide_id)).filter(Boolean))]
      : allSlideIds;
    const targetSet = new Set(targetSlideIds);
    return {
      family: 'ppt_deck',
      route,
      scope: route === 'repair_pptx_native' ? 'page' : 'deck',
      target_slide_ids: targetSlideIds,
      preserved_slide_ids: allSlideIds.filter((slideId) => !targetSet.has(slideId)),
      source_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      input_boundary: route === 'repair_pptx_native'
        ? 'blocked_slide_review_feedback_plus_prior_native_shape_manifest'
        : 'slide_blueprint_plus_visual_direction',
      output_boundary: 'editable_shape_plan_plus_shape_manifest',
      screenshot_review_reuse: route === 'repair_pptx_native',
    };
  }

  function nativeShapePlanOutputContract(route: NativePptRoute) {
    return {
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      editable_shape_plan: {
        contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
        route,
        scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
        target_slide_ids: ['S02'],
        authoring_ir: {
          kind: 'redcube_svg_ir',
          version: 1,
          required: true,
          strict_svg_preflight_required: true,
          allowed_svg_tags: ['svg', 'g', 'rect', 'text'],
          unsupported_svg_tags: ['image', 'foreignObject', 'script'],
        },
        slides: [
          {
            slide_id: 'S01',
            title: '<audience-facing title>',
            layout_family: '<visual layout family>',
            core_sentence: '<audience-facing core sentence>',
            page_core_content: ['<editable text>'],
            native_shapes: [
              {
                shape_id: 'S01-title',
                kind: 'text_box',
                role: 'title',
                editable_text: '<text>',
              },
            ],
            redcube_svg_ir_intent: {
              root_viewbox: '0 0 1152 648',
              editable_text_required: true,
              required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'group:content_point'],
            },
          },
        ],
      },
    };
  }

  function normalizeEditableShapePlan(data: JsonRecord, route: NativePptRoute) {
    const plan = data?.editable_shape_plan || data?.shape_plan || {};
    const slides = safeArray(plan?.slides);
    if (slides.length === 0) {
      throw new Error(`Native PPT ${route} requires an AI-authored editable_shape_plan.slides array`);
    }
    return {
      ...plan,
      contract_kind: safeText(plan?.contract_kind, 'redcube_ai_first_native_ppt_shape_plan'),
      route: safeText(plan?.route, route),
      slides,
    };
  }

  async function generateEditableShapePlan({
    route,
    contract,
    deliverablePaths,
    blueprintArtifact,
    visualArtifact,
    repairFeedback,
    unitRepairScope,
    adapter,
  }: {
    route: NativePptRoute;
    contract: JsonRecord;
    deliverablePaths: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
    adapter: string;
  }) {
    if (typeof generateStructuredArtifact !== 'function') {
      throw new Error('Native PPT proof lane requires generateStructuredArtifact for AI-first shape planning');
    }
    const currentNativeArtifact = route === 'repair_pptx_native'
      ? readCurrentNativePptArtifact(contract, deliverablePaths)
      : null;
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route,
      promptRelativePath: PROMPT_PACK?.[route],
      context: {
        ...(typeof buildAuthoringContext === 'function' ? buildAuthoringContext(contract) : {}),
        ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
        unit_repair_scope: unitRepairScope,
        blueprint: blueprintArtifact?.slide_blueprint || {},
        visual_direction: visualArtifact?.visual_direction || {},
        repair_feedback: safeArray(repairFeedback),
        prior_native_ppt_bundle: route === 'repair_pptx_native'
          ? {
              pptx_file: safeText(currentNativeArtifact?.native_ppt_bundle?.pptx_file),
              shape_manifest_file: safeText(currentNativeArtifact?.native_ppt_bundle?.shape_manifest_file),
              slides: summarizeNativeSlides(currentNativeArtifact),
            }
          : null,
      },
      outputContract: nativeShapePlanOutputContract(route),
      cwd: deliverablePaths.deliverableDir,
    });
    return {
      editableShapePlan: normalizeEditableShapePlan(data, route),
      generationRuntime,
      modelContract: data?.ai_first_editing_contract || null,
    };
  }

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

  function stableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableJson(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.keys(value as JsonRecord).sort().map((key) => (
        `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`
      )).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function slideEvidencePayload(slide: JsonRecord | undefined): JsonRecord | null {
    if (!slide) return null;
    const {
      preview_screenshot_file: _previewScreenshotFile,
      screenshot_file: _screenshotFile,
      redcube_svg_ir_file: _redcubeSvgIrFile,
      ...content
    } = slide;
    return content;
  }

  function slideEvidenceHash(slide: JsonRecord | undefined): string | null {
    const payload = slideEvidencePayload(slide);
    if (!payload) return null;
    return createHash('sha256').update(stableJson(payload)).digest('hex');
  }

  function repairReasonFromFeedback(feedback: JsonRecord | undefined): JsonRecord {
    return {
      issues: safeArray(feedback?.issues).map((issue) => safeText(issue)).filter(Boolean),
      mechanical_issues: safeArray(feedback?.mechanical_issues).map((issue) => safeText(issue)).filter(Boolean),
      visual_findings: safeArray(feedback?.visual_findings).map((issue) => safeText(issue)).filter(Boolean),
      recommended_fix: safeText(feedback?.recommended_fix),
    };
  }

  function buildRepairEvidence({
    route,
    priorShapeManifest,
    shapeManifest,
    repairFeedback,
    unitRepairScope,
  }: {
    route: NativePptRoute;
    priorShapeManifest: JsonRecord;
    shapeManifest: JsonRecord;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
  }): JsonRecord {
    const priorSlidesById = new Map(
      safeArray(priorShapeManifest?.slides).map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const afterSlides = safeArray(shapeManifest?.slides);
    const afterSlidesById = new Map(afterSlides.map((slide) => [safeText(slide?.slide_id), slide]));
    const feedbackById = new Map(safeArray(repairFeedback).map((slide) => [safeText(slide?.slide_id), slide]));
    const targetSlideIds = safeArray(unitRepairScope?.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean);
    const preservedSlideIds = safeArray(unitRepairScope?.preserved_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean);
    const targetSet = new Set(targetSlideIds);
    const allSlideIds = [...new Set([
      ...safeArray(priorShapeManifest?.slides).map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      ...afterSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
    ])];
    const perSlideHashes = allSlideIds.map((slideId) => {
      const beforeSlide = priorSlidesById.get(slideId);
      const afterSlide = afterSlidesById.get(slideId);
      const beforeHash = slideEvidenceHash(beforeSlide);
      const afterHash = slideEvidenceHash(afterSlide);
      const targeted = targetSet.has(slideId);
      return {
        slide_id: slideId,
        targeted,
        before_slide_hash: beforeHash,
        after_slide_hash: afterHash,
        preserved_slide_hash: targeted ? null : beforeHash,
        hash_status: beforeHash && afterHash && beforeHash === afterHash ? 'unchanged' : targeted ? 'changed_by_targeted_repair' : 'changed_without_target',
        targeted_repair_reason: targeted ? repairReasonFromFeedback(feedbackById.get(slideId)) : null,
      };
    });
    const preservedSlideHashes = preservedSlideIds.map((slideId) => {
      const evidence = perSlideHashes.find((slide) => slide.slide_id === slideId);
      return {
        slide_id: slideId,
        before_slide_hash: evidence?.before_slide_hash || null,
        after_slide_hash: evidence?.after_slide_hash || null,
        preserved_slide_hash: evidence?.preserved_slide_hash || null,
        proof_status: evidence?.hash_status === 'unchanged' ? 'unchanged' : 'changed_without_target',
      };
    });
    const repairUnits = targetSlideIds.map((slideId) => {
      const feedback = feedbackById.get(slideId);
      const beforeSlide = priorSlidesById.get(slideId);
      const afterSlide = afterSlidesById.get(slideId);
      return {
        slide_id: slideId,
        reason: repairReasonFromFeedback(feedback),
        input: {
          source_review_stage: 'screenshot_review',
          review_feedback: feedback || null,
          before_slide_hash: slideEvidenceHash(beforeSlide),
          before_slide_manifest: beforeSlide || null,
        },
        output: {
          after_slide_hash: slideEvidenceHash(afterSlide),
          after_slide_manifest: afterSlide || null,
        },
      };
    });
    return {
      evidence_surface: 'native_ppt_repair_evidence_v1',
      route,
      source_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      per_slide_hashes: perSlideHashes,
      preserved_slide_hashes: preservedSlideHashes,
      repair_units: repairUnits,
      non_blocking_slide_reuse_ok: preservedSlideHashes.every((slide) => slide.proof_status === 'unchanged'),
    };
  }

  function aggregateNativeChecks(slideReviews: JsonRecord[]): JsonRecord {
    const checkKeys = [
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'speaker_fit_ok',
      'edge_clearance_ok',
      'block_content_fit_ok',
      'title_typography_ok',
      'page_number_consistency_ok',
      'external_audience_language_ok',
      'title_safe_zone_clear',
      'table_legibility_ok',
      'layout_density_ok',
    ];
    return Object.fromEntries(
      checkKeys.map((key) => [
        key,
        slideReviews.every((slide) => slide?.checks?.[key] !== false),
      ]),
    );
  }

  function finiteNumberOrNull(value: unknown): number | null {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function nativeQualityMissingIssues(manifestSlide: JsonRecord | undefined, expectedProof: JsonRecord): string[] {
    if (!manifestSlide) return ['native_quality_metrics_missing'];
    const metrics = manifestSlide.metrics || {};
    const missing = [
      ['text_char_count', metrics.text_char_count],
      ['block_count', metrics.block_count],
      ['overlap_pairs', metrics.overlap_pairs],
      ['clipped_nodes', metrics.clipped_nodes],
      ['occupied_ratio', metrics.occupied_ratio],
      ['primary_points', metrics.primary_points],
      ['title_safe_zone_clearance_ok', metrics.title_safe_zone_clearance_ok],
    ].filter(([, value]) => finiteNumberOrNull(value) === null);
    if (missing.length > 0) return ['native_quality_metrics_missing'];
    if (!manifestSlide.checks || typeof manifestSlide.checks !== 'object') return ['native_quality_checks_missing'];
    const nativeShapes = safeArray(manifestSlide?.native_shapes);
    const hasChartShape = nativeShapes.some((shape) => {
      const text = `${safeText(shape?.kind)} ${safeText(shape?.role)} ${safeText(shape?.quality_role)}`.toLowerCase();
      return text.includes('chart');
    });
    const hasTableShape = nativeShapes.some((shape) => {
      const text = `${safeText(shape?.kind)} ${safeText(shape?.role)} ${safeText(shape?.quality_role)}`.toLowerCase();
      return text.includes('table');
    });
    if (hasChartShape && (!metrics.chart_metrics || typeof metrics.chart_metrics !== 'object')) {
      return ['native_chart_metrics_missing'];
    }
    if (hasTableShape && (!metrics.table_metrics || typeof metrics.table_metrics !== 'object')) {
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
          page_number_consistency_ok: booleanCheck(manifestSlide, 'page_number_consistency_ok', missingQuality),
          external_audience_language_ok: booleanCheck(manifestSlide, 'external_audience_language_ok', missingQuality),
          title_safe_zone_clear: booleanCheck(manifestSlide, 'title_safe_zone_clear', missingQuality),
          table_legibility_ok: booleanCheck(manifestSlide, 'table_legibility_ok', missingQuality),
          layout_density_ok: booleanCheck(manifestSlide, 'layout_density_ok', missingQuality),
        },
        metrics: {
          title_font_size: Number(slide?.title_font_size || 32),
          text_char_count: finiteNumberOrNull(manifestSlide?.metrics?.text_char_count) ?? 0,
          block_count: finiteNumberOrNull(manifestSlide?.metrics?.block_count) ?? Number(slide?.shape_count || 0),
          overlap_pairs: finiteNumberOrNull(manifestSlide?.metrics?.overlap_pairs) ?? 0,
          clipped_nodes: finiteNumberOrNull(manifestSlide?.metrics?.clipped_nodes) ?? 0,
          occupied_ratio: finiteNumberOrNull(manifestSlide?.metrics?.occupied_ratio) ?? 0,
          primary_points: finiteNumberOrNull(manifestSlide?.metrics?.primary_points)
            ?? Math.max(1, Number(slide?.text_box_count || 0) - 1),
          edge_clearance: manifestSlide?.metrics?.edge_clearance || null,
          overlaps: safeArray(manifestSlide?.metrics?.overlaps),
          native_shape_count: Number(slide?.shape_count || 0),
          native_text_box_count: Number(slide?.text_box_count || 0),
          native_quality_source: 'shape_manifest',
          native_quality_model: shapeManifest?.native_quality_model || 'shape_manifest_layout_metrics',
          render_proof_source: missingRenderProof ? 'missing_contract_declared_true_render' : safeText(expectedProof?.renderer_kind),
          synthetic_preview: renderProof?.synthetic_preview !== false,
          block_content_failures: safeArray(manifestSlide?.metrics?.block_content_failures),
          operator_language_fragments: safeArray(manifestSlide?.metrics?.operator_language_fragments),
          title_safe_zone_clearance_ok: manifestSlide?.metrics?.title_safe_zone_clearance_ok === true,
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
    return safeArray(nativeArtifact?.native_ppt_bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      layout_family: safeText(slide?.layout_family),
      shape_count: Number(slide?.shape_count || 0),
      text_box_count: Number(slide?.text_box_count || 0),
      preview_screenshot_file: safeText(slide?.preview_screenshot_file),
    }));
  }

  async function buildNativePptArtifact({
    deliverableId,
    contract,
    deliverablePaths,
    route = 'author_pptx_native',
    adapter = CODEX_DEFAULT_ADAPTER,
  }: {
    deliverableId: string;
    contract: JsonRecord;
    deliverablePaths: JsonRecord;
    route?: NativePptRoute;
    adapter?: string;
  }) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const reviewArtifact = route === 'repair_pptx_native'
      ? readStageArtifact(contract, deliverablePaths, 'screenshot_review')
      : null;
    const priorNativeArtifact = route === 'repair_pptx_native'
      ? readCurrentNativePptArtifact(contract, deliverablePaths)
      : null;
    const priorShapeManifest = route === 'repair_pptx_native'
      ? readNativeShapeManifest(safeText(priorNativeArtifact?.native_ppt_bundle?.shape_manifest_file))
      : {};
    const repairFeedback = route === 'repair_pptx_native'
      ? repairFeedbackFromReview(reviewArtifact)
      : [];
    const unitRepairScope = buildUnitRepairScope({ route, blueprintArtifact, repairFeedback });
    const paths = nativeArtifactPaths({ deliverablePaths, deliverableId, route });
    const {
      editableShapePlan,
      generationRuntime,
      modelContract,
    } = await generateEditableShapePlan({
      route,
      contract,
      deliverablePaths,
      blueprintArtifact,
      visualArtifact,
      repairFeedback,
      unitRepairScope,
      adapter,
    });
    writeJson(paths.editableShapePlanFile, editableShapePlan);
    writeJson(paths.inputFile, {
      route,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      contract: {
        overlay: contract.overlay,
        profile_id: contract.profile_id,
        title: contract.title,
        goal: contract.goal,
      },
      blueprint: blueprintArtifact?.slide_blueprint || {},
      visual_direction: visualArtifact?.visual_direction || {},
      editable_shape_plan: editableShapePlan,
      editable_shape_plan_file: paths.editableShapePlanFile,
      repair_feedback: repairFeedback,
    });
    const python = runPython(PYTHON_NATIVE, [
      '--input-json', paths.inputFile,
      '--mode', route === 'repair_pptx_native' ? 'repair' : 'author',
      '--output-pptx', paths.pptxFile,
      '--shape-manifest', paths.shapeManifestFile,
      '--preview-dir', paths.previewDir,
      '--output-pdf', paths.pdfFile,
      '--repair-log', paths.repairLogFile,
      '--engine-contract', NATIVE_PPT_ENGINE_CONTRACT,
    ]);
    const payload = python.payload;
    const engineContract = requireNativeEngineContract(payload);
    if (Number(payload.shape_manifest_schema_version || 0) !== 1) {
      throw new Error('Native PPT route requires shape manifest schema_version 1');
    }
    const shapeManifest = existsSync(paths.shapeManifestFile)
      ? JSON.parse(readFileSync(paths.shapeManifestFile, 'utf-8'))
      : {};
    const renderProof = requireTrueRenderProof(payload, shapeManifest);
    writeJson(paths.shapeManifestFile, {
      ...shapeManifest,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      editable_shape_plan_file: paths.editableShapePlanFile,
      engine_capabilities: payload.engine_capabilities || shapeManifest.engine_capabilities || REQUIRED_ENGINE_CAPABILITIES,
      render_proof: renderProof,
      proof_flags: {
        ...(shapeManifest.proof_flags || {}),
        true_render_proof: true,
        libreoffice_headless_pdf_png_v1: safeText(renderProof.renderer_pipeline) === 'libreoffice_headless_pdf_png_v1',
        synthetic_preview_allowed: false,
      },
    });
    const repairLog = payload.repair_log || {
      target_slide_ids: repairFeedback.map((slide) => slide.slide_id),
      consumed_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      repair_log_file: paths.repairLogFile,
    };
    const repairEvidence = buildRepairEvidence({
      route,
      priorShapeManifest,
      shapeManifest: readNativeShapeManifest(paths.shapeManifestFile),
      repairFeedback,
      unitRepairScope,
    });
    const enrichedRepairLog = {
      ...repairLog,
      repair_evidence: repairEvidence,
      per_slide_hashes: repairEvidence.per_slide_hashes,
      preserved_slide_hashes: repairEvidence.preserved_slide_hashes,
      repair_units: repairEvidence.repair_units,
      non_blocking_slide_reuse_ok: repairEvidence.non_blocking_slide_reuse_ok,
    };
    writeJson(paths.repairLogFile, enrichedRepairLog);
    const qualityNonregressionReadModel = buildNativePptQualityNonregressionReadModel({
      route,
      editableShapePlanFile: paths.editableShapePlanFile,
      shapeManifestFile: paths.shapeManifestFile,
      renderProof,
      repairEvidence,
    });
    return {
      ...attachCommon(route, contract, null, adapter),
      status: 'completed',
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      creative_execution: {
        ...creativeExecution(route, generationRuntime, adapter),
        overlay: 'native_ppt_authoring',
      },
      native_ppt_bundle: {
        source_visual_route: route,
        builder: payload.builder || { kind: 'python_pptx_native_shapes' },
        capability: payload.capability || null,
        engine_capabilities: payload.engine_capabilities || shapeManifest.engine_capabilities || REQUIRED_ENGINE_CAPABILITIES,
        render_proof: renderProof,
        redcube_svg_ir: payload.redcube_svg_ir || shapeManifest.redcube_svg_ir || null,
        ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
        ai_first_shape_plan_contract: modelContract || AI_FIRST_EDITING_CONTRACT,
        engine_contract: engineContract,
        engine_contract_file: NATIVE_PPT_ENGINE_CONTRACT,
        shape_manifest_schema_version: Number(payload.shape_manifest_schema_version || 0),
        editable_artifact: true,
        editable_shape_plan_file: paths.editableShapePlanFile,
        quality_nonregression_read_model_ref: 'native_quality_nonregression_read_model',
        pptx_file: safeText(payload.pptx_file, paths.pptxFile),
        pdf_file: safeText(payload.pdf_file, paths.pdfFile),
        shape_manifest_file: safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        repair_log_file: safeText(payload.repair_log_file, paths.repairLogFile),
        page_count: Number(payload.page_count || 0),
        screenshot_dimensions: payload.screenshot_dimensions || shapeManifest.screenshot_dimensions || null,
        preview_screenshots: safeArray(renderProof.preview_screenshots),
        slides: safeArray(payload.slides),
        python_helper_invocation: python.package_module
          ? {
              helper_id: python.helper_id,
              package_module: python.package_module,
              command: [...python.argv, '--input-json', paths.inputFile],
            }
          : null,
        creative_sources: {
          pptx_materialization: creativeSourceStamp({
            route,
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'editable_native_pptx',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          editable_shape_plan: creativeSourceStamp({
            route,
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'editable_native_ppt_shape_plan',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      native_ppt_repair_log: {
        ...enrichedRepairLog,
        consumed_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : enrichedRepairLog.consumed_review_stage,
        target_slide_ids: safeArray(enrichedRepairLog.target_slide_ids),
        preserved_slide_ids: safeArray(enrichedRepairLog.preserved_slide_ids),
        blocked_slide_ids_source: safeText(enrichedRepairLog.blocked_slide_ids_source),
        scope: safeText(enrichedRepairLog.scope, route === 'repair_pptx_native' ? 'page' : 'deck'),
        feedback_count: Number(enrichedRepairLog.feedback_count || repairFeedback.length || 0),
        repair_log_file: safeText(enrichedRepairLog.repair_log_file, paths.repairLogFile),
      },
      native_quality_nonregression_read_model: qualityNonregressionReadModel,
      artifact_refs: [
        paths.inputFile,
        paths.editableShapePlanFile,
        safeText(payload.pptx_file, paths.pptxFile),
        safeText(payload.pdf_file, paths.pdfFile),
        safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        safeText(payload.repair_log_file, paths.repairLogFile),
        NATIVE_PPT_ENGINE_CONTRACT,
        ...safeArray(renderProof.preview_screenshots),
      ].filter(Boolean),
      review_state_patch: {
        current_status: 'draft',
        ready_for_export: false,
        latest_review_stage: route,
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
    };
  }

  return {
    buildNativePptArtifact,
    currentNativePptStageId,
    currentVisualStageId: visualArtifacts.currentVisualStageId,
    isNativePptArtifact,
    nativeMechanicalReviewPayload,
    imagePagesMechanicalReviewPayload: visualArtifacts.imagePagesMechanicalReviewPayload,
    readCurrentNativePptArtifact,
    readCurrentVisualArtifact: visualArtifacts.readCurrentVisualArtifact,
    isImagePagesArtifact: visualArtifacts.isImagePagesArtifact,
    summarizeNativeSlides,
    summarizeImagePages: visualArtifacts.summarizeImagePages,
    visualArtifactMtimeMs: visualArtifacts.visualArtifactMtimeMs,
  };
}
