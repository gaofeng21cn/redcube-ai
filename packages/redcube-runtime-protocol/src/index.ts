import {
  createRunRecord as createRunRecordJs,
} from './runs.js';
import {
  createManagedRunRecord as createManagedRunRecordJs,
} from './managed-runs.js';
import {
  getDeliverablePaths as getDeliverablePathsJs,
  getNotePaths as getNotePathsJs,
  getTopicPaths as getTopicPathsJs,
  resolveWorkspaceContract as resolveWorkspaceContractJs,
} from './workspace.js';
import {
  buildSourceTruthConsumptionSummary as buildSourceTruthConsumptionSummaryJs,
  getSourceArtifactPaths as getSourceArtifactPathsJs,
} from './source-truth.js';
import {
  loadSourceReadinessSummary as loadSourceReadinessSummaryJs,
} from './source-readiness-summary.js';
import {
  validateSourceAugmentationRequestContract as validateSourceAugmentationRequestContractJs,
  validateSourceAugmentationResultContract as validateSourceAugmentationResultContractJs,
} from './source-augmentation-contract.js';
import {
  REDCUBE_PYTHON_COMMAND_ENV as REDCUBE_PYTHON_COMMAND_ENV_JS,
  resolveRedCubePythonCommand as resolveRedCubePythonCommandJs,
} from './python-command.js';

import type {
  BuildSourceTruthConsumptionSummaryOptions,
  CreateManagedRunRecordInput,
  ManagedAdapterSwitchRecord,
  ManagedControllerDecisionRecord,
  ManagedEscalationRecord,
  CreateRunRecordInput,
  DeliverablePaths,
  ManagedProgressEvent,
  ManagedProgressProjection,
  ManagedRouteRunLink,
  ManagedRuntimeLivenessAudit,
  ManagedRuntimeSupervisionRecord,
  ManagedRunMode,
  ManagedRunRecord,
  ManagedRunStatus,
  ManagedStageResultRecord,
  NotePaths,
  RerunLinkage,
  RunRecord,
  SourceTruthConsumptionSummary,
  RunTelemetryEnvelope,
  RuntimeErrorKind,
  ResolvedRedCubePythonCommand,
  ResolveRedCubePythonCommandOptions,
  SourceArtifactPaths,
  SourceReadinessSummary,
  SourceAugmentationRequestContract,
  SourceAugmentationResultContract,
  TopicPaths,
  ValidateSourceAugmentationResultOptions,
  ValidationResult,
  WorkspaceContract,
} from './types.js';

export function createRunRecord(input: CreateRunRecordInput = {}): RunRecord {
  return createRunRecordJs(input) as RunRecord;
}

export function createManagedRunRecord(input: CreateManagedRunRecordInput = {}): ManagedRunRecord {
  return createManagedRunRecordJs(input) as ManagedRunRecord;
}

export function resolveWorkspaceContract(input: { workspaceRoot: string }): WorkspaceContract {
  return resolveWorkspaceContractJs(input) as WorkspaceContract;
}

export function getTopicPaths(workspaceRoot: string, topicId: string): TopicPaths {
  return getTopicPathsJs(workspaceRoot, topicId) as TopicPaths;
}

export function getDeliverablePaths(workspaceRoot: string, topicId: string, deliverableId: string): DeliverablePaths {
  return getDeliverablePathsJs(workspaceRoot, topicId, deliverableId) as DeliverablePaths;
}

export function getNotePaths(workspaceRoot: string, topicId: string, noteId: string): NotePaths {
  return getNotePathsJs(workspaceRoot, topicId, noteId) as NotePaths;
}

export function getSourceArtifactPaths(workspaceRoot: string, topicId: string): SourceArtifactPaths {
  return getSourceArtifactPathsJs(workspaceRoot, topicId) as SourceArtifactPaths;
}

export function buildSourceTruthConsumptionSummary(
  sharedSourceTruth: unknown,
  options: BuildSourceTruthConsumptionSummaryOptions,
): SourceTruthConsumptionSummary {
  return buildSourceTruthConsumptionSummaryJs(sharedSourceTruth, options) as SourceTruthConsumptionSummary;
}

export function loadSourceReadinessSummary(
  workspaceRoot: string,
  topicId: string,
): SourceReadinessSummary | null {
  return loadSourceReadinessSummaryJs(workspaceRoot, topicId) as SourceReadinessSummary | null;
}

export function validateSourceAugmentationRequestContract(
  contract: unknown,
): ValidationResult {
  return validateSourceAugmentationRequestContractJs(contract) as ValidationResult;
}

export function validateSourceAugmentationResultContract(
  contract: unknown,
  options: ValidateSourceAugmentationResultOptions = {},
): ValidationResult {
  return validateSourceAugmentationResultContractJs(contract, options) as ValidationResult;
}

export const REDCUBE_PYTHON_COMMAND_ENV = REDCUBE_PYTHON_COMMAND_ENV_JS;

export function resolveRedCubePythonCommand(
  options: ResolveRedCubePythonCommandOptions = {},
): ResolvedRedCubePythonCommand {
  return resolveRedCubePythonCommandJs(options) as ResolvedRedCubePythonCommand;
}

export {
  getSourceArtifactPaths as getCanonicalSourceArtifactPaths,
};

export type {
  BuildSourceTruthConsumptionSummaryOptions,
  CreateManagedRunRecordInput,
  ManagedAdapterSwitchRecord,
  ManagedControllerDecisionRecord,
  ManagedEscalationRecord,
  CreateRunRecordInput,
  DeliverablePaths,
  ManagedProgressEvent,
  ManagedProgressProjection,
  ManagedRouteRunLink,
  ManagedRuntimeLivenessAudit,
  ManagedRuntimeSupervisionRecord,
  ManagedRunMode,
  ManagedRunRecord,
  ManagedRunStatus,
  ManagedStageResultRecord,
  NotePaths,
  RerunLinkage,
  RunRecord,
  SourceTruthConsumptionSummary,
  RunTelemetryEnvelope,
  RuntimeErrorKind,
  ResolvedRedCubePythonCommand,
  ResolveRedCubePythonCommandOptions,
  SourceArtifactPaths,
  SourceReadinessSummary,
  SourceAugmentationRequestContract,
  SourceAugmentationResultContract,
  TopicPaths,
  ValidateSourceAugmentationResultOptions,
  ValidationResult,
  WorkspaceContract,
};
