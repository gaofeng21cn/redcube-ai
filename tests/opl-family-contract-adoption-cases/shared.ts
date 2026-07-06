// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../../packages/redcube-domain-entry/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '../..');
export const CONTRACT_PATH = 'contracts/runtime-program/opl-family-contract-adoption.json';
export const CURRENT_PROGRAM_PATH = 'contracts/runtime-program/current-program.json';
export const STAGE_CONTROL_PLANE_PATH = 'contracts/stage_control_plane.json';
export const STAGE_ARTIFACT_KERNEL_ADOPTION_PATH = 'contracts/stage_artifact_kernel_adoption.json';
export const DOMAIN_DESCRIPTOR_PATH = 'contracts/domain_descriptor.json';
export const USER_STAGE_LOG_REQUIRED_FIELDS = [
  'stage_name',
  'problem_summary',
  'stage_goal',
  'stage_work_done',
  'changed_stage_surfaces',
  'outcome',
  'remaining_blockers',
  'evidence_refs',
];

export function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function isRefProjection(value) {
  return Boolean(value && typeof value === 'object' && value.body_copy_in_adoption === false);
}

function hydrateAdoptionContract(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return {
    ...payload,
    privatized_functional_module_audit: isRefProjection(payload.privatized_functional_module_audit)
      ? JSON.parse(read('contracts/functional_privatization_audit.json'))
      : payload.privatized_functional_module_audit,
    functional_privatization_audit: isRefProjection(payload.functional_privatization_audit)
      ? JSON.parse(read('contracts/functional_privatization_audit.json'))
      : payload.functional_privatization_audit,
    physical_source_morphology_policy: isRefProjection(payload.physical_source_morphology_policy)
      ? JSON.parse(read('contracts/physical_source_morphology_policy.json'))
      : payload.physical_source_morphology_policy,
    standard_domain_agent_skeleton: isRefProjection(payload.standard_domain_agent_skeleton)
      ? buildStandardDomainAgentSkeleton({
        workspaceRoot: '<workspace_root>',
        runtime: {
          runtime_owner: 'codex_cli',
          runtime_state_root: '<runtime_state_root>',
          session_continuity_root: '<session_continuity_root>',
        },
        productEntrySessionCommand: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      })
      : payload.standard_domain_agent_skeleton,
    visual_pack_compiler_handoff: isRefProjection(payload.visual_pack_compiler_handoff)
      ? buildVisualPackCompilerHandoffProjection()
      : payload.visual_pack_compiler_handoff,
  };
}

export function contract() {
  return hydrateAdoptionContract(JSON.parse(read(CONTRACT_PATH)));
}

export function currentProgram() {
  return JSON.parse(read(CURRENT_PROGRAM_PATH));
}

export function stageControlPlane() {
  return JSON.parse(read(STAGE_CONTROL_PLANE_PATH));
}

export function stageArtifactKernelAdoption() {
  return JSON.parse(read(STAGE_ARTIFACT_KERNEL_ADOPTION_PATH));
}

export function domainDescriptor() {
  return JSON.parse(read(DOMAIN_DESCRIPTOR_PATH));
}

export { assert, fs, path, test };
