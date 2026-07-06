import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
  validateSourceAugmentationResultContract,
} from '@redcube/runtime-protocol';
import type { SourceArtifactPaths } from '@redcube/runtime-protocol';

import { intakeSource } from './source-intake.js';
import { getRequestedSourceAugmentationAdapterId } from './source-augmentation-executor.js';
import { prepareSourceAugmentation } from './source-augmentation-request.js';
import {
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
} from './source-augmentation-result.js';
import { executeSourceAugmentation } from './source-augmentation-execution.js';
import { ensureDir, readJson, safeText } from './runtime-utils.js';

type JsonRecord = Record<string, unknown>;

type ResearchStage =
  | 'source_intake'
  | 'source_augmentation_result_preparation'
  | 'source_augmentation_execution';

interface SourceResearchRequest extends JsonRecord {
  workspaceRoot: string;
  topicId: string;
  title?: string;
  inputFile?: string;
  payloadFile?: string;
  result?: unknown;
}

interface SourceResearchStageResult extends JsonRecord {
  ok: boolean;
  topicId?: string;
  stage: ResearchStage;
  planningReady: boolean;
  artifactFiles?: JsonRecord;
  intake?: JsonRecord;
  augmentation?: JsonRecord;
  resultWrite?: JsonRecord;
  resultPreparation?: JsonRecord;
  execution?: JsonRecord;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeStringArray(value: unknown): string[] {
  return safeArray(value).map((item) => safeText(item)).filter(Boolean);
}

function mergeArtifactFiles(...groups: Array<JsonRecord | null | undefined>): JsonRecord {
  return Object.assign({}, ...groups.map((group) => asRecord(group?.artifactFiles)));
}

function writeJson(file: string, value: unknown): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function planningReadyFromExecution(execution: JsonRecord): boolean {
  return execution.ok === true && asRecord(execution.report).planning_ready === true;
}

function hasWriteInput(request: SourceResearchRequest): boolean {
  return Boolean(request.result) || Boolean(safeText(request.inputFile)) || Boolean(safeText(request.payloadFile));
}

function recommendedActionForResearch(result: SourceResearchStageResult): string {
  if (result.ok !== true && result.stage === 'source_intake') return 'resolve_source_blocks';
  if (result.stage === 'source_augmentation_result_preparation') return 'write_source_augmentation_result';
  if (result.ok !== true && result.stage === 'source_augmentation_execution') {
    return 'configure_source_augmentation_executor';
  }
  if (result.stage === 'source_augmentation_execution' && result.planningReady !== true) {
    return 'continue_source_research';
  }
  if (result.planningReady === true) return 'create_deliverable';
  return 'continue';
}

function buildSourceResearchReport(result: SourceResearchStageResult) {
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
    readiness_target: 'planning_ready',
    sufficiency_status: safeText(
      asRecord(asRecord(result.execution).report).sufficiency_status,
      asRecord(asRecord(asRecord(result.augmentation).augmentation).trigger).source_sufficiency_status,
    ) || null,
    deep_research_state: safeText(
      asRecord(asRecord(result.execution).report).deep_research_state,
      asRecord(asRecord(asRecord(result.augmentation).augmentation).trigger).deep_research_state,
    ) || null,
    blocking_evidence_gaps: safeArray(
      asRecord(asRecord(result.execution).report).blocking_evidence_gaps
        || asRecord(asRecord(asRecord(result.augmentation).augmentation).trigger).blocking_evidence_gaps
        || asRecord(asRecord(asRecord(result.augmentation).augmentation).trigger).evidence_gaps,
    ),
    residual_evidence_gaps: safeArray(
      asRecord(asRecord(result.execution).report).residual_evidence_gaps
        || asRecord(asRecord(asRecord(result.augmentation).augmentation).trigger).residual_evidence_gaps,
    ),
    recommended_action: recommendedActionForResearch(result),
  };
}

function finalizeResearchResult({
  workspaceRoot,
  topicId,
  result,
}: {
  workspaceRoot: string;
  topicId: string;
  result: SourceResearchStageResult;
}) {
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

function hasValidCanonicalResult({
  sourcePaths,
  request,
}: {
  sourcePaths: SourceArtifactPaths;
  request: JsonRecord;
}): boolean {
  if (!existsSync(sourcePaths.sourceAugmentationResultFile)) return false;

  const result = readJson(sourcePaths.sourceAugmentationResultFile);
  const requestValidation = validateSourceAugmentationRequestContract(request);
  if (!requestValidation.ok) return false;

  const validation = validateSourceAugmentationResultContract(result, {
    expectedTopicId: safeText(request.topic_id),
    requiredEvidenceGaps: safeStringArray(asRecord(request.trigger).evidence_gaps),
  });
  return validation.ok;
}

export async function researchSource(request: SourceResearchRequest) {
  const {
    workspaceRoot,
    topicId,
  } = request;
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const intake = await intakeSource(request) as unknown as JsonRecord;
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

  if (safeText(asRecord(intake.augmentation).status) === 'not_required') {
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
    title: request.title || '',
  }) as JsonRecord;
  const requestedAdapter = getRequestedSourceAugmentationAdapterId();

  if (requestedAdapter === 'result_file') {
    if (hasWriteInput(request)) {
      const resultWrite = await writeSourceAugmentationResult({
        workspaceRoot,
        topicId,
        inputFile: request.inputFile || '',
        payloadFile: request.payloadFile || '',
        result: request.result ? asRecord(request.result) : null,
      }) as JsonRecord;
      const execution = await executeSourceAugmentation({
        workspaceRoot,
        topicId,
      }) as JsonRecord;

      return finalizeResearchResult({
        workspaceRoot,
        topicId,
        result: {
          ok: execution.ok === true,
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
      request: asRecord(augmentation.augmentation),
    })) {
      const execution = await executeSourceAugmentation({
        workspaceRoot,
        topicId,
      }) as JsonRecord;

      return finalizeResearchResult({
        workspaceRoot,
        topicId,
        result: {
          ok: execution.ok === true,
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
    }) as JsonRecord;

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
  }) as JsonRecord;

  return finalizeResearchResult({
    workspaceRoot,
    topicId,
    result: {
      ok: execution.ok === true,
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
