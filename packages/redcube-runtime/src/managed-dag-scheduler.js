function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function taskIdFor({ overlay, deliverableId, stageId }) {
  return `${overlay}:${deliverableId}:${stageId}`;
}

function buildSourceTask(sourcePackId) {
  return {
    task_id: `source_pack:${sourcePackId}`,
    task_kind: 'source_pack',
    source_pack_id: sourcePackId,
    depends_on: [],
    parallel_group: 'source_readiness',
    quality_gate_policy: 'preserve_source_readiness_gate',
  };
}

function buildStageTasks(deliverables, sourceTaskId) {
  const tasks = [];
  for (const deliverable of safeArray(deliverables)) {
    const overlay = safeText(deliverable?.overlay);
    const topicId = safeText(deliverable?.topicId || deliverable?.topic_id);
    const deliverableId = safeText(deliverable?.deliverableId || deliverable?.deliverable_id);
    const stages = safeArray(deliverable?.stages || deliverable?.stage_sequence?.stages);
    const declaredStageIds = new Set(stages.map((stage) => safeText(stage?.stage_id)).filter(Boolean));
    for (let index = 0; index < stages.length; index += 1) {
      const stage = stages[index];
      const stageId = safeText(stage?.stage_id);
      if (!stageId) continue;
      const declaredDependencies = safeArray(stage?.requires_stages)
        .map((dependency) => safeText(dependency))
        .filter(Boolean);
      const implicitDependency = index > 0 && declaredDependencies.length === 0
        ? [safeText(stages[index - 1]?.stage_id)]
        : [];
      const stageDependencies = [...declaredDependencies, ...implicitDependency];
      for (const dependency of stageDependencies) {
        if (!declaredStageIds.has(dependency)) {
          throw new Error(`Missing DAG dependency for ${overlay}:${deliverableId}:${stageId}: ${dependency}`);
        }
      }
      tasks.push({
        task_id: taskIdFor({ overlay, deliverableId, stageId }),
        task_kind: 'deliverable_route',
        overlay,
        topic_id: topicId,
        deliverable_id: deliverableId,
        stage_id: stageId,
        depends_on: [
          ...(sourceTaskId && index === 0 ? [sourceTaskId] : []),
          ...stageDependencies.map((dependency) => taskIdFor({ overlay, deliverableId, stageId: dependency })),
        ],
        parallel_group: `${overlay}:${stageId}`,
        quality_gate_policy: 'preserve_stage_dependencies_and_review_hard_stops',
      });
    }
  }
  return tasks;
}

function buildLayers(tasks) {
  const remaining = new Map(tasks.map((task) => [task.task_id, task]));
  const completed = new Set();
  const layers = [];
  while (remaining.size > 0) {
    const ready = [...remaining.values()]
      .filter((task) => safeArray(task.depends_on).every((dependency) => completed.has(dependency)))
      .sort((left, right) => left.task_id.localeCompare(right.task_id));
    if (ready.length === 0) {
      throw new Error('Managed DAG contains a dependency cycle or an unsatisfied dependency');
    }
    layers.push({
      layer_index: layers.length,
      task_ids: ready.map((task) => task.task_id),
      tasks: ready,
    });
    for (const task of ready) {
      remaining.delete(task.task_id);
      completed.add(task.task_id);
    }
  }
  return layers;
}

export function planManagedDeliverableDag({
  sourcePackId = '',
  deliverables = [],
} = {}) {
  const sourceTask = safeText(sourcePackId) ? buildSourceTask(safeText(sourcePackId)) : null;
  const tasks = [
    ...(sourceTask ? [sourceTask] : []),
    ...buildStageTasks(deliverables, sourceTask?.task_id || ''),
  ];
  const layers = buildLayers(tasks);
  const maxParallelWidth = Math.max(0, ...layers.map((layer) => layer.task_ids.length));
  const overlays = new Set(safeArray(deliverables).map((deliverable) => safeText(deliverable?.overlay)).filter(Boolean));
  return {
    scheduler_kind: 'managed_deliverable_dag',
    schema_version: 1,
    parallel_safe: true,
    tasks,
    layers,
    max_parallel_width: maxParallelWidth,
    optimization: {
      source_pack_reuse: Boolean(sourceTask),
      cross_family_parallelism: overlays.size > 1 && maxParallelWidth > 1,
      quality_gate_policy: 'preserve_stage_dependencies_and_review_hard_stops',
    },
  };
}

export async function executeManagedDagLayers({
  plan,
  executeTask,
} = {}) {
  if (typeof executeTask !== 'function') {
    throw new Error('executeManagedDagLayers requires executeTask');
  }
  const layerResults = [];
  for (const layer of safeArray(plan?.layers)) {
    const taskResults = await Promise.all(safeArray(layer.tasks).map(async (task) => {
      const result = await executeTask(task);
      return {
        task_id: task.task_id,
        task_kind: task.task_kind,
        ok: result?.ok !== false,
        result,
      };
    }));
    layerResults.push({
      layer_index: layer.layer_index,
      task_results: taskResults,
      ok: taskResults.every((result) => result.ok),
    });
    if (!layerResults.at(-1).ok) {
      return {
        execution_kind: 'managed_dag_layer_execution',
        ok: false,
        layer_results: layerResults,
        failed_layer_index: layer.layer_index,
      };
    }
    if (taskResults.some((taskResult) => taskResult.result?.done === true)) {
      return {
        execution_kind: 'managed_dag_layer_execution',
        ok: true,
        layer_results: layerResults,
        failed_layer_index: null,
        stopped_layer_index: layer.layer_index,
      };
    }
  }
  return {
    execution_kind: 'managed_dag_layer_execution',
    ok: true,
    layer_results: layerResults,
    failed_layer_index: null,
    stopped_layer_index: null,
  };
}
