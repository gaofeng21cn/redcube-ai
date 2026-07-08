// @ts-nocheck
import {
  OPL_CODEX_EXECUTOR_SURFACE,
  REDCUBE_CODEX_RUNTIME_OWNER,
} from './constants.js';
import { readCodexCliContract } from './command-process.js';
import { safeText } from './shared.js';

function stageIdForBatchStage(stage, index) {
  if (typeof stage === 'function') {
    return safeText(stage.stage_id, `stage_${index + 1}`);
  }
  return safeText(stage?.stage_id, `stage_${index + 1}`);
}

function normalizeBatchStages(stages) {
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error('stages 必须是非空数组');
  }
  const seen = new Set();
  return stages.map((stage, index) => {
    const stageId = stageIdForBatchStage(stage, index);
    if (seen.has(stageId)) {
      throw new Error(`stage_id 必须唯一: ${stageId}`);
    }
    seen.add(stageId);
    if (typeof stage === 'function') {
      return {
        buildStage: stage,
        stage_id: stageId,
      };
    }
    return {
      ...stage,
      stage_id: stageId,
    };
  });
}

export async function generateCodexCliBatch({
  stages,
  contract = readCodexCliContract(),
  cwd = process.cwd(),
  spawnSyncImpl = null,
  generateStructuredArtifact,
} = {}) {
  if (typeof generateStructuredArtifact !== 'function') {
    throw new Error('generateStructuredArtifact 必须是函数');
  }

  const normalizedStages = normalizeBatchStages(stages);
  const data = [];

  for (const stage of normalizedStages) {
    const stageInput = typeof stage.buildStage === 'function'
      ? {
          ...await stage.buildStage({
            previousResults: data,
            stage_id: stage.stage_id,
          }),
          stage_id: stage.stage_id,
        }
      : stage;
    const result = await generateStructuredArtifact({
      family: stageInput.family,
      route: stageInput.route,
      promptRelativePath: stageInput.promptRelativePath,
      context: stageInput.context,
      outputContract: stageInput.outputContract,
      localFileInspection: stageInput.localFileInspection,
      timeoutMs: stageInput.timeoutMs,
      cwd: stageInput.cwd || cwd,
      contract,
      spawnSyncImpl,
    });
    data.push({
      stage_id: stageInput.stage_id,
      data: result.data,
      generationRuntime: result.generationRuntime,
    });
  }

  return {
    data,
    batchRuntime: {
      owner: REDCUBE_CODEX_RUNTIME_OWNER,
      adapter_surface: OPL_CODEX_EXECUTOR_SURFACE,
      batch_descriptor: {
        kind: 'codex_cli_batch_descriptor',
        stage_count: normalizedStages.length,
        stage_ids: normalizedStages.map((stage) => stage.stage_id),
        timeout_policy: 'per_stage',
        json_contract_policy: 'per_stage',
        cleanup_policy: 'per_invocation_timeout_cleanup',
      },
      session_pool: {
        reuse_supported: false,
        reuse_claimed: false,
        reuse_status: 'unsupported_by_exec_surface',
        invocation_surface: 'codex_exec_ephemeral_per_stage',
        invocation_count: data.length,
        stage_session_ids: data.map((stage) => stage.generationRuntime.session_id),
      },
    },
  };
}
