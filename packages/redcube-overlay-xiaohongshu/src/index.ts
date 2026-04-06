import {
  buildTopicRecord as buildTopicRecordJs,
  buildXiaohongshuDeliverableRecord as buildXiaohongshuDeliverableRecordJs,
  describeXiaohongshuOverlay as describeXiaohongshuOverlayJs,
  hydrateXiaohongshuContract as hydrateXiaohongshuContractJs,
} from './contracts.js';
import { evaluateStorylineGate as evaluateStorylineGateJs } from './gates.js';
import {
  buildXiaohongshuSurfaceBundle as buildXiaohongshuSurfaceBundleJs,
  listXiaohongshuSurfaceArtifactPaths as listXiaohongshuSurfaceArtifactPathsJs,
  validateXiaohongshuSurfaceArtifact as validateXiaohongshuSurfaceArtifactJs,
} from './surface.js';

import type {
  XiaohongshuDeliverableRecord,
  XiaohongshuDeliverableRecordInput,
  XiaohongshuHydrateContractRequest,
  XiaohongshuHydratedContract,
  XiaohongshuOverlayCatalogEntry,
  XiaohongshuOverlayDefinition,
  XiaohongshuStorylineGateReport,
  XiaohongshuSurfaceArtifact,
  XiaohongshuSurfaceArtifactContent,
  XiaohongshuSurfaceArtifactPath,
  XiaohongshuSurfaceBundleRequest,
  XiaohongshuTopicRecord,
  XiaohongshuTopicRecordInput,
} from './types.js';

export function buildTopicRecord(input: XiaohongshuTopicRecordInput): XiaohongshuTopicRecord {
  return buildTopicRecordJs(input) as XiaohongshuTopicRecord;
}

export function describeXiaohongshuOverlay(): XiaohongshuOverlayCatalogEntry {
  return describeXiaohongshuOverlayJs() as XiaohongshuOverlayCatalogEntry;
}

export function hydrateXiaohongshuContract(
  request: XiaohongshuHydrateContractRequest,
): XiaohongshuHydratedContract {
  return hydrateXiaohongshuContractJs(request) as XiaohongshuHydratedContract;
}

export function buildXiaohongshuDeliverableRecord(
  input: XiaohongshuDeliverableRecordInput,
): XiaohongshuDeliverableRecord {
  return buildXiaohongshuDeliverableRecordJs({
    topicId: input.topicId,
    deliverableId: input.deliverableId,
    title: input.title,
    goal: input.goal,
    profileId: input.profileId,
    hydratedContract: input.hydratedContract,
  }) as XiaohongshuDeliverableRecord;
}

export function evaluateStorylineGate(input: { storylineText?: string }): XiaohongshuStorylineGateReport {
  return evaluateStorylineGateJs({
    storylineText: input.storylineText,
  }) as XiaohongshuStorylineGateReport;
}

export function buildXiaohongshuSurfaceBundle(
  request: XiaohongshuSurfaceBundleRequest,
): XiaohongshuSurfaceArtifact[] {
  return buildXiaohongshuSurfaceBundleJs(request) as XiaohongshuSurfaceArtifact[];
}

export function listXiaohongshuSurfaceArtifactPaths(): XiaohongshuSurfaceArtifactPath[] {
  return listXiaohongshuSurfaceArtifactPathsJs() as XiaohongshuSurfaceArtifactPath[];
}

export function validateXiaohongshuSurfaceArtifact(
  relativePath: XiaohongshuSurfaceArtifactPath,
  content: XiaohongshuSurfaceArtifactContent | null | undefined,
): boolean {
  return validateXiaohongshuSurfaceArtifactJs(relativePath, content) as boolean;
}

export const xiaohongshuOverlay: XiaohongshuOverlayDefinition = {
  overlayId: 'xiaohongshu',
  defaultProfileId: 'standard_note',
  profiles: {
    standard_note: {
      profile_id: 'standard_note',
    },
  },
  buildDeliverableRecord: buildXiaohongshuDeliverableRecord,
  buildSurfaceBundle: buildXiaohongshuSurfaceBundle,
  listSurfaceArtifactPaths: listXiaohongshuSurfaceArtifactPaths,
  validateSurfaceArtifact: validateXiaohongshuSurfaceArtifact,
  hydrateDeliverableContract: hydrateXiaohongshuContract,
  describeOverlay: describeXiaohongshuOverlay,
};

export type {
  XiaohongshuBaselinePolicy,
  XiaohongshuDeliverableKind,
  XiaohongshuDeliverableRecord,
  XiaohongshuDeliverableRecordInput,
  XiaohongshuDisplayRegistry,
  XiaohongshuHydrateContractRequest,
  XiaohongshuHydratedContract,
  XiaohongshuLayoutRules,
  XiaohongshuOverlayCatalogEntry,
  XiaohongshuOverlayDefinition,
  XiaohongshuProfileId,
  XiaohongshuPromptPack,
  XiaohongshuReviewCheck,
  XiaohongshuReviewSurface,
  XiaohongshuStageId,
  XiaohongshuStageSequence,
  XiaohongshuStorylineGateReport,
  XiaohongshuSurfaceArtifact,
  XiaohongshuSurfaceArtifactContent,
  XiaohongshuSurfaceArtifactPath,
  XiaohongshuSurfaceBundleRequest,
  XiaohongshuTopicRecord,
  XiaohongshuTopicRecordInput,
} from './types.js';
