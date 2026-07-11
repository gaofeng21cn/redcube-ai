import path from 'node:path';
import { readFileSync } from 'node:fs';
import { runRedCubePythonHelper, type RedCubePythonNativeHelper } from '@redcube/runtime-protocol';
import { createPptDeckVisualArtifactParts } from './visual-artifacts.js';
import { createNativePptArtifactInputParts } from './native-ppt/artifact-input.js';
import { createNativePptRepairScopeParts } from './native-ppt/repair-scope.js';
import { createNativePptShapePlanGenerationParts } from './native-ppt/shape-plan-generation.js';
import { buildNativePptQualityNonregressionReadModel } from './native-ppt-quality-nonregression.js';
import { createNativePptPlanIntegrityParts } from './native-ppt-plan-integrity.js';
import { createNativePptPlanPreflightParts } from './native-ppt-plan-preflight.js';
import { createNativePptProofReviewParts } from './native-ppt-proof-review.js';
import {
  createNativePptSampleAuthoringParts,
  nativePptSampleLayoutProfile,
} from './native-ppt-sample-authoring.js';
import {
  buildNativeSampleShapePlanOutputContract,
  buildNativeShapePlanOutputContract,
} from './native-ppt-shape-plan-contract.js';
import { createNativePptShapePlanNormalizeParts } from './native-ppt-shape-plan-normalize.js';
import { createNativePptRepairEvidenceParts } from './native-ppt-repair-evidence.js';
import {
  createNativePptExecutorAttemptDiagnosticParts,
} from './native-ppt-executor-attempt-diagnostic.js';
import {
  AI_FIRST_EDITING_CONTRACT,
  OFFICECLI_MATERIALIZER_POLICY,
} from './native-ppt-authoring-policies.js';
import {
  NATIVE_PPT_AGGREGATED_CHECK_KEYS,
  REQUIRED_ENGINE_CAPABILITIES,
} from './native-ppt-quality-contract.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePptDeps {
  CODEX_DEFAULT_ADAPTER: string;
  CREATIVE_MATERIALIZED_FROM: string;
  NATIVE_PPT_ENGINE_CONTRACT: string;
  PYTHON_NATIVE: RedCubePythonNativeHelper;
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
  const {
    normalizeEditableShapePlan,
    structuralFeedbackFromPlanError,
  } = createNativePptShapePlanNormalizeParts({ safeArray, safeText });
  const {
    isCodexInvocationFailure,
    writeExecutorAttemptDiagnostic,
  } = createNativePptExecutorAttemptDiagnosticParts({
    PROMPT_PACK,
    safeArray,
    safeText,
    writeJson,
  });
  const {
    compactNativeSampleContext,
  } = createNativePptSampleAuthoringParts({
    aiFirstEditingContract: AI_FIRST_EDITING_CONTRACT,
    safeArray,
    safeText,
  });

  let cachedNativeEngineContract: JsonRecord | null = null;
  function expectedNativeEngineContract(): JsonRecord {
    if (cachedNativeEngineContract) return cachedNativeEngineContract;
    if (!existsSync(NATIVE_PPT_ENGINE_CONTRACT)) {
      throw new Error(`Missing native PPT engine contract: ${NATIVE_PPT_ENGINE_CONTRACT}`);
    }
    cachedNativeEngineContract = JSON.parse(readFileSync(NATIVE_PPT_ENGINE_CONTRACT, 'utf-8')) as JsonRecord;
    return cachedNativeEngineContract;
  }

  function runPython(helper: RedCubePythonNativeHelper, args: string[]): JsonRecord {
    return runRedCubePythonHelper(helper, args, {
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

  const {
    buildNativeInputPayload,
    nativeArtifactPaths,
  } = createNativePptArtifactInputParts({ ensureDir });

  const {
    buildUnitRepairScope,
    repairFeedbackFromDirectorReview,
    repairFeedbackFromReview,
  } = createNativePptRepairScopeParts({
    collectSlidesNeedingTargetedRevision,
    safeArray,
    safeText,
  });

  function nativeShapePlanOutputContract(route: NativePptRoute) {
    return buildNativeShapePlanOutputContract({
      aiFirstEditingContract: AI_FIRST_EDITING_CONTRACT,
      route,
    });
  }

  function nativeSampleShapePlanOutputContract(route: NativePptRoute, sampleProfile: JsonRecord | null) {
    return buildNativeSampleShapePlanOutputContract({
      aiFirstEditingContract: AI_FIRST_EDITING_CONTRACT,
      route,
      sampleProfile,
    });
  }

  const {
    generateValidatedEditableShapePlan,
  } = createNativePptShapePlanGenerationParts({
    PROMPT_PACK,
    buildAuthoringContext,
    buildNativeInputPayload,
    compactNativeSampleContext,
    completeRepairShapePlanWithLockedSpec,
    generateStructuredArtifact,
    isCodexInvocationFailure,
    mergeRepairEditableShapePlan,
    nativePlanPreflightParts,
    nativePptSampleLayoutProfile,
    nativeSampleShapePlanOutputContract,
    nativeShapePlanOutputContract,
    normalizeEditableShapePlan,
    readAuthorNativePptArtifact,
    readCurrentNativePptArtifact,
    runPythonValidation,
    safeArray,
    safeText,
    structuralFeedbackFromPlanError,
    summarizeNativeSlides,
    writeExecutorAttemptDiagnostic,
    writeJson,
  });



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
      executorAttemptDiagnosticFile: paths.executorAttemptDiagnosticFile,
    });
    const {
      editableShapePlan,
      generationRuntime,
      modelContract,
      shapePlanOutputContract,
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
        ai_first_shape_plan_output_contract: shapePlanOutputContract || null,
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
              command: python.argv,
              request_args: python.request_args,
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
