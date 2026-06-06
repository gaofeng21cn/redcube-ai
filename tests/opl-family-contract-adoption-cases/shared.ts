// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export function contract() {
  return JSON.parse(read(CONTRACT_PATH));
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
