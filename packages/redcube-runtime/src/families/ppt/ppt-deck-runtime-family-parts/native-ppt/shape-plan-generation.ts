import type { NativeShapePlanInvocationFailure } from '../native-ppt-executor-attempt-diagnostic.js';
import { AI_FIRST_EDITING_CONTRACT } from '../native-ppt-authoring-policies.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePlanAttempt {
  editableShapePlan: JsonRecord;
  generationRuntime: JsonRecord;
  modelContract: JsonRecord | null;
  shapePlanOutputContract: JsonRecord | null;
  validationFeedback: JsonRecord | null;
  attemptIndex: number;
  executorRetryCount: number;
  attemptArtifactRefs: string[];
}

interface NativePptShapePlanGenerationDeps {
  PROMPT_PACK?: Record<string, string>;
  buildAuthoringContext?(contract: JsonRecord): JsonRecord;
  buildNativeInputPayload(input: JsonRecord): JsonRecord;
  compactNativeSampleContext(input: JsonRecord): JsonRecord;
  completeRepairShapePlanWithLockedSpec(data: JsonRecord, currentNativeArtifact: JsonRecord | null): JsonRecord;
  generateStructuredArtifact?: (input: JsonRecord) => Promise<{ data: JsonRecord; generationRuntime: JsonRecord }>;
  isCodexInvocationFailure(error: unknown): boolean;
  mergeRepairEditableShapePlan(input: JsonRecord): JsonRecord;
  nativePlanPreflightParts: JsonRecord;
  nativePptSampleLayoutProfile(contract: JsonRecord): JsonRecord | null;
  nativeSampleShapePlanOutputContract(route: NativePptRoute, sampleProfile: JsonRecord | null): JsonRecord;
  nativeShapePlanOutputContract(route: NativePptRoute): JsonRecord;
  normalizeEditableShapePlan(data: JsonRecord, route: NativePptRoute): JsonRecord;
  readAuthorNativePptArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null;
  readCurrentNativePptArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null;
  runPythonValidation(inputFile: string): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  structuralFeedbackFromPlanError(input: JsonRecord): JsonRecord | null;
  summarizeNativeSlides(nativeArtifact: JsonRecord | null): JsonRecord[];
  writeExecutorAttemptDiagnostic(input: JsonRecord): string;
  writeJson(file: string, data: unknown): void;
}

export function createNativePptShapePlanGenerationParts({
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
}: NativePptShapePlanGenerationDeps) {
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
    executorAttemptDiagnosticFile = '',
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
    executorAttemptDiagnosticFile?: string;
  }) {
    if (typeof generateStructuredArtifact !== 'function') {
      throw new Error('Native PPT proof lane requires generateStructuredArtifact for AI-first shape planning');
    }
    const currentNativeArtifact = route === 'repair_pptx_native'
      ? (readCurrentNativePptArtifact(contract, deliverablePaths) || readAuthorNativePptArtifact(contract, deliverablePaths))
      : null;
    const sampleProfile = nativePptSampleLayoutProfile(contract);
    const useCompactSampleAuthoring = route === 'author_pptx_native' && sampleProfile?.required === true;
    const baseAuthoringContext = typeof buildAuthoringContext === 'function' ? buildAuthoringContext(contract) : {};
    const baseContext = {
      ...baseAuthoringContext,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      native_ppt_sample_layout_profile: sampleProfile,
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
        const baseShapePlanOutputContract = useCompactSampleAuthoring
          ? nativeSampleShapePlanOutputContract(route, sampleProfile)
          : nativeShapePlanOutputContract(route);
        const shapePlanOutputContract = validationFeedback
          ? nativePlanPreflightParts.nativeShapePlanOutputContractForAttempt(
              route,
              validationFeedback,
              baseShapePlanOutputContract,
            )
          : baseShapePlanOutputContract;
        const { data, generationRuntime } = await generateStructuredArtifact({
          adapter,
          family: 'ppt_deck',
          route,
          promptRelativePath: useCompactSampleAuthoring
            ? 'prompts/ppt_deck/author_pptx_native_sample.md'
            : PROMPT_PACK?.[route],
          context: {
            ...(useCompactSampleAuthoring
              ? compactNativeSampleContext({
                  contract,
                  baseAuthoringContext,
                  blueprintArtifact,
                  visualArtifact,
                  unitRepairScope,
                  repairFeedback,
                  validationFeedback,
                  attemptIndex,
                })
              : baseContext),
            native_shape_plan_executor_retry: executorRetryIndex > 0
              ? {
                  retry_index: executorRetryIndex,
                  retry_reason: 'previous_codex_structured_output_invalid_json',
                  repair_request: 'Return valid JSON only between REDCUBE_STAGE_JSON_BEGIN and REDCUBE_STAGE_JSON_END. Do not add prose, markdown, comments, trailing commas, or unescaped control characters.',
                }
              : null,
          },
          outputContract: shapePlanOutputContract,
          cwd: deliverablePaths.deliverableDir,
        });
        const normalizedInput = route === 'repair_pptx_native'
          ? completeRepairShapePlanWithLockedSpec(data, currentNativeArtifact)
          : data;
        let editableShapePlan;
        try {
          editableShapePlan = normalizeEditableShapePlan(normalizedInput, route);
        } catch (error) {
          if (error instanceof Error) {
            (error as Error & { nativeShapePlanCandidate?: JsonRecord }).nativeShapePlanCandidate = normalizedInput;
          }
          throw error;
        }
        return {
          editableShapePlan,
          generationRuntime: {
            ...generationRuntime,
            native_shape_plan_executor_retry_count: executorRetryIndex,
            native_ppt_compact_sample_invocation: useCompactSampleAuthoring,
          },
          modelContract: data?.ai_first_editing_contract || null,
          shapePlanOutputContract,
          executorRetryCount: executorRetryIndex,
        };
      } catch (error) {
        lastExecutorError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!/structured generation returned invalid JSON/i.test(message)) {
          if (executorAttemptDiagnosticFile && isCodexInvocationFailure(error)) {
            const diagnosticFile = writeExecutorAttemptDiagnostic({
              file: executorAttemptDiagnosticFile,
              route,
              deliverablePaths,
              blueprintArtifact,
              visualArtifact,
              repairFeedback,
              unitRepairScope,
              validationFeedback,
              attemptIndex,
              adapter,
              error,
            });
            const failure = error as NativeShapePlanInvocationFailure;
            failure.failure_kind = safeText(failure.failure_kind, 'codex_cli_execution_blocked');
            failure.artifact_file = diagnosticFile;
            failure.artifact_refs = Array.from(new Set([
              diagnosticFile,
              ...safeArray(failure.artifact_refs).map((ref) => safeText(ref)).filter(Boolean),
            ]));
          }
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
    executorAttemptDiagnosticFile,
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
    executorAttemptDiagnosticFile: string;
  }): Promise<NativePlanAttempt> {
    const maxAttempts = Math.max(1, Number(process.env.REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS || 4));
    let validationFeedback: JsonRecord | null = null;
    let lastAttempt: NativePlanAttempt | null = null;
    const attemptArtifactRefs: string[] = [];
    for (let attemptIndex = 1; attemptIndex <= maxAttempts; attemptIndex += 1) {
      let generatedPlan;
      try {
        generatedPlan = await generateEditableShapePlan({
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
          executorAttemptDiagnosticFile,
        });
      } catch (error) {
        const candidate = (error as Error & { nativeShapePlanCandidate?: JsonRecord })?.nativeShapePlanCandidate;
        if (candidate && typeof candidate === 'object') {
          const attemptCandidateFile = nativePlanPreflightParts.nativeAttemptArtifactFile(validationInputFile, attemptIndex, '-candidate');
          writeJson(attemptCandidateFile, candidate);
          attemptArtifactRefs.push(attemptCandidateFile);
        }
        const structuralFeedback = structuralFeedbackFromPlanError({
          route,
          error,
          attemptIndex,
          attemptArtifactRefs,
          previousValidationFeedback: validationFeedback,
        });
        if (!structuralFeedback) {
          if (error instanceof Error) {
            const existingRefs = safeArray((error as NativeShapePlanInvocationFailure).artifact_refs)
              .map((ref) => safeText(ref))
              .filter(Boolean);
            const refs = Array.from(new Set([...attemptArtifactRefs, ...existingRefs]));
            if (refs.length > 0) {
              (error as NativeShapePlanInvocationFailure).artifact_refs = refs;
            }
          }
          throw error;
        }
        const attemptValidationFile = nativePlanPreflightParts.nativeAttemptArtifactFile(validationInputFile, attemptIndex, '-structural-validation');
        writeJson(attemptValidationFile, structuralFeedback);
        attemptArtifactRefs.push(attemptValidationFile);
        validationFeedback = structuralFeedback;
        if (attemptIndex >= maxAttempts) {
          lastAttempt = {
            editableShapePlan: {},
            generationRuntime: {},
            modelContract: null,
            shapePlanOutputContract: null,
            validationFeedback,
            attemptIndex,
            executorRetryCount: 0,
            attemptArtifactRefs: [...attemptArtifactRefs],
          };
          continue;
        }
        continue;
      }
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
        previousValidationFeedback: validationFeedback,
      });
    }
    const error = new Error(`Native PPT ${route} AI-first editable_shape_plan did not pass preflight after ${maxAttempts} attempt(s): ${JSON.stringify(lastAttempt?.validationFeedback || validationFeedback)}`);
    if (attemptArtifactRefs.length > 0) {
      (error as Error & { artifact_refs?: string[] }).artifact_refs = [...attemptArtifactRefs];
    }
    throw error;
  }

  return {
    generateValidatedEditableShapePlan,
  };
}
