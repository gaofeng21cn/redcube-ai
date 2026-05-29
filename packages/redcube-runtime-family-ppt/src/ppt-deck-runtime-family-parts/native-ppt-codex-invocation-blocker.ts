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

interface NativePptCodexInvocationBlockerDeps {
  PROMPT_PACK?: Record<string, string>;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  writeJson(file: string, data: unknown): void;
}

export function createNativePptCodexInvocationBlockerParts({
  PROMPT_PACK,
  safeArray,
  safeText,
  writeJson,
}: NativePptCodexInvocationBlockerDeps) {
  function codexInvocationFailureRuntime(error: unknown): JsonRecord {
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

  function writeCodexInvocationBlocker({
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
    contract: JsonRecord;
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
    const generationRuntime = codexInvocationFailureRuntime(error);
    const message = error instanceof Error ? error.message : String(error);
    const attemptArtifactRefs = safeArray(validationFeedback?.attempt_artifact_refs)
      .map((ref) => safeText(ref))
      .filter(Boolean);
    const validatorFailures = safeArray(validationFeedback?.validator?.failures);
    const nestedFailures = validatorFailures.flatMap((slide) => safeArray(slide?.failures));
    const failureItems = nestedFailures.length > 0 ? nestedFailures : validatorFailures;
    const diagnostic = {
      schema_version: 1,
      surface_kind: 'redcube_native_ppt_codex_invocation_blocker',
      status: 'blocked',
      typed_blocker: {
        blocker_kind: 'codex_cli_execution_blocked',
        route,
        message,
        recommended_action: 'inspect_codex_invocation_diagnostic_and_retry_native_shape_plan',
      },
      route,
      family: 'ppt_deck',
      adapter,
      prompt_pack_file: PROMPT_PACK?.[route] || null,
      attempt_index: attemptIndex,
      validation_feedback_present: validationFeedback != null,
      generation_runtime: generationRuntime,
      prompt_telemetry: {
        prompt_pack_file: safeText(generationRuntime?.prompt_pack_file || PROMPT_PACK?.[route]) || null,
        prompt_files: Array.isArray(generationRuntime?.prompt_files) ? generationRuntime.prompt_files : [],
        prompt_bytes: Number(generationRuntime?.prompt_bytes || 0) || null,
        context_bytes: Number(generationRuntime?.context_bytes || 0) || null,
        estimated_prompt_tokens: Number(generationRuntime?.estimated_prompt_tokens || 0) || null,
        prompt_tokens: generationRuntime?.prompt_tokens ?? null,
        completion_tokens: generationRuntime?.completion_tokens ?? null,
        total_tokens: generationRuntime?.total_tokens ?? null,
        provider_usage: generationRuntime?.provider_usage || generationRuntime?.usage || null,
        timeout_ms: Number(generationRuntime?.timeout_ms || 0) || null,
      },
      attempt_artifact_refs: attemptArtifactRefs,
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
      no_artifact_body_written: true,
      visual_ready_claimed: false,
      exportable_claimed: false,
      helper_fallback_used: false,
      error: {
        code: safeText((error as NativeShapePlanInvocationFailure)?.code) || null,
        failure_kind: safeText((error as NativeShapePlanInvocationFailure)?.failure_kind, 'codex_cli_execution_blocked'),
        message,
      },
    };
    writeJson(file, diagnostic);
    return file;
  }

  return {
    isCodexInvocationFailure,
    writeCodexInvocationBlocker,
  };
}
