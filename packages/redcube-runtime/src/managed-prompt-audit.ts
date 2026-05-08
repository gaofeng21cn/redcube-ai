// @ts-nocheck
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

import { CODEX_RUNTIME_SURFACE } from '@redcube/runtime-protocol';

import { buildSourceAuthoringContext, sourceAuthoringInputRefs } from './shared-source-truth.js';
import {
  safeArray,
  safeText,
  stageLabel,
  uniqueList,
} from './managed-run-shared.js';
import { stageArtifactPath } from './managed-run-contract.js';

function collectExistingArtifacts(deliverablePaths) {
  if (!existsSync(deliverablePaths.artifactsDir)) {
    return [];
  }
  return readdirSync(deliverablePaths.artifactsDir)
    .filter(Boolean)
    .map((entry) => path.join(deliverablePaths.artifactsDir, entry));
}

function buildEffectivePrompt({ contract, stageContract, userIntent, upstreamStageOutputs, existingArtifacts, sourceAuthoringContext }) {
  return [
    `用户意图: ${safeText(userIntent, safeText(contract.goal))}`,
    `交付目标: ${safeText(contract.title)} / ${safeText(contract.goal)}`,
    `交付合同: overlay=${safeText(contract.overlay)}, profile=${safeText(contract.profile_id)}, kind=${safeText(contract.deliverable_kind)}`,
    `当前阶段: ${stageLabel(stageContract.stage_id)}`,
    `AI资料输入: ${sourceAuthoringContext ? `source_materials_full_text=${sourceAuthoringContext.source_truth.material_count} materials, ${sourceAuthoringContext.source_truth.content_bytes} bytes; source_slide_plan_suggestions=${sourceAuthoringContext.source_slide_plan_suggestions?.total_slides || 'none'} suggestion_only` : 'none'}`,
    `上游阶段输出: ${upstreamStageOutputs.length > 0 ? upstreamStageOutputs.map((item) => `${stageLabel(item.stage_id)}=${item.exists ? 'ready' : 'missing'}`).join(', ') : 'none'}`,
    `已有产物: ${existingArtifacts.length > 0 ? existingArtifacts.map((file) => path.basename(file)).join(', ') : 'none'}`,
    `阶段策略: prompt_file=${safeText(stageContract.prompt_file)}, output_artifact=${safeText(stageContract.output_artifact)}, requires=${safeArray(stageContract.requires_stages).join(', ') || 'none'}`,
    '执行要求: 输出当前阶段正式 artifact，并给出能支持下一步决策的结构化结果。',
  ].join('\n');
}

export function buildPromptAudit({ managedRun, contract, contractFile, deliverablePaths, stageContract, attempt }) {
  const upstreamStageOutputs = safeArray(stageContract?.requires_stages).map((stageId) => {
    const ref = stageArtifactPath(contract, deliverablePaths, stageId);
    return {
      stage_id: stageId,
      ref,
      exists: existsSync(ref),
    };
  });
  const existingArtifacts = collectExistingArtifacts(deliverablePaths);
  const sourceAuthoringContext = buildSourceAuthoringContext({ contract, deliverablePaths });
  return {
    schema_version: 1,
    managed_run_id: managedRun.managed_run_id,
    stage_id: stageContract.stage_id,
    attempt,
    generated_at: new Date().toISOString(),
    model: CODEX_RUNTIME_SURFACE,
    tool_policy: 'managed_control_plane_audit_v1',
    input: {
      user_intent: {
        request: safeText(managedRun.user_intent?.request),
      },
      deliverable_contract: {
        overlay: safeText(contract.overlay),
        profile_id: safeText(contract.profile_id),
        deliverable_kind: safeText(contract.deliverable_kind),
        title: safeText(contract.title),
        goal: safeText(contract.goal),
      },
      ...(sourceAuthoringContext ? { source_authoring_context: sourceAuthoringContext } : {}),
      upstream_stage_outputs: upstreamStageOutputs,
      existing_artifacts: existingArtifacts,
      route_strategy: {
        stage_id: stageContract.stage_id,
        prompt_file: safeText(stageContract.prompt_file),
        output_artifact: safeText(stageContract.output_artifact),
        requires_stages: safeArray(stageContract.requires_stages),
      },
    },
    effective_prompt: buildEffectivePrompt({
      contract,
      stageContract,
      userIntent: managedRun.user_intent?.request,
      upstreamStageOutputs,
      existingArtifacts,
      sourceAuthoringContext,
    }),
    input_refs: uniqueList([
      deliverablePaths.deliverableFile,
      contractFile,
      ...sourceAuthoringInputRefs(contract),
      ...upstreamStageOutputs.filter((item) => item.exists).map((item) => item.ref),
      ...existingArtifacts,
    ]),
    output_refs: [],
  };
}
