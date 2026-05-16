interface ManagedDagTask {
  task_id: string;
  task_kind: string;
  source_pack_id?: string;
  overlay?: string;
  topic_id?: string;
  deliverable_id?: string;
  stage_id?: string;
  depends_on: string[];
  parallel_group: string;
  quality_gate_policy: string;
}

interface ManagedDagLayer {
  layer_index: number;
  task_ids: string[];
  tasks: ManagedDagTask[];
}

interface ManagedDagPlan {
  scheduler_kind: 'managed_deliverable_dag';
  schema_version: 1;
  domain_scope: 'visual_deliverable_internal_dag_only';
  functional_harness_owner: false;
  generic_runtime_owner: false;
  generic_scheduler_owner: false;
  generic_daemon_owner: false;
  generic_lifecycle_owner: false;
  generic_queue_owner: false;
  stage_attempt_orchestrator_owner: false;
  generic_attempt_ledger_owner: false;
  typed_closeout_transport_owner: false;
  generic_runner_owner: false;
  generic_transition_runner_owner: false;
  generic_workbench_owner: false;
  memory_transport_owner: false;
  memory_refs_only_writeback_chain_owner: false;
  artifact_lifecycle_owner: false;
  review_repair_transport_owner: false;
  restart_dead_letter_repair_human_gate_state_chain_owner: false;
  native_helper_generic_envelope_owner: false;
  authority_boundary: {
    owner: 'redcube_ai';
    opl_family_scheduler_owner: 'opl';
    managed_dag_scheduler_scope: 'visual_deliverable_internal_dag_only';
    retained_authority: string[];
  };
  parallel_safe: true;
  tasks: ManagedDagTask[];
  layers: ManagedDagLayer[];
  max_parallel_width: number;
  optimization: Record<string, unknown>;
}

interface DeliverableDagInput {
  overlay?: unknown;
  topicId?: unknown;
  topic_id?: unknown;
  deliverableId?: unknown;
  deliverable_id?: unknown;
  stages?: unknown;
  stage_sequence?: {
    stages?: unknown;
  };
}

interface StageDagInput {
  stage_id?: unknown;
  requires_stages?: unknown;
}

interface ExecuteManagedDagLayersInput {
  plan?: {
    layers?: unknown;
  };
  executeTask?: (task: ManagedDagTask) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

interface ManagedDagLayerExecutionResult {
  layer_index: number;
  task_results: Array<{
    task_id: string;
    task_kind: string;
    ok: boolean;
    result: Record<string, unknown>;
  }>;
  ok: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function taskIdFor({
  overlay,
  deliverableId,
  stageId,
}: {
  overlay: string;
  deliverableId: string;
  stageId: string;
}): string {
  return `${overlay}:${deliverableId}:${stageId}`;
}

function buildSourceTask(sourcePackId: string): ManagedDagTask {
  return {
    task_id: `source_pack:${sourcePackId}`,
    task_kind: 'source_pack',
    source_pack_id: sourcePackId,
    depends_on: [],
    parallel_group: 'source_readiness',
    quality_gate_policy: 'preserve_source_readiness_gate',
  };
}

function buildStageTasks(deliverables: unknown, sourceTaskId: string): ManagedDagTask[] {
  const tasks: ManagedDagTask[] = [];
  for (const deliverable of safeArray(deliverables)) {
    const deliverableRecord = asRecord(deliverable) as DeliverableDagInput;
    const stageSequence = asRecord(deliverableRecord.stage_sequence);
    const overlay = safeText(deliverableRecord.overlay);
    const topicId = safeText(deliverableRecord.topicId || deliverableRecord.topic_id);
    const deliverableId = safeText(deliverableRecord.deliverableId || deliverableRecord.deliverable_id);
    const stages = safeArray(deliverableRecord.stages || stageSequence.stages);
    const declaredStageIds = new Set(stages.map((stage) => safeText(asRecord(stage).stage_id)).filter(Boolean));
    for (let index = 0; index < stages.length; index += 1) {
      const stage = asRecord(stages[index]) as StageDagInput;
      const stageId = safeText(stage.stage_id);
      if (!stageId) continue;
      const declaredDependencies = safeArray(stage.requires_stages)
        .map((dependency) => safeText(dependency))
        .filter(Boolean);
      const implicitDependency = index > 0 && declaredDependencies.length === 0
        ? [safeText(asRecord(stages[index - 1]).stage_id)]
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

function buildLayers(tasks: ManagedDagTask[]): ManagedDagLayer[] {
  const remaining = new Map(tasks.map((task) => [task.task_id, task]));
  const completed = new Set<string>();
  const layers: ManagedDagLayer[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining.values()]
      .filter((task) => safeArray(task.depends_on).every((dependency) => completed.has(safeText(dependency))))
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
}: {
  sourcePackId?: unknown;
  deliverables?: unknown;
} = {}): ManagedDagPlan {
  const sourceTask = safeText(sourcePackId) ? buildSourceTask(safeText(sourcePackId)) : null;
  const tasks = [
    ...(sourceTask ? [sourceTask] : []),
    ...buildStageTasks(deliverables, sourceTask?.task_id || ''),
  ];
  const layers = buildLayers(tasks);
  const maxParallelWidth = Math.max(0, ...layers.map((layer) => layer.task_ids.length));
  const overlays = new Set(safeArray(deliverables).map((deliverable) => safeText(asRecord(deliverable).overlay)).filter(Boolean));
  return {
    scheduler_kind: 'managed_deliverable_dag',
    schema_version: 1,
    domain_scope: 'visual_deliverable_internal_dag_only',
    functional_harness_owner: false,
    generic_runtime_owner: false,
    generic_scheduler_owner: false,
    generic_daemon_owner: false,
    generic_lifecycle_owner: false,
    generic_queue_owner: false,
    stage_attempt_orchestrator_owner: false,
    generic_attempt_ledger_owner: false,
    typed_closeout_transport_owner: false,
    generic_runner_owner: false,
    generic_transition_runner_owner: false,
    generic_workbench_owner: false,
    memory_transport_owner: false,
    memory_refs_only_writeback_chain_owner: false,
    artifact_lifecycle_owner: false,
    review_repair_transport_owner: false,
    restart_dead_letter_repair_human_gate_state_chain_owner: false,
    native_helper_generic_envelope_owner: false,
    authority_boundary: {
      owner: 'redcube_ai',
      opl_family_scheduler_owner: 'opl',
      managed_dag_scheduler_scope: 'visual_deliverable_internal_dag_only',
      retained_authority: [
        'visual_truth',
        'review_export_verdict',
        'artifact_authority',
        'visual_memory_body',
        'owner_receipt',
        'native_helper_implementation',
        'typed_blocker',
        'safe_action_refs',
      ],
    },
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
}: ExecuteManagedDagLayersInput = {}): Promise<Record<string, unknown>> {
  if (typeof executeTask !== 'function') {
    throw new Error('executeManagedDagLayers requires executeTask');
  }
  const layerResults: ManagedDagLayerExecutionResult[] = [];
  for (const layer of safeArray(plan?.layers)) {
    const layerRecord = asRecord(layer) as unknown as ManagedDagLayer;
    const taskResults = await Promise.all(safeArray(layerRecord.tasks).map(async (task) => {
      const dagTask = task as ManagedDagTask;
      const result = await executeTask(dagTask);
      return {
        task_id: dagTask.task_id,
        task_kind: dagTask.task_kind,
        ok: result?.ok !== false,
        result,
      };
    }));
    const layerResult = {
      layer_index: layerRecord.layer_index,
      task_results: taskResults,
      ok: taskResults.every((result) => result.ok),
    };
    layerResults.push(layerResult);
    if (!layerResult.ok) {
      return {
        execution_kind: 'managed_dag_layer_execution',
        ok: false,
        layer_results: layerResults,
        failed_layer_index: layerRecord.layer_index,
      };
    }
    if (taskResults.some((taskResult) => taskResult.result?.done === true)) {
      return {
        execution_kind: 'managed_dag_layer_execution',
        ok: true,
        layer_results: layerResults,
        failed_layer_index: null,
        stopped_layer_index: layerRecord.layer_index,
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
