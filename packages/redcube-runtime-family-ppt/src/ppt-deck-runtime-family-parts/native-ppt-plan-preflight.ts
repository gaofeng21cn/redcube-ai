import { nativeAttemptArtifactFile } from './native-ppt-plan-preflight/attempt-artifact.js';
import { createNativePptPreflightFeedbackParts } from './native-ppt-plan-preflight/feedback-fixes.js';
import { createNativePptPlanRetryContractParts } from './native-ppt-plan-preflight/retry-contract.js';
import type { JsonRecord, NativePptRoute } from './native-ppt-plan-preflight/shared.js';

interface NativePptPlanPreflightDeps {
  nativeShapePlanOutputContract(route: NativePptRoute): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptPlanPreflightParts({
  nativeShapePlanOutputContract,
  safeArray,
  safeText,
}: NativePptPlanPreflightDeps) {
  const feedbackParts = createNativePptPreflightFeedbackParts({ safeArray, safeText });
  const retryContractParts = createNativePptPlanRetryContractParts({
    nativeShapePlanOutputContract,
    safeArray,
    safeText,
    structuralFeedbackFixes: feedbackParts.structuralFeedbackFixes,
    validationFeedbackFixes: feedbackParts.validationFeedbackFixes,
  });

  return {
    buildNativeValidationFeedback: feedbackParts.buildNativeValidationFeedback,
    nativeAttemptArtifactFile,
    nativeShapePlanOutputContractForAttempt: retryContractParts.nativeShapePlanOutputContractForAttempt,
  };
}
