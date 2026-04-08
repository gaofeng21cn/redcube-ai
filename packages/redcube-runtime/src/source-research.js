import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationResultContract,
} from '@redcube/runtime-protocol';

import { intakeSource } from './source-intake.js';
import { getRequestedSourceAugmentationAdapterId } from './source-augmentation-executor.js';
import { prepareSourceAugmentation } from './source-augmentation-request.js';
import {
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
} from './source-augmentation-result.js';
import { executeSourceAugmentation } from './source-augmentation-execution.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function mergeArtifactFiles(...groups) {
  return Object.assign({}, ...groups.map((group) => group?.artifactFiles || {}));
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function planningReadyFromExecution(execution) {
  return execution?.ok === true && safeText(execution?.report?.status) === 'completed';
}

function hasWriteInput(request) {
  return Boolean(request?.result) || safeText(request?.inputFile) || safeText(request?.payloadFile);
}

function recommendedActionForResearch(result) {
  if (result.ok !== true && result.stage === 'source_intake') return 'resolve_source_blocks';
  if (result.stage === 'source_augmentation_result_preparation') return 'write_source_augmentation_result';
  if (result.ok !== true && result.stage === 'source_augmentation_execution') {
    return 'configure_source_augmentation_executor';
  }
  if (result.planningReady === true) return 'create_deliverable';
  return 'continue';
}

function buildSourceResearchReport(result) {
  const status = result.ok !== true
    ? 'blocked'
    : result.stage === 'source_augmentation_result_preparation'
      ? 'awaiting_input'
      : 'completed';

  return {
    schema_version: 1,
    topic_id: safeText(result?.topicId),
    request_kind: 'source_research_orchestration_report',
    status,
    stage: safeText(result?.stage),
    planning_ready: result?.planningReady === true,
    recommended_action: recommendedActionForResearch(result),
  };
}

function finalizeResearchResult({ workspaceRoot, topicId, result }) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const artifactFiles = {
    ...mergeArtifactFiles(result),
    sourceResearchReportFile: sourcePaths.sourceResearchReportFile,
  };
  const report = buildSourceResearchReport({
    ...result,
    topicId,
    artifactFiles,
  });

  writeJson(sourcePaths.sourceResearchReportFile, report);

  return {
    ...result,
    topicId,
    artifactFiles,
    report,
  };
}

function hasValidCanonicalResult({ sourcePaths, request }) {
  if (!existsSync(sourcePaths.sourceAugmentationResultFile)) return false;

  const result = readJson(sourcePaths.sourceAugmentationResultFile);
  const requestValidation = validateSourceAugmentationRequestContract(request);
  if (!requestValidation.ok) return false;

  const validation = validateSourceAugmentationResultContract(result, {
    expectedTopicId: safeText(request?.topic_id),
    requiredEvidenceGaps: safeArray(request?.trigger?.evidence_gaps),
  });
  return validation.ok;
}

export async function researchSource(request) {
  const {
    workspaceRoot,
    topicId,
  } = request;
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const intake = await intakeSource(request);
  if (intake.ok !== true) {
    return finalizeResearchResult({
      workspaceRoot,
      topicId,
      result: {
        ok: false,
        topicId,
        stage: 'source_intake',
        planningReady: false,
        artifactFiles: mergeArtifactFiles(intake),
        intake,
      },
    });
  }

  if (safeText(intake?.augmentation?.status) === 'not_required') {
    return finalizeResearchResult({
      workspaceRoot,
      topicId,
      result: {
        ok: true,
        topicId,
        stage: 'source_intake',
        planningReady: true,
        artifactFiles: mergeArtifactFiles(intake),
        intake,
      },
    });
  }

  const augmentation = await prepareSourceAugmentation({
    workspaceRoot,
    topicId,
    title: request?.title || '',
  });
  const requestedAdapter = getRequestedSourceAugmentationAdapterId();

  if (requestedAdapter === 'result_file') {
    if (hasWriteInput(request)) {
      const resultWrite = await writeSourceAugmentationResult({
        workspaceRoot,
        topicId,
        inputFile: request?.inputFile || '',
        payloadFile: request?.payloadFile || '',
        result: request?.result || null,
      });
      const execution = await executeSourceAugmentation({
        workspaceRoot,
        topicId,
      });

      return finalizeResearchResult({
        workspaceRoot,
        topicId,
        result: {
          ok: execution.ok,
          topicId,
          stage: 'source_augmentation_execution',
          planningReady: planningReadyFromExecution(execution),
          artifactFiles: mergeArtifactFiles(intake, augmentation, resultWrite, execution),
          intake,
          augmentation,
          resultWrite,
          execution,
        },
      });
    }

    if (hasValidCanonicalResult({
      sourcePaths,
      request: augmentation.augmentation,
    })) {
      const execution = await executeSourceAugmentation({
        workspaceRoot,
        topicId,
      });

      return finalizeResearchResult({
        workspaceRoot,
        topicId,
        result: {
          ok: execution.ok,
          topicId,
          stage: 'source_augmentation_execution',
          planningReady: planningReadyFromExecution(execution),
          artifactFiles: mergeArtifactFiles(intake, augmentation, execution),
          intake,
          augmentation,
          execution,
        },
      });
    }

    const resultPreparation = await prepareSourceAugmentationResult({
      workspaceRoot,
      topicId,
    });

    return finalizeResearchResult({
      workspaceRoot,
      topicId,
      result: {
        ok: true,
        topicId,
        stage: 'source_augmentation_result_preparation',
        planningReady: false,
        artifactFiles: mergeArtifactFiles(intake, augmentation, resultPreparation),
        intake,
        augmentation,
        resultPreparation,
      },
    });
  }

  const execution = await executeSourceAugmentation({
    workspaceRoot,
    topicId,
  });

  return finalizeResearchResult({
    workspaceRoot,
    topicId,
    result: {
      ok: execution.ok,
      topicId,
      stage: 'source_augmentation_execution',
      planningReady: planningReadyFromExecution(execution),
      artifactFiles: mergeArtifactFiles(intake, augmentation, execution),
      intake,
      augmentation,
      execution,
    },
  });
}
