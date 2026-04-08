import { spawnSync } from 'node:child_process';

import { validateSourceAugmentationResultContract } from '@redcube/runtime-protocol';

const DEFAULT_SOURCE_AUGMENTATION_ADAPTER = 'external_command';
const DEFAULT_SOURCE_AUGMENTATION_EXECUTOR_IDENTITY = 'source_augmentation_external_command';

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

function validateExecutorOutput(executorOutput, request) {
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
  };
}

function buildExternalCommandAdapter(command) {
  const executorCmd = safeText(command);
  return {
    adapter: 'external_command',
    execution_surface: 'external_command',
    executor_identity: executorCmd || DEFAULT_SOURCE_AUGMENTATION_EXECUTOR_IDENTITY,
    run({ requestFile, request }) {
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

      const validation = validateExecutorOutput(executorOutput, request);
      if (!validation.ok) {
        return validation;
      }

      return {
        ok: true,
        executionSurface: 'external_command',
        executorOutput,
      };
    },
  };
}

export function getRequestedSourceAugmentationAdapterId(value = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER) {
  return safeText(value, DEFAULT_SOURCE_AUGMENTATION_ADAPTER);
}

export function resolveSourceAugmentationAdapter({
  adapter = getRequestedSourceAugmentationAdapterId(),
  command = process.env.REDCUBE_SOURCE_AUGMENT_CMD,
} = {}) {
  const adapterId = safeText(adapter, DEFAULT_SOURCE_AUGMENTATION_ADAPTER);
  if (adapterId === 'external_command') {
    return buildExternalCommandAdapter(command);
  }

  throw new Error(`Unsupported source augmentation adapter: ${adapterId}`);
}
