// @ts-nocheck
import { writeFileSync } from 'node:fs';

import { getSourceArtifactPaths } from '@redcube/runtime-protocol';

import { createDeliverable } from './create-deliverable.js';
import { buildOplStageExecutionPlan } from './opl-stage-execution-plan.js';
import { researchSource } from './source-research.js';
import { readJson, safeText } from './action-utils.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
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

function sourcePackBarrierId({ topicId, fanout }) {
  return `${topicId}/source-pack/${safeText(fanout?.source_pack?.readiness?.sufficiency_status, 'unknown')}`;
}

function planDeliverablesFromCreated(createdDeliverables) {
  return createdDeliverables.map((created) => ({
    overlay: created.deliverable.overlay,
    topicId: created.deliverable.topic_id,
    deliverableId: created.deliverable.deliverable_id,
    stages: created.hydratedContract?.stage_sequence?.stages || [],
  }));
}

function consumerFamiliesFromDeliverables(deliverables) {
  return deliverables.map((deliverable) => ({
    family_id: deliverable.overlay,
    deliverables: [
      {
        deliverable_id: deliverable.deliverableId,
        profile_id: deliverable.profileId,
        title: deliverable.title,
        goal: deliverable.goal,
      },
    ],
  }));
}

function hydrateSourcePackFanout({ sourcePackFanout, deliverables }) {
  const consumerFamilies = consumerFamiliesFromDeliverables(deliverables);
  return {
    ...sourcePackFanout,
    consumer_families: consumerFamilies,
    parallel_family_ready: consumerFamilies.length >= 2,
  };
}

function buildOplStagePlanDag({ sourcePackId, stageExecutionPlans }) {
  return {
    dag_kind: 'opl_stage_execution_plan_dag',
    scheduler_owner: 'one-person-lab',
    domain_role: 'visual_route_stage_refs_only',
    layers: [
      {
        layer_id: 'shared_source_pack_barrier',
        task_ids: [`source_pack:${sourcePackId}`],
        owner: 'redcube_ai',
      },
      {
        layer_id: 'opl_family_stage_plan_submission',
        task_ids: stageExecutionPlans.map((plan) => plan.plan_ref),
        owner: 'one-person-lab',
      },
    ],
    max_parallel_width: stageExecutionPlans.length,
    repo_local_stage_runtime_active_caller: false,
  };
}

function buildFanoutPlanner({ topicId, sourcePackFanout, createdDeliverables, stageExecutionPlans }) {
  const sourcePackId = sourcePackBarrierId({ topicId, fanout: sourcePackFanout });
  const stagePlanDag = buildOplStagePlanDag({ sourcePackId, stageExecutionPlans });
  return {
    planner_kind: 'source_first_opl_stage_plan_fanout',
    schema_version: 2,
    topic_id: topicId,
    barrier: {
      task_kind: 'shared_source_pack_barrier',
      source_pack_id: sourcePackId,
      authoritative_surface: sourcePackFanout?.authoritative_surface || 'shared_source_truth',
      readiness: sourcePackFanout?.source_pack?.readiness || null,
      planned_reuse: true,
      actual_reuse: null,
      reuse_truth_source: 'source_pack_manifest.reuse',
    },
    family_execution: {
      parallel_after_barrier: sourcePackFanout.parallel_family_ready === true,
      quality_gate_policy: 'preserve_each_family_review_and_export_gates',
      stage_attempt_runtime_owner: 'configured_family_runtime_provider',
      stage_scheduler_owner: 'one-person-lab',
      rca_execution_role: 'visual_domain_authority_functions_and_route_handler_refs',
      gate_isolation: createdDeliverables.map((created) => ({
        overlay: created.deliverable.overlay,
        deliverable_id: created.deliverable.deliverable_id,
        review_surface: created.hydratedContract?.review_surface || null,
        export_bundle: created.hydratedContract?.export_bundle || null,
      })),
    },
    opl_stage_execution_plan_dag: stagePlanDag,
    route_stage_refs: planDeliverablesFromCreated(createdDeliverables),
    stage_execution_plan_refs: stageExecutionPlans.map((plan) => ({
      plan_ref: plan.plan_ref,
      overlay: plan.delivery_identity?.deliverable_family || null,
      deliverable_id: plan.delivery_identity?.deliverable_id || null,
      planned_stage_count: plan.summary?.planned_stage_count || 0,
      terminal_stage: plan.summary?.terminal_stage || null,
      recommended_action: plan.recommended_action || null,
    })),
    repo_local_stage_runtime: {
      active_caller: false,
      role: 'explicit_diagnostic_or_historical_regression_only',
    },
  };
}

async function buildFamilyStageExecutionPlan({ workspaceRoot, topicId, deliverable }) {
  return buildOplStageExecutionPlan({
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
        stage_execution_plan_count: 0,
        stage_runtime_projection_count: 0,
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
  const sourcePackFanout = hydrateSourcePackFanout({
    sourcePackFanout: readJson(sourcePaths.sourcePackFanoutFile),
    deliverables: normalizedDeliverables,
  });
  writeJson(sourcePaths.sourcePackFanoutFile, sourcePackFanout);
  const sourcePackManifest = readJson(sourcePaths.sourcePackManifestFile);
  const stageExecutionPlans = await Promise.all(
    normalizedDeliverables.map((deliverable) => buildFamilyStageExecutionPlan({
      workspaceRoot,
      topicId,
      deliverable,
    })),
  );
  const planner = buildFanoutPlanner({
    topicId,
    sourcePackFanout,
    createdDeliverables,
    stageExecutionPlans,
  });
  planner.barrier.actual_reuse = sourcePackManifest?.reuse || null;

  return {
    ok: stageExecutionPlans.every((result) => result.ok === true),
    surface_kind: 'source_first_fanout',
    recommended_action: stageExecutionPlans.every((result) => result.ok === true)
      ? 'submit_fanout_to_opl_stage_attempt_runtime'
      : 'inspect_opl_stage_plan_failures',
    source_barrier: sourceBarrier,
    source_pack_fanout: sourcePackFanout,
    source_pack_manifest: sourcePackManifest,
    planner,
    created_deliverables: createdDeliverables,
    stage_execution_plans: stageExecutionPlans,
    stage_runtime_projections: [],
    summary: {
      topic_id: topicId,
      source_barrier_status: 'planning_ready',
      deliverable_count: normalizedDeliverables.length,
      stage_execution_plan_count: stageExecutionPlans.length,
      stage_runtime_projection_count: 0,
      parallel_family_ready: sourcePackFanout.parallel_family_ready === true,
      max_parallel_width: planner.opl_stage_execution_plan_dag.max_parallel_width,
    },
  };
}
