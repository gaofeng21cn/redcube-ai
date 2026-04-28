// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';

import { assertGovernanceParity, validatePublicationProjection } from './governance-surface.js';
import {
  buildQualitySummary,
  defaultState,
  loadContractAndPaths,
  loadSourceReadinessSummary,
  reviewHistoryFile,
  reviewStateFile,
  safeReadJson,
} from './review-state-shared.js';
import {
  rebuildTopicPublicationProjection,
  toPublicationProjectionEntry,
} from './review-state-projection.js';

export function getReviewState(request) {
  const { workspaceRoot, topicId, deliverableId } = request;
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  const file = reviewStateFile(deliverablePaths);
  const state = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8'))
    : defaultState({ contract, topicId, deliverableId });
  const sourceReadinessSummary = loadSourceReadinessSummary({ workspaceRoot, topicId });
  const publicationProjectionEntry = toPublicationProjectionEntry({
    reviewState: state,
    deliverableId,
    contract,
    deliverablePaths,
    sourceReadinessSummary,
  });
  const projectionFile = rebuildTopicPublicationProjection({ workspaceRoot, topicId });
  const publication = safeReadJson(projectionFile);
  if (!publication) {
    throw new Error('getReviewState governance summary invalid publication projection file');
  }
  validatePublicationProjection(publication);
  const storedEntry = publication?.deliverables?.[deliverableId] || null;
  if (!storedEntry) {
    throw new Error(`getReviewState governance parity missing publication projection entry for ${deliverableId}`);
  }
  assertGovernanceParity(
    `getReviewState.${deliverableId}`,
    publicationProjectionEntry,
    storedEntry,
  );
  return {
    ok: true,
    surface_kind: 'review_state',
    state_type: 'canonical',
    canonical_source: {
      kind: 'review_state.publish_state',
    },
    state,
    quality_summary: buildQualitySummary(state),
    state_file: file,
    history_file: reviewHistoryFile(deliverablePaths),
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: publicationProjectionEntry.gate_summary,
    operator_handoff: publicationProjectionEntry.operator_handoff,
    lifecycle_stage_summary: publicationProjectionEntry.lifecycle_stage_summary,
    governance_surface: publicationProjectionEntry.governance_surface,
  };
}

export function getPublicationProjection({ workspaceRoot, topicId }) {
  const projectionFile = rebuildTopicPublicationProjection({ workspaceRoot, topicId });
  const publication = safeReadJson(projectionFile);
  if (!publication) {
    throw new Error('getPublicationProjection governance summary invalid publication projection file');
  }
  validatePublicationProjection(publication);
  return {
    ok: true,
    surface_kind: 'publication_projection',
    topic_id: topicId,
    state_type: 'projection',
    projection_file: projectionFile,
    publication,
    canonical_source: {
      kind: 'review_state.delivery_projection',
    },
  };
}
