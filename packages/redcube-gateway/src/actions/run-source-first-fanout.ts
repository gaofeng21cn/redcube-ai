// @ts-nocheck
import { readFileSync } from 'node:fs';

import { getSourceArtifactPaths } from '@redcube/runtime-protocol';
import { planManagedDeliverableDag } from '@redcube/runtime';

import { createDeliverable } from './create-deliverable.js';
import { runManagedDeliverable } from './run-managed-deliverable.js';
import { researchSource } from './source-research.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function normalizeDeliverableSpec(spec, index) {
  const overlay = safeText(spec?.overlay || spec?.deliverable_family);
  const deliverableId = safeText(spec?.deliverableId || spec?.deliverable_id);
  const profileId = safeText(spec?.profileId || spec?.profile_id);
  if (!overlay) {
    throw new Error(`fanout deliverable[${index}] overlay is required`);
  }
  if (!deliverableId) {
    throw new Error(`fanout deliverable[${index}] deliverable_id is required`);
  }
  if (!profileId) {
    throw new Error(`fanout deliverable[${index}] profile_id is required`);
  }
  return {
    overlay,
    deliverableId,
    profileId,
    title: safeText(spec?.title, deliverableId),
    goal: safeText(spec?.goal),
    userIntent: safeText(spec?.userIntent || spec?.user_intent || spec?.goal),
    adapter: safeText(spec?.adapter),
    stopAfterStage: safeText(spec?.stopAfterStage || spec?.stop_after_stage),
    mode: safeText(spec?.mode),
    baselineDeliverableId: safeText(spec?.baselineDeliverableId || spec?.baseline_deliverable_id),
  };
}

function assertUniqueDeliverables(deliverables) {
  const seen = new Set();
  for (const deliverable of deliverables) {
    const key = `${deliverable.overlay}:${deliverable.deliverableId}`;
    if (seen.has(key)) {
      throw new Error(`duplicate fanout deliverable: ${key}`);
    }
    seen.add(key);
  }
}

function sourcePackBarrierId({ topicId, federation }) {
  return `${topicId}/source-pack/${safeText(federation?.source_pack?.readiness?.sufficiency_status, 'unknown')}`;
}

function planDeliverablesFromCreated(createdDeliverables) {
  return createdDeliverables.map((created) => ({
    overlay: created.deliverable.overlay,
    topicId: created.deliverable.topic_id,
    deliverableId: created.deliverable.deliverable_id,
    stages: created.hydratedContract?.stage_sequence?.stages || [],
  }));
}

function buildFanoutPlanner({ topicId, sourcePackFederation, createdDeliverables }) {
  const sourcePackId = sourcePackBarrierId({ topicId, federation: sourcePackFederation });
  const managedDag = planManagedDeliverableDag({
    sourcePackId,
    deliverables: planDeliverablesFromCreated(createdDeliverables),
  });
  return {
    planner_kind: 'source_first_cross_family_fanout',
    schema_version: 1,
    topic_id: topicId,
    barrier: {
      task_kind: 'shared_source_pack_barrier',
      source_pack_id: sourcePackId,
      authoritative_surface: sourcePackFederation?.authoritative_surface || 'shared_source_truth',
      readiness: sourcePackFederation?.source_pack?.readiness || null,
      planned_reuse: true,
      actual_reuse: null,
      reuse_truth_source: 'source_pack_manifest.reuse',
    },
    family_execution: {
      parallel_after_barrier: managedDag.optimization.cross_family_parallelism === true,
      quality_gate_policy: 'preserve_each_family_review_and_export_gates',
      gate_isolation: createdDeliverables.map((created) => ({
        overlay: created.deliverable.overlay,
        deliverable_id: created.deliverable.deliverable_id,
        review_surface: created.hydratedContract?.review_surface || null,
        export_bundle: created.hydratedContract?.export_bundle || null,
      })),
    },
    managed_dag: managedDag,
  };
}

async function runManagedFamilyDeliverable({ workspaceRoot, topicId, deliverable }) {
  return runManagedDeliverable({
    workspaceRoot,
    overlay: deliverable.overlay,
    topicId,
    deliverableId: deliverable.deliverableId,
    ...(deliverable.adapter ? { adapter: deliverable.adapter } : {}),
    ...(deliverable.userIntent ? { userIntent: deliverable.userIntent } : {}),
    ...(deliverable.stopAfterStage ? { stopAfterStage: deliverable.stopAfterStage } : {}),
    ...(deliverable.mode ? { mode: deliverable.mode } : {}),
    ...(deliverable.baselineDeliverableId ? { baselineDeliverableId: deliverable.baselineDeliverableId } : {}),
  });
}

export async function runSourceFirstFanout({
  workspaceRoot,
  topicId,
  title = '',
  brief = '',
  keywords = [],
  sourceFiles = [],
  operatorFiles = [],
  deliverables = [],
}) {
  const normalizedDeliverables = safeArray(deliverables).map((deliverable, index) => normalizeDeliverableSpec(deliverable, index));
  if (normalizedDeliverables.length < 2) {
    throw new Error('source-first fanout requires at least two deliverables');
  }
  assertUniqueDeliverables(normalizedDeliverables);

  const sourceBarrier = await researchSource({
    workspaceRoot,
    topicId,
    title,
    brief,
    keywords,
    sourceFiles,
    operatorFiles,
  });
  if (sourceBarrier.planningReady !== true) {
    return {
      ok: false,
      surface_kind: 'source_first_fanout',
      recommended_action: sourceBarrier.recommended_action || 'complete_source_readiness',
      source_barrier: sourceBarrier,
      summary: {
        topic_id: topicId,
        source_barrier_status: 'blocked',
        deliverable_count: normalizedDeliverables.length,
        managed_run_count: 0,
      },
    };
  }

  const createdDeliverables = [];
  for (const deliverable of normalizedDeliverables) {
    createdDeliverables.push(await createDeliverable({
      workspaceRoot,
      overlay: deliverable.overlay,
      profileId: deliverable.profileId,
      topicId,
      deliverableId: deliverable.deliverableId,
      title: deliverable.title,
      goal: deliverable.goal,
    }));
  }

  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const sourcePackFederation = readJson(sourcePaths.sourcePackFederationFile);
  const sourcePackManifest = readJson(sourcePaths.sourcePackManifestFile);
  const planner = buildFanoutPlanner({
    topicId,
    sourcePackFederation,
    createdDeliverables,
  });
  planner.barrier.actual_reuse = sourcePackManifest?.reuse || null;

  const managedRuns = await Promise.all(
    normalizedDeliverables.map((deliverable) => runManagedFamilyDeliverable({
      workspaceRoot,
      topicId,
      deliverable,
    })),
  );

  return {
    ok: managedRuns.every((result) => result.ok === true),
    surface_kind: 'source_first_fanout',
    recommended_action: managedRuns.every((result) => result.ok === true)
      ? 'review_family_outputs'
      : 'inspect_family_gate_failures',
    source_barrier: sourceBarrier,
    source_pack_federation: sourcePackFederation,
    source_pack_manifest: sourcePackManifest,
    planner,
    created_deliverables: createdDeliverables,
    managed_runs: managedRuns,
    summary: {
      topic_id: topicId,
      source_barrier_status: 'planning_ready',
      deliverable_count: normalizedDeliverables.length,
      managed_run_count: managedRuns.length,
      parallel_family_ready: sourcePackFederation.parallel_family_ready === true,
      max_parallel_width: planner.managed_dag.max_parallel_width,
    },
  };
}
