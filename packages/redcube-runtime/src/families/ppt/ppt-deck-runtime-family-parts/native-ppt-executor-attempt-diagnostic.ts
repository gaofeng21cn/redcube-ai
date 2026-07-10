import { buildExecutorAttemptDiagnostic } from 'opl-framework-shared/runtime-task-companions';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

export interface NativeShapePlanInvocationFailure extends Error {
  artifact_refs?: string[];
  artifact_file?: string;
  code?: string;
  failure_kind?: string;
  generationRuntime?: JsonRecord;
  generation_runtime?: JsonRecord;
  codex_cli_runtime?: JsonRecord;
}

interface NativePptExecutorAttemptDiagnosticDeps {
  PROMPT_PACK?: Record<string, string>;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  writeJson(file: string, data: unknown): void;
}

export function createNativePptExecutorAttemptDiagnosticParts({
  PROMPT_PACK,
  safeArray,
  safeText,
  writeJson,
}: NativePptExecutorAttemptDiagnosticDeps) {
  function invocationFailureRuntime(error: unknown): JsonRecord {
    const candidate = (error || {}) as NativeShapePlanInvocationFailure;
    return candidate.generationRuntime
      || candidate.generation_runtime
      || candidate.codex_cli_runtime
      || {};
  }

  function isCodexInvocationFailure(error: unknown): boolean {
    const candidate = (error || {}) as NativeShapePlanInvocationFailure;
    const message = error instanceof Error ? error.message : String(error);
    return safeText(candidate.failure_kind) === 'codex_cli_execution_blocked'
      || safeText(candidate.code) === 'ETIMEDOUT'
      || safeText(candidate.codex_cli_runtime?.failure_kind) === 'codex_cli_execution_blocked'
      || /codex cli execution timed out|codex structured generation failed|codex prompt|codex cli/i.test(message);
  }

  function writeExecutorAttemptDiagnostic({
    file,
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
  }: {
    file: string;
    route: NativePptRoute;
    deliverablePaths: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
    validationFeedback: JsonRecord | null;
    attemptIndex: number;
    adapter: string;
    error: unknown;
  }): string {
    const executorRuntimeProjection = invocationFailureRuntime(error);
    const message = error instanceof Error ? error.message : String(error);
    const artifactRefs = safeArray(validationFeedback?.attempt_artifact_refs)
      .map((ref) => safeText(ref))
      .filter(Boolean);
    const validatorFailures = safeArray(validationFeedback?.validator?.failures);
    const nestedFailures = validatorFailures.flatMap((slide) => safeArray(slide?.failures));
    const failureItems = nestedFailures.length > 0 ? nestedFailures : validatorFailures;
    const diagnostic = buildExecutorAttemptDiagnostic({
      contract_id: 'opl_family_runtime_attempt_contract.v1',
      domain_id: 'redcube_ai',
      stage_id: 'artifact_creation',
      route_ref: route,
      executor_kind: adapter,
      attempt_index: attemptIndex,
      adapter: {
        adapter_id: adapter,
        family: 'ppt_deck',
        prompt_pack_ref: safeText(executorRuntimeProjection?.prompt_pack_file || PROMPT_PACK?.[route]) || null,
      },
      error: {
        code: safeText((error as NativeShapePlanInvocationFailure)?.code) || null,
        failure_kind: safeText(
          (error as NativeShapePlanInvocationFailure)?.failure_kind,
          'codex_cli_execution_blocked',
        ),
        message,
      },
      runtime_projection: executorRuntimeProjection,
      artifact_refs: artifactRefs.map((ref) => ({
        ref,
        ref_kind: 'executor_attempt_artifact_ref',
      })),
      domain_projection: {
        latest_validation_summary: validationFeedback
          ? {
              previous_attempt: Number(validationFeedback.previous_attempt || attemptIndex || 0) || null,
              ok: validationFeedback?.validator?.ok === true,
              stage: safeText(validationFeedback?.validator?.stage) || null,
              failure_count: Number(validationFeedback?.validator?.failure_count || 0) || failureItems.length,
              failure_reasons: Array.from(new Set(failureItems.map((failure) => safeText(failure?.reason)).filter(Boolean))),
              failed_shape_ids: Array.from(new Set(failureItems.map((failure) => safeText(failure?.shape_id)).filter(Boolean))),
              selected_archetypes: Array.from(new Set(failureItems
                .map((failure) => safeText(failure?.selected_archetype || failure?.archetype_id))
                .filter(Boolean))),
              refs_only: true,
              can_claim_visual_ready: false,
            }
          : null,
        stage_input_refs: {
          deliverable_dir: deliverablePaths.deliverableDir,
          slide_blueprint_status: safeText(blueprintArtifact?.status),
          visual_direction_status: safeText(visualArtifact?.status),
          repair_feedback_count: safeArray(repairFeedback).length,
          unit_repair_scope: unitRepairScope,
          validation_feedback: validationFeedback || null,
        },
      },
    });
    writeJson(file, diagnostic);
    return file;
  }

  return {
    isCodexInvocationFailure,
    writeExecutorAttemptDiagnostic,
  };
}
