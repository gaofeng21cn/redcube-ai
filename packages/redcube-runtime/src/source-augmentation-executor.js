import { spawnSync } from 'node:child_process';

import { validateSourceAugmentationResultContract } from '@redcube/runtime-protocol';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function parseExecutorJson(text) {
  const trimmed = safeText(text);
  if (!trimmed) {
    throw new Error('source augmentation executor returned empty stdout');
  }
  return JSON.parse(trimmed);
}

export function executeSourceAugmentationWithCommand({
  command,
  requestFile,
  request,
}) {
  const executorCmd = safeText(command);
  if (!executorCmd) {
    return {
      ok: false,
      blockingReason: 'source_augmentation_executor_unconfigured',
    };
  }

  const result = spawnSync(executorCmd, [requestFile], {
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      blockingReason: safeText(result.stderr, 'source_augmentation_execution_failed'),
    };
  }

  let executorOutput;
  try {
    executorOutput = parseExecutorJson(result.stdout);
  } catch (error) {
    return {
      ok: false,
      blockingReason: error instanceof Error ? error.message : String(error),
    };
  }

  const validation = validateSourceAugmentationResultContract(executorOutput, {
    expectedTopicId: safeText(request?.topic_id),
    requiredEvidenceGaps: Array.isArray(request?.trigger?.evidence_gaps)
      ? request.trigger.evidence_gaps
      : [],
  });
  if (!validation.ok) {
    return {
      ok: false,
      blockingReason: `source augmentation result contract invalid: ${validation.errors.join('; ')}`,
    };
  }

  return {
    ok: true,
    executionSurface: 'external_command',
    executorOutput,
  };
}
