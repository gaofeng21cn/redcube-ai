import {
  CODEX_DEFAULT_ADAPTER,
  buildCodexExecutorDescriptor,
} from '@redcube/runtime-protocol';
import { loadRuntimeFamilyRunner } from '../default-registries.js';
import type { RuntimeFamilyContract } from '../default-registries.js';

export {
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_CREATIVE_GENERATION_META_END,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateImageViaCodexNativeImagegen,
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
  probeCodexCli,
  readCodexCliContract,
} from './codex-caller.js';

interface ExecutorRouteInput {
  workspaceRoot: string;
  overlay: string;
  route: string;
  topicId: string;
  deliverableId: string;
  contract: RuntimeFamilyContract;
  stageContract: { stage_id?: string } | null;
  mode?: string;
  baselineDeliverableId?: string;
}

interface ExecutorAdapter extends Record<string, unknown> {
  adapter: 'codex_cli';
  executor_backend: 'codex_cli';
  execution_shape: 'structured_call';
  execution_model: Record<string, unknown>;
  runRoute(input: ExecutorRouteInput): Promise<Record<string, unknown>>;
}

export function resolveExecutorAdapter({
  adapter = CODEX_DEFAULT_ADAPTER,
}: {
  adapter?: string;
} = {}): ExecutorAdapter {
  const descriptor = buildCodexExecutorDescriptor({ adapter });

  return {
    ...descriptor,
    async runRoute({
      workspaceRoot,
      overlay,
      route,
      topicId,
      deliverableId,
      contract,
      stageContract,
      mode = 'draft_new',
      baselineDeliverableId = '',
    }) {
      if (!stageContract?.stage_id) {
        throw new Error(`Missing stage contract for route: ${route}`);
      }
      if (stageContract.stage_id !== route) {
        throw new Error(`Stage contract mismatch: expected ${route}, got ${stageContract.stage_id}`);
      }

      const familyRunner = await loadRuntimeFamilyRunner(contract);
      const artifact = await familyRunner.runRoute({
        workspaceRoot,
        route,
        topicId,
        deliverableId,
        contract,
        mode,
        baselineDeliverableId,
        adapter: descriptor.adapter,
        executor: descriptor,
      }) as Record<string, unknown>;
      return {
        overlay,
        route,
        topic_id: topicId,
        deliverable_id: deliverableId,
        contract,
        stage_contract: stageContract,
        ...artifact,
        executor_backend: descriptor.executor_backend,
        execution_shape: descriptor.execution_shape,
        execution_model: descriptor.execution_model,
      };
    },
  };
}
