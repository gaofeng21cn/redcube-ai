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
  ensureWorkspaceGitBoundary as ensureWorkspaceGitBoundaryJs,
  renderWorkspaceGitignore as renderWorkspaceGitignoreJs,
  resolveWorkspaceContract as resolveWorkspaceContractJs,
} from './workspace.js';
import {
  buildSourcePackFederationArtifact as buildSourcePackFederationArtifactJs,
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
import {
  materializeScreenshotCaptureStore as materializeScreenshotCaptureStoreJs,
} from './screenshot-capture-store.js';
import {
  buildCodexRuntimeTopology as buildCodexRuntimeTopologyTs,
} from './runtime-topology.js';
import {
  buildPythonHelperEnv as buildPythonHelperEnvTs,
  pythonHelperReference as pythonHelperReferenceTs,
  resolvePythonHelperInvocation as resolvePythonHelperInvocationTs,
  resolvePythonNativeHelper as resolvePythonNativeHelperTs,
  runRedCubePythonHelper as runRedCubePythonHelperTs,
} from './python-native-helper.js';

import type {
  BuildSourceTruthConsumptionSummaryOptions,
  CodexRuntimeTopology,
  CreateManagedRunRecordInput,
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
  RedCubePythonHelperInvocation,
  RedCubePythonHelperReference,
  RedCubePythonHelperRunResult,
  RedCubePythonNativeHelper,
  ResolveRedCubePythonNativeHelperOptions,
  RunRedCubePythonHelperOptions,
  SourceArtifactPaths,
  SourceReadinessSummary,
  SourceAugmentationRequestContract,
  SourceAugmentationResultContract,
  TopicPaths,
  ValidateSourceAugmentationResultOptions,
  ValidationResult,
  WorkspaceContract,
  WorkspaceGitBoundary,
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

export function renderWorkspaceGitignore(): string {
  return renderWorkspaceGitignoreJs() as string;
}

export function ensureWorkspaceGitBoundary(input: { workspaceRoot: string }): WorkspaceGitBoundary {
  return ensureWorkspaceGitBoundaryJs(input) as WorkspaceGitBoundary;
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

export function buildSourcePackFederationArtifact(request: {
  workspaceRoot: string;
  topicId: string;
  sourceIndex?: unknown;
  extractedMaterials?: unknown;
  sourceAudit?: unknown;
  sourceBrief?: unknown;
  sourceReadinessPack?: unknown;
  consumerFamilies?: unknown[];
}): Record<string, unknown> {
  return buildSourcePackFederationArtifactJs(
    request as Parameters<typeof buildSourcePackFederationArtifactJs>[0],
  ) as Record<string, unknown>;
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

export function buildPythonHelperEnv(
  pythonRoot: string,
  env: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  return buildPythonHelperEnvTs(pythonRoot, env);
}

export function resolvePythonNativeHelper(
  repoRoot: string,
  helperId: string,
  options: ResolveRedCubePythonNativeHelperOptions = {},
): RedCubePythonNativeHelper {
  return resolvePythonNativeHelperTs(repoRoot, helperId, options);
}

export function resolvePythonHelperInvocation(
  helper: RedCubePythonNativeHelper | string,
  options: RunRedCubePythonHelperOptions = {},
): RedCubePythonHelperInvocation {
  return resolvePythonHelperInvocationTs(helper, options);
}

export function pythonHelperReference(
  helper: RedCubePythonNativeHelper | string,
): RedCubePythonHelperReference | null {
  return pythonHelperReferenceTs(helper);
}

export function runRedCubePythonHelper(
  helper: RedCubePythonNativeHelper | string,
  args: string[],
  options: RunRedCubePythonHelperOptions = {},
): RedCubePythonHelperRunResult {
  return runRedCubePythonHelperTs(helper, args, options);
}

export function materializeScreenshotCaptureStore(input: Record<string, unknown> = {}): Record<string, unknown> {
  return materializeScreenshotCaptureStoreJs(input) as Record<string, unknown>;
}

export function buildCodexRuntimeTopology(): CodexRuntimeTopology {
  return buildCodexRuntimeTopologyTs();
}

export {
  getSourceArtifactPaths as getCanonicalSourceArtifactPaths,
};

export type {
  BuildSourceTruthConsumptionSummaryOptions,
  CodexRuntimeTopology,
  CreateManagedRunRecordInput,
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
  RedCubePythonHelperInvocation,
  RedCubePythonHelperReference,
  RedCubePythonHelperRunResult,
  RedCubePythonNativeHelper,
  ResolveRedCubePythonNativeHelperOptions,
  RunRedCubePythonHelperOptions,
  SourceArtifactPaths,
  SourceReadinessSummary,
  SourceAugmentationRequestContract,
  SourceAugmentationResultContract,
  TopicPaths,
  ValidateSourceAugmentationResultOptions,
  ValidationResult,
  WorkspaceContract,
  WorkspaceGitBoundary,
};
