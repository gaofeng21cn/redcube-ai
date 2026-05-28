import path from 'node:path';
import { readFileSync } from 'node:fs';
import { runRedCubePythonHelper } from '@redcube/runtime-protocol';
import { createPptDeckVisualArtifactParts } from './visual-artifacts.js';
import { buildNativePptQualityNonregressionReadModel } from './native-ppt-quality-nonregression.js';
import { createNativePptPlanIntegrityParts } from './native-ppt-plan-integrity.js';
import { createNativePptPlanPreflightParts } from './native-ppt-plan-preflight.js';
import { createNativePptProofReviewParts } from './native-ppt-proof-review.js';
import { buildNativeShapePlanOutputContract } from './native-ppt-shape-plan-contract.js';
import { createNativePptRepairEvidenceParts } from './native-ppt-repair-evidence.js';
import {
  NATIVE_PPT_AGGREGATED_CHECK_KEYS,
  REQUIRED_ENGINE_CAPABILITIES,
} from './native-ppt-quality-contract.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativeArtifactPathRequest {
  deliverablePaths: JsonRecord;
  deliverableId: string;
  route: NativePptRoute;
}

interface NativePlanAttempt {
  editableShapePlan: JsonRecord;
  generationRuntime: JsonRecord;
  modelContract: JsonRecord | null;
  validationFeedback: JsonRecord | null;
  attemptIndex: number;
  executorRetryCount: number;
  attemptArtifactRefs: string[];
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
  const {
    buildRepairEvidence,
  } = createNativePptRepairEvidenceParts({ safeArray, safeText });
  const {
    assertNativeDeckCompleteness,
    mergeRepairEditableShapePlan,
  } = createNativePptPlanIntegrityParts({ existsSync, safeArray, safeText });
  const nativePlanPreflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract,
    safeArray,
    safeText,
  });

  let cachedNativeEngineContract: JsonRecord | null = null;
  const AI_FIRST_EDITING_CONTRACT = Object.freeze({
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
  });
  const OFFICECLI_MATERIALIZER_POLICY = Object.freeze({
    policy_id: 'ppt_native_officecli_materializer_quality_gate_v1',
    adoption_status: 'qa_materializer_discipline_only',
    rca_main_workflow_owner: 'redcube_stage_review_export',
    skill_authoring_loop_adopted: false,
    materializer_role: 'default_editable_pptx_materializer_and_qa_gate',
    current_pptx_writer: 'officecli_pptx_materializer',
    officecli_writer_adapter_default_enabled: true,
    required_gate_refs: [
      'officecli_save_before_close',
      'officecli_validate',
      'officecli_view_issues',
      'officecli_view_text',
    ],
    save_before_close_required: true,
    validate_required: true,
    view_issues_required: true,
    view_text_required: true,
    true_render_proof_required_after_officecli_gate: true,
    true_render_proof_substitute_allowed: false,
    deterministic_cjk_font_family: 'Noto Sans CJK SC',
    default_visual_route_changed: false,
    default_executor_changed: false,
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

  function runPythonValidation(inputFile: string): JsonRecord {
    return runRedCubePythonHelper(PYTHON_NATIVE, [
      '--input-json', inputFile,
      '--mode', 'validate_plan',
      '--output-pptx', path.join(path.dirname(inputFile), 'validate-plan.pptx'),
      '--shape-manifest', path.join(path.dirname(inputFile), 'validate-plan-shape-manifest.json'),
      '--preview-dir', path.join(path.dirname(inputFile), 'validate-plan-screenshots'),
      '--output-pdf', path.join(path.dirname(inputFile), 'validate-plan.pdf'),
      '--repair-log', path.join(path.dirname(inputFile), 'validate-plan-repair-log.json'),
      '--engine-contract', NATIVE_PPT_ENGINE_CONTRACT,
    ], {
      fileExists: existsSync,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  const nativeProofReviewParts = createNativePptProofReviewParts({
    existsSync,
    expectedNativeEngineContract,
    safeArray,
    safeText,
  });
  const {
    nativeMechanicalReviewPayload,
    nativeManifestQualityPassed,
    readNativeShapeManifest,
    requireNativeEngineContract,
    requireTrueRenderProof,
    summarizeNativeSlides,
  } = nativeProofReviewParts;

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

  function readAuthorNativePptArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null {
    return readStageArtifact(contract, deliverablePaths, 'author_pptx_native');
  }

  function readPriorEditableShapePlan(nativeArtifact: JsonRecord | null): JsonRecord {
    const file = safeText(nativeArtifact?.native_ppt_bundle?.editable_shape_plan_file);
    if (!file || !existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
  }

  function completeRepairShapePlanWithLockedSpec(data: JsonRecord, currentNativeArtifact: JsonRecord | null): JsonRecord {
    const plan = data?.editable_shape_plan || data?.shape_plan || {};
    const hasDesignSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
      && safeText(plan.design_spec_lock?.spec_id)
      && safeText(plan.design_spec_lock?.owner)
      && safeText(plan.design_spec_lock?.motif)
      && Array.isArray(plan.design_spec_lock?.layout_archetypes)
      && plan.design_spec_lock.layout_archetypes.length >= 3;
    if (hasDesignSpecLock) return data;
    const priorPlan = readPriorEditableShapePlan(currentNativeArtifact);
    const priorDesignSpecLock = priorPlan?.design_spec_lock && typeof priorPlan.design_spec_lock === 'object'
      ? priorPlan.design_spec_lock
      : {};
    const priorHasLockedSpec = safeText(priorDesignSpecLock?.spec_id)
      && safeText(priorDesignSpecLock?.owner)
      && safeText(priorDesignSpecLock?.motif)
      && Array.isArray(priorDesignSpecLock?.layout_archetypes)
      && priorDesignSpecLock.layout_archetypes.length >= 3;
    if (!priorHasLockedSpec) return data;
    return {
      ...data,
      editable_shape_plan: {
        ...plan,
        design_spec_lock: priorDesignSpecLock,
        design_spec_lock_inheritance: {
          source: 'prior_ai_authored_native_shape_plan',
          reason: 'repair inherits the locked AI design system before applying targeted slide geometry changes',
          helper_generated_design: false,
        },
      },
    };
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
      planValidationFile: path.join(nativeDir, `${basename}-plan-validation-input.json`),
      previewDir: ensureDir(path.join(reportDir, `${basename}-screenshots`)),
    };
  }

  function buildNativeInputPayload({
    route,
    unitRepairScope,
    contract,
    blueprintArtifact,
    visualArtifact,
    editableShapePlan,
    editableShapePlanFile,
    repairFeedback,
  }: {
    route: NativePptRoute;
    unitRepairScope: JsonRecord;
    contract: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    editableShapePlan: JsonRecord;
    editableShapePlanFile: string;
    repairFeedback: JsonRecord[];
  }): JsonRecord {
    return {
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
      editable_shape_plan_file: editableShapePlanFile,
      repair_feedback: repairFeedback,
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
        source_review_stage: 'screenshot_review',
      }))
      .filter((slide) => slide.slide_id);
  }

  function repairFeedbackFromDirectorReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    const review = reviewArtifact?.visual_director_review || {};
    const preflight = review?.deterministic_preflight || {};
    const findings = safeArray(preflight?.findings).map((finding) => safeText(finding)).filter(Boolean);
    return safeArray(review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean)
      .map((slideId) => {
        const slideFindings = findings.filter((finding) => finding.includes(slideId));
        return {
          slide_id: slideId,
          title: '',
          issues: slideFindings,
          mechanical_issues: [
            ...(slideFindings.some((finding) => /slot fill/i.test(finding)) ? ['native_slot_fill_failed'] : []),
            ...(slideFindings.some((finding) => /content depth/i.test(finding)) ? ['native_content_depth_failed'] : []),
            ...(slideFindings.some((finding) => /overlap|occlusion/i.test(finding)) ? ['occlusion_detected'] : []),
            ...(slideFindings.some((finding) => /overflow|fit/i.test(finding)) ? ['block_content_overflow_detected'] : []),
          ],
          visual_findings: slideFindings,
          recommended_fix: safeText(review?.review_summary),
          source_review_stage: 'visual_director_review',
        };
      });
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
    return buildNativeShapePlanOutputContract({
      aiFirstEditingContract: AI_FIRST_EDITING_CONTRACT,
      route,
    });
  }

  function normalizeEditableShapePlan(data: JsonRecord, route: NativePptRoute) {
    const plan = data?.editable_shape_plan || data?.shape_plan || {};
    const slides = safeArray(plan?.slides);
    if (slides.length === 0) {
      throw new Error(`Native PPT ${route} requires an AI-authored editable_shape_plan.slides array`);
    }
    const designSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
      ? plan.design_spec_lock
      : {};
    const missingDesignSpecLock = !safeText(designSpecLock?.spec_id)
      || !safeText(designSpecLock?.owner)
      || !safeText(designSpecLock?.motif)
      || !Array.isArray(designSpecLock?.layout_archetypes)
      || designSpecLock.layout_archetypes.length < 3;
    if (missingDesignSpecLock) {
      throw new Error(`Native PPT ${route} requires editable_shape_plan.design_spec_lock with spec_id, owner, motif, and layout_archetypes`);
    }
    const templateLayoutGrammar = plan?.template_layout_grammar && typeof plan.template_layout_grammar === 'object'
      ? plan.template_layout_grammar
      : {};
    const archetypeCatalog = safeArray(templateLayoutGrammar?.archetype_catalog);
    const missingTemplateLayoutGrammar = safeText(templateLayoutGrammar?.owner) !== 'llm_agent'
      || templateLayoutGrammar?.required !== true
      || safeText(templateLayoutGrammar?.materializer_role) !== 'execute_selected_archetype_zones_only'
      || templateLayoutGrammar?.helper_template_layout_allowed !== false
      || archetypeCatalog.length < 3;
    if (missingTemplateLayoutGrammar) {
      throw new Error(`Native PPT ${route} requires editable_shape_plan.template_layout_grammar with llm_agent owner, archetype catalog, and execute-selected-zones materializer boundary`);
    }
    const allowedArchetypes = new Set(archetypeCatalog.map((entry) => safeText(entry?.archetype_id)).filter(Boolean));
    const invalidSlides = slides
      .map((slide, index) => {
        const slideId = safeText(slide?.slide_id, `slide-${index + 1}`);
        const shapes = safeArray(slide?.native_shapes);
        const layoutIntent = slide?.layout_intent && typeof slide.layout_intent === 'object'
          ? slide.layout_intent
          : {};
        const templateBinding = slide?.template_layout_binding && typeof slide.template_layout_binding === 'object'
          ? slide.template_layout_binding
          : {};
        const zones = safeArray(templateBinding?.zones);
        const zoneIds = new Set(zones.map((zone) => safeText(zone?.zone_id)).filter(Boolean));
        const missingTemplateBinding = !safeText(templateBinding?.selected_archetype)
          || (allowedArchetypes.size > 0 && !allowedArchetypes.has(safeText(templateBinding?.selected_archetype)))
          || !safeText(templateBinding?.archetype_instance_id)
          || !safeText(templateBinding?.rhythm_role)
          || Number(templateBinding?.zone_gap_in_min || 0) < 0.32
          || Number(templateBinding?.zone_inset_in_min || 0) < 0.15
          || zones.length < 3
          || zones.some((zone) => {
            const bounds = zone?.bounds && typeof zone.bounds === 'object' ? zone.bounds : {};
            return !safeText(zone?.zone_id)
              || !safeText(zone?.semantic_role)
              || !safeText(zone?.intended_content)
              || !['left_in', 'top_in', 'width_in', 'height_in'].every((key) => Number.isFinite(Number(bounds?.[key])))
              || Number(bounds?.width_in || 0) <= 0
              || Number(bounds?.height_in || 0) <= 0
              || Number(zone?.safe_inset_in || 0) < 0.15;
          });
        const missingShapePlan = shapes.length === 0;
        const missingLayoutIntent = !safeText(layoutIntent?.composition_signature)
          || !safeText(layoutIntent?.primary_grid)
          || !safeText(layoutIntent?.non_text_visual)
          || layoutIntent?.forbidden_template_reuse_checked !== true;
        const invalidShapes = shapes
          .map((shape, shapeIndex) => {
            const shapeId = safeText(shape?.shape_id, `${slideId}-shape-${shapeIndex + 1}`);
            const bounds = shape?.bounds && typeof shape.bounds === 'object' ? shape.bounds : {};
            const hasBounds = ['left_in', 'top_in', 'width_in', 'height_in']
              .every((key) => Number.isFinite(Number(bounds?.[key])));
            const kind = safeText(shape?.kind || shape?.type);
            const role = safeText(shape?.role);
            const qualityRole = safeText(shape?.quality_role);
            const layoutZoneId = safeText(shape?.layout_zone_id);
            const text = safeText(shape?.editable_text || shape?.text || shape?.label);
            const textShape = ['text_box', 'text'].includes(kind) || ['title', 'core_sentence', 'point_text', 'body', 'content', 'point_index'].includes(role);
            const missingText = textShape && !text;
            const missingQualityRole = !qualityRole;
            const needsLayoutZone = !['decorative'].includes(qualityRole)
              && !['page_number', 'page_no', 'footer', 'cover_meta', 'meta'].includes(role);
            const missingLayoutZone = needsLayoutZone && !zoneIds.has(layoutZoneId);
            return (!hasBounds || !kind || missingText || missingQualityRole) ? {
              shape_id: shapeId,
              missing_bounds: !hasBounds,
              missing_kind: !kind,
              missing_text: missingText,
              missing_quality_role: missingQualityRole,
              missing_layout_zone: missingLayoutZone,
            } : missingLayoutZone ? {
              shape_id: shapeId,
              missing_bounds: false,
              missing_kind: false,
              missing_text: false,
              missing_quality_role: false,
              missing_layout_zone: true,
            } : null;
          })
          .filter(Boolean);
        const missingShapeQualityRoles = shapes.some((shape) => !safeText(shape?.quality_role));
        return (missingShapePlan || missingLayoutIntent || missingTemplateBinding || invalidShapes.length > 0) ? {
          slide_id: slideId,
          missing_native_shapes: missingShapePlan,
          missing_layout_intent: missingLayoutIntent,
          missing_template_layout_binding: missingTemplateBinding,
          missing_shape_quality_roles: missingShapeQualityRoles,
          invalid_shapes: invalidShapes,
        } : null;
      })
      .filter(Boolean);
    if (invalidSlides.length > 0) {
      throw new Error(`Native PPT ${route} requires a complete AI-authored editable spatial shape plan: ${JSON.stringify(invalidSlides)}`);
    }
    return {
      ...plan,
      ...(data?.test_double_boundary
        ? {
            test_double_boundary: data.test_double_boundary,
          }
        : {}),
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
    validationFeedback = null,
    attemptIndex = 1,
  }: {
    route: NativePptRoute;
    contract: JsonRecord;
    deliverablePaths: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
    adapter: string;
    validationFeedback?: JsonRecord | null;
    attemptIndex?: number;
  }) {
    if (typeof generateStructuredArtifact !== 'function') {
      throw new Error('Native PPT proof lane requires generateStructuredArtifact for AI-first shape planning');
    }
    const currentNativeArtifact = route === 'repair_pptx_native'
      ? (readCurrentNativePptArtifact(contract, deliverablePaths) || readAuthorNativePptArtifact(contract, deliverablePaths))
      : null;
    const baseContext = {
      ...(typeof buildAuthoringContext === 'function' ? buildAuthoringContext(contract) : {}),
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      blueprint: blueprintArtifact?.slide_blueprint || {},
      visual_direction: visualArtifact?.visual_direction || {},
      repair_feedback: safeArray(repairFeedback),
      native_shape_plan_validation_feedback: validationFeedback,
      native_shape_plan_attempt_index: attemptIndex,
      prior_native_ppt_bundle: route === 'repair_pptx_native'
        ? {
            pptx_file: safeText(currentNativeArtifact?.native_ppt_bundle?.pptx_file),
            shape_manifest_file: safeText(currentNativeArtifact?.native_ppt_bundle?.shape_manifest_file),
            slides: summarizeNativeSlides(currentNativeArtifact),
          }
        : null,
    };
    const maxExecutorRetries = Math.max(0, Number(process.env.REDCUBE_NATIVE_PPT_STRUCTURED_JSON_MAX_RETRIES || 1));
    let lastExecutorError: unknown = null;
    for (let executorRetryIndex = 0; executorRetryIndex <= maxExecutorRetries; executorRetryIndex += 1) {
      try {
        const { data, generationRuntime } = await generateStructuredArtifact({
          adapter,
          family: 'ppt_deck',
          route,
          promptRelativePath: PROMPT_PACK?.[route],
          context: {
            ...baseContext,
            native_shape_plan_executor_retry: executorRetryIndex > 0
              ? {
                  retry_index: executorRetryIndex,
                  retry_reason: 'previous_codex_structured_output_invalid_json',
                  repair_request: 'Return valid JSON only between REDCUBE_STAGE_JSON_BEGIN and REDCUBE_STAGE_JSON_END. Do not add prose, markdown, comments, trailing commas, or unescaped control characters.',
                }
              : null,
          },
          outputContract: nativePlanPreflightParts.nativeShapePlanOutputContractForAttempt(route, validationFeedback),
          cwd: deliverablePaths.deliverableDir,
        });
        const normalizedInput = route === 'repair_pptx_native'
          ? completeRepairShapePlanWithLockedSpec(data, currentNativeArtifact)
          : data;
        return {
          editableShapePlan: normalizeEditableShapePlan(normalizedInput, route),
          generationRuntime: {
            ...generationRuntime,
            native_shape_plan_executor_retry_count: executorRetryIndex,
          },
          modelContract: data?.ai_first_editing_contract || null,
          executorRetryCount: executorRetryIndex,
        };
      } catch (error) {
        lastExecutorError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!/structured generation returned invalid JSON/i.test(message)) {
          throw error;
        }
      }
    }
    throw lastExecutorError;
  }

  async function generateValidatedEditableShapePlan({
    route,
    contract,
    deliverablePaths,
    blueprintArtifact,
    visualArtifact,
    repairFeedback,
    unitRepairScope,
    adapter,
    validationInputFile,
    editableShapePlanFile,
  }: {
    route: NativePptRoute;
    contract: JsonRecord;
    deliverablePaths: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
    adapter: string;
    validationInputFile: string;
    editableShapePlanFile: string;
  }): Promise<NativePlanAttempt> {
    const maxAttempts = Math.max(1, Number(process.env.REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS || 3));
    let validationFeedback: JsonRecord | null = null;
    let lastAttempt: NativePlanAttempt | null = null;
    const attemptArtifactRefs: string[] = [];
    for (let attemptIndex = 1; attemptIndex <= maxAttempts; attemptIndex += 1) {
      const generatedPlan = await generateEditableShapePlan({
        route,
        contract,
        deliverablePaths,
        blueprintArtifact,
        visualArtifact,
        repairFeedback,
        unitRepairScope,
        adapter,
        validationFeedback,
        attemptIndex,
      });
      const candidate = route === 'repair_pptx_native'
        ? {
            ...generatedPlan,
            editableShapePlan: mergeRepairEditableShapePlan({
              editableShapePlan: generatedPlan.editableShapePlan,
              priorNativeArtifact: readCurrentNativePptArtifact(contract, deliverablePaths),
              blueprintArtifact,
              unitRepairScope,
            }),
          }
        : generatedPlan;
      const validationInputPayload = buildNativeInputPayload({
        route,
        unitRepairScope,
        contract,
        blueprintArtifact,
        visualArtifact,
        editableShapePlan: candidate.editableShapePlan,
        editableShapePlanFile,
        repairFeedback,
      });
      writeJson(validationInputFile, validationInputPayload);
      const attemptInputFile = nativePlanPreflightParts.nativeAttemptArtifactFile(validationInputFile, attemptIndex, '');
      const attemptValidationFile = nativePlanPreflightParts.nativeAttemptArtifactFile(validationInputFile, attemptIndex, '-validation');
      writeJson(attemptInputFile, validationInputPayload);
      attemptArtifactRefs.push(attemptInputFile);
      const validation = runPythonValidation(validationInputFile);
      writeJson(attemptValidationFile, validation.payload);
      attemptArtifactRefs.push(attemptValidationFile);
      lastAttempt = {
        ...candidate,
        validationFeedback: validation.payload,
        attemptIndex,
        attemptArtifactRefs: [...attemptArtifactRefs],
      };
      if (validation.payload?.ok === true) {
        return lastAttempt;
      }
      validationFeedback = nativePlanPreflightParts.buildNativeValidationFeedback({
        validation,
        attemptIndex,
        attemptArtifactRefs,
      });
    }
    throw new Error(`Native PPT ${route} AI-first editable_shape_plan did not pass preflight after ${maxAttempts} attempt(s): ${JSON.stringify(lastAttempt?.validationFeedback || validationFeedback)}`);
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
    const directorReviewArtifact = route === 'repair_pptx_native'
      ? readStageArtifact(contract, deliverablePaths, 'visual_director_review')
      : null;
    const priorNativeArtifact = route === 'repair_pptx_native'
      ? readCurrentNativePptArtifact(contract, deliverablePaths)
      : null;
    const priorShapeManifest = route === 'repair_pptx_native'
      ? readNativeShapeManifest(safeText(priorNativeArtifact?.native_ppt_bundle?.shape_manifest_file))
      : {};
    const screenshotRepairFeedback = route === 'repair_pptx_native'
      ? repairFeedbackFromReview(reviewArtifact)
      : [];
    const repairFeedback = route === 'repair_pptx_native'
      ? (screenshotRepairFeedback.length > 0
          ? screenshotRepairFeedback
          : repairFeedbackFromDirectorReview(directorReviewArtifact))
      : [];
    const unitRepairScope = buildUnitRepairScope({ route, blueprintArtifact, repairFeedback });
    const paths = nativeArtifactPaths({ deliverablePaths, deliverableId, route });
    const generatedPlan = await generateValidatedEditableShapePlan({
      route,
      contract,
      deliverablePaths,
      blueprintArtifact,
      visualArtifact,
      repairFeedback,
      unitRepairScope,
      adapter,
      validationInputFile: paths.planValidationFile,
      editableShapePlanFile: paths.editableShapePlanFile,
    });
    const {
      editableShapePlan,
      generationRuntime,
      modelContract,
      validationFeedback,
      attemptIndex,
      attemptArtifactRefs,
    } = generatedPlan;
    writeJson(paths.editableShapePlanFile, editableShapePlan);
    writeJson(paths.inputFile, buildNativeInputPayload({
      route,
      unitRepairScope,
      contract,
      blueprintArtifact,
      visualArtifact,
      editableShapePlan,
      editableShapePlanFile: paths.editableShapePlanFile,
      repairFeedback,
    }));
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
    assertNativeDeckCompleteness({ route, shapeManifest, payload, unitRepairScope });
    const renderProof = requireTrueRenderProof(payload, shapeManifest);
    const manifestQualityPassed = nativeManifestQualityPassed(shapeManifest);
    writeJson(paths.shapeManifestFile, {
      ...shapeManifest,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      editable_shape_plan_file: paths.editableShapePlanFile,
      engine_capabilities: payload.engine_capabilities || shapeManifest.engine_capabilities || REQUIRED_ENGINE_CAPABILITIES,
      officecli_materializer_policy: payload.officecli_materializer_policy
        || shapeManifest.officecli_materializer_policy
        || OFFICECLI_MATERIALIZER_POLICY,
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
      generationRuntime,
      testDoubleBoundary: editableShapePlan?.test_double_boundary || generatedPlan?.editableShapePlan?.test_double_boundary || null,
    });
    const isMockStructuredExecutor = safeText(generationRuntime?.run_id).startsWith('mock_')
      || safeText(generationRuntime?.owner).includes('mock')
      || safeText(generationRuntime?.adapter_surface).includes('mock')
      || Boolean(editableShapePlan?.test_double_boundary);
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
        visual_sample_claim: {
          sample_kind: isMockStructuredExecutor ? 'deterministic_test_double_plumbing_proof' : 'live_codex_executor_native_ppt_sample',
          proves_artifact_export_chain: true,
          proves_visual_design_quality: !isMockStructuredExecutor && manifestQualityPassed,
          display_as_visual_sample_allowed: !isMockStructuredExecutor && manifestQualityPassed,
          requires_human_visual_inspection: !isMockStructuredExecutor,
          mock_fixture_visual_sample_allowed: false,
          manifest_quality_passed: manifestQualityPassed,
          required_manifest_checks: [...NATIVE_PPT_AGGREGATED_CHECK_KEYS],
        },
        test_double_boundary: editableShapePlan?.test_double_boundary || null,
        builder: payload.builder || { kind: 'python_pptx_native_shapes' },
        capability: payload.capability || null,
        engine_capabilities: payload.engine_capabilities || shapeManifest.engine_capabilities || REQUIRED_ENGINE_CAPABILITIES,
        officecli_materializer_policy: payload.officecli_materializer_policy
          || shapeManifest.officecli_materializer_policy
          || OFFICECLI_MATERIALIZER_POLICY,
        officecli_gate: payload.officecli_gate || shapeManifest.officecli_gate || null,
        render_proof: renderProof,
        redcube_svg_ir: payload.redcube_svg_ir || shapeManifest.redcube_svg_ir || null,
        ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
        ai_first_shape_plan_contract: modelContract || AI_FIRST_EDITING_CONTRACT,
        ai_first_shape_plan_preflight: {
          attempts: attemptIndex,
          validator: validationFeedback,
          self_repair_used: attemptIndex > 1,
          attempt_artifact_refs: safeArray(attemptArtifactRefs).map((ref) => safeText(ref)).filter(Boolean),
        },
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
        ...safeArray(attemptArtifactRefs).map((ref) => safeText(ref)).filter(Boolean),
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
