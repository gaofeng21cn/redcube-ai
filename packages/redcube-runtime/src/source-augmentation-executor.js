import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { validateSourceAugmentationResultContract } from '@redcube/runtime-protocol';

const DEFAULT_SOURCE_AUGMENTATION_ADAPTER = 'external_command';
const DEFAULT_SOURCE_AUGMENTATION_EXECUTOR_IDENTITY = 'source_augmentation_external_command';
const DEFAULT_SOURCE_AUGMENTATION_RESULT_FILE_IDENTITY = 'canonical_source_augmentation_result_file';

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

function resolveResultFilePath(configuredResultFile, sourceAugmentationResultFile, requestFile) {
  const explicit = safeText(configuredResultFile);
  if (explicit) return path.resolve(explicit);
  if (safeText(sourceAugmentationResultFile)) return sourceAugmentationResultFile;
  return path.join(path.dirname(requestFile), 'source-augmentation-result.json');
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

function buildResultFileAdapter(resultFile) {
  const configuredResultFile = safeText(resultFile);
  return {
    adapter: 'result_file',
    execution_surface: 'result_file',
    executor_identity: configuredResultFile || DEFAULT_SOURCE_AUGMENTATION_RESULT_FILE_IDENTITY,
    run({ requestFile, request, sourceAugmentationResultFile }) {
      const resultFilePath = resolveResultFilePath(
        configuredResultFile,
        sourceAugmentationResultFile,
        requestFile,
      );
      if (!existsSync(resultFilePath)) {
        return {
          ok: false,
          blockingReason: 'source_augmentation_result_file_missing',
        };
      }

      let executorOutput;
      try {
        executorOutput = JSON.parse(readFileSync(resultFilePath, 'utf-8'));
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
        executionSurface: 'result_file',
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
  resultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE,
} = {}) {
  const adapterId = safeText(adapter, DEFAULT_SOURCE_AUGMENTATION_ADAPTER);
  if (adapterId === 'external_command') {
    return buildExternalCommandAdapter(command);
  }
  if (adapterId === 'result_file') {
    return buildResultFileAdapter(resultFile);
  }

  throw new Error(`Unsupported source augmentation adapter: ${adapterId}`);
}
