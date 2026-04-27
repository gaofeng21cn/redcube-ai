// @ts-nocheck

export function createStructuredArtifactExecutor({
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_NATIVE_PROOF_ADAPTER,
  generateStructuredArtifactViaCodexCli,
  generateStructuredArtifactViaHermesAgentApi,
  generateStructuredArtifactViaHermesAgentStructuredCall,
  generateStructuredArtifactViaHermesNativeProof,
  isHermesAgentAdapter,
  safeText,
}) {
  function attachExecutorRoutingRuntime(result, executorRouting, fallback = null) {
    if (!executorRouting && !fallback) return result;
    return {
      ...result,
      generationRuntime: {
        ...(result?.generationRuntime || {}),
        executor_routing: {
          ...(executorRouting || {}),
          ...(fallback ? { fallback } : {}),
        },
      },
    };
  }

  async function generateWithSelectedExecutor({
    adapter,
    executionShape,
    hermesProfile,
    executorRouting,
    ...input
  }) {
    if (isHermesAgentAdapter(adapter)) {
      if (safeText(executionShape) === 'structured_call') {
        return generateStructuredArtifactViaHermesAgentStructuredCall({
          ...input,
          hermesProfile,
          executorRouting,
        });
      }
      return generateStructuredArtifactViaHermesAgentApi({
        ...input,
        hermesProfile,
        executorRouting,
      });
    }
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      return generateStructuredArtifactViaHermesNativeProof(input);
    }
    return generateStructuredArtifactViaCodexCli(input);
  }

  return async function generateStructuredArtifact({
    adapter = CODEX_DEFAULT_ADAPTER,
    executionShape = null,
    hermesProfile = null,
    executorRouting = null,
    ...input
  }) {
    try {
      const result = await generateWithSelectedExecutor({
        adapter,
        executionShape,
        hermesProfile,
        executorRouting,
        ...input,
      });
      return attachExecutorRoutingRuntime(result, executorRouting);
    } catch (error) {
      const failurePolicy = safeText(executorRouting?.structured_call_routing?.failure_policy, 'fail_closed');
      const fallbackPolicy = safeText(executorRouting?.structured_call_routing?.fallback, 'fail_closed');
      const selected = executorRouting?.selected_executor || {};
      const effectiveDefault = executorRouting?.effective_default_executor || {};
      const selectedBackend = safeText(selected.executor_backend);
      const selectedShape = safeText(selected.execution_shape);
      const canFallback = failurePolicy === 'fallback_with_proof'
        && fallbackPolicy === 'inherit_effective_default_executor'
        && selectedBackend === HERMES_AGENT_EXECUTOR_BACKEND
        && selectedShape === 'structured_call';
      const fallbackAdapter = safeText(effectiveDefault.adapter, CODEX_DEFAULT_ADAPTER);
      const fallbackShape = safeText(effectiveDefault.execution_shape);
      const fallbackProfile = safeText(effectiveDefault.hermes_profile) || null;
      const sameExecutor = fallbackAdapter === adapter
        && fallbackShape === safeText(executionShape)
        && safeText(fallbackProfile) === safeText(hermesProfile);
      if (!canFallback || sameExecutor) {
        throw error;
      }
      const fallbackResult = await generateWithSelectedExecutor({
        adapter: fallbackAdapter,
        executionShape: fallbackShape,
        hermesProfile: fallbackProfile,
        executorRouting,
        ...input,
      });
      return attachExecutorRoutingRuntime(fallbackResult, executorRouting, {
        status: 'used',
        failed_executor_backend: selectedBackend,
        failed_execution_shape: selectedShape,
        fallback_executor_backend: safeText(effectiveDefault.executor_backend),
        fallback_execution_shape: fallbackShape,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
